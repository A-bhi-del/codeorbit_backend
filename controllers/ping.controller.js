import PingRequest from "../models/PingRequest.js";
import Room from "../models/Room.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { emitPingRequest, emitPingAccepted, emitPingRejected } from "../sockets/socketManager.js";
import { v4 as uuidv4 } from 'uuid';

// Send ping request
export const sendPingRequest = async (req, res) => {
  try {
    const senderId = req.user;
    const { id: receiverId } = req.params;
    const { message } = req.body;

    console.log('[SEND PING] Sender:', senderId, 'Receiver:', receiverId);

    if (senderId.toString() === receiverId) {
      return res.status(400).json({ message: "Cannot ping yourself" });
    }

    const [sender, receiver] = await Promise.all([
      User.findById(senderId),
      User.findById(receiverId)
    ]);

    if (!receiver) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log('[SEND PING] Sender friends:', sender.friends);
    console.log('[SEND PING] Checking if receiver is friend:', sender.friends.some(id => id.toString() === receiverId));

    // Check if they are friends (mutual followers)
    const isFriend = sender.friends.some(friendId => friendId.toString() === receiverId);
    if (!isFriend) {
      return res.status(403).json({ message: "Can only ping mutual friends" });
    }

    // Check if receiver is online
    if (!receiver.onlineStatus) {
      return res.status(400).json({ message: "User is offline" });
    }

    // Check for existing pending ping
    const existingPing = await PingRequest.findOne({
      sender: senderId,
      receiver: receiverId,
      status: 'pending'
    });

    if (existingPing) {
      return res.status(400).json({ message: "Ping already sent" });
    }

    // Create ping request
    const pingRequest = await PingRequest.create({
      sender: senderId,
      receiver: receiverId,
      message: message || 'wants to collaborate'
    });

    // Populate sender info
    await pingRequest.populate('sender', 'displayName username photoURL profileImage');

    console.log('[SEND PING] Ping request created:', pingRequest._id);

    // Create notification
    const notification = await Notification.create({
      sender: senderId,
      receiver: receiverId,
      type: 'ping_request',
      title: 'Ping Request',
      message: `${sender.displayName || sender.username} ${message || 'wants to collaborate'}`,
      metadata: { requestId: pingRequest._id.toString() }
    });

    console.log('[SEND PING] Notification created');

    // Emit realtime ping request
    emitPingRequest(receiverId.toString(), pingRequest);

    console.log('[SEND PING] Ping sent successfully');

    res.json({ 
      message: "Ping sent",
      pingRequest
    });
  } catch (error) {
    console.error("[SEND PING] Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Accept ping request
export const acceptPingRequest = async (req, res) => {
  try {
    const receiverId = req.user;
    const { id: pingId } = req.params;

    const pingRequest = await PingRequest.findById(pingId)
      .populate('sender', 'displayName username photoURL profileImage streamUserId')
      .populate('receiver', 'displayName username photoURL profileImage streamUserId');

    if (!pingRequest) {
      return res.status(404).json({ message: "Ping request not found" });
    }

    if (pingRequest.receiver._id.toString() !== receiverId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (pingRequest.status !== 'pending') {
      return res.status(400).json({ message: "Ping already responded to" });
    }

    // Create discussion room
    const roomId = uuidv4();
    const room = await Room.create({
      roomId,
      participants: [pingRequest.sender._id, pingRequest.receiver._id],
      createdBy: pingRequest.sender._id,
      active: true
    });

    // Update ping request
    pingRequest.status = 'accepted';
    pingRequest.respondedAt = new Date();
    pingRequest.roomId = room._id;
    await pingRequest.save();

    // Create notification for sender
    const notification = await Notification.create({
      sender: receiverId,
      receiver: pingRequest.sender._id,
      type: 'ping_accepted',
      title: 'Ping Accepted',
      message: `${pingRequest.receiver.displayName || pingRequest.receiver.username} accepted your ping`,
      metadata: { roomId: room.roomId }
    });

    // Emit realtime ping accepted
    emitPingAccepted(pingRequest.sender._id.toString(), {
      roomId: room.roomId,
      room,
      pingRequest
    });

    res.json({ 
      message: "Ping accepted",
      roomId: room.roomId,
      room
    });
  } catch (error) {
    console.error("Accept ping request error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Reject ping request
export const rejectPingRequest = async (req, res) => {
  try {
    const receiverId = req.user;
    const { id: pingId } = req.params;

    const pingRequest = await PingRequest.findById(pingId);

    if (!pingRequest) {
      return res.status(404).json({ message: "Ping request not found" });
    }

    if (pingRequest.receiver.toString() !== receiverId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (pingRequest.status !== 'pending') {
      return res.status(400).json({ message: "Ping already responded to" });
    }

    pingRequest.status = 'rejected';
    pingRequest.respondedAt = new Date();
    await pingRequest.save();

    // Emit realtime ping rejected
    emitPingRejected(pingRequest.sender.toString(), {
      pingId: pingRequest._id
    });

    res.json({ message: "Ping rejected" });
  } catch (error) {
    console.error("Reject ping request error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get pending pings
export const getPendingPings = async (req, res) => {
  try {
    const userId = req.user;

    const pings = await PingRequest.find({
      receiver: userId,
      status: 'pending'
    })
      .populate('sender', 'displayName username photoURL profileImage')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ pings });
  } catch (error) {
    console.error("Get pending pings error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
