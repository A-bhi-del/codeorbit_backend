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
      name: userData.displayName || userData.username,
      image: userData.photoURL || userData.profileImage,
      role: 'user'
    });

    return userId;
  } catch (error) {
    console.error("Create Stream user error:", error);
    return null;
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

    const channel = client.channel(channelType, channelId, {
      created_by_id: creatorId,
      members: memberIds,
      ...channelData
    });

    await channel.create();
    return channel;
  } catch (error) {
    console.error("Create Stream channel error:", error);
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
