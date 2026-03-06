import axios from "axios";

export const fetchGithubProfile = async (username) => {

  try {

    // 🔹 Profile
    const profile = await axios.get(
      `https://api.github.com/users/${username}`
    );

    // 🔹 Repos
    const repos = await axios.get(
      `https://api.github.com/users/${username}/repos?per_page=100`
    );

    let totalStars = 0;

    repos.data.forEach(repo => {
      totalStars += repo.stargazers_count;
    });

    // 🔹 Contribution graph query
    const query = `
    query {
      user(login: "${username}") {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                date
                contributionCount
              }
            }
          }
        }
      }
    }
    `;

    const contributions = await axios.post(
      "https://api.github.com/graphql",
      { query },
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`
        }
      }
    );

    const calendar =
      contributions.data.data.user.contributionsCollection
        .contributionCalendar;

    return {

      username: profile.data.login,
      avatar: profile.data.avatar_url,

      followers: profile.data.followers,
      following: profile.data.following,

      publicRepos: profile.data.public_repos,

      totalStars,

      totalContributions: calendar.totalContributions,

      contributionGraph: calendar.weeks

    };

  } catch (error) {

    throw new Error("Invalid Github username");

  }

};