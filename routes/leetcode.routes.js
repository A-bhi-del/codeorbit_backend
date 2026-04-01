import express from "express";
import {
  connectLeetCode,
  verifyLeetCode,
  getLeetCodeProblems
} from "../controllers/leetcode.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/connect", protect, connectLeetCode);
router.post("/verify", protect, verifyLeetCode);
router.get("/problems", protect, getLeetCodeProblems);

export default router;