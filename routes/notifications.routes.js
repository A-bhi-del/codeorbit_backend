import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount
} from "../controllers/notifications.controller.js";

const router = express.Router();

router.get("/", protect, getNotifications);
router.get("/unread-count", protect, getUnreadCount);
router.patch("/:id/read", protect, markAsRead);
router.patch("/read-all", protect, markAllAsRead);
router.delete("/:id", protect, deleteNotification);

export default router;
