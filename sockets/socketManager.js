import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

let io;
const userSockets = new Map(); // userId -> socketId
const socketUsers = new Map(); // socketId -> userId

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:3000",
        "https://codeorbit-sage.vercel.app",
        "https://codeorbit-git-main-arpit-srivastavas-projects-4aa240ca.vercel.app",
        "https://codeorbit-9eqzasyrb-arpit-srivastavas-projects-4aa240ca.vercel.app"
      ],
      credentials: true
    }
  });

  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      console.log('[SOCKET AUTH] Attempting authentication...');
      console.log('[SOCKET AUTH] Token received:', token ? 'Yes' : 'No');

      if (!token) {
        console.log('[SOCKET AUTH] No token provided');
        return next(new Error("Authentication error: No token provided"));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('[SOCKET AUTH] Token decoded successfully');
      console.log('[SOCKET AUTH] User ID:', decoded.userId);
      
      socket.userId = decoded.userId;

      next();
    } catch (error) {
      console.error('[SOCKET AUTH] Authentication failed:', error.message);
      if (error.name === 'JsonWebTokenError') {
        return next(new Error("Authentication error: Invalid token"));
      } else if (error.name === 'TokenExpiredError') {
        return next(new Error("Authentication error: Token expired"));
      }
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.userId;
    console.log(`User connected: ${userId}`);

    // Store socket mapping
    userSockets.set(userId, socket.id);
    socketUsers.set(socket.id, userId);

    // Update user online status
    await User.findByIdAndUpdate(userId, {
      onlineStatus: true,
      socketId: socket.id
    });

    // Broadcast online status to friends
    const user = await User.findById(userId).select('friends').lean();
    if (user && user.friends) {
      user.friends.forEach(friendId => {
        const friendSocketId = userSockets.get(friendId.toString());
        if (friendSocketId) {
          io.to(friendSocketId).emit("user_online", { userId });
        }
      });
    }

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Handle disconnect
    socket.on("disconnect", async () => {
      console.log(`User disconnected: ${userId}`);

      // Remove socket mapping
      userSockets.delete(userId);
      socketUsers.delete(socket.id);

      // Update user offline status
      await User.findByIdAndUpdate(userId, {
        onlineStatus: false,
        lastSeen: new Date()
      });

      // Broadcast offline status to friends
      if (user && user.friends) {
        user.friends.forEach(friendId => {
          const friendSocketId = userSockets.get(friendId.toString());
          if (friendSocketId) {
            io.to(friendSocketId).emit("user_offline", { userId });
          }
        });
      }
    });

    // Room events
    socket.on("join_room", async ({ roomId }) => {
      socket.join(`room:${roomId}`);
      const user = await User.findById(userId).select('displayName username photoURL profileImage').lean();
      socket.to(`room:${roomId}`).emit("user_joined_room", { 
        userId, 
        userName: user?.displayName || user?.username || 'User',
        userAvatar: user?.photoURL || user?.profileImage,
        roomId 
      });
      console.log(`[SOCKET] User ${userId} joined room ${roomId}`);
    });

    socket.on("leave_room", async ({ roomId }) => {
      socket.leave(`room:${roomId}`);
      const user = await User.findById(userId).select('displayName username').lean();
      socket.to(`room:${roomId}`).emit("user_left_room", { 
        userId, 
        userName: user?.displayName || user?.username || 'User',
        roomId 
      });
      console.log(`[SOCKET] User ${userId} left room ${roomId}`);
    });

    // Typing indicators
    socket.on("typing_start", async ({ roomId, userId: typingUserId, userName }) => {
      const user = await User.findById(userId).select('displayName username').lean();
      socket.to(`room:${roomId}`).emit("typing_start", { 
        userId: typingUserId || userId, 
        userName: userName || user?.displayName || user?.username || 'User',
        roomId 
      });
    });

    socket.on("typing_stop", ({ roomId, userId: typingUserId }) => {
      socket.to(`room:${roomId}`).emit("typing_stop", { 
        userId: typingUserId || userId, 
        roomId 
      });
    });

    // Chat messages
    socket.on("send_message", async ({ roomId, message, userId: senderId, userName, userAvatar }) => {
      const user = await User.findById(userId).select('displayName username photoURL profileImage').lean();
      
      const messageData = {
        userId: senderId || userId,
        userName: userName || user?.displayName || user?.username || 'User',
        userAvatar: userAvatar || user?.photoURL || user?.profileImage,
        roomId,
        message,
        timestamp: new Date()
      };
      
      // Broadcast to all users in room (including sender for confirmation)
      io.to(`room:${roomId}`).emit("receive_message", messageData);
    });

    // Canvas events
    socket.on("canvas_draw", ({ roomId, stroke }) => {
      socket.to(`room:${roomId}`).emit("canvas_draw", { stroke, userId });
    });

    socket.on("canvas_erase", ({ roomId, area }) => {
      socket.to(`room:${roomId}`).emit("canvas_erase", { area, userId });
    });

    socket.on("canvas_clear", ({ roomId }) => {
      socket.to(`room:${roomId}`).emit("canvas_clear", { userId });
    });

    // Video call events
    socket.on("video_call_started", ({ roomId }) => {
      socket.to(`room:${roomId}`).emit("video_call_started", { userId, roomId });
    });

    socket.on("video_call_ended", ({ roomId }) => {
      socket.to(`room:${roomId}`).emit("video_call_ended", { userId, roomId });
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};

// Helper functions to emit events
export const emitNotification = (userId, notification) => {
  const socketId = userSockets.get(userId);
  if (socketId && io) {
    io.to(socketId).emit("notification_received", notification);
  }
};

export const emitPingRequest = (userId, pingRequest) => {
  const socketId = userSockets.get(userId);
  if (socketId && io) {
    io.to(socketId).emit("ping_request", pingRequest);
  }
};

export const emitPingAccepted = (userId, data) => {
  const socketId = userSockets.get(userId);
  if (socketId && io) {
    io.to(socketId).emit("ping_accepted", data);
  }
};

export const emitPingRejected = (userId, data) => {
  const socketId = userSockets.get(userId);
  if (socketId && io) {
    io.to(socketId).emit("ping_rejected", data);
  }
};

export const emitFriendRequest = (userId, request) => {
  const socketId = userSockets.get(userId);
  if (socketId && io) {
    io.to(socketId).emit("friend_request_received", request);
  }
};

export const emitFriendRequestAccepted = (userId, data) => {
  const socketId = userSockets.get(userId);
  if (socketId && io) {
    io.to(socketId).emit("friend_request_accepted", data);
  }
};

export const getUserSocketId = (userId) => {
  return userSockets.get(userId);
};

export const isUserOnline = (userId) => {
  return userSockets.has(userId);
};
