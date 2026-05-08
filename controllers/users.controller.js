import User from "../models/User.js";

// Search users
export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    const currentUserId = req.user;

    if (!q || q.trim().length === 0) {
      return res.json({ users: [] });
    }

    const searchQuery = {
      _id: { $ne: currentUserId },
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { displayName: { $regex: q, $options: 'i' } },
        { uniqueId: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    };

    const users = await User.find(searchQuery)
      .select('displayName username uniqueId email photoURL profileImage bio onlineStatus')
      .limit(20)
      .lean();

    res.json({ users });
  } catch (error) {
    console.error("Search users error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get user by username
export const getUserByUsername = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username })
      .select('-password -firebaseUid -friendRequestsSent -friendRequestsReceived -blockedUsers')
      .populate('followers', 'displayName username photoURL profileImage')
      .populate('following', 'displayName username photoURL profileImage')
      .lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error("Get user by username error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get user suggestions
export const getUserSuggestions = async (req, res) => {
  try {
    const currentUserId = req.user;

    const currentUser = await User.findById(currentUserId).lean();

    // Find users not already followed
    const suggestions = await User.find({
      _id: { 
        $ne: currentUserId,
        $nin: [...currentUser.following, ...currentUser.blockedUsers]
      }
    })
      .select('displayName username photoURL profileImage bio followers')
      .limit(10)
      .lean();

    // Sort by follower count
    suggestions.sort((a, b) => (b.followers?.length || 0) - (a.followers?.length || 0));

    res.json({ suggestions });
  } catch (error) {
    console.error("Get user suggestions error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get mutual friends
export const getMutualFriends = async (req, res) => {
  try {
    const currentUserId = req.user;
    const { id: targetUserId } = req.params;

    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId).select('friends').lean(),
      User.findById(targetUserId).select('friends').lean()
    ]);

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const currentFriends = currentUser.friends.map(id => id.toString());
    const targetFriends = targetUser.friends.map(id => id.toString());

    const mutualFriendIds = currentFriends.filter(id => targetFriends.includes(id));

    const mutualFriends = await User.find({
      _id: { $in: mutualFriendIds }
    })
      .select('displayName username photoURL profileImage')
      .lean();

    res.json({ mutualFriends, count: mutualFriends.length });
  } catch (error) {
    console.error("Get mutual friends error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user;
    const { displayName, username, bio, accountType, socialLinks, profileImage, bannerImage } = req.body;

    const updateData = {};

    if (displayName !== undefined) updateData.displayName = displayName;

    if (username) {
      // Check if username is taken
      const existingUser = await User.findOne({ 
        username: username.toLowerCase(),
        _id: { $ne: userId }
      });

      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }

      updateData.username = username.toLowerCase();
    }

    if (bio !== undefined) updateData.bio = bio;
    if (accountType) updateData.accountType = accountType;
    if (socialLinks) updateData.socialLinks = socialLinks;
    if (profileImage) updateData.profileImage = profileImage;
    if (bannerImage) updateData.bannerImage = bannerImage;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    ).select('-password -firebaseUid');

    res.json({ user });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
