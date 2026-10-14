import axios from "axios";

/**
 * GeeksforGeeks profile numbers from GfG's own profile API (the page is client-rendered, so scraping it kept
 * returning zeros). Throws when the profile can't be read, so a failed fetch never overwrites real numbers with 0.
 */
export const getGFGData = async (username) => {
  let info;
  try {
    const res = await axios.get("https://authapi.geeksforgeeks.org/api-get/user-profile-info/", {
      params: { handle: username, article_count: false, redirect: true },
      timeout: 20000,
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    info = res.data?.data;
  } catch (err) {
    throw new Error(`GFG fetch failed: ${err.response?.status === 404 ? "profile not found" : err.message}`);
  }

  if (!info || typeof info.total_problems_solved !== "number") {
    throw new Error("GFG fetch failed: no profile data for that username");
  }

  return {
    username,
    score: info.score || 0,
    problemsSolved: info.total_problems_solved || 0,
    codingScore: info.score || 0,
    lastFetched: new Date()
  };
};
