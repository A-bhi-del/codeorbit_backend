import axios from "axios";

export const fetchGithubProfile = async (username) => {
  try {
    console.log(`🔍 Fetching GitHub profile for: ${username}`);
    
    // Check if GitHub token is available
    if (!process.env.GITHUB_TOKEN) {
      console.error("❌ GITHUB_TOKEN not found in environment variables");
      throw new Error("GitHub token not configured");
    }

    // Profile
    console.log("📡 Fetching GitHub profile data...");
    const profile = await axios.get(
      `https://api.github.com/users/${username}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          'User-Agent': 'CodeOrbit-Backend'
        }
      }
    );
    console.log("✅ Profile data fetched successfully");

    // Repos
    console.log("📡 Fetching GitHub repositories...");
    const repos = await axios.get(
      `https://api.github.com/users/${username}/repos?per_page=100`,
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          'User-Agent': 'CodeOrbit-Backend'
        }
      }
    );
    console.log(`✅ Found ${repos.data.length} repositories`);

    let totalStars = 0;
    repos.data.forEach(repo => {
      totalStars += repo.stargazers_count;
    });
    console.log(`⭐ Total stars: ${totalStars}`);

    // Contribution graph query
    console.log("📡 Fetching GitHub contribution graph...");
    const query = `
    query {
      user(login: "${username}") {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                date
                contributionCount
              }
            }
          }
        }
      }
    }
    `;

    const contributions = await axios.post(
      "https://api.github.com/graphql",
      { query },
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
          'User-Agent': 'CodeOrbit-Backend'
        }
      }
    );

    if (contributions.data.errors) {
      console.error("❌ GraphQL errors:", contributions.data.errors);
      throw new Error(`GitHub GraphQL error: ${contributions.data.errors[0].message}`);
    }

    const calendar = contributions.data.data.user.contributionsCollection.contributionCalendar;
    console.log(`✅ Contribution data fetched: ${calendar.totalContributions} total contributions`);

    const result = {
      username: profile.data.login,
      avatar: profile.data.avatar_url,
      followers: profile.data.followers,
      following: profile.data.following,
      publicRepos: profile.data.public_repos,
      totalStars,
      totalContributions: calendar.totalContributions,
      contributionGraph: calendar.weeks
    };

    console.log("✅ GitHub profile data compiled successfully");
    return result;

  } catch (error) {
    console.error("❌ GitHub API Error:", error.message);
    
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
      
      if (error.response.status === 404) {
        throw new Error("Invalid Github username - User not found");
      }
      if (error.response.status === 403) {
        throw new Error("GitHub API rate limit exceeded or token invalid");
      }
      if (error.response.status === 401) {
        throw new Error("GitHub token is invalid or expired");
      }
    }
    
    throw new Error(`GitHub API error: ${error.message}`);
  }
};