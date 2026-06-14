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

    console.log('[SAVE CANVAS] Request:', { userId, roomId, strokesCount: strokes?.length });

    // Validate request body
    if (!strokes || !Array.isArray(strokes)) {
      return res.status(400).json({ message: "Invalid canvas data. Strokes must be an array." });
    }

    const room = await Room.findOne({ roomId });

    if (!room) {
      console.log('[SAVE CANVAS] Room not found:', roomId);
      return res.status(404).json({ message: "Room not found" });
    }

    // Check if user is participant
    const isParticipant = room.participants.some(
      p => p.toString() === userId.toString()
    );

    if (!isParticipant) {
      console.log('[SAVE CANVAS] User not authorized:', userId);
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Save canvas data
    room.canvasData = { strokes };
    await room.save();

    console.log('[SAVE CANVAS] Success:', { roomId, strokesCount: strokes.length });
    res.json({ message: "Canvas saved", strokesCount: strokes.length });
  } catch (error) {
    console.error("[SAVE CANVAS] Error:", error);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message 
    });
  }
};

// Get canvas data
export const getCanvasData = async (req, res) => {
  try {
    const userId = req.user;
    const { roomId } = req.params;

    console.log('[GET CANVAS] Request:', { userId, roomId });

    const room = await Room.findOne({ roomId });

    if (!room) {
      console.log('[GET CANVAS] Room not found:', roomId);
      return res.status(404).json({ message: "Room not found" });
    }

    // Check if user is participant
    const isParticipant = room.participants.some(
      p => p.toString() === userId.toString()
    );

    if (!isParticipant) {
      console.log('[GET CANVAS] User not authorized:', userId);
      return res.status(403).json({ message: "Unauthorized" });
    }

    const canvasData = room.canvasData || { strokes: [] };
    console.log('[GET CANVAS] Success:', { roomId, strokesCount: canvasData.strokes?.length || 0 });
    
    res.json({ canvasData });
  } catch (error) {
    console.error("[GET CANVAS] Error:", error);
    res.status(500).json({ 
      message: "Server error",
      error: error.message
    });
  }
};
