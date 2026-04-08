import axios from "axios";

export const fetchCodeforcesProfile = async (handle) => {

  const userInfo = await axios.get(
    `https://codeforces.com/api/user.info?handles=${handle}`
  );

  const ratingHistory = await axios.get(
    `https://codeforces.com/api/user.rating?handle=${handle}`
  );

  const submissions = await axios.get(
    `https://codeforces.com/api/user.status?handle=${handle}`
  );

  const profile = userInfo.data.result[0];

  const contestsPlayed = ratingHistory.data.result.length;

  const solvedSet = new Set();

  submissions.data.result.forEach((sub) => {
    if (sub.verdict === "OK") {
      const key = `${sub.problem.contestId}-${sub.problem.index}`;
      solvedSet.add(key);
    }
  });

  return {
    handle: profile.handle,
    rating: profile.rating || 0,
    maxRating: profile.maxRating || 0,
    rank: profile.rank || "unrated",
    solvedProblems: solvedSet.size,
    contestsPlayed
  };
};

export const fetchCodeforcesSolvedProblems = async (handle) => {
  try {
    // Fetch all submissions (no limit, Codeforces API handles it)
    const response = await axios.get(
      `https://codeforces.com/api/user.status?handle=${handle}`,
      {
        timeout: 10000
      }
    );

    if (response.data.status !== 'OK') {
      console.error('Codeforces API error:', response.data);
      return [];
    }

    const submissions = response.data.result;
    const solvedProblems = new Map();

    // Filter only accepted submissions
    submissions.forEach((sub) => {
      if (sub.verdict === "OK" && sub.problem) {
        const problemKey = `${sub.problem.contestId}-${sub.problem.index}`;
        
        // Only add if not already added (keep the first/most recent one)
        if (!solvedProblems.has(problemKey)) {
          solvedProblems.set(problemKey, {
            id: problemKey,
            title: sub.problem.name,
            contestId: sub.problem.contestId,
            index: sub.problem.index,
            rating: sub.problem.rating || 0,
            tags: sub.problem.tags || [],
            timestamp: new Date(sub.creationTimeSeconds * 1000),
            language: sub.programmingLanguage,
            link: `https://codeforces.com/problemset/problem/${sub.problem.contestId}/${sub.problem.index}`,
            platform: "Codeforces",
            // Codeforces API doesn't provide problem statement directly
            // We need to scrape it or use problemset.problems API
            type: sub.problem.type || 'PROGRAMMING'
          });
        }
      }
    });

    // Convert to array and sort by timestamp (most recent first)
    const problemsList = Array.from(solvedProblems.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 100); // Limit to 100 most recent

    // Fetch problem statements for the first 20 problems
    const problemsWithStatements = await Promise.all(
      problemsList.slice(0, 20).map(async (problem) => {
        try {
          const statement = await fetchCodeforcesProblemsStatement(problem.contestId, problem.index);
          return {
            ...problem,
            description: statement
          };
        } catch (error) {
          console.error(`Error fetching statement for ${problem.id}:`, error.message);
          return problem; // Return without statement if fetch fails
        }
      })
    );

    // Add remaining problems without statements
    const remainingProblems = problemsList.slice(20);

    return [...problemsWithStatements, ...remainingProblems];
      
  } catch (error) {
    console.error("Error fetching Codeforces problems:", error.response?.data || error.message);
    return [];
  }
};

// Helper function to fetch problem statement
const fetchCodeforcesProblemsStatement = async (contestId, index) => {
  try {
    // Codeforces doesn't have a direct API for problem statements
    // We need to scrape the problem page
    const url = `https://codeforces.com/problemset/problem/${contestId}/${index}`;
    const response = await axios.get(url, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    // Extract problem statement from HTML
    // This is a simplified extraction - you might want to use cheerio for better parsing
    const html = response.data;
    
    // Look for the problem statement div
    const statementMatch = html.match(/<div class="problem-statement">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/);
    
    if (statementMatch) {
      // Clean up HTML tags for a plain text version
      let statement = statementMatch[1];
      statement = statement.replace(/<[^>]*>/g, ' '); // Remove HTML tags
      statement = statement.replace(/\s+/g, ' ').trim(); // Clean whitespace
      return statement.substring(0, 1000); // Limit to 1000 chars
    }
    
    return 'Problem statement not available';
  } catch (error) {
    console.error(`Error scraping problem ${contestId}${index}:`, error.message);
    return 'Problem statement not available';
  }
};
