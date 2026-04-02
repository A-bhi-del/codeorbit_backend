import axios from "axios";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export const analyzeAndRecommendProblems = async (recentProblems, userProfile) => {
  try {
    const prompt = createRecommendationPrompt(recentProblems, userProfile);
    
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an expert competitive programming mentor. Analyze the user's recent problem-solving patterns and recommend the next best problems to solve. Focus on:
            1. Topic progression (if doing graphs, suggest next graph problems)
            2. Difficulty progression (gradually increase difficulty)
            3. Skill gaps identification
            4. Learning path optimization
            
            Always respond in valid JSON format with recommendations array.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const aiResponse = response.data.choices[0].message.content;
    return JSON.parse(aiResponse);
    
  } catch (error) {
    console.error("OpenAI API Error:", error.message);
    throw new Error("Failed to generate recommendations");
  }
};

const createRecommendationPrompt = (recentProblems, userProfile) => {
  const problemsAnalysis = recentProblems.map(p => ({
    title: p.title,
    platform: p.platform,
    difficulty: p.difficulty || getDifficultyFromRating(p.rating),
    topics: p.tags || extractTopicsFromTitle(p.title),
    timestamp: p.timestamp,
    language: p.language
  }));

  return `
Analyze this user's recent competitive programming activity and recommend next problems:

USER PROFILE:
- Total Problems Solved: ${userProfile.totalSolved || 0}
- LeetCode Rating: ${userProfile.leetcodeRating || 'N/A'}
- Codeforces Rating: ${userProfile.codeforcesRating || 'N/A'}
- Preferred Languages: ${userProfile.languages || 'Not specified'}

RECENT PROBLEMS (Last 20 submissions):
${JSON.stringify(problemsAnalysis, null, 2)}

ANALYSIS REQUIREMENTS:
1. Identify the most frequent topics/tags in recent submissions
2. Determine current difficulty level and suggest progression
3. Find knowledge gaps or weak areas
4. Recommend 5-8 specific problems with reasoning

RESPONSE FORMAT (JSON):
{
  "analysis": {
    "dominantTopics": ["array", "graph", "dp"],
    "currentDifficultyLevel": "easy-medium",
    "solvingPattern": "consistent graph problems, needs difficulty progression",
    "identifiedGaps": ["advanced graph algorithms", "dynamic programming"]
  },
  "recommendations": [
    {
      "title": "Problem Name",
      "platform": "LeetCode/Codeforces",
      "difficulty": "Medium",
      "topics": ["graph", "bfs"],
      "reasoning": "Next step in graph learning path",
      "priority": "high",
      "estimatedTime": "30-45 minutes",
      "learningObjective": "Master BFS traversal"
    }
  ],
  "learningPath": {
    "currentFocus": "Graph Algorithms",
    "nextMilestone": "Medium Graph Problems",
    "suggestedStudyOrder": ["BFS/DFS", "Shortest Path", "MST"]
  }
}

Provide specific, actionable recommendations based on the user's current progress and learning trajectory.`;
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

export const getSpecificProblemRecommendations = async (topic, difficulty, platform) => {
  try {
    const prompt = `
Recommend 5 specific ${difficulty} level ${topic} problems from ${platform} platform.

REQUIREMENTS:
- Provide actual problem names that exist on ${platform}
- Include brief problem description
- Mention key concepts to learn
- Order by learning progression

RESPONSE FORMAT (JSON):
{
  "problems": [
    {
      "title": "Actual Problem Name",
      "description": "Brief problem description",
      "keyConcepts": ["concept1", "concept2"],
      "difficulty": "${difficulty}",
      "estimatedTime": "20-30 minutes",
      "prerequisites": ["basic graph knowledge"]
    }
  ]
}`;

    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a competitive programming expert. Provide specific, real problem recommendations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const aiResponse = response.data.choices[0].message.content;
    return JSON.parse(aiResponse);
    
  } catch (error) {
    console.error("OpenAI Specific Recommendations Error:", error.message);
    throw new Error("Failed to get specific recommendations");
  }
};