import express from "express";
import User from "../models/User.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// GitHub has its own disconnect (/api/github/disconnect) because it also removes its activity.
const PLATFORMS = ["leetcode", "codeforces", "codechef", "gfg"];

// Disconnect a platform: its stats are removed from the profile.
router.delete("/:platform", protect, async (req, res) => {
  const { platform } = req.params;
  if (!PLATFORMS.includes(platform)) {
    return res.status(400).json({ message: "Unknown platform" });
  }
  try {
    await User.updateOne({ _id: req.user }, { $unset: { [platform]: "" } });
    res.json({ message: `${platform} disconnected` });
  } catch (error) {
    console.error("Disconnect platform error:", error.message);
    res.status(500).json({ message: "Failed to disconnect" });
  }
});

export default router;
