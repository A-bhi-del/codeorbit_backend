import User from "../models/User.js";
import { getCodeChefData } from "../services/codechefService.js";
import { updateActivity } from "../utils/activity.util.js";

export const connectCodeChef = async (req, res) => {
  try {
    console.log("🔗 CodeChef connection request received");
    console.log("Request body:", req.body);
    console.log("User ID:", req.user);
    
    const userId = req.user;
    const { username } = req.body;

    if (!username) {
      console.log("❌ No username provided in request body");
      return res.status(400).json({ 
        message: "Username is required",
        error: "Missing username in request body"
      });
    }

    console.log(`🔍 Looking for user with ID: ${userId}`);
    const user = await User.findById(userId);

    if (!user) {
      console.log("❌ User not found in database");
      return res.status(404).json({ message: "User not found" });
    }

    console.log(`📡 Fetching CodeChef profile for username: ${username}`);
    const codechefData = await getCodeChefData(username);
    console.log("✅ CodeChef data fetched successfully:", codechefData);

    user.codechef = codechefData;

    // Add initial activity
    console.log("📊 Updating activity data");
    updateActivity(user, codechefData.rating || 0);

    console.log("💾 Saving user data to database");
    await user.save();
    console.log("✅ CodeChef connection successful");

    res.json({
      message: "CodeChef connected successfully",
      codechef: codechefData
    });

  } catch (error) {
    console.error("❌ CodeChef connection error:", error);
    console.error("Error stack:", error.stack);
    
    // More specific error messages
    if (error.message.includes("User not found") || error.message.includes("Invalid username")) {
      return res.status(400).json({
        message: "Invalid CodeChef username",
        error: "User not found on CodeChef or profile is private",
        suggestion: "Please check the username and ensure the profile is public"
      });
    }
    
    if (error.message.includes("rate limit") || error.message.includes("429")) {
      return res.status(429).json({
        message: "CodeChef API rate limit exceeded",
        error: "Too many requests to CodeChef",
        suggestion: "Please try again later"
      });
    }

    res.status(400).json({
      message: "Failed to connect CodeChef",
      error: error.message,
      suggestion: "Please check the username and try again"
    });
  }
};
