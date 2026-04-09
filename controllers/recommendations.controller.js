import User from "../models/User.js";
import { fetchLeetCodeSolvedProblems } from "../services/leetcode.service.js";
import { fetchCodeforcesSolvedProblems } from "../services/codeforces.service.js";
import { analyzeAndRecommendProblems } from "../services/groq.service.js";

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



// Get learning path suggestions with real-time data analysis
export const getLearningPath = async (req, res) => {
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
        recentProblems.push(...leetcodeProblems.slice(0, 20)); // Last 20 problems
      } catch (error) {
        console.error("Error fetching LeetCode for learning path:", error.message);
      }
    }

    // Get Codeforces problems
    if (user.codeforces?.handle) {
      try {
        const codeforcesProblems = await fetchCodeforcesSolvedProblems(user.codeforces.handle);
        recentProblems.push(...codeforcesProblems.slice(0, 20)); // Last 20 problems
      } catch (error) {
        console.error("Error fetching Codeforces for learning path:", error.message);
      }
    }

    if (recentProblems.length === 0) {
      return res.status(400).json({ 
        message: "No recent problems found. Please connect platforms and solve some problems first.",
        suggestion: "Connect LeetCode or Codeforces and solve a few problems to get personalized learning path"
      });
    }

    // Sort by timestamp and take most recent 25
    recentProblems.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const recentActivity = recentProblems.slice(0, 25);

    console.log(`📚 Generating learning path from ${recentActivity.length} recent problems...`);

    // Analyze user's problem-solving patterns for learning path
    const topicFrequency = {};
    const difficultyLevels = [];
    const platforms = new Set();
    
    recentActivity.forEach(problem => {
      // Count topic frequency
      if (problem.tags && Array.isArray(problem.tags)) {
        problem.tags.forEach(tag => {
          const normalizedTag = tag.toLowerCase().replace(/[^a-z]/g, '_');
          topicFrequency[normalizedTag] = (topicFrequency[normalizedTag] || 0) + 1;
        });
      }
      
      // Track difficulty progression
      if (problem.difficulty) {
        difficultyLevels.push(problem.difficulty);
      }
      
      platforms.add(problem.platform);
    });

    // Find dominant topics (most frequently solved)
    const dominantTopics = Object.entries(topicFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([topic]) => topic);

    // Determine current skill level
    const recentDifficulties = difficultyLevels.slice(-10); // Last 10 problems
    const currentLevel = determineDifficultyLevel(recentDifficulties);

    // Generate comprehensive learning path
    const learningPath = generateLearningPath(dominantTopics, currentLevel, recentActivity.length);

    // Create user profile for context
    const userProfile = {
      totalSolved: (user.leetcode?.totalSolved || 0) + (user.codeforces?.solvedProblems || 0),
      leetcodeRating: user.leetcode?.contestRating,
      codeforcesRating: user.codeforces?.rating,
      platforms: Array.from(platforms),
      dominantTopics: dominantTopics
    };

    res.json({
      success: true,
      learningPath: learningPath,
      userProfile: userProfile,
      analysis: {
        dominantTopics: dominantTopics,
        currentDifficultyLevel: currentLevel,
        totalProblemsAnalyzed: recentActivity.length,
        platformDistribution: Array.from(platforms),
        topicDistribution: Object.entries(topicFrequency)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 8)
          .map(([topic, count]) => ({ topic, count }))
      },
      generatedAt: new Date(),
      dataSource: "Real-time analysis of recent solved problems",
      message: "Learning path generated based on your recent problem-solving patterns"
    });

  } catch (error) {
    console.error("Learning Path Error:", error.message);
    res.status(500).json({ 
      message: "Failed to generate learning path",
      error: error.message,
      suggestion: "Make sure you have solved some problems on connected platforms"
    });
  }
};

// Helper function to determine difficulty level
const determineDifficultyLevel = (difficulties) => {
  const counts = { Easy: 0, Medium: 0, Hard: 0 };
  difficulties.forEach(diff => {
    if (counts.hasOwnProperty(diff)) counts[diff]++;
  });
  
  const total = difficulties.length;
  if (total === 0) return "beginner";
  
  const easyPercent = counts.Easy / total;
  const mediumPercent = counts.Medium / total;
  const hardPercent = counts.Hard / total;
  
  if (hardPercent > 0.3) return "advanced";
  if (mediumPercent > 0.5) return "intermediate";
  if (easyPercent > 0.7) return "beginner";
  return "intermediate";
};

// Helper function to generate comprehensive learning path
const generateLearningPath = (dominantTopics, currentLevel, totalProblems) => {
  const allTopics = [
    "array", "string", "hash_table", "math", "two_pointers", "binary_search",
    "sorting", "stack", "queue", "linked_list", "tree", "graph", 
    "dynamic_programming", "backtracking", "greedy", "divide_and_conquer"
  ];

  // Topics user hasn't explored much
  const unexploredTopics = allTopics.filter(topic => !dominantTopics.includes(topic));
  
  // Create learning phases based on current level
  let phases = [];
  
  if (currentLevel === "beginner") {
    phases = [
      {
        phase: "Foundation Building",
        duration: "2-3 weeks",
        focus: "Master basic data structures and algorithms",
        topics: ["array", "string", "hash_table", "math"],
        goals: [
          "Solve 20+ easy array problems",
          "Master string manipulation techniques", 
          "Understand hash table usage patterns",
          "Build confidence with basic math problems"
        ],
        milestones: ["Solve 50 easy problems", "Understand time/space complexity"]
      },
      {
        phase: "Skill Expansion", 
        duration: "3-4 weeks",
        focus: "Learn intermediate concepts",
        topics: ["two_pointers", "binary_search", "sorting", "stack", "queue"],
        goals: [
          "Master two-pointer technique",
          "Implement binary search variations",
          "Understand different sorting algorithms",
          "Use stack/queue for problem solving"
        ],
        milestones: ["Solve first medium problem", "Implement basic algorithms"]
      }
    ];
  } else if (currentLevel === "intermediate") {
    phases = [
      {
        phase: "Strengthen Core Skills",
        duration: "2-3 weeks", 
        focus: `Deepen understanding of ${dominantTopics.slice(0,2).join(" and ")}`,
        topics: dominantTopics.slice(0, 3),
        goals: [
          `Master advanced ${dominantTopics[0]} techniques`,
          "Solve medium problems consistently",
          "Optimize solutions for better complexity",
          "Learn pattern recognition"
        ],
        milestones: ["Solve 30+ medium problems", "Achieve 80%+ success rate"]
      },
      {
        phase: "Explore New Domains",
        duration: "4-5 weeks",
        focus: "Learn advanced data structures and algorithms", 
        topics: unexploredTopics.slice(0, 4),
        goals: [
          "Understand tree traversal algorithms",
          "Learn basic graph algorithms (DFS/BFS)",
          "Introduction to dynamic programming",
          "Practice backtracking problems"
        ],
        milestones: ["Solve first hard problem", "Understand recursion deeply"]
      }
    ];
  } else { // advanced
    phases = [
      {
        phase: "Master Complex Problems",
        duration: "3-4 weeks",
        focus: "Tackle hard problems in strong areas",
        topics: dominantTopics.slice(0, 3),
        goals: [
          "Solve hard problems consistently",
          "Optimize solutions to best complexity",
          "Learn advanced problem patterns",
          "Practice contest-style problems"
        ],
        milestones: ["Solve 20+ hard problems", "Participate in contests"]
      },
      {
        phase: "Fill Knowledge Gaps",
        duration: "4-6 weeks", 
        focus: "Master remaining algorithmic concepts",
        topics: unexploredTopics,
        goals: [
          "Advanced dynamic programming patterns",
          "Complex graph algorithms",
          "Advanced tree algorithms",
          "System design basics"
        ],
        milestones: ["Well-rounded algorithmic knowledge", "Ready for interviews"]
      }
    ];
  }

  return {
    currentLevel: currentLevel,
    totalPhases: phases.length,
    estimatedDuration: phases.reduce((total, phase) => {
      const weeks = parseInt(phase.duration.split('-')[1] || phase.duration.split('-')[0]);
      return total + weeks;
    }, 0) + " weeks",
    phases: phases,
    nextSteps: [
      `Focus on ${phases[0].topics.slice(0,2).join(" and ")} problems`,
      `Aim to solve ${currentLevel === "beginner" ? "3-5" : currentLevel === "intermediate" ? "2-3" : "1-2"} problems daily`,
      "Track progress and adjust based on performance",
      "Review and understand solutions thoroughly"
    ],
    recommendedResources: [
      "LeetCode problem sets by topic",
      "Algorithm visualization tools", 
      "Competitive programming books",
      "Online algorithm courses"
    ]
  };
};
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