import axios from "axios";

// Fetch GitHub profile using user's OAuth access token (or the server's token for public data)
export const fetchGithubProfile = async (username, userToken) => {
  const accessToken = userToken || process.env.GITHUB_TOKEN;
  if (!accessToken) {
    throw new Error("No GitHub token available. Set GITHUB_TOKEN in server/.env.");
  }

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'User-Agent': 'CodeOrbit-Backend'
  };

  try {
    // ---- REST: profile
    const profile = await axios.get(`https://api.github.com/users/${encodeURIComponent(username)}`, { headers });

    // ---- REST: repositories (paginated, up to 500) for stars and forks totals
    let repoList = [];
    for (let page = 1; page <= 5; page++) {
      const res = await axios.get(
        `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&page=${page}&type=owner`,
        { headers }
      );
      repoList = repoList.concat(res.data);
      if (res.data.length < 100) break;
    }
    let totalStars = 0;
    let totalForks = 0;
    repoList.forEach(repo => {
      totalStars += repo.stargazers_count || 0;
      totalForks += repo.forks_count || 0;
    });

    // ---- GraphQL: contribution calendar + breakdown, languages, pinned/top repos, organisations
    const query = `
    query($login: String!) {
      user(login: $login) {
        pullRequests { totalCount }
        issues { totalCount }
        organizations(first: 12) { nodes { login name avatarUrl url } }
        pinnedItems(first: 6, types: REPOSITORY) {
          nodes { ... on Repository {
            name description url stargazerCount forkCount pushedAt
            primaryLanguage { name color }
          } }
        }
        repositories(first: 100, ownerAffiliations: OWNER, isFork: false, orderBy: { field: STARGAZERS, direction: DESC }) {
          nodes {
            name description url stargazerCount forkCount pushedAt
            primaryLanguage { name color }
            languages(first: 8, orderBy: { field: SIZE, direction: DESC }) { edges { size node { name color } } }
          }
        }
        contributionsCollection {
          totalCommitContributions
          totalIssueContributions
          totalPullRequestContributions
          totalPullRequestReviewContributions
          totalRepositoryContributions
          restrictedContributionsCount
          contributionCalendar {
            totalContributions
            weeks { contributionDays { date contributionCount } }
          }
        }
      }
    }`;

    const gql = await axios.post(
      "https://api.github.com/graphql",
      { query, variables: { login: username } },
      { headers: { ...headers, 'Content-Type': 'application/json' } }
    );

    if (gql.data.errors) {
      const first = gql.data.errors[0];
      console.error("GitHub GraphQL errors:", gql.data.errors);
      if (first.type === "NOT_FOUND") throw new Error("GitHub user not found. Check the spelling of the username.");
      throw new Error(`GitHub GraphQL error: ${first.message}`);
    }

    const u = gql.data.data.user;
    const cc = u.contributionsCollection;
    const calendar = cc.contributionCalendar;

    const mapRepo = (r) => ({
      name: r.name,
      description: r.description || '',
      url: r.url,
      stars: r.stargazerCount,
      forks: r.forkCount,
      language: r.primaryLanguage?.name || null,
      languageColor: r.primaryLanguage?.color || null,
      pushedAt: r.pushedAt
    });

    // Languages across original repositories, weighted by bytes of code
    const bytes = new Map();
    u.repositories.nodes.forEach(repo => {
      repo.languages.edges.forEach(e => {
        const cur = bytes.get(e.node.name) || { name: e.node.name, color: e.node.color, size: 0 };
        cur.size += e.size;
        bytes.set(e.node.name, cur);
      });
    });
    const totalBytes = [...bytes.values()].reduce((a, l) => a + l.size, 0) || 1;
    const languages = [...bytes.values()]
      .sort((a, b) => b.size - a.size)
      .slice(0, 8)
      .map(l => ({ ...l, percent: Math.round((l.size / totalBytes) * 1000) / 10 }));

    const result = {
      username: profile.data.login,
      avatar: profile.data.avatar_url,
      followers: profile.data.followers,
      following: profile.data.following,
      publicRepos: profile.data.public_repos,
      totalStars,
      totalForks,
      totalContributions: calendar.totalContributions,
      contributionGraph: calendar.weeks,

      name: profile.data.name || null,
      bio: profile.data.bio || null,
      company: profile.data.company || null,
      location: profile.data.location || null,
      blog: profile.data.blog || null,
      twitter: profile.data.twitter_username || null,
      profileUrl: profile.data.html_url,
      githubCreatedAt: profile.data.created_at,
      hireable: profile.data.hireable ?? null,
      publicGists: profile.data.public_gists,

      pullRequestsTotal: u.pullRequests.totalCount,
      issuesTotal: u.issues.totalCount,
      contributions: {
        commits: cc.totalCommitContributions,
        pullRequests: cc.totalPullRequestContributions,
        issues: cc.totalIssueContributions,
        reviews: cc.totalPullRequestReviewContributions,
        repositories: cc.totalRepositoryContributions,
        private: cc.restrictedContributionsCount
      },
      languages,
      pinned: u.pinnedItems.nodes.filter(Boolean).map(mapRepo),
      topRepos: u.repositories.nodes.slice(0, 6).map(mapRepo),
      organizations: u.organizations.nodes.map(o => ({ login: o.login, name: o.name || o.login, avatar: o.avatarUrl, url: o.url })),
      lastFetched: new Date()
    };

    return result;

  } catch (error) {
    console.error("❌ GitHub API Error:", error.message);

    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);

      if (error.response.status === 404) {
        throw new Error("GitHub user not found. Check the spelling of the username.");
      }
      if (error.response.status === 403) {
        throw new Error("GitHub API rate limit exceeded or token invalid");
      }
      if (error.response.status === 401) {
        throw new Error(
          userToken
            ? "Your GitHub authorisation is invalid or expired. Reconnect GitHub."
            : "The server's GitHub token (GITHUB_TOKEN in server/.env) is invalid or expired. Create a new one at https://github.com/settings/tokens (no scopes needed for public data), update server/.env and restart the server."
        );
      }
    }

    if (error.message?.startsWith("GitHub user not found") || error.message?.startsWith("GitHub GraphQL error")) throw error;
    throw new Error(`GitHub API error: ${error.message}`);
  }
};


// Exchange OAuth code for access token
export const exchangeGithubCode = async (code) => {
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    throw new Error('GitHub OAuth is not configured on the server (set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in server/.env and restart)');
  }
  try {
    console.log('🔄 Exchanging GitHub OAuth code for access token');
    
    const response = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code
      },
      {
        headers: {
          Accept: 'application/json'
        }
      }
    );

    if (response.data.error) {
      throw new Error(response.data.error_description || 'Failed to exchange code');
    }

    console.log('✅ Access token received');
    return response.data.access_token;
  } catch (error) {
    console.error('❌ GitHub OAuth error:', error.message);
    throw new Error(`Failed to authenticate with GitHub: ${error.message}`);
  }
};

// Get authenticated user profile using their access token
export const getAuthenticatedGithubUser = async (accessToken) => {
  try {
    console.log('👤 Fetching authenticated GitHub user');
    
    const response = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'CodeOrbit-Backend'
      }
    });

    console.log('✅ Authenticated user data fetched');
    return response.data;
  } catch (error) {
    console.error('❌ Failed to get authenticated user:', error.message);
    throw new Error('Failed to get GitHub user information');
  }
};
