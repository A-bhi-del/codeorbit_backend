import User from "../models/User.js";
import { fetchGithubProfile } from "../services/github.service.js";

export const connectGithub = async (req, res) => {
  try {
    console.log("🔗 GitHub connection request received");
    console.log("Request body:", req.body);
    console.log("User ID:", req.user);
    
    const userId = req.user;
    const { username } = req.body;

    if (!username) {
      console.log("❌ No username provided in request body");
      return res.status(400).json({ 
        message: "Username is required",
        error: "Missing username in request body"
      });
    }

    console.log(`🔍 Looking for user with ID: ${userId}`);
    const user = await User.findById(userId);

    if (!user) {
      console.log("❌ User not found in database");
      return res.status(404).json({ message: "User not found" });
    }

    console.log(`📡 Fetching GitHub profile for username: ${username}`);
    const githubData = await fetchGithubProfile(username);
    console.log("✅ GitHub data fetched successfully");

    user.github = githubData;

    // Initialize activity array if not exists
    if (!user.activity) {
      user.activity = [];
    }

    // Parse GitHub contribution graph and add to activity
    if (githubData.contributionGraph && Array.isArray(githubData.contributionGraph)) {
      console.log(`Processing ${githubData.contributionGraph.length} weeks of GitHub data`);
      
      let addedDays = 0;
      githubData.contributionGraph.forEach(week => {
        if (week.contributionDays && Array.isArray(week.contributionDays)) {
          week.contributionDays.forEach(day => {
            // Add all days, even with 0 contributions for complete heatmap
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

    console.log("💾 Saving user data to database");
    await user.save();
    console.log("✅ GitHub connection successful");

    res.json({
      message: "Github connected successfully",
      github: githubData,
      activityDaysAdded: user.activity.length
    });

  } catch (error) {
    console.error("❌ GitHub connection error:", error.message);
    console.error("Error stack:", error.stack);
    
    // More specific error messages
    if (error.message.includes("Invalid Github username")) {
      return res.status(400).json({
        message: "Invalid Github username",
        error: "User not found on GitHub or profile is private",
        suggestion: "Please check the username and ensure the profile is public"
      });
    }
    
    if (error.message.includes("API rate limit")) {
      return res.status(429).json({
        message: "GitHub API rate limit exceeded",
        error: "Too many requests to GitHub API",
        suggestion: "Please try again later"
      });
    }

    res.status(400).json({
      message: "Failed to connect GitHub",
      error: error.message,
      suggestion: "Please check the username and try again"
    });
  }
};