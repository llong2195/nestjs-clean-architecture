# Research: Real-time Chat Module

**Feature**: Real-time Chat Module  
**Branch**: 002-chat-module  
**Date**: 2025-11-13

## Overview

This document consolidates research findings for implementing a real-time one-on-one chat system using NestJS Clean Architecture, Socket.IO for WebSocket communication, TypeORM for persistence, and Redis for scaling across multiple instances.

---

## R1: WebSocket Architecture for Multi-Instance Scaling

### Decision

Use **Socket.IO with Redis adapter** for WebSocket communication with horizontal scaling support across multiple application instances.

### Rationale

1. **Already integrated**: Project already has Socket.IO configured with Redis adapter in `src/shared/websocket/` module
2. **Battle-tested**: Socket.IO is production-ready with automatic reconnection, fallback transports, and room-based messaging
3. **Redis pub/sub**: Native support for broadcasting messages across multiple server instances via Redis adapter
4. **JWT authentication**: Easy integration with existing JWT auth via Socket.IO middleware
5. **Event-driven**: Natural fit for chat events (message:send, typing:start, etc.)

### Alternatives Considered

- **Native WebSocket**: Rejected because requires manual implementation of reconnection, broadcasting, and room management
- **GraphQL Subscriptions**: Rejected because adds unnecessary complexity and requires GraphQL setup (project uses REST)
- **Server-Sent Events (SSE)**: Rejected because one-way communication only (server → client), doesn't support client → server events

### Implementation Approach

```typescript
// Existing infrastructure (already in place)
@WebSocketGateway({
  cors: { origin: '*' },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly sendMessageUseCase: SendMessageUseCase,
    private readonly redisAdapter: RedisIoAdapter, // Already configured
  ) {}

  @UseGuards(WsJwtAuthGuard) // Reuse existing WebSocket JWT guard
  @SubscribeMessage('message:send')
  async handleSendMessage(@MessageBody() dto: SendMessageDto, @ConnectedSocket() client: Socket) {
    // Use case handles business logic
    const message = await this.sendMessageUseCase.execute(dto);

    // Broadcast to recipient's room (Redis ensures multi-instance delivery)
    this.server.to(`user:${message.recipientId}`).emit('message:received', message);

    return { status: 'success', data: message };
  }
}
```

### Performance Considerations

- **Connection limit**: 1,000 concurrent connections per instance (per spec requirement SC-002)
- **Memory overhead**: ~1-2KB per connection (Socket.IO + Redis pub/sub)
- **Latency target**: <1 second delivery (95th percentile) achieved via in-memory Redis pub/sub

---

## R2: Message Persistence Strategy

### Decision

Use **TypeORM with PostgreSQL** for message and conversation persistence with immutable message design.

### Rationale

1. **Consistency**: Matches existing project persistence layer (TypeORM 0.3.x with PostgreSQL)
2. **ACID compliance**: PostgreSQL ensures reliable message storage with transaction support
3. **Full-text search**: PostgreSQL supports efficient text search via `tsvector` and GIN indexes
4. **Relationship management**: Natural fit for conversation ↔ message relationships
5. **Audit trail**: Immutable messages provide complete history for compliance

### Alternatives Considered

- **MongoDB**: Rejected because project standardizes on PostgreSQL, and adds operational complexity
- **Redis-only storage**: Rejected because lacks durability guarantees and query flexibility
- **Event sourcing**: Rejected as over-engineering for MVP (adds complexity without clear benefit)

### Schema Design

```sql
-- Conversations table (one-on-one only)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_conversation_participants UNIQUE (participant1_id, participant2_id)
);

-- Conversation participants (junction table for extensibility)
CREATE TABLE conversation_participants (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);

-- Messages table (immutable)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(content) <= 5000),
  status VARCHAR(20) NOT NULL DEFAULT 'sent', -- sent/delivered/read
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMP,
  read_at TIMESTAMP,
  search_vector TSVECTOR, -- Full-text search optimization

  -- Indexes
  INDEX idx_messages_conversation_created (conversation_id, created_at DESC),
  INDEX idx_messages_sender (sender_id),
  INDEX idx_messages_search (search_vector) USING GIN
);

-- Trigger to update search_vector
CREATE TRIGGER messages_search_vector_update
BEFORE INSERT OR UPDATE ON messages
FOR EACH ROW EXECUTE FUNCTION
  tsvector_update_trigger(search_vector, 'pg_catalog.english', content);
```

### Performance Optimizations

- **Pagination**: Load messages in chunks of 50 (per spec FR-019)
- **Indexes**: Composite index on (conversation_id, created_at DESC) for efficient history queries
- **Full-text search**: GIN index on tsvector for sub-3-second search (per spec SC-007)
- **Caching**: Redis cache for conversation list and unread counts (reduce DB load)

---

## R3: Message Status Tracking (Sent/Delivered/Read)

### Decision

Embed message status directly in the `messages` table with separate timestamp columns for each status transition.

### Rationale

1. **Simplicity**: One-on-one conversations have exactly one recipient, so no need for separate status table
2. **Query efficiency**: Single table lookup for message + status (no JOIN required)
3. **Extensibility**: If group chat is added later, can refactor to separate `message_statuses` table
4. **Real-time updates**: Status changes trigger WebSocket events to update sender's UI

### Alternatives Considered

- **Separate MessageStatus table**: Rejected for MVP because adds complexity without benefit for 1:1 chats (would be needed for group chat)
- **Redis-only status**: Rejected because lacks persistence (status must survive restarts)

### Status Transitions

```typescript
// Domain entity enforces valid transitions
export class Message {
  private _status: MessageStatus = MessageStatus.SENT;

  markAsDelivered(): void {
    if (this._status !== MessageStatus.SENT) {
      throw new DomainException('Can only mark sent messages as delivered');
    }
    this._status = MessageStatus.DELIVERED;
    this._deliveredAt = new Date();
  }

  markAsRead(): void {
    if (this._status === MessageStatus.READ) {
      return; // Idempotent
    }
    this._status = MessageStatus.READ;
    this._readAt = new Date();
  }
}
```

### WebSocket Status Events

```typescript
// Infrastructure layer broadcasts status changes
@SubscribeMessage('message:mark_read')
async handleMarkRead(@MessageBody() dto: { conversationId: string }) {
  await this.markAsReadUseCase.execute(dto);

  // Notify sender that their messages were read
  this.server.to(`conversation:${dto.conversationId}`).emit('messages:read', {
    conversationId: dto.conversationId,
    readAt: new Date(),
  });
}
```

---

## R4: Typing Indicator Implementation

### Decision

Use **Redis with TTL** for ephemeral typing indicator state (not persisted to PostgreSQL).

### Rationale

1. **Ephemeral nature**: Typing indicators expire after 3 seconds of inactivity, no need for permanent storage
2. **Low latency**: Redis in-memory operations provide <10ms response time
3. **Multi-instance support**: Redis pub/sub ensures typing events reach all connected users across instances
4. **Automatic expiration**: Redis TTL handles cleanup without manual timers

### Alternatives Considered

- **In-memory Map**: Rejected because doesn't work across multiple instances
- **PostgreSQL storage**: Rejected because adds unnecessary DB load for temporary state
- **WebSocket-only**: Rejected because state is lost on disconnection/reconnection

### Implementation

```typescript
// Redis key pattern: typing:{conversationId}:{userId}
export class TypingIndicatorService {
  async startTyping(conversationId: string, userId: string): Promise<void> {
    const key = `typing:${conversationId}:${userId}`;
    await this.redis.setex(key, 3, '1'); // 3-second TTL

    // Broadcast to conversation room
    this.socketServer
      .to(`conversation:${conversationId}`)
      .emit('typing:start', { userId, conversationId });
  }

  async stopTyping(conversationId: string, userId: string): Promise<void> {
    const key = `typing:${conversationId}:${userId}`;
    await this.redis.del(key);

    this.socketServer
      .to(`conversation:${conversationId}`)
      .emit('typing:stop', { userId, conversationId });
  }

  async getTypingUsers(conversationId: string): Promise<string[]> {
    const keys = await this.redis.keys(`typing:${conversationId}:*`);
    return keys.map((key) => key.split(':')[2]); // Extract userId
  }
}
```

### Client Behavior

- **Frontend sends** `typing:start` when user types
- **Frontend sends** `typing:stop` when user stops typing for 3 seconds OR sends message
- **Backend TTL** auto-expires stale indicators if client disconnects without cleanup

---

## R5: Rate Limiting Strategy

### Decision

Use **NestJS ThrottlerGuard** with Redis storage for distributed rate limiting across instances.

### Rationale

1. **Built-in solution**: NestJS @nestjs/throttler module integrates seamlessly
2. **Redis-backed**: Shared rate limit counters across multiple instances
3. **Flexible configuration**: Per-endpoint limits (10 msg/min for sending, higher for reading)
4. **Standards compliance**: Follows spec requirement FR-017 (10 messages/minute per user)

### Alternatives Considered

- **In-memory rate limiting**: Rejected because doesn't work across multiple instances
- **API Gateway rate limiting**: Rejected because WebSocket messages need application-level limits
- **Custom middleware**: Rejected because reinvents existing solution

### Implementation

```typescript
// chat.module.ts
@Module({
  imports: [
    ThrottlerModule.forRoot({
      storage: new ThrottlerStorageRedisService(redisClient),
      throttlers: [
        { ttl: 60000, limit: 10 }, // 10 requests per 60 seconds
      ],
    }),
  ],
})
export class ChatModule {}

// chat.gateway.ts
@UseGuards(ThrottlerGuard)
@SubscribeMessage('message:send')
async handleSendMessage(dto: SendMessageDto) {
  // If rate limit exceeded, ThrottlerGuard throws exception
  return this.sendMessageUseCase.execute(dto);
}
```

### Error Handling

```typescript
// Rate limit exceeded response
{
  status: 'error',
  error: {
    code: 'CHAT_RATE_LIMIT_EXCEEDED',
    message: 'You are sending messages too quickly. Please wait before trying again.',
    retryAfter: 30, // seconds
  }
}
```

---

## R6: Conversation Uniqueness and Discovery

### Decision

Enforce **unique conversations per user pair** using composite unique constraint and provide REST endpoint for conversation initialization.

### Rationale

1. **Data integrity**: Prevents duplicate conversation records for same user pair
2. **Idempotent creation**: Clients can call "get or create conversation" without checking existence
3. **Bidirectional constraint**: Ensures (userA, userB) and (userB, userA) map to same conversation

### Implementation

```sql
-- Unique constraint ensures one conversation per user pair
-- Note: We use direct participant fields (participant1_id, participant2_id) instead of a junction table
-- because this is a simple 2-participant design (not a complex many-to-many relationship).
-- Canonical ordering ensures (userA, userB) and (userB, userA) map to the same conversation.
ALTER TABLE conversations
  ADD CONSTRAINT check_canonical_order CHECK (participant1_id < participant2_id);

-- Unique constraint enforces one conversation per ordered pair
ALTER TABLE conversations
  ADD CONSTRAINT unique_participants UNIQUE (participant1_id, participant2_id);

-- Index for fast lookup
CREATE INDEX idx_conversations_participant1 ON conversations (participant1_id);
CREATE INDEX idx_conversations_participant2 ON conversations (participant2_id);
```

```typescript
// Application use case
export class GetOrCreateConversationUseCase {
  async execute(userId: string, otherUserId: string): Promise<Conversation> {
    // Always order IDs to ensure uniqueness
    const [participant1, participant2] = [userId, otherUserId].sort();

    // Try to find existing conversation
    let conversation = await this.conversationRepo.findByParticipants(participant1, participant2);

    // Create if not exists (idempotent)
    if (!conversation) {
      conversation = await this.conversationRepo.create({
        participant1Id: participant1,
        participant2Id: participant2,
      });
    }

    return conversation;
  }
}
```

---

## R7: Offline Message Delivery

### Decision

Store messages in PostgreSQL immediately upon send, deliver via WebSocket to online users, and sync missed messages upon reconnection.

### Rationale

1. **Reliability**: PostgreSQL ensures messages are never lost even if recipient is offline
2. **Simple model**: No separate queue needed, database acts as queue
3. **Sync on connect**: Client requests missed messages based on last known message timestamp

### Alternatives Considered

- **Message queue (Kafka/BullMQ)**: Rejected as over-engineering for MVP (adds complexity)
- **Redis queue**: Rejected because lacks durability guarantees
- **Push notifications**: Deferred to existing notification module (out of scope for chat module)

### Reconnection Flow

```typescript
// Client reconnects and syncs missed messages
@SubscribeMessage('conversation:sync')
async handleSync(
  @MessageBody() dto: { conversationId: string; lastMessageId: string },
) {
  const missedMessages = await this.getConversationHistoryUseCase.execute({
    conversationId: dto.conversationId,
    afterMessageId: dto.lastMessageId,
  });

  return { status: 'success', data: missedMessages };
}
```

### Notification Integration

- Chat module emits domain event: `MessageSentEvent`
- Notification module listens and sends push notification if recipient is offline
- Separation of concerns: chat focuses on messaging, notifications handle alerts

---

## R8: Message Search Implementation

### Decision

Use **PostgreSQL full-text search** with `tsvector` and GIN indexes for sub-3-second search performance.

### Rationale

1. **Native support**: PostgreSQL full-text search is production-ready and performant
2. **Integrated**: No need for external search engine (Elasticsearch) for MVP
3. **Performance**: GIN indexes provide sub-second search on 10,000+ messages
4. **Simple queries**: Supports basic keyword matching sufficient for MVP

### Alternatives Considered

- **Elasticsearch**: Rejected as over-engineering for MVP (adds operational complexity)
- **Naive LIKE queries**: Rejected because too slow for full-text search
- **Redis RediSearch**: Rejected because requires Redis Stack (not standard Redis)

### Implementation

```typescript
// Repository method
async searchMessages(
  userId: string,
  query: string,
  limit: number = 50,
): Promise<Message[]> {
  return this.messageRepo
    .createQueryBuilder('m')
    .innerJoin('m.conversation', 'c')
    .innerJoin('c.participants', 'p')
    .where('p.userId = :userId', { userId })
    .andWhere('m.search_vector @@ plainto_tsquery(:query)', { query })
    .orderBy('ts_rank(m.search_vector, plainto_tsquery(:query))', 'DESC')
    .limit(limit)
    .getMany();
}
```

### Performance Optimization

- **GIN index**: Creates inverted index for instant keyword lookup
- **Rank ordering**: Results sorted by relevance (ts_rank function)
- **User filtering**: Only search user's accessible conversations (security)

---

## R9: Security Considerations

### Decision

Implement **multi-layer security**: JWT authentication, authorization checks, input validation, output sanitization, and rate limiting.

### Rationale

1. **Defense in depth**: Multiple security layers prevent exploitation
2. **Constitution compliance**: Follows Principle VI security requirements
3. **Standards**: Aligns with OWASP best practices

### Security Controls

```typescript
// 1. WebSocket JWT Authentication
@UseGuards(WsJwtAuthGuard) // Validates JWT token on connection
export class ChatGateway {
  @SubscribeMessage('message:send')
  async handleSendMessage(
    @CurrentUser() user: User, // Extracted from JWT
    @MessageBody() dto: SendMessageDto,
  ) {
    // 2. Authorization: Ensure user is participant in conversation
    const conversation = await this.conversationRepo.findById(dto.conversationId);
    if (!conversation.hasParticipant(user.id)) {
      throw new ForbiddenException('Not a participant in this conversation');
    }

    // 3. Input validation (class-validator)
    // - dto.content: @IsString(), @MaxLength(5000), @IsNotEmpty()

    // 4. Sanitization happens in DTO mapper
    // - Strip HTML tags, trim whitespace

    // 5. Rate limiting via ThrottlerGuard
    // - Max 10 messages/minute per user

    return this.sendMessageUseCase.execute(dto);
  }
}
```

### XSS Prevention

- Content stored as plain text (no HTML)
- Frontend responsible for rendering (escapes by default in React/Vue/Angular)
- No eval() or dangerouslySetInnerHTML in frontend

### SQL Injection Prevention

- TypeORM parameterized queries (automatic)
- No raw SQL except for full-text search (uses parameterized placeholders)

---

## R10: Performance Benchmarking Plan

### Decision

Establish **performance baselines** and monitoring for key metrics defined in success criteria.

### Performance Targets (from spec)

| Metric                   | Target           | Measurement Method                 |
| ------------------------ | ---------------- | ---------------------------------- |
| Message delivery latency | <1s (p95)        | WebSocket event timestamp diff     |
| Concurrent connections   | 1,000/instance   | Load testing with Socket.IO client |
| Message delivery success | 99.9%            | Event delivery confirmation rate   |
| History load time        | <2s (50 msgs)    | REST endpoint response time        |
| Typing indicator latency | <500ms           | WebSocket event timestamp diff     |
| Conversation list load   | <1s (100 convos) | REST endpoint response time        |
| Message search           | <3s (10k msgs)   | REST endpoint response time        |
| Message burst handling   | 100 msg/s        | Load testing with artillery        |

### Monitoring Strategy

```typescript
// Performance logging interceptor
@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now();
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        this.logger.log({
          method: request.method,
          path: request.path,
          duration,
          timestamp: new Date().toISOString(),
        });

        // Alert if exceeds threshold
        if (duration > 2000) {
          this.logger.warn(`Slow request detected: ${request.path} took ${duration}ms`);
        }
      }),
    );
  }
}
```

### Load Testing

```yaml
# artillery.yml - Load test configuration
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 50 # 50 users/second
      name: 'Warm up'
    - duration: 120
      arrivalRate: 100 # 100 users/second (1,000 concurrent at steady state)
      name: 'Sustained load'
scenarios:
  - name: 'Send and receive messages'
    engine: 'socketio'
    flow:
      - emit:
          channel: 'message:send'
          data:
            conversationId: '{{ conversationId }}'
            content: 'Load test message'
      - think: 5
```

---

## Summary of Decisions

| Area                       | Decision                               | Rationale                                                   |
| -------------------------- | -------------------------------------- | ----------------------------------------------------------- |
| **Real-time Protocol**     | Socket.IO with Redis adapter           | Already integrated, battle-tested, multi-instance support   |
| **Message Storage**        | TypeORM + PostgreSQL                   | Consistency with project, ACID guarantees, full-text search |
| **Status Tracking**        | Embedded in messages table             | Simple for 1:1 chat, efficient queries                      |
| **Typing Indicators**      | Redis with TTL                         | Ephemeral state, auto-expiration, multi-instance            |
| **Rate Limiting**          | ThrottlerGuard + Redis                 | Built-in, distributed, standards compliance                 |
| **Conversation Discovery** | Unique constraint + REST endpoint      | Data integrity, idempotent creation                         |
| **Offline Delivery**       | PostgreSQL queue + sync on connect     | Simple, reliable, no external queue needed                  |
| **Message Search**         | PostgreSQL full-text search            | Native, performant, no external dependencies                |
| **Security**               | Multi-layer (JWT + authz + validation) | Defense in depth, constitution compliance                   |
| **Performance Monitoring** | Interceptors + load testing            | Proactive monitoring, baseline validation                   |

---

## Next Steps (Phase 1)

1. ✅ Research complete - all NEEDS CLARIFICATION resolved
2. ⏭️ Generate `data-model.md` with detailed entity schemas
3. ⏭️ Generate `contracts/` with OpenAPI specs for REST endpoints and WebSocket events
4. ⏭️ Generate `quickstart.md` with setup instructions
5. ⏭️ Update agent context (`.github/copilot-instructions.md`)
6. ⏭️ Re-evaluate Constitution Check post-design
