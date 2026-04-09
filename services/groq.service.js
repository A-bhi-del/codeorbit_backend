import axios from "axios";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const makeGroqRequest = async (messages, modelName = "llama-3.3-70b-versatile", retryCount = 0) => {
  const maxRetries = 3;
  const baseDelay = 1000; // 1 second
  
  try {
    console.log(`🚀 Trying Groq ${modelName}... (attempt ${retryCount + 1})`);
    
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: modelName,
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000,
        stream: false
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
        },
        timeout: 30000
      }
    );

    console.log(`✅ Groq ${modelName} responded successfully`);
    return response.data;
    
  } catch (error) {
    console.error(`❌ Groq ${modelName} failed:`, error.message);
    
    // Log more details for debugging
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
    
    // Handle rate limiting with exponential backoff
    if (error.response?.status === 429 && retryCount < maxRetries) {
      const delay = baseDelay * Math.pow(2, retryCount); // Exponential backoff
      console.log(`🔄 Rate limit hit, waiting ${delay}ms before retry...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return await makeGroqRequest(messages, modelName, retryCount + 1);
    }
    
    // If still failing after retries, try fallback model
    if ((error.response?.status === 429 || error.response?.status === 400) && modelName !== "llama-3.1-8b-instant") {
      console.log("🔄 Trying faster Groq model llama-3.1-8b-instant...");
      return await makeGroqRequest(messages, "llama-3.1-8b-instant", 0);
    }
    
    // Re-throw error for final handling
    throw error;
  }
};

// Generate intelligent recommendations based on real user data from /api/problems/all
const generateIntelligentRecommendations = (recentProblems, userProfile) => {
  console.log("🧠 Analyzing real user data from /api/problems/all endpoint...");
  console.log(`📊 Processing ${recentProblems.length} solved problems...`);
  
  // Analyze user's actual problem patterns from the API data structure
  const topicFrequency = {};
  const difficultyLevels = [];
  const platforms = new Set();
  const problemTypes = new Set();
  
  recentProblems.forEach(problem => {
    // Extract topics from tags array (from API response)
    if (problem.tags && Array.isArray(problem.tags)) {
      problem.tags.forEach(tag => {
        const normalizedTag = tag.toLowerCase().replace(/[^a-z]/g, '_');
        topicFrequency[normalizedTag] = (topicFrequency[normalizedTag] || 0) + 1;
      });
    }
    
    // Extract topics from problem title and description
    const titleTopics = extractTopicsFromTitle(problem.title);
    titleTopics.forEach(topic => {
      topicFrequency[topic] = (topicFrequency[topic] || 0) + 1;
    });
    
    // Track difficulty progression
    if (problem.difficulty) {
      difficultyLevels.push(problem.difficulty);
    }
    
    // Track platforms
    platforms.add(problem.platform);
    
    // Analyze problem types from title patterns
    const problemType = categorizeProblemType(problem.title, problem.tags);
    problemTypes.add(problemType);
  });
  
  // Find dominant topics (most frequently solved)
  const dominantTopics = Object.entries(topicFrequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 4)
    .map(([topic]) => topic);
  
  console.log("🎯 Dominant topics found:", dominantTopics);
  console.log("📈 Difficulty distribution:", difficultyLevels);
  
  // Determine current skill level
  const recentDifficulties = difficultyLevels.slice(-8); // Last 8 problems for better analysis
  const currentLevel = determineDifficultyLevel(recentDifficulties);
  
  // Generate next difficulty recommendations
  const nextDifficulty = getNextDifficulty(currentLevel);
  
  // Create intelligent recommendations based on user's actual solving patterns
  const recommendations = generateContextualRecommendations(
    dominantTopics, 
    currentLevel, 
    nextDifficulty, 
    Array.from(platforms),
    userProfile,
    problemTypes
  );
  
  return {
    analysis: {
      dominantTopics: dominantTopics.length > 0 ? dominantTopics : ["fundamental_algorithms"],
      currentDifficultyLevel: currentLevel,
      solvingPattern: `Recent focus: ${dominantTopics.slice(0,2).join(", ")} | ${getProgressionAdvice(currentLevel, nextDifficulty)}`,
      identifiedGaps: identifySkillGaps(dominantTopics, currentLevel),
      totalProblemsSolved: recentProblems.length,
      platformDistribution: Array.from(platforms),
      aiModel: "Intelligent Local Analysis",
      analysisTimestamp: new Date().toISOString(),
      dataSource: "Real user problems from /api/problems/all"
    },
    recommendations: recommendations,
    learningPath: {
      currentFocus: dominantTopics.length > 0 ? `${dominantTopics[0].replace('_', ' ')} mastery` : "Algorithm fundamentals",
      nextMilestone: `${nextDifficulty} difficulty progression`,
      suggestedStudyOrder: getSuggestedStudyOrder(dominantTopics, currentLevel)
    }
  };
};

const determineDifficultyLevel = (difficulties) => {
  const counts = { Easy: 0, Medium: 0, Hard: 0 };
  difficulties.forEach(diff => {
    if (counts.hasOwnProperty(diff)) counts[diff]++;
  });
  
  const total = difficulties.length;
  if (total === 0) return "beginner";
  
  const easyPercent = counts.Easy / total;
  const mediumPercent = counts.Medium / total;
  
  if (easyPercent > 0.7) return "easy";
  if (mediumPercent > 0.5) return "medium";
  if (counts.Hard > 0) return "advanced";
  return "easy-medium";
};

const getNextDifficulty = (currentLevel) => {
  const progression = {
    "beginner": "Easy",
    "easy": "Medium", 
    "easy-medium": "Medium",
    "medium": "Hard",
    "advanced": "Hard"
  };
  return progression[currentLevel] || "Medium";
};

const getProgressionAdvice = (current, next) => {
  if (current === "easy") return "ready to progress to medium difficulty";
  if (current === "medium") return "building strong foundation, continue with medium problems";
  if (current === "advanced") return "tackling challenging problems, focus on optimization";
  return "building fundamental skills";
};

const identifySkillGaps = (dominantTopics, level) => {
  const allTopics = ["array", "string", "tree", "graph", "dp", "math", "sorting", "binary_search"];
  const gaps = allTopics.filter(topic => !dominantTopics.includes(topic));
  
  if (level === "easy") {
    return gaps.slice(0, 2); // Focus on 2 new topics
  }
  return gaps.slice(0, 3); // More advanced users can handle more topics
};

const getSuggestedStudyOrder = (dominantTopics, level) => {
  const basicOrder = ["Array & String", "Linked Lists", "Trees", "Graphs"];
  const advancedOrder = ["Dynamic Programming", "Advanced Graphs", "System Design"];
  
  if (level === "easy" || level === "beginner") {
    return basicOrder;
  }
  return [...basicOrder, ...advancedOrder];
};

const categorizeProblemType = (title, tags) => {
  const titleLower = title.toLowerCase();
  
  // Check tags first for more accurate categorization
  if (tags && Array.isArray(tags)) {
    const tagString = tags.join(' ').toLowerCase();
    if (tagString.includes('tree') || tagString.includes('binary tree')) return 'tree_algorithms';
    if (tagString.includes('graph') || tagString.includes('dfs') || tagString.includes('bfs')) return 'graph_algorithms';
    if (tagString.includes('dynamic programming') || tagString.includes('dp')) return 'dynamic_programming';
    if (tagString.includes('array') || tagString.includes('sorting')) return 'array_manipulation';
    if (tagString.includes('string') || tagString.includes('hash')) return 'string_processing';
    if (tagString.includes('math') || tagString.includes('number')) return 'mathematical';
    if (tagString.includes('simulation') || tagString.includes('implementation')) return 'simulation';
    if (tagString.includes('binary search') || tagString.includes('divide')) return 'search_algorithms';
  }
  
  // Fallback to title analysis
  if (titleLower.includes('tree') || titleLower.includes('binary')) return 'tree_algorithms';
  if (titleLower.includes('graph') || titleLower.includes('path') || titleLower.includes('node')) return 'graph_algorithms';
  if (titleLower.includes('array') || titleLower.includes('matrix') || titleLower.includes('grid')) return 'array_manipulation';
  if (titleLower.includes('string') || titleLower.includes('substring') || titleLower.includes('character')) return 'string_processing';
  if (titleLower.includes('robot') || titleLower.includes('simulation') || titleLower.includes('walk')) return 'simulation';
  if (titleLower.includes('maximum') || titleLower.includes('minimum') || titleLower.includes('sum')) return 'optimization';
  
  return 'general_algorithms';
};

const generateContextualRecommendations = (topics, currentLevel, nextDifficulty, platforms, userProfile, problemTypes) => {
  const recommendations = [];
  const preferredPlatform = platforms.includes("LeetCode") ? "LeetCode" : "Codeforces";
  
  // Convert problemTypes to Set if it's an array
  const problemTypeSet = problemTypes instanceof Set ? problemTypes : new Set(problemTypes || []);
  
  console.log(`🎯 Generating recommendations for topics: ${topics.join(", ")}`);
  console.log(`📊 Current level: ${currentLevel} → Next: ${nextDifficulty}`);
  
  // Recommendation 1: Continue with dominant topic but increase difficulty
  if (topics.includes("array") || topics.includes("matrix") || topics.includes("grid")) {
    recommendations.push({
      title: "Rotate Image",
      platform: preferredPlatform,
      difficulty: nextDifficulty,
      topics: ["array", "matrix", "math"],
      reasoning: `Building on your ${topics.filter(t => t.includes('array') || t.includes('matrix')).join(' and ')} experience`,
      priority: "high",
      estimatedTime: "25-40 minutes",
      learningObjective: "Master in-place matrix manipulation techniques",
      link: preferredPlatform === "LeetCode" ? "https://leetcode.com/problems/rotate-image/" : "https://codeforces.com/problemset"
    });
  }
  
  // Recommendation 2: Tree algorithms if user has been doing tree problems
  if (topics.includes("tree") || topics.includes("binary_tree") || problemTypeSet.has('tree_algorithms')) {
    recommendations.push({
      title: "Validate Binary Search Tree",
      platform: preferredPlatform,
      difficulty: nextDifficulty,
      topics: ["tree", "dfs", "binary_search_tree"],
      reasoning: "Natural progression from your tree problem solving pattern",
      priority: "high",
      estimatedTime: "30-45 minutes",
      learningObjective: "Understand BST properties and validation techniques",
      link: preferredPlatform === "LeetCode" ? "https://leetcode.com/problems/validate-binary-search-tree/" : "https://codeforces.com/problemset"
    });
  }
  
  // Recommendation 3: String processing if user has been doing string problems
  if (topics.includes("string") || problemTypeSet.has('string_processing')) {
    recommendations.push({
      title: "Longest Palindromic Substring",
      platform: preferredPlatform,
      difficulty: nextDifficulty,
      topics: ["string", "dynamic_programming", "expand_around_centers"],
      reasoning: `Advancing your string manipulation skills from recent ${topics.filter(t => t.includes('string')).join(' and ')} practice`,
      priority: "high",
      estimatedTime: "35-50 minutes",
      learningObjective: "Learn multiple approaches to palindrome detection",
      link: preferredPlatform === "LeetCode" ? "https://leetcode.com/problems/longest-palindromic-substring/" : "https://codeforces.com/problemset"
    });
  }
  
  // Recommendation 4: Simulation problems if user has been doing robot/simulation problems
  if (topics.includes("simulation") || problemTypeSet.has('simulation')) {
    recommendations.push({
      title: "Spiral Matrix",
      platform: preferredPlatform,
      difficulty: currentLevel === "Easy" ? "Medium" : nextDifficulty,
      topics: ["array", "matrix", "simulation"],
      reasoning: "Perfect follow-up to your recent simulation and matrix problems",
      priority: "medium",
      estimatedTime: "25-35 minutes",
      learningObjective: "Master directional traversal patterns",
      link: preferredPlatform === "LeetCode" ? "https://leetcode.com/problems/spiral-matrix/" : "https://codeforces.com/problemset"
    });
  }
  
  // Recommendation 5: Introduce new topic if user is ready
  if (currentLevel !== "beginner" && !topics.includes("graph")) {
    recommendations.push({
      title: "Number of Islands",
      platform: preferredPlatform,
      difficulty: currentLevel === "Easy" ? "Medium" : "Easy",
      topics: ["graph", "dfs", "bfs", "matrix"],
      reasoning: "Introduce graph concepts to expand your algorithmic toolkit",
      priority: "medium",
      estimatedTime: "40-60 minutes",
      learningObjective: "Learn fundamental graph traversal techniques",
      link: preferredPlatform === "LeetCode" ? "https://leetcode.com/problems/number-of-islands/" : "https://codeforces.com/problemset"
    });
  }
  
  // Recommendation 6: Dynamic Programming introduction if ready
  if ((currentLevel === "medium" || currentLevel === "advanced") && !topics.includes("dynamic_programming")) {
    recommendations.push({
      title: "House Robber",
      platform: preferredPlatform,
      difficulty: "Easy",
      topics: ["dynamic_programming", "array"],
      reasoning: "Start with fundamental DP concepts based on your current skill level",
      priority: "medium",
      estimatedTime: "20-30 minutes",
      learningObjective: "Introduction to dynamic programming thinking",
      link: preferredPlatform === "LeetCode" ? "https://leetcode.com/problems/house-robber/" : "https://codeforces.com/problemset"
    });
  }
  
  // Recommendation 7: Binary Search if not explored
  if (!topics.includes("binary_search") && currentLevel !== "beginner") {
    recommendations.push({
      title: "Search in Rotated Sorted Array",
      platform: preferredPlatform,
      difficulty: nextDifficulty,
      topics: ["array", "binary_search"],
      reasoning: "Add binary search skills to complement your array problem-solving experience",
      priority: "low",
      estimatedTime: "30-45 minutes",
      learningObjective: "Master modified binary search techniques",
      link: preferredPlatform === "LeetCode" ? "https://leetcode.com/problems/search-in-rotated-sorted-array/" : "https://codeforces.com/problemset"
    });
  }
  
  return recommendations.slice(0, 6); // Return top 6 recommendations
};

export const analyzeAndRecommendProblems = async (recentProblems, userProfile) => {
  console.log(`📊 Analyzing ${recentProblems.length} real problems from /api/problems/all endpoint...`);
  
  // Check if Groq API key is available
  if (!process.env.GROQ_API_KEY) {
    console.log("⚠️ Groq API key not found, using intelligent fallback analysis...");
    return generateIntelligentRecommendations(recentProblems, userProfile);
  }
  
  // Log sample of the data structure for debugging
  if (recentProblems.length > 0) {
    console.log("📋 Sample problem structure:", {
      title: recentProblems[0].title,
      platform: recentProblems[0].platform,
      difficulty: recentProblems[0].difficulty,
      tags: recentProblems[0].tags,
      timestamp: recentProblems[0].timestamp
    });
  }
  
  const prompt = createRecommendationPrompt(recentProblems, userProfile);
  
  const messages = [
    {
      role: "system",
      content: `You are an expert competitive programming mentor analyzing real user data from a coding platform API. 

The user has solved ${recentProblems.length} problems recently. Analyze their patterns and provide intelligent recommendations.

Key Analysis Points:
1. Topic Frequency: Look at the 'tags' array in each problem to identify dominant topics
2. Difficulty Progression: Analyze the 'difficulty' field to understand current skill level  
3. Platform Preferences: Note which platforms they use most
4. Problem Types: Consider the variety of problem types they've solved
5. Recency: More recent problems (by timestamp) should have higher weight in analysis

Always respond in valid JSON format with specific, actionable recommendations.`
    },
    {
      role: "user",
      content: prompt
    }
  ];

  try {
    // Try different Groq models with better error handling
    let response;
    try {
      console.log("🚀 Requesting analysis from Groq Llama-3.3-70B (high-performance)...");
      response = await makeGroqRequest(messages, "llama-3.3-70b-versatile");
    } catch (error) {
      if (error.response?.status === 429) {
        console.log("💡 Rate limit reached. Your Groq API key may have exceeded its quota.");
        console.log("💡 Solutions:");
        console.log("   1. Wait a few seconds and try again (Groq resets quickly)");
        console.log("   2. Check your Groq usage dashboard");
        console.log("   3. Groq has very generous free limits");
        console.log("🔄 Using intelligent local analysis instead...");
      }
      throw error;
    }
    
    const aiResponse = response.choices[0].message.content;
    console.log("✅ Groq analysis completed successfully");
    
    // Clean the response to extract JSON
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log("⚠️ Invalid JSON from Groq, using intelligent fallback analysis...");
      return generateIntelligentRecommendations(recentProblems, userProfile);
    }
    
    const aiResult = JSON.parse(jsonMatch[0]);
    
    // Enhance AI result with additional insights
    aiResult.analysis.totalProblemsAnalyzed = recentProblems.length;
    aiResult.analysis.dataSource = "Real user problems from /api/problems/all";
    aiResult.analysis.analysisTimestamp = new Date().toISOString();
    aiResult.analysis.aiModel = "Groq Llama-3.3-70B";
    
    console.log("🎯 AI Analysis Summary:");
    console.log("- Dominant Topics:", aiResult.analysis.dominantTopics);
    console.log("- Current Level:", aiResult.analysis.currentDifficultyLevel);
    console.log("- Recommendations:", aiResult.recommendations.length);
    
    return aiResult;
    
  } catch (error) {
    console.error("❌ Groq API Error:", error.message);
    
    if (error.response?.status === 429) {
      console.log("💡 Groq Rate Limit Solutions:");
      console.log("   • Wait 10-30 seconds and try again (Groq resets very quickly)");
      console.log("   • Check your Groq usage at https://console.groq.com/");
      console.log("   • Groq has very generous free tier limits");
      console.log("   • The system will use intelligent local analysis as backup");
    }
    
    console.log("🔄 Using intelligent analysis of real user data as fallback...");
    const fallbackResult = generateIntelligentRecommendations(recentProblems, userProfile);
    
    // Add fallback indicator
    fallbackResult.analysis.aiModel = "Intelligent Local Analysis (Groq unavailable)";
    fallbackResult.analysis.fallbackReason = error.response?.status === 429 ? "Rate limit exceeded" : "API error";
    
    return fallbackResult;
  }
};

const createRecommendationPrompt = (recentProblems, userProfile) => {
  // Process the API data structure properly
  const problemsAnalysis = recentProblems.map(p => ({
    title: p.title,
    platform: p.platform,
    difficulty: p.difficulty || 'Unknown',
    topics: p.tags || extractTopicsFromTitle(p.title),
    timestamp: p.timestamp,
    questionId: p.questionId,
    likes: p.likes,
    dislikes: p.dislikes,
    problemType: categorizeProblemType(p.title, p.tags)
  }));

  // Analyze patterns from the actual data
  const topicFrequency = {};
  const difficultyDistribution = {};
  
  problemsAnalysis.forEach(p => {
    // Count topic frequency
    if (p.topics && Array.isArray(p.topics)) {
      p.topics.forEach(topic => {
        topicFrequency[topic] = (topicFrequency[topic] || 0) + 1;
      });
    }
    
    // Count difficulty distribution
    difficultyDistribution[p.difficulty] = (difficultyDistribution[p.difficulty] || 0) + 1;
  });

  return `
Analyze this user's competitive programming activity from their actual solved problems and recommend next problems:

USER PROFILE:
- Total Problems Solved: ${userProfile.totalSolved || 0}
- LeetCode Rating: ${userProfile.leetcodeRating || 'N/A'}
- Codeforces Rating: ${userProfile.codeforcesRating || 'N/A'}
- Preferred Languages: ${userProfile.languages?.join(', ') || 'Not specified'}
- Connected Platforms: ${userProfile.platforms?.join(', ') || 'Not specified'}

RECENT SOLVING ACTIVITY (Last ${recentProblems.length} problems):
${JSON.stringify(problemsAnalysis, null, 2)}

PATTERN ANALYSIS:
- Most Frequent Topics: ${Object.entries(topicFrequency).sort(([,a], [,b]) => b - a).slice(0, 5).map(([topic, count]) => `${topic}(${count})`).join(', ')}
- Difficulty Distribution: ${Object.entries(difficultyDistribution).map(([diff, count]) => `${diff}(${count})`).join(', ')}

ANALYSIS REQUIREMENTS:
1. Identify the user's strongest topic areas based on frequency and recent activity
2. Determine current skill level from difficulty progression and problem complexity
3. Find knowledge gaps or areas for improvement
4. Recommend 5-7 specific problems that naturally progress from their current patterns
5. Consider the user's platform preferences and problem-solving trends

RESPONSE FORMAT (JSON):
{
  "analysis": {
    "dominantTopics": ["most_frequent_topic1", "most_frequent_topic2", "most_frequent_topic3"],
    "currentDifficultyLevel": "easy|medium|advanced",
    "solvingPattern": "description of user's recent problem-solving patterns and trends",
    "identifiedGaps": ["skill_gap1", "skill_gap2"],
    "strengthAreas": ["strong_topic1", "strong_topic2"]
  },
  "recommendations": [
    {
      "title": "Specific Problem Name",
      "platform": "LeetCode|Codeforces",
      "difficulty": "Easy|Medium|Hard",
      "topics": ["topic1", "topic2"],
      "reasoning": "Why this problem fits the user's learning path",
      "priority": "high|medium|low",
      "estimatedTime": "20-30 minutes",
      "learningObjective": "What the user will learn from this problem",
      "link": "direct_problem_link"
    }
  ],
  "learningPath": {
    "currentFocus": "Current area of strength/focus",
    "nextMilestone": "Next skill level or topic to master",
    "suggestedStudyOrder": ["step1", "step2", "step3"]
  }
}

Provide intelligent, personalized recommendations based on the user's actual problem-solving history and natural skill progression.`;
};

const getDifficultyFromRating = (rating) => {
  if (!rating) return "Unknown";
  if (rating <= 1000) return "Easy";
  if (rating <= 1500) return "Medium";
  return "Hard";
};

const extractTopicsFromTitle = (title) => {
  const topicKeywords = {
    "array": ["array", "subarray", "sum", "maximum", "minimum"],
    "string": ["string", "substring", "palindrome", "anagram"],
    "graph": ["graph", "tree", "node", "path", "cycle", "connected"],
    "dp": ["dynamic", "programming", "dp", "fibonacci", "climb"],
    "math": ["math", "number", "digit", "prime", "factorial"],
    "sorting": ["sort", "merge", "quick", "heap"],
    "binary_search": ["binary", "search", "sorted", "target"],
    "two_pointers": ["two", "pointer", "left", "right"],
    "sliding_window": ["window", "sliding", "subarray", "substring"]
  };

  const detectedTopics = [];
  const lowerTitle = title.toLowerCase();
  
  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(keyword => lowerTitle.includes(keyword))) {
      detectedTopics.push(topic);
    }
  }
  
  return detectedTopics.length > 0 ? detectedTopics : ["general"];
};

