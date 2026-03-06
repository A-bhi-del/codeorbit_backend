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

    await user.save();

    res.json({
      message: "Github connected successfully",
      github: githubData
    });

  } catch (error) {

    res.status(400).json({
      message: "Invalid Github username"
    });

  }
};