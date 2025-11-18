# Data Model: Real-time Chat Module

**Feature**: Real-time Chat Module  
**Branch**: 002-chat-module  
**Date**: 2025-11-13

## Overview

This document defines the domain entities, value objects, and database schema for the chat module. The design follows Clean Architecture principles with clear separation between domain models (business logic) and ORM entities (persistence).

---

## Domain Model (Business Logic Layer)

### 1. Message Entity

**Purpose**: Represents a single text message sent in a conversation. Immutable once created to maintain audit trail.

**Aggregate Root**: Yes (Message is self-contained)

**Properties**:

| Property       | Type          | Description                     | Constraints                          |
| -------------- | ------------- | ------------------------------- | ------------------------------------ |
| id             | UUID          | Unique message identifier       | Required, auto-generated             |
| conversationId | UUID          | Reference to conversation       | Required, foreign key                |
| senderId       | UUID          | User who sent the message       | Required, foreign key                |
| content        | string        | Message text content            | Required, 1-5000 characters, trimmed |
| status         | MessageStatus | Current delivery status         | Required, enum: SENT/DELIVERED/READ  |
| createdAt      | Date          | Message send timestamp (UTC)    | Required, auto-generated             |
| deliveredAt    | Date          | Delivery confirmation timestamp | Optional, set when delivered         |
| readAt         | Date          | Read confirmation timestamp     | Optional, set when read              |

**Business Rules**:

1. Message content MUST be non-empty after trimming whitespace
2. Message content MUST NOT exceed 5,000 characters
3. Status transitions MUST follow: SENT → DELIVERED → READ
4. Once created, content is immutable (no editing)
5. Timestamps are always stored in UTC
6. DeliveredAt MUST be after createdAt
7. ReadAt MUST be after deliveredAt

**Domain Methods**:

```typescript
export class Message {
  private constructor(
    public readonly id: string,
    public readonly conversationId: string,
    public readonly senderId: string,
    private _content: string,
    private _status: MessageStatus,
    public readonly createdAt: Date,
    private _deliveredAt?: Date,
    private _readAt?: Date,
  ) {
    this.validate();
  }

  static create(props: CreateMessageProps): Message {
    return new Message(
      uuid(),
      props.conversationId,
      props.senderId,
      props.content.trim(),
      MessageStatus.SENT,
      new Date(),
    );
  }

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
    // Can mark as read from any state (skip delivered if user opens conversation immediately)
    this._status = MessageStatus.READ;
    this._readAt = new Date();
  }

  private validate(): void {
    if (!this._content || this._content.length === 0) {
      throw new DomainException('Message content cannot be empty');
    }
    if (this._content.length > 5000) {
      throw new DomainException('Message content cannot exceed 5000 characters');
    }
  }

  // Getters
  get content(): string {
    return this._content;
  }
  get status(): MessageStatus {
    return this._status;
  }
  get deliveredAt(): Date | undefined {
    return this._deliveredAt;
  }
  get readAt(): Date | undefined {
    return this._readAt;
  }
}
```

---

### 2. Conversation Entity

**Purpose**: Represents a private one-on-one chat room between two users. Enforces uniqueness and manages participants.

**Aggregate Root**: Yes (Conversation manages its lifecycle)

**Properties**:

| Property       | Type | Description                     | Constraints              |
| -------------- | ---- | ------------------------------- | ------------------------ |
| id             | UUID | Unique conversation identifier  | Required, auto-generated |
| participant1Id | UUID | First participant user ID       | Required, foreign key    |
| participant2Id | UUID | Second participant user ID      | Required, foreign key    |
| createdAt      | Date | Conversation creation timestamp | Required, auto-generated |
| updatedAt      | Date | Last activity timestamp         | Required, auto-updated   |

**Business Rules**:

1. Conversation MUST have exactly 2 participants
2. Participant IDs MUST be different (cannot message self)
3. Conversation is unique per user pair (enforced by canonical ordering: lower UUID lexicographically comes first as participant1)
4. Participants cannot be changed after creation (immutable)
5. UpdatedAt is updated whenever a message is sent
6. Canonical ordering is purely for database uniqueness constraint, NOT for display purposes

**Domain Methods**:

```typescript
export class Conversation {
  private constructor(
    public readonly id: string,
    public readonly participant1Id: string,
    public readonly participant2Id: string,
    public readonly createdAt: Date,
    private _updatedAt: Date,
  ) {
    this.validate();
  }

  static create(user1Id: string, user2Id: string): Conversation {
    // Canonical ordering to ensure uniqueness (lexicographic sort of UUIDs)
    // This ensures (userA, userB) and (userB, userA) create the same conversation
    const [participant1, participant2] = [user1Id, user2Id].sort();

    if (user1Id === user2Id) {
      throw new DomainException('Cannot create conversation with same user');
    }

    return new Conversation(uuid(), participant1, participant2, new Date(), new Date());
  }

  hasParticipant(userId: string): boolean {
    return userId === this.participant1Id || userId === this.participant2Id;
  }

  getOtherParticipant(userId: string): string {
    if (!this.hasParticipant(userId)) {
      throw new DomainException('User is not a participant');
    }
    return userId === this.participant1Id ? this.participant2Id : this.participant1Id;
  }

  updateActivity(): void {
    this._updatedAt = new Date();
  }

  private validate(): void {
    if (this.participant1Id === this.participant2Id) {
      throw new DomainException('Cannot create conversation with same user');
    }
    if (!this.participant1Id || !this.participant2Id) {
      throw new DomainException('Both participants are required');
    }
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }
}
```

---

### 3. MessageStatus Value Object

**Purpose**: Type-safe enumeration for message delivery states.

**Type**: Enum (Value Object)

**Values**:

```typescript
export enum MessageStatus {
  SENT = 'sent', // Message stored in database, not yet delivered
  DELIVERED = 'delivered', // Recipient's client received the message
  READ = 'read', // Recipient viewed the message in conversation
}
```

**Validation**:

```typescript
export class MessageStatusVO {
  private constructor(private readonly value: MessageStatus) {}

  static fromString(value: string): MessageStatusVO {
    if (!Object.values(MessageStatus).includes(value as MessageStatus)) {
      throw new DomainException(`Invalid message status: ${value}`);
    }
    return new MessageStatusVO(value as MessageStatus);
  }

  toString(): string {
    return this.value;
  }

  equals(other: MessageStatusVO): boolean {
    return this.value === other.value;
  }
}
```

---

## Database Schema (Persistence Layer)

### Table: `conversations`

**Purpose**: Store conversation metadata and participant relationships.

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  participant2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Ensure participant1_id < participant2_id for uniqueness
  CONSTRAINT check_canonical_order CHECK (participant1_id < participant2_id),

  -- Ensure unique conversation per user pair
  CONSTRAINT unique_participants UNIQUE (participant1_id, participant2_id)
);

-- Index for fast participant lookup
CREATE INDEX idx_conversations_participant1 ON conversations (participant1_id);
CREATE INDEX idx_conversations_participant2 ON conversations (participant2_id);

-- Index for recent conversations (conversation list query)
CREATE INDEX idx_conversations_updated_at ON conversations (updated_at DESC);
```

**Notes**:

- Canonical ordering (participant1 < participant2) prevents duplicate conversations
- ON DELETE CASCADE ensures orphaned conversations are cleaned up if users are deleted
- Updated_at automatically updated via trigger or application logic

---

### Table: `messages`

**Purpose**: Store all message content and delivery status.

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(content) BETWEEN 1 AND 5000),
  status VARCHAR(20) NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMP,
  read_at TIMESTAMP,
  search_vector TSVECTOR, -- Full-text search optimization

  -- Timestamp ordering constraints
  CONSTRAINT check_delivered_after_sent CHECK (delivered_at IS NULL OR delivered_at >= created_at),
  CONSTRAINT check_read_after_delivered CHECK (read_at IS NULL OR read_at >= created_at)
);

-- Index for conversation history (most common query)
CREATE INDEX idx_messages_conversation_created ON messages (conversation_id, created_at DESC);

-- Index for sender lookup
CREATE INDEX idx_messages_sender ON messages (sender_id);

-- Index for unread message count
CREATE INDEX idx_messages_unread ON messages (conversation_id, status) WHERE status != 'read';

-- GIN index for full-text search
CREATE INDEX idx_messages_search_vector ON messages USING GIN (search_vector);

-- Trigger to automatically update search_vector
CREATE TRIGGER messages_search_vector_update
BEFORE INSERT OR UPDATE OF content ON messages
FOR EACH ROW EXECUTE FUNCTION
  tsvector_update_trigger(search_vector, 'pg_catalog.english', content);

-- Trigger to update conversation.updated_at when message is sent
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_timestamp
AFTER INSERT ON messages
FOR EACH ROW EXECUTE FUNCTION update_conversation_timestamp();
```

**Notes**:

- ON DELETE CASCADE ensures orphaned messages are cleaned up
- CHECK constraints enforce domain rules at database level
- Search_vector updated automatically via trigger (no application code needed)
- Partial index on unread messages optimizes unread count queries

---

## TypeORM Entities (Infrastructure Layer)

### MessageOrmEntity

```typescript
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ConversationOrmEntity } from './conversation.orm-entity';
import { UserOrmEntity } from '../../user/infrastructure/persistence/user.orm-entity';

@Entity({ name: 'messages' })
@Index(['conversationId', 'createdAt']) // Composite index for history queries
export class MessageOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'conversation_id', type: 'uuid' })
  conversationId: string;

  @Column({ name: 'sender_id', type: 'uuid' })
  senderId: string;

  @Column({ type: 'text', length: 5000 })
  content: string;

  @Column({ type: 'varchar', length: 20, default: 'sent' })
  status: string;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'NOW()' })
  createdAt: Date;

  @Column({ name: 'delivered_at', type: 'timestamp', nullable: true })
  deliveredAt: Date | null;

  @Column({ name: 'read_at', type: 'timestamp', nullable: true })
  readAt: Date | null;

  // Full-text search vector (managed by database trigger)
  @Column({ name: 'search_vector', type: 'tsvector', nullable: true })
  searchVector: string | null;

  // Relations (for joins when needed)
  @ManyToOne(() => ConversationOrmEntity)
  @JoinColumn({ name: 'conversation_id' })
  conversation: ConversationOrmEntity;

  @ManyToOne(() => UserOrmEntity)
  @JoinColumn({ name: 'sender_id' })
  sender: UserOrmEntity;
}
```

---

### ConversationOrmEntity

```typescript
import { Entity, Column, PrimaryGeneratedColumn, Index, OneToMany } from 'typeorm';
import { MessageOrmEntity } from './message.orm-entity';

@Entity({ name: 'conversations' })
@Index(['participant1Id', 'participant2Id'], { unique: true }) // Enforce uniqueness
@Index(['updatedAt']) // Index for recent conversations query
export class ConversationOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'participant1_id', type: 'uuid' })
  participant1Id: string;

  @Column({ name: 'participant2_id', type: 'uuid' })
  participant2Id: string;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'NOW()' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamp', default: () => 'NOW()' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => MessageOrmEntity, (message) => message.conversation)
  messages: MessageOrmEntity[];
}
```

---

## Repository Interfaces (Domain Layer Ports)

### IMessageRepository

```typescript
export interface IMessageRepository {
  save(message: Message): Promise<Message>;
  findById(id: string): Promise<Message | null>;
  findByConversation(conversationId: string, options: PaginationOptions): Promise<Message[]>;
  markAsDelivered(messageIds: string[]): Promise<void>;
  markAsRead(conversationId: string, userId: string): Promise<void>;
  countUnread(conversationId: string, userId: string): Promise<number>;
  search(userId: string, query: string, limit: number): Promise<Message[]>;
}
```

---

### IConversationRepository

```typescript
export interface IConversationRepository {
  save(conversation: Conversation): Promise<Conversation>;
  findById(id: string): Promise<Conversation | null>;
  findByParticipants(user1Id: string, user2Id: string): Promise<Conversation | null>;
  findByUser(userId: string, options: PaginationOptions): Promise<Conversation[]>;
  exists(user1Id: string, user2Id: string): Promise<boolean>;
}
```

---

## Data Transfer Objects (Application Layer)

### SendMessageDto

```typescript
import { IsUUID, IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({
    description: 'Conversation ID to send message in',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  conversationId: string;

  @ApiProperty({
    description: 'Message content (plain text)',
    example: 'Hello, how are you?',
    minLength: 1,
    maxLength: 5000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content: string;
}
```

---

### MessageResponseDto

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class MessageResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Expose()
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  @Expose()
  conversationId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174002' })
  @Expose()
  senderId: string;

  @ApiProperty({ example: 'Hello, how are you?' })
  @Expose()
  content: string;

  @ApiProperty({ enum: ['sent', 'delivered', 'read'], example: 'sent' })
  @Expose()
  status: string;

  @ApiProperty({ example: '2025-11-13T10:30:00Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ example: '2025-11-13T10:30:05Z', nullable: true })
  @Expose()
  deliveredAt: Date | null;

  @ApiProperty({ example: '2025-11-13T10:31:00Z', nullable: true })
  @Expose()
  readAt: Date | null;
}
```

---

### ConversationResponseDto

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class ConversationParticipantDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'john_doe' })
  @Expose()
  username: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', nullable: true })
  @Expose()
  avatarUrl: string | null;
}

export class LastMessageDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'Hello, how are you?' })
  @Expose()
  content: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174002' })
  @Expose()
  senderId: string;

  @ApiProperty({ example: '2025-11-13T10:30:00Z' })
  @Expose()
  createdAt: Date;
}

export class ConversationResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Expose()
  id: string;

  @ApiProperty({ type: [ConversationParticipantDto] })
  @Expose()
  @Type(() => ConversationParticipantDto)
  participants: ConversationParticipantDto[];

  @ApiProperty({ type: LastMessageDto, nullable: true })
  @Expose()
  @Type(() => LastMessageDto)
  lastMessage: LastMessageDto | null;

  @ApiProperty({ example: 5 })
  @Expose()
  unreadCount: number;

  @ApiProperty({ example: '2025-11-13T10:30:00Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ example: '2025-11-13T15:45:00Z' })
  @Expose()
  updatedAt: Date;
}
```

---

## Entity Relationships

```
┌─────────────────┐
│     users       │
│  (existing)     │
└────────┬────────┘
         │
         │ 1:N (sender)
         │
┌────────▼─────────────────────┐
│      conversations           │
│  - id                        │
│  - participant1_id  ─────┐   │
│  - participant2_id  ─────┤───┼──→ users (participants)
│  - created_at              │   │
│  - updated_at              │   │
└────────┬───────────────────┘   │
         │                       │
         │ 1:N                   │
         │                       │
┌────────▼───────────────────┐   │
│       messages             │   │
│  - id                      │   │
│  - conversation_id         │   │
│  - sender_id  ─────────────┘   │
│  - content                     │
│  - status                      │
│  - created_at                  │
│  - delivered_at                │
│  - read_at                     │
│  - search_vector               │
└────────────────────────────────┘
```

---

## Migration Script

```typescript
import { MigrationInterface, QueryRunner, Table, TableIndex, TableCheck } from 'typeorm';

export class CreateChatTables1731500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create conversations table
    await queryRunner.createTable(
      new Table({
        name: 'conversations',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'participant1_id', type: 'uuid', isNullable: false },
          { name: 'participant2_id', type: 'uuid', isNullable: false },
          { name: 'created_at', type: 'timestamp', default: 'NOW()' },
          { name: 'updated_at', type: 'timestamp', default: 'NOW()' },
        ],
        foreignKeys: [
          {
            columnNames: ['participant1_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['participant2_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
        checks: [
          new TableCheck({
            name: 'check_canonical_order',
            expression: 'participant1_id < participant2_id',
          }),
        ],
      }),
      true,
    );

    // Unique constraint for participant pair
    await queryRunner.createIndex(
      'conversations',
      new TableIndex({
        name: 'unique_participants',
        columnNames: ['participant1_id', 'participant2_id'],
        isUnique: true,
      }),
    );

    // Index for recent conversations
    await queryRunner.createIndex(
      'conversations',
      new TableIndex({
        name: 'idx_conversations_updated_at',
        columnNames: ['updated_at'],
      }),
    );

    // Create messages table
    await queryRunner.createTable(
      new Table({
        name: 'messages',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'conversation_id', type: 'uuid', isNullable: false },
          { name: 'sender_id', type: 'uuid', isNullable: false },
          { name: 'content', type: 'text', isNullable: false },
          { name: 'status', type: 'varchar', length: '20', default: "'sent'" },
          { name: 'created_at', type: 'timestamp', default: 'NOW()' },
          { name: 'delivered_at', type: 'timestamp', isNullable: true },
          { name: 'read_at', type: 'timestamp', isNullable: true },
          { name: 'search_vector', type: 'tsvector', isNullable: true },
        ],
        foreignKeys: [
          {
            columnNames: ['conversation_id'],
            referencedTableName: 'conversations',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['sender_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
        checks: [
          new TableCheck({
            name: 'check_content_length',
            expression: 'length(content) BETWEEN 1 AND 5000',
          }),
          new TableCheck({
            name: 'check_status_enum',
            expression: "status IN ('sent', 'delivered', 'read')",
          }),
        ],
      }),
      true,
    );

    // Composite index for conversation history
    await queryRunner.createIndex(
      'messages',
      new TableIndex({
        name: 'idx_messages_conversation_created',
        columnNames: ['conversation_id', 'created_at'],
      }),
    );

    // GIN index for full-text search
    await queryRunner.query(
      `CREATE INDEX idx_messages_search_vector ON messages USING GIN (search_vector)`,
    );

    // Trigger to update search_vector
    await queryRunner.query(`
      CREATE TRIGGER messages_search_vector_update
      BEFORE INSERT OR UPDATE OF content ON messages
      FOR EACH ROW EXECUTE FUNCTION
        tsvector_update_trigger(search_vector, 'pg_catalog.english', content)
    `);

    // Trigger to update conversation.updated_at
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_conversation_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        UPDATE conversations
        SET updated_at = NEW.created_at
        WHERE id = NEW.conversation_id;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER trigger_update_conversation_timestamp
      AFTER INSERT ON messages
      FOR EACH ROW EXECUTE FUNCTION update_conversation_timestamp();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('messages', true);
    await queryRunner.dropTable('conversations', true);
    await queryRunner.query('DROP FUNCTION IF EXISTS update_conversation_timestamp() CASCADE');
  }
}
```

---

## Validation Rules Summary

| Rule                           | Entity       | Enforcement                         |
| ------------------------------ | ------------ | ----------------------------------- |
| Content 1-5000 chars           | Message      | Domain entity + DB constraint       |
| Status enum validation         | Message      | Domain value object + DB constraint |
| Canonical participant ordering | Conversation | Domain factory + DB constraint      |
| No self-conversation           | Conversation | Domain entity + application logic   |
| Unique conversation per pair   | Conversation | DB unique constraint                |
| Timestamps in UTC              | Both         | Application enforced                |
| Immutable message content      | Message      | Domain entity (no setter)           |

---

## Next Steps

- ✅ Data model complete
- ⏭️ Generate API contracts (OpenAPI specs)
- ⏭️ Generate quickstart guide
- ⏭️ Update agent context
