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

const codechefSchema = new mongoose.Schema({
  username: String,
  rating: Number,
  highestRating: Number,
  stars: String,
  globalRank: Number,
  countryRank: Number,
  problemsSolved: Number,
  lastFetched: Date
});

const gfgSchema = new mongoose.Schema({
  username: String,
  score: Number,
  problemsSolved: Number,
  codingScore: Number,
  lastFetched: Date
});

const activitySchema = new mongoose.Schema({
  date: String,
  count: Number
});

const recommendationSchema = new mongoose.Schema({
  generatedAt: Date,
  recommendations: {
    analysis: {
      dominantTopics: [String],
      currentDifficultyLevel: String,
      solvingPattern: String,
      identifiedGaps: [String]
    },
    recommendations: [
      {
        title: String,
        platform: String,
        difficulty: String,
        topics: [String],
        reasoning: String,
        priority: String,
        estimatedTime: String,
        learningObjective: String
      }
    ],
    learningPath: {
      currentFocus: String,
      nextMilestone: String,
      suggestedStudyOrder: [String]
    }
  },
  basedOnProblems: Number
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
  codechef: codechefSchema,
  gfg: gfgSchema,

  // AI Recommendations
  lastRecommendations: recommendationSchema,

  lastSyncedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("User", userSchema);