# 🔧 Room Close & Channel Access - Complete Fix Guide

## Issues Fixed

### ✅ Issue 1: Channel Permission Error (403)
**Problem**: User couldn't access room channel after ping accept
**Fixed**: Proper member IDs added to channel creation

### ✅ Issue 2: Room Close Not Syncing
**Problem**: When one user closes room, other user's room stays open
**Fixed**: Backend sends `room_closed` event to all participants

---

## Backend Changes Applied

### 1. Enhanced Channel Creation
```javascript
// Now ensures all members can access channel
const allMembers = [...new Set([creatorId, ...memberIds])];
const channel = client.channel(channelType, channelId, {
  created_by_id: creatorId,
  members: allMembers  // Both users added
});
```

### 2. Room Close Event Broadcasting
```javascript
// When room closes, event sent to ALL participants
await channel.sendEvent({
  type: 'room_closed',
  user_id: userId,
  data: {
    roomId: room.roomId,
    closedBy: userId,
    timestamp: new Date().toISOString()
  }
});
```

---

## Frontend Implementation Required

### Step 1: Listen for Room Closed Event

```javascript
// In your CollabRoom component
useEffect(() => {
  if (!channel) return;

  // Listen for room closed event
  const handleRoomClosed = (event) => {
    console.log('[ROOM CLOSED] Room was closed by:', event.data.closedBy);
    
    // Show notification
    showNotification({
      type: 'info',
      title: 'Room Closed',
      message: 'The collaboration room has been closed'
    });
    
    // Cleanup and redirect
    cleanupRoom();
    navigate('/collab');  // or your dashboard route
  };

  channel.on('room_closed', handleRoomClosed);

  // Cleanup
  return () => {
    channel.off('room_closed', handleRoomClosed);
  };
}, [channel, navigate]);
```

### Step 2: Proper Room Cleanup Function

```javascript
const cleanupRoom = async () => {
  try {
    // 1. Stop video call if active
    if (videoCall) {
      await videoCall.leave();
      setVideoCall(null);
    }

    // 2. Leave Stream channel
    if (channel) {
      await channel.stopWatching();
    }

    // 3. Clear local state
    setMessages([]);
    setCanvasStrokes([]);
    setParticipants([]);
    
    console.log('✅ Room cleanup complete');
  } catch (error) {
    console.error('❌ Room cleanup error:', error);
  }
};
```

### Step 3: Close Room Button Handler

```javascript
const handleCloseRoom = async () => {
  // Show confirmation
  const confirmed = window.confirm(
    'Are you sure you want to close this room? This will end the session for all participants.'
  );
  
  if (!confirmed) return;

  try {
    // Call backend to close room
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

    // Backend will send room_closed event to all participants
    // Your event listener will handle cleanup and redirect
    
  } catch (error) {
    console.error('Failed to close room:', error);
    showError('Failed to close room. Please try again.');
  }
};
```

### Step 4: Handle Network Disconnection

```javascript
useEffect(() => {
  if (!channel) return;

  // Handle connection state changes
  const handleConnectionChanged = (event) => {
    if (event.online === false) {
      console.log('⚠️ Connection lost');
      showNotification({
        type: 'warning',
        message: 'Connection lost. Trying to reconnect...'
      });
    } else {
      console.log('✅ Connection restored');
      showNotification({
        type: 'success',
        message: 'Connection restored'
      });
    }
  };

  channel.on('connection.changed', handleConnectionChanged);

  return () => {
    channel.off('connection.changed', handleConnectionChanged);
  };
}, [channel]);
```

---

## Complete Room Component Example

```javascript
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StreamChat } from 'stream-chat';

function CollabRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [channel, setChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [videoCall, setVideoCall] = useState(null);

  // Initialize room
  useEffect(() => {
    const initRoom = async () => {
      try {
        // 1. Get room details from backend
        const roomResponse = await fetch(`/api/rooms/${roomId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const { room } = await roomResponse.json();

        // 2. Get Stream credentials
        const { token: streamToken, apiKey } = await fetch('/api/stream/token', {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json());

        // 3. Connect to Stream
        const client = StreamChat.getInstance(apiKey);
        await client.connectUser({ id: userId }, streamToken);

        // 4. Join room channel
        const roomChannel = client.channel('messaging', room.streamChannelId);
        await roomChannel.watch();

        setChannel(roomChannel);
        console.log('✅ Joined room:', roomId);

      } catch (error) {
        console.error('❌ Failed to join room:', error);
        navigate('/collab');
      }
    };

    initRoom();
  }, [roomId]);

  // Listen for room events
  useEffect(() => {
    if (!channel) return;

    // Message handler
    const handleMessage = (event) => {
      setMessages(prev => [...prev, event.message]);
    };

    // Room closed handler
    const handleRoomClosed = (event) => {
      console.log('[ROOM CLOSED]', event.data);
      
      showNotification({
        type: 'info',
        title: 'Room Closed',
        message: event.data.closedBy === userId 
          ? 'You closed the room' 
          : 'Room was closed by other participant'
      });

      // Cleanup and redirect after 2 seconds
      setTimeout(() => {
        cleanupRoom();
        navigate('/collab');
      }, 2000);
    };

    // Canvas draw handler
    const handleCanvasDraw = (event) => {
      drawOnCanvas(event.data.stroke);
    };

    // Register event listeners
    channel.on('message.new', handleMessage);
    channel.on('room_closed', handleRoomClosed);
    channel.on('canvas_draw', handleCanvasDraw);

    // Cleanup
    return () => {
      channel.off('message.new', handleMessage);
      channel.off('room_closed', handleRoomClosed);
      channel.off('canvas_draw', handleCanvasDraw);
    };
  }, [channel, userId, navigate]);

  // Cleanup function
  const cleanupRoom = async () => {
    try {
      if (videoCall) {
        await videoCall.leave();
      }
      if (channel) {
        await channel.stopWatching();
      }
      setMessages([]);
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  };

  // Close room handler
  const handleCloseRoom = async () => {
    if (!window.confirm('Close room for all participants?')) return;

    try {
      await fetch(`/api/rooms/close/${roomId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Event listener will handle cleanup
    } catch (error) {
      console.error('Failed to close room:', error);
      alert('Failed to close room');
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
        {/* Chat, Canvas, Video components */}
      </div>
    </div>
  );
}

export default CollabRoom;
```

---

## Testing Checklist

### Test Scenario 1: Room Join
- [ ] User A sends ping to User B
- [ ] User B accepts ping
- [ ] Both users can join the room
- [ ] No 403 errors in console
- [ ] Both users see each other online

### Test Scenario 2: Room Close by User A
- [ ] User A clicks "Close Room"
- [ ] User A gets confirmation dialog
- [ ] User A confirms closure
- [ ] User B receives `room_closed` event
- [ ] User B sees notification
- [ ] Both users redirected to dashboard
- [ ] Room marked as inactive in DB

### Test Scenario 3: Room Close by User B
- [ ] User B clicks "Close Room"
- [ ] User A receives `room_closed` event
- [ ] Both users redirected
- [ ] Room closed in DB

### Test Scenario 4: Network Issues
- [ ] Disconnect internet
- [ ] Users see "Connection lost" message
- [ ] Reconnect internet
- [ ] Users see "Connection restored" message
- [ ] Room functionality resumes

---

## Common Issues & Solutions

### Issue: 403 Error on Channel Access
**Solution**: Make sure backend creates channel with both user IDs in members array

### Issue: Room stays open for one user
**Solution**: Ensure frontend listens to `room_closed` event and cleans up properly

### Issue: Video/Audio continues after room close
**Solution**: Call `videoCall.leave()` in cleanup function before redirecting

### Issue: User can't rejoin closed room
**Solution**: This is expected behavior. Create new ping for new collaboration session

---

## API Endpoints

### Close Room
```
POST /api/rooms/close/:roomId
Authorization: Bearer {token}

Response:
{
  "message": "Room closed",
  "roomId": "abc-123"
}
```

### Get Room Details
```
GET /api/rooms/:roomId
Authorization: Bearer {token}

Response:
{
  "room": {
    "roomId": "abc-123",
    "streamChannelId": "room-abc-123",
    "participants": [...],
    "active": true
  }
}
```

---

**Status**: ✅ Backend fixes applied
**Required**: Frontend implementation needed
**Priority**: High - Critical for user experience
