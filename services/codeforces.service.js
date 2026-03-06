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