import User from "../models/User.js";
import { fetchCodeforcesProfile, fetchCodeforcesSolvedProblems } from "../services/codeforces.service.js";
import { updateActivity } from "../utils/activity.util.js";

export const connectCodeforces = async (req, res) => {

  try {

    const userId = req.user;
    const { handle } = req.body;

    const user = await User.findById(userId);

    if (!user)
      return res.status(404).json({ message: "User not found" });

    const cfData = await fetchCodeforcesProfile(handle);

    user.codeforces = cfData;

    // Add initial activity
    updateActivity(user, cfData.solvedProblems || 0);

    await user.save();

    res.json({
      message: "Codeforces connected successfully",
      codeforces: cfData
    });

  } catch (error) {

    res.status(400).json({
      message: "Invalid Codeforces handle"
    });

  }
};

// 🔹 NEW: Get Codeforces Solved Problems
export const getCodeforcesProblems = async (req, res) => {
  try {
    const userId = req.user;
    const user = await User.findById(userId);

    if (!user || !user.codeforces?.handle) {
      return res.status(400).json({ message: "Codeforces not connected" });
    }

    const problems = await fetchCodeforcesSolvedProblems(user.codeforces.handle);
    
    res.json({
      problems,
      total: problems.length,
      platform: "Codeforces"
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};