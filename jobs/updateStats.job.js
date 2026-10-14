import cron from "node-cron";
import User from "../models/User.js";
import { syncUserPlatforms } from "../controllers/sync.controller.js";

export const startStatsCron = () => {

  // every day at 2 AM: refresh every connected platform (LeetCode, Codeforces, CodeChef, GFG, GitHub) for everyone,
  // using the same code as the Sync button so the numbers can't differ between the two
  cron.schedule("0 2 * * *", async () => {

    console.log("Running stats update cron...");

    try {
      const users = await User.find({});

      for (const user of users) {
        try {
          console.log(`Updating stats for ${user.email}`);
          await syncUserPlatforms(user);
        } catch (error) {
          console.log(`Error updating user ${user.email}: ${error.message}`);
        }
      }

      console.log("Stats update completed");
    } catch (error) {
      console.log("Cron job failed");
    }

  });

};
