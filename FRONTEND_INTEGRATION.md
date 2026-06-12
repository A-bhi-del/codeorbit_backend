# Frontend Integration Guide for Stream.io

## Quick Start

### 1. Install Dependencies
```bash
npm install stream-chat stream-chat-react @stream-io/video-react-sdk
```

### 2. Get Stream Token
```javascript
const getStreamToken = async () => {
  const response = await fetch('http://localhost:5000/api/stream/token', {
    headers: {
      'Authorization': `Bearer ${yourJWTToken}`
    }
  });
  return response.json();
};
```

### 3. Initialize Stream Client
```javascript
import { StreamChat } from 'stream-chat';

const initializeStream = async () => {
  const { token, apiKey, userId } = await getStreamToken();
  
  const client = StreamChat.getInstance(apiKey);
  await client.connectUser(
    {
      id: userId,
      name: userName,
      image: userAvatar
    },
    token
  );
  
  return client;
};
```

## Features Implementation

### Friend Requests

#### Setup Notification Channel
```javascript
const setupNotifications = async (client, userId) => {
  const channel = client.channel('messaging', `notifications-${userId}`);
  await channel.watch();
  
  // Listen for friend requests
  channel.on('friend_request_received', (event) => {
    const { sender } = event.data;
    showNotification({
      title: 'New Friend Request',
      message: `${sender.displayName} wants to be friends`,
      avatar: sender.photoURL
    });
  });
  
  // Listen for accepted requests
  channel.on('request_accepted', (event) => {
    showNotification({
      title: 'Friend Request Accepted',
      message: 'You have a new friend!'
    });
  });
  
  return channel;
};
```

#### Send Friend Request (Backend API)
```javascript
const sendFriendRequest = async (userId) => {
  const response = await fetch(`http://localhost:5000/api/friends/send/${userId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${yourJWTToken}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};
```

### Ping Requests

#### Listen for Pings
```javascript
notificationChannel.on('ping_request', (event) => {
  const { senderId, displayName, message, requestId } = event.data;
  
  showPingNotification({
    from: displayName,
    message: message,
    onAccept: () => acceptPing(requestId),
    onReject: () => rejectPing(requestId)
  });
});

notificationChannel.on('ping_accepted', (event) => {
  const { roomId, streamChannelId } = event.data;
  
  // Navigate to room
  navigateToRoom(roomId, streamChannelId);
});
```

#### Send Ping (Backend API)
```javascript
const sendPing = async (friendId, message) => {
  const response = await fetch(`http://localhost:5000/api/ping/send/${friendId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${yourJWTToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message })
  });
  return response.json();
};
```

### Chat Room

#### Join Room
```javascript
const joinRoom = async (client, roomId) => {
  const channel = client.channel('messaging', `room-${roomId}`);
  await channel.watch();
  
  // Load message history
  const messages = channel.state.messages;
  
  return channel;
};
```

#### Send Message
```javascript
const sendMessage = async (channel, messageText) => {
  await channel.sendMessage({
    text: messageText
  });
};
```

#### Listen to Messages
```javascript
channel.on('message.new', (event) => {
  const { message, user } = event;
  
  addMessageToUI({
    id: message.id,
    text: message.text,
    userId: user.id,
    userName: user.name,
    userAvatar: user.image,
    timestamp: message.created_at
  });
});
```

#### Typing Indicators
```javascript
// Send typing indicator
const handleTyping = async (channel) => {
  await channel.keystroke();
};

// Listen for typing
channel.on('typing.start', (event) => {
  showTypingIndicator(event.user.name);
});

channel.on('typing.stop', (event) => {
  hideTypingIndicator(event.user.id);
});
```

### Collaborative Canvas

#### Send Drawing Event
```javascript
const sendDrawing = async (channel, strokeData) => {
  await channel.sendEvent({
    type: 'canvas_draw',
    data: {
      stroke: {
        points: strokeData.points,
        color: strokeData.color,
        width: strokeData.width
      }
    }
  });
};
```

#### Listen to Drawing Events
```javascript
channel.on('canvas_draw', (event) => {
  const { stroke } = event.data;
  drawOnCanvas(stroke);
});

channel.on('canvas_erase', (event) => {
  const { area } = event.data;
  eraseFromCanvas(area);
});

channel.on('canvas_clear', (event) => {
  clearCanvas();
});
```

### Video Calling

#### Setup Video Client
```javascript
import { StreamVideoClient, StreamCall, StreamVideo } from '@stream-io/video-react-sdk';

const setupVideo = async (apiKey, token, userId) => {
  const videoClient = new StreamVideoClient({
    apiKey,
    user: {
      id: userId,
      name: userName,
      image: userAvatar
    },
    token
  });
  
  return videoClient;
};
```

#### Start Video Call
```javascript
const startVideoCall = async (videoClient, roomId) => {
  const call = videoClient.call('default', `room-${roomId}`);
  
  await call.join({ create: true });
  
  return call;
};
```

#### React Component Example
```jsx
import { StreamVideo, StreamCall, useCallStateHooks } from '@stream-io/video-react-sdk';

function VideoRoom({ roomId }) {
  const [call, setCall] = useState(null);
  const [videoClient, setVideoClient] = useState(null);
  
  useEffect(() => {
    const init = async () => {
      const { token, apiKey, userId } = await getStreamToken();
      
      const client = new StreamVideoClient({
        apiKey,
        user: { id: userId },
        token
      });
      
      const newCall = client.call('default', `room-${roomId}`);
      await newCall.join({ create: true });
      
      setVideoClient(client);
      setCall(newCall);
    };
    
    init();
    
    return () => {
      call?.leave();
      videoClient?.disconnectUser();
    };
  }, [roomId]);
  
  if (!call || !videoClient) return <div>Loading...</div>;
  
  return (
    <StreamVideo client={videoClient}>
      <StreamCall call={call}>
        <CallControls />
        <ParticipantView />
      </StreamCall>
    </StreamVideo>
  );
}
```

### Online/Offline Status

#### Listen to Status Changes
```javascript
notificationChannel.on('user_online', (event) => {
  const { userId } = event.data;
  updateUserStatus(userId, 'online');
});

notificationChannel.on('user_offline', (event) => {
  const { userId } = event.data;
  updateUserStatus(userId, 'offline');
});
```

#### Check Online Status
```javascript
const checkOnlineStatus = async (client, userIds) => {
  const { users } = await client.queryUsers({
    id: { $in: userIds }
  });
  
  return users.map(user => ({
    id: user.id,
    online: user.online
  }));
};
```

## Complete React Example

```jsx
import { useEffect, useState } from 'react';
import { StreamChat } from 'stream-chat';

function App() {
  const [client, setClient] = useState(null);
  const [notificationChannel, setNotificationChannel] = useState(null);
  const [currentRoom, setCurrentRoom] = useState(null);
  
  useEffect(() => {
    const init = async () => {
      // Get token from backend
      const { token, apiKey, userId } = await fetch('/api/stream/token', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt')}` }
      }).then(r => r.json());
      
      // Initialize Stream
      const streamClient = StreamChat.getInstance(apiKey);
      await streamClient.connectUser(
        { id: userId },
        token
      );
      
      // Setup notification channel
      const notifChannel = streamClient.channel('messaging', `notifications-${userId}`);
      await notifChannel.watch();
      
      // Listen to events
      notifChannel.on('friend_request_received', handleFriendRequest);
      notifChannel.on('ping_request', handlePingRequest);
      notifChannel.on('ping_accepted', handlePingAccepted);
      
      setClient(streamClient);
      setNotificationChannel(notifChannel);
    };
    
    init();
    
    return () => {
      client?.disconnectUser();
    };
  }, []);
  
  const joinRoom = async (roomId) => {
    const channel = client.channel('messaging', `room-${roomId}`);
    await channel.watch();
    
    channel.on('message.new', (event) => {
      console.log('New message:', event.message);
    });
    
    setCurrentRoom(channel);
  };
  
  return (
    <div>
      {/* Your app UI */}
    </div>
  );
}
```

## Testing

### Test Stream Connection
```javascript
const testConnection = async () => {
  try {
    const { token, apiKey, userId } = await getStreamToken();
    const client = StreamChat.getInstance(apiKey);
    await client.connectUser({ id: userId }, token);
    console.log('✅ Stream connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Stream connection failed:', error);
    return false;
  }
};
```

### Test Notification Channel
```javascript
const testNotifications = async (client, userId) => {
  const channel = client.channel('messaging', `notifications-${userId}`);
  await channel.watch();
  
  channel.on('*', (event) => {
    console.log('Event received:', event.type, event.data);
  });
  
  console.log('✅ Listening for notifications');
};
```

## Troubleshooting

### Issue: Token expired
**Solution**: Request a new token from `/api/stream/token`

### Issue: Channel not receiving events
**Solution**: Ensure channel is watched with `await channel.watch()`

### Issue: Messages not sending
**Solution**: Check if user is properly connected with `client.user`

### Issue: Video not working
**Solution**: Verify camera/microphone permissions and Stream Video SDK setup

## Resources

- [Stream Chat Documentation](https://getstream.io/chat/docs/)
- [Stream Video Documentation](https://getstream.io/video/docs/)
- [React SDK Guide](https://getstream.io/chat/docs/sdk/react/)
- [Stream Dashboard](https://getstream.io/dashboard/)
