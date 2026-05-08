import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  searchUsers,
  getUserByUsername,
  getUserSuggestions,
  getMutualFriends,
  updateProfile
} from "../controllers/users.controller.js";

const router = express.Router();

router.get("/search", protect, searchUsers);
router.get("/suggestions", protect, getUserSuggestions);
router.get("/mutual/:id", protect, getMutualFriends);
router.get("/:username", protect, getUserByUsername);
router.patch("/profile", protect, updateProfile);

export default router;
