import User from "../models/User.js";
import { calculateConsistencyScore } from "../utils/consistency.util.js";
import { calculateWeeklyTrend } from "../utils/weeklyTrend.util.js";
import { generateHeatmapData } from "../utils/heatmap.util.js";

// Get current user's profile
export const getCurrentUserProfile = async (req, res) => {
  try {
    const userId = req.user;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const activeDays = user.activity?.length || 0;
    const consistencyScore = calculateConsistencyScore(user.activity || []);

    res.json({
      id: user._id,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      provider: user.provider,
      lastSyncedAt: user.lastSyncedAt,
      platforms: {
        leetcode: user.leetcode ? {
          username: user.leetcode.username,
          verified: user.leetcode.verified,
          totalSolved: user.leetcode.totalSolved,
          contestRating: user.leetcode.contestRating,
          contestsPlayed: user.leetcode.contestsPlayed
        } : null,
        codeforces: user.codeforces ? {
          handle: user.codeforces.handle,
          rating: user.codeforces.rating,
          maxRating: user.codeforces.maxRating,
          rank: user.codeforces.rank,
          solvedProblems: user.codeforces.solvedProblems,
          contestsPlayed: user.codeforces.contestsPlayed
        } : null,
        github: user.github ? {
          username: user.github.username,
          avatar: user.github.avatar,
          followers: user.github.followers,
          publicRepos: user.github.publicRepos,
          totalStars: user.github.totalStars,
          totalContributions: user.github.totalContributions
        } : null
      },
      stats: {
        activeDays,
        consistencyScore
      }
    });

  } catch (error) {
    console.error("Error fetching current user profile:", error);
    res.status(500).json({
      message: "Error fetching profile"
    });
  }
};

// Get public profile by email
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