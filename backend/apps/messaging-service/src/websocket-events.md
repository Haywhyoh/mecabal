# WebSocket Events Documentation

## Connection Events

### Client → Server Events

#### `sendMessage`
Send a new message to a conversation.

**Payload:**
```typescript
{
  conversationId: string;
  content: string;
  type?: 'text' | 'image' | 'video' | 'audio' | 'location' | 'file' | 'system';
  replyToMessageId?: string;
  metadata?: {
    imageUrl?: string;
    imageWidth?: number;
    imageHeight?: number;
    videoUrl?: string;
    videoDuration?: number;
    audioUrl?: string;
    audioDuration?: number;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    location?: {
      latitude: number;
      longitude: number;
      address?: string;
    };
  };
}
```

**Response:**
```typescript
{
  success: boolean;
  message?: MessageResponseDto;
  error?: string;
}
```

#### `typing`
Update typing indicator status.

**Payload:**
```typescript
{
  conversationId: string;
  isTyping: boolean;
}
```

**Response:**
```typescript
{
  success: boolean;
  error?: string;
}
```

#### `markAsRead`
Mark messages as read.

**Payload:**
```typescript
{
  conversationId: string;
  messageId?: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  error?: string;
}
```

#### `markMessageAsDelivered`
Mark a message as delivered.

**Payload:**
```typescript
{
  messageId: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  error?: string;
}
```

#### `joinConversation`
Join a conversation room.

**Payload:**
```typescript
{
  conversationId: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  error?: string;
}
```

#### `leaveConversation`
Leave a conversation room.

**Payload:**
```typescript
{
  conversationId: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  error?: string;
}
```

#### `editMessage`
Edit an existing message.

**Payload:**
```typescript
{
  messageId: string;
  content: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  message?: MessageResponseDto;
  error?: string;
}
```

#### `deleteMessage`
Delete a message.

**Payload:**
```typescript
{
  messageId: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  error?: string;
}
```

#### `getOnlineUsers`
Get online users in a conversation.

**Payload:**
```typescript
{
  conversationId: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  onlineUsers?: string[];
  error?: string;
}
```

#### `getTypingUsers`
Get currently typing users in a conversation.

**Payload:**
```typescript
{
  conversationId: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  typingUsers?: Array<{
    userId: string;
    isTyping: boolean;
    timestamp: Date;
    userInfo?: {
      firstName: string;
      lastName: string;
    };
  }>;
  error?: string;
}
```

#### `getReadReceipts`
Get read receipts for a message.

**Payload:**
```typescript
{
  messageId: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  receipts?: Array<{
    userId: string;
    status: 'sent' | 'delivered' | 'read';
    timestamp: Date;
    userInfo?: {
      firstName: string;
      lastName: string;
    };
  }>;
  error?: string;
}
```

### Server → Client Events

#### `newMessage`
New message received in a conversation.

**Payload:**
```typescript
{
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: string;
  replyToMessageId?: string;
  metadata?: Record<string, any>;
  isEdited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    profilePictureUrl?: string;
  };
  replyToMessage?: MessageResponseDto;
  timestamp: Date;
}
```

#### `messageUpdated`
Message was edited.

**Payload:**
```typescript
MessageResponseDto
```

#### `messageDeleted`
Message was deleted.

**Payload:**
```typescript
{
  messageId: string;
  conversationId: string;
  deletedBy: string;
  timestamp: Date;
}
```

#### `userTyping`
User typing status changed.

**Payload:**
```typescript
{
  conversationId: string;
  userId: string;
  isTyping: boolean;
  timestamp: Date;
  userInfo?: {
    firstName: string;
    lastName: string;
  };
}
```

#### `messageRead`
Message was read by a user.

**Payload:**
```typescript
{
  conversationId: string;
  userId: string;
  messageId?: string;
  timestamp: Date;
  userInfo?: {
    firstName: string;
    lastName: string;
  };
}
```

#### `messageDelivered`
Message was delivered to a user.

**Payload:**
```typescript
{
  messageId: string;
  conversationId: string;
  userId: string;
  timestamp: Date;
}
```

#### `conversationUpdated`
Conversation was updated (new message, etc.).

**Payload:**
```typescript
{
  conversationId: string;
  lastMessage: MessageResponseDto;
  updatedAt: Date;
  unreadCount: Record<string, number>;
}
```

#### `unreadCountsUpdated`
Unread counts were updated.

**Payload:**
```typescript
{
  conversationId: string;
  unreadCounts: Record<string, number>;
  timestamp: Date;
}
```

#### `messageReceipts`
Message receipts were updated.

**Payload:**
```typescript
{
  messageId: string;
  conversationId: string;
  receipts: Array<{
    userId: string;
    status: 'sent' | 'delivered' | 'read';
    timestamp: Date;
    user?: {
      id: string;
      firstName: string;
      lastName: string;
      profilePictureUrl?: string;
    };
  }>;
  timestamp: Date;
}
```

#### `userStatusChanged`
User online/offline status changed.

**Payload:**
```typescript
{
  userId: string;
  isOnline: boolean;
  timestamp: Date;
}
```

#### `messageSent`
Message was sent (broadcast to sender's other devices).

**Payload:**
```typescript
{
  messageId: string;
  conversationId: string;
  status: 'sent';
}
```

#### `messagesRead`
Messages were read (broadcast to user's other devices).

**Payload:**
```typescript
{
  conversationId: string;
  messageId?: string;
  timestamp: Date;
}
```

## Connection Management

### Authentication
WebSocket connections require JWT authentication via:
- `auth.token` in handshake
- `Authorization: Bearer <token>` header

### Room Management
- Users are automatically joined to their conversation rooms on connection
- Rooms are named: `conversation:{conversationId}`
- Users can manually join/leave rooms using `joinConversation`/`leaveConversation`

### Error Handling
All events return a response with:
- `success: boolean` - Whether the operation succeeded
- `error?: string` - Error message if failed
- `data?: any` - Response data if successful

### Rate Limiting
- Typing indicators are automatically cleaned up after 5 seconds of inactivity
- Expired typing indicators are cleaned up every 30 seconds
- Message sending should be rate limited on the client side

## Usage Examples

### Basic Message Sending
```typescript
// Send a text message
socket.emit('sendMessage', {
  conversationId: 'conv-123',
  content: 'Hello!',
  type: 'text'
});

// Send an image message
socket.emit('sendMessage', {
  conversationId: 'conv-123',
  content: 'Check this out!',
  type: 'image',
  metadata: {
    imageUrl: 'https://example.com/image.jpg',
    imageWidth: 800,
    imageHeight: 600
  }
});
```

### Typing Indicators
```typescript
// Start typing
socket.emit('typing', {
  conversationId: 'conv-123',
  isTyping: true
});

// Stop typing
socket.emit('typing', {
  conversationId: 'conv-123',
  isTyping: false
});
```

### Read Receipts
```typescript
// Mark conversation as read
socket.emit('markAsRead', {
  conversationId: 'conv-123'
});

// Mark specific message as read
socket.emit('markAsRead', {
  conversationId: 'conv-123',
  messageId: 'msg-456'
});
```

### Event Listeners
```typescript
// Listen for new messages
socket.on('newMessage', (message) => {
  console.log('New message:', message);
});

// Listen for typing indicators
socket.on('userTyping', (data) => {
  console.log(`${data.userInfo.firstName} is typing...`);
});

// Listen for read receipts
socket.on('messageRead', (data) => {
  console.log(`${data.userInfo.firstName} read the message`);
});
```
