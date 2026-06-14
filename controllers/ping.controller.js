import PingRequest from "../models/PingRequest.js";
import Room from "../models/Room.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { sendPingRequestNotification, sendPingAcceptedNotification, createStreamChannel, getStreamClient } from "../services/stream.service.js";
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

    // Check if they are friends (bidirectional friendship)
    const isFriend = sender.friends.some(friendId => friendId.toString() === receiverId);
    if (!isFriend) {
      return res.status(403).json({ message: "Can only ping friends" });
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

    // Send Stream ping notification
    await sendPingRequestNotification(receiverId.toString(), {
      senderId: senderId.toString(),
      displayName: sender.displayName,
      username: sender.username,
      photoURL: sender.photoURL,
      profileImage: sender.profileImage,
      message: message || 'wants to collaborate',
      requestId: pingRequest._id.toString()
    });

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

    console.log('[ACCEPT PING] Receiver:', receiverId, 'PingId:', pingId);

    const pingRequest = await PingRequest.findById(pingId)
      .populate('sender', 'displayName username photoURL profileImage streamUserId')
      .populate('receiver', 'displayName username photoURL profileImage streamUserId');

    if (!pingRequest) {
      console.log('[ACCEPT PING] Ping request not found');
      return res.status(404).json({ message: "Ping request not found" });
    }

    if (pingRequest.receiver._id.toString() !== receiverId.toString()) {
      console.log('[ACCEPT PING] Unauthorized access attempt');
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (pingRequest.status !== 'pending') {
      console.log('[ACCEPT PING] Ping already responded to:', pingRequest.status);
      return res.status(400).json({ message: "Ping already responded to" });
    }

    // Create discussion room
    const roomId = uuidv4();
    const streamChannelId = `room-${roomId}`;
    
    console.log('[ACCEPT PING] Creating room:', { roomId, streamChannelId });
    
    // Use streamUserId if available, otherwise use MongoDB ID
    const senderStreamId = pingRequest.sender.streamUserId || pingRequest.sender._id.toString();
    const receiverStreamId = pingRequest.receiver.streamUserId || pingRequest.receiver._id.toString();
    
    console.log('[ACCEPT PING] Stream IDs:', { senderStreamId, receiverStreamId });
    
    // Try to create Stream channel (non-blocking)
    let channelCreated = false;
    try {
      const channel = await createStreamChannel(
        streamChannelId,
        'messaging',
        senderStreamId,
        [senderStreamId, receiverStreamId],
        {
          name: `Discussion Room`,
          created_by: pingRequest.sender.displayName || pingRequest.sender.username
        }
      );

      if (channel) {
        channelCreated = true;
        console.log('[ACCEPT PING] Stream channel created successfully');
      } else {
        console.warn('[ACCEPT PING] Stream channel creation returned null');
      }
    } catch (streamError) {
      console.error('[ACCEPT PING] Stream channel creation failed:', streamError);
      // Continue anyway - room can work without Stream channel
    }

    // Create room in database regardless of Stream channel status
    console.log('[ACCEPT PING] Creating room in database');
    const room = await Room.create({
      roomId,
      streamChannelId: channelCreated ? streamChannelId : null,
      participants: [pingRequest.sender._id, pingRequest.receiver._id],
      createdBy: pingRequest.sender._id,
      active: true
    });

    console.log('[ACCEPT PING] Room created in DB:', room.roomId);

    // Update ping request
    pingRequest.status = 'accepted';
    pingRequest.respondedAt = new Date();
    pingRequest.roomId = room._id;
    await pingRequest.save();

    console.log('[ACCEPT PING] Ping request updated');

    // Create notification for sender
    try {
      const notification = await Notification.create({
        sender: receiverId,
        receiver: pingRequest.sender._id,
        type: 'ping_accepted',
        title: 'Ping Accepted',
        message: `${pingRequest.receiver.displayName || pingRequest.receiver.username} accepted your ping`,
        metadata: { roomId: room.roomId, streamChannelId: channelCreated ? streamChannelId : null }
      });

      console.log('[ACCEPT PING] Notification created');

      // Send Stream notification
      if (channelCreated) {
        await sendPingAcceptedNotification(pingRequest.sender._id.toString(), {
          roomId: room.roomId,
          streamChannelId,
          room
        });
        console.log('[ACCEPT PING] Stream notification sent');
      }
    } catch (notifError) {
      console.error('[ACCEPT PING] Notification error (non-critical):', notifError);
      // Don't fail the request if notification fails
    }

    console.log('[ACCEPT PING] Ping accepted successfully');

    res.json({ 
      message: "Ping accepted",
      success: true,
      roomId: room.roomId,
      streamChannelId: channelCreated ? streamChannelId : null,
      room: {
        roomId: room.roomId,
        streamChannelId: room.streamChannelId,
        participants: room.participants,
        active: room.active
      }
    });
  } catch (error) {
    console.error("[ACCEPT PING] Critical Error:", error);
    console.error("[ACCEPT PING] Stack:", error.stack);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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

    // Send Stream notification for rejection
    const client = getStreamClient();
    if (client) {
      const channel = client.channel('messaging', `notifications-${pingRequest.sender.toString()}`, {
        members: [pingRequest.sender.toString()]
      });

      await channel.sendEvent({
        type: 'ping_rejected',
        data: {
          pingId: pingRequest._id.toString(),
          timestamp: new Date().toISOString()
        }
      });
    }

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
