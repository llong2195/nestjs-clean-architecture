# WebSocket Events Specification

**Protocol**: Socket.IO 4.x  
**Transport**: WebSocket with fallback to long-polling  
**Authentication**: JWT Bearer token via `auth` parameter on connection

---

## Connection

### Client → Server: Connect

**Event**: `connect` (automatic)

**Authentication**:

```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', // JWT access token
  },
});
```

**Server Response**:

- On success: Connection established, client receives `connect` event
- On failure: Connection rejected with error event

**Errors**:

```json
{
  "message": "Unauthorized",
  "code": "UNAUTHORIZED"
}
```

---

### Server → Client: Connection Acknowledgment

**Event**: `connect`

**Payload**: None (standard Socket.IO event)

**Description**: Emitted when connection is successfully established and authenticated.

---

### Client → Server: Disconnect

**Event**: `disconnect` (automatic)

**Description**: Emitted when client disconnects (intentionally or due to network failure). Server cleans up user's active rooms and typing indicators.

---

## Room Management

### Automatic Room Joining

**Description**: Upon connection, server automatically joins client to:

1. User's personal room: `user:{userId}` - for receiving messages addressed to this user
2. All conversation rooms: `conversation:{conversationId}` - for receiving real-time updates

**Implementation**: Automatic (no client action required)

---

## Messaging Events

### Client → Server: Send Message

**Event**: `message:send`

**Payload**:

```json
{
  "conversationId": "123e4567-e89b-12d3-a456-426614174000",
  "content": "Hello, how are you?"
}
```

**Validation Rules**:

- `conversationId`: Required, UUID format, user must be participant
- `content`: Required, 1-5000 characters, non-empty after trimming

**Server Response** (acknowledgment):

```json
{
  "status": "success",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174001",
    "conversationId": "123e4567-e89b-12d3-a456-426614174000",
    "senderId": "123e4567-e89b-12d3-a456-426614174002",
    "content": "Hello, how are you?",
    "status": "sent",
    "createdAt": "2025-11-13T10:30:00Z",
    "deliveredAt": null,
    "readAt": null
  }
}
```

**Errors**:

```json
{
  "status": "error",
  "error": {
    "code": "CHAT_MESSAGE_TOO_LONG",
    "message": "Message content cannot exceed 5000 characters"
  }
}
```

```json
{
  "status": "error",
  "error": {
    "code": "CHAT_RATE_LIMIT_EXCEEDED",
    "message": "You are sending messages too quickly. Please wait before trying again.",
    "details": {
      "retryAfter": 30
    }
  }
}
```

**Side Effects**:

- Message stored in database
- `message:received` event emitted to recipient
- Conversation's `updatedAt` timestamp updated

---

### Server → Client: Message Received

**Event**: `message:received`

**Room**: `user:{recipientId}` (unicast to recipient)

**Payload**:

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174001",
  "conversationId": "123e4567-e89b-12d3-a456-426614174000",
  "senderId": "123e4567-e89b-12d3-a456-426614174002",
  "content": "Hello, how are you?",
  "status": "delivered",
  "createdAt": "2025-11-13T10:30:00Z",
  "deliveredAt": "2025-11-13T10:30:01Z",
  "readAt": null
}
```

**Description**: Emitted to recipient when a new message arrives. Status is automatically marked as "delivered" when recipient's client is connected.

**Client Action**: Display message in conversation UI

---

## Message Status Events

### Client → Server: Mark Messages as Read

**Event**: `messages:mark_read`

**Payload**:

```json
{
  "conversationId": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Description**: Marks all unread messages in the conversation as read for the current user.

**Server Response** (acknowledgment):

```json
{
  "status": "success",
  "data": {
    "conversationId": "123e4567-e89b-12d3-a456-426614174000",
    "markedCount": 5,
    "readAt": "2025-11-13T10:35:00Z"
  }
}
```

**Side Effects**:

- All unread messages updated with `readAt` timestamp
- `messages:read` event emitted to sender

---

### Server → Client: Messages Read

**Event**: `messages:read`

**Room**: `conversation:{conversationId}` (broadcast to all participants)

**Payload**:

```json
{
  "conversationId": "123e4567-e89b-12d3-a456-426614174000",
  "readByUserId": "123e4567-e89b-12d3-a456-426614174003",
  "readAt": "2025-11-13T10:35:00Z",
  "messageIds": ["123e4567-e89b-12d3-a456-426614174001", "123e4567-e89b-12d3-a456-426614174004"]
}
```

**Description**: Emitted to sender when recipient reads their messages. Allows sender to update message status indicators in UI.

**Client Action**: Update message status display to "read" (e.g., show double checkmark)

---

### Server → Client: Message Delivered

**Event**: `message:delivered`

**Room**: `conversation:{conversationId}` (broadcast to sender only)

**Payload**:

```json
{
  "messageId": "123e4567-e89b-12d3-a456-426614174001",
  "conversationId": "123e4567-e89b-12d3-a456-426614174000",
  "deliveredAt": "2025-11-13T10:30:01Z"
}
```

**Description**: Emitted to sender when recipient's client receives the message (WebSocket connection active).

**Client Action**: Update message status display to "delivered" (e.g., show single checkmark)

---

## Typing Indicator Events

### Client → Server: Typing Started

**Event**: `typing:start`

**Payload**:

```json
{
  "conversationId": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Description**: Indicates user has started typing in the conversation.

**Server Response**: No acknowledgment (fire-and-forget)

**Side Effects**:

- Typing indicator stored in Redis with 3-second TTL
- `typing:user_started` event emitted to other participants

**Rate Limiting**: No limit (lightweight operation)

---

### Client → Server: Typing Stopped

**Event**: `typing:stop`

**Payload**:

```json
{
  "conversationId": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Description**: Indicates user has stopped typing (or sent message).

**Server Response**: No acknowledgment

**Side Effects**:

- Typing indicator removed from Redis
- `typing:user_stopped` event emitted to other participants

---

### Server → Client: User Started Typing

**Event**: `typing:user_started`

**Room**: `conversation:{conversationId}` (broadcast to other participants, exclude sender)

**Payload**:

```json
{
  "conversationId": "123e4567-e89b-12d3-a456-426614174000",
  "userId": "123e4567-e89b-12d3-a456-426614174002",
  "username": "john_doe"
}
```

**Description**: Notifies participants that another user is typing.

**Client Action**: Display "john_doe is typing..." indicator

---

### Server → Client: User Stopped Typing

**Event**: `typing:user_stopped`

**Room**: `conversation:{conversationId}` (broadcast to other participants, exclude sender)

**Payload**:

```json
{
  "conversationId": "123e4567-e89b-12d3-a456-426614174000",
  "userId": "123e4567-e89b-12d3-a456-426614174002"
}
```

**Description**: Notifies participants that user stopped typing (or 3-second TTL expired).

**Client Action**: Remove "john_doe is typing..." indicator

---

## Synchronization Events

### Client → Server: Sync Missed Messages

**Event**: `conversation:sync`

**Payload**:

```json
{
  "conversationId": "123e4567-e89b-12d3-a456-426614174000",
  "lastMessageId": "123e4567-e89b-12d3-a456-426614174001"
}
```

**Description**: Requests all messages sent after the specified message ID. Used for reconnection synchronization.

**Server Response**:

```json
{
  "status": "success",
  "data": {
    "messages": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174005",
        "conversationId": "123e4567-e89b-12d3-a456-426614174000",
        "senderId": "123e4567-e89b-12d3-a456-426614174003",
        "content": "Are you there?",
        "status": "delivered",
        "createdAt": "2025-11-13T10:32:00Z",
        "deliveredAt": "2025-11-13T10:32:01Z",
        "readAt": null
      }
    ],
    "count": 1
  }
}
```

**Use Case**: Client reconnects after network interruption and syncs missed messages

---

## Error Events

### Server → Client: Error

**Event**: `error` (standard Socket.IO event)

**Payload**:

```json
{
  "code": "CHAT_FORBIDDEN",
  "message": "You are not a participant in this conversation",
  "details": {
    "conversationId": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

**Common Error Codes**:

- `UNAUTHORIZED`: Invalid or missing JWT token
- `CHAT_FORBIDDEN`: User not authorized for action (not a participant)
- `CHAT_CONVERSATION_NOT_FOUND`: Conversation does not exist
- `CHAT_MESSAGE_TOO_LONG`: Message exceeds 5000 character limit
- `CHAT_RATE_LIMIT_EXCEEDED`: Too many messages sent (10/minute limit)
- `CHAT_INVALID_CONTENT`: Message content is empty or invalid
- `INTERNAL_SERVER_ERROR`: Unexpected server error

---

## Client Implementation Example

```typescript
import { io, Socket } from 'socket.io-client';

class ChatClient {
  private socket: Socket;

  connect(token: string): void {
    this.socket = io('http://localhost:3000', {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.socket.on('connect', () => {
      console.log('Connected to chat server');
    });

    this.socket.on('message:received', (message) => {
      console.log('New message:', message);
      this.displayMessage(message);
    });

    this.socket.on('messages:read', (data) => {
      console.log('Messages read:', data);
      this.updateMessageStatus(data.messageIds, 'read');
    });

    this.socket.on('typing:user_started', (data) => {
      this.showTypingIndicator(data.username);
    });

    this.socket.on('typing:user_stopped', (data) => {
      this.hideTypingIndicator(data.userId);
    });

    this.socket.on('error', (error) => {
      console.error('Chat error:', error);
      this.handleError(error);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, reconnect manually
        this.socket.connect();
      }
    });
  }

  sendMessage(conversationId: string, content: string): void {
    this.socket.emit('message:send', { conversationId, content }, (response) => {
      if (response.status === 'success') {
        console.log('Message sent:', response.data);
        this.displayMessage(response.data);
      } else {
        console.error('Send failed:', response.error);
        this.handleError(response.error);
      }
    });
  }

  markAsRead(conversationId: string): void {
    this.socket.emit('messages:mark_read', { conversationId });
  }

  startTyping(conversationId: string): void {
    this.socket.emit('typing:start', { conversationId });
  }

  stopTyping(conversationId: string): void {
    this.socket.emit('typing:stop', { conversationId });
  }

  syncConversation(conversationId: string, lastMessageId: string): void {
    this.socket.emit('conversation:sync', { conversationId, lastMessageId }, (response) => {
      if (response.status === 'success') {
        response.data.messages.forEach((msg) => this.displayMessage(msg));
      }
    });
  }

  disconnect(): void {
    this.socket.disconnect();
  }
}
```

---

## Event Flow Examples

### Example 1: User A sends message to User B

```
1. User A (client) → Server: message:send { conversationId, content }
2. Server → User A (client): Acknowledgment { status: 'success', data: message }
3. Server → User B (client): message:received { ...message, status: 'delivered' }
4. User B (client) → Server: messages:mark_read { conversationId }
5. Server → User A (client): messages:read { conversationId, readByUserId, readAt }
```

### Example 2: Typing indicator flow

```
1. User A (client) → Server: typing:start { conversationId }
2. Server → User B (client): typing:user_started { conversationId, userId, username }
3. [3 seconds pass without typing]
4. Server → User B (client): typing:user_stopped { conversationId, userId }
   OR
3. User A (client) → Server: typing:stop { conversationId }
4. Server → User B (client): typing:user_stopped { conversationId, userId }
```

### Example 3: Reconnection sync

```
1. User A disconnects (network issue)
2. User B sends 3 messages to User A
3. User A reconnects → Server: connect (automatic)
4. User A (client) → Server: conversation:sync { conversationId, lastMessageId }
5. Server → User A (client): Acknowledgment { messages: [msg1, msg2, msg3] }
```

---

## Performance Considerations

| Metric                 | Target         | Notes                                        |
| ---------------------- | -------------- | -------------------------------------------- |
| Event latency          | <500ms         | Time from client emit to server receive      |
| Broadcast latency      | <1s            | Time from server emit to all clients receive |
| Concurrent connections | 1,000/instance | With Redis adapter for multi-instance        |
| Message throughput     | 100 msg/s      | Burst handling across all conversations      |
| Typing indicator TTL   | 3 seconds      | Auto-expires if no stop event                |

---

## Security Notes

1. **Authentication**: JWT required on connection, validated via Socket.IO middleware
2. **Authorization**: Server verifies user is participant before allowing actions
3. **Rate Limiting**: 10 messages/minute per user enforced via ThrottlerGuard
4. **Room Isolation**: Users can only join conversation rooms they're participants in
5. **Input Validation**: All event payloads validated with class-validator
6. **No XSS**: Content stored as plain text, sanitization responsibility on frontend
