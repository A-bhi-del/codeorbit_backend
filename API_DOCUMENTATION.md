# CodeOrbit Social & Realtime Collaboration API Documentation

## Authentication
All endpoints require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

---

## User Search & Discovery

### Search Users
```
GET /api/users/search?q=<query>
```
Search users by username, displayName, or uniqueId.

**Response:**
```json
{
  "users": [
    {
      "_id": "userId",
      "username": "john_doe",
      "displayName": "John Doe",
      "photoURL": "url",
      "bio": "Software Engineer",
      "onlineStatus": true
    }
  ]
}
```

### Get User by Username
```
GET /api/users/:username
```

### Get User Suggestions
```
GET /api/users/suggestions
```
Returns suggested users to follow.

### Get Mutual Friends
```
GET /api/users/mutual/:id
```

### Update Profile
```
PATCH /api/users/profile
```
**Body:**
```json
{
  "username": "new_username",
  "bio": "My bio",
  "accountType": "public|private",
  "socialLinks": {
    "github": "url",
    "linkedin": "url"
  },
  "profileImage": "url",
  "bannerImage": "url"
}
```

---

## Friends & Follow System

### Send Follow/Friend Request
```
POST /api/friends/request/:id
```
- Public accounts: instant follow
- Private accounts: creates pending request

**Response:**
```json
{
  "message": "Following user",
  "type": "instant|request"
}
```

### Cancel Friend Request
```
POST /api/friends/cancel/:id
```

### Accept Friend Request
```
POST /api/friends/accept/:id
```

### Reject Friend Request
```
POST /api/friends/reject/:id
```

### Remove Friend/Unfollow
```
DELETE /api/friends/remove/:id
```

### Get Friends List
```
GET /api/friends/list
```

### Get Friend Requests
```
GET /api/friends/requests
```

### Get Followers
```
GET /api/friends/followers/:id
```

### Get Following
```
GET /api/friends/following/:id
```

---

## Notifications

### Get Notifications
```
GET /api/notifications?limit=50&skip=0
```

**Response:**
```json
{
  "notifications": [...],
  "unreadCount": 5
}
```

### Mark as Read
```
PATCH /api/notifications/:id/read
```

### Mark All as Read
```
PATCH /api/notifications/read-all
```

### Delete Notification
```
DELETE /api/notifications/:id
```

### Get Unread Count
```
GET /api/notifications/unread-count
```

---

## Ping & Discussion Rooms

### Send Ping Request
```
POST /api/ping/send/:id
```
**Body:**
```json
{
  "message": "Let's solve problems together!"
}
```

### Accept Ping
```
POST /api/ping/accept/:id
```
Creates a discussion room and returns roomId.

**Response:**
```json
{
  "message": "Ping accepted",
  "roomId": "uuid",
  "room": {...}
}
```

### Reject Ping
```
POST /api/ping/reject/:id
```

### Get Pending Pings
```
GET /api/ping/pending
```

---

## Rooms

### Get Room by ID
```
GET /api/rooms/:roomId
```

### Get User's Rooms
```
GET /api/rooms/user/me
```

### Close Room
```
POST /api/rooms/:roomId/close
```

### Save Canvas Data
```
POST /api/rooms/:roomId/canvas
```
**Body:**
```json
{
  "strokes": [
    {
      "type": "draw",
      "points": [x1, y1, x2, y2],
      "color": "#000",
      "width": 2
    }
  ]
}
```

### Get Canvas Data
```
GET /api/rooms/:roomId/canvas
```

---

## Stream Chat Integration

### Get Stream Token
```
GET /api/stream/token
```

**Response:**
```json
{
  "token": "stream_token",
  "apiKey": "api_key",
  "userId": "stream_user_id"
}
```

### Initialize Stream User
```
POST /api/stream/initialize
```

---

## Stream.io Real-Time Events

### Connection
```javascript
import { StreamChat } from 'stream-chat';

// Get credentials from /api/stream/token
const { token, apiKey, userId } = await getStreamToken();

// Initialize and connect
const client = StreamChat.getInstance(apiKey);
await client.connectUser(
  { id: userId },
  token
);
```

### Notification Channel
Subscribe to personal notification channel for friend requests, pings, and status updates:

```javascript
const notificationChannel = client.channel('messaging', `notifications-${userId}`);
await notificationChannel.watch();
```

### Events to Listen

#### User Presence
```javascript
notificationChannel.on('user_online', (event) => {
  console.log('Friend online:', event.data.userId);
});

notificationChannel.on('user_offline', (event) => {
  console.log('Friend offline:', event.data.userId);
});
```

#### Friend Requests
```javascript
notificationChannel.on('friend_request_received', (event) => {
  const { sender } = event.data;
  console.log('Friend request from:', sender.displayName);
});

notificationChannel.on('request_accepted', (event) => {
  console.log('Friend request accepted');
});
```

#### Ping Requests
```javascript
notificationChannel.on('ping_request', (event) => {
  const { pingRequest } = event.data;
  console.log('Ping from:', pingRequest.displayName);
});

notificationChannel.on('ping_accepted', (event) => {
  const { roomId, streamChannelId } = event.data;
  console.log('Ping accepted, join room:', roomId);
});

notificationChannel.on('ping_rejected', (event) => {
  console.log('Ping was rejected');
});
```

### Room Channel
Join a room channel for chat, canvas, and video collaboration:

```javascript
const roomChannel = client.channel('messaging', `room-${roomId}`);
await roomChannel.watch();
```

#### Messages
```javascript
// Send message
await roomChannel.sendMessage({
  text: 'Hello!',
  user_id: userId
});

// Receive messages
roomChannel.on('message.new', (event) => {
  console.log('New message:', event.message.text);
  console.log('From:', event.user.name);
});
```

#### Typing Indicators
```javascript
// Send typing indicator
await roomChannel.keystroke();

// Listen for typing
roomChannel.on('typing.start', (event) => {
  console.log('User typing:', event.user.name);
});

roomChannel.on('typing.stop', (event) => {
  console.log('User stopped typing:', event.user.name);
});
```

#### Custom Events (Canvas, Video)
```javascript
// Send custom event
await roomChannel.sendEvent({
  type: 'canvas_draw',
  data: { stroke: strokeData }
});

await roomChannel.sendEvent({
  type: 'video_call_started',
  data: { userId }
});

// Listen to custom events
roomChannel.on('canvas_draw', (event) => {
  console.log('Drawing:', event.data.stroke);
});

roomChannel.on('canvas_erase', (event) => {
  console.log('Erasing:', event.data.area);
});

roomChannel.on('canvas_clear', (event) => {
  console.log('Canvas cleared');
});

roomChannel.on('video_call_started', (event) => {
  console.log('Video call started by:', event.data.userId);
});

roomChannel.on('video_call_ended', (event) => {
  console.log('Video call ended');
});
```

### Video Calling
Use Stream Video SDK for video calls:

```javascript
import { StreamVideoClient } from '@stream-io/video-react-sdk';

const videoClient = new StreamVideoClient({
  apiKey,
  user: { id: userId },
  token
});

const call = videoClient.call('default', `room-${roomId}`);
await call.join({ create: true });
```

### Disconnect
```javascript

socket.emit('video_call_ended', { roomId });
```

---

## Notification Types

- `friend_request` - New friend/follow request
- `request_accepted` - Friend request accepted
- `follow` - New follower (public account)
- `ping_request` - Ping request received
- `ping_accepted` - Ping accepted
- `ping_rejected` - Ping rejected
- `message` - New message
- `room_invite` - Room invitation

---

## Account Types

### Public Account
- Anyone can follow instantly
- No approval needed
- Profile visible to all

### Private Account
- Follow requests need approval
- Receiver can accept/reject
- More privacy control

---

## Environment Variables

Add to `.env`:
```
STREAM_API_KEY=your_stream_api_key
STREAM_API_SECRET=your_stream_api_secret
```

---

## Database Models

### User (Extended)
- username, uniqueId, bio
- profileImage, bannerImage
- accountType (public/private)
- followers[], following[], friends[]
- friendRequestsSent[], friendRequestsReceived[]
- blockedUsers[]
- onlineStatus, lastSeen, socketId
- streamUserId, streamToken
- socialLinks

### FriendRequest
- sender, receiver
- status (pending/accepted/rejected/cancelled)
- type (follow/friend)

### Notification
- sender, receiver
- type, title, message
- metadata, read

### PingRequest
- sender, receiver
- status (pending/accepted/rejected/expired)
- message, roomId
- expiresAt (5 minutes)

### Room
- roomId, participants[]
- createdBy, active
- streamChannelId
- canvasData

---

## Error Responses

All endpoints return standard error format:
```json
{
  "message": "Error description"
}
```

Common status codes:
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error
