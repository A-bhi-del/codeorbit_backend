import express from "express";
import { getCurrentUserProfile, getPublicProfile } from "../controllers/profile.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/me", protect, getCurrentUserProfile);
router.get("/:email", getPublicProfile);

export default router;