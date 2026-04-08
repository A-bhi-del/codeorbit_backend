// Fallback recommendation system without AI API
export const analyzeAndRecommendProblems = async (recentProblems, userProfile) => {
  const analysis = analyzeProblems(recentProblems);
  const recommendations = generateRecommendations(analysis, userProfile);
  const learningPath = createLearningPath(analysis, userProfile);
  
  return { analysis, recommendations, learningPath };
};

const analyzeProblems = (problems) => {
  const topicCount = {};
  const difficultyCount = { Easy: 0, Medium: 0, Hard: 0 };
  
  problems.forEach(problem => {
    const topics = problem.tags || ["General"];
    topics.forEach(topic => {
      topicCount[topic] = (topicCount[topic] || 0) + 1;
    });
    
    const difficulty = problem.difficulty || "Easy";
    if (difficultyCount[difficulty] !== undefined) {
      difficultyCount[difficulty]++;
    }
  });
  
  const dominantTopics = Object.entries(topicCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([topic]) => topic);
  
  const totalProblems = problems.length;
  const hardPercent = (difficultyCount.Hard / totalProblems) * 100;
  const mediumPercent = (difficultyCount.Medium / totalProblems) * 100;
  
  let currentDifficultyLevel = "Easy";
  if (hardPercent > 30) currentDifficultyLevel = "Hard";
  else if (mediumPercent > 40) currentDifficultyLevel = "Medium";
  
  const allTopics = ["Array", "String", "Hash Table", "Dynamic Programming", "Tree", "Graph"];
  const identifiedGaps = allTopics.filter(topic => !dominantTopics.includes(topic)).slice(0, 3);
  
  return {
    dominantTopics,
    currentDifficultyLevel,
    solvingPattern: `Focused on ${dominantTopics.join(", ")}`,
    identifiedGaps,
    difficultyDistribution: difficultyCount
  };
};

const generateRecommendations = (analysis, userProfile) => {
  const { dominantTopics, currentDifficultyLevel, identifiedGaps } = analysis;
  const recommendations = [];
  
  if (dominantTopics.length > 0) {
    const nextDifficulty = getNextDifficulty(currentDifficultyLevel);
    recommendations.push({
      title: `${nextDifficulty} ${dominantTopics[0]} Problem`,
      platform: "LeetCode",
      difficulty: nextDifficulty,
      topics: [dominantTopics[0]],
      reasoning: `Level up to ${nextDifficulty} difficulty`,
      priority: "high",
      estimatedTime: "30-45 minutes",
      learningObjective: `Master ${nextDifficulty} level problems`
    });
  }
  
  if (identifiedGaps.length > 0) {
    recommendations.push({
      title: `Introduction to ${identifiedGaps[0]}`,
      platform: "LeetCode",
      difficulty: "Easy",
      topics: [identifiedGaps[0]],
      reasoning: `Learn ${identifiedGaps[0]} fundamentals`,
      priority: "medium",
      estimatedTime: "20-30 minutes",
      learningObjective: `Understand ${identifiedGaps[0]} basics`
    });
  }
  
  return recommendations;
};

const createLearningPath = (analysis, userProfile) => {
  const { dominantTopics, currentDifficultyLevel, identifiedGaps } = analysis;
  
  return {
    currentFocus: dominantTopics[0] || "General",
    nextMilestone: `${getNextDifficulty(currentDifficultyLevel)} level`,
    suggestedStudyOrder: [
      `Master ${currentDifficultyLevel} problems`,
      `Learn ${identifiedGaps[0] || "new topics"}`,
      "Practice mixed problems"
    ]
  };
};

const getNextDifficulty = (current) => {
  const progression = { "Easy": "Medium", "Medium": "Hard", "Hard": "Expert" };
  return progression[current] || "Medium";
};

export const getSpecificProblemRecommendations = async (topic, difficulty, platform) => {
  return {
    problems: [
      {
        title: `${difficulty} ${topic} Problem`,
        description: `Practice ${topic} concepts`,
        keyConcepts: [topic],
        difficulty,
        estimatedTime: "30 minutes",
        prerequisites: [`Basic ${topic}`]
      }
    ]
  };
};
