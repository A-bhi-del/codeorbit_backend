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
    const submissions = await axios.get(
      `https://codeforces.com/api/user.status?handle=${handle}&from=1&count=100`
    );

    const solvedProblems = new Map();

    submissions.data.result.forEach((sub) => {
      if (sub.verdict === "OK") {
        const problemKey = `${sub.problem.contestId}-${sub.problem.index}`;
        
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
            platform: "Codeforces"
          });
        }
      }
    });

    return Array.from(solvedProblems.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 50);
  } catch (error) {
    console.error("Error fetching Codeforces problems:", error.message);
    return [];
  }
};