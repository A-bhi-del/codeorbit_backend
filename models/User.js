// import mongoose from "mongoose";

// const leetcodeSchema = new mongoose.Schema(
//   {
//     username: {
//       type: String
//     },

//     verified: {
//       type: Boolean,
//       default: false
//     },

//     verificationCode: {
//       type: String
//     },

//     codeExpiry: {
//       type: Date
//     },

//     totalSolved: {
//       type: Number,
//       default: 0
//     },

//     contestRating: {
//       type: Number,
//       default: 0
//     },

//     contestsPlayed: {
//       type: Number,
//       default: 0
//     },

//     totalActiveDays: {
//       type: Number,
//       default: 0
//     },

//     badges: [
//       {
//         name: String,
//         icon: String
//       }
//     ],

//     lastUpdated: {
//       type: Date
//     }
//   },
//   { _id: false } // Important: separate _id create nahi karega
// );

// const userSchema = new mongoose.Schema(
//   {
//     email: {
//       type: String,
//       required: true,
//       unique: true,
//       lowercase: true
//     },

//     password: {
//       type: String,
//       required: true
//     },

//     leetcode: leetcodeSchema
//   },
//   {
//     timestamps: true // createdAt & updatedAt auto add karega
//   }
// );

// export default mongoose.model("User", userSchema);

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

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: true
  },

  leetcode: leetcodeSchema,
  codeforces: codeforcesSchema,
  github: githubSchema
});

export default mongoose.model("User", userSchema);