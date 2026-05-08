import User from "../models/User.js";
import { fetchLeetCodeFullProfile } from "../services/leetcode.service.js";
import { fetchCodeforcesProfile } from "../services/codeforces.service.js";
import { fetchGithubProfile } from "../services/github.service.js";
import { getCodeChefData } from "../services/codechefService.js";
import { getGFGData } from "../services/gfgService.js";

// Individual platform sync functions
export const syncLeetCode = async (req, res) => {
  try {
    const userId = req.user;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.activity) {
      user.activity = [];
    }

    if (user.leetcode?.username && user.leetcode?.verified) {
      const profileData = await fetchLeetCodeFullProfile(user.leetcode.username);

      if (profileData && profileData.matchedUser) {
        const stats = profileData.matchedUser.submitStats.acSubmissionNum;
        const totalSolved = stats.find((item) => item.difficulty === "All")?.count || 0;
        const rating = profileData.userContestRanking?.rating || 0;
        const contestsPlayed = profileData.userContestRanking?.attendedContestsCount || 0;

        const easy = stats.find((item) => item.difficulty === "Easy")?.count || 0;
        const medium = stats.find((item) => item.difficulty === "Medium")?.count || 0;
        const hard = stats.find((item) => item.difficulty === "Hard")?.count || 0;

        const difficultyBreakdown = [
          { name: "Easy", value: easy, color: "oklch(0.7 0.18 165)" },
          { name: "Medium", value: medium, color: "oklch(0.75 0.15 80)" },
          { name: "Hard", value: hard, color: "oklch(0.6 0.22 330)" }
        ];

        const calendarRaw = profileData.matchedUser.userCalendar?.submissionCalendar || "{}";
        const calendar = JSON.parse(calendarRaw);
        const totalActiveDays = Object.keys(calendar).length;

        user.leetcode.totalSolved = totalSolved;
        user.leetcode.contestRating = rating;
        user.leetcode.contestsPlayed = contestsPlayed;
        user.leetcode.totalActiveDays = totalActiveDays;
        user.leetcode.difficultyBreakdown = difficultyBreakdown;

        let addedDays = 0;
        Object.entries(calendar).forEach(([timestamp, count]) => {
          const date = new Date(parseInt(timestamp) * 1000).toISOString().slice(0, 10);
          const existingActivity = user.activity.find(a => a.date === date);
          
          if (existingActivity) {
            existingActivity.count = Math.max(existingActivity.count, count);
          } else {
            user.activity.push({ date, count });
            addedDays++;
          }
        });

        await user.save();
        return res.json({ success: true, platform: "leetcode", totalSolved, rating });
      }
    }

    return res.status(400).json({ message: "LeetCode not connected or verified" });
  } catch (error) {
    console.error("LeetCode sync error:", error);
    return res.status(500).json({ message: "LeetCode sync failed", error: error.message });
  }
};

export const syncCodeforces = async (req, res) => {
  try {
    const userId = req.user;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.codeforces?.handle) {
      const cfData = await fetchCodeforcesProfile(user.codeforces.handle);
      
      user.codeforces = {
        ...user.codeforces,
        ...cfData
      };

      await user.save();
      return res.json({ success: true, platform: "codeforces", solvedProblems: cfData.solvedProblems, rating: cfData.rating });
    }

    return res.status(400).json({ message: "Codeforces not connected" });
  } catch (error) {
    console.error("Codeforces sync error:", error);
    return res.status(500).json({ message: "Codeforces sync failed", error: error.message });
  }
};

export const syncGithub = async (req, res) => {
  try {
    const userId = req.user;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.activity) {
      user.activity = [];
    }

    if (user.github?.username) {
      const githubData = await fetchGithubProfile(user.github.username);
      
      user.github = {
        ...user.github,
        ...githubData
      };

      if (githubData.contributionGraph && Array.isArray(githubData.contributionGraph)) {
        let addedDays = 0;
        githubData.contributionGraph.forEach(week => {
          if (week.contributionDays && Array.isArray(week.contributionDays)) {
            week.contributionDays.forEach(day => {
              const existingActivity = user.activity.find(a => a.date === day.date);
              
              if (existingActivity) {
                existingActivity.count = Math.max(existingActivity.count, day.contributionCount);
              } else {
                user.activity.push({
                  date: day.date,
                  count: day.contributionCount
                });
                addedDays++;
              }
            });
          }
        });
      }

      await user.save();
      return res.json({ success: true, platform: "github", totalContributions: githubData.totalContributions });
    }

    return res.status(400).json({ message: "GitHub not connected" });
  } catch (error) {
    console.error("GitHub sync error:", error);
    return res.status(500).json({ message: "GitHub sync failed", error: error.message });
  }
};

export const syncCodeChef = async (req, res) => {
  try {
    const userId = req.user;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.codechef?.username) {
      const codechefData = await getCodeChefData(user.codechef.username);
      
      user.codechef = {
        ...user.codechef,
        ...codechefData
      };

      await user.save();
      return res.json({ success: true, platform: "codechef", rating: codechefData.rating, highestRating: codechefData.highestRating });
    }

    return res.status(400).json({ message: "CodeChef not connected" });
  } catch (error) {
    console.error("CodeChef sync error:", error);
    return res.status(500).json({ message: "CodeChef sync failed", error: error.message });
  }
};

export const syncGFG = async (req, res) => {
  try {
    const userId = req.user;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.gfg?.username) {
      const gfgData = await getGFGData(user.gfg.username);
      
      user.gfg = {
        ...user.gfg,
        ...gfgData
      };

      await user.save();
      return res.json({ success: true, platform: "gfg", score: gfgData.score, problemsSolved: gfgData.problemsSolved });
    }

    return res.status(400).json({ message: "GFG not connected" });
  } catch (error) {
    console.error("GFG sync error:", error);
    return res.status(500).json({ message: "GFG sync failed", error: error.message });
  }
};

export const syncAllPlatforms = async (req, res) => {
  try {
    const userId = req.user;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const results = {
      leetcode: null,
      codeforces: null,
      github: null,
      codechef: null,
      gfg: null,
      activityDaysAdded: 0
    };

    // Initialize activity if not exists
    if (!user.activity) {
      user.activity = [];
    }

    // Sync LeetCode
    if (user.leetcode?.username && user.leetcode?.verified) {
      try {
        console.log(`Syncing LeetCode for ${user.leetcode.username}`);
        
        const profileData = await fetchLeetCodeFullProfile(user.leetcode.username);

        if (profileData && profileData.matchedUser) {
          const stats = profileData.matchedUser.submitStats.acSubmissionNum;
          const totalSolved = stats.find((item) => item.difficulty === "All")?.count || 0;
          const rating = profileData.userContestRanking?.rating || 0;
          const contestsPlayed = profileData.userContestRanking?.attendedContestsCount || 0;

          // Extract difficulty breakdown
          const easy = stats.find((item) => item.difficulty === "Easy")?.count || 0;
          const medium = stats.find((item) => item.difficulty === "Medium")?.count || 0;
          const hard = stats.find((item) => item.difficulty === "Hard")?.count || 0;

          const difficultyBreakdown = [
            { name: "Easy", value: easy, color: "oklch(0.7 0.18 165)" },
            { name: "Medium", value: medium, color: "oklch(0.75 0.15 80)" },
            { name: "Hard", value: hard, color: "oklch(0.6 0.22 330)" }
          ];

          // Parse calendar
          const calendarRaw = profileData.matchedUser.userCalendar?.submissionCalendar || "{}";
          const calendar = JSON.parse(calendarRaw);
          const totalActiveDays = Object.keys(calendar).length;

          // Update LeetCode data
          user.leetcode.totalSolved = totalSolved;
          user.leetcode.contestRating = rating;
          user.leetcode.contestsPlayed = contestsPlayed;
          user.leetcode.totalActiveDays = totalActiveDays;
          user.leetcode.difficultyBreakdown = difficultyBreakdown;

          // Clear old LeetCode activity and re-add
          user.activity = user.activity.filter(a => {
            // Keep non-LeetCode activities (rough heuristic)
            return true; // We'll just add/update
          });

          // Add calendar data
          let addedDays = 0;
          Object.entries(calendar).forEach(([timestamp, count]) => {
            const date = new Date(parseInt(timestamp) * 1000).toISOString().slice(0, 10);
            const existingActivity = user.activity.find(a => a.date === date);
            
            if (existingActivity) {
              existingActivity.count = Math.max(existingActivity.count, count);
            } else {
              user.activity.push({ date, count });
              addedDays++;
            }
          });

          results.leetcode = { totalSolved, rating, activityDaysAdded: addedDays };
          results.activityDaysAdded += addedDays;
          console.log(`LeetCode synced: ${addedDays} days added`);
        }
      } catch (error) {
        console.error("LeetCode sync error:", error.message);
        results.leetcode = { error: error.message };
      }
    }

    // Sync Codeforces
    if (user.codeforces?.handle) {
      try {
        console.log(`Syncing Codeforces for ${user.codeforces.handle}`);
        
        const cfData = await fetchCodeforcesProfile(user.codeforces.handle);
        
        user.codeforces = {
          ...user.codeforces,
          ...cfData
        };

        results.codeforces = { 
          solvedProblems: cfData.solvedProblems,
          rating: cfData.rating 
        };
        console.log(`Codeforces synced: ${cfData.solvedProblems} problems`);
      } catch (error) {
        console.error("Codeforces sync error:", error.message);
        results.codeforces = { error: error.message };
      }
    }

    // Sync GitHub
    if (user.github?.username) {
      try {
        console.log(`Syncing GitHub for ${user.github.username}`);
        
        const githubData = await fetchGithubProfile(user.github.username);
        
        user.github = {
          ...user.github,
          ...githubData
        };

        // Add GitHub contribution graph
        if (githubData.contributionGraph && Array.isArray(githubData.contributionGraph)) {
          let addedDays = 0;
          githubData.contributionGraph.forEach(week => {
            if (week.contributionDays && Array.isArray(week.contributionDays)) {
              week.contributionDays.forEach(day => {
                const existingActivity = user.activity.find(a => a.date === day.date);
                
                if (existingActivity) {
                  existingActivity.count = Math.max(existingActivity.count, day.contributionCount);
                } else {
                  user.activity.push({
                    date: day.date,
                    count: day.contributionCount
                  });
                  addedDays++;
                }
              });
            }
          });

          results.github = { 
            totalContributions: githubData.totalContributions,
            activityDaysAdded: addedDays 
          };
          results.activityDaysAdded += addedDays;
          console.log(`GitHub synced: ${addedDays} days added`);
        }
      } catch (error) {
        console.error("GitHub sync error:", error.message);
        results.github = { error: error.message };
      }
    }

    // Sync CodeChef
    if (user.codechef?.username) {
      try {
        console.log(`Syncing CodeChef for ${user.codechef.username}`);
        
        const codechefData = await getCodeChefData(user.codechef.username);
        
        user.codechef = {
          ...user.codechef,
          ...codechefData
        };

        results.codechef = { 
          rating: codechefData.rating,
          highestRating: codechefData.highestRating 
        };
        console.log(`CodeChef synced: rating ${codechefData.rating}`);
      } catch (error) {
        console.error("CodeChef sync error:", error.message);
        results.codechef = { error: error.message };
      }
    }

    // Sync GFG
    if (user.gfg?.username) {
      try {
        console.log(`Syncing GFG for ${user.gfg.username}`);
        
        const gfgData = await getGFGData(user.gfg.username);
        
        user.gfg = {
          ...user.gfg,
          ...gfgData
        };

        results.gfg = { 
          score: gfgData.score,
          problemsSolved: gfgData.problemsSolved 
        };
        console.log(`GFG synced: score ${gfgData.score}`);
      } catch (error) {
        console.error("GFG sync error:", error.message);
        results.gfg = { error: error.message };
      }
    }

    // Update last synced time
    user.lastSyncedAt = new Date();

    await user.save();

    res.json({
      message: "Platforms synced successfully",
      results,
      totalActivityDays: user.activity.length,
      lastSyncedAt: user.lastSyncedAt
    });

  } catch (error) {
    console.error("Sync error:", error);
    res.status(500).json({ 
      message: "Sync failed", 
      error: error.message 
    });
  }
};
