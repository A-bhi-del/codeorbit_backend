import express from "express";
import { githubOAuthCallback, disconnectGithub, refreshGithubData } from "../controllers/github.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// OAuth flow - Connect GitHub via OAuth
router.post("/oauth/callback", protect, githubOAuthCallback);

// Disconnect GitHub
router.post("/disconnect", protect, disconnectGithub);

// Refresh GitHub data using stored token
router.post("/refresh", protect, refreshGithubData);

export default router;