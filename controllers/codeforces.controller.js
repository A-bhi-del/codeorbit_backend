import User from "../models/User.js";
import { fetchCodeforcesProfile } from "../services/codeforces.service.js";

export const connectCodeforces = async (req, res) => {

  try {

    const userId = req.user;
    const { handle } = req.body;

    const user = await User.findById(userId);

    if (!user)
      return res.status(404).json({ message: "User not found" });

    const cfData = await fetchCodeforcesProfile(handle);

    user.codeforces = cfData;

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