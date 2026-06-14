import { StreamChat } from 'stream-chat';

let streamClient;

export const initializeStreamChat = () => {
  const apiKey = process.env.STREAM_API_KEY;
  const apiSecret = process.env.STREAM_API_SECRET;

  if (!apiKey || !apiSecret) {
    console.warn("Stream API credentials not configured");
    return null;
  }

  streamClient = StreamChat.getInstance(apiKey, apiSecret);
  console.log("Stream Chat initialized");
  return streamClient;
};

export const getStreamClient = () => {
  if (!streamClient) {
    return initializeStreamChat();
  }
  return streamClient;
};

export const createStreamUser = async (userId, userData) => {
  try {
    const client = getStreamClient();
    if (!client) return null;

    await client.upsertUser({
      id: userId,
      name: userData.displayName || userData.username || 'User',
      image: userData.photoURL || userData.profileImage,
      role: 'user'
    });

    return userId;
  } catch (error) {
    console.error("Create Stream user error:", error);
    return null;
  }
};

export const updateStreamUserStatus = async (userId, online) => {
  try {
    const client = getStreamClient();
    if (!client) return null;

    await client.partialUpdateUser({
      id: userId,
      set: { online }
    });

    return true;
  } catch (error) {
    console.error("Update Stream user status error:", error);
    return false;
  }
};

export const generateStreamToken = (userId) => {
  try {
    const client = getStreamClient();
    if (!client) return null;

    const token = client.createToken(userId);
    return token;
  } catch (error) {
    console.error("Generate Stream token error:", error);
    return null;
  }
};

export const createStreamChannel = async (channelId, channelType, creatorId, memberIds, channelData = {}) => {
  try {
    const client = getStreamClient();
    if (!client) return null;

    console.log('[CREATE CHANNEL] Creating channel:', { channelId, channelType, creatorId, memberIds });

    // Ensure creator is in members list
    const allMembers = [...new Set([creatorId, ...memberIds])];
    
    console.log('[CREATE CHANNEL] All members:', allMembers);

    const channel = client.channel(channelType, channelId, {
      created_by_id: creatorId,
      members: allMembers,
      ...channelData
    });

    await channel.create();
    console.log('[CREATE CHANNEL] Channel created successfully:', channelId);
    
    // Verify members were added
    const channelState = channel.state;
    console.log('[CREATE CHANNEL] Channel members:', Object.keys(channelState.members || {}));
    
    return channel;
  } catch (error) {
    console.error("[CREATE CHANNEL] Error:", error);
    console.error("[CREATE CHANNEL] Error details:", error.message);
    return null;
  }
};

export const deleteStreamChannel = async (channelType, channelId) => {
  try {
    const client = getStreamClient();
    if (!client) return null;

    const channel = client.channel(channelType, channelId);
    await channel.delete();
    return true;
  } catch (error) {
    console.error("Delete Stream channel error:", error);
    return false;
  }
};

export const getStreamUserToken = async (userId) => {
  try {
    const client = getStreamClient();
    if (!client) return null;

    const token = client.createToken(userId);
    return {
      token,
      apiKey: process.env.STREAM_API_KEY
    };
  } catch (error) {
    console.error("Get Stream user token error:", error);
    return null;
  }
};

export const sendStreamNotification = async (userId, notificationData) => {
  try {
    const client = getStreamClient();
    if (!client) return null;

    const channel = client.channel('messaging', `notifications-${userId}`, {
      created_by_id: 'system',
      members: [userId]
    });

    await channel.sendMessage({
      text: notificationData.message,
      user_id: 'system',
      customData: {
        type: notificationData.type,
        title: notificationData.title,
        metadata: notificationData.metadata
      }
    });

    return true;
  } catch (error) {
    console.error("Send Stream notification error:", error);
    return false;
  }
};

export const sendFriendRequestNotification = async (receiverId, senderData) => {
  try {
    const client = getStreamClient();
    if (!client) return null;

    const channel = client.channel('messaging', `notifications-${receiverId}`, {
      members: [receiverId]
    });

    await channel.sendEvent({
      type: 'friend_request_received',
      user_id: senderData.userId,
      data: {
        sender: senderData,
        timestamp: new Date().toISOString()
      }
    });

    return true;
  } catch (error) {
    console.error("Send friend request notification error:", error);
    return false;
  }
};

export const sendPingRequestNotification = async (receiverId, pingData) => {
  try {
    const client = getStreamClient();
    if (!client) return null;

    const channel = client.channel('messaging', `notifications-${receiverId}`, {
      members: [receiverId]
    });

    await channel.sendEvent({
      type: 'ping_request',
      user_id: pingData.senderId,
      data: {
        pingRequest: pingData,
        timestamp: new Date().toISOString()
      }
    });

    return true;
  } catch (error) {
    console.error("Send ping request notification error:", error);
    return false;
  }
};

export const sendPingAcceptedNotification = async (senderId, roomData) => {
  try {
    const client = getStreamClient();
    if (!client) return null;

    const channel = client.channel('messaging', `notifications-${senderId}`, {
      members: [senderId]
    });

    await channel.sendEvent({
      type: 'ping_accepted',
      data: {
        roomId: roomData.roomId,
        room: roomData,
        timestamp: new Date().toISOString()
      }
    });

    return true;
  } catch (error) {
    console.error("Send ping accepted notification error:", error);
    return false;
  }
};

export const notifyUserOnline = async (userId, friendIds) => {
  try {
    const client = getStreamClient();
    if (!client) return null;

    for (const friendId of friendIds) {
      const channel = client.channel('messaging', `notifications-${friendId}`, {
        members: [friendId]
      });

      await channel.sendEvent({
        type: 'user_online',
        user_id: userId,
        data: { userId, timestamp: new Date().toISOString() }
      });
    }

    return true;
  } catch (error) {
    console.error("Notify user online error:", error);
    return false;
  }
};

export const notifyUserOffline = async (userId, friendIds) => {
  try {
    const client = getStreamClient();
    if (!client) return null;

    for (const friendId of friendIds) {
      const channel = client.channel('messaging', `notifications-${friendId}`, {
        members: [friendId]
      });

      await channel.sendEvent({
        type: 'user_offline',
        user_id: userId,
        data: { userId, timestamp: new Date().toISOString() }
      });
    }

    return true;
  } catch (error) {
    console.error("Notify user offline error:", error);
    return false;
  }
};

// Ensure both users exist in Stream before creating a channel
export const ensureStreamUsers = async (userIds, usersData) => {
  try {
    const client = getStreamClient();
    if (!client) return false;

    console.log('[ENSURE USERS] Upserting users:', userIds);

    const streamUsers = userIds.map((userId, index) => {
      const userData = usersData[index] || {};
      return {
        id: userId,
        name: userData.displayName || userData.username || userData.email || 'User',
        image: userData.photoURL || userData.profileImage,
        role: 'user'
      };
    });

    await client.upsertUsers(streamUsers);
    console.log('[ENSURE USERS] ✅ All users upserted successfully');

    return true;
  } catch (error) {
    console.error("[ENSURE USERS] Error:", error);
    console.error("[ENSURE USERS] Error details:", error.message);
    return false;
  }
};
