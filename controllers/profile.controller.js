import User from "../models/User.js";
import { calculateConsistencyScore } from "../utils/consistency.util.js";
import { calculateWeeklyTrend } from "../utils/weeklyTrend.util.js";
import { generateHeatmapData } from "../utils/heatmap.util.js";

export const getPublicProfile = async (req, res) => {

  try {

    const { email } = req.params;

    const user = await User.findOne({ email });

    if (!user)
      return res.status(404).json({
        message: "User not found"
      });

    const activeDays = user.activity.length;

    const consistencyScore =
      calculateConsistencyScore(user.activity);

    const weeklyTrend =
      calculateWeeklyTrend(user.activity);

    const heatmap =
      generateHeatmapData(user.activity);

    const leaderboardScore =
      (user.leetcode?.totalSolved || 0) +
      (user.codeforces?.rating || 0) / 10 +
      (user.github?.totalStars || 0);

    res.json({

      email: user.email,

      lastSyncedAt: user.lastSyncedAt,

      platforms: {

        leetcode: user.leetcode,

        codeforces: user.codeforces,

        github: user.github

      },

      analytics: {

        activeDays,

        consistencyScore,

        weeklyTrend,

        heatmap

      },

      leaderboardScore

    });

  } catch (error) {

    res.status(500).json({
      message: "Error fetching profile"
    });

  }

};