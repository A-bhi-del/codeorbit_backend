import User from "../models/User.js";
import { getGFGData } from "../services/gfgService.js";
import { updateActivity } from "../utils/activity.util.js";

export const connectGFG = async (req, res) => {
  try {
    const userId = req.user;
    const { username } = req.body;

    const user = await User.findById(userId);

    if (!user)
      return res.status(404).json({ message: "User not found" });

    const gfgData = await getGFGData(username);

    user.gfg = gfgData;

    // Add initial activity
    updateActivity(user, gfgData.score || 0);

    await user.save();

    res.json({
      message: "GFG connected successfully",
      gfg: gfgData
    });

  } catch (error) {
    console.error("GFG connection error:", error);
    res.status(400).json({
      message: "Invalid GFG username",
      error: error.message
    });
  }
};
