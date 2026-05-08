import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  sendFriendRequest,
  cancelFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  getFriendsList,
  getFriendRequests,
  getFollowers,
  getFollowing
} from "../controllers/friends.controller.js";

const router = express.Router();

router.post("/request/:id", protect, sendFriendRequest);
router.post("/cancel/:id", protect, cancelFriendRequest);
router.post("/accept/:id", protect, acceptFriendRequest);
router.post("/reject/:id", protect, rejectFriendRequest);
router.delete("/remove/:id", protect, removeFriend);
router.get("/list", protect, getFriendsList);
router.get("/requests", protect, getFriendRequests);
router.get("/followers/:id", protect, getFollowers);
router.get("/following/:id", protect, getFollowing);

export default router;
