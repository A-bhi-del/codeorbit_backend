import User from "../models/User.js";
import { calculateConsistencyScore } from "../utils/consistency.util.js";
import { calculateWeeklyTrend } from "../utils/weeklyTrend.util.js";

export const getConsistencyScore = async (req, res) => {

  try {

    const userId = req.user;

    const user = await User.findById(userId);

    if (!user)
      return res.status(404).json({
        message: "User not found"
      });

    const score =
      calculateConsistencyScore(user.activity);

    res.json({
      consistencyScore: score
    });

  } catch (error) {

    res.status(500).json({
      message: "Error calculating score"
    });

  }

};


export const getWeeklyActivity = async (req, res) => {

  try {

    const userId = req.user;

    const user = await User.findById(userId);

    if (!user)
      return res.status(404).json({
        message: "User not found"
      });

    const trend =
      calculateWeeklyTrend(user.activity);

    res.json({
      weeklyTrend: trend
    });

  } catch (error) {

    res.status(500).json({
      message: "Error fetching weekly trend"
    });

  }

};

import { generateHeatmapData } from "../utils/heatmap.util.js";

export const getHeatmap = async (req, res) => {

  try {

    const userId = req.user;

    const user = await User.findById(userId);

    if (!user)
      return res.status(404).json({
        message: "User not found"
      });

    const heatmap =
      generateHeatmapData(user.activity);

    res.json({
      heatmap
    });

  } catch (error) {

    res.status(500).json({
      message: "Error generating heatmap"
    });

  }

};

export const getPlatformComparison = async (req, res) => {

  try {

    const userId = req.user;

    const user = await User.findById(userId);

    if (!user)
      return res.status(404).json({
        message: "User not found"
      });

    const comparison = [

      {
        platform: "LeetCode",
        solved: user.leetcode?.totalSolved || 0,
        rating: user.leetcode?.contestRating || 0,
        activity: user.leetcode?.totalSubmissions || 0
      },

      {
        platform: "Codeforces",
        solved: user.codeforces?.solvedProblems || 0,
        rating: user.codeforces?.rating || 0,
        activity: user.codeforces?.contestsPlayed || 0
      },

      {
        platform: "GitHub",
        solved: null,
        rating: null,
        activity: user.github?.totalStars || 0
      }

    ];

    res.json({
      comparison
    });

  } catch (error) {

    res.status(500).json({
      message: "Error fetching comparison"
    });

  }

};

// Calculate streak from activity data
const calculateStreaks = (activity) => {
  if (!activity || activity.length === 0) {
    return { currentStreak: 0, longestStreak: 0, activeDays: 0 };
  }

  const sortedActivity = activity
    .filter(a => a.count > 0)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  const activeDays = sortedActivity.length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate current streak
  for (let i = 0; i < sortedActivity.length; i++) {
    const activityDate = new Date(sortedActivity[i].date);
    activityDate.setHours(0, 0, 0, 0);
    
    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);
    expectedDate.setHours(0, 0, 0, 0);

    if (activityDate.getTime() === expectedDate.getTime()) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Calculate longest streak
  const allDates = activity
    .filter(a => a.count > 0)
    .map(a => new Date(a.date).getTime())
    .sort((a, b) => a - b);

  for (let i = 0; i < allDates.length; i++) {
    if (i === 0 || allDates[i] - allDates[i - 1] === 86400000) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }

  return { currentStreak, longestStreak, activeDays };
};

export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const { currentStreak, longestStreak, activeDays } = calculateStreaks(user.activity);
    const consistency = calculateConsistencyScore(user.activity);

    res.json({
      currentStreak,
      activeDays,
      longestStreak,
      consistency
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching dashboard stats"
    });
  }
};

export const getProblemStats = async (req, res) => {
  try {
    const userId = req.user;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    console.log("getProblemStats - User ID:", userId);
    console.log("getProblemStats - LeetCode data:", user.leetcode);

    // Platform breakdown
    const platformBreakdown = [];
    
    if (user.leetcode?.totalSolved) {
      platformBreakdown.push({
        platform: "LeetCode",
        value: user.leetcode.totalSolved,
        color: "oklch(0.75 0.15 80)"
      });
    }

    if (user.codeforces?.solvedProblems) {
      platformBreakdown.push({
        platform: "Codeforces",
        value: user.codeforces.solvedProblems,
        color: "oklch(0.65 0.2 260)"
      });
    }

    if (user.github?.totalContributions) {
      platformBreakdown.push({
        platform: "GitHub",
        value: user.github.totalContributions,
        color: "oklch(0.7 0.18 165)"
      });
    }

    const totalSolved = platformBreakdown.reduce((sum, p) => sum + p.value, 0);

    // Difficulty distribution (from LeetCode if available)
    let difficultyData = [];
    if (user.leetcode?.difficultyBreakdown && user.leetcode.difficultyBreakdown.length > 0) {
      difficultyData = user.leetcode.difficultyBreakdown.map(d => ({
        name: d.name,
        value: d.value,
        color: d.color
      }));
      console.log("getProblemStats - Using stored difficulty breakdown:", difficultyData);
    } else {
      // Default empty data
      difficultyData = [
        { name: "Easy", value: 0, color: "oklch(0.7 0.18 165)" },
        { name: "Medium", value: 0, color: "oklch(0.75 0.15 80)" },
        { name: "Hard", value: 0, color: "oklch(0.6 0.22 330)" }
      ];
      console.log("getProblemStats - Using default difficulty data");
    }

    const response = {
      platformBreakdown,
      totalSolved,
      difficultyData
    };

    console.log("getProblemStats - Response:", JSON.stringify(response, null, 2));

    res.json(response);

  } catch (error) {
    console.error("Error fetching problem stats:", error);
    res.status(500).json({
      message: "Error fetching problem stats"
    });
  }
};

export const getContestRatings = async (req, res) => {
  try {
    const userId = req.user;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    // Get current ratings for connected platforms
    const ratings = {
      leetcode: user.leetcode?.contestRating || null,
      codeforces: user.codeforces?.rating || null,
      codechef: null // Add when CodeChef is integrated
    };

    console.log("getContestRatings - Ratings:", ratings);

    res.json({
      currentRatings: ratings,
      hasData: !!(ratings.leetcode || ratings.codeforces || ratings.codechef)
    });

  } catch (error) {
    console.error("Error fetching contest ratings:", error);
    res.status(500).json({
      message: "Error fetching contest ratings"
    });
  }
};