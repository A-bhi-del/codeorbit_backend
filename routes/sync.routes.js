import express from "express";
import { syncAllPlatforms, syncLeetCode, syncCodeforces, syncGithub, syncCodeChef, syncGFG } from "../controllers/sync.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/all", protect, syncAllPlatforms);
router.post("/leetcode", protect, syncLeetCode);
router.post("/codeforces", protect, syncCodeforces);
router.post("/github", protect, syncGithub);
router.post("/codechef", protect, syncCodeChef);
router.post("/gfg", protect, syncGFG);

export default router;
