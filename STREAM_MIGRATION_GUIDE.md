# Socket.io to Stream.io Migration Guide

## Overview
This project has been migrated from Socket.io to Stream.io for all real-time functionality including:
- Friend requests and notifications
- Ping requests
- Chat messaging
- Video calling
- Online/offline status
- Room management

## Setup Requirements

### 1. Environment Variables
Add these to your `.env` file:
```env
STREAM_API_KEY=your_stream_api_key
STREAM_API_SECRET=your_stream_api_secret
```

Get your credentials from: https://getstream.io/dashboard/

### 2. Install Dependencies
```bash
npm install
```

Note: `socket.io` has been removed from dependencies. Only `stream-chat` is needed.

## Frontend Integration Guide

### 1. Install Stream SDK
```bash
npm install stream-chat stream-chat-react
```

### 2. Initialize Stream Client
```javascript
import { StreamChat } from 'stream-chat';

// Get token from backend
const response = await fetch('/api/stream/token', {
  headers: { Authorization: `Bearer ${yourJWT}` }
});
const { token, apiKey, userId } = await response.json();

// Initialize Stream client
const client = StreamChat.getInstance(apiKey);
await client.connectUser(
  { id: userId },
  token
);
```

### 3. Listen to Events

#### Friend Requests
```javascript
const notificationChannel = client.channel('messaging', `notifications-${userId}`);
await notificationChannel.watch();

notificationChannel.on('friend_request_received', (event) => {
  console.log('Friend request from:', event.data.sender);
  // Update UI
});

notificationChannel.on('request_accepted', (event) => {
  console.log('Friend request accepted');
  // Update UI
});
```

#### Ping Requests
```javascript
notificationChannel.on('ping_request', (event) => {
  console.log('Ping request:', event.data.pingRequest);
  // Show notification
});

notificationChannel.on('ping_accepted', (event) => {
  console.log('Ping accepted, room:', event.data.roomId);
  // Navigate to room
});
```

#### Online/Offline Status
```javascript
notificationChannel.on('user_online', (event) => {
  console.log('User online:', event.data.userId);
  // Update friend's status
});

notificationChannel.on('user_offline', (event) => {
  console.log('User offline:', event.data.userId);
  // Update friend's status
});
```

### 4. Room Chat
```javascript
// Join a room channel
const roomChannel = client.channel('messaging', `room-${roomId}`);
await roomChannel.watch();

// Send message
await roomChannel.sendMessage({
  text: 'Hello!',
  user_id: userId
});

// Listen to messages
roomChannel.on('message.new', (event) => {
  console.log('New message:', event.message);
  // Update chat UI
});

// Typing indicators
await roomChannel.keystroke();
roomChannel.on('typing.start', (event) => {
  console.log('User typing:', event.user);
});
```

### 5. Video Calling
```javascript
import { StreamVideoClient } from '@stream-io/video-react-sdk';

// Initialize video client
const videoClient = new StreamVideoClient({
  apiKey,
  user: { id: userId },
  token
});

// Create/join call
const call = videoClient.call('default', `room-${roomId}`);
await call.join({ create: true });
```

## Key Differences from Socket.io

### Before (Socket.io)
```javascript
// Connect
const socket = io('http://localhost:5000', {
  auth: { token: yourJWT }
});

// Listen
socket.on('friend_request_received', (data) => {});

// Emit
socket.emit('send_message', { roomId, message });
```

### After (Stream.io)
```javascript
// Connect
const client = StreamChat.getInstance(apiKey);
await client.connectUser({ id: userId }, token);

// Listen (via channels)
const channel = client.channel('messaging', channelId);
await channel.watch();
channel.on('friend_request_received', (event) => {});

// Send (via channels)
await channel.sendMessage({ text: message });
```

## Backend Changes

### Removed Files
- `sockets/socketManager.js` - No longer needed

### Updated Files
1. **services/stream.service.js** - Enhanced with all real-time functions
2. **controllers/friends.controller.js** - Uses Stream notifications
3. **controllers/ping.controller.js** - Uses Stream notifications
4. **controllers/auth.controller.js** - Creates Stream users on signup/login
5. **controllers/rooms.controller.js** - Manages Stream channels
6. **server.js** - Removed Socket.io initialization

## Migration Checklist

Backend:
- [x] Remove Socket.io dependency
- [x] Update all controllers to use Stream.io
- [x] Create Stream users on authentication
- [x] Create Stream channels for rooms
- [x] Remove socket middleware

Frontend (Your tasks):
- [ ] Install Stream SDK
- [ ] Replace Socket.io connection with Stream
- [ ] Update event listeners
- [ ] Test friend requests
- [ ] Test ping requests
- [ ] Test chat messaging
- [ ] Test video calling
- [ ] Test online/offline status

## Testing

### 1. Test Stream Connection
```bash
curl -X GET http://localhost:5000/api/stream/token \
  -H "Authorization: Bearer YOUR_JWT"
```

### 2. Test Friend Request
```bash
curl -X POST http://localhost:5000/api/friends/send/{userId} \
  -H "Authorization: Bearer YOUR_JWT"
```

### 3. Test Ping Request
```bash
curl -X POST http://localhost:5000/api/ping/send/{userId} \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"message":"Let'\''s collaborate"}'
```

## Support

Stream.io Documentation:
- Chat: https://getstream.io/chat/docs/
- Video: https://getstream.io/video/docs/

## Notes

- All real-time functionality now uses Stream.io webhooks and events
- Stream handles presence, typing indicators, and read receipts automatically
- Video calling is now native through Stream Video SDK
- Better scalability and reliability than Socket.io
