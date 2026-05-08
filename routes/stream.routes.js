import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { getStreamToken, initializeStreamUser } from "../controllers/stream.controller.js";

const router = express.Router();

router.get("/token", protect, getStreamToken);
router.post("/initialize", protect, initializeStreamUser);

export default router;
