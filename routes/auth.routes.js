import express from "express";
import { signup, login, googleAuth, getProfile } from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/google", googleAuth);
router.get("/profile", protect, getProfile);

// Health check endpoint for backend status
router.get("/check", (req, res) => {
  res.json({ status: "ok", message: "Backend is running" });
});

export default router;