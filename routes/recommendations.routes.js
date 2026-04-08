import express from "express";
import { 
  getAIRecommendations,
  getDifficultyProgression 
} from "../controllers/recommendations.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// AI-powered recommendations based on recent activity
router.get("/ai", protect, getAIRecommendations);

// Difficulty progression analysis
router.get("/difficulty-progression", protect, getDifficultyProgression);

export default router;