# Project Context

## Purpose

Production-ready NestJS Clean Architecture Boilerplate demonstrating enterprise-level backend architecture patterns. This project serves as a reference implementation for building scalable, maintainable, and testable Node.js applications using Clean Architecture and Domain-Driven Design (DDD) principles.

**Goals:**

- Provide a solid foundation for enterprise NestJS applications
- Demonstrate Clean Architecture with strict layer separation
- Implement DDD patterns (Aggregates, Value Objects, Domain Events)
- Show best practices for authentication, caching, messaging, and testing
- Enable rapid development while maintaining code quality and architectural integrity

**Current Features:**

- User management with authentication (JWT + Google OAuth)
- Real-time chat/messaging system with WebSocket support
- Post management with comments and tags (demonstrating aggregates)
- File upload/storage (local + AWS S3)
- Real-time notifications via Socket.IO
- Event-driven architecture with Transactional Outbox pattern

## Tech Stack

### Core Technologies

- **Language**: TypeScript 5.x (strict mode enabled)
- **Runtime**: Node.js 22+ (LTS)
- **Framework**: NestJS 11.x
- **Package Manager**: pnpm 10.x+ (REQUIRED - do not use npm or yarn)

### Database & Persistence

- **Database**: PostgreSQL 18+ (primary datastore)
- **ORM**: TypeORM 0.3.x (with explicit junction tables, no @ManyToMany)
- **Migrations**: TypeORM CLI migrations (snake_case naming)

### Caching & Performance

- **Cache**: Redis 7.x (session management, caching, WebSocket adapter)
- **Strategy**: Read-through and write-through caching patterns

### Messaging & Events

- **Message Queue**: Kafka (KafkaJS) for event streaming
- **Job Queue**: BullMQ for background jobs
- **Event Pattern**: Transactional Outbox pattern for reliability

### Real-Time Communication

- **WebSocket**: Socket.IO 4.x
- **Adapter**: Redis adapter for multi-instance support
- **Use Cases**: Real-time notifications, chat messaging

### API & Documentation

- **API Docs**: @nestjs/swagger (OpenAPI 3.0)
- **Validation**: class-validator + class-transformer
- **Response Format**: Standardized { status, data, meta } structure

### Authentication & Security

- **Auth**: Custom JWT implementation (NO Passport.js)
- **OAuth**: Google OAuth 2.0 (@google-auth-library)
- **Hashing**: bcrypt for passwords
- **Security**: Helmet, rate limiting (@nestjs/throttler), compression

### Storage

- **File Upload**: Multer
- **Storage Options**: Local filesystem + AWS S3 (@aws-sdk/client-s3)
- **Strategy**: Abstracted storage interface for easy switching

### Testing

- **Framework**: Jest 29.x
- **E2E Testing**: Supertest
- **Test Containers**: @testcontainers (PostgreSQL, Redis)
- **Coverage Targets**: >80% overall, >90% domain layer

### Logging & Monitoring

- **Logger**: Winston 3.x with structured logging
- **Features**: Correlation IDs, request tracking, context logging

### Code Quality

- **Linter**: ESLint 9.x with TypeScript support
- **Formatter**: Prettier 3.x
- **Git Hooks**: Husky + lint-staged
- **Commit Linting**: Commitlint (Conventional Commits)
- **Circular Dependencies**: Madge for detection and prevention
- **Versioning**: standard-version for automated changelog

### DevOps

- **Containerization**: Docker + Docker Compose
- **Development**: Hot-reload with watch mode
- **Production**: Multi-stage Docker builds

### Internationalization

- **i18n**: nestjs-i18n
- **Languages**: English, Vietnamese, Japanese

## Project Conventions

### Code Style

**File & Folder Naming:**

- Folders: `kebab-case` (e.g., `user-management/`, `order-processing/`)
- Classes: `PascalCase` (e.g., `CreateUserUseCase`, `UserRepository`)
- Files: Match class names (e.g., `create-user.use-case.ts`, `user.repository.ts`)
- Interfaces: Prefix with `I` (e.g., `IUserRepository`, `IEmailService`)
- Test files: `*.spec.ts` for unit, `*.e2e-spec.ts` for E2E

**Database Naming:**

- Tables: `snake_case` (e.g., `users`, `posts`, `conversation_participants`)
- Columns: `snake_case` (e.g., `user_name`, `created_at`, `post_id`)
- Indexes: `idx_{table}_{column}` (e.g., `idx_users_email`)
- Foreign Keys: `fk_{table}_{ref_table}` (e.g., `fk_posts_author`)
- Junction Tables: Explicit tables (e.g., `post_tags`, `conversation_participants`)
- **CRITICAL**: NEVER use TypeORM's `@ManyToMany` - always create explicit junction tables

**TypeScript Style:**

- Strict mode enabled (no `any` types except well-documented cases)
- Explicit return types on all public methods
- Prefer `const` over `let`
- Use readonly where applicable
- Maximum file length: 400 lines
- No circular dependencies (enforced by madge)

**Import Order:**

1. External libraries
2. Shared/common modules
3. Domain layer
4. Application layer
5. Infrastructure layer
6. Interface layer

### Architecture Patterns

**Clean Architecture (4-Layer):**

```
Interface Layer (Controllers, Gateways) → HTTP, WebSocket entry points
    ↓
Infrastructure Layer (TypeORM, Redis) → Framework implementations
    ↓
Application Layer (Use Cases, DTOs) → Business orchestration
    ↓
Domain Layer (Entities, Value Objects) → Pure business logic (NO framework dependencies)
```

**Dependency Rule**: Inner layers NEVER depend on outer layers. Dependencies point inward only.

**Module Structure** (MANDATORY for all features):

```
src/modules/{feature}/
├── domain/              # Pure business logic (NO NestJS/TypeORM decorators)
│   ├── entities/        # Domain entities (NOT TypeORM entities)
│   ├── value-objects/   # Immutable value objects
│   ├── repositories/    # Repository interfaces (ports)
│   └── events/          # Domain events
├── application/         # Use cases and orchestration
│   ├── use-cases/       # Business logic orchestration
│   ├── dtos/            # Application DTOs
│   └── ports/           # Additional port interfaces
├── infrastructure/      # Framework-specific implementations
│   ├── persistence/     # TypeORM entities + repositories
│   ├── cache/           # Redis caching logic
│   └── mappers/         # ORM ↔ Domain mappers
└── interface/           # Entry points
    ├── http/            # REST controllers with Swagger decorators
    └── websocket/       # Socket.IO gateways (if needed)
```

**Domain-Driven Design Patterns:**

- Aggregates: Consistency boundaries (e.g., Post with Comments)
- Value Objects: Immutable attributes (e.g., Email, Password)
- Domain Events: Business occurrences (e.g., UserCreatedEvent)
- Repository Pattern: Collection-like data access abstraction
- Factory Methods: Encapsulated entity creation
- Ubiquitous Language: Shared vocabulary between code and business

**Event-Driven Architecture:**

- Transactional Outbox pattern for reliability
- Save events to `domain_event_outbox` table in same transaction
- BullMQ worker polls outbox and publishes to Kafka
- NEVER publish directly to Kafka from use cases

**API Design Standards:**

- Standardized response format:
  ```typescript
  {
    status: 'success' | 'error',
    data: { /* payload */ },
    meta: { timestamp: string, requestId: string }
  }
  ```
- All endpoints documented with Swagger decorators
- Input validation with class-validator
- Protected routes use `@UseGuards(JwtAuthGuard)`
- DTOs for all inputs/outputs (never return raw entities)

### Testing Strategy

**Coverage Requirements:**

- Overall: >80% (branches, functions, lines, statements)
- Domain Layer: >90% (critical business logic)
- Application Layer: >85% (use cases)

**Test Pyramid:**

- Unit Tests (70%): Domain logic, value objects, entities
- Integration Tests (20%): Repository implementations, infrastructure
- E2E Tests (10%): Full API flows, user journeys

**Test Organization:**

```
test/
├── unit/                   # Fast, isolated, no external dependencies
│   ├── user/              # User entity and use case tests
│   └── post/              # Post aggregate tests
├── integration/            # Test Containers (PostgreSQL, Redis)
│   ├── user/              # User repository integration tests
│   └── post/              # Post repository integration tests
└── e2e/                    # Supertest against running app
    ├── auth.e2e-spec.ts   # Authentication flows
    ├── user.e2e-spec.ts   # User CRUD operations
    └── post.e2e-spec.ts   # Post lifecycle
```

**Testing Principles:**

- Mock external dependencies in unit tests
- Use Test Containers for integration tests (never mock databases)
- Test business logic in domain layer (pure functions)
- Test orchestration in application layer (mock repositories)
- Test HTTP contracts in E2E tests (full stack)
- NEVER share state between tests (each test isolated)

**Commands:**

- `pnpm test` - Run all unit tests
- `pnpm test:unit` - Run unit tests only
- `pnpm test:integration` - Run integration tests (requires Docker)
- `pnpm test:e2e` - Run E2E tests (requires running app)
- `pnpm test:cov` - Generate coverage report
- `pnpm test:watch` - Watch mode for development

### Git Workflow

**Branching Strategy:**

- `master` - Production-ready code
- `develop` - Integration branch (if using GitFlow)
- Feature branches: `{issue-number}-{feature-name}` (e.g., `002-chat-module`)
- Hotfix branches: `hotfix/{description}`

**Commit Conventions** (Conventional Commits):

```bash
<type>(<scope>): <subject>

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation changes
- refactor: Code refactoring (no feature change)
- test: Adding/updating tests
- chore: Maintenance tasks (deps, config)
- style: Code formatting (no logic change)
- perf: Performance improvements
- ci: CI/CD changes
```

**Examples:**

```bash
✅ feat(auth): add Google OAuth integration
✅ fix(user): resolve null pointer in repository
✅ docs(readme): update setup instructions
✅ test(post): add integration tests for aggregate
✅ refactor(cache): extract cache key generation
```

**Git Hooks** (Automated via Husky):

- **Pre-commit**: ESLint + Prettier auto-fix on staged files
- **Commit-msg**: Validate commit message format
- **Pre-push**: Run tests (optional, can be enabled)

**Pull Request Requirements:**

- All tests passing
- Code coverage maintained (>80%)
- No ESLint errors
- Conventional commit messages
- Updated documentation if needed

**Versioning:**

- Use `pnpm release` for automated version bumps
- Follows semantic versioning (MAJOR.MINOR.PATCH)
- Generates CHANGELOG.md automatically

## Domain Context

### Core Domains

**User Management:**

- User registration and authentication
- Profile management
- Role-based access control (USER, ADMIN, MODERATOR)
- Session management with Redis TTL
- Google OAuth integration

**Content Management (Posts):**

- Blog post creation with draft/published status
- Comment system (child entities of Post aggregate)
- Tagging system with explicit junction tables
- Author attribution and ownership

**Real-Time Chat/Messaging:**

- One-on-one and group conversations
- WebSocket-based real-time messaging
- Message persistence with PostgreSQL
- Read receipts and typing indicators
- Multi-instance support via Redis adapter

**File Management:**

- File upload with validation (size, type)
- Multiple storage backends (local, S3)
- Pre-signed URL generation for secure downloads
- File metadata tracking

**Notifications:**

- Real-time push notifications via WebSocket
- Event-driven notification generation
- User notification preferences

### Business Rules

**User Domain:**

- Email must be unique and valid format
- Passwords must be at least 8 characters with complexity requirements
- User roles cannot be changed by users themselves
- Sessions expire after configured TTL (default: 24 hours)

**Post Domain:**

- Only drafts can be published (state transition rule)
- Published posts cannot be deleted (soft delete only)
- Only post author or admin can modify posts
- Comments cannot exist without a parent post (aggregate rule)

**Conversation Domain:**

- At least 2 participants required for a conversation
- Users can only read messages from conversations they participate in
- Message editing allowed only within 15 minutes
- Deleted messages are soft-deleted (audit trail)

### Ubiquitous Language

- **Aggregate**: Cluster of domain objects with a root entity (e.g., Post with Comments)
- **Value Object**: Immutable object defined by attributes (e.g., Email, Password)
- **Repository**: Collection-like abstraction for data access
- **Use Case**: Application-specific business rule/action
- **Domain Event**: Something that happened in the business domain
- **Entity**: Object with unique identity and lifecycle
- **Port**: Interface defining contract (e.g., IUserRepository)
- **Adapter**: Implementation of a port (e.g., UserRepository with TypeORM)
- **Outbox**: Staging table for reliable event publishing

## Important Constraints

### Technical Constraints

1. **NO Passport.js**: Use pure NestJS JWT guards and custom authentication
2. **NO @ManyToMany**: Always create explicit junction tables with TypeORM
3. **NO framework dependencies in domain layer**: Keep domain pure TypeScript
4. **MUST use pnpm**: npm and yarn are not supported
5. **Database naming**: snake_case only (enforced at migration level)
6. **TypeScript strict mode**: Enabled and enforced (no `any` types)
7. **Maximum file length**: 400 lines (enforced by ESLint)
8. **Coverage requirement**: >80% overall, >90% domain layer

### Architectural Constraints

1. **Dependency Direction**: Always point inward (Interface → Infrastructure → Application → Domain)
2. **Domain Purity**: Domain layer has zero external dependencies
3. **Port-Adapter Pattern**: All external integrations through interfaces
4. **Event Publishing**: Only via Transactional Outbox (no direct Kafka publishing)
5. **Repository Pattern**: All data access through repository interfaces
6. **DTO Usage**: Never expose domain entities directly in APIs
7. **Aggregate Boundaries**: Modifications only through aggregate root

### Development Constraints

1. **Node.js Version**: Must be 22+ (LTS)
2. **PostgreSQL Version**: Must be 18+ (for latest features)
3. **Redis Version**: Must be 7+ (for modern commands)
4. **Docker Required**: For running infrastructure (PostgreSQL, Redis, Kafka)
5. **Git Hooks Required**: Pre-commit hooks MUST pass before commit

### Quality Constraints

1. **No Circular Dependencies**: Enforced by madge tool
2. **ESLint Zero Errors**: Pre-commit hook enforces
3. **Conventional Commits**: Commit messages MUST follow convention
4. **Test Coverage**: PRs cannot decrease coverage below threshold
5. **Documentation**: All public APIs must have Swagger documentation

### Performance Constraints

1. **Redis Caching**: High-traffic endpoints MUST implement caching
2. **Database Indexing**: Foreign keys and query fields MUST have indexes
3. **Connection Pooling**: PostgreSQL connection pool configured
4. **WebSocket Scaling**: Redis adapter required for multi-instance deployments

### Security Constraints

1. **Password Storage**: MUST use bcrypt (no plaintext)
2. **JWT Secrets**: MUST be environment variables (never hardcoded)
3. **CORS**: Configured via environment variables
4. **Helmet**: Security headers enabled in production
5. **Rate Limiting**: API endpoints rate-limited via @nestjs/throttler
6. **Input Validation**: ALL inputs validated with class-validator

## External Dependencies

### Infrastructure Services

**PostgreSQL 18+**

- Primary datastore for all persistent data
- Port: 5432 (configurable via DB_PORT)
- Required tables: users, posts, comments, tags, post_tags, sessions, conversations, messages, files, domain_event_outbox
- Connection pooling enabled
- Migrations managed via TypeORM CLI

**Redis 7.x**

- Session storage with TTL
- Application-level caching (read-through, write-through)
- WebSocket adapter for Socket.IO multi-instance support
- Port: 6379 (configurable via REDIS_PORT)
- Key patterns: `session:{sessionId}`, `user:{userId}`, `cache:{key}`

**Kafka (Optional)**

- Event streaming for domain events
- Port: 9092
- Topics: user-events, post-events, notification-events
- Consumer groups for each microservice/worker
- Used via Transactional Outbox pattern

### Cloud Services

**AWS S3 (Optional)**

- File storage backend (alternative to local filesystem)
- Requires: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET
- Pre-signed URL generation for secure downloads
- Configurable via STORAGE_TYPE environment variable

**Google OAuth 2.0**

- Third-party authentication
- Requires: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
- Scopes: profile, email
- Redirect URI configured in Google Console

### Development Tools

**Docker & Docker Compose**

- Infrastructure orchestration for development
- Services: PostgreSQL, Redis, Kafka (optional)
- Dev config: docker-compose.dev.yml (with hot-reload volume mounts)
- Prod config: docker-compose.yml (multi-stage builds)

**Testcontainers**

- PostgreSQL and Redis containers for integration tests
- Auto-cleanup after test runs
- Port randomization to avoid conflicts

### Monitoring & Observability (Future)

**Planned Integrations:**

- Prometheus/Grafana for metrics
- Sentry/Rollbar for error tracking
- ELK Stack (Elasticsearch, Logstash, Kibana) for log aggregation
- Jaeger for distributed tracing

### External APIs (Future Extensions)

**Email Service** (Not yet implemented)

- SendGrid/Mailgun/AWS SES for transactional emails
- Use cases: Welcome emails, password resets, notifications

**SMS Service** (Not yet implemented)

- Twilio/AWS SNS for SMS notifications
- Use cases: 2FA, critical alerts

**Payment Gateway** (Not yet implemented)

- Stripe/PayPal for payment processing
- Use cases: Subscriptions, one-time payments

### Package Registry

**NPM Registry**

- All dependencies from npmjs.org
- pnpm lockfile ensures reproducible builds
- Regular security audits via `pnpm audit`

### CI/CD (Planned)

**GitHub Actions**

- Automated testing on PR
- Docker image building and publishing
- Automated deployments to staging/production
- See: docs/cicd.md for configuration

---

**Note**: This project is a boilerplate/reference implementation. External dependencies can be added/removed based on specific application requirements. The architecture supports easy swapping of implementations (e.g., Redis → Memcached, PostgreSQL → MongoDB) through the Port-Adapter pattern.
