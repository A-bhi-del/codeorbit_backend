import cron from "node-cron";
import PingRequest from "../models/PingRequest.js";
import User from "../models/User.js";

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

      // Anyone we haven't heard from in 2 minutes is offline
      await User.updateMany(
        {
          onlineStatus: true,
          $or: [{ lastSeen: { $lt: new Date(Date.now() - 2 * 60 * 1000) } }, { lastSeen: null }]
        },
        { $set: { onlineStatus: false } }
      );
    } catch (error) {
      console.error("Expire pings cron error:", error);
    }
  });

  console.log("Expire pings cron job started");
};
