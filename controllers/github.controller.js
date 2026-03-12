import User from "../models/User.js";
import { fetchGithubProfile } from "../services/github.service.js";

export const connectGithub = async (req, res) => {
  try {
    const userId = req.user;
    const { username } = req.body;

    const user = await User.findById(userId);

    if (!user)
      return res.status(404).json({ message: "User not found" });

    const githubData = await fetchGithubProfile(username);

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

    await user.save();

    res.json({
      message: "Github connected successfully",
      github: githubData,
      activityDaysAdded: user.activity.length
    });

  } catch (error) {
    console.error("GitHub connection error:", error.message);
    res.status(400).json({
      message: "Invalid Github username"
    });

  }
};