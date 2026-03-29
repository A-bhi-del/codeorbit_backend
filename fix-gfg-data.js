import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

const fixGFGData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Find all users with GFG data where score is unreasonably large
    const users = await User.find({
      "gfg.score": { $gt: 100000 }
    });

    console.log(`Found ${users.length} users with invalid GFG data`);

    for (const user of users) {
      console.log(`Fixing user: ${user.email}, GFG score: ${user.gfg.score}`);
      user.gfg.score = 0;
      user.gfg.problemsSolved = 0;
      user.gfg.codingScore = 0;
      await user.save();
      console.log(`✓ Fixed ${user.email}`);
    }

    console.log("\nAll done! Please reconnect your GFG account to fetch correct data.");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

fixGFGData();
