import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";
import Notification from "../models/Notification.js";
import { emitNotification } from "../sockets/socketManager.js";

// Send friend/follow request
export const sendFriendRequest = async (req, res) => {
  try {
    const senderId = req.user;
    const { id: receiverId } = req.params;

    if (senderId.toString() === receiverId) {
      return res.status(400).json({ message: "Cannot send request to yourself" });
    }

    const [sender, receiver] = await Promise.all([
      User.findById(senderId),
      User.findById(receiverId)
    ]);

    if (!receiver) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if blocked
    if (sender.blockedUsers.includes(receiverId) || receiver.blockedUsers.includes(senderId)) {
      return res.status(403).json({ message: "Cannot send request" });
    }

    // Check if already friends/following
    if (sender.following.includes(receiverId)) {
      return res.status(400).json({ message: "Already following this user" });
    }

    // Check for existing pending request
    const existingRequest = await FriendRequest.findOne({
      sender: senderId,
      receiver: receiverId,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ message: "Request already sent" });
    }

    // For public accounts, follow instantly
    if (receiver.accountType === 'public') {
      sender.following.push(receiverId);
      receiver.followers.push(senderId);
      
      // Check if mutual relationship exists (receiver also follows sender)
      const isMutual = receiver.following.includes(senderId);
      
      // Only add to friends array if mutual
      if (isMutual) {
        if (!sender.friends.includes(receiverId)) {
          sender.friends.push(receiverId);
        }
        if (!receiver.friends.includes(senderId)) {
          receiver.friends.push(senderId);
        }
      }
      
      await Promise.all([sender.save(), receiver.save()]);

      // Create notification
      const notification = await Notification.create({
        sender: senderId,
        receiver: receiverId,
        type: 'follow',
        title: 'New Follower',
        message: `${sender.displayName || sender.username} started following you`
      });

      // Emit realtime notification
      emitNotification(receiverId.toString(), notification);

      return res.json({ 
        message: "Following user",
        type: 'instant',
        isMutual: isMutual
      });
    }

    // For private accounts, create request
    const friendRequest = await FriendRequest.create({
      sender: senderId,
      receiver: receiverId,
      type: 'follow'
    });

    sender.friendRequestsSent.push(receiverId);
    receiver.friendRequestsReceived.push(senderId);
    
    await Promise.all([sender.save(), receiver.save()]);

    // Create notification
    const notification = await Notification.create({
      sender: senderId,
      receiver: receiverId,
      type: 'friend_request',
      title: 'New Follow Request',
      message: `${sender.displayName || sender.username} wants to follow you`,
      metadata: { requestId: friendRequest._id.toString() }
    });

    // Emit realtime notification
    emitNotification(receiverId.toString(), notification);

    res.json({ 
      message: "Follow request sent",
      type: 'request',
      requestId: friendRequest._id
    });
  } catch (error) {
    console.error("Send friend request error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Cancel friend request
export const cancelFriendRequest = async (req, res) => {
  try {
    const senderId = req.user;
    const { id: receiverId } = req.params;

    const friendRequest = await FriendRequest.findOne({
      sender: senderId,
      receiver: receiverId,
      status: 'pending'
    });

    if (!friendRequest) {
      return res.status(404).json({ message: "Request not found" });
    }

    friendRequest.status = 'cancelled';
    await friendRequest.save();

    // Update user arrays
    await Promise.all([
      User.findByIdAndUpdate(senderId, {
        $pull: { friendRequestsSent: receiverId }
      }),
      User.findByIdAndUpdate(receiverId, {
        $pull: { friendRequestsReceived: senderId }
      })
    ]);

    res.json({ message: "Request cancelled" });
  } catch (error) {
    console.error("Cancel friend request error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Accept friend request
export const acceptFriendRequest = async (req, res) => {
  try {
    const receiverId = req.user;
    const { id: senderId } = req.params;

    console.log(`[ACCEPT REQUEST] Receiver: ${receiverId}, Sender: ${senderId}`);

    const friendRequest = await FriendRequest.findOne({
      sender: senderId,
      receiver: receiverId,
      status: 'pending'
    });

    if (!friendRequest) {
      console.log('[ACCEPT REQUEST] Request not found');
      return res.status(404).json({ message: "Request not found" });
    }

    // Update request status
    friendRequest.status = 'accepted';
    friendRequest.respondedAt = new Date();
    await friendRequest.save();
    console.log('[ACCEPT REQUEST] Request status updated to accepted');

    // Update both users with duplicate prevention
    const [sender, receiver] = await Promise.all([
      User.findById(senderId),
      User.findById(receiverId)
    ]);

    if (!sender || !receiver) {
      console.log('[ACCEPT REQUEST] Sender or receiver not found');
      return res.status(404).json({ message: "User not found" });
    }

    // Add to following/followers arrays
    if (!sender.following.includes(receiverId)) {
      sender.following.push(receiverId);
    }
    if (!receiver.followers.includes(senderId)) {
      receiver.followers.push(senderId);
    }

    // Check if mutual relationship exists (both follow each other)
    const isMutual = receiver.following.includes(senderId);
    console.log('[ACCEPT REQUEST] Is mutual relationship:', isMutual);

    // Only add to friends array if mutual relationship
    if (isMutual) {
      if (!sender.friends.includes(receiverId)) {
        sender.friends.push(receiverId);
        console.log('[ACCEPT REQUEST] Added receiver to sender friends');
      }
      if (!receiver.friends.includes(senderId)) {
        receiver.friends.push(senderId);
        console.log('[ACCEPT REQUEST] Added sender to receiver friends');
      }
    }

    // Remove from request arrays
    sender.friendRequestsSent = sender.friendRequestsSent.filter(
      id => id.toString() !== receiverId.toString()
    );
    receiver.friendRequestsReceived = receiver.friendRequestsReceived.filter(
      id => id.toString() !== senderId.toString()
    );

    await Promise.all([sender.save(), receiver.save()]);
    console.log('[ACCEPT REQUEST] Users updated successfully');

    // Create notification
    try {
      const notification = await Notification.create({
        sender: receiverId,
        receiver: senderId,
        type: 'request_accepted',
        title: 'Request Accepted',
        message: `${receiver.displayName || receiver.username} accepted your follow request`
      });
      console.log('[ACCEPT REQUEST] Notification created');

      // Emit realtime notification
      emitNotification(senderId.toString(), notification);
      console.log('[ACCEPT REQUEST] Notification emitted');
    } catch (notifError) {
      console.error('[ACCEPT REQUEST] Notification error:', notifError);
      // Don't fail the request if notification fails
    }

    res.json({ 
      message: "Request accepted",
      success: true,
      isMutual: isMutual
    });
  } catch (error) {
    console.error("[ACCEPT REQUEST] Error:", error);
    res.status(500).json({ 
      message: "Server error",
      error: error.message 
    });
  }
};

// Reject friend request
export const rejectFriendRequest = async (req, res) => {
  try {
    const receiverId = req.user;
    const { id: senderId } = req.params;

    const friendRequest = await FriendRequest.findOne({
      sender: senderId,
      receiver: receiverId,
      status: 'pending'
    });

    if (!friendRequest) {
      return res.status(404).json({ message: "Request not found" });
    }

    friendRequest.status = 'rejected';
    friendRequest.respondedAt = new Date();
    await friendRequest.save();

    // Update user arrays
    await Promise.all([
      User.findByIdAndUpdate(senderId, {
        $pull: { friendRequestsSent: receiverId }
      }),
      User.findByIdAndUpdate(receiverId, {
        $pull: { friendRequestsReceived: senderId }
      })
    ]);

    res.json({ message: "Request rejected" });
  } catch (error) {
    console.error("Reject friend request error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Remove friend/unfollow
export const removeFriend = async (req, res) => {
  try {
    const userId = req.user;
    const { id: friendId } = req.params;

    const [user, friend] = await Promise.all([
      User.findById(userId),
      User.findById(friendId)
    ]);

    if (!friend) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove from following/followers
    user.following = user.following.filter(id => id.toString() !== friendId);
    friend.followers = friend.followers.filter(id => id.toString() !== userId.toString());
    
    // Remove from friends array (since no longer mutual)
    user.friends = user.friends.filter(id => id.toString() !== friendId);
    friend.friends = friend.friends.filter(id => id.toString() !== userId.toString());

    await Promise.all([user.save(), friend.save()]);

    res.json({ message: "Unfollowed successfully" });
  } catch (error) {
    console.error("Remove friend error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get friends list - Only mutual followers (both follow each other)
export const getFriendsList = async (req, res) => {
  try {
    const userId = req.user;

    console.log('[GET FRIENDS LIST] User ID:', userId);

    const user = await User.findById(userId)
      .populate('followers', 'displayName username photoURL profileImage onlineStatus lastSeen email')
      .populate('following', 'displayName username photoURL profileImage onlineStatus lastSeen email')
      .lean();

    console.log('[GET FRIENDS LIST] User found:', !!user);
    console.log('[GET FRIENDS LIST] Followers count:', user?.followers?.length || 0);
    console.log('[GET FRIENDS LIST] Following count:', user?.following?.length || 0);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find mutual friends - users who are in BOTH followers AND following arrays
    const followerIds = new Set(user.followers.map(f => f._id.toString()));
    const mutualFriends = user.following.filter(followingUser => 
      followerIds.has(followingUser._id.toString())
    );

    console.log('[GET FRIENDS LIST] Mutual friends count:', mutualFriends.length);
    console.log('[GET FRIENDS LIST] Mutual friends:', mutualFriends.map(f => f.email || f.username));

    res.json({ friends: mutualFriends });
  } catch (error) {
    console.error("[GET FRIENDS LIST] Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get friend requests
export const getFriendRequests = async (req, res) => {
  try {
    const userId = req.user;

    const requests = await FriendRequest.find({
      receiver: userId,
      status: 'pending'
    })
      .populate('sender', 'displayName username photoURL profileImage')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ requests });
  } catch (error) {
    console.error("Get friend requests error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get followers
export const getFollowers = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .populate('followers', 'displayName username photoURL profileImage onlineStatus')
      .lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ followers: user.followers || [] });
  } catch (error) {
    console.error("Get followers error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get following
export const getFollowing = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .populate('following', 'displayName username photoURL profileImage onlineStatus')
      .lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ following: user.following || [] });
  } catch (error) {
    console.error("Get following error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
