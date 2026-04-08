import axios from "axios";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

export const analyzeAndRecommendProblems = async (recentProblems, userProfile) => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not found in environment variables");
  }

  const prompt = createRecommendationPrompt(recentProblems, userProfile);
  
  console.log('Calling Gemini API...');
  
  const response = await axios.post(
    `${GEMINI_API_URL}?key=${apiKey}`,
    {
      contents: [{
        parts: [{
          text: `You are an expert competitive programming mentor. Analyze the user's recent problem-solving patterns and recommend the next best problems to solve.

${prompt}

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks, no extra text):
{
  "analysis": {
    "dominantTopics": ["array", "graph", "string"],
    "currentDifficultyLevel": "medium",
    "solvingPattern": "User is consistently solving array and simulation problems at medium difficulty",
    "identifiedGaps": ["dynamic programming", "tree", "hash table"]
  },
  "recommendations": [
    {
      "title": "Two Sum",
      "platform": "LeetCode",
      "difficulty": "Medium",
      "topics": ["array", "hash table"],
      "reasoning": "Build on array skills while learning hash tables",
      "priority": "high",
      "estimatedTime": "30 minutes",
      "learningObjective": "Master hash table for O(n) solutions"
    }
  ],
  "learningPath": {
    "currentFocus": "Array and Simulation",
    "nextMilestone": "Master Medium difficulty problems",
    "suggestedStudyOrder": ["Arrays", "Hash Tables", "Dynamic Programming", "Trees", "Graphs"]
  }
}

Provide 5-7 specific problem recommendations.`
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000,
        topP: 0.8,
        topK: 40
      }
    },
    {
      headers: {
        "Content-Type": "application/json"
      },
      timeout: 30000
    }
  );

  if (!response.data.candidates || !response.data.candidates[0]) {
    throw new Error("Invalid response from Gemini API");
  }

  const aiResponse = response.data.candidates[0].content.parts[0].text;
  console.log('Gemini API response received');
  
  // Clean up response (remove markdown code blocks if present)
  const cleanedResponse = aiResponse
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();
  
  return JSON.parse(cleanedResponse);
};

const createRecommendationPrompt = (recentProblems, userProfile) => {
  const problemsAnalysis = recentProblems.map(p => ({
    title: p.title,
    platform: p.platform,
    difficulty: p.difficulty || "Unknown",
    topics: p.tags || [],
    timestamp: p.timestamp
  }));

  return `
USER PROFILE:
- Total Problems Solved: ${userProfile.totalSolved || 0}
- LeetCode Rating: ${userProfile.leetcodeRating || 'N/A'}
- Codeforces Rating: ${userProfile.codeforcesRating || 'N/A'}
- Preferred Languages: ${userProfile.languages?.join(', ') || 'Not specified'}
- Connected Platforms: ${userProfile.platforms?.join(', ') || 'LeetCode'}

RECENT PROBLEMS (Last ${recentProblems.length} submissions):
${JSON.stringify(problemsAnalysis, null, 2)}

ANALYSIS REQUIREMENTS:
1. Identify the 3 most frequent topics in recent submissions
2. Determine current difficulty level based on recent problems
3. Identify 3-4 knowledge gaps (topics not practiced much)
4. Recommend 5-7 specific problems that:
   - Build on current strengths
   - Address identified gaps
   - Gradually increase difficulty
   - Follow a logical learning progression
5. Create a clear learning path with actionable steps`;
};

export const getSpecificProblemRecommendations = async (topic, difficulty, platform) => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not found in environment variables");
  }

  const response = await axios.post(
    `${GEMINI_API_URL}?key=${apiKey}`,
    {
      contents: [{
        parts: [{
          text: `Recommend 5 specific ${difficulty} level ${topic} problems from ${platform} platform.

Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "problems": [
    {
      "title": "Actual Problem Name from ${platform}",
      "description": "Brief problem description",
      "keyConcepts": ["concept1", "concept2"],
      "difficulty": "${difficulty}",
      "estimatedTime": "20-30 minutes",
      "prerequisites": ["basic ${topic} knowledge"]
    }
  ]
}

Provide real problem names that exist on ${platform}.`
        }]
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1000
      }
    },
    {
      headers: {
        "Content-Type": "application/json"
      },
      timeout: 20000
    }
  );

  const aiResponse = response.data.candidates[0].content.parts[0].text;
  const cleanedResponse = aiResponse
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();
  
  return JSON.parse(cleanedResponse);
};
