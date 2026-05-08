import mongoose from "mongoose";

const friendRequestSchema = new mongoose.Schema({
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
    enum: ['pending', 'accepted', 'rejected', 'cancelled'],
    default: 'pending'
  },
  type: {
    type: String,
    enum: ['follow', 'friend'],
    default: 'follow'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  respondedAt: Date
});

// Indexes
friendRequestSchema.index({ sender: 1, receiver: 1 });
friendRequestSchema.index({ receiver: 1, status: 1 });

export default mongoose.model("FriendRequest", friendRequestSchema);
