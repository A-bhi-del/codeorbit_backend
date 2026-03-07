import axios from "axios";

export const fetchCodeforcesContests = async () => {

  const res = await axios.get(
    "https://codeforces.com/api/contest.list"
  );

  const contests = res.data.result
    .filter(c => c.phase === "BEFORE")
    .slice(0, 10)
    .map(c => ({
      platform: "Codeforces",
      name: c.name,
      startTime: new Date(c.startTimeSeconds * 1000),
      duration: c.durationSeconds / 3600
    }));

  return contests;

};

export const fetchLeetCodeContests = async () => {

  const res = await axios.get(
    "https://leetcode.com/graphql",
    {
      method: "POST",
      data: {
        query: `
        {
          allContests {
            title
            startTime
            duration
          }
        }
        `
      }
    }
  );

  const now = Date.now() / 1000;

  const contests = res.data.data.allContests
    .filter(c => c.startTime > now)
    .slice(0, 10)
    .map(c => ({
      platform: "LeetCode",
      name: c.title,
      startTime: new Date(c.startTime * 1000),
      duration: c.duration / 3600
    }));

  return contests;

};