import cron from "node-cron";
import PingRequest from "../models/PingRequest.js";

export const startExpirePingsCron = () => {
  // Run every minute to check for expired pings
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();

      const result = await PingRequest.updateMany(
        {
          status: 'pending',
          expiresAt: { $lt: now }
        },
        {
          $set: { status: 'expired' }
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`Expired ${result.modifiedCount} ping requests`);
      }
    } catch (error) {
      console.error("Expire pings cron error:", error);
    }
  });

  console.log("Expire pings cron job started");
};
