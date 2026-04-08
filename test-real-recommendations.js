import express from "express";
import { getAIRecommendations } from "./controllers/recommendations.controller.js";
import User from "./models/User.js";
import { connectDB } from "./config/db.js";
import dotenv from "dotenv";

dotenv.config();

// Mock request and response for testing
const createMockReqRes = (userId) => {
  const req = {
    user: userId,
    headers: {},
    body: {}
  };

  const res = {
    status: (code) => ({
      json: (data) => {
        console.log(`Status: ${code}`);
        console.log("Response:", JSON.stringify(data, null, 2));
        return res;
      }
    }),
    json: (data) => {
      console.log("Response:", JSON.stringify(data, null, 2));
      return res;
    }
  };

  return { req, res };
};

async function testRealRecommendations() {
  try {
    console.log("🧪 Testing Real User Recommendations...");
    
    // Connect to database
    await connectDB();
    console.log("✅ Connected to database");

    // Find a user with connected platforms
    const user = await User.findOne({
      $or: [
        { "leetcode.verified": true },
        { "codeforces.handle": { $exists: true } }
      ]
    });

    if (!user) {
      console.log("❌ No users found with connected platforms");
      console.log("💡 Please connect LeetCode or Codeforces first and solve some problems");
      return;
    }

    console.log(`📊 Testing with user: ${user.email}`);
    console.log("Connected platforms:");
    if (user.leetcode?.verified) {
      console.log(`- LeetCode: ${user.leetcode.username} (${user.leetcode.totalSolved || 0} solved)`);
    }
    if (user.codeforces?.handle) {
      console.log(`- Codeforces: ${user.codeforces.handle} (${user.codeforces.solvedProblems || 0} solved)`);
    }

    // Create mock request/response
    const { req, res } = createMockReqRes(user._id);

    console.log("\n🤖 Generating AI recommendations based on real user data...");
    console.log("=".repeat(60));

    // Call the actual recommendation endpoint
    await getAIRecommendations(req, res);

  } catch (error) {
    console.error("\n❌ Test failed:");
    console.error("Error:", error.message);
  } finally {
    process.exit(0);
  }
}

// Run the test
testRealRecommendations();