# Feature Specification: NestJS Clean Architecture Boilerplate

**Feature Branch**: `001-clean-architecture-boilerplate`  
**Created**: 2025-11-11  
**Status**: Ready for Planning  
**Input**: User description: "Build a backend boilerplate project that follows Clean Architecture principles using NestJS, TypeORM, PostgreSQL, Redis, and WebSocket, Socket.IO, Kafka, etc (MQ), Queue (BullMQ)"

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

- **FR-001**: Project MUST follow Clean Architecture with four distinct layers: domain (business logic), application (use cases), infrastructure (external dependencies), interface (entry points)
- **FR-002**: System MUST support dependency inversion where inner layers never depend on outer layers
- **FR-003**: System MUST provide PostgreSQL database integration with TypeORM for data persistence
- **FR-004**: System MUST support database migrations for schema evolution
- **FR-005**: System MUST provide Redis integration for caching and session management
- **FR-006**: System MUST support WebSocket communication using Socket.IO for real-time features
- **FR-007**: System MUST support horizontal scaling for WebSockets using Redis pub/sub
- **FR-008**: System MUST provide Kafka integration for event-driven architectures
- **FR-009**: System MUST provide BullMQ integration for background job processing
- **FR-010**: System MUST enforce standardized API response format for all endpoints
- **FR-011**: System MUST provide global exception handling with structured error codes
- **FR-012**: System MUST generate OpenAPI/Swagger documentation automatically
- **FR-013**: System MUST validate all input data using class-validator decorators
- **FR-014**: System MUST sanitize all output data to prevent sensitive information leaks
- **FR-015**: System MUST support unit, integration, and e2e testing with proper isolation
- **FR-016**: System MUST enforce TypeScript strict mode and ESLint rules
- **FR-017**: System MUST prevent circular dependencies through automated detection
- **FR-018**: System MUST provide pre-commit hooks for code quality enforcement
- **FR-019**: System MUST include Docker configuration for development and production environments
- **FR-020**: System MUST support environment-based configuration (development, staging, production)
- **FR-021**: System MUST provide logging with correlation IDs for request tracing
- **FR-022**: System MUST support transactional operations for data consistency
- **FR-023**: System MUST implement rate limiting for public endpoints
- **FR-024**: System MUST use pnpm for package management
- **FR-025**: Shared modules (logger, config, database, cache) MUST be isolated and reusable

### Key Entities

**Note**: This is a boilerplate project focused on infrastructure and architecture patterns rather than specific business domain entities. The entities below represent example/sample entities to demonstrate the architecture:

- **User** (Sample Entity): Demonstrates authentication and authorization patterns; attributes include unique identifier, authentication credentials (hashed), profile information, role/permissions
- **AuditLog** (Sample Entity): Demonstrates event sourcing and audit trail patterns; attributes include event type, actor, timestamp, changes, correlation ID
- **Configuration** (System Entity): Represents environment-specific settings; attributes include environment name, feature flags, connection strings, API keys (encrypted)

### Assumptions

- Development teams are familiar with TypeScript and modern JavaScript
- Docker is available in development environments for running PostgreSQL and Redis
- Node.js 22+ (LTS) is the target runtime environment
- Teams follow conventional commit standards and Git workflow practices
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
│   │   │   │   ├── dtos/
│   │   │   │   │   ├── create-user.dto.ts
│   │   │   │   │   ├── update-user.dto.ts
│   │   │   │   │   └── user-response.dto.ts
│   │   │   │   ├── ports/
│   │   │   │   │   └── email-service.port.ts
│   │   │   │   └── mappers/
│   │   │   │       └── user.mapper.ts
│   │   │   ├── infrastructure/
│   │   │   │   ├── persistence/
│   │   │   │   │   ├── entities/
│   │   │   │   │   │   └── user.typeorm-entity.ts
│   │   │   │   │   └── repositories/
│   │   │   │   │       └── user.repository.ts
│   │   │   │   ├── adapters/
│   │   │   │   │   └── email.adapter.ts
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
│   │   │   │   │   └── token-payload.vo.ts
│   │   │   │   ├── repositories/
│   │   │   │   │   └── session.repository.interface.ts
│   │   │   │   ├── services/
│   │   │   │   │   ├── password-hash.service.ts
│   │   │   │   │   └── token-validator.service.ts
│   │   │   │   └── exceptions/
│   │   │   │       ├── invalid-credentials.exception.ts
│   │   │   │       └── token-expired.exception.ts
│   │   │   ├── application/
│   │   │   │   ├── use-cases/
│   │   │   │   │   ├── login.use-case.ts
│   │   │   │   │   ├── logout.use-case.ts
│   │   │   │   │   ├── refresh-token.use-case.ts
│   │   │   │   │   ├── verify-token.use-case.ts
│   │   │   │   │   └── reset-password.use-case.ts
│   │   │   │   ├── dtos/
│   │   │   │   │   ├── login.dto.ts
│   │   │   │   │   ├── token-response.dto.ts
│   │   │   │   │   └── reset-password.dto.ts
│   │   │   │   ├── ports/
│   │   │   │   │   ├── jwt-service.port.ts
│   │   │   │   │   └── hash-service.port.ts
│   │   │   │   └── strategies/
│   │   │   │       └── jwt.strategy.ts
│   │   │   ├── infrastructure/
│   │   │   │   ├── persistence/
│   │   │   │   │   ├── entities/
│   │   │   │   │   │   └── session.typeorm-entity.ts
│   │   │   │   │   └── repositories/
│   │   │   │   │       └── session.repository.ts
│   │   │   │   ├── adapters/
│   │   │   │   │   ├── jwt.adapter.ts
│   │   │   │   │   └── bcrypt.adapter.ts
│   │   │   │   └── cache/
│   │   │   │       └── session-cache.service.ts
│   │   │   ├── interface/
│   │   │   │   └── http/
│   │   │   │       ├── controllers/
│   │   │   │       │   └── auth.controller.ts
│   │   │   │       └── dtos/
│   │   │   │           ├── login-request.dto.ts
│   │   │   │           └── auth-response.dto.ts
│   │   │   └── auth.module.ts
│   │   │
│   │   ├── chat/                         # Real-time chat module
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   ├── conversation.entity.ts
│   │   │   │   │   ├── message.entity.ts
│   │   │   │   │   └── participant.entity.ts
│   │   │   │   ├── value-objects/
│   │   │   │   │   ├── message-status.vo.ts
│   │   │   │   │   └── conversation-type.vo.ts
│   │   │   │   ├── repositories/
│   │   │   │   │   ├── conversation.repository.interface.ts
│   │   │   │   │   └── message.repository.interface.ts
│   │   │   │   ├── services/
│   │   │   │   │   └── message-validator.service.ts
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
│   │   │   │       └── chat-events.producer.ts     # Kafka producer
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
│   │   │   │   ├── entities/
│   │   │   │   │   ├── post.entity.ts
│   │   │   │   │   ├── category.entity.ts
│   │   │   │   │   ├── tag.entity.ts
│   │   │   │   │   └── comment.entity.ts
│   │   │   │   ├── value-objects/
│   │   │   │   │   ├── post-status.vo.ts
│   │   │   │   │   ├── slug.vo.ts
│   │   │   │   │   └── content.vo.ts
│   │   │   │   ├── repositories/
│   │   │   │   │   ├── post.repository.interface.ts
│   │   │   │   │   ├── category.repository.interface.ts
│   │   │   │   │   └── comment.repository.interface.ts
│   │   │   │   ├── services/
│   │   │   │   │   ├── slug-generator.service.ts
│   │   │   │   │   └── content-sanitizer.service.ts
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
│   │       ├── domain/
│   │       │   └── services/
│   │       │       └── health-checker.service.ts
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
│   │   │   └── base-repository.abstract.ts
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
│   │   │   └── bullmq/
│   │   │       ├── queue.module.ts
│   │   │       ├── queue.service.ts
│   │   │       ├── queue.config.ts
│   │   │       └── processors/
│   │   │           ├── email.processor.ts
│   │   │           └── notification.processor.ts
│   │   └── websocket/                    # WebSocket base module
│   │       ├── websocket.module.ts
│   │       ├── websocket.adapter.ts
│   │       └── redis-io.adapter.ts       # Redis adapter for Socket.IO
│   │
│   ├── common/                           # Common utilities & cross-cutting
│   │   ├── decorators/
│   │   │   ├── api-response.decorator.ts
│   │   │   ├── current-user.decorator.ts
│   │   │   ├── roles.decorator.ts
│   │   │   ├── public.decorator.ts
│   │   │   └── cache-key.decorator.ts
│   │   ├── filters/
│   │   │   ├── http-exception.filter.ts
│   │   │   ├── all-exceptions.filter.ts
│   │   │   ├── validation.filter.ts
│   │   │   └── domain-exception.filter.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── roles.guard.ts
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
│   │       └── pagination.util.ts
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
│   │   ├── 1699000001000-create-users-table.ts
│   │   ├── 1699000002000-create-sessions-table.ts
│   │   ├── 1699000003000-create-chat-tables.ts
│   │   ├── 1699000004000-create-blog-tables.ts
│   │   └── 1699000005000-add-user-indexes.ts
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
│   │   └── diagrams/
│   ├── api/
│   │   ├── user-api.md
│   │   ├── auth-api.md
│   │   ├── chat-api.md
│   │   └── blog-api.md
│   └── development/
│       ├── getting-started.md
│       ├── module-creation.md
│       └── testing-guide.md
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
│   └── production.yml
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
├── docker-compose.yml
├── docker-compose.prod.yml
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── .gitignore
├── .env.example
├── .env.test
├── .editorconfig
├── README.md
├── CHANGELOG.md
├── CONTRIBUTING.md
└── LICENSE
```

**Key Structure Principles**:

1. **Clean Architecture Layers**: Each module (user, auth, chat, blog) strictly follows the 4-layer pattern:

   - **Domain**: Pure business logic, entities, value objects (framework-agnostic)
   - **Application**: Use cases orchestrating domain logic, DTOs for data transfer
   - **Infrastructure**: External dependencies (TypeORM, Redis, Kafka, file storage)
   - **Interface**: Entry points (HTTP controllers, WebSocket gateways, GraphQL resolvers)

2. **Real-World Examples**:

   - **User**: Traditional CRUD with email/password value objects
   - **Auth**: JWT tokens, sessions, refresh tokens with cache
   - **Chat**: Real-time messaging with WebSocket gateway + Kafka events
   - **Blog**: Content management with search (Elasticsearch), file storage (S3), job queue (view counter)

3. **Cross-Cutting Concerns**:

   - Shared modules (database, cache, logger, messaging) are framework-aware but isolated
   - Common utilities (guards, filters, interceptors) handle cross-cutting concerns
   - Each module can use shared infrastructure without coupling to other modules
   - **Migrations**: All database migrations centralized in `database/migrations/` (NOT in module folders) to maintain single source of truth and proper execution order

4. **Testing Organization**:

   - Unit tests: Domain entities, value objects, use cases (mocked dependencies)
   - Integration tests: Repositories, adapters (real database/Redis via containers)
   - E2E tests: Complete flows with fixtures per feature

5. **Technology Integration**:

   - **WebSocket**: Chat module demonstrates Socket.IO gateway with Redis adapter
   - **Kafka**: Chat and Blog modules show event producers for async workflows
   - **BullMQ**: Blog module has view counter processor for background jobs
   - **GraphQL**: Optional blog resolver for flexible API queries

6. **Naming Conventions** (Enforced):
   - Folders: `kebab-case` (e.g., `user-management/`)
   - Classes: `PascalCase` (e.g., `CreateUserUseCase`)
   - Files: Match class names in `kebab-case` (e.g., `create-user.use-case.ts`)
   - TypeORM entities: `*.typeorm-entity.ts` to distinguish from domain entities
   - Migrations: `{timestamp}{sequence}-{description}.ts` format (e.g., `1699000001000-create-users-table.ts`)
   - Seeds: `{sequence}-{entity}.seed.ts` format (e.g., `001-user.seed.ts`)

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

### Performance & Quality Standards (per Constitution)

- **Architecture**: Feature MUST follow Clean Architecture layering (domain/application/infrastructure/interface)
- **Code Quality**: TypeScript strict mode, ESLint passing, no circular dependencies
- **Testing**: >80% coverage target for critical modules; unit/integration/e2e tests required
- **Performance**: Feature MUST meet 1,000 req/s baseline (if applicable to this feature type)
- **API Consistency**: Responses follow standard format; errors use structured codes
- **Security**: Input validation required; output sanitization via DTOs; no sensitive data exposure
