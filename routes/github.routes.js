import express from "express";
import { githubOAuthCallback, connectGithub, disconnectGithub, refreshGithubData, getGithubStatus } from "../controllers/github.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Get GitHub connection status
router.get("/status", protect, getGithubStatus);

// Connect GitHub by username
router.post("/connect", protect, connectGithub);

// OAuth flow - Connect GitHub via OAuth (optional)
router.post("/oauth/callback", protect, githubOAuthCallback);

// Disconnect GitHub
router.post("/disconnect", protect, disconnectGithub);

// Refresh GitHub data using stored token
router.post("/refresh", protect, refreshGithubData);

export default router;