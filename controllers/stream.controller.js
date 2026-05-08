import { getStreamUserToken, createStreamUser } from "../services/stream.service.js";
import User from "../models/User.js";

// Get Stream token for authenticated user
export const getStreamToken = async (req, res) => {
  try {
    const userId = req.user;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Create or update Stream user
    const streamUserId = user.streamUserId || userId.toString();
    await createStreamUser(streamUserId, {
      displayName: user.displayName,
      username: user.username,
      photoURL: user.photoURL,
      profileImage: user.profileImage
    });

    // Update user with Stream ID if not set
    if (!user.streamUserId) {
      user.streamUserId = streamUserId;
      await user.save();
    }

    // Generate token
    const tokenData = await getStreamUserToken(streamUserId);

    if (!tokenData) {
      return res.status(500).json({ message: "Failed to generate Stream token" });
    }

    res.json({
      token: tokenData.token,
      apiKey: tokenData.apiKey,
      userId: streamUserId
    });
  } catch (error) {
    console.error("Get Stream token error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Initialize Stream user
export const initializeStreamUser = async (req, res) => {
  try {
    const userId = req.user;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const streamUserId = user.streamUserId || userId.toString();
    
    const result = await createStreamUser(streamUserId, {
      displayName: user.displayName,
      username: user.username,
      photoURL: user.photoURL,
      profileImage: user.profileImage
    });

    if (!result) {
      return res.status(500).json({ message: "Failed to initialize Stream user" });
    }

    if (!user.streamUserId) {
      user.streamUserId = streamUserId;
      await user.save();
    }

    res.json({ 
      message: "Stream user initialized",
      streamUserId
    });
  } catch (error) {
    console.error("Initialize Stream user error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
