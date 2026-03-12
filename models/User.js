import mongoose from "mongoose";

const leetcodeSchema = new mongoose.Schema({
  username: String,
  verified: { type: Boolean, default: false },
  verificationCode: String,
  codeExpiry: Date,
  totalSolved: Number,
  contestRating: Number,
  contestsPlayed: Number,
  totalActiveDays: Number,
  difficultyBreakdown: [
    {
      name: String,
      value: Number,
      color: String
    }
  ],
  badges: [
    {
      name: String,
      icon: String
    }
  ]
});

const codeforcesSchema = new mongoose.Schema({
  handle: String,
  rating: Number,
  maxRating: Number,
  rank: String,
  solvedProblems: Number,
  contestsPlayed: Number
});

const githubSchema = new mongoose.Schema({
  username: String,
  avatar: String,
  followers: Number,
  following: Number,
  publicRepos: Number,
  totalStars: Number,
  totalContributions: Number,
  contributionGraph: Array
});

const activitySchema = new mongoose.Schema({
  date: String,
  count: Number
});

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: function() {
      return !this.firebaseUid; // Password not required for Firebase users
    }
  },

  // Firebase fields
  firebaseUid: {
    type: String,
    unique: true,
    sparse: true
  },

  displayName: String,
  photoURL: String,
  provider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },

  activity: [activitySchema],
  leetcode: leetcodeSchema,
  codeforces: codeforcesSchema,
  github: githubSchema,

  lastSyncedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("User", userSchema);