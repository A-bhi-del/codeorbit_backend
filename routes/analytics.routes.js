import express from "express";
import { getConsistencyScore, getWeeklyActivity, getHeatmap, getPlatformComparison, getDashboardStats, getProblemStats, getContestRatings } from "../controllers/analytics.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/dashboard-stats", protect, getDashboardStats);
router.get("/problem-stats", protect, getProblemStats);
router.get("/contest-ratings", protect, getContestRatings);
router.get("/consistency", protect, getConsistencyScore);
router.get("/weekly-activity", protect, getWeeklyActivity);
router.get("/heatmap", protect, getHeatmap);
router.get("/platform-comparison", protect, getPlatformComparison);

export default router;