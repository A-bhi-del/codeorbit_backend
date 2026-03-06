import express from "express";
import { connectCodeforces } from "../controllers/codeforces.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/connect", protect, connectCodeforces);

export default router;