import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  sendPingRequest,
  acceptPingRequest,
  rejectPingRequest,
  getPendingPings
} from "../controllers/ping.controller.js";

const router = express.Router();

router.post("/send/:id", protect, sendPingRequest);
router.post("/accept/:id", protect, acceptPingRequest);
router.post("/reject/:id", protect, rejectPingRequest);
router.get("/pending", protect, getPendingPings);

export default router;
