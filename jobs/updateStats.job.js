import cron from "node-cron";
import User from "../models/User.js";

import { fetchCodeforcesProfile } from "../services/codeforces.service.js";
import { fetchGithubProfile } from "../services/github.service.js";
import { updateActivity } from "../utils/activity.util.js";

export const startStatsCron = () => {

  // run every day at 2 AM
  cron.schedule("0 2 * * *", async () => {

    console.log("Running stats update cron...");

    try {

      const users = await User.find({});

      for (const user of users) {

        try {

          console.log(`Updating stats for ${user.email}`);
          let todayActivity = 0;
          // Codeforces update
          if (user.codeforces?.handle) {

            const cfData =
              await fetchCodeforcesProfile(user.codeforces.handle);

            user.codeforces = {
              ...user.codeforces,
              ...cfData
            };

            todayActivity += cfData.solvedProblems || 0;
          }

          // GitHub update
          if (user.github?.username) {

            const githubData =
              await fetchGithubProfile(user.github.username);

            user.github = {
              ...user.github,
              ...githubData
            };
            todayActivity += githubData.totalStars || 0;

          }
          updateActivity(user, todayActivity);
          
          // Last synced time update
          user.lastSyncedAt = new Date();

          await user.save();

        } catch (error) {

          console.log(
            `Error updating user ${user.email}`
          );
        }
      }

      console.log("Stats update completed");

    } catch (error) {

      console.log("Cron job failed");

    }

  });

};