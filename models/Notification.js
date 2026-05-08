import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'friend_request',
      'request_accepted',
      'follow',
      'ping_request',
      'ping_accepted',
      'ping_rejected',
      'message',
      'room_invite'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  metadata: {
    roomId: String,
    requestId: String,
    channelId: String
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
notificationSchema.index({ receiver: 1, createdAt: -1 });
notificationSchema.index({ receiver: 1, read: 1 });

export default mongoose.model("Notification", notificationSchema);
