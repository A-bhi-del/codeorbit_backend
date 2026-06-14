# 🚀 Frontend Changes Required (Hindi Guide)

## 2 Critical Changes Chahiye

---

## Change 1: Ping Sender Ko Room Mein Le Jaana

### Problem:
- User A ping bhejta hai
- User B accept karta hai
- **User B toh room mein chala jata hai ✅**
- **Lekin User A ko pata hi nahi chalta ❌**
- User A manually refresh kare ya notification check kare

### Solution:
Dashboard/Notification component mein event listener add karo

### File: `Dashboard.jsx` ya `Notifications.jsx` (jahan notifications dikhti hain)

```javascript
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StreamChat } from 'stream-chat';

function Dashboard() {
  const navigate = useNavigate();
  const [notificationChannel, setNotificationChannel] = useState(null);

  // Step 1: Notification channel setup (ye already hoga shayad)
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        // Get Stream credentials
        const response = await fetch('/api/stream/token', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const { token, apiKey, userId } = await response.json();

        // Connect to Stream
        const client = StreamChat.getInstance(apiKey);
        await client.connectUser({ id: userId }, token);

        // Watch notification channel
        const channel = client.channel('messaging', `notifications-${userId}`);
        await channel.watch();
        
        setNotificationChannel(channel);
        console.log('[DASHBOARD] Notification channel ready');
      } catch (error) {
        console.error('[DASHBOARD] Setup failed:', error);
      }
    };

    setupNotifications();

    return () => {
      notificationChannel?.stopWatching();
    };
  }, []);

  // Step 2: ✅ YE ADD KARO - Ping accepted event listener
  useEffect(() => {
    if (!notificationChannel) return;

    const handlePingAccepted = (event) => {
      console.log('[PING ACCEPTED] Event received:', event.data);
      
      const { roomId } = event.data;
      
      // Show success notification/toast
      // toast.success('Your ping was accepted! Joining room...');
      
      // Navigate to room
      console.log('[NAVIGATION] Going to room:', roomId);
      navigate(`/collab/room/${roomId}`);
    };

    // Register listener
    notificationChannel.on('ping_accepted', handlePingAccepted);

    console.log('[DASHBOARD] Listening for ping_accepted events');

    // Cleanup
    return () => {
      notificationChannel.off('ping_accepted', handlePingAccepted);
    };
  }, [notificationChannel, navigate]);

  return (
    <div>
      {/* Your dashboard UI */}
    </div>
  );
}

export default Dashboard;
```

### Kya Hoga:
```
User A ping bhejta hai
        ↓
User B accept karta hai
        ↓
Backend sends ping_accepted event to User A
        ↓
✅ User A ka dashboard receives event
        ↓
✅ User A automatically room mein chala jata hai
        ↓
✅ Dono users room mein hain ab!
```

---

## Change 2: Room Close Dono Ke Liye

### Problem:
- User A room close karta hai
- **User A toh dashboard pe chala jata hai ✅**
- **Lekin User B ka room open hi rehta hai ❌**
- User B ko manually close karna padta hai
- Video/Audio chalta rehta hai

### Solution:
Room component mein event listener add karo

### File: `CollabRoom.jsx` ya `Room.jsx` (collaboration room component)

```javascript
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { StreamChat } from 'stream-chat';

function CollabRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [channel, setChannel] = useState(null);
  const [videoCall, setVideoCall] = useState(null);
  const [messages, setMessages] = useState([]);

  // Step 1: Room initialize (ye already hoga)
  useEffect(() => {
    const initRoom = async () => {
      try {
        console.log('[ROOM] Initializing room:', roomId);

        // Get room details
        const roomResponse = await fetch(`/api/rooms/${roomId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const { room } = await roomResponse.json();

        console.log('[ROOM] Room data:', room);

        // Get Stream credentials
        const tokenResponse = await fetch('/api/stream/token', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const { token, apiKey, userId } = await tokenResponse.json();

        // Connect to Stream
        const client = StreamChat.getInstance(apiKey);
        await client.connectUser({ id: userId }, token);

        // Join room channel
        const roomChannel = client.channel('messaging', room.streamChannelId);
        await roomChannel.watch();

        setChannel(roomChannel);
        console.log('[ROOM] ✅ Successfully joined room');

      } catch (error) {
        console.error('[ROOM] Failed to initialize:', error);
        alert('Failed to join room');
        navigate('/collab');
      }
    };

    initRoom();

    return () => {
      // Cleanup on unmount
      if (videoCall) {
        videoCall.leave();
      }
      if (channel) {
        channel.stopWatching();
      }
    };
  }, [roomId]);

  // Step 2: ✅ YE ADD KARO - Room events listener
  useEffect(() => {
    if (!channel) return;

    // Chat messages
    const handleMessage = (event) => {
      console.log('[CHAT] New message:', event.message);
      setMessages(prev => [...prev, event.message]);
    };

    // ✅ CRITICAL: Room closed event
    const handleRoomClosed = async (event) => {
      console.log('[ROOM CLOSED] Event received');
      console.log('[ROOM CLOSED] Closed by:', event.data.closedBy);
      
      const isMe = event.data.closedBy === event.user_id;
      
      // Show notification
      if (isMe) {
        // toast.info('You closed the room');
        console.log('[ROOM CLOSED] I closed the room');
      } else {
        // toast.info('Room was closed by other participant');
        console.log('[ROOM CLOSED] Other user closed the room');
      }

      // Cleanup and redirect
      await cleanupAndLeave();
    };

    // Register all listeners
    channel.on('message.new', handleMessage);
    channel.on('room_closed', handleRoomClosed); // ✅ CRITICAL

    console.log('[ROOM] Listening for events');

    // Cleanup
    return () => {
      channel.off('message.new', handleMessage);
      channel.off('room_closed', handleRoomClosed);
    };
  }, [channel]);

  // Step 3: ✅ YE ADD KARO - Cleanup function
  const cleanupAndLeave = async () => {
    try {
      console.log('[CLEANUP] Starting cleanup...');

      // 1. Leave video call
      if (videoCall) {
        console.log('[CLEANUP] Leaving video call');
        await videoCall.leave();
        setVideoCall(null);
      }

      // 2. Stop watching channel
      if (channel) {
        console.log('[CLEANUP] Stopping channel watch');
        await channel.stopWatching();
        setChannel(null);
      }

      // 3. Clear state
      setMessages([]);

      console.log('[CLEANUP] ✅ Cleanup complete');

      // 4. Redirect after 1 second
      setTimeout(() => {
        console.log('[REDIRECT] Going to dashboard');
        navigate('/collab');
      }, 1000);

    } catch (error) {
      console.error('[CLEANUP] Error:', error);
      // Force redirect even if cleanup fails
      navigate('/collab');
    }
  };

  // Step 4: ✅ Close room button handler
  const handleCloseRoom = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to close this room? This will end the session for all participants.'
    );

    if (!confirmed) return;

    try {
      console.log('[CLOSE] Closing room:', roomId);

      const response = await fetch(`/api/rooms/close/${roomId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to close room');
      }

      console.log('[CLOSE] ✅ Room closed successfully');
      
      // Backend will send room_closed event
      // Event listener (handleRoomClosed) will handle cleanup

    } catch (error) {
      console.error('[CLOSE] Failed to close room:', error);
      alert('Failed to close room. Please try again.');
    }
  };

  return (
    <div className="collab-room">
      <div className="room-header">
        <h2>Collaboration Room</h2>
        <button onClick={handleCloseRoom} className="close-btn">
          Close Room
        </button>
      </div>

      <div className="room-content">
        {/* Your chat, canvas, video components */}
      </div>
    </div>
  );
}

export default CollabRoom;
```

### Kya Hoga:
```
User A clicks "Close Room"
        ↓
Backend marks room as inactive
        ↓
Backend sends room_closed event to channel
        ↓
✅ User A receives event → cleanup → redirect
✅ User B receives event → cleanup → redirect
        ↓
✅ Dono users dashboard pe aa jate hain
✅ Video/Audio stop ho jata hai
✅ Channel watch stop ho jati hai
```

---

## Complete Flow Visualization

### Scenario 1: Ping Accept
```
User A                          User B
  |                               |
  | Sends ping                    |
  |------------------------------>|
  |                               |
  |                          Accepts ping
  |                               |
  |<-- Backend sends event -------|
  |                               |
Navigate to room            Navigate to room
  |                               |
  |<------ Both in room --------->|
  |                               |
Chat connected ✅          Chat connected ✅
```

### Scenario 2: Room Close
```
User A                          User B
  |                               |
  |<------ Both in room --------->|
  |                               |
Clicks close                      |
  |                               |
Backend sends event ------------->|
  |                               |
Receives event              Receives event
  |                               |
Cleanup + Redirect          Cleanup + Redirect
  |                               |
Dashboard ✅                Dashboard ✅
```

---

## Testing Checklist

### Test 1: Ping Flow
- [ ] User A sends ping
- [ ] User B receives notification
- [ ] User B clicks accept
- [ ] **User B goes to room ✅**
- [ ] **User A automatically goes to room ✅** (Check console for event)
- [ ] **Both see each other in participants ✅**

### Test 2: Chat
- [ ] **User A sends message → User B receives ✅**
- [ ] **User B sends message → User A receives ✅**
- [ ] Messages appear in real-time

### Test 3: Room Close
- [ ] User A clicks "Close Room"
- [ ] **User A redirects to dashboard ✅**
- [ ] **User B also redirects to dashboard ✅** (Check console for event)
- [ ] **Both users' video/audio stops ✅**

---

## Console Logs To Watch

### When Ping Accepted (User A side):
```
[PING ACCEPTED] Event received: { roomId: "abc-123", ... }
[NAVIGATION] Going to room: abc-123
[ROOM] Initializing room: abc-123
[ROOM] ✅ Successfully joined room
```

### When Room Closed (Both sides):
```
[ROOM CLOSED] Event received
[ROOM CLOSED] Closed by: user-id
[CLEANUP] Starting cleanup...
[CLEANUP] Leaving video call
[CLEANUP] Stopping channel watch
[CLEANUP] ✅ Cleanup complete
[REDIRECT] Going to dashboard
```

---

## Files to Modify

### 1. Dashboard Component
**File**: `src/components/Dashboard.jsx` (ya jahan notifications hain)

**Add**:
```javascript
// Ping accepted event listener
notificationChannel.on('ping_accepted', (event) => {
  navigate(`/collab/room/${event.data.roomId}`);
});
```

### 2. Room Component
**File**: `src/components/CollabRoom.jsx` (ya room component)

**Add**:
```javascript
// Room closed event listener
channel.on('room_closed', handleRoomClosed);

// Cleanup function
const cleanupAndLeave = async () => {
  await videoCall?.leave();
  await channel?.stopWatching();
  navigate('/collab');
};
```

---

## Important Notes

### 1. Stream Client Instance
Agar already Stream client use kar rahe ho, toh `StreamChat.getInstance()` use karo, naya instance mat banao:

```javascript
const client = StreamChat.getInstance(apiKey);
```

### 2. User ID Consistency
Backend jo `userId` return kar raha hai token mein, wahi use karo:

```javascript
const { token, apiKey, userId } = await response.json();
await client.connectUser({ id: userId }, token);
```

### 3. Channel ID
Backend se jo `streamChannelId` aa rahi hai, wahi use karo:

```javascript
const channel = client.channel('messaging', room.streamChannelId);
```

### 4. Cleanup Important Hai
Hamesha video call aur channel watch stop karo before redirecting:

```javascript
await videoCall?.leave();
await channel?.stopWatching();
```

---

## Quick Summary

### Sirf 2 Cheezein Add Karni Hain:

1. **Dashboard mein** (5 lines):
   ```javascript
   notificationChannel.on('ping_accepted', (event) => {
     navigate(`/collab/room/${event.data.roomId}`);
   });
   ```

2. **Room mein** (10 lines):
   ```javascript
   channel.on('room_closed', async (event) => {
     await videoCall?.leave();
     await channel?.stopWatching();
     navigate('/collab');
   });
   ```

**Bas! Backend already sab kuch bhej raha hai. Sirf ye events listen karne hain.**

---

## Help Needed?

Agar koi confusion hai ya code mein problem aa rahi hai, toh console logs dekho:

```
[DASHBOARD] - Dashboard events
[ROOM] - Room initialization
[CHAT] - Chat messages
[CLEANUP] - Cleanup process
[REDIRECT] - Navigation
```

Console clear logs show karega ki kya ho raha hai step by step.

**Backend ready hai ✅. Ab sirf ye 2 frontend changes chahiye!**
