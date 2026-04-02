import User from "../models/User.js";
import { fetchLeetCodeSolvedProblems } from "../services/leetcode.service.js";
import { fetchCodeforcesSolvedProblems } from "../services/codeforces.service.js";
import { analyzeAndRecommendProblems, getSpecificProblemRecommendations } from "../services/openai.service.js";

// Get AI-powered problem recommendations based on recent activity
export const getAIRecommendations = async (req, res) => {
  try {
    const userId = req.user;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Collect recent problems from all platforms
    const recentProblems = [];
    
    // Get LeetCode problems
    if (user.leetcode?.verified && user.leetcode?.username) {
      try {
        const leetcodeProblems = await fetchLeetCodeSolvedProblems(user.leetcode.username);
        recentProblems.push(...leetcodeProblems.slice(0, 15)); // Last 15 problems
      } catch (error) {
        console.error("Error fetching LeetCode for recommendations:", error.message);
      }
    }

    // Get Codeforces problems
    if (user.codeforces?.handle) {
      try {
        const codeforcesProblems = await fetchCodeforcesSolvedProblems(user.codeforces.handle);
        recentProblems.push(...codeforcesProblems.slice(0, 15)); // Last 15 problems
      } catch (error) {
        console.error("Error fetching Codeforces for recommendations:", error.message);
      }
    }

    if (recentProblems.length === 0) {
      return res.status(400).json({ 
        message: "No recent problems found. Please connect and solve some problems first." 
      });
    }

    // Sort by timestamp and take most recent 20
    recentProblems.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const recentActivity = recentProblems.slice(0, 20);

    // Create user profile for AI analysis
    const userProfile = {
      totalSolved: (user.leetcode?.totalSolved || 0) + (user.codeforces?.solvedProblems || 0),
      leetcodeRating: user.leetcode?.contestRating,
      codeforcesRating: user.codeforces?.rating,
      languages: getPreferredLanguages(recentActivity),
      platforms: getConnectedPlatforms(user)
    };

    // Get AI recommendations
    const aiRecommendations = await analyzeAndRecommendProblems(recentActivity, userProfile);

    // Store recommendations in user profile for future reference
    user.lastRecommendations = {
      generatedAt: new Date(),
      recommendations: aiRecommendations,
      basedOnProblems: recentActivity.length
    };
    await user.save();

    res.json({
      success: true,
      analysis: aiRecommendations.analysis,
      recommendations: aiRecommendations.recommendations,
      learningPath: aiRecommendations.learningPath,
      basedOnProblems: recentActivity.length,
      generatedAt: new Date(),
      message: "AI recommendations generated successfully"
    });

  } catch (error) {
    console.error("AI Recommendations Error:", error.message);
    res.status(500).json({ 
      message: "Failed to generate recommendations",
      error: error.message 
    });
  }
};

// Get specific recommendations for a topic and difficulty
export const getTopicRecommendations = async (req, res) => {
  try {
    const { topic, difficulty, platform } = req.query;

    if (!topic || !difficulty || !platform) {
      return res.status(400).json({ 
        message: "Please provide topic, difficulty, and platform parameters" 
      });
    }

    const recommendations = await getSpecificProblemRecommendations(topic, difficulty, platform);

    res.json({
      success: true,
      topic,
      difficulty,
      platform,
      problems: recommendations.problems,
      message: `Specific ${difficulty} ${topic} problems for ${platform}`
    });

  } catch (error) {
    console.error("Topic Recommendations Error:", error.message);
    res.status(500).json({ 
      message: "Failed to get topic recommendations",
      error: error.message 
    });
  }
};

// Get learning path suggestions
export const getLearningPath = async (req, res) => {
  try {
    const userId = req.user;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if we have recent recommendations
    if (user.lastRecommendations && 
        user.lastRecommendations.generatedAt > new Date(Date.now() - 24 * 60 * 60 * 1000)) {
      
      return res.json({
        success: true,
        learningPath: user.lastRecommendations.recommendations.learningPath,
        generatedAt: user.lastRecommendations.generatedAt,
        message: "Learning path from recent analysis"
      });
    }

    // If no recent recommendations, suggest generating new ones
    res.json({
      success: false,
      message: "No recent analysis found. Please generate new recommendations first.",
      suggestion: "Call /api/recommendations/ai endpoint to get fresh analysis"
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get problem difficulty progression suggestions
export const getDifficultyProgression = async (req, res) => {
  try {
    const userId = req.user;
    const { platform } = req.query;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let currentLevel = "Easy";
    let nextLevel = "Medium";
    let suggestions = [];

    // Determine current level based on platform
    if (platform === "leetcode" && user.leetcode?.contestRating) {
      if (user.leetcode.contestRating < 1400) {
        currentLevel = "Easy";
        nextLevel = "Medium";
      } else if (user.leetcode.contestRating < 1800) {
        currentLevel = "Medium";
        nextLevel = "Hard";
      } else {
        currentLevel = "Hard";
        nextLevel = "Expert";
      }
    } else if (platform === "codeforces" && user.codeforces?.rating) {
      if (user.codeforces.rating < 1200) {
        currentLevel = "800-1000";
        nextLevel = "1200-1400";
      } else if (user.codeforces.rating < 1600) {
        currentLevel = "1200-1400";
        nextLevel = "1600-1800";
      } else {
        currentLevel = "1600+";
        nextLevel = "2000+";
      }
    }

    suggestions = [
      `Continue practicing ${currentLevel} problems to build confidence`,
      `Gradually attempt ${nextLevel} problems (1-2 per week)`,
      `Focus on understanding solutions rather than just solving`,
      `Review and optimize your previous solutions`
    ];

    res.json({
      success: true,
      platform,
      currentLevel,
      nextLevel,
      suggestions,
      message: "Difficulty progression analysis"
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper functions
const getPreferredLanguages = (problems) => {
  const languageCount = {};
  problems.forEach(p => {
    if (p.language) {
      languageCount[p.language] = (languageCount[p.language] || 0) + 1;
    }
  });
  
  return Object.entries(languageCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([lang]) => lang);
};

const getConnectedPlatforms = (user) => {
  const platforms = [];
  if (user.leetcode?.verified) platforms.push("LeetCode");
  if (user.codeforces?.handle) platforms.push("Codeforces");
  if (user.github?.username) platforms.push("GitHub");
  if (user.codechef?.username) platforms.push("CodeChef");
  if (user.gfg?.username) platforms.push("GeeksforGeeks");
  return platforms;
};