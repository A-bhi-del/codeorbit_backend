import axios from "axios";

export const fetchLeetCodeFullProfile = async (username) => {
  const query = `
  query getFullProfile($username: String!) {
    matchedUser(username: $username) {
      profile {
        aboutMe
      }
      submitStats {
        acSubmissionNum {
          difficulty
          count
        }
      }
      badges {
        displayName
        icon
      }
      userCalendar {
        submissionCalendar
      }
    }
    userContestRanking(username: $username) {
      rating
      attendedContestsCount
    }
  }
  `;

  const { data } = await axios.post(
    "https://leetcode.com/graphql",
    {
      query,
      variables: { username }
    }
  );

  return data.data;
};

export const fetchLeetCodeSolvedProblems = async (username) => {
  const query = `
  query getUserSolvedProblems($username: String!) {
    matchedUser(username: $username) {
      submitStatsGlobal {
        acSubmissionNum {
          difficulty
          count
          submissions
        }
      }
      submissionCalendar
      recentSubmissionList(limit: 20) {
        title
        titleSlug
        timestamp
        statusDisplay
        lang
        runtime
        memory
        url
      }
    }
    recentAcSubmissionList(username: $username, limit: 50) {
      id
      title
      titleSlug
      timestamp
      statusDisplay
      lang
      runtime
      memory
      url
    }
  }
  `;

  try {
    const { data } = await axios.post(
      "https://leetcode.com/graphql",
      {
        query,
        variables: { username }
      }
    );

    const submissions = data.data.recentAcSubmissionList || [];
    
    return submissions.map(sub => ({
      id: sub.id,
      title: sub.title,
      titleSlug: sub.titleSlug,
      timestamp: new Date(parseInt(sub.timestamp) * 1000),
      status: sub.statusDisplay,
      language: sub.lang,
      runtime: sub.runtime,
      memory: sub.memory,
      link: `https://leetcode.com/problems/${sub.titleSlug}/`,
      platform: "LeetCode"
    }));
  } catch (error) {
    console.error("Error fetching LeetCode problems:", error.message);
    return [];
  }
};