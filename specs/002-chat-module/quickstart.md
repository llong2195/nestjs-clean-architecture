# Quickstart Guide: Real-time Chat Module

**Feature**: Real-time messaging with WebSocket (Socket.IO) and REST API
**Last Updated**: 2025-11-18

## Prerequisites

### Required Software

- **Node.js**: 22+ (LTS)
- **pnpm**: 10.x+ (REQUIRED - do not use npm or yarn)
- **PostgreSQL**: 18+
- **Redis**: 7.x
- **Docker** (optional): For running PostgreSQL and Redis via docker-compose

### Verify Installation

```bash
node --version    # Should be v22.x.x
pnpm --version    # Should be 10.x.x
psql --version    # Should be 18.x
redis-cli --version # Should be 7.x
```

---

## Setup

### 1. Clone and Install Dependencies

```bash
# Clone repository (if not already done)
cd c:/Users/llong/Desktop/clean-architecture

# Install dependencies with pnpm (REQUIRED)
pnpm install
```

### 2. Start Infrastructure (Docker)

**Option A: Using Docker Compose (Recommended)**

```bash
# Start PostgreSQL, Redis, and Kafka containers
docker-compose up -d

# Verify services are running
docker-compose ps
```

**Option B: Manual Setup**

Start PostgreSQL:

```bash
# Windows (using pg_ctl)
pg_ctl -D "C:\Program Files\PostgreSQL\18\data" start

# macOS/Linux
sudo systemctl start postgresql
```

Start Redis:

```bash
# Windows (Redis for Windows)
redis-server

# macOS/Linux
sudo systemctl start redis
```

### 3. Configure Environment Variables

Create `.env` file in project root (if not exists):

```bash
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=clean_architecture_db
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres

# Redis
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# WebSocket
WEBSOCKET_PORT=3000
WEBSOCKET_CORS_ORIGIN=http://localhost:3001

# Application
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug
```

### 4. Run Database Migrations

```bash
# Run all pending migrations (creates conversations, messages, conversation_participants tables)
pnpm migration:run

# Verify tables created
psql -U postgres -d clean_architecture_db -c "\dt"
# Should show: conversations, messages, conversation_participants, users, etc.
```

### 5. Start Development Server

```bash
# Start NestJS server with hot-reload
pnpm start:dev

# Server should start on http://localhost:3000
# WebSocket gateway on http://localhost:3000/conversations
```

**Expected Output:**

```
[Nest] 12345  - 11/18/2025, 10:30:00 AM     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 11/18/2025, 10:30:01 AM     LOG [InstanceLoader] AppModule dependencies initialized +25ms
[Nest] 12345  - 11/18/2025, 10:30:01 AM     LOG [InstanceLoader] ConversationModule dependencies initialized +5ms
[Nest] 12345  - 11/18/2025, 10:30:01 AM     LOG [RoutesResolver] ConversationController {/api/v1/conversations}: +10ms
[Nest] 12345  - 11/18/2025, 10:30:01 AM     LOG [WebSocketsController] ConversationGateway subscribed to port: 3000
[Nest] 12345  - 11/18/2025, 10:30:01 AM     LOG [NestApplication] Nest application successfully started +5ms
```

---

## Testing the Chat Module

### REST API (HTTP)

**1. Create a User (Authentication)**

```bash
# Register user
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user1@example.com",
    "password": "SecurePass123!",
    "name": "User One"
  }'

# Login to get JWT token
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user1@example.com",
    "password": "SecurePass123!"
  }'

# Response:
{
  "status": "success",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { "id": "user-uuid-1", "email": "user1@example.com", "name": "User One" }
  }
}
```

**2. Create a Conversation**

```bash
# Create DIRECT conversation (1-on-1 chat)
curl -X POST http://localhost:3000/api/v1/conversations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "DIRECT",
    "participantIds": ["user-uuid-2"]
  }'

# Create GROUP conversation
curl -X POST http://localhost:3000/api/v1/conversations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "GROUP",
    "name": "Project Team Chat",
    "participantIds": ["user-uuid-2", "user-uuid-3"]
  }'
```

**3. List Conversations**

```bash
curl -X GET "http://localhost:3000/api/v1/conversations?limit=50&offset=0" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**4. Get Message History**

```bash
curl -X GET "http://localhost:3000/api/v1/conversations/CONVERSATION_UUID/messages?limit=50" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**5. Search Messages**

```bash
curl -X GET "http://localhost:3000/api/v1/messages/search?q=meeting&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### WebSocket (Real-time Messaging)

**Using Browser Console:**

```javascript
// 1. Establish WebSocket connection
const socket = io('http://localhost:3000/conversations', {
  auth: { token: 'YOUR_JWT_TOKEN' }, // Replace with actual JWT
  transports: ['websocket'],
});

// 2. Listen for connection events
socket.on('connect', () => {
  console.log('Connected:', socket.id);
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error.message);
});

// 3. Join a conversation room
socket.emit('conversation:join', {
  conversationId: 'CONVERSATION_UUID',
});

socket.on('conversation:joined', (data) => {
  console.log('Joined conversation:', data);
});

// 4. Send a message
socket.emit('message:send', {
  conversationId: 'CONVERSATION_UUID',
  content: 'Hello, how are you?',
});

// 5. Listen for incoming messages
socket.on('message:received', (data) => {
  console.log('New message:', data);

  // Acknowledge delivery
  socket.emit('message:delivered', { messageId: data.id });
});

// 6. Listen for typing indicators
socket.on('typing:indicator', (data) => {
  console.log(`User ${data.userId} is ${data.isTyping ? 'typing' : 'stopped typing'}`);
});

// 7. Send typing indicator
socket.emit('typing:start', { conversationId: 'CONVERSATION_UUID' });

// Stop typing after 3 seconds
setTimeout(() => {
  socket.emit('typing:stop', { conversationId: 'CONVERSATION_UUID' });
}, 3000);

// 8. Mark messages as read
socket.emit('message:read', {
  conversationId: 'CONVERSATION_UUID',
  messageIds: ['msg-uuid-1', 'msg-uuid-2'],
});

socket.on('message:status:read', (data) => {
  console.log('Messages marked as read:', data);
});
```

**Using Node.js Client:**

```bash
# Install Socket.IO client
pnpm add socket.io-client

# Create test-client.js
```

```javascript
// test-client.js
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/conversations', {
  auth: { token: process.env.JWT_TOKEN },
  transports: ['websocket'],
});

socket.on('connect', () => {
  console.log('✅ Connected to WebSocket');

  // Join conversation
  socket.emit('conversation:join', {
    conversationId: process.env.CONVERSATION_ID,
  });

  // Send message
  setTimeout(() => {
    socket.emit('message:send', {
      conversationId: process.env.CONVERSATION_ID,
      content: 'Test message from Node.js client',
    });
  }, 1000);
});

socket.on('message:received', (data) => {
  console.log('📩 New message:', data.content);
});

socket.on('error', (error) => {
  console.error('❌ Error:', error);
});
```

Run:

```bash
JWT_TOKEN=your-jwt-token CONVERSATION_ID=conversation-uuid node test-client.js
```

---

## Running Tests

### Unit Tests

```bash
# Run all unit tests
pnpm test

# Run tests with coverage
pnpm test:cov

# Run tests in watch mode (for development)
pnpm test:watch

# Test specific module
pnpm test -- conversation
```

**Expected Output:**

```
PASS  test/unit/conversation/conversation.aggregate.spec.ts
  Conversation Aggregate
    ✓ should create DIRECT conversation with exactly 2 participants (15ms)
    ✓ should create GROUP conversation with 3+ participants (10ms)
    ✓ should throw error when DIRECT has != 2 participants (5ms)
    ✓ should add message to active conversation (8ms)
    ✓ should throw error when adding message to archived conversation (6ms)

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
Coverage:    85.7% Statements 120/140 | 83.3% Branches 25/30 | 90% Functions 18/20
```

### Integration Tests

```bash
# Run integration tests (requires PostgreSQL and Redis running)
pnpm test:integration

# Test specific integration
pnpm test:integration -- conversation.repository
```

### E2E Tests

```bash
# Run end-to-end tests
pnpm test:e2e

# Test WebSocket multi-instance
pnpm test:e2e -- multi-instance-websocket
```

---

## Development Workflow

### File Structure

```
src/modules/conversation/
├── domain/                          # Pure business logic (NO NestJS decorators)
│   ├── aggregates/
│   │   └── conversation.aggregate.ts
│   ├── entities/
│   │   └── message.entity.ts
│   ├── value-objects/
│   │   └── conversation-type.vo.ts
│   └── repositories/
│       └── conversation.repository.interface.ts
│
├── application/                     # Use cases (orchestration)
│   ├── use-cases/
│   │   ├── send-message.use-case.ts
│   │   ├── create-conversation.use-case.ts
│   │   └── get-message-history.use-case.ts
│   └── dtos/
│       ├── send-message.dto.ts
│       └── conversation-response.dto.ts
│
├── infrastructure/                  # Framework implementations
│   ├── persistence/
│   │   ├── conversation.orm-entity.ts
│   │   ├── message.orm-entity.ts
│   │   └── conversation.repository.ts
│   ├── cache/
│   │   └── typing-indicator.cache.ts
│   └── mappers/
│       └── conversation.mapper.ts
│
├── interface/                       # Entry points
│   ├── http/
│   │   └── conversation.controller.ts
│   └── websocket/
│       └── conversation.gateway.ts
│
└── conversation.module.ts
```

### Creating a New Use Case

**Example: Create a "Send Message" Use Case**

1. **Define DTO** (`application/dtos/send-message.dto.ts`):

```typescript
import { IsUUID, IsString, Length } from 'class-validator';

export class SendMessageDto {
  @IsUUID()
  conversationId!: string;

  @IsString()
  @Length(1, 5000)
  content!: string;
}
```

2. **Create Use Case** (`application/use-cases/send-message.use-case.ts`):

```typescript
import { Injectable } from '@nestjs/common';
import { IConversationRepository } from '../../domain/repositories/conversation.repository.interface';
import { SendMessageDto } from '../dtos/send-message.dto';

@Injectable()
export class SendMessageUseCase {
  constructor(private readonly conversationRepo: IConversationRepository) {}

  async execute(userId: string, dto: SendMessageDto): Promise<MessageResponseDto> {
    // 1. Load conversation aggregate
    const conversation = await this.conversationRepo.findById(dto.conversationId);

    // 2. Validate user is participant
    if (!conversation.isParticipant(userId)) {
      throw new ForbiddenException('User not a participant');
    }

    // 3. Add message (domain logic)
    const message = conversation.addMessage(userId, dto.content);

    // 4. Persist
    await this.conversationRepo.save(conversation);

    // 5. Return DTO
    return MessageResponseDto.fromDomain(message);
  }
}
```

3. **Wire in Module** (`conversation.module.ts`):

```typescript
@Module({
  providers: [
    SendMessageUseCase,
    // ... other providers
  ],
  exports: [SendMessageUseCase],
})
export class ConversationModule {}
```

4. **Call from Controller/Gateway**:

```typescript
@SubscribeMessage('message:send')
async handleSendMessage(
  @ConnectedSocket() client: Socket,
  @MessageBody() dto: SendMessageDto,
) {
  const userId = client.data.user.id;
  const message = await this.sendMessageUseCase.execute(userId, dto);

  // Broadcast to conversation room
  this.server.to(`conversation:${dto.conversationId}`).emit('message:received', message);
}
```

---

## Common Issues & Solutions

### Issue: Database connection failed

**Error**: `error: database "clean_architecture_db" does not exist`

**Solution**:

```bash
# Create database manually
psql -U postgres -c "CREATE DATABASE clean_architecture_db;"

# Run migrations
pnpm migration:run
```

---

### Issue: Redis connection refused

**Error**: `Error: connect ECONNREFUSED 127.0.0.1:6379`

**Solution**:

```bash
# Check if Redis is running
docker-compose ps redis

# If not, start it
docker-compose up -d redis

# Verify connection
redis-cli ping  # Should return "PONG"
```

---

### Issue: WebSocket connection fails with CORS error

**Error**: `Cross-Origin Request Blocked: The Same Origin Policy disallows...`

**Solution**:
Update `.env`:

```bash
WEBSOCKET_CORS_ORIGIN=http://localhost:3001  # Update to your frontend URL
```

Or update `conversation.gateway.ts`:

```typescript
@WebSocketGateway({
  namespace: 'conversations',
  cors: {
    origin: process.env.WEBSOCKET_CORS_ORIGIN || '*',
    credentials: true,
  },
})
```

---

### Issue: JWT authentication fails

**Error**: `Unauthorized: Invalid or expired token`

**Solution**:

1. Verify JWT_SECRET in `.env` matches server configuration
2. Check token expiration with [jwt.io](https://jwt.io)
3. Ensure `Authorization: Bearer TOKEN` header format is correct
4. For WebSocket, check `auth.token` in connection options

---

### Issue: Migration errors

**Error**: `Table "conversations" already exists`

**Solution**:

```bash
# Revert last migration
pnpm migration:revert

# Check migration status
pnpm typeorm migration:show

# Re-run migrations
pnpm migration:run
```

---

## Performance Monitoring

### Check WebSocket Connections

```bash
# Connect to Redis
redis-cli

# Count active Socket.IO rooms
KEYS *conversations*  # Shows all conversation rooms
KEYS user:*           # Shows all user rooms
```

### Database Query Performance

```bash
# Connect to PostgreSQL
psql -U postgres -d clean_architecture_db

# Check query execution time
\timing

# Analyze slow queries
EXPLAIN ANALYZE SELECT * FROM messages WHERE conversation_id = 'uuid' ORDER BY created_at DESC LIMIT 50;

# Verify indexes
\di  # List all indexes
```

### Monitor Redis Memory

```bash
redis-cli INFO memory
# Look for: used_memory_human, maxmemory_policy
```

---

## Next Steps

1. **Implement Use Cases**: Create missing use cases (create conversation, mark as read, search messages)
2. **Add Tests**: Achieve >80% test coverage for critical modules
3. **Add REST Controller**: Create ConversationController with Swagger docs
4. **Performance Tuning**: Add database indexes, optimize queries
5. **Deploy**: Configure production environment variables, set up CI/CD

---

## Useful Commands Reference

```bash
# Development
pnpm start:dev              # Start with hot-reload
pnpm build                  # Build for production
pnpm start:prod             # Start production server

# Testing
pnpm test                   # Run unit tests
pnpm test:cov               # Run with coverage
pnpm test:e2e               # Run E2E tests

# Database
pnpm migration:generate src/shared/database/migrations/MigrationName
pnpm migration:run          # Run pending migrations
pnpm migration:revert       # Revert last migration

# Code Quality
pnpm lint                   # Run ESLint
pnpm lint:fix               # Auto-fix linting errors
pnpm format                 # Format with Prettier

# Docker
docker-compose up -d        # Start all services
docker-compose down         # Stop all services
docker-compose logs -f      # View logs
```

---

## Additional Resources

- **NestJS Documentation**: https://docs.nestjs.com
- **Socket.IO Documentation**: https://socket.io/docs/v4
- **TypeORM Documentation**: https://typeorm.io
- **Clean Architecture**: https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html
- **Project README**: See `README.md` in project root

**Questions?** Open an issue in the GitHub repository or contact the development team.
