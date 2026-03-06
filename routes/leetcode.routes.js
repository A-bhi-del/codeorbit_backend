import express from "express";
import {
  connectLeetCode,
  verifyLeetCode
} from "../controllers/leetcode.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/connect", protect, connectLeetCode);
router.post("/verify", protect, verifyLeetCode);

export default router;