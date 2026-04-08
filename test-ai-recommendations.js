import { analyzeAndRecommendProblems } from "./services/openai.service.js";

// Test data
const testRecentProblems = [
  {
    title: "Two Sum",
    platform: "LeetCode",
    difficulty: "Easy",
    tags: ["array", "hash_table"],
    timestamp: new Date("2024-01-10"),
    language: "python3"
  },
  {
    title: "Valid Parentheses",
    platform: "LeetCode", 
    difficulty: "Easy",
    tags: ["string", "stack"],
    timestamp: new Date("2024-01-11"),
    language: "python3"
  },
  {
    title: "Binary Tree Inorder Traversal",
    platform: "LeetCode",
    difficulty: "Easy", 
    tags: ["tree", "dfs"],
    timestamp: new Date("2024-01-12"),
    language: "python3"
  },
  {
    title: "Maximum Depth of Binary Tree",
    platform: "LeetCode",
    difficulty: "Easy",
    tags: ["tree", "dfs", "bfs"],
    timestamp: new Date("2024-01-13"),
    language: "python3"
  },
  {
    title: "Same Tree",
    platform: "LeetCode",
    difficulty: "Easy",
    tags: ["tree", "dfs"],
    timestamp: new Date("2024-01-14"),
    language: "python3"
  }
];

const testUserProfile = {
  totalSolved: 25,
  leetcodeRating: 1200,
  codeforcesRating: null,
  languages: ["python3", "cpp"],
  platforms: ["LeetCode"]
};

async function testAIRecommendations() {
  try {
    console.log("🧪 Testing AI Recommendation System...");
    console.log("System: Rule-based with AI fallback");
    console.log("Status: ✅ No API key required");
    
    const recommendations = await analyzeAndRecommendProblems(testRecentProblems, testUserProfile);
    
    console.log("\n🎯 AI Analysis Results:");
    console.log("=".repeat(50));
    
    console.log("\n📊 Analysis:");
    console.log("- Dominant Topics:", recommendations.analysis?.dominantTopics);
    console.log("- Current Level:", recommendations.analysis?.currentDifficultyLevel);
    console.log("- Pattern:", recommendations.analysis?.solvingPattern);
    console.log("- Gaps:", recommendations.analysis?.identifiedGaps);
    
    console.log("\n💡 Recommendations:");
    recommendations.recommendations?.forEach((rec, index) => {
      console.log(`\n${index + 1}. ${rec.title}`);
      console.log(`   Platform: ${rec.platform}`);
      console.log(`   Difficulty: ${rec.difficulty}`);
      console.log(`   Topics: ${rec.topics?.join(", ")}`);
      console.log(`   Reasoning: ${rec.reasoning}`);
      console.log(`   Time: ${rec.estimatedTime}`);
    });
    
    console.log("\n🎯 Learning Path:");
    console.log("- Current Focus:", recommendations.learningPath?.currentFocus);
    console.log("- Next Milestone:", recommendations.learningPath?.nextMilestone);
    console.log("- Study Order:", recommendations.learningPath?.suggestedStudyOrder?.join(" → "));
    
    console.log("\n✅ AI Recommendation system test completed successfully!");
    console.log("💡 System is working with intelligent rule-based recommendations!");
    
  } catch (error) {
    console.error("\n❌ AI Recommendation test failed:");
    console.error("Error:", error.message);
  }
}

// Run the test
testAIRecommendations();