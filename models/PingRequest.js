import mongoose from "mongoose";

const pingRequestSchema = new mongoose.Schema({
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
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'expired'],
    default: 'pending'
  },
  message: String,
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
  },
  respondedAt: Date
});

// Indexes
pingRequestSchema.index({ receiver: 1, status: 1 });
pingRequestSchema.index({ sender: 1, status: 1 });
pingRequestSchema.index({ expiresAt: 1 });

export default mongoose.model("PingRequest", pingRequestSchema);
