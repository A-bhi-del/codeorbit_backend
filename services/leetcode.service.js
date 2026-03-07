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