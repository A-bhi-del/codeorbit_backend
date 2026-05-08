# Changelog - Social & Realtime Collaboration Features

## Version 2.0.0 - Social & Realtime Features

### Added

#### Models
- **FriendRequest Model** - Manages follow/friend requests with status tracking
- **Notification Model** - Stores user notifications with multiple types
- **PingRequest Model** - Handles collaboration ping requests with expiry
- **Room Model** - Discussion rooms with canvas data persistence

#### User Model Extensions
- Social profile fields (username, uniqueId, bio, profileImage, bannerImage)
- Account type (public/private)
- Social graph (followers, following, friends)
- Friend request tracking (sent/received)
- Blocked users list
- Online presence (onlineStatus, lastSeen, socketId)
- Stream integration (streamUserId, streamToken)
- Social links (GitHub, LinkedIn, Twitter, Portfolio)
- Database indexes for optimized queries

#### Controllers
- **users.controller.js** - User search, discovery, profile management
- **friends.controller.js** - Follow/friend system with request handling
- **notifications.controller.js** - Notification CRUD operations
- **ping.controller.js** - Ping request management
- **rooms.controller.js** - Discussion room management
- **stream.controller.js** - Stream Chat integration

#### Routes
- `/api/users` - User search and profile endpoints
- `/api/friends` - Friend/follow system endpoints
- `/api/notifications` - Notification management endpoints
- `/api/ping` - Ping request endpoints
- `/api/rooms` - Room management endpoints
- `/api/stream` - Stream Chat integration endpoints

#### Services
- **stream.service.js** - Stream Chat SDK integration
  - User creation and management
  - Token generation
  - Channel management

#### Socket.IO Implementation
- **socketManager.js** - Complete Socket.IO server
  - JWT authentication middleware
  - User presence tracking
  - Real-time event broadcasting
  - Socket-user mapping
  - Room management
  - Canvas synchronization
  - Video call signaling

#### Socket Events
**Client → Server:**
- `join_room` - Join discussion room
- `leave_room` - Leave discussion room
- `typing_start` - Start typing indicator
- `typing_stop` - Stop typing indicator
- `send_message` - Send chat message
- `canvas_draw` - Draw on canvas
- `canvas_erase` - Erase canvas area
- `canvas_clear` - Clear entire canvas
- `video_call_started` - Start video call
- `video_call_ended` - End video call

**Server → Client:**
- `user_online` - Friend came online
- `user_offline` - Friend went offline
- `notification_received` - New notification
- `friend_request_received` - New friend request
- `friend_request_accepted` - Request accepted
- `ping_request` - New ping request
- `ping_accepted` - Ping accepted with room
- `ping_rejected` - Ping rejected
- `user_joined_room` - User joined room
- `user_left_room` - User left room
- `typing_start` - User typing
- `typing_stop` - User stopped typing
- `receive_message` - New message
- `canvas_draw` - Canvas drawing
- `canvas_erase` - Canvas erase
- `canvas_clear` - Canvas cleared
- `video_call_started` - Video call started
- `video_call_ended` - Video call ended

#### Middleware
- **socket.middleware.js** - Socket.IO authentication with JWT/Firebase support

#### Jobs
- **expirePings.job.js** - Cron job to expire pending pings after 5 minutes

#### Utilities
- **validation.util.js** - Input validation for social features
  - Username validation
  - Bio validation
  - URL validation
  - Search query sanitization

#### Documentation
- **API_DOCUMENTATION.md** - Complete API reference
- **SETUP_SOCIAL.md** - Setup and integration guide
- **.env.example** - Environment variables template

### Modified

#### server.js
- Added HTTP server creation
- Initialized Socket.IO
- Initialized Stream Chat
- Added expire pings cron job

#### app.js
- Added new route imports
- Registered new API routes
- Updated CORS configuration for Socket.IO

### Features

#### 1. Social Graph System
- User profiles with customizable fields
- Public/Private account types
- Social links integration
- Profile and banner images

#### 2. Follow/Friend System
- Instagram-style follow mechanism
- Public accounts: instant follow
- Private accounts: request-based
- Accept/reject friend requests
- Unfollow functionality
- Followers/Following lists
- Mutual friends detection

#### 3. User Search & Discovery
- Real-time user search
- Search by username, displayName, uniqueId
- User suggestions algorithm
- Optimized MongoDB text search
- Pagination support

#### 4. Notification System
- Multiple notification types
- Real-time delivery via Socket.IO
- Mark as read/unread
- Unread count tracking
- Notification deletion
- Pagination support

#### 5. Ping & Collaboration
- Ping friends to collaborate
- Only friends can ping each other
- Online status check
- 5-minute expiry for pending pings
- Auto-create discussion rooms on accept
- Room participant management

#### 6. Discussion Rooms
- Unique room IDs
- Participant tracking
- Active/closed status
- Canvas data persistence
- Stream channel integration
- Room history

#### 7. Collaborative Whiteboard
- Real-time drawing synchronization
- Draw/erase/clear operations
- Stroke persistence
- Color and width support
- Room-based broadcasting
- Canvas state recovery

#### 8. Stream Chat Integration
- Auto-create Stream users on signup
- Token generation for authentication
- Channel creation for rooms
- Video SDK support hooks
- User profile synchronization

#### 9. Online Presence
- Real-time online/offline status
- Last seen timestamps
- Socket ID tracking
- Friend presence updates
- Automatic status updates

### Technical Improvements

#### Database
- Added indexes for performance
- Optimized queries with `.lean()`
- Selective field population
- Compound indexes for complex queries

#### Performance
- In-memory socket mapping
- Efficient user lookup
- Pagination on large datasets
- Throttled canvas events

#### Security
- JWT authentication for sockets
- Authorization checks on all endpoints
- Input validation
- Blocked user prevention
- Private account privacy

#### Scalability
- Stateless socket management
- Room-based event broadcasting
- Efficient query patterns
- Cron job for cleanup

### Dependencies Added
- `uuid` (v9.0.1) - For unique room ID generation

### Breaking Changes
None - All changes are additive and backward compatible.

### Migration Notes
1. Existing users will have default values for new fields
2. No data migration required
3. Indexes will be created automatically
4. Stream integration is optional

### Environment Variables
New optional variables:
- `STREAM_API_KEY` - Stream Chat API key
- `STREAM_API_SECRET` - Stream Chat API secret

### API Endpoints Summary
- 6 new route files
- 35+ new endpoints
- RESTful design
- Consistent error handling

### Testing Recommendations
1. Test Socket.IO connection with JWT
2. Test follow flow (public vs private)
3. Test ping request expiry
4. Test real-time notifications
5. Test canvas synchronization
6. Test presence updates

### Future Enhancements
- Rate limiting on ping requests
- Block user functionality
- Report user system
- Group rooms (3+ participants)
- File sharing in rooms
- Voice messages
- Screen sharing
- Recording functionality
- Analytics dashboard
- Push notifications
- Email notifications
- Mobile app support

### Known Limitations
1. Stream Chat requires API credentials
2. Canvas data stored in MongoDB (consider separate storage for scale)
3. Socket.IO requires sticky sessions for horizontal scaling
4. No rate limiting implemented yet

### Contributors
- Extended existing CodeOrbit backend architecture
- Maintained code consistency
- Followed existing patterns

---

## Version 1.0.0 - Initial Release
- User authentication (JWT + Firebase)
- LeetCode integration
- Codeforces integration
- GitHub integration
- CodeChef integration
- GeeksforGeeks integration
- Analytics system
- Leaderboard
- Contest tracking
- Problem recommendations
- Profile management
