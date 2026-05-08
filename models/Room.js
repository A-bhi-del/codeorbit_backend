import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  active: {
    type: Boolean,
    default: true
  },
  streamChannelId: String,
  canvasData: {
    strokes: [{
      type: {
        type: String,
        enum: ['draw', 'erase']
      },
      points: [Number],
      color: String,
      width: Number,
      timestamp: Date
    }]
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  closedAt: Date
});

// Indexes
roomSchema.index({ roomId: 1 });
roomSchema.index({ participants: 1 });
roomSchema.index({ active: 1 });

export default mongoose.model("Room", roomSchema);
