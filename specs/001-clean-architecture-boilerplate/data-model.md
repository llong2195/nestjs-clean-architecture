# Data Model: NestJS Clean Architecture Boilerplate

**Feature**: 001-clean-architecture-boilerplate  
**Date**: 2025-11-11  
**Phase**: Phase 1 - Data Model Design

This document defines the database schema and domain entities for the boilerplate project.

---

## Overview

This boilerplate includes **sample entities** to demonstrate Clean Architecture patterns. These are NOT production entities but serve as reference implementations showing:

- Proper domain modeling
- TypeORM entity mapping
- Relationship handling
- Validation rules
- State transitions

**Naming Convention**:

- Database: `snake_case` (tables: `users`, columns: `user_name`, `created_at`)
- TypeScript: `camelCase` (properties: `userName`, `createdAt`)
- Mapping: `@Column({ name: 'snake_case_column' })`

---

## Core Entities

### 1. User (Sample Authentication Entity)

**Purpose**: Demonstrates authentication patterns, user management, and basic CRUD operations

**Domain Entity** (`src/modules/user/domain/entities/User.entity.ts`):

```typescript
export class User {
  id: string;
  email: Email; // Value object
  password: Password; // Value object (hashed)
  userName: string;
  role: UserRole; // enum: 'admin' | 'user' | 'moderator'
  provider: AuthProvider; // enum: 'local' | 'google'
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;

  // Factory method
  static create(email: string, password: string, name: string): User;

  // Business methods
  updateProfile(name: string): void;
  changePassword(oldPassword: string, newPassword: string): void;
  softDelete(): void;
}
```

**Database Table** (`users`):

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL, -- bcrypt hashed
  user_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user', -- admin|user|moderator
  provider VARCHAR(50) NOT NULL DEFAULT 'local', -- local|google
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP NULL, -- Soft delete

  CONSTRAINT users_email_unique UNIQUE (email)
);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_provider ON users (provider);
CREATE INDEX idx_users_deleted_at ON users (deleted_at) WHERE deleted_at IS NULL;
```

**TypeORM Entity** (`src/modules/user/infrastructure/persistence/user.orm-entity.ts`):

```typescript
@Entity({ name: "users" })
export class UserOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ name: "user_name" })
  userName: string;

  @Column({ type: "varchar", length: 50, default: "user" })
  role: string;

  @Column({ type: "varchar", length: 50, default: "local" })
  provider: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt?: Date;

  // Relationships
  @OneToMany(() => SessionOrmEntity, (session) => session.user)
  sessions: SessionOrmEntity[];

  @OneToMany(() => PostOrmEntity, (post) => post.author)
  posts: PostOrmEntity[];
}
```

**Validation Rules**:

- Email must be valid format (RFC 5322)
- Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number
- User name must be 3-255 characters
- Role must be one of: 'admin', 'user', 'moderator'
- Provider must be one of: 'local', 'google'

---

### 2. Session (Authentication Session Management)

**Purpose**: Demonstrates JWT token storage and refresh token rotation

**Domain Entity**:

```typescript
export class Session {
  id: string;
  userId: string;
  accessToken: string; // Hashed
  refreshToken: string; // Hashed
  providerType: string; // 'jwt' | 'google'
  expiresAt: Date;
  createdAt: Date;

  static create(
    userId: string,
    tokens: { access: string; refresh: string }
  ): Session;

  isExpired(): boolean;
  rotate(newTokens: { access: string; refresh: string }): void;
}
```

**Database Table** (`sessions`):

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL, -- bcrypt hashed
  refresh_token TEXT NOT NULL, -- bcrypt hashed
  provider_type VARCHAR(50) NOT NULL DEFAULT 'jwt',
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_user_id ON sessions (user_id);
CREATE INDEX idx_sessions_expires_at ON sessions (expires_at);
CREATE INDEX idx_sessions_refresh_token ON sessions USING hash (refresh_token); -- For lookup
```

**Validation Rules**:

- Tokens must be hashed before storage (bcrypt)
- Expires_at must be in the future
- Provider type must be 'jwt' or 'google'

---

### 3. Post (Sample Aggregate Root)

**Purpose**: Demonstrates DDD aggregate pattern with domain events

**Domain Entity**:

```typescript
export class Post extends AggregateRoot {
  id: string;
  authorId: string;
  title: string;
  content: string;
  slug: string;
  status: PostStatus; // 'draft' | 'published' | 'archived'
  publishedAt?: Date;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;

  // Aggregate root methods
  static create(authorId: string, title: string, content: string): Post;

  publish(): void; // Triggers PostPublishedEvent
  archive(): void; // Triggers PostArchivedEvent
  incrementViewCount(): void;
  updateContent(title: string, content: string): void;
}
```

**Database Table** (`posts`):

```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  slug VARCHAR(500) NOT NULL UNIQUE,
  status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft|published|archived
  published_at TIMESTAMP NULL,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_posts_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT posts_slug_unique UNIQUE (slug)
);

CREATE INDEX idx_posts_author_id ON posts (author_id);
CREATE INDEX idx_posts_status ON posts (status);
CREATE INDEX idx_posts_slug ON posts (slug);
CREATE INDEX idx_posts_published_at ON posts (published_at) WHERE published_at IS NOT NULL;
```

**Validation Rules**:

- Title must be 5-500 characters
- Content must be at least 10 characters
- Slug must be unique and URL-safe
- Status must be 'draft', 'published', or 'archived'
- Published_at must be set when status changes to 'published'

**State Transitions**:

```
draft → published (triggers PostPublishedEvent)
published → archived (triggers PostArchivedEvent)
archived → published (re-publish allowed)
```

---

### 4. Comment (Sample Entity within Post Aggregate)

**Purpose**: Demonstrates entity relationships within aggregates

**Domain Entity**:

```typescript
export class Comment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;

  static create(postId: string, authorId: string, content: string): Comment;

  updateContent(newContent: string): void;
}
```

**Database Table** (`comments`):

```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_comments_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_comments_post_id ON comments (post_id);
CREATE INDEX idx_comments_author_id ON comments (author_id);
CREATE INDEX idx_comments_created_at ON comments (created_at);
```

**Validation Rules**:

- Content must be 1-2000 characters
- Comment cannot be created on archived posts

---

### 5. Tag (Sample Entity for Many-to-Many Relationship)

**Purpose**: Demonstrates explicit junction tables (no @ManyToMany)

**Domain Entity**:

```typescript
export class Tag {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;

  static create(name: string): Tag;
}
```

**Database Table** (`tags`):

```sql
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT tags_name_unique UNIQUE (name),
  CONSTRAINT tags_slug_unique UNIQUE (slug)
);

CREATE INDEX idx_tags_slug ON tags (slug);
```

---

### 6. PostTag (Junction Table for Post-Tag Relationship)

**Purpose**: Explicit many-to-many relationship with metadata

**Domain Entity**:

```typescript
export class PostTag {
  id: string;
  postId: string;
  tagId: string;
  createdAt: Date;

  static create(postId: string, tagId: string): PostTag;
}
```

**Database Table** (`post_tags`):

```sql
CREATE TABLE post_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_post_tags_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_post_tags_tag FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
  CONSTRAINT post_tags_unique UNIQUE (post_id, tag_id) -- Prevent duplicate tagging
);

CREATE INDEX idx_post_tags_post_id ON post_tags (post_id);
CREATE INDEX idx_post_tags_tag_id ON post_tags (tag_id);
```

**Why Explicit Junction Table**:

- Allows adding `created_at` for audit
- Can add `order` field for tag sorting
- Can add `created_by` field for tracking who tagged
- More flexible for future requirements

---

### 7. Conversation (Sample WebSocket/Messaging Entity)

**Purpose**: Demonstrates real-time messaging patterns

**Domain Entity**:

```typescript
export class Conversation {
  id: string;
  title?: string;
  type: ConversationType; // 'direct' | 'group'
  createdAt: Date;
  updatedAt: Date;

  static createDirect(user1Id: string, user2Id: string): Conversation;
  static createGroup(title: string, creatorId: string): Conversation;
}
```

**Database Table** (`conversations`):

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NULL, -- Only for group chats
  type VARCHAR(50) NOT NULL DEFAULT 'direct', -- direct|group
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conversations_type ON conversations (type);
```

---

### 8. ConversationParticipant (Junction Table for User-Conversation)

**Purpose**: Explicit junction table for conversation membership

**Domain Entity**:

```typescript
export class ConversationParticipant {
  id: string;
  conversationId: string;
  userId: string;
  role: ParticipantRole; // 'owner' | 'admin' | 'member'
  joinedAt: Date;

  static create(
    conversationId: string,
    userId: string,
    role: string
  ): ConversationParticipant;
}
```

**Database Table** (`conversation_participants`):

```sql
CREATE TABLE conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'member', -- owner|admin|member
  joined_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_participants_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  CONSTRAINT fk_participants_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT participants_unique UNIQUE (conversation_id, user_id) -- User can't join twice
);

CREATE INDEX idx_participants_conversation_id ON conversation_participants (conversation_id);
CREATE INDEX idx_participants_user_id ON conversation_participants (user_id);
```

---

### 9. Message (Sample Entity for Real-time Messaging)

**Purpose**: Demonstrates WebSocket message persistence

**Domain Entity**:

```typescript
export class Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: MessageType; // 'text' | 'image' | 'file'
  sentAt: Date;

  static create(
    conversationId: string,
    senderId: string,
    content: string
  ): Message;
}
```

**Database Table** (`messages`):

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL, -- Allow null if user deleted
  content TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'text', -- text|image|file
  sent_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_messages_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_messages_conversation_id ON messages (conversation_id);
CREATE INDEX idx_messages_sender_id ON messages (sender_id);
CREATE INDEX idx_messages_sent_at ON messages (sent_at DESC); -- For pagination
```

---

## System Entities (Infrastructure)

### 10. DomainEventOutbox (Transactional Outbox Pattern)

**Purpose**: Ensures reliable event publishing with atomic guarantees

**Database Table** (`domain_event_outbox`):

```sql
CREATE TABLE domain_event_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregate_id UUID NOT NULL,
  aggregate_type VARCHAR(255) NOT NULL, -- 'Post', 'User', etc.
  event_type VARCHAR(255) NOT NULL, -- 'PostPublishedEvent', 'UserCreatedEvent'
  event_data JSONB NOT NULL, -- Serialized event payload
  occurred_at TIMESTAMP NOT NULL DEFAULT NOW(),
  published_at TIMESTAMP NULL, -- NULL = not yet published
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT NULL, -- Error message from last failed attempt

  -- Performance indexes
  CREATE INDEX idx_outbox_unpublished ON domain_event_outbox (occurred_at) WHERE published_at IS NULL;
  CREATE INDEX idx_outbox_aggregate ON domain_event_outbox (aggregate_id, aggregate_type);
);

-- Partial index for efficient polling
CREATE INDEX idx_outbox_unpublished ON domain_event_outbox (occurred_at)
WHERE published_at IS NULL;

-- Index for event sourcing queries
CREATE INDEX idx_outbox_aggregate ON domain_event_outbox (aggregate_id, aggregate_type);
```

**TypeORM Entity**:

```typescript
@Entity({ name: "domain_event_outbox" })
export class DomainEventOutboxOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "aggregate_id", type: "uuid" })
  aggregateId: string;

  @Column({ name: "aggregate_type" })
  aggregateType: string;

  @Column({ name: "event_type" })
  eventType: string;

  @Column({ name: "event_data", type: "jsonb" })
  eventData: Record<string, any>;

  @CreateDateColumn({ name: "occurred_at" })
  occurredAt: Date;

  @Column({ name: "published_at", type: "timestamp", nullable: true })
  publishedAt?: Date;

  @Column({ name: "retry_count", default: 0 })
  retryCount: number;

  @Column({ name: "last_error", type: "text", nullable: true })
  lastError?: string;
}
```

**Processing Logic**:

1. When aggregate state changes, save event to outbox in same transaction
2. Background worker (BullMQ) polls outbox every 5 seconds for unpublished events
3. Worker publishes to Kafka and marks `published_at`
4. If publish fails, increment `retry_count` and store error
5. Retry with exponential backoff (1s, 2s, 4s, 8s, 16s max)
6. Archive events older than 30 days

---

### 11. Notification (Sample Background Job Entity)

**Purpose**: Demonstrates BullMQ job processing

**Domain Entity**:

```typescript
export class Notification {
  id: string;
  userId: string;
  type: NotificationType; // 'email' | 'push' | 'websocket'
  title: string;
  message: string;
  status: NotificationStatus; // 'pending' | 'sent' | 'failed'
  sentAt?: Date;
  createdAt: Date;

  static create(
    userId: string,
    type: string,
    title: string,
    message: string
  ): Notification;

  markAsSent(): void;
  markAsFailed(error: string): void;
}
```

**Database Table** (`notifications`):

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- email|push|websocket
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending|sent|failed
  sent_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_user_id ON notifications (user_id);
CREATE INDEX idx_notifications_status ON notifications (status) WHERE status = 'pending';
CREATE INDEX idx_notifications_created_at ON notifications (created_at DESC);
```

---

### 12. FileMetadata (Sample File Storage Entity)

**Purpose**: Demonstrates file upload tracking

**Domain Entity**:

```typescript
export class FileMetadata {
  id: string;
  uploaderId: string;
  fileName: string;
  mimeType: string;
  size: number; // bytes
  storagePath: string; // S3 key or local path
  checksum: string; // SHA-256 hash
  createdAt: Date;

  static create(
    uploaderId: string,
    fileName: string,
    mimeType: string,
    size: number
  ): FileMetadata;
}
```

**Database Table** (`file_metadata`):

```sql
CREATE TABLE file_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name VARCHAR(500) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size BIGINT NOT NULL, -- File size in bytes
  storage_path VARCHAR(1000) NOT NULL, -- S3 key or local path
  checksum VARCHAR(64) NOT NULL, -- SHA-256 hash
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_file_uploader FOREIGN KEY (uploader_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_file_uploader_id ON file_metadata (uploader_id);
CREATE INDEX idx_file_checksum ON file_metadata (checksum); -- Deduplication
CREATE INDEX idx_file_created_at ON file_metadata (created_at DESC);
```

---

### 13. Configuration (Sample Dynamic Config Entity)

**Purpose**: Demonstrates runtime configuration management

**Database Table** (`configuration`):

```sql
CREATE TABLE configuration (
  key VARCHAR(255) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_configuration_key ON configuration (key);
```

**Example Usage**:

```sql
INSERT INTO configuration (key, value, description) VALUES
  ('feature_flags', '{"new_ui": true, "beta_features": false}', 'Feature toggle flags'),
  ('rate_limits', '{"api": 1000, "websocket": 100}', 'Rate limiting configuration'),
  ('maintenance_mode', '{"enabled": false, "message": ""}', 'Maintenance mode settings');
```

---

## Entity Relationship Diagram

```
┌──────────┐         ┌──────────┐
│  users   │────1:N──│ sessions │
└──────────┘         └──────────┘
     │
     │ 1:N
     ▼
┌──────────┐         ┌──────────┐         ┌──────────┐
│  posts   │────1:N──│ comments │         │   tags   │
└──────────┘         └──────────┘         └──────────┘
     │                                          │
     │ N:M via post_tags                        │
     └──────────────────────────────────────────┘
                       │
                       ▼
                 ┌──────────┐
                 │post_tags │ (Junction Table)
                 └──────────┘

┌──────────┐         ┌──────────────────────┐         ┌──────────┐
│  users   │────N:M──│conversation_         │────N:1──│conversations│
└──────────┘         │participants          │         └──────────┘
                     └──────────────────────┘              │
                                                           │ 1:N
                                                           ▼
                                                      ┌──────────┐
                                                      │ messages │
                                                      └──────────┘

System Entities (Infrastructure):
┌──────────────────────┐
│domain_event_outbox   │ (Transactional Outbox)
└──────────────────────┘

┌──────────────────────┐
│ notifications        │ (Background Jobs)
└──────────────────────┘

┌──────────────────────┐
│ file_metadata        │ (File Storage)
└──────────────────────┘

┌──────────────────────┐
│ configuration        │ (Runtime Config)
└──────────────────────┘
```

---

## Migration Strategy

### Initial Migration (001_create_core_tables.ts)

```typescript
export class CreateCoreTables1699900000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table
    await queryRunner.createTable(
      new Table({
        name: "users",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            default: "gen_random_uuid()",
          },
          { name: "email", type: "varchar", length: "255", isUnique: true },
          { name: "password", type: "varchar", length: "255" },
          { name: "user_name", type: "varchar", length: "255" },
          { name: "role", type: "varchar", length: "50", default: "'user'" },
          {
            name: "provider",
            type: "varchar",
            length: "50",
            default: "'local'",
          },
          { name: "created_at", type: "timestamp", default: "NOW()" },
          { name: "updated_at", type: "timestamp", default: "NOW()" },
          { name: "deleted_at", type: "timestamp", isNullable: true },
        ],
      })
    );

    // Create indexes
    await queryRunner.createIndex(
      "users",
      new TableIndex({
        name: "idx_users_email",
        columnNames: ["email"],
      })
    );

    // ... (create other tables)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("users");
    // ... (drop other tables)
  }
}
```

### Best Practices

- Use sequential numbering for migrations (001, 002, 003...)
- Include timestamp in migration name for ordering
- Always provide `up` and `down` methods
- Test migrations on staging before production
- Never modify existing migrations (create new ones instead)
- Use transactions for complex migrations

---

## Summary

This data model provides:

1. **Sample Entities**: User, Post, Comment, Tag (demonstrate core patterns)
2. **Relationship Examples**: 1:N, N:M with explicit junction tables
3. **Advanced Patterns**: Aggregate roots, domain events, transactional outbox
4. **Real-time Features**: Conversations, messages (WebSocket integration)
5. **Infrastructure**: Notifications (jobs), file metadata, configuration
6. **Best Practices**: snake_case DB, camelCase code, proper indexing, soft deletes

All entities follow Clean Architecture principles with domain models separated from ORM entities via mappers.
