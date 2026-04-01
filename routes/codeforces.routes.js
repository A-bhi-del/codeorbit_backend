import express from "express";
import { connectCodeforces, getCodeforcesProblems } from "../controllers/codeforces.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/connect", protect, connectCodeforces);
router.get("/problems", protect, getCodeforcesProblems);

export default router;