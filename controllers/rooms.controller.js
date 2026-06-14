import Room from "../models/Room.js";
import User from "../models/User.js";
import { deleteStreamChannel, getStreamClient } from "../services/stream.service.js";

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

    console.log('[CLOSE ROOM] User:', userId, 'Room:', roomId);

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

    // Mark room as inactive
    room.active = false;
    room.closedAt = new Date();
    await room.save();

    console.log('[CLOSE ROOM] Room marked as closed');

    // Send Stream event to all participants to close room
    const client = getStreamClient();
    if (client && room.streamChannelId) {
      try {
        const channel = client.channel('messaging', room.streamChannelId);
        
        // Send room closed event to all participants
        await channel.sendEvent({
          type: 'room_closed',
          user_id: userId.toString(),
          data: {
            roomId: room.roomId,
            closedBy: userId.toString(),
            timestamp: new Date().toISOString()
          }
        });

        console.log('[CLOSE ROOM] Room closed event sent to all participants');

        // Delete Stream channel
        await deleteStreamChannel('messaging', room.streamChannelId);
        console.log('[CLOSE ROOM] Stream channel deleted');
      } catch (channelError) {
        console.error('[CLOSE ROOM] Channel cleanup error:', channelError);
        // Don't fail the request if cleanup fails
      }
    }

    res.json({ 
      message: "Room closed",
      roomId: room.roomId
    });
  } catch (error) {
    console.error("[CLOSE ROOM] Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
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
