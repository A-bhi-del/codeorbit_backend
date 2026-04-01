import User from "../models/User.js";
import { fetchLeetCodeSolvedProblems } from "../services/leetcode.service.js";
import { fetchCodeforcesSolvedProblems } from "../services/codeforces.service.js";

// Get problems from all connected platforms
export const getAllProblems = async (req, res) => {
  try {
    const userId = req.user;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const allProblems = [];
    const platformStats = {};

    // Fetch LeetCode problems
    if (user.leetcode?.verified && user.leetcode?.username) {
      try {
        const leetcodeProblems = await fetchLeetCodeSolvedProblems(user.leetcode.username);
        allProblems.push(...leetcodeProblems);
        platformStats.leetcode = {
          total: leetcodeProblems.length,
          connected: true
        };
      } catch (error) {
        console.error("Error fetching LeetCode problems:", error.message);
        platformStats.leetcode = { total: 0, connected: true, error: error.message };
      }
    } else {
      platformStats.leetcode = { total: 0, connected: false };
    }

    // Fetch Codeforces problems
    if (user.codeforces?.handle) {
      try {
        const codeforcesProblems = await fetchCodeforcesSolvedProblems(user.codeforces.handle);
        allProblems.push(...codeforcesProblems);
        platformStats.codeforces = {
          total: codeforcesProblems.length,
          connected: true
        };
      } catch (error) {
        console.error("Error fetching Codeforces problems:", error.message);
        platformStats.codeforces = { total: 0, connected: true, error: error.message };
      }
    } else {
      platformStats.codeforces = { total: 0, connected: false };
    }

    // Sort all problems by timestamp (most recent first)
    allProblems.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      problems: allProblems,
      totalProblems: allProblems.length,
      platformStats,
      message: "Problems fetched successfully"
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get problems from a specific platform
export const getProblemsByPlatform = async (req, res) => {
  try {
    const userId = req.user;
    const { platform } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let problems = [];

    switch (platform.toLowerCase()) {
      case 'leetcode':
        if (user.leetcode?.verified && user.leetcode?.username) {
          problems = await fetchLeetCodeSolvedProblems(user.leetcode.username);
        } else {
          return res.status(400).json({ message: "LeetCode not connected or verified" });
        }
        break;

      case 'codeforces':
        if (user.codeforces?.handle) {
          problems = await fetchCodeforcesSolvedProblems(user.codeforces.handle);
        } else {
          return res.status(400).json({ message: "Codeforces not connected" });
        }
        break;

      default:
        return res.status(400).json({ message: "Unsupported platform" });
    }

    res.json({
      problems,
      total: problems.length,
      platform: platform,
      message: `${platform} problems fetched successfully`
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};