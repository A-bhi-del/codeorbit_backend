# 🔧 Frontend Fixes Required

## Issue 1: Stream.io User Update Permission Error (FIXED)

### Problem
```
StreamChat error code 17: UpdateUsers failed with error: 
"User with role 'user' is not allowed to perform action UpdateUser"
```

### Root Cause
Frontend was trying to call `client.upsertUser()` directly, but only server-side code with API secret can create/update users.

### ✅ Backend Fix Applied
Removed `online` field from user creation to prevent frontend from trying to update it.

### 🔴 Frontend Action Required
**DO NOT** call these methods from frontend:
```javascript
// ❌ WRONG - Don't do this in frontend
await client.upsertUser({ ... });
await client.partialUpdateUser({ ... });
```

**✅ CORRECT** - Only connect user with token from backend:
```javascript
// Get token from backend
const { token, apiKey, userId } = await fetch('/api/stream/token').then(r => r.json());

// Connect user (this is allowed)
const client = StreamChat.getInstance(apiKey);
await client.connectUser(
  { id: userId },  // Minimal data
  token           // Server-generated token
);
```

### Online Status Handling
Stream.io automatically tracks online/offline status when user connects/disconnects. You don't need to manually update it!

```javascript
// ✅ Stream handles this automatically
client.on('user.presence.changed', (event) => {
  console.log('User online status changed:', event.user);
});
```

---

## Issue 2: Canvas Save Error 500 (FIXED)

### Problem
```
Failed to load resource: the server responded with a status of 500
POST /api/rooms/{roomId}/canvas
```

### ✅ Backend Fix Applied
- Added validation for canvas data
- Added detailed error logging
- Better error messages

### 🔴 Frontend Action Required

#### Correct Canvas Save Format
```javascript
// ✅ CORRECT format
const saveCanvas = async (roomId, strokes) => {
  try {
    const response = await fetch(`/api/rooms/${roomId}/canvas`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        strokes: strokes  // Must be an array
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Canvas save failed:', error);
      throw new Error(error.message);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to save canvas:', error);
    throw error;
  }
};
```

#### Stroke Data Structure
```javascript
// Each stroke should have this structure
const stroke = {
  type: 'draw',  // or 'erase'
  points: [x1, y1, x2, y2, ...],  // Array of numbers
  color: '#FF0000',
  width: 5,
  timestamp: new Date()
};

// Example usage
const strokes = [
  {
    type: 'draw',
    points: [10, 20, 30, 40, 50, 60],
    color: '#FF0000',
    width: 3,
    timestamp: new Date()
  },
  {
    type: 'draw',
    points: [100, 200, 150, 250],
    color: '#0000FF',
    width: 5,
    timestamp: new Date()
  }
];

await saveCanvas(roomId, strokes);
```

---

## Complete Stream.io Frontend Setup (Correct Way)

### Step 1: Get Token from Backend
```javascript
const getStreamCredentials = async () => {
  const response = await fetch('/api/stream/token', {
    headers: {
      'Authorization': `Bearer ${yourJWT}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to get Stream token');
  }
  
  return response.json(); // { token, apiKey, userId }
};
```

### Step 2: Initialize Stream Client
```javascript
import { StreamChat } from 'stream-chat';

const initializeStream = async () => {
  try {
    // Get credentials
    const { token, apiKey, userId } = await getStreamCredentials();
    
    // Initialize client
    const client = StreamChat.getInstance(apiKey);
    
    // Connect user (this is the ONLY user operation allowed from frontend)
    await client.connectUser(
      {
        id: userId
        // Do NOT add other fields here
      },
      token
    );
    
    console.log('✅ Stream connected successfully');
    return client;
  } catch (error) {
    console.error('❌ Stream initialization failed:', error);
    throw error;
  }
};
```

### Step 3: Setup Notification Channel
```javascript
const setupNotifications = async (client, userId) => {
  try {
    // Watch notification channel
    const channel = client.channel('messaging', `notifications-${userId}`);
    await channel.watch();
    
    // Listen to events
    channel.on('friend_request_received', (event) => {
      console.log('Friend request:', event.data);
      showNotification(event.data);
    });
    
    channel.on('ping_request', (event) => {
      console.log('Ping request:', event.data);
      showPingModal(event.data);
    });
    
    return channel;
  } catch (error) {
    console.error('Failed to setup notifications:', error);
    throw error;
  }
};
```

### Step 4: Join Room Channel
```javascript
const joinRoom = async (client, roomId) => {
  try {
    // Get room channel ID from backend first
    const roomResponse = await fetch(`/api/rooms/${roomId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const { room } = await roomResponse.json();
    
    // Join Stream channel
    const channel = client.channel('messaging', room.streamChannelId);
    await channel.watch();
    
    // Listen to messages
    channel.on('message.new', (event) => {
      console.log('New message:', event.message);
      addMessageToUI(event.message);
    });
    
    // Listen to custom events
    channel.on('canvas_draw', (event) => {
      console.log('Canvas draw:', event.data);
      drawOnCanvas(event.data.stroke);
    });
    
    return channel;
  } catch (error) {
    console.error('Failed to join room:', error);
    throw error;
  }
};
```

---

## Common Mistakes to Avoid

### ❌ Don't Do This:
```javascript
// 1. Don't try to update user from frontend
await client.upsertUser({ id: userId, online: true });  // ❌ WILL FAIL

// 2. Don't send canvas data in wrong format
await saveCanvas(roomId, { data: strokeData });  // ❌ WRONG

// 3. Don't forget authorization header
await fetch('/api/rooms/123', {});  // ❌ NO AUTH

// 4. Don't create channels without proper permissions
const channel = client.channel('messaging', 'random-id');
await channel.create();  // ❌ May fail
```

### ✅ Do This Instead:
```javascript
// 1. Let Stream handle online status automatically
await client.connectUser({ id: userId }, token);  // ✅ CORRECT

// 2. Send canvas data in correct format
await saveCanvas(roomId, strokesArray);  // ✅ CORRECT

// 3. Always include authorization
await fetch('/api/rooms/123', {
  headers: { 'Authorization': `Bearer ${token}` }
});  // ✅ CORRECT

// 4. Use channels created by backend
const { room } = await getRoomFromBackend(roomId);
const channel = client.channel('messaging', room.streamChannelId);
await channel.watch();  // ✅ CORRECT
```

---

## Testing Checklist

After applying fixes, test these:

- [ ] Stream connects without 403 error
- [ ] User appears online automatically
- [ ] Notifications receive correctly
- [ ] Canvas saves without 500 error
- [ ] Canvas loads with saved strokes
- [ ] Messages send/receive in room
- [ ] Friend requests work
- [ ] Ping requests work

---

## Debugging Tips

### Check Stream Connection
```javascript
console.log('Stream connected:', client.userID);
console.log('User info:', client.user);
```

### Check Canvas Data Before Save
```javascript
console.log('Saving canvas:', {
  roomId,
  strokesCount: strokes.length,
  isArray: Array.isArray(strokes),
  firstStroke: strokes[0]
});
```

### Monitor Network Requests
Open DevTools → Network tab and check:
- `/api/stream/token` - Should return 200
- `/api/rooms/{id}/canvas` - Should return 200
- Stream.io API calls - Should not see 403 errors

---

## Need Help?

If you still see errors:
1. Check browser console for exact error message
2. Check network tab for failed requests
3. Check backend logs for detailed errors
4. Verify JWT token is valid (not expired)
5. Verify Stream API credentials in `.env`

---

**Last Updated:** June 14, 2026
**Status:** Backend fixes applied, frontend changes required
