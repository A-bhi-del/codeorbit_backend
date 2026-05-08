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

## Socket.IO Events

### Connection
```javascript
const socket = io('http://localhost:5000', {
  auth: {
    token: 'jwt_token'
  }
});
```

### Events to Listen

#### User Presence
- `user_online` - Friend came online
- `user_offline` - Friend went offline

#### Notifications
- `notification_received` - New notification

#### Friend Requests
- `friend_request_received` - New friend request
- `friend_request_accepted` - Request accepted

#### Ping Requests
- `ping_request` - New ping request
- `ping_accepted` - Ping accepted with room details
- `ping_rejected` - Ping rejected

#### Room Events
- `user_joined_room` - User joined room
- `user_left_room` - User left room

#### Typing Indicators
- `typing_start` - User started typing
- `typing_stop` - User stopped typing

#### Messages
- `receive_message` - New message in room

#### Canvas Events
- `canvas_draw` - Drawing stroke
- `canvas_erase` - Erase action
- `canvas_clear` - Clear canvas

#### Video Call
- `video_call_started` - Video call started
- `video_call_ended` - Video call ended

### Events to Emit

#### Room Management
```javascript
socket.emit('join_room', { roomId });
socket.emit('leave_room', { roomId });
```

#### Typing
```javascript
socket.emit('typing_start', { roomId });
socket.emit('typing_stop', { roomId });
```

#### Messages
```javascript
socket.emit('send_message', { roomId, message });
```

#### Canvas
```javascript
socket.emit('canvas_draw', { roomId, stroke });
socket.emit('canvas_erase', { roomId, area });
socket.emit('canvas_clear', { roomId });
```

#### Video
```javascript
socket.emit('video_call_started', { roomId });
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
