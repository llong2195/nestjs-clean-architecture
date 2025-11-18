# Data Model: Real-time Chat Module

**Feature**: Real-time messaging with DIRECT and GROUP conversation support
**Date**: 2025-11-18
**Status**: Phase 1 - Design & Data Model

## Entity Relationship Diagram

```
┌─────────────────┐         ┌──────────────────────────┐         ┌────────────────┐
│  User           │         │ ConversationParticipant  │         │  Conversation  │
│  (external)     │◄────────│  (junction table)        │────────►│                │
├─────────────────┤  1:N    ├──────────────────────────┤  N:1    ├────────────────┤
│ id (PK)         │         │ conversation_id (PK, FK) │         │ id (PK)        │
│ name            │         │ user_id (PK, FK)         │         │ name           │
│ email           │         │ joined_at                │         │ type (enum)    │
└─────────────────┘         │ left_at (nullable)       │         │ created_by     │
                            │ last_read_at             │         │ created_at     │
                            └──────────────────────────┘         │ updated_at     │
                                                                 │ is_active      │
                                                                 └────────────────┘
                                                                        │ 1:N
                                                                        ▼
                                                           ┌────────────────────┐
                                                           │  Message           │
                                                           ├────────────────────┤
                                                           │ id (PK)            │
                                                           │ conversation_id    │
                                                           │ sender_id (FK)     │
                                                           │ content            │
                                                           │ is_delivered       │
                                                           │ is_read            │
                                                           │ created_at         │
                                                           │ updated_at         │
                                                           └────────────────────┘
```

## Domain Entities

### 1. Conversation (Aggregate Root)

**Purpose**: Manages conversation lifecycle, participant membership, and enforces business rules.

**Domain Layer** (`src/modules/conversation/domain/aggregates/conversation.aggregate.ts`):

```typescript
export class Conversation {
  private _messages: Message[] = [];
  private _participantIds: Set<string>;

  private constructor(
    public readonly id: string, // UUID v7
    private _name: string | null, // Nullable (DIRECT has no name)
    private _type: ConversationType, // DIRECT or GROUP
    public readonly createdBy: string, // User ID who created conversation
    public readonly createdAt: Date,
    private _updatedAt: Date,
    private _isActive: boolean, // For archiving conversations
    participantIds: string[],
  ) {
    this._participantIds = new Set(participantIds);
  }
}
```

**Fields**:
| Field | Type | Constraints | Description |
| ------------- | ------------------ | ------------------------------------------- | ------------------------------------- |
| id | UUID v7 | Primary Key | Unique conversation identifier |
| name | string (nullable) | Max 255 chars, required for GROUP | Conversation display name |
| type | ConversationType | Enum: DIRECT, GROUP | Conversation type |
| createdBy | UUID | Foreign Key → users(id) | User who created the conversation |
| createdAt | timestamp | NOT NULL, default NOW() | Creation timestamp |
| updatedAt | timestamp | NOT NULL, default NOW() | Last activity timestamp |
| isActive | boolean | NOT NULL, default true | False when archived |

**Value Object**: `ConversationType` (src/modules/conversation/domain/value-objects/conversation-type.vo.ts)

```typescript
export enum ConversationType {
  DIRECT = 'DIRECT', // 1-on-1 conversation (exactly 2 participants)
  GROUP = 'GROUP', // Group chat (3+ participants)
}
```

**Business Rules**:

1. **DIRECT conversations**:
   - Must have exactly 2 participants
   - Cannot have a name (name = null)
   - Cannot add/remove participants
   - Uniqueness constraint: Only 1 DIRECT conversation per participant pair

2. **GROUP conversations**:
   - Must have 3+ participants
   - Must have a name (required)
   - Can add/remove participants (minimum 2 participants)
   - No uniqueness constraint (multiple GROUP conversations with same participants allowed)

3. **General rules**:
   - Only participants can send messages
   - Inactive (archived) conversations cannot receive new messages
   - Creator must be included in participant list

**Domain Methods**:

```typescript
addMessage(senderId: string, content: string): Message
addParticipant(userId: string, addedBy: string): void  // GROUP only
removeParticipant(userId: string, removedBy: string): void  // GROUP only
updateName(newName: string, updatedBy: string): void  // GROUP only
archive(archivedBy: string): void
reactivate(reactivatedBy: string): void
isParticipant(userId: string): boolean
```

**Database Schema** (PostgreSQL):

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('DIRECT', 'GROUP')),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Indexes
CREATE INDEX idx_conversations_created_by ON conversations(created_by);
CREATE INDEX idx_conversations_type ON conversations(type);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);
```

---

### 2. Message (Entity)

**Purpose**: Represents a single message sent within a conversation. Immutable after creation (no editing/deletion in MVP).

**Domain Layer** (`src/modules/conversation/domain/entities/message.entity.ts`):

```typescript
export class Message {
  private constructor(
    public readonly id: string, // UUID v7
    public readonly conversationId: string,
    public readonly senderId: string,
    private _content: string,
    private _isDelivered: boolean, // Delivered to recipient's device
    private _isRead: boolean, // Read by recipient
    public readonly createdAt: Date,
    private _updatedAt: Date,
  ) {}

  static create(conversationId: string, senderId: string, content: string): Message {
    // Validation: content 1-5000 chars (trim whitespace)
    const trimmed = content.trim();
    if (trimmed.length === 0 || trimmed.length > 5000) {
      throw new Error('Message content must be 1-5000 characters');
    }

    const now = new Date();
    return new Message(
      uuid(),
      conversationId,
      senderId,
      trimmed,
      false, // Not delivered yet
      false, // Not read yet
      now,
      now,
    );
  }
}
```

**Fields**:
| Field | Type | Constraints | Description |
| -------------- | --------- | ------------------------------------------- | -------------------------------------- |
| id | UUID v7 | Primary Key | Unique message identifier |
| conversationId | UUID | Foreign Key → conversations(id) ON CASCADE | Parent conversation |
| senderId | UUID | Foreign Key → users(id) ON CASCADE | User who sent the message |
| content | text | NOT NULL, 1-5000 chars (trimmed) | Message text content |
| isDelivered | boolean | NOT NULL, default false | Delivered to recipient's device |
| isRead | boolean | NOT NULL, default false | Read by recipient (implies delivered) |
| createdAt | timestamp | NOT NULL, default NOW() | Message sent timestamp |
| updatedAt | timestamp | NOT NULL, default NOW() | Last status update timestamp |

**Status Tracking** (Simplified - Boolean Fields):
Per clarification decision, message status is tracked via two boolean fields:

- `isDelivered`: Set to `true` when recipient's device receives the message (WebSocket ACK)
- `isRead`: Set to `true` when recipient opens the conversation and views the message

**State Transitions**:

```
[Created: isDelivered=false, isRead=false]
         ↓ (recipient device receives WebSocket message)
[Delivered: isDelivered=true, isRead=false]
         ↓ (recipient opens conversation, marks as read)
[Read: isDelivered=true, isRead=true]
```

**Business Rules**:

1. Message content cannot be empty (after trimming whitespace)
2. Maximum content length: 5,000 characters
3. Messages are immutable (no editing/deletion in MVP)
4. Only sender can send messages to their own conversations
5. isRead=true implies isDelivered=true (read receipts only work for delivered messages)

**Domain Methods**:

```typescript
markAsDelivered(): void  // Set isDelivered = true
markAsRead(): void       // Set isDelivered = true AND isRead = true
```

**Database Schema** (PostgreSQL):

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (LENGTH(TRIM(content)) BETWEEN 1 AND 5000),
  is_delivered BOOLEAN NOT NULL DEFAULT FALSE,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);

-- Full-text search index (PostgreSQL tsvector)
ALTER TABLE messages
ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;

CREATE INDEX idx_messages_search_vector ON messages USING GIN (search_vector);
```

---

### 3. ConversationParticipant (Junction Entity)

**Purpose**: Explicit junction table for many-to-many relationship between conversations and users. Tracks participant lifecycle and read status.

**Domain Consideration**:

- This is primarily an infrastructure concern (persistence layer)
- Domain logic for participant management lives in Conversation aggregate
- Stores additional metadata: joined_at, left_at (soft delete), last_read_at

**Infrastructure Layer** (`src/modules/conversation/infrastructure/persistence/conversation-participant.orm-entity.ts`):

```typescript
@Entity({ name: 'conversation_participants' })
export class ConversationParticipantOrmEntity {
  @PrimaryColumn({ name: 'conversation_id', type: 'uuid' })
  conversationId!: string;

  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'joined_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  joinedAt!: Date;

  @Column({ name: 'left_at', type: 'timestamp', nullable: true })
  leftAt!: Date | null; // NULL = active participant, NOT NULL = left conversation

  @Column({ name: 'last_read_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastReadAt!: Date; // For calculating unread message count
}
```

**Fields**:
| Field | Type | Constraints | Description |
| -------------- | ------------------ | ------------------------------------- | ----------------------------------------- |
| conversationId | UUID | Primary Key (composite), Foreign Key | Conversation reference |
| userId | UUID | Primary Key (composite), Foreign Key | User reference |
| joinedAt | timestamp | NOT NULL, default NOW() | When participant joined |
| leftAt | timestamp (nullable) | NULL | When participant left (soft delete) |
| lastReadAt | timestamp | NOT NULL, default NOW() | Last time user read messages |

**Unread Count Calculation**:

```sql
-- Count unread messages for a user in a conversation
SELECT COUNT(*) as unread_count
FROM messages m
INNER JOIN conversation_participants cp
  ON cp.conversation_id = m.conversation_id
WHERE cp.conversation_id = $conversationId
  AND cp.user_id = $userId
  AND m.created_at > cp.last_read_at
  AND m.sender_id != $userId;  -- Exclude own messages
```

**Business Rules**:

1. **Composite Primary Key**: (conversation_id, user_id) ensures uniqueness
2. **DIRECT conversation uniqueness**: Application enforces only 1 DIRECT conversation per participant pair (query before creation)
3. **GROUP conversation**: No uniqueness constraint (multiple GROUP with same participants allowed)
4. **Soft delete**: Set `left_at` timestamp instead of deleting row (preserves history)
5. **Active participants**: `left_at IS NULL`

**Database Schema** (PostgreSQL):

```sql
CREATE TABLE conversation_participants (
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
  left_at TIMESTAMP NULL,  -- Soft delete: NULL = active, NOT NULL = left
  last_read_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);

-- Partial index: Only index active participants (performance optimization)
CREATE INDEX idx_conversation_participants_user_active
ON conversation_participants(user_id)
WHERE left_at IS NULL;

CREATE INDEX idx_conversation_participants_conversation
ON conversation_participants(conversation_id);
```

**Uniqueness Enforcement for DIRECT Conversations**:

```sql
-- Application-level check before creating DIRECT conversation
SELECT c.id
FROM conversations c
INNER JOIN conversation_participants cp1 ON cp1.conversation_id = c.id
INNER JOIN conversation_participants cp2 ON cp2.conversation_id = c.id
WHERE c.type = 'DIRECT'
  AND cp1.user_id = $user1Id
  AND cp2.user_id = $user2Id
  AND cp1.left_at IS NULL
  AND cp2.left_at IS NULL;

-- If result exists, return existing conversation instead of creating new one
```

---

### 4. TypingIndicator (Ephemeral - Redis)

**Purpose**: Real-time typing status indicator. Not persisted to database, stored in Redis with TTL for automatic expiration.

**Infrastructure Layer** (`src/modules/conversation/infrastructure/cache/typing-indicator.cache.ts`):

```typescript
@Injectable()
export class TypingIndicatorCache {
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

**Redis Data Structure**:

```
Key Pattern: typing:{conversationId}:{userId}
Value: "1" (placeholder, we only care about key existence)
TTL: 3 seconds (auto-expires if client doesn't send updates)
```

**Business Rules**:

1. Auto-expires after 3 seconds of inactivity (no manual cleanup needed)
2. Client sends `typing:start` event on keypress (debounced 500ms)
3. Client sends `typing:stop` event when input cleared or focus lost
4. Server broadcasts typing status to all conversation participants (excluding typer)

**Performance**:

- In-memory (Redis), ultra-fast reads/writes (<1ms)
- TTL-based expiration (no background jobs needed)
- Multi-instance compatible (Redis shared state)

---

## Data Model Summary

| Entity                   | Layer          | Persistence | Purpose                                  |
| ------------------------ | -------------- | ----------- | ---------------------------------------- |
| Conversation (aggregate) | Domain         | PostgreSQL  | Manages conversation lifecycle           |
| Message                  | Domain         | PostgreSQL  | Individual messages with status tracking |
| ConversationParticipant  | Infrastructure | PostgreSQL  | Junction table with participant metadata |
| TypingIndicator          | Infrastructure | Redis       | Ephemeral typing status (TTL 3s)         |

**Key Design Decisions**:

1. **Message Status**: Boolean fields (isDelivered, isRead) instead of separate MessageStatus table (simpler, sufficient for MVP)
2. **Uniqueness**: Only DIRECT conversations enforce uniqueness, GROUP allows duplicates
3. **Soft Delete**: Participants use `left_at` timestamp (preserves history)
4. **Unread Count**: Derived from `last_read_at` timestamp (no denormalized counter)
5. **Full-Text Search**: PostgreSQL tsvector with GIN index (no Elasticsearch in MVP)
6. **Typing Indicators**: Redis with TTL (ephemeral, no DB persistence)

**Performance Indexes**:

```sql
-- Conversation queries
idx_conversations_created_by, idx_conversations_type, idx_conversations_updated_at

-- Message queries (critical for chat history)
idx_messages_conversation_created (conversation_id, created_at DESC)
idx_messages_sender
idx_messages_search_vector (GIN for full-text search)

-- Participant queries (optimized for active users)
idx_conversation_participants_user_active (partial index: WHERE left_at IS NULL)
idx_conversation_participants_conversation
```

**Next Steps**: Proceed to API Contracts (contracts/websocket-events.yaml, contracts/rest-api.yaml)
