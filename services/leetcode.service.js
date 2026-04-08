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
  query recentAcSubmissions($username: String!, $limit: Int!) {
    recentAcSubmissionList(username: $username, limit: $limit) {
      id
      title
      titleSlug
      timestamp
    }
  }
  `;

  try {
    const { data } = await axios.post(
      "https://leetcode.com/graphql",
      {
        query,
        variables: { 
          username,
          limit: 100
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Referer': 'https://leetcode.com'
        }
      }
    );

    if (!data.data || !data.data.recentAcSubmissionList) {
      console.log('LeetCode API response:', JSON.stringify(data, null, 2));
      return [];
    }

    const submissions = data.data.recentAcSubmissionList || [];
    
    // Remove duplicates by titleSlug
    const uniqueProblems = new Map();
    
    submissions.forEach(sub => {
      if (!uniqueProblems.has(sub.titleSlug)) {
        uniqueProblems.set(sub.titleSlug, {
          id: sub.id,
          title: sub.title,
          titleSlug: sub.titleSlug,
          timestamp: new Date(parseInt(sub.timestamp) * 1000),
          link: `https://leetcode.com/problems/${sub.titleSlug}/`,
          platform: "LeetCode"
        });
      }
    });

    const problemsList = Array.from(uniqueProblems.values())
      .sort((a, b) => b.timestamp - a.timestamp);

    // Fetch problem details (description, difficulty, etc.) for each problem
    // Limit to first 20 to avoid too many requests
    const problemsWithDetails = await Promise.all(
      problemsList.slice(0, 20).map(async (problem) => {
        try {
          const details = await fetchLeetCodeProblemDetails(problem.titleSlug);
          return {
            ...problem,
            ...details
          };
        } catch (error) {
          console.error(`Error fetching details for ${problem.titleSlug}:`, error.message);
          return problem; // Return without details if fetch fails
        }
      })
    );

    return problemsWithDetails;
      
  } catch (error) {
    console.error("Error fetching LeetCode problems:", error.response?.data || error.message);
    return [];
  }
};

// Helper function to fetch problem details
const fetchLeetCodeProblemDetails = async (titleSlug) => {
  const query = `
  query getProblemDetails($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
      questionId
      title
      titleSlug
      content
      difficulty
      likes
      dislikes
      topicTags {
        name
      }
      hints
      exampleTestcases
    }
  }
  `;

  try {
    const { data } = await axios.post(
      "https://leetcode.com/graphql",
      {
        query,
        variables: { titleSlug }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Referer': 'https://leetcode.com'
        }
      }
    );

    const question = data.data.question;
    
    return {
      questionId: question.questionId,
      description: question.content, // HTML content
      difficulty: question.difficulty,
      likes: question.likes,
      dislikes: question.dislikes,
      tags: question.topicTags.map(tag => tag.name),
      hints: question.hints || [],
      exampleTestcases: question.exampleTestcases
    };
  } catch (error) {
    console.error(`Error fetching problem details for ${titleSlug}:`, error.message);
    return {};
  }
};
