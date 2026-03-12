import express from "express";
import { syncAllPlatforms } from "../controllers/sync.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/all", protect, syncAllPlatforms);

export default router;
