import User from "../models/User.js";
import { getCodeChefData } from "../services/codechefService.js";
import { updateActivity } from "../utils/activity.util.js";

export const connectCodeChef = async (req, res) => {
  try {
    const userId = req.user;
    const { username } = req.body;

    const user = await User.findById(userId);

    if (!user)
      return res.status(404).json({ message: "User not found" });

    const codechefData = await getCodeChefData(username);

    user.codechef = codechefData;

    // Add initial activity
    updateActivity(user, codechefData.rating || 0);

    await user.save();

    res.json({
      message: "CodeChef connected successfully",
      codechef: codechefData
    });

  } catch (error) {
    console.error("CodeChef connection error:", error);
    res.status(400).json({
      message: "Invalid CodeChef username",
      error: error.message
    });
  }
};
