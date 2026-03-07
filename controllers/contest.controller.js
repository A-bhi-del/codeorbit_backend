import {
  fetchCodeforcesContests,
  fetchLeetCodeContests,
} from "../services/contest.service.js";

export const getContests = async (req, res) => {

  try {

    const cf = await fetchCodeforcesContests();
    const lc = await fetchLeetCodeContests();

    const contests = [...cf, ...lc];

    contests.sort(
      (a, b) => new Date(a.startTime) - new Date(b.startTime)
    );

    res.json({
      contests
    });

  } catch (error) {

    res.status(500).json({
      message: "Error fetching contests"
    });

  }

};