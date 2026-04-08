import User from "../models/User.js";
import { fetchLeetCodeSolvedProblems } from "../services/leetcode.service.js";
import { fetchCodeforcesSolvedProblems } from "../services/codeforces.service.js";
import { analyzeAndRecommendProblems } from "../services/openai.service.js";

// Get AI-powered problem recommendations based on recent activity
export const getAIRecommendations = async (req, res) => {
  try {
    const userId = req.user;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Collect recent problems from all platforms using existing endpoints
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
        message: "No recent problems found. Please connect platforms and solve some problems first.",
        suggestion: "Connect LeetCode or Codeforces and solve a few problems to get personalized recommendations"
      });
    }

    // Sort by timestamp and take most recent 20
    recentProblems.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const recentActivity = recentProblems.slice(0, 20);

    console.log(`📊 Analyzing ${recentActivity.length} recent problems for AI recommendations...`);
    console.log("Recent problems:", recentActivity.map(p => `${p.title} (${p.platform})`));

    // Create user profile for AI analysis
    const userProfile = {
      totalSolved: (user.leetcode?.totalSolved || 0) + (user.codeforces?.solvedProblems || 0),
      leetcodeRating: user.leetcode?.contestRating,
      codeforcesRating: user.codeforces?.rating,
      languages: getPreferredLanguages(recentActivity),
      platforms: getConnectedPlatforms(user),
      recentPlatforms: [...new Set(recentActivity.map(p => p.platform))]
    };

    console.log("User profile for AI:", userProfile);

    // Get AI recommendations based on actual user data
    const aiRecommendations = await analyzeAndRecommendProblems(recentActivity, userProfile);

    // Store recommendations in user profile for future reference
    user.lastRecommendations = {
      generatedAt: new Date(),
      recommendations: aiRecommendations,
      basedOnProblems: recentActivity.length,
      analyzedProblems: recentActivity.map(p => ({
        title: p.title,
        platform: p.platform,
        difficulty: p.difficulty || (p.rating ? getDifficultyFromRating(p.rating) : 'Unknown'),
        timestamp: p.timestamp
      }))
    };
    await user.save();

    res.json({
      success: true,
      analysis: aiRecommendations.analysis,
      recommendations: aiRecommendations.recommendations,
      learningPath: aiRecommendations.learningPath,
      basedOnProblems: recentActivity.length,
      analyzedProblems: recentActivity.map(p => ({
        title: p.title,
        platform: p.platform,
        difficulty: p.difficulty || (p.rating ? getDifficultyFromRating(p.rating) : 'Unknown')
      })),
      userProfile: {
        totalSolved: userProfile.totalSolved,
        platforms: userProfile.platforms,
        languages: userProfile.languages
      },
      generatedAt: new Date(),
      message: "AI recommendations generated based on your recent solved problems"
    });

  } catch (error) {
    console.error("AI Recommendations Error:", error.message);
    res.status(500).json({ 
      message: "Failed to generate recommendations",
      error: error.message,
      suggestion: "Make sure you have solved some problems on connected platforms"
    });
  }
};

// Helper function to determine difficulty from Codeforces rating
const getDifficultyFromRating = (rating) => {
  if (!rating) return "Unknown";
  if (rating <= 1000) return "Easy";
  if (rating <= 1500) return "Medium";
  return "Hard";
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