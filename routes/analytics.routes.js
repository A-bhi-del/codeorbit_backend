import express from "express";
import { getConsistencyScore, getWeeklyActivity, getHeatmap, getPlatformComparison } from "../controllers/analytics.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/consistency", protect, getConsistencyScore);
router.get("/weekly-activity", protect, getWeeklyActivity);
router.get("/heatmap", protect, getHeatmap);
router.get("/platform-comparison",protect, getPlatformComparison);
export default router;