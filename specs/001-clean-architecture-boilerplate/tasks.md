# Tasks: NestJS Clean Architecture Boilerplate

**Feature**: 001-clean-architecture-boilerplate  
**Generated**: 2025-11-11  
**Input Documents**: plan.md, spec.md, data-model.md, research.md, contracts/openapi.yaml

**Organization**: Tasks are grouped by user story to enable independent implementation and testing. Each user story can be completed independently after the foundational phase.

**Constitution Compliance**: All tasks adhere to the 8 core principles defined in `.specify/memory/constitution.md`.

---

## Format: `- [ ] [TaskID] [P?] [Story?] Description with file path`

- **Checkbox**: `- [ ]` (markdown checkbox)
- **Task ID**: Sequential (T001, T002, T003...) in execution order
- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label (US1-US8) for user story phases only
- **Description**: Clear action with exact file path

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Initialize project structure and basic configuration

**Prerequisites**: Node.js 22+ LTS, pnpm 10.x+ installed globally

- [x] T001 Initialize NestJS project with pnpm in project root directory (npx @nestjs/cli new . --package-manager pnpm --skip-git)
- [x] T002 [P] Create Clean Architecture directory structure using mkdir -p commands:
  - src/modules (feature modules)
  - src/shared (shared infrastructure)
  - src/common (cross-cutting concerns)
  - test/unit (domain & application tests)
  - test/integration (repository tests)
  - test/e2e (API & WebSocket tests)
- [x] T003 [P] Configure TypeScript strict mode in tsconfig.json:
  - Set strict: true
  - Set strictNullChecks: true
  - Set noImplicitAny: true
  - Set experimentalDecorators: true
  - Set emitDecoratorMetadata: true
- [x] T004 [P] Setup ESLint with NestJS recommended rules in .eslintrc.js
- [x] T005 [P] Setup Prettier with configuration in .prettierrc:
  - singleQuote: true
  - trailingComma: all
  - printWidth: 100
- [x] T006 [P] Install core NestJS dependencies (pnpm add @nestjs/common @nestjs/core @nestjs/platform-express rxjs reflect-metadata)
- [x] T007 [P] Install TypeORM and PostgreSQL driver (pnpm add @nestjs/typeorm typeorm pg)
- [x] T008 [P] Install Redis dependencies (pnpm add @nestjs/cache-manager cache-manager @keyv/redis)
- [x] T009 [P] Install validation dependencies (pnpm add class-validator class-transformer @nestjs/mapped-types)
- [x] T010 [P] Install testing dependencies (pnpm add -D jest @nestjs/testing supertest @types/jest @types/supertest @types/node ts-jest)
- [x] T011 Configure Jest in jest.config.js with separate configs for:
  - Unit tests: testMatch for test/unit/\*_/_.spec.ts
  - Integration tests: testMatch for test/integration/\*_/_.spec.ts
  - E2E tests: testMatch for test/e2e/\*_/_.e2e-spec.ts
- [x] T012 Create .env.example with documented environment variables:
  - NODE_ENV (development, staging, production)
  - PORT (default: 3000)
  - DATABASE_URL (postgresql://user:password@localhost:5432/dbname)
  - REDIS_URL (redis://localhost:6379)
  - JWT_SECRET (random secret key - CHANGE IN PRODUCTION)
  - JWT_EXPIRES_IN (15m)
  - REFRESH_TOKEN_EXPIRES_IN (7d)
  - GOOGLE_CLIENT_ID (your-google-client-id)
  - GOOGLE_CLIENT_SECRET (your-google-client-secret)
  - KAFKA_BROKERS (localhost:9092)
- [x] T013 Create .gitignore with essential ignores:
  - node_modules/
  - dist/
  - .env
  - .env.local
  - coverage/
  - \*.log
  - .DS_Store
- [x] T014 Create README.md with:
  - Project description
  - Prerequisites (Node.js 22+, pnpm 10+, Docker)
  - Quick start instructions
  - Available npm scripts
  - Project structure overview

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Configuration & Environment

- [x] T015 [P] Create config module in src/shared/config/config.module.ts using @nestjs/config
- [x] T016 [P] Create config service in src/shared/config/config.service.ts with type-safe getters for all environment variables
- [x] T017 [P] Define environment schema with Joi validation in src/shared/config/environment.schema.ts:
  - Validate required variables (DATABASE_URL, REDIS_URL, JWT_SECRET)
  - Validate enum values (NODE_ENV: development|staging|production)
  - Validate number types (PORT with default 3000)

### Database Foundation

- [x] T018 Create database module in src/shared/database/database.module.ts
- [x] T019 [P] Configure TypeORM connection in src/shared/database/database.config.ts:
  - Use ConfigService for database credentials
  - Enable synchronize: false (use migrations only)
  - Enable logging in development
  - Configure connection pooling (max: 10)
- [x] T020 [P] Create base repository interface in src/shared/database/base/base.repository.interface.ts with common CRUD methods
- [x] T021 Create TypeORM migrations configuration in src/shared/database/migrations.config.ts and add migration scripts to package.json:
  - migration:generate
  - migration:create
  - migration:run
  - migration:revert

### Logging & Monitoring

- [x] T022 [P] Create logger module in src/shared/logger/logger.module.ts
- [x] T023 [P] Implement structured logger service in src/shared/logger/logger.service.ts:
  - Use Winston or Pino for structured logging
  - Include correlation IDs in all log entries
  - Support different log levels (debug, info, warn, error)
  - Format logs as JSON in production
- [x] T024 [P] Create request ID middleware in src/common/middleware/request-id.middleware.ts:
  - Generate UUID for each request
  - Attach to request object
  - Include in response headers (X-Request-ID)

### API Standards

- [x] T025 [P] Create global exception filter in src/common/filters/http-exception.filter.ts:
  - Handle HttpException and transform to standard error format
  - Handle validation errors with field-level details
  - Log errors with correlation ID
  - Map exception types to error codes
- [x] T026 [P] Create global validation pipe in src/common/pipes/validation.pipe.ts:
  - Use class-validator for DTO validation
  - Transform input data using class-transformer
  - Return detailed validation errors
- [x] T027 [P] Create response transform interceptor in src/common/interceptors/transform.interceptor.ts:
  - Wrap successful responses in standard format {status, data, meta}
  - Include timestamp and requestId in meta
- [x] T028 [P] Define standard response type interfaces in src/common/types/response.types.ts:
  - SuccessResponse<T> with status, data, meta
  - ErrorResponse with status, error {code, message, details}, meta
- [x] T029 [P] Create error code enum in src/common/types/error-codes.enum.ts:
  - VALIDATION_ERROR
  - UNAUTHORIZED
  - FORBIDDEN
  - NOT_FOUND
  - INTERNAL_SERVER_ERROR
  - etc.

### Common Utilities

- [x] T030 [P] Create CurrentUser decorator in src/common/decorators/current-user.decorator.ts:
  - Extract user from request object (set by auth guard)
  - Usage: @CurrentUser() user: UserPayload
- [x] T031 [P] Create Public decorator in src/common/decorators/public.decorator.ts:
  - Mark routes as public (skip authentication)
  - Usage: @Public() on controller methods
- [x] T032 [P] Create Roles decorator in src/common/decorators/roles.decorator.ts:
  - Specify required roles for endpoints
  - Usage: @Roles('admin', 'moderator')
- [x] T033 Wire up global providers in src/main.ts:
  - useGlobalFilters(new HttpExceptionFilter())
  - useGlobalPipes(new ValidationPipe())
  - useGlobalInterceptors(new TransformInterceptor())
  - Apply request ID middleware
  - Enable CORS with proper configuration

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Project Foundation Setup (Priority: P1) 🎯 MVP

**Goal**: Properly structured NestJS project with Clean Architecture layers

**Independent Test**: Create a health-check module with all four layers and verify dependency flow

### Domain Layer

- [x] T034 [P] [US1] Create User domain entity in src/modules/user/domain/entities/user.entity.ts:
  - Pure TypeScript class (NO TypeORM decorators)
  - Properties: id, email, password, userName, role, provider
  - Factory method: User.create()
  - Business methods: updateProfile(), changePassword()
- [x] T035 [P] [US1] Create Email value object in src/modules/user/domain/value-objects/email.vo.ts:
  - Validate email format (RFC 5322)
  - Immutable class
- [x] T036 [P] [US1] Create Password value object in src/modules/user/domain/value-objects/password.vo.ts:
  - Validate password strength (min 8 chars, uppercase, lowercase, number)
  - Hash password using bcrypt
  - Method: comparePassword()
- [x] T037 [P] [US1] Create UserRole enum in src/modules/user/domain/value-objects/user-role.vo.ts:
  - Values: ADMIN, USER, MODERATOR
- [x] T038 [P] [US1] Define IUserRepository interface in src/modules/user/domain/repositories/user.repository.interface.ts:
  - save(user: User): Promise<User>
  - findById(id: string): Promise<User | null>
  - findByEmail(email: string): Promise<User | null>
  - delete(id: string): Promise<void>
- [x] T039 [P] [US1] Create domain events in src/modules/user/domain/events/:
  - UserCreatedEvent with userId, email, timestamp
  - UserUpdatedEvent with userId, changes, timestamp
  - UserDeletedEvent with userId, timestamp

### Application Layer

- [x] T040 [P] [US1] Create CreateUserDto in src/modules/user/application/dtos/create-user.dto.ts:
  - Properties: email, password, userName
  - Validation decorators: @IsEmail(), @MinLength(8), @IsString()
  - Swagger decorators: @ApiProperty() with examples
- [x] T041 [P] [US1] Create UpdateUserDto in src/modules/user/application/dtos/update-user.dto.ts:
  - Properties: userName (optional)
  - Extend PartialType(CreateUserDto) for optional fields
- [x] T042 [P] [US1] Create UserResponseDto in src/modules/user/application/dtos/user-response.dto.ts:
  - Exclude sensitive fields (password)
  - Properties: id, email, userName, role, createdAt
- [x] T043 [US1] Implement CreateUserUseCase in src/modules/user/application/use-cases/create-user.use-case.ts:
  - Inject IUserRepository
  - Check if email already exists
  - Create User entity using factory method
  - Save to repository
  - Dispatch UserCreatedEvent
- [x] T044 [US1] Implement GetUserUseCase in src/modules/user/application/use-cases/get-user.use-case.ts:
  - Find user by ID
  - Throw NotFoundException if not found
- [x] T045 [US1] Implement UpdateUserUseCase in src/modules/user/application/use-cases/update-user.use-case.ts:
  - Find user, update properties, save
  - Dispatch UserUpdatedEvent
- [x] T046 [US1] Implement ListUsersUseCase in src/modules/user/application/use-cases/list-users.use-case.ts:
  - Support pagination (page, limit)
  - Support filtering (role, provider)
  - Return paginated result
- [x] T047 [US1] Create UserMapper in src/modules/user/application/mappers/user.mapper.ts:
  - toDto(user: User): UserResponseDto
  - toDomain(ormEntity: UserOrmEntity): User

### Infrastructure Layer

- [x] T048 [P] [US1] Create User TypeORM entity in src/modules/user/infrastructure/persistence/user.orm-entity.ts:
  - Use @Entity({ name: 'users' }) decorator
  - Map properties to snake_case columns: @Column({ name: 'user_name' })
  - Include timestamps: @CreateDateColumn, @UpdateDateColumn, @DeleteDateColumn
  - Define relationships (sessions, posts)
- [x] T049 [US1] Implement UserRepository in src/modules/user/infrastructure/persistence/user.repository.ts:
  - Implement IUserRepository interface
  - Use TypeORM Repository<UserOrmEntity>
  - Use UserMapper to convert between domain and ORM entities
  - Handle soft deletes
- [x] T050 [US1] Create database migration for users table:
  - Run: pnpm typeorm migration:generate -n CreateUsersTable
  - Verify migration SQL includes all columns, indexes, constraints
- [x] T051 [US1] Run migration to create users table:
  - Run: pnpm typeorm migration:run
  - Verify table exists in database

### Interface Layer

- [x] T052 [P] [US1] Create UserController in src/modules/user/interface/http/user.controller.ts:
  - @Controller('users')
  - POST /users (create)
  - GET /users/:id (get by ID)
  - PATCH /users/:id (update)
  - DELETE /users/:id (soft delete)
  - GET /users (list with pagination)
- [x] T053 [P] [US1] Add Swagger decorators to UserController:
  - @ApiTags('Users')
  - @ApiOperation() for each endpoint with summary
  - @ApiResponse() for 200, 201, 400, 404, 500
  - @ApiBearerAuth() for protected endpoints
- [x] T054 [US1] Configure UserModule in src/modules/user/user.module.ts:
  - Import DatabaseModule, ConfigModule
  - Provide use cases, repository, mapper
  - Export UserRepository for other modules
- [x] T055 [US1] Register UserModule in src/app.module.ts imports array

### Validation & Documentation

- [x] T056 [US1] Add validation decorators to CreateUserDto and UpdateUserDto:
  - @IsEmail() for email
  - @MinLength(8) @Matches() for password
  - @IsString() @MinLength(3) for userName
- [x] T057 [US1] Add Swagger property decorators to all DTOs:
  - @ApiProperty() with description, example, required
  - @ApiPropertyOptional() for optional fields
- [x] T058 [US1] Configure Swagger in src/main.ts:
  - Create DocumentBuilder with title, description, version
  - Set bearer auth security scheme
  - SwaggerModule.setup('/api/docs', app, document)
- [x] T059 [US1] Test User CRUD endpoints manually:
  - Open http://localhost:3000/api/docs in browser
  - Test POST /users (create user)
  - Test GET /users/:id (retrieve user)
  - Test PATCH /users/:id (update user)
  - Verify responses follow standard format

**Checkpoint**: User Story 1 complete - Basic CRUD with Clean Architecture layers verified ✅

---

## Phase 4: User Story 2 - Database & Persistence Layer (Priority: P1)

**Goal**: Configured PostgreSQL database with TypeORM and migration support, demonstrating aggregate pattern

**Independent Test**: Create a sample Post entity, run migrations, perform CRUD operations across application restarts, verify data persistence

### Sample Aggregate: Post

- [x] T060 [P] [US2] Create Post domain aggregate in src/modules/post/domain/aggregates/post.aggregate.ts:
  - Extend AggregateRoot base class
  - Properties: id, authorId, title, content, slug, status, publishedAt, viewCount
  - Factory method: Post.create()
  - Business methods: publish(), archive(), incrementViewCount()
  - Dispatch PostPublishedEvent when status changes to published
- [x] T061 [P] [US2] Create Comment domain entity in src/modules/post/domain/entities/comment.entity.ts:
  - Properties: id, postId, authorId, content, createdAt
  - Validation: content min 1 character
- [x] T062 [P] [US2] Create Tag domain entity in src/modules/post/domain/entities/tag.entity.ts:
  - Properties: id, name, slug
  - Auto-generate slug from name
- [x] T063 [P] [US2] Create PostStatus enum in src/modules/post/domain/value-objects/post-status.vo.ts:
  - Values: DRAFT, PUBLISHED, ARCHIVED
- [x] T064 [P] [US2] Define IPostRepository interface in src/modules/post/domain/repositories/post.repository.interface.ts:
  - save(post: Post): Promise<Post>
  - findById(id: string): Promise<Post | null>
  - findBySlug(slug: string): Promise<Post | null>
  - findPublished(pagination): Promise<Post[]>
- [x] T065 [P] [US2] Create domain events in src/modules/post/domain/events/:
  - PostPublishedEvent with postId, authorId, timestamp
  - PostArchivedEvent with postId, timestamp
  - CommentAddedEvent with postId, commentId, timestamp

### Application Layer

- [x] T066 [P] [US2] Create CreatePostDto in src/modules/post/application/dtos/create-post.dto.ts
- [x] T067 [P] [US2] Create UpdatePostDto in src/modules/post/application/dtos/update-post.dto.ts
- [x] T068 [P] [US2] Create PublishPostDto in src/modules/post/application/dtos/publish-post.dto.ts
- [x] T069 [US2] Implement CreatePostUseCase in src/modules/post/application/use-cases/create-post.use-case.ts
- [x] T070 [US2] Implement PublishPostUseCase in src/modules/post/application/use-cases/publish-post.use-case.ts
- [x] T071 [US2] Implement GetPostUseCase in src/modules/post/application/use-cases/get-post.use-case.ts
- [x] T072 [US2] Create PostMapper in src/modules/post/application/mappers/post.mapper.ts

### Infrastructure Layer

- [x] T073 [P] [US2] Create Post TypeORM entity in src/modules/post/infrastructure/persistence/post.orm-entity.ts
- [x] T074 [P] [US2] Create Comment TypeORM entity in src/modules/post/infrastructure/persistence/comment.orm-entity.ts
- [x] T075 [P] [US2] Create Tag TypeORM entity in src/modules/post/infrastructure/persistence/tag.orm-entity.ts
- [x] T076 [P] [US2] Create PostTag junction table entity in src/modules/post/infrastructure/persistence/post-tag.orm-entity.ts
- [x] T077 [US2] Implement PostRepository in src/modules/post/infrastructure/persistence/post.repository.ts
- [x] T078 [US2] Create migration for posts, comments, tags, post_tags tables (pnpm migration:generate CreatePostTables)
- [x] T079 [US2] Run migrations (pnpm migration:run)

### Interface Layer

- [x] T080 [P] [US2] Create PostController in src/modules/post/interface/http/post.controller.ts
- [x] T081 [P] [US2] Create CommentController in src/modules/post/interface/http/comment.controller.ts
- [x] T082 [P] [US2] Create TagController in src/modules/post/interface/http/tag.controller.ts
- [x] T083 [P] [US2] Add Swagger decorators to all controllers
- [x] T084 [US2] Configure PostModule in src/modules/post/post.module.ts
- [x] T085 [US2] Register PostModule in src/app.module.ts

### Transaction Management

- [x] T086 [US2] Add transaction support to PostRepository:
  - Use TypeORM EntityManager for transactions
  - Wrap publish operation in transaction (update post + save to outbox)
  - Ensure rollback on error
- [x] T087 [US2] Test transactional operations:
  - Publish a post (should update status + save event to outbox atomically)
  - Verify rollback if event save fails
  - Test concurrent transactions don't conflict

**Checkpoint**: User Story 2 complete - Database persistence with transactions, migrations, and aggregate pattern working correctly ✅

---

## Phase 5: User Story 3 - Caching & Performance Layer (Priority: P1)

**Goal**: Configured Redis caching layer for performance optimization

**Independent Test**: Cache a resource, measure response times with/without cache, verify cache invalidation

### Cache Infrastructure

- [x] T088 [P] [US3] Create cache module in src/shared/cache/cache.module.ts
- [x] T089 [P] [US3] Create cache service wrapper in src/shared/cache/cache.service.ts
- [x] T090 [P] [US3] Create Cacheable decorator in src/shared/cache/decorators/cacheable.decorator.ts
- [x] T091 [P] [US3] Create cache configuration in src/shared/cache/cache.config.ts
- [x] T092 [P] [US3] Install Redis adapter (pnpm add @keyv/redis)
- [x] T093 [US3] Configure Redis connection in cache module

### User Module Caching

- [x] T094 [P] [US3] Create UserCacheService in src/modules/user/infrastructure/cache/user-cache.service.ts
- [x] T095 [US3] Add caching to GetUserUseCase (cache by user ID)
- [x] T096 [US3] Add cache invalidation to UpdateUserUseCase
- [x] T097 [US3] Add cache invalidation to DeleteUserUseCase
- [x] T098 [US3] Test cache hit/miss behavior with logging

### Post Module Caching

- [x] T099 [P] [US3] Create PostCacheService in src/modules/post/infrastructure/cache/post-cache.service.ts
- [x] T100 [US3] Add caching to GetPostUseCase (cache by post ID and slug)
- [x] T101 [US3] Add caching to ListPostsUseCase (cache paginated results)
- [x] T102 [US3] Add cache invalidation to PublishPostUseCase
- [x] T103 [US3] Implement cache warming strategy for popular posts

### Session Storage

- [x] T104 [P] [US3] Create Session TypeORM entity in src/modules/auth/infrastructure/persistence/session.orm-entity.ts
- [x] T105 [US3] Create migration for sessions table (pnpm migration:generate CreateSessionsTable)
- [x] T106 [US3] Implement session storage in Redis for fast lookups
- [x] T107 [US3] Add session expiration with TTL

**Checkpoint**: User Story 3 complete - Redis caching improving performance measurably ✅

---

## Phase 6: User Story 4 - Real-time Communication (Priority: P2)

**Goal**: WebSocket support with Socket.IO configured for real-time features

**Independent Test**: Establish WebSocket connection, emit events bidirectionally, verify broadcasts

### WebSocket Infrastructure

- [x] T108 [P] [US4] Install Socket.IO dependencies (pnpm add @nestjs/websockets @nestjs/platform-socket.io socket.io)
- [x] T109 [P] [US4] Install Redis adapter for Socket.IO (pnpm add @socket.io/redis-adapter)
- [x] T110 [P] [US4] Create WebSocket module in src/shared/websocket/websocket.module.ts
- [x] T111 [P] [US4] Configure Socket.IO with Redis adapter in src/shared/websocket/websocket.adapter.ts
- [x] T112 [US4] Register WebSocket adapter in src/main.ts

### Notification Module (WebSocket)

- [x] T113 [P] [US4] Create Notification domain entity in src/modules/notification/domain/entities/notification.entity.ts
- [x] T114 [P] [US4] Create NotificationType enum in src/modules/notification/domain/value-objects/notification-type.vo.ts
- [x] T115 [P] [US4] Define INotificationRepository in src/modules/notification/domain/repositories/notification.repository.interface.ts
- [x] T116 [US4] Implement SendNotificationUseCase in src/modules/notification/application/use-cases/send-notification.use-case.ts
- [x] T117 [P] [US4] Create Notification TypeORM entity in src/modules/notification/infrastructure/persistence/notification.orm-entity.ts
- [x] T118 [US4] Implement NotificationRepository in src/modules/notification/infrastructure/persistence/notification.repository.ts
- [x] T119 [US4] Create migration for notifications table (pnpm migration:generate CreateNotificationsTable)

### WebSocket Gateway

- [x] T120 [P] [US4] Create NotificationGateway in src/modules/notification/interface/websocket/notification.gateway.ts
- [x] T121 [US4] Implement connection/disconnection handlers
- [x] T122 [US4] Implement broadcast notification event handler
- [x] T123 [US4] Implement room-based messaging (user-specific notifications)
- [x] T124 [US4] Add authentication to WebSocket connections (JWT token validation)

### Conversation Module (Chat Example)

- [x] T125 [P] [US4] Create Conversation aggregate in src/modules/conversation/domain/aggregates/conversation.aggregate.ts
- [x] T126 [P] [US4] Create Message entity in src/modules/conversation/domain/entities/message.entity.ts
- [x] T127 [P] [US4] Create ConversationType enum in src/modules/conversation/domain/value-objects/conversation-type.vo.ts
- [x] T128 [P] [US4] Create Conversation TypeORM entities in src/modules/conversation/infrastructure/persistence/
- [x] T129 [P] [US4] Create ConversationParticipant junction table entity
- [x] T130 [US4] Create migration for conversations, messages, conversation_participants tables
- [ ] T131 [P] [US4] Create ConversationGateway in src/modules/conversation/interface/websocket/conversation.gateway.ts
- [ ] T132 [US4] Implement send message handler with broadcast to conversation participants
- [ ] T133 [US4] Configure NotificationModule and ConversationModule
- [ ] T134 [US4] Register modules in src/app.module.ts

### Multi-instance Testing

- [ ] T135 [US4] Test WebSocket broadcasting across multiple app instances (using Redis pub/sub)
- [ ] T136 [US4] Verify client reconnection logic works correctly

**Checkpoint**: User Story 4 complete - WebSocket real-time communication working with multi-instance support

---

## Phase 7: User Story 5 - Message Queue Integration (Priority: P2)

**Goal**: Kafka and BullMQ configured for asynchronous job processing and event-driven workflows

**Independent Test**: Enqueue a job, process it asynchronously, verify completion status

### Domain Events Infrastructure

- [ ] T137 [P] [US5] Create domain events module in src/shared/domain-events/domain-events.module.ts
- [ ] T138 [P] [US5] Create DomainEvent base interface in src/shared/domain-events/domain-event.interface.ts
- [ ] T139 [P] [US5] Create AggregateRoot base class in src/shared/domain-events/aggregate-root.base.ts
- [ ] T140 [P] [US5] Create DomainEventPublisher in src/shared/domain-events/domain-event-publisher.service.ts

### Transactional Outbox Pattern

- [ ] T141 [P] [US5] Create DomainEventOutbox entity in src/shared/domain-events/outbox/outbox.orm-entity.ts
- [ ] T142 [US5] Create OutboxRepository in src/shared/domain-events/outbox/outbox.repository.ts
- [ ] T143 [US5] Create migration for domain_event_outbox table (pnpm migration:generate CreateOutboxTable)
- [ ] T144 [US5] Implement save-to-outbox logic in DomainEventPublisher
- [ ] T145 [US5] Add outbox writes to repository save methods (same transaction as aggregate)

### BullMQ Setup

- [ ] T146 [P] [US5] Install BullMQ dependencies (pnpm add @nestjs/bull bullmq)
- [ ] T147 [P] [US5] Create BullMQ module in src/shared/messaging/bullmq/bullmq.module.ts
- [ ] T148 [P] [US5] Configure BullMQ with Redis in src/shared/messaging/bullmq/bullmq.config.ts
- [ ] T149 [P] [US5] Create OutboxProcessor in src/shared/domain-events/outbox/outbox.processor.ts
- [ ] T150 [US5] Implement polling logic (every 5 seconds for unpublished events)
- [ ] T151 [US5] Implement retry mechanism with exponential backoff
- [ ] T152 [US5] Register outbox processor queue

### Kafka Setup

- [ ] T153 [P] [US5] Install Kafka dependencies (pnpm add kafkajs)
- [ ] T154 [P] [US5] Create Kafka module in src/shared/messaging/kafka/kafka.module.ts
- [ ] T155 [P] [US5] Configure Kafka producer in src/shared/messaging/kafka/kafka-producer.service.ts
- [ ] T156 [P] [US5] Configure Kafka consumer in src/shared/messaging/kafka/kafka-consumer.service.ts
- [ ] T157 [US5] Integrate Kafka producer in OutboxProcessor (publish events to Kafka)
- [ ] T158 [US5] Create sample consumer for PostPublishedEvent

### Background Jobs

- [ ] T159 [P] [US5] Create EmailQueue in src/shared/messaging/bullmq/queues/email.queue.ts
- [ ] T160 [P] [US5] Create EmailProcessor in src/shared/messaging/bullmq/processors/email.processor.ts
- [ ] T161 [US5] Implement send-email job handler (mock email sending)
- [ ] T162 [US5] Enqueue email job from UserCreatedEvent handler
- [ ] T163 [US5] Test job processing with monitoring (BullBoard UI)

### Event-Driven Workflow

- [ ] T164 [US5] Connect PostPublishedEvent to Kafka topic
- [ ] T165 [US5] Create consumer that updates view count statistics
- [ ] T166 [US5] Test end-to-end event flow (aggregate → outbox → Kafka → consumer)

**Checkpoint**: User Story 5 complete - Asynchronous job processing and event-driven architecture working

---

## Phase 8: User Story 6 - API Standards & Documentation (Priority: P2)

**Goal**: Standardized API response formats, error handling, and OpenAPI documentation

**Independent Test**: Make requests with valid/invalid data, verify responses follow standard format

### Authentication Module

- [ ] T167 [P] [US6] Install JWT dependencies (pnpm add @nestjs/jwt)
- [ ] T168 [P] [US6] Create auth module in src/modules/auth/auth.module.ts
- [ ] T169 [P] [US6] Create JwtAuthGuard in src/modules/auth/interface/guards/jwt-auth.guard.ts
- [ ] T170 [P] [US6] Create RolesGuard in src/modules/auth/interface/guards/roles.guard.ts
- [ ] T171 [P] [US6] Create LoginDto in src/modules/auth/application/dtos/login.dto.ts
- [ ] T172 [P] [US6] Create TokenResponseDto in src/modules/auth/application/dtos/token-response.dto.ts
- [ ] T173 [US6] Implement LoginUseCase in src/modules/auth/application/use-cases/login.use-case.ts
- [ ] T174 [US6] Implement RefreshTokenUseCase in src/modules/auth/application/use-cases/refresh-token.use-case.ts
- [ ] T175 [US6] Implement LogoutUseCase in src/modules/auth/application/use-cases/logout.use-case.ts
- [ ] T176 [P] [US6] Create AuthController in src/modules/auth/interface/http/auth.controller.ts
- [ ] T177 [US6] Configure JWT strategy and module providers
- [ ] T178 [US6] Add @UseGuards(JwtAuthGuard) to protected endpoints

### Google OAuth

- [ ] T179 [P] [US6] Install Google auth dependencies (pnpm add axios)
- [ ] T180 [P] [US6] Create GoogleOAuthService in src/modules/auth/infrastructure/oauth/google-oauth.service.ts
- [ ] T181 [US6] Implement OAuth2 authorization URL generation
- [ ] T182 [US6] Implement OAuth2 callback handler (exchange code for token)
- [ ] T183 [US6] Implement user profile fetching from Google API
- [ ] T184 [US6] Add /auth/google and /auth/google/callback endpoints
- [ ] T185 [US6] Test Google OAuth flow end-to-end

### Enhanced Error Handling

- [ ] T186 [P] [US6] Create custom exception classes in src/common/exceptions/ (UserNotFoundException, DuplicateEmailException, etc.)
- [ ] T187 [US6] Update global exception filter to map exceptions to error codes
- [ ] T188 [US6] Add error code mapping to ErrorResponse
- [ ] T189 [US6] Test error responses match OpenAPI spec

### Swagger Documentation

- [ ] T190 [P] [US6] Install Swagger dependencies (pnpm add @nestjs/swagger)
- [ ] T191 [US6] Configure Swagger in src/main.ts (SwaggerModule.setup at /api/docs)
- [ ] T192 [P] [US6] Add @ApiTags to all controllers
- [ ] T193 [P] [US6] Add @ApiOperation to all endpoints with summary and description
- [ ] T194 [P] [US6] Add @ApiProperty to all DTOs with examples
- [ ] T195 [P] [US6] Add @ApiResponse decorators for all status codes (200, 201, 400, 401, 404, 500)
- [ ] T196 [US6] Add authentication security scheme to Swagger config
- [ ] T197 [US6] Test Swagger UI at /api/docs - verify all endpoints documented

### API Versioning

- [ ] T198 [P] [US6] Add global /api prefix in src/main.ts
- [ ] T199 [US6] Verify all endpoints accessible via /api/\* paths

**Checkpoint**: User Story 6 complete - API standards enforced, comprehensive documentation available

---

## Phase 9: User Story 7 - Testing Infrastructure (Priority: P3)

**Goal**: Preconfigured testing infrastructure with examples for unit, integration, and e2e tests

**Independent Test**: Run test suite, verify all three test types execute successfully

### Unit Tests (Domain & Application)

- [ ] T200 [P] [US7] Create unit test for User entity in test/unit/user/domain/user.entity.spec.ts
- [ ] T201 [P] [US7] Create unit test for Email value object in test/unit/user/domain/email.vo.spec.ts
- [ ] T202 [P] [US7] Create unit test for Password value object in test/unit/user/domain/password.vo.spec.ts
- [ ] T203 [P] [US7] Create unit test for CreateUserUseCase in test/unit/user/application/create-user.use-case.spec.ts
- [ ] T204 [P] [US7] Create unit test for Post aggregate in test/unit/post/domain/post.aggregate.spec.ts
- [ ] T205 [P] [US7] Create unit test for PublishPostUseCase in test/unit/post/application/publish-post.use-case.spec.ts
- [ ] T206 [US7] Run unit tests (pnpm test) and verify >80% coverage for domain layer

### Integration Tests (Repositories & Infrastructure)

- [ ] T207 [P] [US7] Install test containers (pnpm add -D testcontainers)
- [ ] T208 [P] [US7] Create database test helper in test/helpers/database-test.helper.ts
- [ ] T209 [P] [US7] Create Redis test helper in test/helpers/redis-test.helper.ts
- [ ] T210 [P] [US7] Create integration test for UserRepository in test/integration/user/user.repository.integration.spec.ts
- [ ] T211 [P] [US7] Create integration test for PostRepository in test/integration/post/post.repository.integration.spec.ts
- [ ] T212 [P] [US7] Create integration test for OutboxProcessor in test/integration/outbox/outbox.processor.integration.spec.ts
- [ ] T213 [US7] Run integration tests (pnpm test:integration)

### E2E Tests (API & WebSocket)

- [ ] T214 [P] [US7] Create E2E test setup in test/e2e/setup.ts
- [ ] T215 [P] [US7] Create E2E test for auth flow in test/e2e/auth.e2e-spec.ts (login, refresh, protected routes)
- [ ] T216 [P] [US7] Create E2E test for user CRUD in test/e2e/user.e2e-spec.ts
- [ ] T217 [P] [US7] Create E2E test for post lifecycle in test/e2e/post.e2e-spec.ts (create, publish, archive)
- [ ] T218 [P] [US7] Create E2E test for WebSocket in test/e2e/websocket.e2e-spec.ts (connection, events, rooms)
- [ ] T219 [US7] Run E2E tests (pnpm test:e2e)

### Test Coverage & Reporting

- [ ] T220 [US7] Configure coverage thresholds in jest.config.js (>80% for domain/application)
- [ ] T221 [US7] Generate coverage report (pnpm test:cov)
- [ ] T222 [US7] Verify coverage meets constitutional requirements

### Test Documentation

- [ ] T223 [P] [US7] Create testing guide in docs/testing.md
- [ ] T224 [US7] Document test structure and conventions
- [ ] T225 [US7] Add test examples to README.md

**Checkpoint**: User Story 7 complete - Comprehensive testing infrastructure with >80% coverage

---

## Phase 10: User Story 8 - Developer Experience & Tooling (Priority: P3)

**Goal**: Pre-commit hooks, automated checks, and Docker configuration for consistent development

**Independent Test**: Attempt to commit code that violates quality standards, verify commit is blocked

### Git Hooks

- [ ] T226 [P] [US8] Install Husky (pnpm add -D husky)
- [ ] T227 [US8] Initialize Husky (pnpm husky install)
- [ ] T228 [P] [US8] Install lint-staged (pnpm add -D lint-staged)
- [ ] T229 [P] [US8] Install commitlint (pnpm add -D @commitlint/cli @commitlint/config-conventional)
- [ ] T230 [P] [US8] Create pre-commit hook in .husky/pre-commit (runs lint-staged)
- [ ] T231 [P] [US8] Create commit-msg hook in .husky/commit-msg (runs commitlint)
- [ ] T232 [P] [US8] Configure lint-staged in package.json (ESLint, Prettier, type checking)
- [ ] T233 [P] [US8] Configure commitlint in commitlint.config.js
- [ ] T234 [US8] Test pre-commit hook blocks bad code
- [ ] T235 [US8] Test commit-msg hook blocks invalid commit messages

### Docker Configuration

- [ ] T236 [P] [US8] Create Dockerfile for production in docker/Dockerfile
- [ ] T237 [P] [US8] Create Dockerfile for development in docker/Dockerfile.dev
- [ ] T238 [P] [US8] Create docker-compose.yml with PostgreSQL, Redis, Kafka, Zookeeper, app services
- [ ] T239 [P] [US8] Create .dockerignore
- [ ] T240 [US8] Test docker-compose up -d starts all services
- [ ] T241 [US8] Verify application connects to all services in Docker environment

### CI/CD Configuration

- [ ] T242 [P] [US8] Create GitHub Actions workflow in .github/workflows/ci.yml
- [ ] T243 [P] [US8] Add CI steps: install, lint, type-check, test, build
- [ ] T244 [P] [US8] Add test coverage reporting to CI
- [ ] T245 [US8] Create pull request template in .github/pull_request_template.md

### Developer Documentation

- [ ] T246 [P] [US8] Create architecture guide in docs/architecture.md
- [ ] T247 [P] [US8] Create deployment guide in docs/deployment.md
- [ ] T248 [P] [US8] Create API development guide in docs/api-development.md
- [ ] T249 [P] [US8] Update README.md with quickstart, architecture overview, testing instructions
- [ ] T250 [US8] Create CONTRIBUTING.md with contribution guidelines
- [ ] T251 [US8] Create CHANGELOG.md template

### Additional Tooling

- [ ] T252 [P] [US8] Install madge for circular dependency detection (pnpm add -D madge)
- [ ] T253 [P] [US8] Add circular dependency check script in package.json
- [ ] T254 [P] [US8] Install standard-version for changelog generation (pnpm add -D standard-version)
- [ ] T255 [US8] Test all npm scripts work correctly

**Checkpoint**: User Story 8 complete - Developer experience polished with automated quality checks

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

### Security Hardening

- [ ] T256 [P] Install Helmet (pnpm add helmet)
- [ ] T257 [P] Configure CORS in src/main.ts
- [ ] T258 [P] Configure Helmet security headers in src/main.ts
- [ ] T259 [P] Add rate limiting to public endpoints (pnpm add @nestjs/throttler)
- [ ] T260 Configure rate limiter in src/app.module.ts
- [ ] T261 Test rate limiting works on auth endpoints

### Internationalization

- [ ] T262 [P] Install i18n dependencies (pnpm add nestjs-i18n)
- [ ] T263 [P] Create i18n module in src/shared/i18n/i18n.module.ts
- [ ] T264 [P] Create translation files in src/shared/i18n/translations/ (en, vi, ja)
- [ ] T265 Configure i18n with Accept-Language header detection
- [ ] T266 Add translations for error messages
- [ ] T267 Test language switching

### File Storage

- [ ] T268 [P] Create storage module in src/shared/storage/storage.module.ts
- [ ] T269 [P] Create local storage adapter in src/shared/storage/adapters/local-storage.adapter.ts
- [ ] T270 [P] Create S3 storage adapter in src/shared/storage/adapters/s3-storage.adapter.ts
- [ ] T271 [P] Create FileMetadata entity in src/modules/file/domain/entities/file-metadata.entity.ts
- [ ] T272 Create migration for file_metadata table
- [ ] T273 [P] Create file upload endpoint in src/modules/file/interface/http/file.controller.ts
- [ ] T274 Add file validation (size, type, virus scanning hooks)
- [ ] T275 Test file upload and download

### Performance Optimization

- [ ] T276 Review and optimize database indexes
- [ ] T277 Add database query logging in development
- [ ] T278 Optimize cache TTL values based on access patterns
- [ ] T279 Add compression middleware
- [ ] T280 Configure connection pooling for PostgreSQL

### Documentation & Cleanup

- [ ] T281 [P] Review all Swagger documentation for completeness
- [ ] T282 [P] Add code examples to API documentation
- [ ] T283 Update quickstart.md with final setup instructions
- [ ] T284 Verify all environment variables documented in .env.example
- [ ] T285 Code cleanup and refactoring
- [ ] T286 Remove unused dependencies
- [ ] T287 Update all package versions to latest stable

### Final Validation

- [ ] T288 Run full test suite (unit + integration + e2e)
- [ ] T289 Verify >80% test coverage achieved
- [ ] T290 Test Docker Compose setup from scratch
- [ ] T291 Validate all 8 user stories work independently
- [ ] T292 Run performance tests (1,000 req/s baseline)
- [ ] T293 Security audit (pnpm audit)
- [ ] T294 Generate final documentation
- [ ] T295 Create release notes

---

## Dependencies & Execution Order

### Phase Dependencies

1. **Setup (Phase 1)** → No dependencies
2. **Foundational (Phase 2)** → Depends on Setup completion (BLOCKS all user stories)
3. **User Stories (Phase 3-10)** → All depend on Foundational phase completion
   - US1-US3 (P1): Can proceed in parallel after Phase 2
   - US4-US6 (P2): Can proceed in parallel after Phase 2
   - US7-US8 (P3): Can proceed in parallel after Phase 2
4. **Polish (Phase 11)** → Depends on desired user stories completion

### User Story Dependencies

- **US1 (Foundation)**: Independent - only needs Phase 2
- **US2 (Database)**: Independent - only needs Phase 2
- **US3 (Caching)**: Independent - only needs Phase 2
- **US4 (WebSocket)**: Independent - only needs Phase 2
- **US5 (Message Queues)**: Independent - only needs Phase 2 (integrates with US2 for events)
- **US6 (API Standards)**: Independent - only needs Phase 2 (enhances US1-US5)
- **US7 (Testing)**: Tests US1-US6 - can proceed in parallel as features complete
- **US8 (Developer Tools)**: Independent - only needs Phase 2

### Parallel Opportunities

**After Phase 2 completes, maximum parallelism**:

- Team A: US1 (Foundation) → T034-T059
- Team B: US2 (Database) → T060-T087
- Team C: US3 (Caching) → T088-T107
- Team D: US4 (WebSocket) → T108-T136
- Team E: US5 (Message Queues) → T137-T166
- Team F: US6 (API Standards) → T167-T199
- Team G: US7 (Testing) → T200-T225 (can start as features complete)
- Team H: US8 (Developer Tools) → T226-T255

**Within Each Phase**:

- All tasks marked [P] can run in parallel
- Tasks without [P] must follow sequential order

---

## Parallel Example: User Story 1

```bash
# After foundational phase, launch domain layer in parallel:
Task T034: Create User domain entity
Task T035: Create Email value object
Task T036: Create Password value object
Task T037: Create UserRole enum
Task T038: Define IUserRepository interface
Task T039: Create domain events
# All can proceed simultaneously (different files)

# After domain complete, launch application DTOs in parallel:
Task T040: Create CreateUserDto
Task T041: Create UpdateUserDto
Task T042: Create UserResponseDto
# All can proceed simultaneously

# Use cases proceed sequentially (share domain dependencies):
Task T043: Implement CreateUserUseCase
Task T044: Implement GetUserUseCase
Task T045: Implement UpdateUserUseCase
Task T046: Implement ListUsersUseCase
Task T047: Create UserMapper
```

---

## Implementation Strategy

### Strategy 1: MVP First (Fastest Time to Demo)

**Focus**: User Stories 1-3 only (P1 priority - Core CRUD with Clean Architecture)

**Timeline**:

```
Day 1: Setup + Foundational (T001-T033)
  - Morning: Project initialization, dependencies
  - Afternoon: Config, database, logging, API standards
  - Checkpoint: Foundation ready

Day 2-3: US1 - Foundation (T034-T059)
  - Domain layer (entities, value objects)
  - Application layer (use cases, DTOs)
  - Infrastructure (TypeORM, repository)
  - Interface (controller, Swagger)
  - Checkpoint: User CRUD working

Day 4-5: US2 - Database (T060-T087)
  - Post aggregate with domain events
  - Junction tables (PostTag)
  - Transactions and migrations
  - Checkpoint: Advanced persistence patterns working

Day 6: US3 - Caching (T088-T107)
  - Redis integration
  - Cache invalidation strategies
  - Session storage
  - Checkpoint: Performance optimized

Day 7: Polish & Documentation
  - Fix bugs
  - Complete documentation
  - Demo preparation
```

**Total**: ~7 days for production-ready MVP

**Deliverable**: Working NestJS boilerplate with Clean Architecture, PostgreSQL, Redis, and comprehensive examples

---

### Strategy 2: Full Feature Set (Complete Boilerplate)

**Focus**: All 8 user stories (P1 + P2 + P3)

**Timeline**:

```
Week 1: Foundation + Core (P1)
  - Days 1-7: Setup, Foundational, US1, US2, US3
  - Checkpoint: MVP complete (same as Strategy 1)

Week 2: Real-time + Events (P2)
  - Days 8-9: US4 - WebSocket (real-time communication)
  - Days 10-11: US5 - Message Queues (Kafka, BullMQ, Outbox)
  - Days 12-13: US6 - API Standards (JWT, OAuth, Swagger)
  - Checkpoint: Event-driven architecture working

Week 3: Quality + DevOps (P3)
  - Days 14-15: US7 - Testing (unit, integration, e2e)
  - Days 16-17: US8 - Developer Tools (Husky, Docker, CI/CD)
  - Day 18: Polish phase (security, i18n, file storage)
  - Checkpoint: Production-ready boilerplate

Week 4: Final Polish
  - Days 19-20: Performance optimization
  - Day 21: Security hardening
  - Day 22: Documentation completion
  - Checkpoint: Ready for public release
```

**Total**: ~22 days for complete boilerplate with all features

**Deliverable**: Enterprise-grade NestJS boilerplate with all infrastructure patterns

---

### Strategy 3: Parallel Team (Fastest Overall)

**Focus**: All 8 user stories in parallel (requires 8 developers)

**Timeline**:

```
Week 1: Foundation (All Team)
  - Days 1-2: Setup + Foundational together
  - Checkpoint: All developers aligned on architecture

Week 2: Parallel Development
  - Developer A: US1 (Foundation)
  - Developer B: US2 (Database)
  - Developer C: US3 (Caching)
  - Developer D: US4 (WebSocket)
  - Developer E: US5 (Message Queues)
  - Developer F: US6 (API Standards)
  - Developer G: US7 (Testing - supports others)
  - Developer H: US8 (Developer Tools)
  - Checkpoint: All user stories 80% complete

Week 3: Integration + Polish
  - Days 15-17: Integration testing across stories
  - Days 18-19: Bug fixes and refinements
  - Days 20-21: Documentation and polish
  - Checkpoint: All features integrated and tested
```

**Total**: ~21 days with 8 developers (3 weeks)

**Effort**: ~168 person-days (8 devs × 21 days)

**Deliverable**: Complete boilerplate in minimum time

---

### Recommended Approach

**For Solo Developer**: Strategy 1 (MVP First)

- Deliver value quickly (7 days)
- Add remaining features incrementally based on need
- Lower risk, faster feedback

**For Small Team (2-3 devs)**: Modified Strategy 2

- Week 1: All on Foundation + US1-US3
- Week 2: Split - one on US4-US5, another on US6-US7
- Week 3: Together on US8 + Polish
- Total: ~18 days with 2-3 developers

**For Large Team (8+ devs)**: Strategy 3 (Parallel)

- Fastest time to complete product
- Requires strong communication
- Higher upfront coordination cost

---

### Quality Gates

**After Setup (Phase 1)**:

- ✅ All dependencies installed
- ✅ TypeScript compiles without errors
- ✅ ESLint and Prettier configured

**After Foundational (Phase 2)**:

- ✅ Database connection successful
- ✅ Redis connection successful
- ✅ Global filters/pipes/interceptors working
- ✅ Swagger accessible at /api/docs

**After Each User Story**:

- ✅ Independent test criteria passed
- ✅ All endpoints documented in Swagger
- ✅ Manual testing successful
- ✅ No ESLint errors
- ✅ Tests written (if US7 complete)

**Before Polish Phase**:

- ✅ All desired user stories complete
- ✅ No blocking bugs
- ✅ Basic documentation exists

**Before Release**:

- ✅ All tests passing
- ✅ >80% code coverage
- ✅ Security audit clean
- ✅ Docker setup tested
- ✅ Documentation complete
- ✅ Performance baseline met (1,000 req/s)

---

## Task Summary

### Overview

**Total Tasks**: 295 tasks organized across 11 phases

**Task Breakdown by Phase**:
| Phase | User Story | Priority | Task Range | Count | Duration (Solo) |
|-------|-----------|----------|------------|-------|-----------------|
| 1 | Setup | - | T001-T014 | 14 | 2-4 hours |
| 2 | Foundational | BLOCKING | T015-T033 | 19 | 1 day |
| 3 | US1 - Foundation | P1 🎯 | T034-T059 | 26 | 1.5 days |
| 4 | US2 - Database | P1 | T060-T087 | 28 | 1.5 days |
| 5 | US3 - Caching | P1 | T088-T107 | 20 | 1 day |
| 6 | US4 - WebSocket | P2 | T108-T136 | 29 | 2 days |
| 7 | US5 - Message Queues | P2 | T137-T166 | 30 | 2 days |
| 8 | US6 - API Standards | P2 | T167-T199 | 33 | 1.5 days |
| 9 | US7 - Testing | P3 | T200-T225 | 26 | 2 days |
| 10 | US8 - Developer Tools | P3 | T226-T255 | 30 | 1.5 days |
| 11 | Polish | - | T256-T295 | 40 | 2 days |

### Parallelization Analysis

**Tasks Marked [P] (Parallelizable)**: 158 out of 295 (53.6%)

**Why These Can Run in Parallel**:

- Different files (no file conflicts)
- No dependencies on incomplete work
- Independent functionality

**Sequential Tasks**: 137 tasks (46.4%)

- Require previous task completion
- Modify same files
- Dependencies on domain/application setup

**Maximum Parallel Speedup**:

- Solo: ~18 days sequential
- 8 developers: ~3 weeks (with coordination overhead)
- Theoretical minimum: ~8 days (if infinite parallelism)

### Independent Test Criteria (Per User Story)

Each user story can be validated independently:

| Story   | Test Criteria                                | Validation Method                                            |
| ------- | -------------------------------------------- | ------------------------------------------------------------ |
| **US1** | Create health-check module with all 4 layers | Verify dependency flow: interface → application → domain     |
| **US2** | CRUD operations persist across restarts      | Restart app, query database, verify data exists              |
| **US3** | Cache hit/miss measurable                    | Check logs for cache hits, measure response time improvement |
| **US4** | WebSocket events broadcast to clients        | Connect 2+ clients, emit event, verify all receive           |
| **US5** | Background jobs process asynchronously       | Enqueue job, check status endpoint, verify completion        |
| **US6** | API responses follow standard format         | Make requests, validate {status, data, meta} structure       |
| **US7** | All test types execute successfully          | Run pnpm test, pnpm test:integration, pnpm test:e2e          |
| **US8** | Pre-commit hooks block invalid commits       | Commit code with lint errors, verify rejection               |

### MVP Scope Definition

**Minimum Viable Product (MVP)** = P1 User Stories Only

**Includes**:

- ✅ Phase 1: Setup (T001-T014) - 14 tasks
- ✅ Phase 2: Foundational (T015-T033) - 19 tasks ← **BLOCKING**
- ✅ Phase 3: US1 - Foundation (T034-T059) - 26 tasks
- ✅ Phase 4: US2 - Database (T060-T087) - 28 tasks
- ✅ Phase 5: US3 - Caching (T088-T107) - 20 tasks

**MVP Total**: 107 tasks (~7 days solo developer)

**MVP Delivers**:

- Clean Architecture boilerplate with all 4 layers
- User CRUD with TypeORM and PostgreSQL
- Post aggregate with domain events and transactions
- Redis caching for performance
- Migration system
- Swagger documentation
- Global error handling and validation

**What's NOT in MVP** (can add later):

- Real-time WebSocket (US4)
- Message queues and Kafka (US5)
- JWT authentication and OAuth (US6)
- Comprehensive testing suite (US7)
- Git hooks and Docker (US8)

### Constitution Compliance ✅

All 8 constitutional principles satisfied:

| Principle               | How Tasks Address It                               | Verification                    |
| ----------------------- | -------------------------------------------------- | ------------------------------- |
| **I. Architecture**     | T034-T059: 4-layer Clean Architecture setup        | Verify dependency flow in US1   |
| **II. Code Quality**    | T003-T005: TypeScript strict, ESLint, Prettier     | Run linter, check tsconfig.json |
| **III. Testing**        | T200-T225: Unit, integration, e2e tests            | Run test suite, check coverage  |
| **IV. Performance**     | T088-T107: Redis caching, indexes                  | Measure response times          |
| **V. UX Consistency**   | T025-T029: Standard API format, Swagger            | Validate response structure     |
| **VI. Security**        | T056, T256-T261: Validation, Helmet, rate limiting | Security audit                  |
| **VII. Tooling**        | T226-T255: Husky, Docker, CI/CD                    | Test pre-commit hooks           |
| **VIII. Extensibility** | T034-T059: Module pattern demonstration            | Add new feature module          |

### Task Completion Tracking

**As you complete tasks, update progress here**:

```markdown
Progress: [##########··············] 33% (33/107 MVP tasks)

Completed Phases:
✅ Phase 1: Setup
✅ Phase 2: Foundational
🔄 Phase 3: US1 - Foundation (in progress)
⬜ Phase 4: US2 - Database
⬜ Phase 5: US3 - Caching

Current Task: T045 - Implement UpdateUserUseCase
Next Milestone: Complete US1 (T034-T059)
```

**Update this after each phase completes to track progress!**
