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


// Disconnect GitHub
export const disconnectGithub = async (req, res) => {
  try {
    console.log("🔌 GitHub disconnect request received");
    const userId = req.user;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

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
    
    const githubData = await fetchGithubProfile(user.github.username, accessToken);
    
    // Update GitHub data while preserving token and connection date
    user.github = {
      ...githubData,
      accessToken: user.github.accessToken,
      connectedAt: user.github.connectedAt
    };

    // Update activity
    if (!user.activity) {
      user.activity = [];
    }

    if (githubData.contributionGraph && Array.isArray(githubData.contributionGraph)) {
      // Clear old GitHub activities
      user.activity = user.activity.filter(a => {
        const date = new Date(a.date);
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        return date < oneYearAgo;
      });

      // Add new activities
      githubData.contributionGraph.forEach(week => {
        if (week.contributionDays && Array.isArray(week.contributionDays)) {
          week.contributionDays.forEach(day => {
            const existingActivity = user.activity.find(a => a.date === day.date);
            if (existingActivity) {
              existingActivity.count = day.contributionCount;
            } else {
              user.activity.push({
                date: day.date,
                count: day.contributionCount
              });
            }
          });
        }
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
