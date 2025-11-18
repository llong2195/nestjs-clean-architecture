# Research: Real-time Chat Module

**Feature**: Real-time messaging with WebSocket (Socket.IO), Redis pub/sub, and Clean Architecture
**Date**: 2025-11-18
**Status**: Phase 0 - Research & Architecture Design

## 1. WebSocket Scaling with Socket.IO + Redis Adapter

### Decision: Socket.IO with @socket.io/redis-adapter

**Implementation Approach**:

```typescript
// src/shared/websocket/websocket-redis-adapter.ts (already exists)
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

export class WebSocketRedisAdapter extends IoAdapter {
  createIOServer(port: number, options?: any): any {
    const server = super.createIOServer(port, options);
    const pubClient = createClient({ url: process.env.REDIS_URL });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);
    server.adapter(createAdapter(pubClient, subClient));

    return server;
  }
}
```

**Why Chosen**:

- Official Socket.IO adapter for Redis pub/sub
- Automatic synchronization of connection state across multiple instances
- Room management works seamlessly (user-specific and conversation-specific rooms)
- Sticky sessions NOT required - any instance can handle any client
- Battle-tested in production environments

**Architecture Pattern**:

1. **User-specific rooms**: Each connected user joins room `user:{userId}`
2. **Conversation rooms**: Participants join `conversation:{conversationId}` when opening chat
3. **Message delivery**: Server emits to `conversation:{conversationId}` room → Redis pub/sub → all instances → clients
4. **Typing indicators**: Similar pattern, ephemeral (no DB persistence)

**Performance Characteristics**:

- Latency overhead: ~2-5ms per message hop (Redis pub/sub)
- Supports 10,000+ concurrent connections per instance (Node.js non-blocking I/O)
- Horizontal scaling: Add more instances behind load balancer

**Configuration Requirements**:

```typescript
// Environment variables
REDIS_URL=redis://localhost:6379
WEBSOCKET_PORT=3000
WEBSOCKET_CORS_ORIGIN=http://localhost:3001
```

**Alternatives Considered**:

- **RabbitMQ with socket.io-amqp**: More complex setup, overkill for pub/sub
- **Kafka with socket.io-kafka**: Heavy for real-time use case, designed for event streaming
- **Manual Redis pub/sub**: Reinventing the wheel, @socket.io/redis-adapter handles edge cases

**Trade-offs**:

- ✅ Simple setup, official support, automatic room sync
- ❌ Adds Redis as dependency (already required for caching, so acceptable)
- ❌ Message ordering guarantees only within single Redis pub channel (acceptable for chat)

---

## 2. Typing Indicator Implementation

### Decision: Redis pub/sub with TTL-based expiration

**Implementation Approach**:

```typescript
// src/modules/conversation/infrastructure/cache/typing-indicator.cache.ts
import { Injectable } from '@nestjs/common';
import { RedisService } from '@/shared/cache/redis.service';

@Injectable()
export class TypingIndicatorCache {
  constructor(private readonly redis: RedisService) {}

  async setTyping(conversationId: string, userId: string): Promise<void> {
    const key = `typing:${conversationId}:${userId}`;
    await this.redis.set(key, '1', { EX: 3 }); // 3-second TTL
  }

  async getTypingUsers(conversationId: string): Promise<string[]> {
    const pattern = `typing:${conversationId}:*`;
    const keys = await this.redis.keys(pattern);
    return keys.map((k) => k.split(':')[2]); // Extract userId
  }

  async stopTyping(conversationId: string, userId: string): Promise<void> {
    const key = `typing:${conversationId}:${userId}`;
    await this.redis.del(key);
  }
}
```

**WebSocket Event Flow**:

1. Client emits `typing:start` with conversationId
2. Server sets Redis key `typing:{conversationId}:{userId}` with 3s TTL
3. Server broadcasts `typing:indicator` to conversation room (excluding sender)
4. If client emits `typing:stop`, Redis key deleted immediately
5. If no activity for 3s, Redis auto-expires key

**Why Chosen**:

- Ephemeral by nature - no need to persist typing state
- Automatic cleanup via TTL (no manual garbage collection)
- Fast reads/writes (in-memory)
- Multi-instance support via Redis pub/sub

**Throttling Strategy**:

```typescript
// Client-side debounce
let typingTimeout: NodeJS.Timeout;
const handleTyping = () => {
  clearTimeout(typingTimeout);
  socket.emit('typing:start', { conversationId });

  typingTimeout = setTimeout(() => {
    socket.emit('typing:stop', { conversationId });
  }, 3000);
};

input.addEventListener('input', debounce(handleTyping, 500));
```

**Server-side rate limit**: Max 1 `typing:start` event per second per user (using @nestjs/throttler)

**Alternatives Considered**:

- **Redis Streams**: Overkill, designed for message queuing (not ephemeral state)
- **In-memory Map**: Doesn't sync across instances, requires manual TTL cleanup
- **Database table**: Too slow, unnecessary persistence overhead

**Trade-offs**:

- ✅ Simple, fast, auto-expiring, multi-instance compatible
- ❌ Redis dependency (already required)
- ❌ `keys()` command inefficient with millions of keys (acceptable at MVP scale)

**Performance Optimization**:

- Use Redis Hash instead of individual keys for each conversation:
  ```typescript
  await this.redis.hset(`typing:${conversationId}`, userId, Date.now());
  await this.redis.expire(`typing:${conversationId}`, 5); // Refresh conversation-level TTL
  ```

---

## 3. Message Queue for Offline Delivery

### Decision: Hybrid approach - Immediate WebSocket + BullMQ for offline

**Implementation Approach**:

```typescript
// src/modules/conversation/application/use-cases/send-message.use-case.ts
async execute(dto: SendMessageDto): Promise<MessageResponseDto> {
  // 1. Persist message to database
  const message = await this.conversationRepo.saveMessage(dto);

  // 2. Immediate delivery to online users via WebSocket
  this.websocketGateway.emitToConversation(message.conversationId, {
    event: 'message:received',
    data: message,
  });

  // 3. Queue offline delivery job (BullMQ)
  await this.messageQueue.add('offline-delivery', {
    messageId: message.id,
    conversationId: message.conversationId,
    excludeUserId: message.senderId, // Don't send to sender
  }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 }, // 2s, 4s, 8s
  });

  return message;
}
```

**BullMQ Worker**:

```typescript
// src/modules/conversation/infrastructure/workers/offline-delivery.worker.ts
@Processor('offline-delivery')
export class OfflineDeliveryWorker {
  @Process()
  async handleOfflineDelivery(job: Job<OfflineDeliveryJobData>) {
    const { messageId, conversationId } = job.data;

    // Check if recipient is now online
    const isOnline = await this.websocketGateway.isUserOnline(recipientId);
    if (isOnline) {
      // Deliver immediately via WebSocket
      this.websocketGateway.emitToUser(recipientId, {
        event: 'message:received',
        data: message,
      });
    } else {
      // Keep in queue, retry later (with exponential backoff)
      throw new Error('User still offline'); // Triggers retry
    }
  }
}
```

**Why Chosen**:

- **BullMQ**: Redis-based, reliable, supports delayed jobs and retries
- **Separation of concerns**: Use cases don't know about WebSocket implementation
- **Graceful degradation**: If WebSocket fails, queue ensures delivery
- **Retry logic**: Exponential backoff avoids hammering offline users

**Notification Strategy**:

- When user reconnects (WebSocket `connection` event), fetch undelivered messages from DB:
  ```typescript
  @SubscribeMessage('connection')
  async handleConnection(@ConnectedSocket() client: Socket) {
    const userId = client.data.user.id;
    const undelivered = await this.conversationRepo.getUndeliveredMessages(userId);
    client.emit('messages:undelivered', undelivered);
  }
  ```

**Alternatives Considered**:

- **Direct Redis pub/sub only**: Messages lost if no instance subscribed (no persistence)
- **Kafka**: Overkill for MVP, adds operational complexity
- **Push notifications (FCM/APNs)**: Out of scope for MVP (future enhancement)

**Trade-offs**:

- ✅ Reliable delivery with retries, supports offline users
- ✅ Uses existing BullMQ infrastructure (shared/messaging/)
- ❌ Eventual consistency (offline users receive messages when they reconnect)
- ❌ Redis memory usage for queued jobs (acceptable with job expiration after 24h)

**Dead Letter Queue**:

```typescript
{
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 },
  removeOnComplete: true,
  removeOnFail: { count: 1000 }, // Keep last 1000 failed jobs for debugging
}
```

---

## 4. Full-Text Search Implementation

### Decision: PostgreSQL tsvector with GIN index (MVP), Elasticsearch (future)

**Implementation Approach**:

```typescript
// Migration: Add tsvector column and GIN index
export class AddMessageSearchIndex implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE messages 
      ADD COLUMN search_vector tsvector 
      GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;
    `);

    await queryRunner.query(`
      CREATE INDEX idx_messages_search_vector 
      ON messages USING GIN (search_vector);
    `);
  }
}
```

**Repository Method**:

```typescript
// src/modules/conversation/infrastructure/persistence/conversation.repository.ts
async searchMessages(userId: string, query: string, limit: number): Promise<Message[]> {
  const results = await this.ormRepo
    .createQueryBuilder('msg')
    .innerJoin('conversation_participants', 'cp', 'cp.conversation_id = msg.conversation_id')
    .where('cp.user_id = :userId', { userId })
    .andWhere('msg.search_vector @@ plainto_tsquery(:query)', { query })
    .orderBy("ts_rank(msg.search_vector, plainto_tsquery(:query))", 'DESC')
    .limit(limit)
    .getMany();

  return results.map(orm => this.mapper.toDomain(orm));
}
```

**Why Chosen**:

- PostgreSQL 18+ has excellent full-text search capabilities
- No additional infrastructure (Elasticsearch requires separate cluster)
- GIN index provides fast lookups (O(log N) for tsvector searches)
- `ts_rank()` provides relevance scoring

**Performance Characteristics**:

- **10,000 messages**: ~50ms search latency (with GIN index)
- **100,000 messages**: ~150ms search latency
- **1M+ messages**: Consider partitioning by conversation_id or migration to Elasticsearch

**Multi-language Support**:

```typescript
// For Vietnamese/Japanese, use 'simple' dictionary or pg_trgm extension
ALTER TABLE messages
ADD COLUMN search_vector_multilang tsvector
GENERATED ALWAYS AS (to_tsvector('simple', content)) STORED;

CREATE INDEX idx_messages_search_multilang
ON messages USING GIN (search_vector_multilang);
```

**Alternatives Considered**:

- **Elasticsearch**: Better for large-scale (millions of messages), but operational overhead for MVP
- **LIKE queries**: Slow (full table scan), no relevance ranking
- **pg_trgm (trigram)**: Good for fuzzy matching, but slower than tsvector for exact matches

**Trade-offs**:

- ✅ Simple setup, no new infrastructure, good performance for MVP scale
- ✅ Relevance ranking with ts_rank()
- ❌ English-only stemming (Vietnamese/Japanese require separate columns or 'simple' dictionary)
- ❌ Not as feature-rich as Elasticsearch (no fuzzy matching, synonyms, autocomplete)

**Migration Path to Elasticsearch**:

```typescript
// Future: Elasticsearch integration (Phase 2)
@Injectable()
export class ElasticsearchMessageSearch {
  async indexMessage(message: Message): Promise<void> {
    await this.esClient.index({
      index: 'messages',
      id: message.id,
      document: {
        conversationId: message.conversationId,
        content: message.content,
        senderId: message.senderId,
        createdAt: message.createdAt,
      },
    });
  }

  async search(query: string, filters: SearchFilters): Promise<Message[]> {
    const { body } = await this.esClient.search({
      index: 'messages',
      body: {
        query: {
          bool: {
            must: [
              { match: { content: { query, fuzziness: 'AUTO' } } },
              { term: { conversationId: filters.conversationId } },
            ],
          },
        },
        sort: [{ createdAt: 'desc' }],
      },
    });
    return body.hits.hits.map((hit) => hit._source);
  }
}
```

---

## 5. Conversation Participant Junction Table Patterns

### Decision: last_read_at timestamp + derived unread count query

**Schema Design**:

```sql
CREATE TABLE conversation_participants (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
  left_at TIMESTAMP NULL,  -- NULL means still active
  last_read_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX idx_conversation_participants_user
ON conversation_participants(user_id)
WHERE left_at IS NULL;  -- Partial index for active participants only
```

**Unread Count Query**:

```typescript
// src/modules/conversation/infrastructure/persistence/conversation.repository.ts
async getUnreadCount(conversationId: string, userId: string): Promise<number> {
  const result = await this.ormRepo.query(`
    SELECT COUNT(*) as unread_count
    FROM messages m
    INNER JOIN conversation_participants cp
      ON cp.conversation_id = m.conversation_id
    WHERE cp.conversation_id = $1
      AND cp.user_id = $2
      AND m.created_at > cp.last_read_at
      AND m.sender_id != $2  -- Exclude own messages
  `, [conversationId, userId]);

  return parseInt(result[0].unread_count, 10);
}
```

**Mark as Read**:

```typescript
async markAsRead(conversationId: string, userId: string): Promise<void> {
  await this.participantRepo.update(
    { conversationId, userId },
    { lastReadAt: new Date() }
  );
}
```

**Why Chosen**:

- **last_read_at timestamp**: Simple, no counter field to maintain
- **Derived count**: Always accurate (no sync issues), calculated on-demand
- **Partial index**: Filters out inactive participants (left_at IS NOT NULL), improves query speed

**Add/Remove Participant (GROUP only)**:

```typescript
async addParticipant(conversationId: string, userId: string): Promise<void> {
  // Domain validation: Only allow for GROUP conversations
  const conversation = await this.findById(conversationId);
  if (conversation.type !== ConversationType.GROUP) {
    throw new BadRequestException('Cannot add participants to DIRECT conversations');
  }

  await this.participantRepo.insert({
    conversationId,
    userId,
    joinedAt: new Date(),
    lastReadAt: new Date(),
  });
}

async removeParticipant(conversationId: string, userId: string): Promise<void> {
  await this.participantRepo.update(
    { conversationId, userId },
    { leftAt: new Date() }
  );
  // Soft delete: Keep history, participant can't send/read new messages
}
```

**Query Optimization for Conversation List**:

```sql
-- Get user's conversations with unread counts (single query)
SELECT
  c.id,
  c.name,
  c.type,
  c.updated_at,
  COUNT(m.id) FILTER (WHERE m.created_at > cp.last_read_at AND m.sender_id != $1) AS unread_count,
  (
    SELECT json_build_object('id', last_msg.id, 'content', last_msg.content, 'created_at', last_msg.created_at)
    FROM messages last_msg
    WHERE last_msg.conversation_id = c.id
    ORDER BY last_msg.created_at DESC
    LIMIT 1
  ) AS last_message
FROM conversations c
INNER JOIN conversation_participants cp ON cp.conversation_id = c.id
LEFT JOIN messages m ON m.conversation_id = c.id
WHERE cp.user_id = $1
  AND cp.left_at IS NULL
GROUP BY c.id, cp.last_read_at
ORDER BY c.updated_at DESC
LIMIT 50;
```

**Alternatives Considered**:

- **Separate unread_count column**: Requires triggers to keep in sync, prone to race conditions
- **Message-level read_by array**: Expensive to query, JSON arrays in PostgreSQL not indexed well
- **Redis cache for unread counts**: Adds complexity, cache invalidation issues

**Trade-offs**:

- ✅ Simple, consistent, no denormalization
- ✅ Partial index improves query performance (only active participants)
- ❌ COUNT(\*) can be slow for conversations with 10,000+ messages (acceptable for MVP, can add materialized view later)

**Performance Optimization (Future)**:

```sql
-- Materialized view for conversation list (refresh every 5 minutes)
CREATE MATERIALIZED VIEW conversation_list_cache AS
SELECT
  cp.user_id,
  c.id AS conversation_id,
  c.name,
  c.type,
  c.updated_at,
  COUNT(m.id) FILTER (WHERE m.created_at > cp.last_read_at AND m.sender_id != cp.user_id) AS unread_count
FROM conversations c
INNER JOIN conversation_participants cp ON cp.conversation_id = c.id
LEFT JOIN messages m ON m.conversation_id = c.id
WHERE cp.left_at IS NULL
GROUP BY cp.user_id, c.id, c.name, c.type, c.updated_at, cp.last_read_at;

CREATE INDEX idx_conversation_list_cache_user
ON conversation_list_cache(user_id, updated_at DESC);
```

---

## Summary of Architectural Decisions

| Component           | Technology Choice                        | Rationale                                                    |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------ |
| WebSocket Server    | Socket.IO 4.x + @socket.io/redis-adapter | Official adapter, automatic multi-instance sync              |
| Typing Indicators   | Redis pub/sub with 3s TTL                | Ephemeral state, auto-expiring, multi-instance               |
| Offline Delivery    | BullMQ (Redis-based queue)               | Reliable retries, exponential backoff, existing infra        |
| Full-Text Search    | PostgreSQL tsvector + GIN index          | No new infra, good MVP performance, easy migration to ES     |
| Unread Count        | Derived from last_read_at timestamp      | Always consistent, no denormalization, partial index speedup |
| Message Persistence | PostgreSQL 18+ with TypeORM              | ACID transactions, relational integrity                      |

**Performance Validation Checklist**:

- [ ] Load test: 1,000 concurrent WebSocket connections per instance
- [ ] Message delivery latency: p95 < 1s (online recipients)
- [ ] Search latency: p95 < 3s (10,000 messages)
- [ ] Conversation list load: p95 < 2s (50 conversations with unread counts)
- [ ] Typing indicator latency: p95 < 500ms

**Scalability Path**:

1. **MVP (0-10K users)**: Current architecture sufficient
2. **Growth (10K-100K users)**: Add Elasticsearch for search, materialized views for conversation lists
3. **Scale (100K+ users)**: Partition messages table by conversation_id, separate read replicas, CDN for static assets

**Next Steps**: Proceed to Phase 1 (Data Model & API Contracts)
