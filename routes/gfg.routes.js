import express from "express";
import { connectGFG } from "../controllers/gfg.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/connect", protect, connectGFG);

export default router;
