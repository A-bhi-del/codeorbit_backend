import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  getRoomById,
  getUserRooms,
  closeRoom,
  saveCanvasData,
  getCanvasData
} from "../controllers/rooms.controller.js";

const router = express.Router();

router.get("/user/me", protect, getUserRooms);
router.get("/:roomId", protect, getRoomById);
router.post("/:roomId/close", protect, closeRoom);
router.post("/:roomId/canvas", protect, saveCanvasData);
router.get("/:roomId/canvas", protect, getCanvasData);

export default router;
