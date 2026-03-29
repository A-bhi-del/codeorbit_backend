import express from "express";
import { connectCodeChef } from "../controllers/codechef.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/connect", protect, connectCodeChef);

export default router;
