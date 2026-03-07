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