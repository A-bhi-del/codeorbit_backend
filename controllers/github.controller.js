import User from "../models/User.js";
import { fetchGithubProfile, exchangeGithubCode, getAuthenticatedGithubUser } from "../services/github.service.js";

// OAuth callback - Exchange code for token and connect GitHub
export const githubOAuthCallback = async (req, res) => {
  try {
    console.log("🔗 GitHub OAuth callback received");
    const userId = req.user;
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ 
        message: "Authorization code is required" 
      });
    }

    console.log("🔄 Exchanging OAuth code for access token");
    const accessToken = await exchangeGithubCode(code);

    console.log("👤 Fetching authenticated user data");
    const githubUser = await getAuthenticatedGithubUser(accessToken);

    console.log(`📡 Fetching full GitHub profile for: ${githubUser.login}`);
    const githubData = await fetchGithubProfile(githubUser.login, accessToken);

    console.log(`🔍 Looking for user with ID: ${userId}`);
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Save GitHub data with access token
    user.github = {
      ...githubData,
      accessToken, // Store user's token
      connectedAt: new Date()
    };

    // Initialize activity array if not exists
    if (!user.activity) {
      user.activity = [];
    }

    // Process contribution graph
    if (githubData.contributionGraph && Array.isArray(githubData.contributionGraph)) {
      console.log(`Processing ${githubData.contributionGraph.length} weeks of GitHub data`);
      
      let addedDays = 0;
      githubData.contributionGraph.forEach(week => {
        if (week.contributionDays && Array.isArray(week.contributionDays)) {
          week.contributionDays.forEach(day => {
            const existingActivity = user.activity.find(a => a.date === day.date);
            if (existingActivity) {
              existingActivity.count += day.contributionCount;
            } else {
              user.activity.push({
                date: day.date,
                count: day.contributionCount
              });
              addedDays++;
            }
          });
        }
      });
      
      console.log(`Added ${addedDays} days to activity`);
    }

    await user.save();
    console.log("✅ GitHub OAuth connection successful");

    res.json({
      message: "GitHub connected successfully via OAuth",
      github: {
        ...githubData,
        accessToken: undefined // Don't send token to frontend
      },
      activityDaysAdded: user.activity.length
    });

  } catch (error) {
    console.error("❌ GitHub OAuth error:", error.message);
    res.status(400).json({
      message: "Failed to connect GitHub via OAuth",
      error: error.message
    });
  }
};


// Connect GitHub by username (public data, read with the server's token; no OAuth, nothing secret stored)
const GITHUB_USERNAME = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

export const connectGithub = async (req, res) => {
  try {
    const userId = req.user;
    const username = String(req.body?.username || "").trim().replace(/^@/, "");

    if (!GITHUB_USERNAME.test(username)) {
      return res.status(400).json({
        message: "Enter a valid GitHub username (letters, numbers and single hyphens, up to 39 characters)."
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.github?.username) {
      return res.status(400).json({
        message: `GitHub is already connected as @${user.github.username}. Disconnect it first to use a different account.`
      });
    }

    const githubData = await fetchGithubProfile(username);

    user.github = { ...githubData, connectedAt: new Date() };

    if (!user.activity) user.activity = [];
    if (Array.isArray(githubData.contributionGraph)) {
      githubData.contributionGraph.forEach(week => {
        (week.contributionDays || []).forEach(day => {
          if (!day.contributionCount) return;
          const existing = user.activity.find(a => a.date === day.date);
          if (existing) existing.count += day.contributionCount;
          else user.activity.push({ date: day.date, count: day.contributionCount });
        });
      });
    }

    await user.save();

    res.json({
      message: "GitHub connected successfully",
      github: { ...githubData, contributionGraph: undefined, accessToken: undefined }
    });
  } catch (error) {
    console.error("GitHub connect error:", error.message);
    res.status(400).json({ message: error.message || "Failed to connect GitHub" });
  }
};

// Disconnect GitHub
export const disconnectGithub = async (req, res) => {
  try {
    console.log("🔌 GitHub disconnect request received");
    const userId = req.user;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove what GitHub contributed to the merged activity series (other platforms' counts stay)
    (user.github?.contributionGraph || []).forEach(week => {
      (week.contributionDays || []).forEach(day => {
        const entry = user.activity?.find(a => a.date === day.date);
        if (entry) entry.count = Math.max(0, entry.count - (day.contributionCount || 0));
      });
    });
    if (user.activity) user.activity = user.activity.filter(a => a.count > 0);

    // Clear GitHub data
    user.github = undefined;
    await user.save();

    console.log("✅ GitHub disconnected successfully");
    res.json({ message: "GitHub disconnected successfully" });

  } catch (error) {
    console.error("❌ GitHub disconnect error:", error.message);
    res.status(500).json({ 
      message: "Failed to disconnect GitHub",
      error: error.message 
    });
  }
};

// Refresh GitHub data using stored token
export const refreshGithubData = async (req, res) => {
  try {
    console.log("🔄 GitHub refresh request received");
    const userId = req.user;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.github?.username) {
      return res.status(400).json({ 
        message: "GitHub not connected. Please connect your GitHub account first." 
      });
    }

    const accessToken = user.github.accessToken || null;
    console.log(`📡 Refreshing GitHub data for: ${user.github.username}`);

    // Remember what GitHub contributed per day last time, so we can swap exactly that out
    // (the merged activity series also holds other platforms' counts, which must be left alone).
    const previousByDate = new Map();
    (user.github.contributionGraph || []).forEach(week => {
      (week.contributionDays || []).forEach(d => previousByDate.set(d.date, d.contributionCount || 0));
    });

    const githubData = await fetchGithubProfile(user.github.username, accessToken);

    // Update GitHub data while preserving token and connection date
    user.github = {
      ...githubData,
      accessToken: user.github.accessToken,
      connectedAt: user.github.connectedAt
    };

    if (!user.activity) {
      user.activity = [];
    }

    if (Array.isArray(githubData.contributionGraph)) {
      githubData.contributionGraph.forEach(week => {
        (week.contributionDays || []).forEach(day => {
          const previous = previousByDate.get(day.date) || 0;
          const existing = user.activity.find(a => a.date === day.date);
          if (existing) {
            existing.count = Math.max(0, existing.count - previous + day.contributionCount);
          } else if (day.contributionCount > 0) {
            user.activity.push({ date: day.date, count: day.contributionCount });
          }
        });
      });
    }

    await user.save();
    console.log("✅ GitHub data refreshed successfully");

    res.json({
      message: "GitHub data refreshed successfully",
      github: {
        ...githubData,
        accessToken: undefined
      }
    });

  } catch (error) {
    console.error("❌ GitHub refresh error:", error.message);
    res.status(400).json({
      message: "Failed to refresh GitHub data",
      error: error.message
    });
  }
};


// Get GitHub connection status
export const getGithubStatus = async (req, res) => {
  try {
    const userId = req.user;
    const user = await User.findById(userId).select('github');

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isConnected = !!(user.github && user.github.username);
    const g = user.github;

    // Flatten the stored weekly calendar into a simple [{ date, count }] list for the UI
    const days = [];
    (g?.contributionGraph || []).forEach(week => {
      (week.contributionDays || []).forEach(d => days.push({ date: d.date, count: d.contributionCount }));
    });

    res.json({
      connected: isConnected,
      github: isConnected ? {
        username: g.username,
        avatar: g.avatar,
        followers: g.followers,
        following: g.following,
        publicRepos: g.publicRepos,
        totalStars: g.totalStars,
        totalForks: g.totalForks,
        totalContributions: g.totalContributions,
        connectedAt: g.connectedAt,
        name: g.name,
        bio: g.bio,
        company: g.company,
        location: g.location,
        blog: g.blog,
        twitter: g.twitter,
        profileUrl: g.profileUrl,
        githubCreatedAt: g.githubCreatedAt,
        hireable: g.hireable,
        publicGists: g.publicGists,
        pullRequestsTotal: g.pullRequestsTotal,
        issuesTotal: g.issuesTotal,
        contributions: g.contributions,
        languages: g.languages,
        pinned: g.pinned,
        topRepos: g.topRepos,
        organizations: g.organizations,
        lastFetched: g.lastFetched,
        // true when this connection predates the richer data; the UI offers a refresh
        needsRefresh: !g.lastFetched,
        days
        // Don't send accessToken
      } : null
    });
  } catch (error) {
    console.error("Get GitHub status error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
