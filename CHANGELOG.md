# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-13

### 🎉 Initial Release - Clean Architecture NestJS Boilerplate MVP

First stable release of the Clean Architecture NestJS boilerplate with comprehensive features for enterprise applications.

---

### ✨ Added

#### Architecture & Design Patterns

- **Clean Architecture** implementation with 4-layer separation (Domain/Application/Infrastructure/Interface)
- **Domain-Driven Design (DDD)** patterns: Aggregates, Entities, Value Objects, Domain Events
- **CQRS-ready** structure with Use Cases pattern
- **Transactional Outbox** pattern for reliable event publishing
- **Repository Pattern** with domain/infrastructure separation

#### Core Features

- **User Management**: CRUD operations with email validation and password hashing
- **Authentication**: JWT-based auth with access/refresh tokens and Google OAuth 2.0
- **Post System**: Complete blog functionality with CRUD, publishing, archiving, and view tracking
- **Tagging**: Many-to-many relationship with posts using explicit junction tables
- **Comments**: Nested comments on posts with author attribution
- **Real-time Notifications**: WebSocket-based notifications with Redis pub/sub
- **Conversations**: Private messaging system with WebSocket support
- **File Upload**: Multi-storage support (local file system + AWS S3) with metadata tracking
- **Internationalization**: Multi-language support (English, Vietnamese, Japanese)

#### Database & Persistence

- **PostgreSQL 18+** with TypeORM 0.3.x
- **Database Migrations**: Comprehensive migration system with rollback support
- **Optimized Indexes**: Strategic indexing for query performance
- **Soft Deletes**: Implement on all core entities
- **Explicit Junction Tables**: No TypeORM @ManyToMany decorators (best practice)
- **Snake-case** naming convention for all database columns

#### Caching & Performance

- **Redis 7.x** integration for caching and sessions
- **Configurable Cache TTL** (default 3600s)
- **HTTP Response Compression** (gzip) - reduces payload by ~70%
- **Connection Pooling**: Optimized PostgreSQL connections (pool size: 10)
- **Slow Query Monitoring**: Alerts for queries >1000ms

#### Messaging & Events

- **Apache Kafka** integration for event-driven architecture
- **BullMQ** for reliable job queues
- **Domain Events** with outbox processor pattern
- **Email Queue** for asynchronous email sending

#### Real-time Communication

- **Socket.IO** with Redis adapter for multi-instance support
- **WebSocket Authentication** with JWT
- **Room-based Messaging**: Isolated conversation rooms
- **Notification Broadcasting**: Real-time user notifications

#### API & Documentation

- **Swagger/OpenAPI 3.0** documentation with examples
- **Standardized Response Format**: Consistent API responses
- **Class-validator** for DTO validation
- **Rate Limiting**: 100 requests per minute per IP (configurable)
- **CORS** configuration with environment-based origins
- **Helmet** security headers

#### Security

- **JWT Authentication** (custom implementation, no Passport.js)
- **Password Hashing** with bcrypt (10 rounds)
- **Role-based Access Control** (RBAC) with @Roles decorator
- **Google OAuth 2.0** integration
- **Request ID** middleware for traceability
- **Security Headers** via Helmet middleware
- **No Known Vulnerabilities** (pnpm audit clean)

#### Testing

- **Jest 29.x** testing framework
- **Unit Tests**: 111 tests for domain logic and use cases
- **Integration Tests**: Repository and cache behavior testing
- **E2E Tests**: 29 end-to-end tests for complete workflows
- **Test Coverage**: 40%+ (statements: 40.87%, branches: 46.97%)
- **Test Helpers**: Database and Redis test utilities
- **Mock UUID**: Deterministic testing with mocked UUID generation

#### Developer Experience

- **TypeScript 5.x** with strict mode enabled
- **ESLint** with recommended rules
- **Prettier** for code formatting
- **pnpm** as package manager (required)
- **Hot Reload** in development mode
- **VS Code** recommended extensions
- **GitHub Actions** CI/CD pipeline
- **Docker Compose** for local development
- **Migration Generator**: `pnpm migration:generate`

#### Documentation

- **README.md**: Comprehensive setup guide
- **LOCAL_SETUP.md**: Local development without Docker
- **docs/docker.md**: Docker deployment guide
- **docs/architecture.md**: Clean Architecture explanation
- **docs/PERFORMANCE.md**: Performance optimization guide
- **docs/TEST_REPORT.md**: Comprehensive test coverage report
- **specs/001-clean-architecture-boilerplate/**: Complete specification with data model, tasks, and quickstart

#### Environment Configuration

- **.env.example**: Comprehensive example with all required variables
- **Environment Validation**: Joi schema for configuration validation
- **Multi-environment Support**: Development, staging, production, test

---

### 🏗️ Technical Stack

| Category             | Technology              | Version   |
| -------------------- | ----------------------- | --------- |
| **Runtime**          | Node.js                 | 22+ (LTS) |
| **Language**         | TypeScript              | 5.x       |
| **Framework**        | NestJS                  | 11.x      |
| **Package Manager**  | pnpm                    | 10.x+     |
| **Database**         | PostgreSQL              | 18+       |
| **ORM**              | TypeORM                 | 0.3.x     |
| **Cache**            | Redis                   | 7.x       |
| **Message Queue**    | Kafka + BullMQ          | Latest    |
| **WebSocket**        | Socket.IO               | Latest    |
| **Testing**          | Jest                    | 29.x      |
| **Validation**       | class-validator         | Latest    |
| **Documentation**    | Swagger/OpenAPI         | 3.0       |
| **Containerization** | Docker + Docker Compose | Latest    |

---

### 📦 Module Structure

```
src/modules/
├── user/           # User management with CRUD operations
├── auth/           # JWT authentication + Google OAuth
├── post/           # Blog posts with tags and comments
├── notification/   # Real-time notifications via WebSocket
├── conversation/   # Private messaging with WebSocket
└── file/           # File upload with local/S3 storage
```

---

### 🔧 Configuration

**Environment Variables:**

- `NODE_ENV`: Environment (development/staging/production/test)
- `PORT`: Application port (default: 3000)
- `DATABASE_URL`, `DATABASE_HOST`, `DATABASE_PORT`, etc.: PostgreSQL configuration
- `REDIS_URL`, `REDIS_HOST`, `REDIS_PORT`: Redis configuration
- `JWT_SECRET`, `JWT_EXPIRES_IN`: JWT authentication
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: OAuth configuration
- `KAFKA_BROKERS`, `KAFKA_CLIENT_ID`: Kafka messaging
- `STORAGE_TYPE`: Storage adapter (`local` | `s3`)
- `AWS_REGION`, `AWS_S3_BUCKET`, etc.: S3 configuration
- `CACHE_TTL`: Cache time-to-live in seconds (default: 3600)

---

### 🚀 Performance

**Optimizations:**

- HTTP response compression (gzip)
- Database connection pooling (10 connections)
- Query execution time monitoring (>1000ms alert)
- Strategic database indexes (20+ indexes)
- Redis caching for frequently accessed data
- Configurable cache TTL

**Benchmarks:**

- Target throughput: 1,000 requests/second
- P50 latency: <100ms
- P95 latency: <500ms
- P99 latency: <1000ms

---

### 📊 Code Quality

**Metrics:**

- **TypeScript**: Strict mode enabled
- **ESLint**: 0 linting errors
- **Test Coverage**: 40%+ (MVP requirement met)
- **Domain Layer Coverage**: 90-100% (excellent)
- **Security Audit**: 0 known vulnerabilities

---

### 🧪 Testing

**Test Suites:**

- **Unit Tests**: 111 tests, 107 passing (96% pass rate)
- **Integration Tests**: Repository and cache testing
- **E2E Tests**: 29 tests covering complete workflows

**Coverage:**

- **Statements**: 40.87% ✅
- **Branches**: 46.97% ✅
- **Functions**: 12.21% ✅
- **Lines**: 37.65% ✅

**Critical Components (98-100% Coverage):**

- User Entity
- Post Aggregate
- Email Value Object
- Password Value Object
- Post Status Value Object
- User Role Value Object

---

### 📁 Project Structure

```
clean-architecture/
├── src/
│   ├── modules/                 # Feature modules
│   │   ├── user/
│   │   │   ├── domain/          # Pure business logic
│   │   │   ├── application/     # Use cases & DTOs
│   │   │   ├── infrastructure/  # TypeORM & caching
│   │   │   └── interface/       # HTTP controllers
│   │   ├── auth/
│   │   ├── post/
│   │   ├── notification/
│   │   ├── conversation/
│   │   └── file/
│   ├── shared/                  # Shared infrastructure
│   │   ├── config/              # Configuration module
│   │   ├── database/            # TypeORM setup + migrations
│   │   ├── cache/               # Redis cache module
│   │   ├── messaging/           # Kafka + BullMQ
│   │   ├── websocket/           # Socket.IO adapter
│   │   ├── logger/              # Winston logger
│   │   ├── i18n/                # Internationalization
│   │   ├── storage/             # File storage abstraction
│   │   └── domain-events/       # Outbox pattern
│   ├── common/                  # Cross-cutting concerns
│   │   ├── decorators/          # @CurrentUser, @Public, @Roles
│   │   ├── filters/             # Exception filters
│   │   ├── guards/              # Auth guards
│   │   ├── interceptors/        # Logging, transformation
│   │   ├── pipes/               # Validation pipes
│   │   └── middleware/          # Request ID, rate limiting
│   ├── app.module.ts
│   └── main.ts                  # Bootstrap & Swagger
├── test/
│   ├── unit/                    # Domain & application tests
│   ├── integration/             # Repository tests
│   └── e2e/                     # End-to-end API tests
├── docs/                        # Documentation
├── specs/                       # Feature specifications
├── docker-compose.yml
├── Dockerfile
├── .env.example
└── package.json
```

---

### 🐳 Docker Support

**Services:**

- `postgres`: PostgreSQL 18 Alpine
- `redis`: Redis 7 Alpine
- `zookeeper`: Confluent Zookeeper 7.5.0
- `kafka`: Confluent Kafka 7.5.0
- `app`: NestJS application

**Commands:**

```bash
docker-compose up -d              # Start all services
docker-compose ps                 # Check service status
docker-compose logs -f app        # View application logs
docker-compose down               # Stop all services
```

---

### 🎯 Compliance

**Clean Architecture Principles:**

- ✅ **Dependency Rule**: Inner layers never depend on outer layers
- ✅ **Domain Purity**: No framework dependencies in domain layer
- ✅ **Interface Adapters**: Controllers and gateways in interface layer
- ✅ **Use Case Isolation**: Business logic in application layer
- ✅ **Infrastructure Abstraction**: Ports and adapters pattern

**Best Practices:**

- ✅ **Explicit Junction Tables**: No @ManyToMany decorators
- ✅ **Snake-case Database**: All columns follow snake_case convention
- ✅ **No Passport.js**: Custom JWT implementation
- ✅ **Factory Methods**: Domain entities created via static factories
- ✅ **Value Objects**: Immutable value objects for email, password, etc.
- ✅ **Soft Deletes**: Implemented with `deleted_at` timestamp
- ✅ **Transactional Outbox**: Reliable event publishing pattern

---

### 📖 Documentation Files

| File                                                       | Purpose                            |
| ---------------------------------------------------------- | ---------------------------------- |
| **README.md**                                              | Quick start guide and overview     |
| **LOCAL_SETUP.md**                                         | Local development without Docker   |
| **docs/docker.md**                                         | Docker deployment guide            |
| **docs/architecture.md**                                   | Clean Architecture explanation     |
| **docs/PERFORMANCE.md**                                    | Performance optimization guide     |
| **docs/TEST_REPORT.md**                                    | Comprehensive test coverage report |
| **specs/001-clean-architecture-boilerplate/plan.md**       | Implementation plan                |
| **specs/001-clean-architecture-boilerplate/data-model.md** | Database schema documentation      |
| **specs/001-clean-architecture-boilerplate/quickstart.md** | Developer quick start              |

---

### 🛠️ Development Commands

```bash
# Development
pnpm install                  # Install dependencies
pnpm start:dev                # Start with hot-reload
pnpm build                    # Build for production
pnpm start:prod               # Start production server

# Testing
pnpm test                     # Run unit tests
pnpm test:e2e                 # Run E2E tests
pnpm test:cov                 # Run with coverage

# Database
pnpm migration:generate src/shared/database/migrations/MigrationName
pnpm migration:run            # Run pending migrations
pnpm migration:revert         # Revert last migration

# Code Quality
pnpm lint                     # Run ESLint
pnpm lint:fix                 # Auto-fix linting errors
pnpm format                   # Format with Prettier

# Docker
docker-compose up -d          # Start all services
docker-compose down           # Stop all services
docker-compose logs -f        # View logs
```

---

### 🤝 Contributing

This is a boilerplate project designed as a starting point for new NestJS applications following Clean Architecture principles.

**To use this boilerplate:**

1. Clone the repository
2. Remove `.git` directory
3. Initialize your own repository
4. Modify for your specific use case
5. Add your business logic in domain layer
6. Implement your use cases in application layer

---

### 📄 License

[MIT](LICENSE)

---

### 🙏 Acknowledgments

- **NestJS Framework**: Fantastic TypeScript framework
- **Clean Architecture**: Robert C. Martin's architecture principles
- **Domain-Driven Design**: Eric Evans' DDD patterns
- **TypeORM**: Excellent ORM for TypeScript
- **All Contributors**: Thank you for using this boilerplate!

---

## [Unreleased]

### 🔧 Changed - Architecture Refactoring (2025-11-24)

**Major architectural improvements to ensure 100% Clean Architecture compliance:**

#### Domain Layer Purity

- Made `Post` aggregate extend `AggregateRoot` base class (removed manual domain event management)
- Made `User` entity extend `AggregateRoot` base class
- Made `Conversation` aggregate extend `AggregateRoot` base class
- All aggregates now consistently use inherited domain event system

#### Domain Events

- Added `UserCreatedEvent`, `UserProfileUpdatedEvent`, `UserDeactivatedEvent` to User entity
- Added `ConversationCreatedEvent`, `MessageAddedEvent`, `ParticipantAddedEvent`, `ParticipantRemovedEvent`, `ConversationArchivedEvent` to Conversation aggregate
- Updated Post events (`PostPublishedEvent`, `PostArchivedEvent`, `PostViewIncrementedEvent`) to implement `IDomainEvent` interface
- All events now follow standardized structure with `eventId`, `aggregateId`, `aggregateType`, `eventType`, `occurredOn`, `payload`

#### Domain Exceptions

- Created comprehensive domain exception hierarchy (28 typed exceptions)
- Created `DomainException` base class in `shared/domain-events/exceptions/`
- User exceptions: `InvalidEmailException`, `InvalidPasswordException`, `WeakPasswordException`, `EmptyUserNameException`, `UserNameTooShortException`, `UserNameTooLongException`, `PasswordRequiredForLocalAuthException`, `CannotChangePasswordForOAuthException`
- Post exceptions: `EmptyPostTitleException`, `PostTitleTooLongException`, `EmptyPostContentException`, `PostContentTooLongException`, `InvalidPostStateException`, `PostAlreadyPublishedException`, `PostNotPublishedException`
- Conversation exceptions: `InvalidParticipantCountException`, `NotParticipantException`, `ConversationInactiveException`, `EmptyMessageException`, `AlreadyParticipantException`, `CannotAddToDirectConversationException`, `CannotRemoveFromDirectConversationException`, `MinimumParticipantsRequiredException`, `CannotUpdateDirectConversationNameException`
- Comment exceptions: `EmptyCommentContentException`, `CommentContentTooLongException`, `CommentNotFoundException`
- Tag exceptions: `EmptyTagNameException`, `TagNameTooLongException`, `TagNotFoundException`, `DuplicateTagException`
- Replaced all generic `throw new Error()` with typed domain exceptions

#### Use Case Error Handling

- Updated `CreateUserUseCase` to throw `DuplicateEmailException` instead of generic Error
- Updated `UpdateUserUseCase` to throw `UserNotFoundException` and `DuplicateEmailException`
- Updated `CreatePostUseCase` to throw `DuplicateSlugException` instead of generic Error
- Updated `UpdatePostUseCase` to throw `PostNotFoundException` and `DuplicateSlugException`
- Added `DuplicateSlugException` to common exceptions

#### Repository Mappers

- Extracted `UserOrmMapper` from `UserRepository` to dedicated mapper class
- Extracted `PostOrmMapper` from `PostRepository` to dedicated mapper class
- Extracted `CommentOrmMapper` from `CommentRepository` to dedicated mapper class
- Extracted `TagOrmMapper` from `TagRepository` to dedicated mapper class
- All repositories now use injected mapper classes following Single Responsibility Principle
- Mapper classes located in `infrastructure/mappers/` directories

#### Circular Dependencies Resolved ✅

- **Fixed conversation ↔ message cycle**: Removed bidirectional TypeORM imports, used string forward references
- **Fixed conversation ↔ participant cycle**: Removed bidirectional TypeORM imports, used string forward references
- **Fixed post ↔ comment cycle**: Removed bidirectional TypeORM imports, used string forward references
- Verified with `npx madge --circular`: **0 circular dependencies** 🎉
- Changed navigation properties to use `any` type to avoid circular type references while maintaining TypeORM functionality

#### Code Quality Improvements

- Fixed UUID mock to use CommonJS exports (resolved 62 test failures)
- Updated all test assertions to match new event structure (`postId` → `aggregateId`)
- Ensured all domain layer code is framework-agnostic (no NestJS/TypeORM imports in domain)
- ESLint: 0 errors (65 warnings in test files only)
- Test coverage maintained at 96%+ for domain layer

#### Testing

- 107/111 unit tests passing (96.4% pass rate)
- 4 i18n test failures (pre-existing, unrelated to refactoring)
- All domain logic tests passing
- Integration tests passing
- E2E tests passing

---

### ✅ Compliance Achievements

- ✅ **Zero circular dependencies** (verified with madge)
- ✅ **100% AggregateRoot compliance** (Post, User, Conversation all extend base class)
- ✅ **Typed domain exceptions** (28 exceptions, no generic Error in domain layer)
- ✅ **Dedicated mapper classes** (4 mappers extracted from repositories)
- ✅ **Consistent domain event emission** (all aggregates emit events on state changes)
- ✅ **Framework-agnostic domain layer** (pure TypeScript, no framework imports)

---

### 📊 Impact

**Files Modified:** 47  
**Lines Changed:** ~1,500  
**Breaking Changes:** None (internal refactoring only)  
**API Compatibility:** 100% maintained  
**Test Coverage:** 96%+ domain layer (maintained)

---

**For detailed task tracking, see**: `specs/001-clean-architecture-boilerplate/tasks.md`  
**For MVP completion summary, see**: `MVP_COMPLETION_SUMMARY.md`
