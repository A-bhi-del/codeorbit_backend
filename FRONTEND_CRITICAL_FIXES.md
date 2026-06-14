# 🚨 Critical Frontend Fixes - Room Join & Close Issues

## Problems Identified

1. ❌ **Ping sender room join nahi ho pa raha** - Only acceptor joins
2. ❌ **Ping sender ka chat initialize nahi ho raha** - Chat not working for sender
3. ❌ **Room close sirf ek user ke liye ho raha** - Other user's room stays open

---

## Root Cause

### Issue 1 & 2: Ping Sender Not Joining
**Problem**: When User B accepts ping, User A doesn't automatically navigate to room.

**Backend sends this notification** (already implemented):
```javascript
// This event is sent to User A when User B accepts
{
  type: 'ping_accepted',
  data: {
    roomId: "abc-123",
    streamChannelId: "room-abc-123"
  }
}
```

**Frontend is NOT listening** to this event!

### Issue 3: Room Close Not Syncing
**Problem**: Frontend is NOT listening to `room_closed` event from backend.

**Backend sends this** (already implemented):
```javascript
// This event is sent to ALL participants when someone closes
{
  type: 'room_closed',
  data: {
    roomId: "abc-123",
    closedBy: "userId"
  }
}
```

---

## ✅ Complete Frontend Fixes

### Fix 1: Listen for Ping Accepted (Ping Sender Side)

Add this in your **Dashboard/Notifications component** where User A waits:

```javascript
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const navigate = useNavigate();
  const [notificationChannel, setNotificationChannel] = useState(null);

  useEffect(() => {
    const setupNotifications = async () => {
      // Get Stream client (you already have this)
      const { token, apiKey, userId } = await getStreamToken();
      const client = StreamChat.getInstance(apiKey);
      await client.connectUser({ id: userId }, token);

      // Watch notification channel
      const channel = client.channel('messaging', `notifications-${userId}`);
      await channel.watch();
      
      setNotificationChannel(channel);
    };

    setupNotifications();
  }, []);

  useEffect(() => {
    if (!notificationChannel) return;

    // ✅ CRITICAL: Listen for ping accepted event
    const handlePingAccepted = (event) => {
      console.log('[PING ACCEPTED] Event received:', event.data);
      
      const { roomId, streamChannelId } = event.data;
      
      // Show success notification
      showNotification({
        type: 'success',
        title: 'Ping Accepted!',
        message: 'Your collaboration request was accepted. Joining room...'
      });

      // Navigate to room after 1 second
      setTimeout(() => {
        navigate(`/collab/room/${roomId}`);
      }, 1000);
    };

    // Register event listener
    notificationChannel.on('ping_accepted', handlePingAccepted);

    // Cleanup
    return () => {
      notificationChannel.off('ping_accepted', handlePingAccepted);
    };
  }, [notificationChannel, navigate]);

  return (
    // Your dashboard UI
  );
}
```

---

### Fix 2: Room Close Event Listener

Add this in your **CollabRoom component**:

```javascript
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

function CollabRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [channel, setChannel] = useState(null);
  const [videoCall, setVideoCall] = useState(null);

  // Initialize room (existing code)
  useEffect(() => {
    const initRoom = async () => {
      try {
        // 1. Get room from backend
        const roomResponse = await fetch(`/api/rooms/${roomId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const { room } = await roomResponse.json();

        // 2. Get Stream credentials
        const { token: streamToken, apiKey, userId } = await getStreamToken();
        const client = StreamChat.getInstance(apiKey);
        await client.connectUser({ id: userId }, streamToken);

        // 3. Join room channel
        const roomChannel = client.channel('messaging', room.streamChannelId);
        await roomChannel.watch();

        setChannel(roomChannel);
        console.log('✅ Room joined:', roomId);

      } catch (error) {
        console.error('❌ Failed to join room:', error);
        alert('Failed to join room');
        navigate('/collab');
      }
    };

    initRoom();
  }, [roomId]);

  // ✅ CRITICAL: Listen for room events
  useEffect(() => {
    if (!channel) return;

    // Handle messages
    const handleMessage = (event) => {
      console.log('[CHAT] New message:', event.message);
      // Add message to your state/UI
      addMessageToChat(event.message);
    };

    // ✅ Handle room closed event
    const handleRoomClosed = (event) => {
      console.log('[ROOM CLOSED] Event received:', event.data);
      
      const isMe = event.data.closedBy === userId;
      
      // Show notification
      showNotification({
        type: 'info',
        title: 'Room Closed',
        message: isMe 
          ? 'You closed the collaboration room' 
          : 'Room was closed by other participant'
      });

      // Cleanup and redirect
      cleanupAndLeave();
    };

    // Handle canvas drawing
    const handleCanvasDraw = (event) => {
      console.log('[CANVAS] Draw event:', event.data);
      drawOnCanvas(event.data.stroke);
    };

    // Handle video call events
    const handleVideoStarted = (event) => {
      console.log('[VIDEO] Call started by:', event.data.userId);
      showJoinVideoButton();
    };

    // Register all event listeners
    channel.on('message.new', handleMessage);
    channel.on('room_closed', handleRoomClosed);  // ✅ CRITICAL
    channel.on('canvas_draw', handleCanvasDraw);
    channel.on('video_call_started', handleVideoStarted);

    // Cleanup
    return () => {
      channel.off('message.new', handleMessage);
      channel.off('room_closed', handleRoomClosed);
      channel.off('canvas_draw', handleCanvasDraw);
      channel.off('video_call_started', handleVideoStarted);
    };
  }, [channel, userId]);

  // ✅ Cleanup function
  const cleanupAndLeave = async () => {
    try {
      console.log('[CLEANUP] Starting cleanup...');

      // 1. Leave video call if active
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
      setCanvasStrokes([]);

      console.log('[CLEANUP] ✅ Cleanup complete');

      // 4. Redirect to dashboard
      setTimeout(() => {
        navigate('/collab');
      }, 1500);

    } catch (error) {
      console.error('[CLEANUP] Error:', error);
      // Force redirect even if cleanup fails
      navigate('/collab');
    }
  };

  // ✅ Close room handler
  const handleCloseRoom = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to close this room? This will end the session for all participants.'
    );

    if (!confirmed) return;

    try {
      console.log('[CLOSE] Closing room:', roomId);

      // Call backend API
      const response = await fetch(`/api/rooms/close/${roomId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to close room');
      }

      console.log('[CLOSE] ✅ Room closed successfully');

      // Backend will send room_closed event
      // Event listener above will handle cleanup

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

---

### Fix 3: Proper Chat Initialization

Make sure chat initializes for BOTH users:

```javascript
// In your CollabRoom component
useEffect(() => {
  if (!channel) return;

  // Load existing messages
  const loadMessages = async () => {
    try {
      const messages = channel.state.messages || [];
      setMessages(messages);
      console.log('[CHAT] Loaded messages:', messages.length);
    } catch (error) {
      console.error('[CHAT] Failed to load messages:', error);
    }
  };

  loadMessages();

  // Listen for new messages
  const handleMessage = (event) => {
    console.log('[CHAT] New message:', event.message);
    setMessages(prev => [...prev, event.message]);
  };

  channel.on('message.new', handleMessage);

  return () => {
    channel.off('message.new', handleMessage);
  };
}, [channel]);

// Send message function
const sendMessage = async (text) => {
  if (!text.trim() || !channel) return;

  try {
    console.log('[CHAT] Sending message:', text);
    
    await channel.sendMessage({
      text: text.trim()
    });

    console.log('[CHAT] ✅ Message sent');
    
  } catch (error) {
    console.error('[CHAT] Failed to send message:', error);
    alert('Failed to send message');
  }
};
```

---

### Fix 4: Handle Page Refresh/Navigation

Add this to prevent issues when user refreshes:

```javascript
// In CollabRoom component
useEffect(() => {
  // Handle page unload
  const handleBeforeUnload = (e) => {
    // Cleanup when page closes
    if (videoCall) {
      videoCall.leave();
    }
    if (channel) {
      channel.stopWatching();
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);

  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
}, [videoCall, channel]);
```

---

## Complete Flow Implementation

### User A (Ping Sender):

```javascript
// 1. Dashboard component
useEffect(() => {
  // Setup notification listener
  notificationChannel.on('ping_accepted', (event) => {
    // ✅ Navigate to room
    navigate(`/collab/room/${event.data.roomId}`);
  });
}, [notificationChannel]);

// 2. Room component
useEffect(() => {
  // Initialize room
  // ✅ Join Stream channel
  // ✅ Setup chat
  // ✅ Listen for room_closed
}, [roomId]);
```

### User B (Ping Receiver):

```javascript
// 1. Accept ping
const handleAccept = async (pingId) => {
  const response = await fetch(`/api/ping/accept/${pingId}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const { roomId } = await response.json();
  
  // ✅ Navigate to room
  navigate(`/collab/room/${roomId}`);
};

// 2. Room component (same as User A)
useEffect(() => {
  // Initialize room
  // ✅ Join Stream channel
  // ✅ Setup chat
  // ✅ Listen for room_closed
}, [roomId]);
```

---

## Testing Checklist

### Test 1: Ping Flow
- [ ] User A sends ping
- [ ] User B receives notification
- [ ] User B accepts ping
- [ ] **User A receives `ping_accepted` event**
- [ ] **User A navigates to room automatically**
- [ ] **Both users can see each other in room**

### Test 2: Chat
- [ ] **User A can send messages**
- [ ] **User B can send messages**
- [ ] **Both users see all messages**
- [ ] Timestamps shown correctly

### Test 3: Room Close
- [ ] User A clicks "Close Room"
- [ ] **User B receives `room_closed` event**
- [ ] **User B's video stops**
- [ ] **User B's audio stops**
- [ ] **Both users redirected to dashboard**
- [ ] Room marked inactive in DB

---

## Debug Logs to Add

Add these logs to track the flow:

```javascript
// Dashboard
console.log('[DASHBOARD] Notification channel setup');
console.log('[DASHBOARD] Listening for ping_accepted events');

// When ping accepted event comes
console.log('[PING ACCEPTED] Received event:', event.data);
console.log('[PING ACCEPTED] Navigating to room:', roomId);

// Room initialization
console.log('[ROOM] Initializing room:', roomId);
console.log('[ROOM] Getting Stream credentials');
console.log('[ROOM] Connecting to Stream');
console.log('[ROOM] Joining channel:', streamChannelId);
console.log('[ROOM] ✅ Room ready');

// Room close
console.log('[ROOM CLOSED] Event received');
console.log('[ROOM CLOSED] Closed by:', event.data.closedBy);
console.log('[ROOM CLOSED] Starting cleanup');
console.log('[ROOM CLOSED] ✅ Cleanup done');
```

---

## Quick Fix Summary

### 1. Add in Dashboard Component:
```javascript
notificationChannel.on('ping_accepted', (event) => {
  navigate(`/collab/room/${event.data.roomId}`);
});
```

### 2. Add in Room Component:
```javascript
channel.on('room_closed', (event) => {
  cleanupAndLeave();
});
```

### 3. Implement Cleanup:
```javascript
const cleanupAndLeave = async () => {
  await videoCall?.leave();
  await channel?.stopWatching();
  navigate('/collab');
};
```

---

## Common Mistakes to Avoid

❌ **Don't**:
```javascript
// Forgetting to listen for ping_accepted
// Only receiver navigates, sender doesn't know room is ready

// Not listening for room_closed
// Other user's room stays open

// Not stopping video on cleanup
// Audio/video continues even after room close
```

✅ **Do**:
```javascript
// Listen for ping_accepted on sender side
notificationChannel.on('ping_accepted', handlePingAccepted);

// Listen for room_closed on both sides
channel.on('room_closed', handleRoomClosed);

// Proper cleanup
await videoCall.leave();
await channel.stopWatching();
```

---

**Status**: 
- ✅ Backend: Already sending all required events
- 🔴 Frontend: Needs to implement event listeners
- 🎯 Priority: Critical - blocks core functionality

**Implement these fixes and test the complete flow!**
