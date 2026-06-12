import Room from "../models/Room.js";
import User from "../models/User.js";
import { deleteStreamChannel } from "../services/stream.service.js";

// Get room by ID
export const getRoomById = async (req, res) => {
  try {
    const userId = req.user;
    const { roomId } = req.params;

    const room = await Room.findOne({ roomId })
      .populate('participants', 'displayName username photoURL profileImage onlineStatus streamUserId')
      .populate('createdBy', 'displayName username photoURL profileImage')
      .lean();

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Check if user is participant
    const isParticipant = room.participants.some(
      p => p._id.toString() === userId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    res.json({ room });
  } catch (error) {
    console.error("Get room by ID error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get user's active rooms
export const getUserRooms = async (req, res) => {
  try {
    const userId = req.user;

    const rooms = await Room.find({
      participants: userId,
      active: true
    })
      .populate('participants', 'displayName username photoURL profileImage onlineStatus')
      .populate('createdBy', 'displayName username photoURL profileImage')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ rooms });
  } catch (error) {
    console.error("Get user rooms error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Close room
export const closeRoom = async (req, res) => {
  try {
    const userId = req.user;
    const { roomId } = req.params;

    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Check if user is participant
    const isParticipant = room.participants.some(
      p => p.toString() === userId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    room.active = false;
    room.closedAt = new Date();
    await room.save();

    // Delete Stream channel if exists
    if (room.streamChannelId) {
      await deleteStreamChannel('messaging', room.streamChannelId);
    }

    res.json({ message: "Room closed" });
  } catch (error) {
    console.error("Close room error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Save canvas data
export const saveCanvasData = async (req, res) => {
  try {
    const userId = req.user;
    const { roomId } = req.params;
    const { strokes } = req.body;

    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Check if user is participant
    const isParticipant = room.participants.some(
      p => p.toString() === userId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    room.canvasData = { strokes };
    await room.save();

    res.json({ message: "Canvas saved" });
  } catch (error) {
    console.error("Save canvas data error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get canvas data
export const getCanvasData = async (req, res) => {
  try {
    const userId = req.user;
    const { roomId } = req.params;

    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Check if user is participant
    const isParticipant = room.participants.some(
      p => p.toString() === userId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    res.json({ canvasData: room.canvasData || { strokes: [] } });
  } catch (error) {
    console.error("Get canvas data error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
