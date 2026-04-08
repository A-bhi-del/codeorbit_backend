import dotenv from "dotenv";
import { analyzeAndRecommendProblems } from "./services/openai.service.js";
import { fetchLeetCodeSolvedProblems } from "./services/leetcode.service.js";

// Load environment variables
dotenv.config();

const testAIRecommendations = async () => {
  console.log('\n=== Testing AI Recommendations System ===\n');
  
  try {
    // Fetch recent problems for a user
    const username = 'Abhi_4352';
    console.log(`Fetching recent problems for: ${username}`);
    
    const recentProblems = await fetchLeetCodeSolvedProblems(username);
    console.log(`✓ Found ${recentProblems.length} recent problems`);
    
    if (recentProblems.length === 0) {
      console.log('No problems found to analyze');
      return;
    }

    // Create user profile
    const userProfile = {
      totalSolved: 860,
      leetcodeRating: 1602,
      codeforcesRating: null,
      languages: ['C++', 'Python'],
      platforms: ['LeetCode']
    };

    console.log('\nGenerating AI recommendations...');
    console.log('This may take 10-15 seconds...\n');

    // Get AI recommendations
    const recommendations = await analyzeAndRecommendProblems(
      recentProblems.slice(0, 15), // Use last 15 problems
      userProfile
    );

    console.log('✓ AI Recommendations Generated!\n');
    console.log('=== ANALYSIS ===');
    console.log(JSON.stringify(recommendations.analysis, null, 2));
    
    console.log('\n=== RECOMMENDED PROBLEMS ===');
    recommendations.recommendations.forEach((rec, index) => {
      console.log(`\n${index + 1}. ${rec.title}`);
      console.log(`   Platform: ${rec.platform}`);
      console.log(`   Difficulty: ${rec.difficulty}`);
      console.log(`   Topics: ${rec.topics.join(', ')}`);
      console.log(`   Reasoning: ${rec.reasoning}`);
      console.log(`   Priority: ${rec.priority}`);
    });

    console.log('\n=== LEARNING PATH ===');
    console.log(JSON.stringify(recommendations.learningPath, null, 2));

  } catch (error) {
    console.error('\n✗ Error:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
  }
};

testAIRecommendations();
