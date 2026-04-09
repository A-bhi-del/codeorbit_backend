import express from "express";
import { 
  getAIRecommendations,
  getLearningPath,
  getDifficultyProgression 
} from "../controllers/recommendations.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// AI-powered recommendations based on recent activity
router.get("/ai", protect, getAIRecommendations);

// Learning path suggestions with real-time data
router.get("/learning-path", protect, getLearningPath);

// Difficulty progression analysis
router.get("/difficulty-progression", protect, getDifficultyProgression);

export default router;