import express from "express";
import { getAllProblems, getProblemsByPlatform } from "../controllers/problems.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/all", protect, getAllProblems);
router.get("/:platform", protect, getProblemsByPlatform);

export default router;