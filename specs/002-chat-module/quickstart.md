# Quickstart Guide: Real-time Chat Module

**Feature**: Real-time Chat Module  
**Branch**: 002-chat-module  
**Prerequisites**: Node.js 22+, pnpm 10+, Docker, PostgreSQL, Redis

---

## Overview

This guide walks you through setting up and testing the real-time chat module locally. By the end, you'll be able to send messages between users via both REST API and WebSocket.

**What you'll build**:

- ✅ One-on-one real-time messaging
- ✅ Message status tracking (sent/delivered/read)
- ✅ Typing indicators
- ✅ Conversation history and search
- ✅ Multi-instance WebSocket support via Redis

---

## Prerequisites

### 1. Install Dependencies

```bash
# Ensure you have required versions
node --version  # Should be 22.x or higher
pnpm --version  # Should be 10.x or higher
docker --version

# Install project dependencies
pnpm install
```

### 2. Start Infrastructure

```bash
# Start PostgreSQL and Redis via Docker Compose
docker-compose up -d postgres redis

# Verify services are running
docker-compose ps

# Expected output:
# NAME                   STATUS              PORTS
# postgres               Up 2 minutes        5432->5432
# redis                  Up 2 minutes        6379->6379
```

### 3. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Update the following variables in .env:
```

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=clean_architecture_dev

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT (use existing values from auth module)
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=3600

# Application
NODE_ENV=development
PORT=3000
```

---

## Database Setup

### 1. Run Migrations

```bash
# Run all migrations (including chat tables)
pnpm migration:run

# Verify chat tables were created
pnpm typeorm query "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename LIKE '%conversation%' OR tablename LIKE '%message%'"

# Expected output:
# conversations
# messages
```

### 2. Seed Test Users (Optional)

```bash
# Create two test users for chatting
pnpm seed:users

# This creates:
# - User A: alice@example.com / password123
# - User B: bob@example.com / password123
```

---

## Running the Application

### 1. Start Development Server

```bash
# Start NestJS application with hot-reload
pnpm start:dev

# Wait for server to start
# Expected output:
# [Nest] LOG [NestApplication] Nest application successfully started
# [Nest] LOG [Main] 🚀 Application is running on: http://localhost:3000
# [Nest] LOG [Main] 📚 API Documentation: http://localhost:3000/api/docs
```

### 2. Verify Health

```bash
# Check application health
curl http://localhost:3000/health

# Expected response:
# {
#   "status": "ok",
#   "info": {
#     "database": { "status": "up" },
#     "redis": { "status": "up" }
#   }
# }
```

---

## Testing the API

### 1. Authenticate Users

```bash
# Login as Alice
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "password123"
  }'

# Save Alice's token from response:
export ALICE_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Login as Bob
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "bob@example.com",
    "password": "password123"
  }'

# Save Bob's token:
export BOB_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 2. Create Conversation

```bash
# Alice initiates conversation with Bob
# First, get Bob's user ID
curl http://localhost:3000/users \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  | jq '.data.users[] | select(.email=="bob@example.com") | .id'

# Save Bob's ID
export BOB_ID="123e4567-e89b-12d3-a456-426614174000"

# Create or get conversation
curl -X POST http://localhost:3000/conversations/with/$BOB_ID \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  | jq '.'

# Expected response:
# {
#   "status": "success",
#   "data": {
#     "id": "123e4567-e89b-12d3-a456-426614174001",
#     "participants": [
#       { "id": "...", "username": "alice", "avatarUrl": null },
#       { "id": "...", "username": "bob", "avatarUrl": null }
#     ],
#     "unreadCount": 0,
#     "createdAt": "2025-11-13T10:30:00Z",
#     "updatedAt": "2025-11-13T10:30:00Z"
#   }
# }

# Save conversation ID
export CONVERSATION_ID="123e4567-e89b-12d3-a456-426614174001"
```

### 3. Test WebSocket Messaging

**Option A: Using Socket.IO Client (Node.js)**

```javascript
// test-chat.js
const io = require('socket.io-client');

// Connect Alice
const aliceSocket = io('http://localhost:3000', {
  auth: { token: process.env.ALICE_TOKEN },
});

// Connect Bob
const bobSocket = io('http://localhost:3000', {
  auth: { token: process.env.BOB_TOKEN },
});

aliceSocket.on('connect', () => {
  console.log('Alice connected');

  // Alice sends message
  aliceSocket.emit(
    'message:send',
    {
      conversationId: process.env.CONVERSATION_ID,
      content: 'Hello Bob!',
    },
    (response) => {
      console.log('Alice sent:', response.data);
    },
  );
});

bobSocket.on('connect', () => {
  console.log('Bob connected');
});

bobSocket.on('message:received', (message) => {
  console.log('Bob received:', message);

  // Bob marks as read
  bobSocket.emit('messages:mark_read', {
    conversationId: message.conversationId,
  });
});

aliceSocket.on('messages:read', (data) => {
  console.log('Alice notified messages read:', data);
});

// Run: node test-chat.js
```

**Option B: Using Postman or Browser DevTools**

1. Open Postman → New WebSocket Request
2. URL: `ws://localhost:3000`
3. Add auth header: `{ "auth": { "token": "YOUR_TOKEN" } }`
4. Send message:
   ```json
   {
     "event": "message:send",
     "data": {
       "conversationId": "YOUR_CONVERSATION_ID",
       "content": "Hello from Postman!"
     }
   }
   ```

### 4. Test REST Endpoints

```bash
# Get conversation list
curl http://localhost:3000/conversations \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  | jq '.data.conversations'

# Get conversation history (50 messages)
curl http://localhost:3000/conversations/$CONVERSATION_ID/messages \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  | jq '.data.messages'

# Mark messages as read
curl -X PATCH http://localhost:3000/messages/mark-read \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"conversationId\": \"$CONVERSATION_ID\"
  }" \
  | jq '.data'

# Search messages
curl -X POST http://localhost:3000/messages/search \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "hello",
    "limit": 50
  }' \
  | jq '.data.results'
```

---

## Testing Typing Indicators

```javascript
// typing-test.js
const io = require('socket.io-client');

const aliceSocket = io('http://localhost:3000', {
  auth: { token: process.env.ALICE_TOKEN },
});

const bobSocket = io('http://localhost:3000', {
  auth: { token: process.env.BOB_TOKEN },
});

aliceSocket.on('connect', () => {
  console.log('Alice connected');

  // Alice starts typing
  aliceSocket.emit('typing:start', {
    conversationId: process.env.CONVERSATION_ID,
  });

  setTimeout(() => {
    // Alice stops typing after 2 seconds
    aliceSocket.emit('typing:stop', {
      conversationId: process.env.CONVERSATION_ID,
    });
  }, 2000);
});

bobSocket.on('connect', () => {
  console.log('Bob connected');
});

bobSocket.on('typing:user_started', (data) => {
  console.log(`${data.username} is typing...`);
});

bobSocket.on('typing:user_stopped', (data) => {
  console.log('Typing indicator stopped');
});

// Run: node typing-test.js
```

---

## Testing Multi-Instance Scaling

### 1. Start Multiple Instances

```bash
# Terminal 1: Start instance on port 3000
PORT=3000 pnpm start:dev

# Terminal 2: Start instance on port 3001
PORT=3001 pnpm start:dev
```

### 2. Connect Clients to Different Instances

```javascript
// multi-instance-test.js
const io = require('socket.io-client');

// Alice connects to instance 1
const aliceSocket = io('http://localhost:3000', {
  auth: { token: process.env.ALICE_TOKEN },
});

// Bob connects to instance 2
const bobSocket = io('http://localhost:3001', {
  auth: { token: process.env.BOB_TOKEN },
});

// Alice sends message from instance 1
aliceSocket.emit('message:send', {
  conversationId: process.env.CONVERSATION_ID,
  content: 'Cross-instance message!',
});

// Bob should receive on instance 2 (via Redis pub/sub)
bobSocket.on('message:received', (message) => {
  console.log('Bob received cross-instance:', message);
});
```

---

## Running Tests

### Unit Tests

```bash
# Run domain and application layer tests
pnpm test src/modules/chat

# Expected output:
# PASS  src/modules/chat/domain/entities/message.entity.spec.ts
# PASS  src/modules/chat/domain/entities/conversation.entity.spec.ts
# PASS  src/modules/chat/application/use-cases/send-message.use-case.spec.ts
```

### Integration Tests

```bash
# Run repository tests (requires PostgreSQL test database)
pnpm test:integration src/modules/chat

# Expected output:
# PASS  test/integration/chat/message.repository.spec.ts
# PASS  test/integration/chat/conversation.repository.spec.ts
```

### E2E Tests

```bash
# Run full end-to-end tests (requires all services)
pnpm test:e2e test/e2e/chat.e2e-spec.ts

# Expected output:
# PASS  test/e2e/chat.e2e-spec.ts
#   Chat Module (E2E)
#     ✓ should send and receive message via WebSocket (1234ms)
#     ✓ should mark messages as read (567ms)
#     ✓ should show typing indicators (890ms)
```

---

## Accessing API Documentation

### Swagger UI

Open browser: http://localhost:3000/api/docs

**Features**:

- Interactive API explorer
- Request/response schemas
- Try out REST endpoints
- Authentication via "Authorize" button

**Usage**:

1. Click "Authorize" button
2. Enter Bearer token: `Bearer YOUR_JWT_TOKEN`
3. Select `/conversations` endpoint
4. Click "Try it out"
5. Execute request

---

## Monitoring and Debugging

### View Logs

```bash
# Application logs (structured JSON)
tail -f logs/application.log | jq '.'

# WebSocket connection logs
grep "WebSocket" logs/application.log | jq '.'

# Message delivery logs
grep "message:send\|message:received" logs/application.log | jq '.'
```

### Redis Monitoring

```bash
# Connect to Redis CLI
docker exec -it redis redis-cli

# Monitor real-time commands
MONITOR

# Check typing indicators
KEYS typing:*

# Check Socket.IO adapter keys
KEYS socket.io*
```

### Database Queries

```bash
# Connect to PostgreSQL
docker exec -it postgres psql -U postgres -d clean_architecture_dev

# View recent messages
SELECT id, sender_id, content, status, created_at
FROM messages
ORDER BY created_at DESC
LIMIT 10;

# View conversation participants
SELECT c.id, c.participant1_id, c.participant2_id, c.updated_at
FROM conversations c
ORDER BY c.updated_at DESC;

# Check unread message count
SELECT conversation_id, COUNT(*) as unread_count
FROM messages
WHERE status != 'read'
GROUP BY conversation_id;
```

---

## Performance Testing

### Load Test with Artillery

```bash
# Install Artillery
pnpm add -g artillery

# Run WebSocket load test
artillery run specs/002-chat-module/tests/load-test.yml

# Expected results:
# Summary:
#   scenarios launched: 1000
#   scenarios completed: 1000
#   messages sent: 10000
#   p95 latency: 950ms
#   errors: 0
```

**load-test.yml**:

```yaml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
  processor: './load-test-functions.js'

scenarios:
  - name: 'Send messages'
    engine: 'socketio'
    flow:
      - function: 'authenticate'
      - emit:
          channel: 'message:send'
          data:
            conversationId: '{{ conversationId }}'
            content: 'Load test message {{ $randomString() }}'
      - think: 5
```

---

## Troubleshooting

### Issue: WebSocket connection fails

**Symptoms**: `connect_error` event fired

**Solutions**:

1. Check JWT token is valid: `jwt.io` → paste token
2. Verify Redis is running: `docker-compose ps redis`
3. Check server logs: `grep "WebSocket" logs/application.log`
4. Test authentication: `curl http://localhost:3000/auth/profile -H "Authorization: Bearer $TOKEN"`

### Issue: Messages not delivered across instances

**Symptoms**: Message sent but not received

**Solutions**:

1. Verify Redis adapter configured: Check `src/shared/websocket/websocket.module.ts`
2. Check Redis pub/sub: `redis-cli MONITOR` should show publish/subscribe
3. Verify both instances connect to same Redis: Check `REDIS_HOST` in `.env`
4. Test Redis connectivity: `redis-cli PING` should return `PONG`

### Issue: Message search returns no results

**Symptoms**: Search endpoint returns empty array

**Solutions**:

1. Check `search_vector` populated: `SELECT search_vector FROM messages LIMIT 1;`
2. Verify trigger is active: `SELECT * FROM pg_trigger WHERE tgname = 'messages_search_vector_update';`
3. Rebuild search vectors: `UPDATE messages SET content = content;`
4. Test search manually: `SELECT * FROM messages WHERE search_vector @@ plainto_tsquery('hello');`

### Issue: Rate limit exceeded

**Symptoms**: `CHAT_RATE_LIMIT_EXCEEDED` error

**Solutions**:

1. Wait 60 seconds for rate limit to reset
2. Check ThrottlerGuard config: `src/modules/chat/chat.module.ts`
3. Adjust limits for testing: Increase `limit` in ThrottlerModule config
4. Verify Redis stores rate limit counters: `redis-cli KEYS throttler:*`

---

## Next Steps

- ✅ Chat module is running locally
- ⏭️ Implement frontend client (React/Vue/Angular)
- ⏭️ Add push notifications for offline users
- ⏭️ Implement message encryption (E2E)
- ⏭️ Add file/image attachments
- ⏭️ Implement group chat support

---

## Additional Resources

- **API Documentation**: http://localhost:3000/api/docs
- **WebSocket Events**: See `contracts/websocket-events.md`
- **Data Model**: See `data-model.md`
- **Architecture Guide**: See `../../docs/architecture.md`
- **Socket.IO Docs**: https://socket.io/docs/v4/
- **TypeORM Docs**: https://typeorm.io/
