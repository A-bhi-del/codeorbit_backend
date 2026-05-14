import mongoose from "mongoose";
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

    // Check if already friends
    if (sender.friends.some(id => id.toString() === receiverId)) {
      return res.status(400).json({ message: "Already friends with this user" });
    }

    // Check if already following
    if (sender.following.some(id => id.toString() === receiverId)) {
      return res.status(400).json({ message: "Already following this user" });
    }

    // Check for existing pending request in EITHER direction (A→B or B→A)
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: senderId, receiver: receiverId, status: 'pending' },
        { sender: receiverId, receiver: senderId, status: 'pending' }
      ]
    });

    if (existingRequest) {
      if (existingRequest.sender.toString() === senderId.toString()) {
        return res.status(400).json({ message: "Request already sent" });
      } else {
        return res.status(400).json({ message: "This user has already sent you a request. Please check your friend requests." });
      }
    }

    // For public accounts, create bidirectional friendship instantly
    if (receiver.accountType === 'public') {
      const senderIdStr = senderId.toString();
      const receiverIdStr = receiverId.toString();
      
      // Sender → Receiver
      sender.following.push(receiverId);
      sender.followers.push(receiverId);
      if (!sender.friends.some(id => id.toString() === receiverIdStr)) {
        sender.friends.push(receiverId);
      }
      
      // Receiver → Sender (AUTOMATIC)
      receiver.followers.push(senderId);
      receiver.following.push(senderId);
      if (!receiver.friends.some(id => id.toString() === senderIdStr)) {
        receiver.friends.push(senderId);
      }
      
      await Promise.all([sender.save(), receiver.save()]);

      console.log('[PUBLIC ACCOUNT] Sender friends:', sender.friends.map(id => id.toString()));
      console.log('[PUBLIC ACCOUNT] Receiver friends:', receiver.friends.map(id => id.toString()));

      // Create notification
      const notification = await Notification.create({
        sender: senderId,
        receiver: receiverId,
        type: 'new_friend',
        title: 'New Friend',
        message: `${sender.displayName || sender.username} is now your friend`
      });

      // Emit realtime notification
      emitNotification(receiverId.toString(), notification);

      return res.json({ 
        message: "You are now friends!",
        type: 'instant',
        isMutual: true
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
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const receiverId = req.user;
    const { id: senderId } = req.params;

    console.log(`[ACCEPT REQUEST] Receiver: ${receiverId}, Sender: ${senderId}`);

    const friendRequest = await FriendRequest.findOne({
      sender: senderId,
      receiver: receiverId,
      status: 'pending'
    }).session(session);

    if (!friendRequest) {
      await session.abortTransaction();
      console.log('[ACCEPT REQUEST] Request not found');
      return res.status(404).json({ message: "Request not found" });
    }

    // Update request status
    friendRequest.status = 'accepted';
    friendRequest.respondedAt = new Date();
    await friendRequest.save({ session });
    console.log('[ACCEPT REQUEST] Request status updated to accepted');

    // Get both users
    const [sender, receiver] = await Promise.all([
      User.findById(senderId).session(session),
      User.findById(receiverId).session(session)
    ]);

    if (!sender || !receiver) {
      await session.abortTransaction();
      console.log('[ACCEPT REQUEST] Sender or receiver not found');
      return res.status(404).json({ message: "User not found" });
    }

    // BIDIRECTIONAL FRIENDSHIP: Both users become friends immediately
    
    // Convert to string for comparison
    const senderIdStr = senderId.toString();
    const receiverIdStr = receiverId.toString();
    
    // Sender → Receiver relationship
    if (!sender.following.some(id => id.toString() === receiverIdStr)) {
      sender.following.push(receiverId);
    }
    if (!sender.friends.some(id => id.toString() === receiverIdStr)) {
      sender.friends.push(receiverId);
    }
    if (!sender.followers.some(id => id.toString() === receiverIdStr)) {
      sender.followers.push(receiverId);
    }

    // Receiver → Sender relationship (AUTOMATIC)
    if (!receiver.followers.some(id => id.toString() === senderIdStr)) {
      receiver.followers.push(senderId);
    }
    if (!receiver.friends.some(id => id.toString() === senderIdStr)) {
      receiver.friends.push(senderId);
    }
    if (!receiver.following.some(id => id.toString() === senderIdStr)) {
      receiver.following.push(senderId);
    }
    
    console.log('[ACCEPT REQUEST] Sender friends after:', sender.friends.map(id => id.toString()));
    console.log('[ACCEPT REQUEST] Receiver friends after:', receiver.friends.map(id => id.toString()));

    // Remove from request arrays
    sender.friendRequestsSent = sender.friendRequestsSent.filter(
      id => id.toString() !== receiverId.toString()
    );
    receiver.friendRequestsReceived = receiver.friendRequestsReceived.filter(
      id => id.toString() !== senderId.toString()
    );

    await Promise.all([
      sender.save({ session }),
      receiver.save({ session })
    ]);
    console.log('[ACCEPT REQUEST] Both users updated with bidirectional friendship');

    // Commit the transaction
    await session.commitTransaction();
    console.log('[ACCEPT REQUEST] Transaction committed successfully');

    // Create notification (outside transaction - non-critical)
    try {
      const notification = await Notification.create({
        sender: receiverId,
        receiver: senderId,
        type: 'request_accepted',
        title: 'Request Accepted',
        message: `${receiver.displayName || receiver.username} accepted your friend request`
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
      message: "Friend request accepted. You are now friends!",
      success: true,
      isMutual: true
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("[ACCEPT REQUEST] Error:", error);
    res.status(500).json({ 
      message: "Server error",
      error: error.message 
    });
  } finally {
    session.endSession();
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

// Remove friend/unfollow (bidirectional)
export const removeFriend = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user;
    const { id: friendId } = req.params;

    const [user, friend] = await Promise.all([
      User.findById(userId).session(session),
      User.findById(friendId).session(session)
    ]);

    if (!friend) {
      await session.abortTransaction();
      return res.status(404).json({ message: "User not found" });
    }

    const userIdStr = userId.toString();
    const friendIdStr = friendId.toString();

    // Remove bidirectional friendship
    user.following = user.following.filter(id => id.toString() !== friendIdStr);
    user.followers = user.followers.filter(id => id.toString() !== friendIdStr);
    user.friends = user.friends.filter(id => id.toString() !== friendIdStr);
    
    friend.followers = friend.followers.filter(id => id.toString() !== userIdStr);
    friend.following = friend.following.filter(id => id.toString() !== userIdStr);
    friend.friends = friend.friends.filter(id => id.toString() !== userIdStr);

    await Promise.all([
      user.save({ session }),
      friend.save({ session })
    ]);

    await session.commitTransaction();

    console.log('[REMOVE FRIEND] User friends after:', user.friends.map(id => id.toString()));
    console.log('[REMOVE FRIEND] Friend friends after:', friend.friends.map(id => id.toString()));

    res.json({ message: "Friendship removed successfully" });
  } catch (error) {
    await session.abortTransaction();
    console.error("Remove friend error:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    session.endSession();
  }
};

// Get friends list - Users in the friends array
export const getFriendsList = async (req, res) => {
  try {
    const userId = req.user;

    console.log('[GET FRIENDS LIST] User ID:', userId);

    const user = await User.findById(userId)
      .populate('friends', 'displayName username photoURL profileImage onlineStatus lastSeen email')
      .lean();

    console.log('[GET FRIENDS LIST] User found:', !!user);
    console.log('[GET FRIENDS LIST] Friends count:', user?.friends?.length || 0);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ friends: user.friends || [] });
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
