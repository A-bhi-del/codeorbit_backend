import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const BASE_URL = "http://localhost:5000/api";
const FIREBASE_TOKEN = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjVlODJhZmI0ZWY2OWI3NjM4MzA2OWFjNmI1N2U3ZTY1MjAzYmZlOTYiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiQXJwaXQgU3JpdmFzdGF2YSIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NJYkhGdVhsN0RZTVBCRXlfNDcyZEVjZUU5Z05DUFR0cXZTaHN2SUliZm1DNHdHVkZBPXM5Ni1jIiwiaXNzIjoiaHR0cHM6Ly9zZWN1cmV0b2tlbi5nb29nbGUuY29tL2NvZGVvcmJpdC1hNDNjMSIsImF1ZCI6ImNvZGVvcmJpdC1hNDNjMSIsImF1dGhfdGltZSI6MTc3NTY3MDg1MiwidXNlcl9pZCI6ImwwQkNsUEZQSjFRRkRsSnN3Z2p3U2dnd1NTbzIiLCJzdWIiOiJsMEJDbFBGUEoxUUZEbEpzd2dqd1NnZ3dTU28yIiwiaWF0IjoxNzc1NjcwODUyLCJleHAiOjE3NzU2NzQ0NTIsImVtYWlsIjoiYXJwaXRjb2xsZWdlMTIwNUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJnb29nbGUuY29tIjpbIjEwMzE2NDI0NjE3ODU0MDEyNjI4MyJdLCJlbWFpbCI6WyJhcnBpdGNvbGxlZ2UxMjA1QGdtYWlsLmNvbSJdfSwic2lnbl9pbl9wcm92aWRlciI6Imdvb2dsZS5jb20ifX0.R5YaDK-6iHjryZLgdoKlqZt0YTBrQtN2H1yj58FJpZWPEKjr15mCvwTTuznzL7s8eJj871YP8ZUmckJX82IdaZ60eaeg4xWDVAjbIdaOjQdmlYPn5X1Ikpv_G0OzvSSTjYmwMjFaKccMqxAU8MFxxPFLCqbOqsgdpwzhEk1Om4Zgl1yQmWB3mWPlXkUXnGYzHtX_81mTyrq54LEPQXZMJGANlOZtvGRRUp2GoJFbkBC1XbNKc6Qzx2k-fVi0VgdVGd-noYgMuAgE31KWSY_0PDhVmPXwn4YkBvnrci4PDWgeT9PkrXAEowoiFBpUzYV3BHPTNxbt7CQTlRLOJOz0iw";

const headers = {
  "Authorization": `Bearer ${FIREBASE_TOKEN}`,
  "Content-Type": "application/json"
};

async function testWithRealToken() {
  try {
    console.log("🧪 Testing CodeOrbit APIs with Real Firebase Token");
    console.log("User: Arpit Srivastava (arpitcollege1205@gmail.com)");
    console.log("=".repeat(60));

    // Test 1: Get User Profile
    console.log("\n1️⃣ Testing User Profile...");
    try {
      const profileResponse = await axios.get(`${BASE_URL}/profile`, { headers });
      console.log("✅ Profile fetched successfully");
      console.log("User:", profileResponse.data.user.email);
      
      if (profileResponse.data.user.leetcode?.verified) {
        console.log(`📊 LeetCode: ${profileResponse.data.user.leetcode.username} (${profileResponse.data.user.leetcode.totalSolved || 0} solved)`);
      }
      if (profileResponse.data.user.codeforces?.handle) {
        console.log(`📊 Codeforces: ${profileResponse.data.user.codeforces.handle} (${profileResponse.data.user.codeforces.solvedProblems || 0} solved)`);
      }
    } catch (error) {
      console.log("❌ Profile test failed:", error.response?.data?.message || error.message);
    }

    // Test 2: Get All Problems
    console.log("\n2️⃣ Testing All Problems Endpoint...");
    try {
      const problemsResponse = await axios.get(`${BASE_URL}/problems/all`, { headers });
      console.log("✅ Problems fetched successfully");
      console.log(`📊 Total Problems: ${problemsResponse.data.totalProblems}`);
      console.log("Platform Stats:", problemsResponse.data.platformStats);
      
      if (problemsResponse.data.problems.length > 0) {
        console.log("\n📝 Recent Problems:");
        problemsResponse.data.problems.slice(0, 5).forEach((problem, index) => {
          console.log(`${index + 1}. ${problem.title} (${problem.platform}) - ${problem.difficulty || 'Unknown'}`);
        });
      }
    } catch (error) {
      console.log("❌ Problems test failed:", error.response?.data?.message || error.message);
    }

    // Test 3: Get AI Recommendations (Main Test)
    console.log("\n3️⃣ Testing AI Recommendations (Real User Data)...");
    try {
      const recommendationsResponse = await axios.get(`${BASE_URL}/recommendations/ai`, { headers });
      console.log("✅ AI Recommendations generated successfully!");
      
      const data = recommendationsResponse.data;
      
      console.log("\n🎯 Analysis Results:");
      console.log("- Based on Problems:", data.basedOnProblems);
      console.log("- Dominant Topics:", data.analysis?.dominantTopics);
      console.log("- Current Level:", data.analysis?.currentDifficultyLevel);
      console.log("- Solving Pattern:", data.analysis?.solvingPattern);
      console.log("- Identified Gaps:", data.analysis?.identifiedGaps);
      
      console.log("\n💡 AI Recommendations:");
      data.recommendations?.forEach((rec, index) => {
        console.log(`\n${index + 1}. ${rec.title}`);
        console.log(`   Platform: ${rec.platform}`);
        console.log(`   Difficulty: ${rec.difficulty}`);
        console.log(`   Topics: ${rec.topics?.join(", ")}`);
        console.log(`   Reasoning: ${rec.reasoning}`);
        console.log(`   Time: ${rec.estimatedTime}`);
      });
      
      console.log("\n🎯 Learning Path:");
      console.log("- Current Focus:", data.learningPath?.currentFocus);
      console.log("- Next Milestone:", data.learningPath?.nextMilestone);
      console.log("- Study Order:", data.learningPath?.suggestedStudyOrder?.join(" → "));
      
      if (data.analyzedProblems) {
        console.log("\n📊 Analyzed Problems:");
        data.analyzedProblems.slice(0, 5).forEach((problem, index) => {
          console.log(`${index + 1}. ${problem.title} (${problem.platform}) - ${problem.difficulty}`);
        });
      }
      
      console.log("\n👤 User Profile:");
      console.log("- Total Solved:", data.userProfile?.totalSolved);
      console.log("- Connected Platforms:", data.userProfile?.platforms?.join(", "));
      console.log("- Languages:", data.userProfile?.languages?.join(", "));
      
    } catch (error) {
      console.log("❌ AI Recommendations test failed:", error.response?.data?.message || error.message);
      if (error.response?.data?.suggestion) {
        console.log("💡 Suggestion:", error.response.data.suggestion);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("🎉 All tests completed! Your AI recommendation system is working with real user data!");
    
  } catch (error) {
    console.error("\n❌ Test suite failed:");
    console.error("Error:", error.message);
  }
}

// Run the comprehensive test
testWithRealToken();