import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const BASE_URL = "https://codeorbit-backend-ck0m.onrender.com/api";
// const BASE_URL = "http://localhost:5000/api"; // Use this for local testing

// Test data
const testData = {
  github: {
    username: "octocat" // GitHub's official test account
  },
  codechef: {
    username: "admin" // Common test username
  }
};

async function testConnections() {
  console.log("🧪 Testing Platform Connections...");
  console.log("=" .repeat(60));
  
  // You need to provide a valid JWT token here
  const token = "your_jwt_token_here"; // Replace with actual token
  
  if (token === "your_jwt_token_here") {
    console.log("❌ Please provide a valid JWT token in the script");
    console.log("💡 To get a token:");
    console.log("   1. Login to your app");
    console.log("   2. Check browser dev tools > Application > Local Storage");
    console.log("   3. Copy the 'token' value");
    console.log("   4. Replace 'your_jwt_token_here' in this script");
    return;
  }
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // Test GitHub Connection
  console.log("\n🐙 Testing GitHub Connection...");
  try {
    const response = await axios.post(
      `${BASE_URL}/github/connect`,
      testData.github,
      { headers }
    );
    console.log("✅ GitHub connection successful!");
    console.log("Response:", response.data);
  } catch (error) {
    console.log("❌ GitHub connection failed:");
    console.log("Status:", error.response?.status);
    console.log("Error:", error.response?.data);
    console.log("Full error:", error.message);
  }

  // Test CodeChef Connection
  console.log("\n🍳 Testing CodeChef Connection...");
  try {
    const response = await axios.post(
      `${BASE_URL}/codechef/connect`,
      testData.codechef,
      { headers }
    );
    console.log("✅ CodeChef connection successful!");
    console.log("Response:", response.data);
  } catch (error) {
    console.log("❌ CodeChef connection failed:");
    console.log("Status:", error.response?.status);
    console.log("Error:", error.response?.data);
    console.log("Full error:", error.message);
  }

  // Test Learning Path API
  console.log("\n📚 Testing Learning Path API...");
  try {
    const response = await axios.get(
      `${BASE_URL}/recommendations/learning-path`,
      { headers }
    );
    console.log("✅ Learning path API successful!");
    console.log("Current Level:", response.data.learningPath?.currentLevel);
    console.log("Total Phases:", response.data.learningPath?.totalPhases);
    console.log("Estimated Duration:", response.data.learningPath?.estimatedDuration);
  } catch (error) {
    console.log("❌ Learning path API failed:");
    console.log("Status:", error.response?.status);
    console.log("Error:", error.response?.data);
  }

  console.log("\n" + "=" .repeat(60));
  console.log("🎉 Connection tests completed!");
}

// Environment checks
console.log("🔍 Environment Checks:");
console.log("GITHUB_TOKEN:", process.env.GITHUB_TOKEN ? "✅ Set" : "❌ Missing");
console.log("MONGO_URI:", process.env.MONGO_URI ? "✅ Set" : "❌ Missing");
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "✅ Set" : "❌ Missing");

testConnections();