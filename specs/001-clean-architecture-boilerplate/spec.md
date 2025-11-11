# Feature Specification: NestJS Clean Architecture Boilerplate

**Feature Branch**: `001-clean-architecture-boilerplate`  
**Created**: 2025-11-11  
**Status**: Ready for Planning  
**Input**: User description: "Build a backend boilerplate project that follows Clean Architecture principles using NestJS, TypeORM, PostgreSQL, Redis, and WebSocket, Socket.IO, Kafka, message queues (MQ), Queue (BullMQ)"

---

## Table of Contents

1. [User Scenarios & Testing](#user-scenarios--testing-mandatory)
   - User Stories (P1, P2, P3)
   - Edge Cases

2. [Requirements](#requirements-mandatory)
   - [Functional Requirements](#functional-requirements) (47 FRs organized by category)
   - [Key Entities](#key-entities) (Database schema with snake_case, junction tables)
   - [Assumptions](#assumptions) (Development guidelines and constraints)
   - [Project Structure](#project-structure) (Clean Architecture 4-layer structure)
   - [Git Commit Convention](#git-commit-convention) (Conventional Commits with commitlint)

3. [Success Criteria](#success-criteria-mandatory)
   - Measurable Outcomes (27 success criteria)
   - Non-Functional Requirements
   - Out of Scope
   - Performance & Quality Standards

4. [Technical Deep Dives](#technical-deep-dives)
   - [Transaction Management & Domain Events](#transaction-management--domain-events-critical) (Transactional Outbox Pattern)
   - [Authentication Without Passport](#authentication-without-passport-critical) (Pure NestJS JWT + Google OAuth)
   - [Swagger/OpenAPI Documentation](#swaggeropenapi-documentation-mandatory) (@nestjs/swagger integration)

---

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Project Foundation Setup (Priority: P1)

As a developer, I want a properly structured NestJS project with Clean Architecture layers so that I can build maintainable and testable features from day one.

**Why this priority**: Without a solid foundation following Clean Architecture principles, all subsequent development will lack structure and violate the project constitution. This is the most critical foundation.

**Independent Test**: Can be fully tested by creating a sample feature module (e.g., "health-check") with all four layers (domain, application, infrastructure, interface) and verifying dependency flow is correct (inner layers don't depend on outer layers).

**Acceptance Scenarios**:

1. **Given** an empty repository, **When** the boilerplate is initialized, **Then** the project structure contains clear separation of domain/, application/, infrastructure/, and interface/ folders
2. **Given** the boilerplate project, **When** a developer creates a new module, **Then** the module follows the four-layer structure with proper dependency inversion
3. **Given** the project configuration, **When** TypeScript compilation runs, **Then** strict mode is enforced and no circular dependencies exist
4. **Given** the boilerplate setup, **When** linting and formatting tools run, **Then** ESLint and Prettier enforce code quality standards automatically

---

### User Story 2 - Database & Persistence Layer (Priority: P1)

As a developer, I want a configured PostgreSQL database with TypeORM and migration support so that I can persist application data reliably and evolve the schema over time.

**Why this priority**: Database persistence is fundamental to most backend features. Without this, developers cannot build any data-driven functionality.

**Independent Test**: Can be fully tested by creating a sample entity with TypeORM, running migrations, and performing CRUD operations to verify data persists correctly across application restarts.

**Acceptance Scenarios**:

1. **Given** the boilerplate is running, **When** the application starts, **Then** it successfully connects to PostgreSQL database
2. **Given** a new entity is defined, **When** a migration is generated and run, **Then** the database schema updates correctly
3. **Given** repository interfaces in the domain layer, **When** TypeORM repositories are implemented in infrastructure, **Then** business logic can persist and retrieve data without knowing database details
4. **Given** multiple database operations, **When** transactions are needed, **Then** the system supports transactional boundaries correctly

---

### User Story 3 - Caching & Performance Layer (Priority: P1)

As a developer, I want a configured Redis caching layer so that I can optimize read-heavy operations and improve application performance.

**Why this priority**: Caching is essential for meeting the 1,000 req/s performance baseline defined in the constitution. Without it, the application cannot scale effectively.

**Independent Test**: Can be fully tested by caching a frequently accessed resource, measuring response times with and without cache, and verifying cache invalidation works correctly.

**Acceptance Scenarios**:

1. **Given** the boilerplate is running, **When** the application starts, **Then** it successfully connects to Redis
2. **Given** a cacheable resource, **When** it is accessed multiple times, **Then** subsequent requests are served from cache with significantly reduced latency
3. **Given** cached data, **When** the source data changes, **Then** the cache is invalidated appropriately
4. **Given** multiple application instances, **When** they share the same Redis instance, **Then** cache is consistent across all instances

---

### User Story 4 - Real-time Communication (Priority: P2)

As a developer, I want WebSocket support with Socket.IO configured so that I can build real-time features like notifications, chat, or live updates.

**Why this priority**: Real-time communication enables interactive features but isn't required for basic CRUD operations. It's important but can be added after core infrastructure.

**Independent Test**: Can be fully tested by establishing a WebSocket connection, emitting events from server to client, and verifying bidirectional communication works correctly.

**Acceptance Scenarios**:

1. **Given** a client application, **When** it connects to the WebSocket gateway, **Then** a persistent connection is established successfully
2. **Given** an established connection, **When** the server emits an event, **Then** the client receives it in real-time
3. **Given** multiple connected clients, **When** a broadcast event is sent, **Then** all clients receive the event
4. **Given** multiple application instances with Redis pub/sub, **When** an event is emitted from one instance, **Then** clients connected to other instances also receive it

---

### User Story 5 - Message Queue Integration (Priority: P2)

As a developer, I want Kafka and BullMQ configured for asynchronous job processing so that I can handle long-running tasks, background jobs, and event-driven workflows without blocking HTTP requests.

**Why this priority**: Message queues enable scalable asynchronous processing but aren't required for synchronous request-response patterns. Important for production-grade systems.

**Independent Test**: Can be fully tested by enqueueing a job, processing it asynchronously, and verifying completion status and results.

**Acceptance Scenarios**:

1. **Given** a long-running task, **When** it is submitted to the queue, **Then** the HTTP request returns immediately with a job ID
2. **Given** a queued job, **When** a worker picks it up, **Then** the job is processed in the background without blocking other requests
3. **Given** a failed job, **When** retry logic is configured, **Then** the job is retried according to the retry policy
4. **Given** multiple workers, **When** jobs are enqueued, **Then** they are distributed across workers for parallel processing
5. **Given** an event-driven workflow, **When** Kafka messages are published, **Then** consumers process them reliably with exactly-once or at-least-once semantics

---

### User Story 6 - API Standards & Documentation (Priority: P2)

As a developer, I want standardized API response formats, error handling, and OpenAPI documentation so that I can build consistent, well-documented APIs quickly.

**Why this priority**: API standards ensure consistency across all endpoints, but they build on top of the core infrastructure rather than being a prerequisite.

**Independent Test**: Can be fully tested by creating a sample endpoint, making requests with valid and invalid data, and verifying responses follow the standard format with proper error codes.

**Acceptance Scenarios**:

1. **Given** any API endpoint, **When** a successful request is made, **Then** the response follows the standard format: `{"status": "success", "data": {...}, "meta": {...}}`
2. **Given** any API endpoint, **When** an error occurs, **Then** the response includes structured error codes, HTTP status mapping, and no sensitive data leaks
3. **Given** the application is running, **When** developers access `/api/docs`, **Then** they see auto-generated OpenAPI/Swagger documentation
4. **Given** a DTO with validation rules, **When** invalid data is submitted, **Then** validation errors are returned in a consistent, user-friendly format

---

### User Story 7 - Testing Infrastructure (Priority: P3)

As a developer, I want preconfigured testing infrastructure with examples so that I can write unit, integration, and e2e tests efficiently and meet the >80% coverage target.

**Why this priority**: Testing infrastructure is essential for quality but can be set up incrementally as features are developed. Lower priority than functional infrastructure.

**Independent Test**: Can be fully tested by running the test suite and verifying all three test types (unit, integration, e2e) execute successfully with proper isolation.

**Acceptance Scenarios**:

1. **Given** the boilerplate project, **When** unit tests run, **Then** domain logic is tested in isolation with mocked dependencies
2. **Given** integration tests, **When** they execute, **Then** they test against real database and Redis instances (using containers or test instances)
3. **Given** e2e tests, **When** they run, **Then** they test complete HTTP/WebSocket flows with full application context
4. **Given** all tests, **When** the test suite completes, **Then** coverage reports show >80% coverage for domain and application layers

---

### User Story 8 - Developer Experience & Tooling (Priority: P3)

As a developer, I want pre-commit hooks, automated checks, and Docker configuration so that I can maintain code quality and run the application consistently across environments.

**Why this priority**: Developer tooling improves efficiency and prevents issues but isn't required to start building features. Lowest priority but still valuable.

**Independent Test**: Can be fully tested by attempting to commit code that violates quality standards and verifying the commit is blocked with helpful error messages.

**Acceptance Scenarios**:

1. **Given** a code change, **When** a developer attempts to commit, **Then** Husky runs linting, type checks, and formatting automatically
2. **Given** code that violates ESLint rules, **When** a commit is attempted, **Then** the commit is blocked with clear error messages
3. **Given** the docker-compose.yml file, **When** `docker-compose up` is run, **Then** PostgreSQL, Redis, and the application start successfully
4. **Given** a new developer joining the team, **When** they clone the repository and run setup commands, **Then** they can start developing within 15 minutes

---

### Edge Cases

- What happens when PostgreSQL connection is lost during operation? System should retry with exponential backoff and log errors appropriately
- What happens when Redis is unavailable? Application should degrade gracefully (cache misses) without complete failure
- What happens when Kafka broker is down? Messages should be buffered or queued with retry logic
- What happens when WebSocket connection drops? Clients should automatically reconnect with exponential backoff
- What happens when BullMQ worker crashes mid-job? Jobs should be marked as failed and retried according to policy
- What happens when database migrations fail? Migration should rollback and prevent application startup with clear error message
- What happens when circular dependencies are introduced? ESLint should detect and prevent them during development
- What happens when multiple instances try to run migrations simultaneously? Migration locking should prevent race conditions

## Requirements _(mandatory)_

### Functional Requirements

#### Core Architecture & Structure

- **FR-001**: Project MUST follow Clean Architecture with four distinct layers: domain (business logic), application (use cases), infrastructure (external dependencies), interface (entry points)
- **FR-002**: System MUST support dependency inversion where inner layers never depend on outer layers
- **FR-003**: System MUST use pnpm for package management
- **FR-004**: Shared modules (logger, config, database, cache, messaging, websocket, i18n, storage, notification) MUST be isolated and reusable
- **FR-005**: System MUST support Domain-Driven Design (DDD) patterns including aggregates, value objects, and domain events
- **FR-006**: System MUST implement domain event dispatching for cross-aggregate communication
- **FR-007**: System MUST provide base interfaces for aggregate roots and domain events

#### Database & Persistence

- **FR-008**: System MUST provide PostgreSQL database integration with TypeORM for data persistence
- **FR-009**: System MUST support database migrations for schema evolution
- **FR-010**: System MUST support transactional operations for data consistency
- **FR-011**: System MUST implement Transactional Outbox Pattern to guarantee atomic database writes and event publishing
- **FR-012**: Domain events MUST be saved to outbox table in the same database transaction as aggregate state changes
- **FR-013**: Background workers MUST poll outbox table and publish pending events to message bus (Kafka/BullMQ)
- **FR-014**: System MUST support event retry mechanism with exponential backoff for failed event publishing
- **FR-015**: Outbox table MUST include indexes for efficient polling and aggregate event history queries

#### Caching & Performance

- **FR-016**: System MUST provide Redis integration for caching and session management
- **FR-017**: System MUST implement rate limiting for public endpoints

#### Real-time & Message Queues

- **FR-018**: System MUST support WebSocket communication using Socket.IO for real-time features
- **FR-019**: System MUST support horizontal scaling for WebSockets using Redis pub/sub
- **FR-020**: System MUST provide Kafka integration for event-driven architectures
- **FR-021**: System MUST provide BullMQ integration for background job processing
- **FR-022**: System MUST provide Kafka consumer examples alongside producers for event-driven architecture

#### API Standards & Validation

- **FR-023**: System MUST enforce standardized API response format for all endpoints
- **FR-024**: System MUST provide global exception handling with structured error codes
- **FR-025**: System MUST generate OpenAPI/Swagger documentation automatically using @nestjs/swagger
- **FR-025.1**: All controllers MUST be decorated with @ApiTags for grouping endpoints
- **FR-025.2**: All endpoints MUST have @ApiOperation with summary and description
- **FR-025.3**: All request/response DTOs MUST use @ApiProperty decorators with examples
- **FR-025.4**: Swagger UI MUST be accessible at /api/docs endpoint in development and staging environments
- **FR-026**: System MUST validate all input data using class-validator decorators
- **FR-027**: System MUST sanitize all output data to prevent sensitive information leaks

#### Authentication & Security

- **FR-028**: System MUST support OAuth 2.0 authentication with Google provider integration
- **FR-029**: OAuth credentials (client ID and secret) MUST NOT be committed to version control and MUST be documented in .env.example (without actual values)
- **FR-030**: System MUST implement JWT authentication without Passport library using pure NestJS guards and decorators
- **FR-031**: Auth guards MUST validate JWT tokens, check expiration, and extract user payload from tokens
- **FR-032**: System MUST support Google OAuth 2.0 flow without Passport strategies using direct HTTP calls to Google APIs

#### Developer Experience & Tooling

- **FR-033**: System MUST support unit, integration, and e2e testing with proper isolation
- **FR-034**: System MUST enforce TypeScript strict mode and ESLint rules
- **FR-035**: System MUST prevent circular dependencies through automated detection
- **FR-036**: System MUST provide pre-commit hooks for code quality enforcement
- **FR-037**: System MUST include Docker configuration for development and production environments
- **FR-038**: System MUST support environment-based configuration (development, staging, production)
- **FR-039**: System MUST provide logging with correlation IDs for request tracing
- **FR-040**: Project MUST enforce Conventional Commits format using commitlint and husky pre-commit hooks
- **FR-041**: Git commits MUST follow semantic types (feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert)
- **FR-042**: Commit scopes MUST match module names (auth, user, chat, blog, database, cache, queue, etc.)

#### Feature Extensions

- **FR-043**: System MUST support internationalization (i18n) with multi-language support (English, Vietnamese, Japanese minimum)
- **FR-044**: System MUST provide notification abstraction supporting email, SMS, and push notifications via adapter pattern
- **FR-045**: System MUST provide file storage abstraction supporting local filesystem and cloud storage (S3)
- **FR-046**: System MUST automatically detect user language from Accept-Language header or query parameter
- **FR-047**: System MUST support file upload with validation (size, type, virus scanning hooks)

### Key Entities

**Note**: This is a boilerplate project focused on infrastructure and architecture patterns rather than specific business domain entities. The entities below represent example/sample entities to demonstrate the architecture.

**Database Naming Convention**: All database table names and column names MUST use snake_case (e.g., `user_name`, `created_at`, `post_id`). TypeORM entity property names use camelCase in code but map to snake_case columns using `@Column({ name: 'column_name' })`:

```typescript
@Column({ name: 'user_name' })
userName: string;
```

**Relationship Tables**: The project MUST NOT use TypeORM's @ManyToMany decorator. Instead, explicit junction/pivot tables MUST be created as separate entities to provide full control over relationships and additional metadata.

#### Core Entities

- **User** (Sample Entity): Demonstrates authentication and authorization patterns
  - Table: `users`
  - Columns: `id` (uuid), `email` (varchar, unique), `password` (varchar, hashed), `user_name` (varchar), `role` (varchar), `provider` (varchar: local|google), `created_at` (timestamp), `updated_at` (timestamp), `deleted_at` (timestamp, nullable)
  - Indexes: `idx_users_email`, `idx_users_provider`, `idx_users_deleted_at`

- **Session** (Sample Entity): Demonstrates authentication session management
  - Table: `sessions`
  - Columns: `id` (uuid), `user_id` (uuid, FK), `access_token` (text, hashed), `refresh_token` (text, hashed), `provider_type` (varchar), `expires_at` (timestamp), `created_at` (timestamp)
  - Indexes: `idx_sessions_user_id`, `idx_sessions_expires_at`
  - Foreign Keys: `user_id` → `users.id`
  - Note: Tokens MUST NOT be stored in plaintext

- **Post** (Sample Aggregate Root): Demonstrates DDD aggregate pattern
  - Table: `posts`
  - Columns: `id` (uuid), `author_id` (uuid, FK), `title` (varchar), `content` (text), `slug` (varchar, unique), `status` (varchar: draft|published|archived), `published_at` (timestamp, nullable), `view_count` (integer), `created_at` (timestamp), `updated_at` (timestamp)
  - Indexes: `idx_posts_author_id`, `idx_posts_slug`, `idx_posts_status_published_at`
  - Foreign Keys: `author_id` → `users.id`

- **Comment** (Child Entity of Post Aggregate): Blog post comments
  - Table: `comments`
  - Columns: `id` (uuid), `post_id` (uuid, FK), `author_id` (uuid, FK), `content` (text), `created_at` (timestamp)
  - Indexes: `idx_comments_post_id`, `idx_comments_author_id`
  - Foreign Keys: `post_id` → `posts.id`, `author_id` → `users.id`

- **Tag** (Child Entity of Post Aggregate): Post tagging system
  - Table: `tags`
  - Columns: `id` (uuid), `name` (varchar, unique), `slug` (varchar, unique), `created_at` (timestamp)
  - Indexes: `idx_tags_name`, `idx_tags_slug`

- **PostTag** (Junction Table): EXPLICIT many-to-many relationship between Posts and Tags
  - Table: `post_tags`
  - Columns: `id` (uuid), `post_id` (uuid, FK), `tag_id` (uuid, FK), `created_at` (timestamp)
  - Indexes: `idx_post_tags_post_id`, `idx_post_tags_tag_id`, `unique_post_tag` (composite unique on post_id, tag_id)
  - Foreign Keys: `post_id` → `posts.id`, `tag_id` → `tags.id`
  - Note: This replaces @ManyToMany decorator for better control

- **Conversation** (Sample Aggregate Root): Real-time chat aggregate
  - Table: `conversations`
  - Columns: `id` (uuid), `title` (varchar, nullable - only for group chats), `type` (varchar: direct|group), `created_at` (timestamp), `updated_at` (timestamp)
  - Indexes: `idx_conversations_type`

- **Message** (Child Entity of Conversation Aggregate): Chat messages
  - Table: `messages`
  - Columns: `id` (uuid), `conversation_id` (uuid, FK), `sender_id` (uuid, FK), `content` (text), `type` (varchar: text|image|file), `sent_at` (timestamp)
  - Indexes: `idx_messages_conversation_id`, `idx_messages_sender_id`, `idx_messages_sent_at`
  - Foreign Keys: `conversation_id` → `conversations.id`, `sender_id` → `users.id`

- **Participant** (Junction Table): EXPLICIT many-to-many between Users and Conversations
  - Table: `conversation_participants`
  - Columns: `id` (uuid), `conversation_id` (uuid, FK), `user_id` (uuid, FK), `role` (varchar: owner|admin|member), `joined_at` (timestamp)
  - Indexes: `idx_participants_conversation_id`, `idx_participants_user_id`, `unique_conversation_user` (composite unique on conversation_id, user_id)
  - Foreign Keys: `conversation_id` → `conversations.id`, `user_id` → `users.id`

#### System Entities

- **Notification** (System Entity): Notification system
  - Table: `notifications`
  - Columns: `id` (uuid), `user_id` (uuid, FK), `type` (varchar: email|push|websocket), `title` (varchar), `message` (text), `status` (varchar: pending|sent|failed), `sent_at` (timestamp, nullable), `created_at` (timestamp)
  - Indexes: `idx_notifications_user_id`, `idx_notifications_status`
  - Foreign Keys: `user_id` → `users.id`

- **FileMetadata** (System Entity): File storage metadata
  - Table: `file_metadata`
  - Columns: `id` (uuid), `uploader_id` (uuid, FK), `file_name` (varchar), `mime_type` (varchar), `size` (bigint - bytes), `storage_path` (varchar), `checksum` (varchar - SHA-256 hash), `created_at` (timestamp)
  - Indexes: `idx_file_uploader_id`, `idx_file_checksum`
  - Foreign Keys: `uploader_id` → `users.id`

- **DomainEventOutbox** (System Entity): Transactional outbox pattern
  - Table: `domain_event_outbox`
  - Columns: `id` (uuid), `aggregate_id` (uuid), `aggregate_type` (varchar), `event_type` (varchar), `event_data` (jsonb), `occurred_at` (timestamp), `published_at` (timestamp, nullable), `retry_count` (integer), `last_error` (text, nullable)
  - Indexes: `idx_outbox_unpublished` (partial index WHERE published_at IS NULL), `idx_outbox_aggregate` (on aggregate_id, aggregate_type)

- **Configuration** (System Entity): Runtime configuration management
  - Table: `configuration`
  - Columns: `key` (varchar, primary key), `value` (jsonb), `description` (text, nullable), `updated_at` (timestamp)
  - Indexes: `pk_configuration_key` (primary key on key)
  - Note: Sensitive secrets MUST NOT be stored here. Use environment variables or secret management systems (AWS Secrets Manager, HashiCorp Vault, etc.)

### Assumptions

- Development teams are familiar with TypeScript and JavaScript ES2020+ (including async/await, modules, destructuring)
- Docker is available in development environments for running PostgreSQL, Redis, and Kafka
- Node.js 22+ (LTS) is the target runtime environment
- **Database Naming Convention**: All PostgreSQL table and column names use snake_case (e.g., `user_name`, `created_at`, `post_id`)
- **TypeORM Mapping**: Entity properties in TypeScript use camelCase and map to snake_case columns via `@Column({ name: 'snake_case_name' })`
- **No @ManyToMany**: Junction/pivot tables MUST be explicit entities (e.g., `PostTag`, `ConversationParticipant`) to provide full control and metadata
- Teams follow **Conventional Commits** specification for semantic commit messages
- Git workflow uses **rebase** strategy (no merge commits in feature branches)
- **Husky** and **commitlint** are configured to enforce commit message format
- **CHANGELOG.md** is auto-generated using standard-version or semantic-release
- **Swagger Documentation**: @nestjs/swagger is configured and all endpoints documented with @ApiTags, @ApiOperation, @ApiProperty decorators
- Swagger UI is available at `/api/docs` in development and staging environments (disabled in production for security)
- Authentication mechanisms will be implemented as separate feature modules using this boilerplate
- Default caching strategy uses TTL-based expiration with manual invalidation hooks
- Database connection pooling is configured for production-grade concurrent connections
- WebSocket connections assume client libraries handle reconnection logic
- Message queue consumer logic will be implemented in feature-specific modules
- Standard HTTP status codes are used (200, 201, 400, 401, 403, 404, 500, etc.)
- Logging output is structured (JSON format) for aggregation tools
- Security headers (CORS, HELMET) are configured with sensible defaults
- TLS/SSL is handled at infrastructure level (reverse proxy/load balancer) in production
- API versioning (if needed) will be implemented in URL path or headers by features
- Domain events are processed synchronously within the same transaction by default
- Aggregate boundaries are kept small and focus on transactional consistency needs
- Cross-aggregate communication uses domain events, not direct references
- Default language is English; users can override via Accept-Language header or query param
- File uploads are stored in local filesystem by default; S3 adapter requires AWS credentials
- Notification adapters are interfaces only; actual SMTP/SMS/Push providers configured per environment
- OAuth requires Google client ID and secret configuration (environment variables)
- OAuth credentials (client ID and secret) MUST NOT be committed to version control and MUST be documented in .env.example (without actual values)
- Translation files support nested keys and pluralization rules
- File size limits enforced at application layer (configurable, default 10MB); file uploads MUST be rate limited and infrastructure-level size limits (e.g., reverse proxy/load balancer) are RECOMMENDED in addition to application-layer validation to prevent resource exhaustion and denial-of-service.
- JWT authentication is implemented without Passport library using pure NestJS guards and jsonwebtoken library
- Access tokens expire after 15 minutes; refresh tokens expire after 7 days (configurable)
- Token secrets are stored in environment variables and rotated regularly in production
- Google OAuth uses direct HTTP calls to Google APIs without Passport strategies
- User sessions can be revoked by removing from database or adding to Redis blacklist

### Project Structure

The boilerplate follows Clean Architecture principles with a clear four-layer separation for each module. Below is the complete structure with real-world feature examples (user, auth, chat, blog):

```
nestjs-clean-architecture/
├── src/
│   ├── modules/                          # Feature modules
│   │   │
│   │   ├── user/                         # User management module
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   ├── user.entity.ts            # Pure domain entity
│   │   │   │   │   └── user-profile.entity.ts
│   │   │   │   ├── value-objects/
│   │   │   │   │   ├── email.vo.ts               # Email value object
│   │   │   │   │   ├── password.vo.ts            # Password value object
│   │   │   │   │   └── user-role.vo.ts
│   │   │   │   ├── repositories/
│   │   │   │   │   └── user.repository.interface.ts  # Port
│   │   │   │   ├── services/
│   │   │   │   │   └── user-validation.service.ts
│   │   │   │   ├── events/                       # Domain events
│   │   │   │   │   ├── user-created.event.ts
│   │   │   │   │   ├── user-updated.event.ts
│   │   │   │   │   └── user-deleted.event.ts
│   │   │   │   └── exceptions/
│   │   │   │       ├── user-not-found.exception.ts
│   │   │   │       └── duplicate-email.exception.ts
│   │   │   ├── application/
│   │   │   │   ├── use-cases/
│   │   │   │   │   ├── create-user.use-case.ts
│   │   │   │   │   ├── update-user.use-case.ts
│   │   │   │   │   ├── get-user.use-case.ts
│   │   │   │   │   ├── delete-user.use-case.ts
│   │   │   │   │   └── list-users.use-case.ts
│   │   │   │   ├── event-handlers/               # Domain event handlers
│   │   │   │   │   ├── user-created.handler.ts
│   │   │   │   │   └── user-deleted.handler.ts
│   │   │   │   ├── dtos/
│   │   │   │   │   ├── create-user.dto.ts
│   │   │   │   │   ├── update-user.dto.ts
│   │   │   │   │   └── user-response.dto.ts
│   │   │   │   ├── ports/
│   │   │   │   │   ├── email-service.port.ts
│   │   │   │   │   └── notification-service.port.ts
│   │   │   │   └── mappers/
│   │   │   │       └── user.mapper.ts
│   │   │   ├── infrastructure/
│   │   │   │   ├── persistence/
│   │   │   │   │   ├── entities/
│   │   │   │   │   │   └── user.typeorm-entity.ts
│   │   │   │   │   └── repositories/
│   │   │   │   │       └── user.repository.ts
│   │   │   │   ├── adapters/
│   │   │   │   │   ├── email.adapter.ts
│   │   │   │   │   └── notification.adapter.ts    # Email/SMS notification
│   │   │   │   └── cache/
│   │   │   │       └── user-cache.service.ts
│   │   │   ├── interface/
│   │   │   │   └── http/
│   │   │   │       ├── controllers/
│   │   │   │       │   └── user.controller.ts
│   │   │   │       └── dtos/
│   │   │   │           ├── create-user-request.dto.ts
│   │   │   │           └── user-response.dto.ts
│   │   │   └── user.module.ts
│   │   │
│   │   ├── auth/                         # Authentication & authorization
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   ├── session.entity.ts
│   │   │   │   │   └── refresh-token.entity.ts
│   │   │   │   ├── value-objects/
│   │   │   │   │   ├── access-token.vo.ts
│   │   │   │   │   ├── token-payload.vo.ts
│   │   │   │   │   └── provider-type.vo.ts        # OAuth provider (local, google)
│   │   │   │   ├── repositories/
│   │   │   │   │   └── session.repository.interface.ts
│   │   │   │   ├── services/
│   │   │   │   │   ├── password-hash.service.ts
│   │   │   │   │   └── token-validator.service.ts
│   │   │   │   ├── events/                       # Domain events
│   │   │   │   │   ├── user-logged-in.event.ts
│   │   │   │   │   ├── user-logged-out.event.ts
│   │   │   │   │   ├── token-refreshed.event.ts
│   │   │   │   │   └── password-reset-requested.event.ts
│   │   │   │   └── exceptions/
│   │   │   │       ├── invalid-credentials.exception.ts
│   │   │   │       ├── invalid-token.exception.ts
│   │   │   │       └── token-expired.exception.ts
│   │   │   ├── application/
│   │   │   │   ├── use-cases/
│   │   │   │   │   ├── login.use-case.ts
│   │   │   │   │   ├── google-login.use-case.ts  # Google OAuth login
│   │   │   │   │   ├── logout.use-case.ts
│   │   │   │   │   ├── refresh-token.use-case.ts
│   │   │   │   │   ├── verify-token.use-case.ts
│   │   │   │   │   └── reset-password.use-case.ts
│   │   │   │   ├── event-handlers/               # Domain event handlers
│   │   │   │   │   ├── user-logged-in.handler.ts
│   │   │   │   │   └── token-refreshed.handler.ts
│   │   │   │   ├── dtos/
│   │   │   │   │   ├── login.dto.ts
│   │   │   │   │   ├── google-login.dto.ts
│   │   │   │   │   ├── refresh-token.dto.ts
│   │   │   │   │   ├── verified-user.dto.ts
│   │   │   │   │   ├── token-response.dto.ts
│   │   │   │   │   └── reset-password.dto.ts
│   │   │   │   ├── ports/
│   │   │   │   │   ├── jwt-service.port.ts
│   │   │   │   │   ├── hash-service.port.ts
│   │   │   │   │   └── oauth-provider.port.ts    # OAuth provider interface
│   │   │   │   └── guards/
│   │   │   │       └── auth.guard.ts             # Pure NestJS auth guard (no Passport)
│   │   │   ├── infrastructure/
│   │   │   │   ├── persistence/
│   │   │   │   │   ├── entities/
│   │   │   │   │   │   └── session.typeorm-entity.ts
│   │   │   │   │   └── repositories/
│   │   │   │   │       └── session.repository.ts
│   │   │   │   ├── adapters/
│   │   │   │   │   ├── jwt.adapter.ts
│   │   │   │   │   ├── bcrypt.adapter.ts
│   │   │   │   │   └── google-oauth.adapter.ts   # Google OAuth adapter
│   │   │   │   └── cache/
│   │   │   │       └── session-cache.service.ts
│   │   │   ├── interface/
│   │   │   │   └── http/
│   │   │   │       ├── controllers/
│   │   │   │       │   └── auth.controller.ts
│   │   │   │       └── dtos/
│   │   │   │           ├── login-request.dto.ts
│   │   │   │           ├── google-login-request.dto.ts
│   │   │   │           └── auth-response.dto.ts
│   │   │   └── auth.module.ts
│   │   │
│   │   ├── chat/                         # Real-time chat module
│   │   │   ├── domain/
│   │   │   │   ├── aggregates/                   # Conversation aggregate
│   │   │   │   │   └── conversation.aggregate.ts # Conversation aggregate root (manages messages + participants)
│   │   │   │   ├── entities/
│   │   │   │   │   ├── conversation.entity.ts    # Aggregate root entity
│   │   │   │   │   ├── message.entity.ts         # Child entity
│   │   │   │   │   └── participant.entity.ts     # Child entity
│   │   │   │   ├── value-objects/
│   │   │   │   │   ├── message-status.vo.ts
│   │   │   │   │   └── conversation-type.vo.ts
│   │   │   │   ├── repositories/
│   │   │   │   │   ├── conversation.repository.interface.ts  # Aggregate repository
│   │   │   │   │   └── message.repository.interface.ts
│   │   │   │   ├── services/
│   │   │   │   │   └── message-validator.service.ts
│   │   │   │   ├── events/                       # Domain events
│   │   │   │   │   ├── conversation-created.event.ts
│   │   │   │   │   ├── message-sent.event.ts
│   │   │   │   │   ├── message-read.event.ts
│   │   │   │   │   └── participant-joined.event.ts
│   │   │   │   └── exceptions/
│   │   │   │       ├── conversation-not-found.exception.ts
│   │   │   │       └── unauthorized-participant.exception.ts
│   │   │   ├── application/
│   │   │   │   ├── use-cases/
│   │   │   │   │   ├── create-conversation.use-case.ts
│   │   │   │   │   ├── send-message.use-case.ts
│   │   │   │   │   ├── get-conversation-history.use-case.ts
│   │   │   │   │   ├── mark-message-read.use-case.ts
│   │   │   │   │   └── delete-message.use-case.ts
│   │   │   │   ├── event-handlers/               # Domain event handlers
│   │   │   │   │   ├── message-sent.handler.ts
│   │   │   │   │   └── participant-joined.handler.ts
│   │   │   │   ├── dtos/
│   │   │   │   │   ├── create-conversation.dto.ts
│   │   │   │   │   ├── send-message.dto.ts
│   │   │   │   │   ├── message-response.dto.ts
│   │   │   │   │   └── conversation-response.dto.ts
│   │   │   │   ├── ports/
│   │   │   │   │   ├── notification-service.port.ts
│   │   │   │   │   └── presence-service.port.ts
│   │   │   │   └── mappers/
│   │   │   │       ├── message.mapper.ts
│   │   │   │       └── conversation.mapper.ts
│   │   │   ├── infrastructure/
│   │   │   │   ├── persistence/
│   │   │   │   │   ├── entities/
│   │   │   │   │   │   ├── conversation.typeorm-entity.ts
│   │   │   │   │   │   └── message.typeorm-entity.ts
│   │   │   │   │   └── repositories/
│   │   │   │   │       ├── conversation.repository.ts
│   │   │   │   │       └── message.repository.ts
│   │   │   │   ├── adapters/
│   │   │   │   │   └── push-notification.adapter.ts
│   │   │   │   ├── cache/
│   │   │   │   │   ├── conversation-cache.service.ts
│   │   │   │   │   └── online-users-cache.service.ts
│   │   │   │   └── messaging/
│   │   │   │       ├── chat-events.producer.ts     # Kafka producer
│   │   │   │       └── chat-events.consumer.ts     # Kafka consumer
│   │   │   ├── interface/
│   │   │   │   ├── http/
│   │   │   │   │   ├── controllers/
│   │   │   │   │   │   └── chat.controller.ts
│   │   │   │   │   └── dtos/
│   │   │   │   │       ├── create-conversation-request.dto.ts
│   │   │   │   │       └── send-message-request.dto.ts
│   │   │   │   └── websocket/
│   │   │   │       ├── gateways/
│   │   │   │       │   └── chat.gateway.ts          # Socket.IO gateway
│   │   │   │       └── dtos/
│   │   │   │           ├── message-event.dto.ts
│   │   │   │           └── typing-event.dto.ts
│   │   │   └── chat.module.ts
│   │   │
│   │   ├── blog/                         # Blog/content management
│   │   │   ├── domain/
│   │   │   │   ├── aggregates/                   # Blog aggregate
│   │   │   │   │   └── post.aggregate.ts         # Post aggregate root (manages post + comments + tags)
│   │   │   │   ├── entities/
│   │   │   │   │   ├── post.entity.ts            # Aggregate root entity
│   │   │   │   │   ├── category.entity.ts
│   │   │   │   │   ├── tag.entity.ts
│   │   │   │   │   └── comment.entity.ts         # Child entity within aggregate
│   │   │   │   ├── value-objects/
│   │   │   │   │   ├── post-status.vo.ts
│   │   │   │   │   ├── slug.vo.ts
│   │   │   │   │   └── content.vo.ts
│   │   │   │   ├── repositories/
│   │   │   │   │   ├── post.repository.interface.ts       # Aggregate repository
│   │   │   │   │   ├── category.repository.interface.ts
│   │   │   │   │   └── comment.repository.interface.ts
│   │   │   │   ├── services/
│   │   │   │   │   ├── slug-generator.service.ts
│   │   │   │   │   └── content-sanitizer.service.ts
│   │   │   │   ├── events/                       # Domain events
│   │   │   │   │   ├── post-created.event.ts
│   │   │   │   │   ├── post-published.event.ts
│   │   │   │   │   ├── comment-added.event.ts
│   │   │   │   │   └── post-viewed.event.ts
│   │   │   │   └── exceptions/
│   │   │   │       ├── post-not-found.exception.ts
│   │   │   │       └── duplicate-slug.exception.ts
│   │   │   ├── application/
│   │   │   │   ├── use-cases/
│   │   │   │   │   ├── create-post.use-case.ts
│   │   │   │   │   ├── publish-post.use-case.ts
│   │   │   │   │   ├── update-post.use-case.ts
│   │   │   │   │   ├── delete-post.use-case.ts
│   │   │   │   │   ├── get-post.use-case.ts
│   │   │   │   │   ├── list-posts.use-case.ts
│   │   │   │   │   ├── add-comment.use-case.ts
│   │   │   │   │   └── search-posts.use-case.ts
│   │   │   │   ├── event-handlers/               # Domain event handlers
│   │   │   │   │   ├── post-published.handler.ts
│   │   │   │   │   ├── post-viewed.handler.ts
│   │   │   │   │   └── comment-added.handler.ts
│   │   │   │   ├── dtos/
│   │   │   │   │   ├── create-post.dto.ts
│   │   │   │   │   ├── update-post.dto.ts
│   │   │   │   │   ├── post-response.dto.ts
│   │   │   │   │   ├── post-list-response.dto.ts
│   │   │   │   │   └── add-comment.dto.ts
│   │   │   │   ├── ports/
│   │   │   │   │   ├── search-service.port.ts
│   │   │   │   │   └── storage-service.port.ts
│   │   │   │   └── mappers/
│   │   │   │       ├── post.mapper.ts
│   │   │   │       └── comment.mapper.ts
│   │   │   ├── infrastructure/
│   │   │   │   ├── persistence/
│   │   │   │   │   ├── entities/
│   │   │   │   │   │   ├── post.typeorm-entity.ts
│   │   │   │   │   │   ├── category.typeorm-entity.ts
│   │   │   │   │   │   ├── tag.typeorm-entity.ts
│   │   │   │   │   │   └── comment.typeorm-entity.ts
│   │   │   │   │   └── repositories/
│   │   │   │   │       ├── post.repository.ts
│   │   │   │   │       ├── category.repository.ts
│   │   │   │   │       └── comment.repository.ts
│   │   │   │   ├── adapters/
│   │   │   │   │   ├── elasticsearch.adapter.ts    # Search service
│   │   │   │   │   └── s3-storage.adapter.ts       # File storage
│   │   │   │   ├── cache/
│   │   │   │   │   ├── post-cache.service.ts
│   │   │   │   │   └── category-cache.service.ts
│   │   │   │   └── messaging/
│   │   │   │       ├── post-published.producer.ts  # Kafka event
│   │   │   │       ├── post-published.consumer.ts  # Kafka consumer
│   │   │   │       └── post-view-counter.processor.ts  # BullMQ job
│   │   │   ├── interface/
│   │   │   │   ├── http/
│   │   │   │   │   ├── controllers/
│   │   │   │   │   │   ├── post.controller.ts
│   │   │   │   │   │   ├── category.controller.ts
│   │   │   │   │   │   └── comment.controller.ts
│   │   │   │   │   └── dtos/
│   │   │   │   │       ├── create-post-request.dto.ts
│   │   │   │   │       ├── update-post-request.dto.ts
│   │   │   │   │       └── add-comment-request.dto.ts
│   │   │   │   └── graphql/                        # Optional GraphQL
│   │   │   │       ├── resolvers/
│   │   │   │       │   └── post.resolver.ts
│   │   │   │       └── types/
│   │   │   │           └── post.type.ts
│   │   │   └── blog.module.ts
│   │   │
│   │   └── health/                       # Health check module
│   │       ├── application/
│   │       │   ├── use-cases/
│   │       │   │   └── check-health.use-case.ts
│   │       │   └── dtos/
│   │       │       └── health-response.dto.ts
│   │       ├── infrastructure/
│   │       │   └── adapters/
│   │       │       ├── database-health.adapter.ts
│   │       │       ├── redis-health.adapter.ts
│   │       │       └── kafka-health.adapter.ts
│   │       ├── interface/
│   │       │   └── http/
│   │       │       └── controllers/
│   │       │           └── health.controller.ts
│   │       └── health.module.ts
│   │
│   ├── shared/                           # Shared/common modules
│   │   ├── database/                     # Database module
│   │   │   ├── database.module.ts
│   │   │   ├── typeorm.config.ts
│   │   │   ├── database.providers.ts
│   │   │   ├── base-repository.abstract.ts
│   │   │   ├── domain-event-outbox.service.ts  # Transactional outbox service
│   │   │   └── entities/
│   │   │       └── domain-event-outbox.entity.ts
│   │   ├── cache/                        # Redis cache module
│   │   │   ├── cache.module.ts
│   │   │   ├── cache.service.ts
│   │   │   ├── cache.config.ts
│   │   │   └── cache-key.builder.ts
│   │   ├── config/                       # Configuration module
│   │   │   ├── config.module.ts
│   │   │   ├── config.service.ts
│   │   │   ├── env.validation.ts
│   │   │   └── schemas/
│   │   │       ├── app.config.ts
│   │   │       ├── database.config.ts
│   │   │       ├── redis.config.ts
│   │   │       └── jwt.config.ts
│   │   ├── logger/                       # Logging module
│   │   │   ├── logger.module.ts
│   │   │   ├── logger.service.ts
│   │   │   ├── logger.interceptor.ts
│   │   │   └── logger.config.ts
│   │   ├── messaging/                    # Message queue module
│   │   │   ├── kafka/
│   │   │   │   ├── kafka.module.ts
│   │   │   │   ├── kafka.service.ts
│   │   │   │   ├── kafka.config.ts
│   │   │   │   ├── kafka.producer.ts
│   │   │   │   └── kafka.consumer.ts
│   │   │   ├── bullmq/
│   │   │   │   ├── queue.module.ts
│   │   │   │   ├── queue.service.ts
│   │   │   │   ├── queue.config.ts
│   │   │   │   └── processors/
│   │   │   │       ├── email.processor.ts
│   │   │   │       └── notification.processor.ts
│   │   │   └── workers/
│   │   │       └── outbox-publisher.worker.ts  # Background worker for outbox pattern
│   │   ├── websocket/                    # WebSocket base module
│   │   │   ├── websocket.module.ts
│   │   │   ├── websocket.adapter.ts
│   │   │   └── redis-io.adapter.ts       # Redis adapter for Socket.IO
│   │   ├── i18n/                         # Internationalization module
│   │   │   ├── i18n.module.ts
│   │   │   ├── i18n.service.ts
│   │   │   ├── i18n.interceptor.ts       # Auto-detect language from headers
│   │   │   ├── translations/
│   │   │   │   ├── en/
│   │   │   │   │   ├── common.json
│   │   │   │   │   ├── errors.json
│   │   │   │   │   └── validations.json
│   │   │   │   ├── vi/
│   │   │   │   │   ├── common.json
│   │   │   │   │   ├── errors.json
│   │   │   │   │   └── validations.json
│   │   │   │   └── ja/
│   │   │   │       ├── common.json
│   │   │   │       ├── errors.json
│   │   │   │       └── validations.json
│   │   │   └── decorators/
│   │   │       └── translate.decorator.ts
│   │   ├── storage/                      # File storage module
│   │   │   ├── storage.module.ts
│   │   │   ├── storage.service.ts
│   │   │   ├── storage.config.ts
│   │   │   ├── adapters/
│   │   │   │   ├── local-storage.adapter.ts  # Local filesystem storage
│   │   │   │   └── s3-storage.adapter.ts     # AWS S3 storage (optional)
│   │   │   ├── interfaces/
│   │   │   │   └── storage-adapter.interface.ts
│   │   │   └── dto/
│   │   │       ├── upload-file.dto.ts
│   │   │       └── file-metadata.dto.ts
│   │   └── notification/                 # Notification module
│   │       ├── notification.module.ts
│   │       ├── notification.service.ts
│   │       ├── notification.config.ts
│   │       ├── adapters/
│   │       │   ├── email.adapter.ts      # Email notifications
│   │       │   ├── sms.adapter.ts        # SMS notifications
│   │       │   └── push.adapter.ts       # Push notifications
│   │       ├── interfaces/
│   │       │   └── notification-adapter.interface.ts
│   │       ├── templates/
│   │       │   ├── email/
│   │       │   │   ├── welcome.html
│   │       │   │   └── password-reset.html
│   │       │   └── sms/
│   │       │       └── verification-code.txt
│   │       └── dto/
│   │           ├── send-email.dto.ts
│   │           └── send-sms.dto.ts
│   │
│   ├── common/                           # Common utilities & cross-cutting
│   │   ├── decorators/
│   │   │   ├── api-response.decorator.ts
│   │   │   ├── current-user.decorator.ts
│   │   │   ├── roles.decorator.ts
│   │   │   ├── public.decorator.ts
│   │   │   ├── cache-key.decorator.ts
│   │   │   └── aggregate-root.decorator.ts       # Mark aggregate roots
│   │   ├── filters/
│   │   │   ├── http-exception.filter.ts
│   │   │   ├── all-exceptions.filter.ts
│   │   │   ├── validation.filter.ts
│   │   │   └── domain-exception.filter.ts
│   │   ├── guards/
│   │   │   ├── roles.guard.ts            # RBAC guard (can be used with AuthGuard)
│   │   │   ├── throttle.guard.ts
│   │   │   └── websocket-auth.guard.ts
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   ├── transform.interceptor.ts
│   │   │   ├── timeout.interceptor.ts
│   │   │   ├── correlation-id.interceptor.ts
│   │   │   └── cache.interceptor.ts
│   │   ├── pipes/
│   │   │   ├── validation.pipe.ts
│   │   │   ├── parse-int.pipe.ts
│   │   │   └── parse-uuid.pipe.ts
│   │   ├── middlewares/
│   │   │   ├── correlation-id.middleware.ts
│   │   │   ├── request-logger.middleware.ts
│   │   │   └── rate-limit.middleware.ts
│   │   ├── types/
│   │   │   ├── api-response.interface.ts
│   │   │   ├── pagination.interface.ts
│   │   │   ├── base-entity.interface.ts
│   │   │   ├── aggregate-root.interface.ts       # Base aggregate root interface
│   │   │   ├── domain-event.interface.ts         # Domain event base
│   │   │   └── repository.interface.ts
│   │   ├── dto/
│   │   │   ├── pagination.dto.ts
│   │   │   ├── pagination-query.dto.ts
│   │   │   ├── api-response.dto.ts
│   │   │   └── id-param.dto.ts
│   │   ├── exceptions/
│   │   │   ├── business.exception.ts
│   │   │   ├── not-found.exception.ts
│   │   │   ├── validation.exception.ts
│   │   │   ├── unauthorized.exception.ts
│   │   │   └── conflict.exception.ts
│   │   └── utils/
│   │       ├── hash.util.ts
│   │       ├── date.util.ts
│   │       ├── string.util.ts
│   │       ├── pagination.util.ts
│   │       └── event-dispatcher.util.ts          # Domain event dispatcher
│   │
│   ├── app.module.ts                     # Root application module
│   ├── app.controller.ts                 # Root controller (health endpoint)
│   ├── app.service.ts                    # Root service
│   └── main.ts                           # Application entry point
│
├── test/                                 # Test files
│   ├── unit/
│   │   ├── modules/
│   │   │   ├── user/
│   │   │   │   ├── domain/
│   │   │   │   │   ├── user.entity.spec.ts
│   │   │   │   │   └── email.vo.spec.ts
│   │   │   │   └── application/
│   │   │   │       └── create-user.use-case.spec.ts
│   │   │   ├── auth/
│   │   │   │   ├── domain/
│   │   │   │   │   └── password-hash.service.spec.ts
│   │   │   │   └── application/
│   │   │   │       └── login.use-case.spec.ts
│   │   │   ├── chat/
│   │   │   │   └── application/
│   │   │   │       └── send-message.use-case.spec.ts
│   │   │   └── blog/
│   │   │       └── application/
│   │   │           └── create-post.use-case.spec.ts
│   │   └── common/
│   │       └── utils/
│   │           └── hash.util.spec.ts
│   ├── integration/
│   │   └── modules/
│   │       ├── user/
│   │       │   └── infrastructure/
│   │       │       └── user.repository.spec.ts
│   │       ├── auth/
│   │       │   └── infrastructure/
│   │       │       └── session.repository.spec.ts
│   │       ├── chat/
│   │       │   └── infrastructure/
│   │       │       ├── message.repository.spec.ts
│   │       │       └── chat-events.producer.spec.ts
│   │       └── blog/
│   │           └── infrastructure/
│   │               └── post.repository.spec.ts
│   └── e2e/
│       ├── user.e2e-spec.ts
│       ├── auth.e2e-spec.ts
│       ├── chat.e2e-spec.ts
│       ├── blog.e2e-spec.ts
│       └── support/
│           ├── fixtures/
│           │   ├── user.fixture.ts
│           │   ├── post.fixture.ts
│           │   └── conversation.fixture.ts
│           └── test-utils.ts
│
├── database/                             # Centralized database management
│   ├── migrations/                       # All TypeORM migrations (centralized)
│   │   ├── 1731369600000-create-users-table.ts
│   │   ├── 1731373200000-create-sessions-table.ts
│   │   ├── 1731376800000-create-chat-tables.ts
│   │   ├── 1731380400000-create-blog-tables.ts
│   │   ├── 1731384000000-add-user-indexes.ts
│   │   └── 1731387600000-create-domain-events-outbox.ts  # Transactional outbox table
│   ├── seeds/                            # Database seeders for development/testing
│   │   ├── 001-user.seed.ts
│   │   ├── 002-category.seed.ts
│   │   ├── 003-tag.seed.ts
│   │   └── seed.config.ts                # Seed execution order
│   └── factories/                        # Data factories for testing
│       ├── user.factory.ts
│       ├── post.factory.ts
│       ├── message.factory.ts
│       └── conversation.factory.ts
│
├── docs/
│   ├── architecture/
│   │   ├── clean-architecture.md
│   │   ├── module-structure.md
│   │   ├── ddd-patterns.md
│   │   ├── transactional-outbox.md        # Transaction management guide
│   │   ├── authentication-without-passport.md  # Pure NestJS auth guide
│   │   └── diagrams/
│   ├── api/
│   │   ├── user-api.md
│   │   ├── auth-api.md
│   │   ├── chat-api.md
│   │   └── blog-api.md
│   ├── development/
│   │   ├── getting-started.md
│   │   ├── module-creation.md
│   │   ├── testing-guide.md
│   │   └── i18n-guide.md
│   └── guides/
│       ├── file-upload.md
│       ├── notifications.md
│       └── oauth-integration.md
│
├── scripts/
│   ├── setup.sh
│   ├── generate-module.sh
│   ├── migration.sh
│   └── seed-database.sh
│
├── config/
│   ├── default.yml
│   ├── development.yml
│   ├── staging.yml
│   ├── production.yml
│   └── i18n.config.ts                    # I18n configuration
│
├── .husky/
│   ├── pre-commit
│   ├── commit-msg
│   └── pre-push
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   ├── cd.yml
│   │   └── test.yml
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── ISSUE_TEMPLATE/
│
├── docker/
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   ├── docker-compose.yml
│   ├── docker-compose.dev.yml
│   ├── docker-compose.test.yml
│   └── nginx/
│       └── nginx.conf
│
├── .vscode/
│   ├── settings.json
│   ├── extensions.json
│   ├── launch.json
│   └── tasks.json
│
├── .eslintrc.js
├── .prettierrc
├── .prettierignore
├── tsconfig.json
├── tsconfig.build.json
├── nest-cli.json
├── jest.config.js
├── jest.e2e.config.js
├── commitlint.config.js                 # Commit message linting config
├── .husky/                               # Git hooks for commit validation
│   ├── pre-commit
│   └── commit-msg
├── docker-compose.yml
├── docker-compose.prod.yml
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── .gitignore
├── .env.example
├── .env.test
├── .editorconfig
├── uploads/                              # Local file uploads directory (gitignored)
├── README.md
├── CHANGELOG.md
├── CONTRIBUTING.md
└── LICENSE
```

**Key Structure Principles**:

1. **Clean Architecture Layers**: Each module (user, auth, chat, blog) strictly follows the 4-layer pattern:
   - **Domain**: Pure business logic, entities, value objects, **aggregates**, **domain events** (framework-agnostic)
   - **Application**: Use cases orchestrating domain logic, DTOs for data transfer, **domain event handlers**
   - **Infrastructure**: External dependencies (TypeORM, Redis, Kafka, file storage)
   - **Interface**: Entry points (HTTP controllers, WebSocket gateways, GraphQL resolvers)

2. **Real-World Examples**:
   - **User**: Traditional CRUD with email/password value objects, simple entity (no aggregate needed for basic operations); includes notification service port for email/SMS; domain events for user lifecycle (created, updated, deleted)
   - **Auth**: JWT tokens, sessions, refresh tokens with cache; **Google OAuth integration** for social login; **domain events for login/logout/token-refresh tracking**; **event handlers for audit logging**; implements custom JWT validation without Passport library
   - **Chat**: **Aggregate example** - `ConversationAggregate` manages conversation + messages + participants as a consistency boundary; real-time messaging with WebSocket gateway + Kafka events (producer/consumer); **event handlers for push notifications**
   - **Blog**: **Aggregate example** - `PostAggregate` manages post + comments + tags; **domain events for publishing and view counting**; **event handlers for search indexing and analytics**; includes search (Elasticsearch), file storage (S3/local), job queue (BullMQ), Kafka consumer for async processing

3. **DDD Patterns** (when needed):
   - **Aggregates**: Use `aggregates/` folder for complex entities that need transactional consistency (Chat, Blog examples)
   - **Domain Events**: Use `events/` folder in domain layer to capture important business events
   - **Event Handlers**: Use `event-handlers/` in application layer to react to domain events
   - **Aggregate Rules**:
     - Only modify aggregate through aggregate root
     - Load and save aggregates as atomic units
     - Keep aggregates small (don't span multiple bounded contexts)
     - Use domain events for cross-aggregate communication

4. **Cross-Cutting Concerns**:
   - Shared modules (database, cache, logger, messaging, websocket, **i18n**, **storage**, **notification**) are framework-aware but isolated
   - Common utilities (guards, filters, interceptors) handle cross-cutting concerns
   - **Migrations**: All database migrations are centralized in `database/migrations/` (NOT in module folders) to maintain a single source of truth and proper execution order.
     > **Note:** Centralizing migrations can conflict with modular Clean Architecture, as it introduces coupling and may hinder independent module development/deployment. To mitigate this, document migration ownership in each module's README, use clear naming conventions (e.g., prefix migration files with the module name), and establish a process for module authors to contribute migrations to the central folder. Consider using tooling/scripts to automate migration discovery and execution per module if future decoupling is required.
   - **I18n**: Language detection via headers/query params; translation keys in JSON files; decorator-based translation
   - **File Storage**: Abstracted via ports; supports local filesystem (default) and cloud storage (S3) via adapter pattern
   - **Notifications**: Multi-channel support (email/SMS/push) via adapter interfaces; templates for each channel
   - **Transactional Outbox**: Domain events saved atomically with aggregate state; background worker publishes to message bus

5. **Testing Organization**:
   - Unit tests: Domain entities, value objects, use cases (mocked dependencies)
   - Integration tests: Repositories, adapters (real database/Redis via containers)
   - E2E tests: Complete flows with fixtures per feature

6. **Technology Integration**:
   - **WebSocket**: Chat module demonstrates Socket.IO gateway with Redis adapter for horizontal scaling
   - **Kafka**: Chat and Blog modules show event producers AND consumers for async workflows and event-driven architecture
   - **BullMQ**: Blog module has view counter processor for background jobs; supports delayed jobs, retries, and priority queues
   - **GraphQL**: Optional blog resolver for flexible API queries (demonstrates alternative to REST)
   - **OAuth**: Google OAuth integration in auth module WITHOUT Passport (direct HTTP calls to Google APIs); extensible to other providers
   - **JWT**: Pure NestJS implementation using jsonwebtoken library directly (no Passport); custom guards and decorators
   - **I18n**: nestjs-i18n library integration with JSON translation files; supports nested keys and pluralization
   - **File Storage**: Multi-adapter pattern (local filesystem + S3) with unified interface; supports streaming for large files
   - **Notifications**: Email (SMTP), SMS (Twilio/SNS), Push (FCM) adapters with template support; adapter pattern for extensibility
   - **Transactional Outbox**: Domain events persisted atomically with aggregate state; background worker publishes to Kafka/BullMQ

7. **Naming Conventions** (Enforced):
   - Folders: `kebab-case` (e.g., `user-management/`)
   - Classes: `PascalCase` (e.g., `CreateUserUseCase`)
   - Files: Match class names in `kebab-case` (e.g., `create-user.use-case.ts`)
   - TypeORM entities: `*.typeorm-entity.ts` to distinguish from domain entities
   - Aggregates: `*.aggregate.ts` for aggregate root classes
   - Domain events: `*.event.ts` for domain event classes
   - Event handlers: `*.handler.ts` for event handler classes
   - Migrations: `{timestamp}-{description}.ts` format (e.g., `1731369600000-create-users-table.ts`)
   - Seeds: `{sequence}-{entity}.seed.ts` format (e.g., `001-user.seed.ts`)
   - Translation files: `{language}/{category}.json` format (e.g., `en/errors.json`)
   - Adapters: `{service}-{type}.adapter.ts` format (e.g., `google-oauth.adapter.ts`, `local-storage.adapter.ts`)

## Git Commit Convention

This project follows **Conventional Commits** specification to maintain a clean and semantic commit history.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Commit Types

| Type       | Description                                       | Example                                    |
| ---------- | ------------------------------------------------- | ------------------------------------------ |
| `feat`     | New feature or functionality                      | `feat(auth): add Google OAuth login`       |
| `fix`      | Bug fix                                           | `fix(user): resolve duplicate email issue` |
| `docs`     | Documentation changes only                        | `docs(readme): update installation steps`  |
| `style`    | Code style changes (formatting, semicolons, etc.) | `style(auth): fix code formatting`         |
| `refactor` | Code refactoring without feature/bug changes      | `refactor(chat): improve message mapper`   |
| `perf`     | Performance improvements                          | `perf(blog): add caching for posts`        |
| `test`     | Adding or updating tests                          | `test(user): add unit tests for service`   |
| `build`    | Build system or dependencies changes              | `build: upgrade NestJS to 11.x`            |
| `ci`       | CI/CD configuration changes                       | `ci: add GitHub Actions workflow`          |
| `chore`    | Other changes (maintenance, tooling)              | `chore: update ESLint config`              |
| `revert`   | Revert a previous commit                          | `revert: feat(auth): add Google OAuth`     |

### Scope Guidelines

Scopes should match module/feature names from the architecture:

- **Modules**: `auth`, `user`, `chat`, `blog`
- **Shared**: `database`, `cache`, `queue`, `i18n`, `storage`, `notification`
- **Infrastructure**: `docker`, `config`, `logger`, `common`
- **Project**: `spec`, `docs`, `ci`, `build`

### Subject Guidelines

- Use **imperative mood** ("add" not "added" or "adds")
- Keep it **short** (50 characters or less)
- **Lowercase** first letter
- **No period** at the end

### Body (Optional)

- Provide **context** and **reasoning** for the change
- Explain **what** and **why** (not how)
- Wrap at **72 characters** per line

### Footer (Optional)

- Reference **issue numbers**: `Closes #123`, `Fixes #456`, `Refs #789`
- Note **breaking changes**: `BREAKING CHANGE: description`

### Examples

#### Simple Feature

```bash
git commit -m "feat(auth): add JWT token refresh mechanism"
```

#### Bug Fix with Issue Reference

```bash
git commit -m "fix(chat): resolve message ordering in conversation

Messages were appearing in incorrect order due to missing
timestamp index on message entity.

Fixes #234"
```

#### Breaking Change

```bash
git commit -m "feat(api): migrate to v2 response format

BREAKING CHANGE: All API responses now use standardized envelope:
{
  data: T,
  meta: { timestamp, requestId },
  error: null
}

Migration guide: docs/migration-v2.md
Refs #567"
```

#### Refactoring

```bash
git commit -m "refactor(user): extract password hashing to domain service

Moved password hashing logic from use case to domain layer
to comply with Clean Architecture principles."
```

#### Performance Improvement

```bash
git commit -m "perf(blog): add Redis caching for post listings

Reduced database queries by 70% for frequently accessed posts.
Cache TTL: 5 minutes with invalidation on post updates.

Closes #345"
```

### Commit Rules

1. **One commit per logical change** - Don't mix feature + fix in same commit
2. **Atomic commits** - Each commit should be independently deployable
3. **Test before commit** - Ensure all tests pass
4. **No merge commits in feature branches** - Use rebase workflow
5. **Sign commits** (recommended) - `git commit -S`

### Branch Naming Convention

```
<type>/<ticket-number>-<short-description>
```

Examples:

```bash
feat/123-google-oauth-login
fix/456-duplicate-email-validation
refactor/789-extract-message-mapper
docs/update-readme
chore/upgrade-dependencies
```

### Pre-commit Hooks (Recommended)

The project uses **Husky** + **commitlint** to enforce commit message format:

```json
// .commitlintrc.json
{
  "extends": ["@commitlint/config-conventional"],
  "rules": {
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "docs", "style", "refactor", "perf", "test", "build", "ci", "chore", "revert"]
    ],
    "scope-enum": [
      2,
      "always",
      [
        "auth",
        "user",
        "chat",
        "blog",
        "database",
        "cache",
        "queue",
        "i18n",
        "storage",
        "notification",
        "docker",
        "config",
        "logger",
        "common",
        "spec",
        "docs",
        "ci",
        "build"
      ]
    ],
    "subject-case": [2, "never", ["upper-case"]],
    "subject-full-stop": [2, "never", "."],
    "subject-max-length": [2, "always", 50],
    "body-max-line-length": [2, "always", 72]
  }
}
```

### Changelog Generation

Commits following this convention enable automatic **CHANGELOG.md** generation using tools like `standard-version` or `semantic-release`:

```bash
# Generate changelog and bump version
pnpm run release

# Output: CHANGELOG.md updated with categorized changes
```

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Developers can create a new feature module following all four Clean Architecture layers within 30 minutes
- **SC-002**: System handles 1,000 concurrent HTTP requests per second without degradation
- **SC-003**: Database operations complete within 50ms at p95 latency for indexed queries
- **SC-004**: Cache hit rate exceeds 70% for frequently accessed resources after warmup period
- **SC-005**: API response time is under 200ms at p95 for non-computation-heavy endpoints
- **SC-006**: WebSocket connections maintain stable connections with < 1% disconnect rate under normal load
- **SC-007**: Test suite achieves >80% code coverage for domain and application layers
- **SC-008**: All tests (unit, integration, e2e) complete execution within 5 minutes
- **SC-009**: New developers can run the complete application locally within 15 minutes of cloning
- **SC-010**: Zero circular dependencies detected by automated tools
- **SC-011**: Pre-commit hooks execute within 10 seconds to maintain developer flow
- **SC-012**: Memory footprint remains under 1024MB per instance at idle state
- **SC-013**: 100% of API endpoints have OpenAPI documentation with examples
- **SC-014**: Background jobs process at least 100 jobs per minute per worker instance
- **SC-015**: System recovers automatically from transient infrastructure failures (database/Redis connection loss) within 30 seconds
- **SC-016**: Domain events are dispatched and handled within the same transaction boundary
- **SC-017**: Aggregate consistency is maintained across all operations (no partial updates)
- **SC-018**: File uploads complete within 30 seconds for files up to 10MB
- **SC-019**: Translation keys resolve correctly for all supported languages (en, vi, ja)
- **SC-020**: OAuth login flow completes within 5 seconds from callback to JWT token generation
- **SC-021**: Notification delivery (to adapter) completes within 2 seconds for all channels
- **SC-022**: Local file storage access time is under 50ms; S3 storage under 200ms
- **SC-023**: Outbox events are published to message bus within 10 seconds of being created (99th percentile)
- **SC-024**: Failed event publishing retries at least 3 times before moving to dead letter queue
- **SC-025**: JWT token verification completes within 10ms for cached user lookups
- **SC-026**: Login endpoint responds within 500ms including password hashing and token generation
- **SC-027**: Google OAuth callback processes within 3 seconds including API calls to Google

### Non-Functional Requirements

- **NFR-001**: System MUST start within 10 seconds in development mode
- **NFR-002**: System MUST gracefully shutdown within 5 seconds, completing in-flight requests
- **NFR-003**: System MUST support at least 100 concurrent WebSocket connections per instance
- **NFR-004**: System MUST maintain structured logs for at least 30 days (retention configurable)
- **NFR-005**: System MUST support zero-downtime deployments via health checks and graceful shutdown
- **NFR-006**: All uploaded files MUST be scanned for malware before storage (hook provided)
- **NFR-007**: Translation files MUST be loaded at startup and cached in memory
- **NFR-008**: OAuth tokens MUST be validated on every request requiring authentication
- **NFR-009**: File storage MUST support streaming for large files (>100MB)
- **NFR-010**: Notification templates MUST support variable interpolation and HTML rendering

### Out of Scope

This boilerplate intentionally excludes the following to maintain focus on architecture patterns:

- **Payment Processing**: No Stripe/PayPal integration; ports can be added following notification pattern
- **Advanced OAuth Providers**: Only Google OAuth implemented; Facebook/GitHub follow same pattern
- **Email Service Implementation**: SMTP adapter is interface only; requires nodemailer or SendGrid configuration
- **SMS Service Implementation**: SMS adapter is interface only; requires Twilio/AWS SNS configuration
- **Push Notification Implementation**: Push adapter is interface only; requires FCM/APNS configuration
- **Advanced File Processing**: Image resizing, video transcoding not included; can be added as BullMQ jobs
- **Multi-tenancy**: Single-tenant architecture; tenant isolation requires additional modules
- **Advanced Search**: Elasticsearch adapter shown but not fully implemented; requires cluster setup
- **Rate Limiting Per User**: Basic IP-based rate limiting only; user-based limits require custom implementation
- **Advanced Caching Strategies**: Only simple key-value caching; cache-aside pattern implemented
- **Distributed Tracing**: Correlation IDs provided but OpenTelemetry/Jaeger integration not included
- **Advanced Monitoring**: Health checks included but Prometheus metrics require additional setup

### Performance & Quality Standards (per Constitution)

- **Architecture**: Feature MUST follow Clean Architecture layering (domain/application/infrastructure/interface) with DDD patterns where applicable
- **Code Quality**: TypeScript strict mode, ESLint passing, no circular dependencies
- **Testing**: >80% coverage target for critical modules; unit/integration/e2e tests required
- **Performance**: Feature MUST meet 1,000 req/s baseline (if applicable to this feature type)
- **API Consistency**: Responses follow standard format; errors use structured codes
- **Security**: Input validation required; output sanitization via DTOs; no sensitive data exposure
- **DDD Compliance**: Aggregates properly encapsulate invariants; domain events used for cross-aggregate communication; value objects are immutable

---

## Technical Deep Dives

This section provides detailed implementation patterns for critical architectural decisions.

### Transaction Management & Domain Events _(critical)_

#### Problem Statement

When aggregates emit domain events during operations, we face a critical challenge: **How to ensure transactional consistency between database changes and event publishing?**

**The Problem**:

```typescript
// ❌ PROBLEM: What if DB commits but event publishing fails?
async publishPost(postId: string) {
  const post = await this.postRepository.findById(postId);
  post.publish(); // Emits PostPublishedEvent

  await this.postRepository.save(post);           // DB transaction commits
  await this.eventBus.publish(post.getDomainEvents()); // ❌ Network fails here!

  // Result: Post is published in DB but subscribers never notified!
  // Result: Inconsistent state - data saved but events lost
}
```

#### Solution: Transactional Outbox Pattern

The boilerplate implements the **Transactional Outbox Pattern** to guarantee atomic database writes and event publishing:

**Pattern Overview:**

```
┌─────────────────────────────────────────────────────────────┐
│ Use Case (Application Layer)                                │
│                                                              │
│  1. Load Aggregate                                           │
│  2. Execute Business Logic → Aggregate emits domain events   │
│  3. Save Aggregate + Events in SAME transaction              │
│     ├─ Save aggregate state to main table                    │
│     └─ Save domain events to outbox table (same TX)          │
│                                                              │
│  ✅ Transaction commits atomically or rolls back completely  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Background Worker (Infrastructure Layer)                     │
│                                                              │
│  1. Poll outbox table for unpublished events                │
│  2. Publish events to message bus (Kafka/BullMQ)            │
│  3. Mark events as published in outbox                       │
│  4. Retry failed events with exponential backoff             │
│                                                              │
│  ⚡ Eventually consistent: Events published within seconds   │
└─────────────────────────────────────────────────────────────┘
```

#### 2. Database Schema

```typescript
// database/migrations/1731387600000-create-domain-events-outbox.ts
import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class CreateDomainEventsOutbox1731387600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'domain_events_outbox',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v7()',
          },
          {
            name: 'aggregate_type',
            type: 'varchar',
            length: '255',
            comment: 'Type of aggregate (e.g., Post, Conversation)',
          },
          {
            name: 'aggregate_id',
            type: 'uuid',
            comment: 'ID of the aggregate that emitted the event',
          },
          {
            name: 'event_type',
            type: 'varchar',
            length: '255',
            comment: 'Type of domain event (e.g., PostPublishedEvent)',
          },
          {
            name: 'event_data',
            type: 'jsonb',
            comment: 'Serialized event payload',
          },
          {
            name: 'occurred_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            comment: 'When the event was emitted by aggregate',
          },
          {
            name: 'published_at',
            type: 'timestamp',
            isNullable: true,
            comment: 'When the event was published to message bus (NULL = pending)',
          },
          {
            name: 'retry_count',
            type: 'int',
            default: 0,
            comment: 'Number of publish attempts',
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
            comment: 'Last error message if publish failed',
          },
        ],
      }),
      true,
    );

    // Index for efficient polling of unpublished events
    await queryRunner.createIndex(
      'domain_events_outbox',
      new Index({
        name: 'idx_outbox_unpublished',
        columnNames: ['published_at', 'occurred_at'],
        where: 'published_at IS NULL',
      }),
    );

    // Index for aggregate event history queries
    await queryRunner.createIndex(
      'domain_events_outbox',
      new Index({
        name: 'idx_outbox_aggregate',
        columnNames: ['aggregate_type', 'aggregate_id', 'occurred_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('domain_events_outbox');
  }
}
```

#### 3. Implementation Example: Blog Post Publishing

**Step 1: Aggregate Emits Events (Domain Layer)**

```typescript
// src/modules/blog/domain/aggregates/post.aggregate.ts
import { AggregateRoot } from '@/common/types/aggregate-root.interface';
import { DomainEvent } from '@/common/types/domain-event.interface';
import { PostPublishedEvent } from '../events/post-published.event';
import { PostStatus } from '../value-objects/post-status.vo';

export class PostAggregate implements AggregateRoot {
  private domainEvents: DomainEvent[] = [];

  constructor(
    private readonly id: string,
    private title: string,
    private content: string,
    private status: PostStatus,
    private publishedAt?: Date,
  ) {}

  publish(): void {
    // Business rule validation
    if (this.status.value === 'published') {
      throw new Error('Post is already published');
    }

    // State change
    this.status = new PostStatus('published');
    this.publishedAt = new Date();

    // Emit domain event
    this.addDomainEvent(
      new PostPublishedEvent({
        postId: this.id,
        title: this.title,
        publishedAt: this.publishedAt,
      }),
    );
  }

  getDomainEvents(): DomainEvent[] {
    return [...this.domainEvents];
  }

  clearDomainEvents(): void {
    this.domainEvents = [];
  }

  private addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }
}
```

**Step 2: Use Case Saves Aggregate + Events in Single Transaction (Application Layer)**

```typescript
// src/modules/blog/application/use-cases/publish-post.use-case.ts
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PostRepository } from '../../domain/repositories/post.repository.interface';
import { DomainEventOutboxService } from '@/shared/database/domain-event-outbox.service';

@Injectable()
export class PublishPostUseCase {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly outboxService: DomainEventOutboxService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async execute(postId: string): Promise<void> {
    // Use TypeORM QueryRunner for transaction control
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Load aggregate
      const post = await this.postRepository.findById(postId, queryRunner);
      if (!post) {
        throw new Error('Post not found');
      }

      // 2. Execute business logic (aggregate emits events internally)
      post.publish();

      // 3. Save aggregate state (within transaction)
      await this.postRepository.save(post, queryRunner);

      // 4. Save domain events to outbox table (same transaction)
      const events = post.getDomainEvents();
      await this.outboxService.saveEvents(
        'Post', // aggregate type
        postId, // aggregate id
        events, // domain events
        queryRunner, // same transaction
      );

      // 5. Clear events from aggregate (prevent re-publishing)
      post.clearDomainEvents();

      // ✅ Commit transaction atomically
      await queryRunner.commitTransaction();

      // Both post state AND events are now persisted consistently!
    } catch (error) {
      // ❌ Rollback everything on error
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
```

**Step 3: Outbox Service (Infrastructure Layer)**

```typescript
// src/shared/database/domain-event-outbox.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryRunner } from 'typeorm';
import { DomainEventOutboxEntity } from './entities/domain-event-outbox.entity';
import { DomainEvent } from '@/common/types/domain-event.interface';

@Injectable()
export class DomainEventOutboxService {
  constructor(
    @InjectRepository(DomainEventOutboxEntity)
    private readonly outboxRepository: Repository<DomainEventOutboxEntity>,
  ) {}

  /**
   * Save domain events to outbox table within existing transaction
   */
  async saveEvents(
    aggregateType: string,
    aggregateId: string,
    events: DomainEvent[],
    queryRunner: QueryRunner,
  ): Promise<void> {
    const outboxEntries = events.map((event) => {
      return queryRunner.manager.create(DomainEventOutboxEntity, {
        aggregateType,
        aggregateId,
        eventType: event.constructor.name,
        eventData: event,
        occurredAt: new Date(),
        publishedAt: null, // NULL = not yet published
        retryCount: 0,
      });
    });

    await queryRunner.manager.save(DomainEventOutboxEntity, outboxEntries);
  }

  /**
   * Get unpublished events (for background worker)
   */
  async getUnpublishedEvents(limit = 100): Promise<DomainEventOutboxEntity[]> {
    return this.outboxRepository.find({
      where: { publishedAt: null },
      order: { occurredAt: 'ASC' },
      take: limit,
    });
  }

  /**
   * Mark event as published
   */
  async markAsPublished(eventId: string): Promise<void> {
    await this.outboxRepository.update(eventId, {
      publishedAt: new Date(),
    });
  }

  /**
   * Mark event as failed with error message
   */
  async markAsFailed(eventId: string, errorMessage: string): Promise<void> {
    await this.outboxRepository
      .createQueryBuilder()
      .update()
      .set({
        retryCount: () => 'retry_count + 1',
        errorMessage,
      })
      .where('id = :eventId', { eventId })
      .execute();
  }
}
```

**Step 4: Background Worker Publishes Events (Infrastructure Layer)**

```typescript
// src/shared/messaging/outbox-publisher.worker.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DomainEventOutboxService } from '@/shared/database/domain-event-outbox.service';
import { KafkaService } from '@/shared/messaging/kafka/kafka.service';

@Injectable()
export class OutboxPublisherWorker {
  private readonly logger = new Logger(OutboxPublisherWorker.name);

  constructor(
    private readonly outboxService: DomainEventOutboxService,
    private readonly kafkaService: KafkaService,
  ) {}

  /**
   * Poll outbox every 5 seconds and publish pending events
   */
  @Cron(CronExpression.EVERY_5_SECONDS)
  async publishPendingEvents(): Promise<void> {
    try {
      const events = await this.outboxService.getUnpublishedEvents(100);

      if (events.length === 0) {
        return; // No events to publish
      }

      this.logger.log(`Publishing ${events.length} pending events`);

      for (const event of events) {
        try {
          // Publish to Kafka
          await this.kafkaService.publish(
            event.eventType, // topic
            event.aggregateId, // key (for partitioning)
            event.eventData, // message
          );

          // Mark as published
          await this.outboxService.markAsPublished(event.id);

          this.logger.debug(`Published event ${event.id} (${event.eventType})`);
        } catch (error) {
          // Mark as failed (will retry in next poll)
          await this.outboxService.markAsFailed(event.id, error.message);

          this.logger.error(`Failed to publish event ${event.id}: ${error.message}`);

          // Continue processing other events (don't fail entire batch)
        }
      }
    } catch (error) {
      this.logger.error(`Outbox publisher error: ${error.message}`);
    }
  }
}
```

#### 4. Key Benefits

✅ **Atomicity**: Database changes and event storage commit together or rollback together  
✅ **Reliability**: Events are never lost (persisted durably before publishing)  
✅ **Retry Logic**: Failed publishes retry automatically via background worker  
✅ **Idempotency**: Consumers can handle duplicate events (use event ID for deduplication)  
✅ **Audit Trail**: Complete history of all domain events in outbox table  
✅ **Performance**: Non-blocking - use case returns immediately, publishing happens async

#### 5. Alternative: Synchronous Publishing (Not Recommended)

```typescript
// ❌ AVOID: Synchronous event publishing (breaks atomicity)
async publishPost(postId: string): Promise<void> {
  const post = await this.postRepository.findById(postId);
  post.publish();

  await this.postRepository.save(post);

  // ❌ Problem: If this fails, DB changes are already committed!
  await this.eventBus.publish(post.getDomainEvents());
}
```

**Why this is bad**:

- If event publishing fails, DB changes are permanent but events are lost
- No retry mechanism for failed publishes
- Can't rollback database changes after commit
- Creates inconsistent state

#### 6. Testing Strategy

```typescript
// test/integration/blog/publish-post.use-case.spec.ts
describe('PublishPostUseCase - Transaction Safety', () => {
  it('should rollback both post and events if transaction fails', async () => {
    // Arrange
    const post = await createDraftPost();

    // Simulate database error during save
    jest.spyOn(postRepository, 'save').mockRejectedValue(new Error('DB Error'));

    // Act & Assert
    await expect(publishPostUseCase.execute(post.id)).rejects.toThrow();

    // Verify: Post status NOT changed in DB
    const unchangedPost = await postRepository.findById(post.id);
    expect(unchangedPost.status).toBe('draft');

    // Verify: NO events in outbox
    const events = await outboxService.getUnpublishedEvents();
    expect(events).toHaveLength(0);
  });

  it('should save both post and events atomically on success', async () => {
    // Arrange
    const post = await createDraftPost();

    // Act
    await publishPostUseCase.execute(post.id);

    // Assert: Post status changed
    const publishedPost = await postRepository.findById(post.id);
    expect(publishedPost.status).toBe('published');

    // Assert: Event saved to outbox
    const events = await outboxService.getUnpublishedEvents();
    expect(events).toHaveLength(1);
    expect(events[0].eventType).toBe('PostPublishedEvent');
    expect(events[0].aggregateId).toBe(post.id);
  });
});
```

### Best Practices

1. **Always use QueryRunner for transactional operations**:

   ```typescript
   const queryRunner = this.dataSource.createQueryRunner();
   await queryRunner.startTransaction();
   // ... save aggregate + events
   await queryRunner.commitTransaction();
   ```

2. **Clear domain events after saving**:

   ```typescript
   await outboxService.saveEvents(events, queryRunner);
   aggregate.clearDomainEvents(); // Prevent duplicate saves
   ```

3. **Use polling interval based on latency requirements**:
   - Real-time: Poll every 1-5 seconds
   - Near real-time: Poll every 10-30 seconds
   - Batch processing: Poll every 1-5 minutes

4. **Implement retry limits**:

   ```typescript
   if (event.retryCount > MAX_RETRIES) {
     await moveToDeadLetterQueue(event);
   }
   ```

5. **Monitor outbox table growth**:
   - Archive old published events periodically
   - Alert on high retry counts
   - Track publishing lag metrics

### Related Requirements

- **FR-010**: System MUST support transactional operations for data consistency ✅
- **FR-020**: System MUST provide Kafka integration for event-driven architectures ✅
- **FR-006**: System MUST implement domain event dispatching for cross-aggregate communication ✅
- **SC-016**: Domain events are dispatched and handled within the same transaction boundary ✅

---

### Authentication Without Passport _(critical)_

#### Problem Statement

Most NestJS tutorials use Passport.js for authentication, but this adds unnecessary complexity and abstractions. This boilerplate implements **pure NestJS authentication** using native guards, decorators, and services.

**Why avoid Passport?**

- ❌ Extra dependency with its own abstractions (Strategy pattern)
- ❌ Less control over authentication flow
- ❌ More difficult to customize for domain-specific needs
- ❌ Harder to integrate with Clean Architecture ports/adapters
- ✅ **Our approach**: Direct control, cleaner code, better testability

#### Solution: Pure NestJS Authentication

**Architecture Overview:**

```
┌─────────────────────────────────────────────────────────────┐
│ HTTP Request with Authorization: Bearer <token>             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ AuthGuard (Application Layer)                               │
│  1. Extract token from Authorization header                 │
│  2. Call VerifyTokenUseCase                                  │
│  3. Attach user to request.user                              │
│  4. Allow/Deny access                                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ VerifyTokenUseCase (Application Layer)                      │
│  1. Call JWT service port to verify token                   │
│  2. Check token expiration                                   │
│  3. Load user from repository (optional caching)             │
│  4. Return user payload                                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ JwtAdapter (Infrastructure Layer)                            │
│  Uses jsonwebtoken library directly (not Passport)          │
│  Implements JWT signing, verification, token generation     │
└─────────────────────────────────────────────────────────────┘
```

#### 2. Implementation Example

**Step 1: JWT Service Port (Application Layer)**

```typescript
// src/modules/auth/application/ports/jwt-service.port.ts
export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  provider: 'local' | 'google';
}

export interface JwtServicePort {
  /**
   * Generate access token (short-lived: 15 minutes)
   */
  generateAccessToken(payload: JwtPayload): string;

  /**
   * Generate refresh token (long-lived: 7 days)
   */
  generateRefreshToken(payload: JwtPayload): string;

  /**
   * Verify and decode access token
   * @throws TokenExpiredException if token expired
   * @throws InvalidTokenException if token invalid
   */
  verifyAccessToken(token: string): JwtPayload;

  /**
   * Verify and decode refresh token
   */
  verifyRefreshToken(token: string): JwtPayload;

  /**
   * Decode token without verification (for debugging)
   */
  decodeToken(token: string): JwtPayload | null;
}
```

**Step 2: JWT Adapter Implementation (Infrastructure Layer)**

```typescript
// src/modules/auth/infrastructure/adapters/jwt.adapter.ts
import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { JwtServicePort, JwtPayload } from '../../application/ports/jwt-service.port';
import { TokenExpiredException } from '../../domain/exceptions/token-expired.exception';
import { InvalidTokenException } from '../../domain/exceptions/invalid-token.exception';

@Injectable()
export class JwtAdapter implements JwtServicePort {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExpiry: string = '15m';
  private readonly refreshTokenExpiry: string = '7d';

  constructor(private readonly configService: ConfigService) {
    this.accessTokenSecret = this.configService.get<string>('JWT_ACCESS_SECRET');
    this.refreshTokenSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
  }

  generateAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry,
      issuer: 'nestjs-clean-architecture',
      audience: 'api-access',
    });
  }

  generateRefreshToken(payload: JwtPayload): string {
    return jwt.sign(payload, this.refreshTokenSecret, {
      expiresIn: this.refreshTokenExpiry,
      issuer: 'nestjs-clean-architecture',
      audience: 'api-refresh',
    });
  }

  verifyAccessToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret, {
        issuer: 'nestjs-clean-architecture',
        audience: 'api-access',
      }) as JwtPayload;

      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new TokenExpiredException('Access token has expired');
      }
      throw new InvalidTokenException('Invalid access token');
    }
  }

  verifyRefreshToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret, {
        issuer: 'nestjs-clean-architecture',
        audience: 'api-refresh',
      }) as JwtPayload;

      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new TokenExpiredException('Refresh token has expired');
      }
      throw new InvalidTokenException('Invalid refresh token');
    }
  }

  decodeToken(token: string): JwtPayload | null {
    try {
      return jwt.decode(token) as JwtPayload;
    } catch {
      return null;
    }
  }
}
```

**Step 3: Verify Token Use Case (Application Layer)**

```typescript
// src/modules/auth/application/use-cases/verify-token.use-case.ts
import { Injectable } from '@nestjs/common';
import { JwtServicePort } from '../ports/jwt-service.port';
import { UserRepository } from '@/modules/user/domain/repositories/user.repository.interface';
import { CacheService } from '@/shared/cache/cache.service';

export interface VerifiedUser {
  userId: string;
  email: string;
  role: string;
  provider: 'local' | 'google';
}

@Injectable()
export class VerifyTokenUseCase {
  constructor(
    private readonly jwtService: JwtServicePort,
    private readonly userRepository: UserRepository,
    private readonly cacheService: CacheService,
  ) {}

  async execute(token: string): Promise<VerifiedUser> {
    // 1. Verify JWT token signature and expiration
    const payload = this.jwtService.verifyAccessToken(token);

    // 2. Check if user still exists (cached for performance)
    const cacheKey = `user:${payload.userId}`;
    let userExists = await this.cacheService.get<boolean>(cacheKey);

    if (userExists === null) {
      const user = await this.userRepository.findById(payload.userId);
      userExists = !!user;

      // Cache for 5 minutes
      await this.cacheService.set(cacheKey, userExists, 300);
    }

    if (!userExists) {
      throw new InvalidTokenException('User no longer exists');
    }

    // 3. Return verified user data
    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      provider: payload.provider,
    };
  }
}
```

**Step 4: Auth Guard (Application Layer)**

```typescript
// src/modules/auth/application/guards/auth.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { VerifyTokenUseCase } from '../use-cases/verify-token.use-case';
import { IS_PUBLIC_KEY } from '@/common/decorators/public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly verifyTokenUseCase: VerifyTokenUseCase,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    // Extract token from Authorization header
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      // Verify token and get user
      const user = await this.verifyTokenUseCase.execute(token);

      // Attach user to request for later use in controllers
      request.user = user;

      return true;
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return undefined;
    }

    const [type, token] = authHeader.split(' ');

    return type === 'Bearer' ? token : undefined;
  }
}
```

**Step 5: Login Use Case (Application Layer)**

```typescript
// src/modules/auth/application/use-cases/login.use-case.ts
import { Injectable } from '@nestjs/common';
import { UserRepository } from '@/modules/user/domain/repositories/user.repository.interface';
import { HashServicePort } from '../ports/hash-service.port';
import { JwtServicePort } from '../ports/jwt-service.port';
import { SessionRepository } from '../../domain/repositories/session.repository.interface';
import { Session } from '../../domain/entities/session.entity';
import { UserLoggedInEvent } from '../../domain/events/user-logged-in.event';
import { DomainEventOutboxService } from '@/shared/database/domain-event-outbox.service';
import { DataSource } from 'typeorm';

export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
}

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly hashService: HashServicePort,
    private readonly jwtService: JwtServicePort,
    private readonly sessionRepository: SessionRepository,
    private readonly outboxService: DomainEventOutboxService,
    private readonly dataSource: DataSource,
  ) {}

  async execute(dto: LoginDto): Promise<LoginResponse> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Find user by email
      const user = await this.userRepository.findByEmail(dto.email);

      if (!user) {
        throw new InvalidCredentialsException('Invalid email or password');
      }

      // 2. Verify password
      const isPasswordValid = await this.hashService.compare(dto.password, user.password);

      if (!isPasswordValid) {
        throw new InvalidCredentialsException('Invalid email or password');
      }

      // 3. Generate tokens
      const payload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        provider: 'local' as const,
      };

      const accessToken = this.jwtService.generateAccessToken(payload);
      const refreshToken = this.jwtService.generateRefreshToken(payload);

      // 4. Create session
      const session = new Session({
        userId: user.id,
        accessToken,
        refreshToken,
        providerType: 'local',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });

      await this.sessionRepository.save(session, queryRunner);

      // 5. Emit domain event
      const loginEvent = new UserLoggedInEvent({
        userId: user.id,
        email: user.email,
        provider: 'local',
        ipAddress: 'request.ip', // Pass from controller
        userAgent: 'request.userAgent', // Pass from controller
        loginAt: new Date(),
      });

      await this.outboxService.saveEvents('Session', session.id, [loginEvent], queryRunner);

      await queryRunner.commitTransaction();

      return {
        accessToken,
        refreshToken,
        expiresIn: 900, // 15 minutes in seconds
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
```

**Step 6: Google OAuth Implementation (Without Passport)**

```typescript
// src/modules/auth/infrastructure/adapters/google-oauth.adapter.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { OAuthProviderPort, OAuthUserInfo } from '../../application/ports/oauth-provider.port';

@Injectable()
export class GoogleOAuthAdapter implements OAuthProviderPort {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    this.clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    this.redirectUri = this.configService.get<string>('GOOGLE_REDIRECT_URI');
  }

  /**
   * Generate Google OAuth authorization URL
   */
  getAuthorizationUrl(): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async getAccessToken(code: string): Promise<string> {
    const response = await firstValueFrom(
      this.httpService.post('https://oauth2.googleapis.com/token', {
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        grant_type: 'authorization_code',
      }),
    );

    return response.data.access_token;
  }

  /**
   * Get user info from Google using access token
   */
  async getUserInfo(accessToken: string): Promise<OAuthUserInfo> {
    const response = await firstValueFrom(
      this.httpService.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }),
    );

    return {
      providerId: response.data.id,
      email: response.data.email,
      name: response.data.name,
      picture: response.data.picture,
      emailVerified: response.data.verified_email,
    };
  }
}
```

**Step 7: Controller Usage**

```typescript
// src/modules/auth/interface/http/controllers/auth.controller.ts
import { Controller, Post, Body, UseGuards, Get, Query, Req } from '@nestjs/common';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { GoogleLoginUseCase } from '../../application/use-cases/google-login.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';
import { AuthGuard } from '../../application/guards/auth.guard';
import { GoogleOAuthAdapter } from '../../infrastructure/adapters/google-oauth.adapter';
import { Public } from '@/common/decorators/public.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { LoginRequestDto } from '../../application/dtos/login.dto';
import { RefreshTokenRequestDto } from '../../application/dtos/refresh-token.dto';
import { VerifiedUser } from '../../application/dtos/verified-user.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly googleLoginUseCase: GoogleLoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly googleOAuthAdapter: GoogleOAuthAdapter,
  ) {}

  @Public()
  @Post('login')
  async login(@Body() dto: LoginRequestDto) {
    return this.loginUseCase.execute(dto);
  }

  @Public()
  @Get('google')
  async googleAuth() {
    // Return authorization URL for frontend to redirect
    const authUrl = this.googleOAuthAdapter.getAuthorizationUrl();
    return { authUrl };
  }

  @Public()
  @Get('google/callback')
  async googleCallback(@Query('code') code: string) {
    return this.googleLoginUseCase.execute({ code });
  }

  @Public()
  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenRequestDto) {
    return this.refreshTokenUseCase.execute(dto);
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  async getProfile(@CurrentUser() user: VerifiedUser) {
    // User is already verified and attached by AuthGuard
    return user;
  }

  @UseGuards(AuthGuard)
  @Post('logout')
  async logout(@CurrentUser() user: VerifiedUser) {
    // Implement logout logic
  }
}
```

**Step 8: Current User Decorator**

```typescript
// src/common/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user; // Set by AuthGuard
});
```

**Step 9: Public Decorator**

```typescript
// src/common/decorators/public.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

#### 3. Key Benefits

✅ **No Passport dependency** - Direct control over authentication flow  
✅ **Clean Architecture compliance** - Ports/adapters pattern maintained  
✅ **Better testability** - Easy to mock JWT service and use cases  
✅ **Type safety** - Full TypeScript support without Passport abstractions  
✅ **Flexibility** - Easy to add custom validation logic  
✅ **Performance** - No unnecessary middleware layers  
✅ **Domain events** - Login/logout tracked via event sourcing

#### 4. Testing Strategy

```typescript
// test/unit/auth/verify-token.use-case.spec.ts
describe('VerifyTokenUseCase', () => {
  let useCase: VerifyTokenUseCase;
  let jwtService: MockJwtService;
  let userRepository: MockUserRepository;

  beforeEach(() => {
    jwtService = new MockJwtService();
    userRepository = new MockUserRepository();
    useCase = new VerifyTokenUseCase(jwtService, userRepository);
  });

  it('should verify valid token and return user', async () => {
    // Arrange
    const token = 'valid.jwt.token';
    const payload = { userId: '123', email: 'test@example.com', role: 'user' };
    jwtService.verifyAccessToken.mockReturnValue(payload);
    userRepository.findById.mockResolvedValue({ id: '123' });

    // Act
    const result = await useCase.execute(token);

    // Assert
    expect(result.userId).toBe('123');
    expect(jwtService.verifyAccessToken).toHaveBeenCalledWith(token);
  });

  it('should throw error for expired token', async () => {
    // Arrange
    const token = 'expired.jwt.token';
    jwtService.verifyAccessToken.mockImplementation(() => {
      throw new TokenExpiredException('Token expired');
    });

    // Act & Assert
    await expect(useCase.execute(token)).rejects.toThrow(TokenExpiredException);
  });
});
```

### Package Dependencies

```json
{
  "dependencies": {
    "@nestjs/common": "^11.0.0",
    "@nestjs/core": "^11.0.0",
    "@nestjs/config": "^3.0.0",
    "@nestjs/axios": "^3.0.0",
    "jsonwebtoken": "^9.0.2",
    "bcrypt": "^5.1.1",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@types/jsonwebtoken": "^9.0.5",
    "@types/bcrypt": "^5.0.2",
    "@commitlint/cli": "^18.4.0",
    "@commitlint/config-conventional": "^18.4.0",
    "husky": "^9.1.7",
    "standard-version": "^9.5.0"
  }
}
```

**Note**: No `@nestjs/passport`, `passport`, `passport-jwt`, or `passport-google-oauth20` dependencies!

### Environment Variables

```env
# JWT Configuration
JWT_ACCESS_SECRET=your-super-secret-access-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production

# Google OAuth (if using)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

### Best Practices

1. **Always use HTTPS in production** for token transmission
2. **Store refresh tokens hashed** in database (like passwords)
3. **Implement token rotation** for refresh tokens
4. **Set appropriate token expiry times**:
   - Access token: 15 minutes
   - Refresh token: 7 days
5. **Implement rate limiting** on login endpoints
6. **Log all authentication attempts** via domain events
7. **Validate token issuer and audience** for security
8. **Cache user existence checks** to reduce DB queries
9. **Implement token blacklist** for logout (store in Redis)
10. **Use correlation IDs** for tracing auth requests

### Related Requirements

- **FR-030**: System MUST implement JWT authentication without Passport library ✅
- **FR-031**: Auth guards MUST validate JWT tokens and extract user payload ✅
- **FR-032**: System MUST support Google OAuth 2.0 without Passport strategies ✅
- **SC-020**: OAuth login flow completes within 5 seconds ✅

---

### Swagger/OpenAPI Documentation _(mandatory)_

#### Problem Statement

API documentation is critical for developer experience but often becomes outdated when maintained separately from code. This boilerplate uses **@nestjs/swagger** to auto-generate OpenAPI 3.0 documentation directly from decorators.

**Requirements**:

- ✅ Auto-generated from TypeScript code decorators
- ✅ Synchronized with actual implementation (single source of truth)
- ✅ Interactive Swagger UI for testing endpoints
- ✅ Type-safe request/response schemas
- ✅ Examples for all DTOs

#### Solution: @nestjs/swagger Integration

##### 1. Setup Swagger in main.ts

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('NestJS Clean Architecture API')
    .setDescription(
      'Production-ready boilerplate with Clean Architecture, PostgreSQL, Redis, WebSocket, Kafka',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT access token',
        in: 'header',
      },
      'JWT-auth', // This name must match @ApiBearerAuth() in controllers
    )
    .addServer('http://localhost:3000', 'Development')
    .addServer('https://staging.example.com', 'Staging')
    .addServer('https://api.example.com', 'Production')
    .addTag('Authentication', 'User authentication endpoints (register, login, OAuth)')
    .addTag('Users', 'User management CRUD operations')
    .addTag('Blog', 'Blog posts, comments, and tags')
    .addTag('Chat', 'Real-time chat conversations and messages')
    .addTag('Notifications', 'User notifications (email, SMS, push)')
    .addTag('Files', 'File upload and download operations')
    .addTag('Health', 'Health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Serve Swagger UI at /api/docs (development and staging only)
  if (process.env.NODE_ENV !== 'production') {
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true, // Keep auth token after page refresh
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
      customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
      customSiteTitle: 'NestJS Clean Architecture API Docs',
    });
  }

  await app.listen(3000);
  console.log(`🚀 Application running on: http://localhost:3000`);
  console.log(`📚 Swagger docs available at: http://localhost:3000/api/docs`);
}

bootstrap();
```

##### 2. Controller Example with Swagger Decorators

```typescript
// src/modules/user/interface/http/controllers/user.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';
import { CreateUserUseCase } from '../../../application/use-cases/create-user.use-case';
import { GetUserUseCase } from '../../../application/use-cases/get-user.use-case';
import { ListUsersUseCase } from '../../../application/use-cases/list-users.use-case';
import { UpdateUserUseCase } from '../../../application/use-cases/update-user.use-case';
import { DeleteUserUseCase } from '../../../application/use-cases/delete-user.use-case';
import { CreateUserRequestDto } from '../dtos/create-user-request.dto';
import { UpdateUserRequestDto } from '../dtos/update-user-request.dto';
import { UserResponseDto } from '../dtos/user-response.dto';
import { PaginatedUsersResponseDto } from '../dtos/paginated-users-response.dto';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/infrastructure/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';

@ApiTags('Users')
@Controller('users')
@ApiExtraModels(UserResponseDto, PaginatedUsersResponseDto)
export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly getUserUseCase: GetUserUseCase,
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create new user',
    description: 'Creates a new user account with email and password. Admin-only endpoint.',
  })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request body or validation error',
    schema: {
      example: {
        statusCode: 400,
        message: ['email must be a valid email', 'name should not be empty'],
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Email already exists',
    schema: {
      example: {
        statusCode: 409,
        message: 'Email already registered',
        error: 'Conflict',
      },
    },
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  async createUser(@Body() dto: CreateUserRequestDto): Promise<UserResponseDto> {
    return this.createUserUseCase.execute(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List all users (paginated)',
    description: 'Retrieve paginated list of users with optional filters',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: ['user', 'admin', 'moderator'],
    description: 'Filter by role',
  })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    type: PaginatedUsersResponseDto,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  async listUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('role') role?: string,
  ): Promise<PaginatedUsersResponseDto> {
    return this.listUsersUseCase.execute({ page, limit, role });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Retrieve single user details by UUID',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'User UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'User found',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'User not found',
        error: 'Not Found',
      },
    },
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  async getUser(@Param('id') id: string): Promise<UserResponseDto> {
    return this.getUserUseCase.execute(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update user',
    description:
      'Update user profile information. Users can update their own profile; admins can update any user.',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Cannot update other users',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserRequestDto,
  ): Promise<UserResponseDto> {
    return this.updateUserUseCase.execute(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete user',
    description: 'Soft delete user account. Admin-only endpoint.',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'User deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  async deleteUser(@Param('id') id: string): Promise<void> {
    return this.deleteUserUseCase.execute(id);
  }
}
```

##### 3. DTO Example with Swagger Decorators

```typescript
// src/modules/user/interface/http/dtos/create-user-request.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength, IsOptional, IsEnum } from 'class-validator';

export class CreateUserRequestDto {
  @ApiProperty({
    description: 'User email address (must be unique)',
    example: 'john.doe@example.com',
    format: 'email',
    uniqueItems: true,
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password (minimum 8 characters)',
    example: 'SecurePassword123!',
    minLength: 8,
    format: 'password',
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
    minLength: 1,
    maxLength: 255,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'User role',
    enum: ['user', 'admin', 'moderator'],
    default: 'user',
    required: false,
  })
  @IsOptional()
  @IsEnum(['user', 'admin', 'moderator'])
  role?: string = 'user';
}
```

```typescript
// src/modules/user/interface/http/dtos/user-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({
    description: 'User unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
    format: 'email',
  })
  email: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    description: 'User role',
    enum: ['user', 'admin', 'moderator'],
    example: 'user',
  })
  role: string;

  @ApiProperty({
    description: 'Authentication provider',
    enum: ['local', 'google'],
    example: 'local',
  })
  provider: string;

  @ApiProperty({
    description: 'Account creation timestamp',
    example: '2024-11-11T10:30:00.000Z',
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-11-11T15:45:00.000Z',
    format: 'date-time',
  })
  updatedAt: Date;
}
```

```typescript
// src/modules/user/interface/http/dtos/paginated-users-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from './user-response.dto';

class PaginationMetaDto {
  @ApiProperty({ example: 100, description: 'Total number of items' })
  total: number;

  @ApiProperty({ example: 1, description: 'Current page number' })
  page: number;

  @ApiProperty({ example: 10, description: 'Items per page' })
  limit: number;

  @ApiProperty({ example: 10, description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ example: true, description: 'Whether there is a next page' })
  hasNextPage: boolean;

  @ApiProperty({
    example: false,
    description: 'Whether there is a previous page',
  })
  hasPreviousPage: boolean;
}

export class PaginatedUsersResponseDto {
  @ApiProperty({
    description: 'Array of users',
    type: [UserResponseDto],
  })
  data: UserResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationMetaDto,
  })
  meta: PaginationMetaDto;
}
```

##### 4. Database Naming in Swagger Examples

All database-related examples in Swagger MUST use **snake_case** for column names:

```typescript
// Example: Showing database schema in API documentation
@ApiProperty({
  description: 'Database column names use snake_case',
  example: {
    id: '550e8400-e29b-41d4-a716-446655440000',
    user_name: 'john_doe',           // ✅ snake_case in DB
    email_address: 'john@example.com', // ✅ snake_case in DB
    created_at: '2024-11-11T10:30:00Z', // ✅ snake_case in DB
    updated_at: '2024-11-11T15:45:00Z', // ✅ snake_case in DB
  },
})
```

**Note**: While database columns use snake_case, TypeScript DTOs use camelCase. TypeORM handles the mapping automatically.

##### 5. Accessing Swagger UI

**Development**:

- URL: `http://localhost:3000/api/docs`
- Interactive testing enabled
- Authorization supported (click "Authorize" button, enter JWT token)

**Staging**:

- URL: `https://staging.example.com/api/docs`
- Protected by basic auth (optional)

**Production**:

- Swagger UI DISABLED for security
- OpenAPI JSON available at `/api/docs-json` for client SDK generation (protected by API key)

##### 6. Best Practices

1. **Always add @ApiTags** to controllers for grouping
2. **Use @ApiOperation** with summary and description for every endpoint
3. **Document all @ApiResponse** status codes (success + errors)
4. **Add @ApiProperty** to ALL DTO properties with examples
5. **Use @ApiBearerAuth** for protected endpoints
6. **Include @ApiParam** for path parameters
7. **Include @ApiQuery** for query parameters with examples
8. **Use @ApiExtraModels** for complex nested schemas
9. **Provide realistic examples** (not "string" or "test@test.com")
10. **Keep descriptions concise** but informative

##### 7. Generating Client SDKs

```bash
# Export OpenAPI JSON
curl http://localhost:3000/api/docs-json > openapi.json

# Generate TypeScript Axios client
npx @openapitools/openapi-generator-cli generate \
  -i openapi.json \
  -g typescript-axios \
  -o clients/typescript

# Generate Python client
npx @openapitools/openapi-generator-cli generate \
  -i openapi.json \
  -g python \
  -o clients/python

# Generate Java client
npx @openapitools/openapi-generator-cli generate \
  -i openapi.json \
  -g java \
  -o clients/java
```

### Related Requirements

- **FR-025**: System MUST generate OpenAPI/Swagger documentation automatically ✅
- **FR-025.1**: All controllers MUST be decorated with @ApiTags ✅
- **FR-025.2**: All endpoints MUST have @ApiOperation ✅
- **FR-025.3**: All DTOs MUST use @ApiProperty decorators ✅
- **FR-025.4**: Swagger UI MUST be at /api/docs in dev/staging ✅
- **SC-013**: 100% of API endpoints have OpenAPI documentation with examples ✅
