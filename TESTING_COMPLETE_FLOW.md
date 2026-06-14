# 🧪 Complete Room Flow Testing Guide

## Test Scenario: Full Collaboration Flow

### Prerequisites
1. Two users logged in (User A & User B)
2. Both are friends
3. Both have Stream tokens
4. Open browser console (F12)

---

## Step-by-Step Testing with Console Logs

### Step 1: Send Ping Request (User A)

**Action**: User A clicks "Ping" button on User B's profile

**Expected Logs**:
```javascript
// Frontend Console (User A):
[PING] Sending ping to user: {userId}
[PING] Request sent successfully
[PING] Response: { message: "Ping sent", pingRequest: {...} }

// Frontend Console (User B):
[NOTIFICATION] New ping request received
[NOTIFICATION] From: {User A name}
[NOTIFICATION] Message: "wants to collaborate"
```

**What to Check**:
- ✅ No errors in console
- ✅ User B sees notification/modal
- ✅ Ping request ID received

---

### Step 2: Accept Ping (User B)

**Action**: User B clicks "Accept" on ping notification

**Expected Logs**:
```javascript
// Frontend Console (User B):
[PING ACCEPT] Accepting ping: {pingId}
[PING ACCEPT] Calling API: POST /api/ping/accept/{pingId}
[PING ACCEPT] Response: {
  success: true,
  roomId: "abc-123",
  streamChannelId: "room-abc-123"
}
[PING ACCEPT] Redirecting to room: /room/abc-123

// Frontend Console (User A):
[NOTIFICATION] Ping accepted by User B
[NOTIFICATION] Room created: abc-123
[NOTIFICATION] Navigating to room
```

**What to Check**:
- ✅ 200 OK response (not 500)
- ✅ roomId & streamChannelId received
- ✅ Both users redirected to room

---

### Step 3: Join Room (Both Users)

**Action**: Automatic after ping accept

**Expected Logs**:
```javascript
// Frontend Console (Both Users):
[ROOM] Initializing room: abc-123
[ROOM] Getting room details from API
[ROOM] Room data: {
  roomId: "abc-123",
  streamChannelId: "room-abc-123",
  participants: [...]
}
[STREAM] Getting Stream credentials
[STREAM] Connecting to Stream with userId: {userId}
[STREAM] ✅ Connected to Stream successfully
[STREAM] Joining channel: room-abc-123
[STREAM] Channel members: [user1, user2]
[STREAM] ✅ Watching channel successfully
[ROOM] ✅ Room initialization complete
```

**What to Check**:
- ✅ No 403 errors
- ✅ Channel watch successful
- ✅ Both users see each other in participants list

---

### Step 4: Send Chat Message (User A)

**Action**: User A types "Hello!" and sends

**Expected Logs**:
```javascript
// Frontend Console (User A):
[CHAT] Sending message: "Hello!"
[CHAT] Channel: room-abc-123
[CHAT] Message sent successfully

// Frontend Console (User B):
[CHAT] New message received
[CHAT] From: User A
[CHAT] Text: "Hello!"
[CHAT] Timestamp: {time}
[CHAT] Adding to UI
```

**What to Check**:
- ✅ Message appears for both users
- ✅ Timestamp shown
- ✅ User avatar displayed

---

### Step 5: Start Video Call (User A)

**Action**: User A clicks "Start Video" button

**Expected Logs**:
```javascript
// Frontend Console (User A):
[VIDEO] Requesting camera/mic permissions
[VIDEO] Permissions granted
[VIDEO] Initializing video client
[VIDEO] Creating call for room: room-abc-123
[VIDEO] Joining call...
[VIDEO] ✅ Joined call successfully
[VIDEO] Local stream started
[VIDEO] Sending video_call_started event

// Frontend Console (User B):
[VIDEO] Video call started by User A
[VIDEO] Showing join call button
[USER ACTION] User B clicks "Join Call"
[VIDEO] Joining call...
[VIDEO] ✅ Joined call
[VIDEO] Remote stream received from User A
[VIDEO] Local stream started
```

**What to Check**:
- ✅ Camera/mic permissions granted
- ✅ Local video visible
- ✅ Remote video visible for other user
- ✅ Audio working

---

### Step 6: Draw on Canvas (User B)

**Action**: User B draws a line on canvas

**Expected Logs**:
```javascript
// Frontend Console (User B):
[CANVAS] Drawing stroke
[CANVAS] Stroke data: { points: [...], color: "#FF0000", width: 3 }
[CANVAS] Sending canvas_draw event
[CANVAS] Event sent successfully

// Frontend Console (User A):
[CANVAS] Canvas draw event received
[CANVAS] Drawing stroke from User B
[CANVAS] Stroke: { points: [...], color: "#FF0000" }
[CANVAS] Rendered on canvas
```

**What to Check**:
- ✅ Drawing visible on both screens in real-time
- ✅ Colors match
- ✅ Stroke width correct

---

### Step 7: Close Room (User A)

**Action**: User A clicks "Close Room" → Confirms

**Expected Logs**:
```javascript
// Frontend Console (User A):
[ROOM] Close room button clicked
[ROOM] Showing confirmation dialog
[USER ACTION] User confirmed close
[ROOM] Calling API: POST /api/rooms/close/abc-123
[ROOM] Room closed successfully
[ROOM] Cleaning up resources
[VIDEO] Leaving video call...
[VIDEO] ✅ Video call left
[STREAM] Stopping channel watch
[STREAM] ✅ Channel watch stopped
[ROOM] Cleanup complete
[ROOM] Redirecting to /collab

// Frontend Console (User B):
[STREAM] Event received: room_closed
[ROOM] Room was closed by User A
[NOTIFICATION] Showing: "Room Closed"
[ROOM] Starting cleanup
[VIDEO] Leaving video call...
[VIDEO] ✅ Call left
[STREAM] Stopping channel watch
[STREAM] ✅ Watch stopped
[ROOM] ✅ Cleanup complete
[ROOM] Redirecting to /collab in 2s
```

**What to Check**:
- ✅ User A: API call successful (200 OK)
- ✅ User B: Receives `room_closed` event
- ✅ Both: Video call ends
- ✅ Both: Audio stops
- ✅ Both: Redirected to dashboard
- ✅ Room marked as inactive in DB

---

## Expected Console Output Summary

### ✅ Successful Flow:
```
User A: Send Ping → ✅ 200 OK
User B: Receive Notification → ✅ Event received
User B: Accept Ping → ✅ 200 OK → Room created
Both: Join Room → ✅ Channel joined
User A: Send Message → ✅ Delivered
User B: Receive Message → ✅ Displayed
User A: Start Video → ✅ Call started
User B: Join Video → ✅ Connected
User B: Draw Canvas → ✅ Synced to User A
User A: Close Room → ✅ 200 OK → Event sent
User B: Receive Close Event → ✅ Cleanup done
Both: Redirected → ✅ Success
```

### ❌ Common Errors to Watch For:

**403 Forbidden**:
```
❌ POST https://chat.stream-io-api.com/channels/... 403
Error: User not allowed to perform action
Fix: Check if user is in channel members
```

**500 Server Error**:
```
❌ POST /api/ping/accept/... 500
Error: Server error
Fix: Check backend logs, verify MongoDB connection
```

**Channel Watch Failed**:
```
❌ [STREAM] Failed to watch channel
Error: Channel not found or access denied
Fix: Verify streamChannelId is correct
```

**Video Permission Denied**:
```
❌ [VIDEO] Permission denied
Error: Camera/mic access denied
Fix: Check browser permissions
```

---

## Debugging Checklist

### Before Testing:
- [ ] Backend server running
- [ ] MongoDB connected
- [ ] Stream API keys configured
- [ ] Both users logged in
- [ ] Users are friends
- [ ] Browser console open (F12)

### During Testing:
- [ ] Monitor console for errors
- [ ] Check Network tab (F12 → Network)
- [ ] Verify API responses
- [ ] Watch for Stream events
- [ ] Check video/audio devices

### After Each Step:
- [ ] No errors in console
- [ ] Expected logs appeared
- [ ] UI updated correctly
- [ ] State synchronized

---

## Network Tab Verification

### Check These API Calls:

1. **Send Ping**:
```
POST /api/ping/send/{userId}
Status: 200 OK
Response: { message: "Ping sent", pingRequest: {...} }
```

2. **Accept Ping**:
```
POST /api/ping/accept/{pingId}
Status: 200 OK (NOT 500!)
Response: { 
  success: true,
  roomId: "...",
  streamChannelId: "..."
}
```

3. **Get Room**:
```
GET /api/rooms/{roomId}
Status: 200 OK
Response: { room: {...} }
```

4. **Close Room**:
```
POST /api/rooms/close/{roomId}
Status: 200 OK
Response: { message: "Room closed", roomId: "..." }
```

5. **Stream API Calls**:
```
GET https://chat.stream-io-api.com/...
Status: 200 OK (NOT 403!)
```

---

## What Backend Logs Show

Server will log these (check Render logs or terminal):

```bash
# Ping Send
[SEND PING] Sender: 6a2bed... Receiver: 6a2bef...
[SEND PING] Ping request created: 6a2e654...
[SEND PING] Notification created
[SEND PING] Ping sent successfully

# Ping Accept
[ACCEPT PING] Receiver: 6a2bef... PingId: 6a2e654...
[ACCEPT PING] Creating room: { roomId: "abc-123", streamChannelId: "room-abc-123" }
[ACCEPT PING] Stream IDs: { senderStreamId: "...", receiverStreamId: "..." }
[CREATE CHANNEL] Creating channel: { channelId: "room-abc-123", ... }
[CREATE CHANNEL] Channel created successfully: room-abc-123
[ACCEPT PING] Stream channel created successfully
[ACCEPT PING] Room created in DB: abc-123
[ACCEPT PING] Ping request updated
[ACCEPT PING] Notification created
[ACCEPT PING] Ping accepted successfully

# Room Close
[CLOSE ROOM] User: 6a2bed... Room: abc-123
[CLOSE ROOM] Room marked as closed
[CLOSE ROOM] Room closed event sent to all participants
[CLOSE ROOM] Stream channel deleted
```

---

## Frontend Implementation Checklist

To see all these logs, add this to your code:

```javascript
// In Ping Component
const sendPing = async (userId) => {
  console.log('[PING] Sending ping to user:', userId);
  const response = await api.post(`/ping/send/${userId}`);
  console.log('[PING] Response:', response.data);
};

// In Room Component
useEffect(() => {
  console.log('[ROOM] Initializing room:', roomId);
  // ... initialization
  console.log('[ROOM] ✅ Room initialization complete');
}, []);

// Stream Events
channel.on('room_closed', (event) => {
  console.log('[STREAM] Event received: room_closed');
  console.log('[ROOM] Room was closed by:', event.data.closedBy);
});

// Video Call
const startVideo = async () => {
  console.log('[VIDEO] Starting video call');
  // ... video logic
  console.log('[VIDEO] ✅ Video started');
};
```

---

## Quick Test Script

Run this in browser console to test API manually:

```javascript
// Test Ping Accept (replace IDs)
const testPingAccept = async () => {
  const token = localStorage.getItem('token');
  const pingId = 'YOUR_PING_ID';
  
  try {
    const response = await fetch(`/api/ping/accept/${pingId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', data);
    
    if (response.ok) {
      console.log('✅ SUCCESS - Room created:', data.roomId);
    } else {
      console.error('❌ FAILED:', data.message);
    }
  } catch (error) {
    console.error('❌ ERROR:', error);
  }
};

// Run test
testPingAccept();
```

---

**Status**: 
- ✅ Backend: Enhanced with detailed logging
- 🔴 Frontend: Needs to implement event listeners & logging
- 📋 Use this guide to test and debug the complete flow

**Next Steps**:
1. Open browser console (F12)
2. Follow each step above
3. Monitor logs at each stage
4. Report any errors you see
