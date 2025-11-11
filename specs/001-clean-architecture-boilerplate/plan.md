# Implementation Plan: NestJS Clean Architecture Boilerplate

**Branch**: `001-clean-architecture-boilerplate` | **Date**: 2025-11-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-clean-architecture-boilerplate/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a production-ready NestJS backend boilerplate that follows Clean Architecture principles with Domain-Driven Design patterns. The boilerplate provides:

- **Architecture**: 4-layer Clean Architecture (domain/application/infrastructure/interface) with dependency inversion
- **Database**: PostgreSQL 18+ with TypeORM, migrations, and Transactional Outbox Pattern for reliable event publishing
- **Caching**: Redis 7.x for performance optimization and session management
- **Real-time**: WebSocket support with Socket.IO and Redis pub/sub for horizontal scaling
- **Messaging**: Kafka for event streaming and BullMQ for background job processing
- **API Standards**: Standardized response format, global error handling, automatic Swagger/OpenAPI documentation
- **Authentication**: Pure NestJS JWT authentication with Google OAuth support (no Passport.js dependency)
- **Testing**: Multi-layer testing with Jest (unit/integration/E2E) targeting >80% coverage
- **Developer Experience**: TypeScript strict mode, ESLint/Prettier, Husky pre-commit hooks, conventional commits

This boilerplate serves as a foundation for building scalable, maintainable backend applications while enforcing architectural best practices.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 22+ (LTS)
**Framework**: NestJS 11.x
**Package Manager**: pnpm 10.x+ (REQUIRED per constitution)
**Primary Dependencies**:

- TypeORM 0.3.x (database ORM)
- @nestjs/swagger (API documentation)
- Socket.IO (WebSocket server)
- KafkaJS (Kafka client)
- BullMQ (Redis-based job queue)
- class-validator + class-transformer (DTO validation/transformation)
- @nestjs/jwt (authentication)
- Passport-free authentication using pure NestJS guards

**Storage**: PostgreSQL 18+ with TypeORM
**Cache/Session**: Redis 7.x for caching, session storage, WebSocket pub/sub, BullMQ
**Message Queue**: Kafka for event streaming, BullMQ for job processing
**Testing**: Jest 29.x (unit/integration), Supertest (E2E)
**Target Platform**: Linux server / Docker containers (Docker Compose for local development)
**Project Type**: Backend API boilerplate with Clean Architecture + DDD
**Performance Goals**:

- 1,000 req/s baseline
- p95 < 200ms API response time
- p95 < 50ms for indexed database queries
- Horizontal scalability via stateless design

**Constraints**:

- <1024MB idle memory per instance
- Stateless application for horizontal scaling
- No Passport.js dependency (pure NestJS authentication)
- No @ManyToMany decorators (explicit junction tables only)
- Database columns use snake_case, TypeScript uses camelCase
- All tests must run in isolation with mocked/containerized external dependencies

**Scale/Scope**:

- Full-stack boilerplate covering 8 user stories (P1: Foundation, Database, Caching; P2: WebSocket, Message Queues, API Standards; P3: Testing, Developer Tooling)
- 47 functional requirements organized across architecture, database, caching, messaging, API standards, authentication, security, testing, and developer experience
- 27 success criteria covering functional completeness, architectural compliance, performance, and quality metrics
- Includes advanced patterns: Transactional Outbox, Domain Events, JWT authentication, multi-instance WebSocket scaling

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

**Principle I - Architecture & Modularity**:

- [x] Feature follows Clean Architecture layering (domain/application/infrastructure/interface)
  - ✅ Entire boilerplate is structured around 4-layer architecture
  - ✅ Sample modules demonstrate proper layer separation
- [x] No dependencies from inner to outer layers
  - ✅ Domain layer is framework-agnostic
  - ✅ Application layer depends only on domain abstractions
  - ✅ Infrastructure implements ports defined by application layer
- [x] Shared modules are isolated and reusable
  - ✅ Shared modules planned: logger, config, database, cache, messaging, websocket, i18n, storage, notification

**Principle II - Code Quality**:

- [x] TypeScript strict mode enforced
  - ✅ FR-035: tsconfig.json with strict: true, noImplicitAny: true
- [x] ESLint + Prettier configured
  - ✅ FR-038: ESLint + Prettier pre-commit enforcement via Husky
- [x] No circular dependencies
  - ✅ Edge case documented: ESLint must detect circular dependencies
- [x] DTOs defined for all public interfaces
  - ✅ FR-026: class-validator decorators on all DTOs
  - ✅ FR-025.3: @ApiProperty on all DTO properties
- [x] Domain layer is framework-agnostic (no NestJS decorators)
  - ✅ FR-001: Domain layer contains pure business logic only
  - ✅ Clean Architecture principle enforced in spec

**Principle III - Testing Standards**:

- [x] Unit tests for domain logic planned
  - ✅ SC-022: Unit tests for domain entities and value objects
- [x] Integration tests for repositories planned
  - ✅ SC-023: Integration tests for TypeORM repositories
- [x] E2E tests for API/WebSocket flows planned
  - ✅ SC-024: E2E tests for REST and WebSocket endpoints
- [x] Test coverage target >80% for critical modules
  - ✅ SC-025: Test coverage >80% for domain and application layers
- [x] All tests run in isolation
  - ✅ FR-045: Tests use mocked dependencies or test containers

**Principle IV - Performance & Scalability**:

- [x] Redis caching strategy defined (if applicable)
  - ✅ FR-016: Redis integration for caching
  - ✅ Cache invalidation strategies required
- [x] Database indexes identified for queries
  - ✅ FR-015: Outbox table indexes specified
  - ✅ Key Entities section defines indexes for each table
- [x] Stateless design for horizontal scaling
  - ✅ FR-019: WebSocket scaling via Redis pub/sub
  - ✅ Constraint: Stateless application design
- [x] 1,000 req/s baseline requirement considered
  - ✅ Performance Goals: 1,000 req/s baseline, p95 < 200ms

**Principle V - User Experience Consistency**:

- [x] API responses follow standard format (status, data, meta)
  - ✅ FR-023: Standardized response format enforced
- [x] Error handling with structured codes planned
  - ✅ FR-024: Global exception handling with error codes
- [x] WebSocket events use snake_case with versioning
  - ✅ Assumption: WebSocket event naming conventions enforced
- [x] OpenAPI/Swagger documentation planned
  - ✅ FR-025: Auto-generated Swagger documentation
  - ✅ FR-025.1-025.4: Comprehensive Swagger decorator requirements

**Principle VI - Security & Reliability**:

- [x] Input validation via class-validator planned
  - ✅ FR-026: Global validation pipes with class-validator
- [x] Output sanitization via DTOs planned
  - ✅ FR-027: class-transformer for response sanitization
- [x] Rate limiting considered
  - ✅ FR-017: Rate limiting for public endpoints
- [x] No sensitive data in responses
  - ✅ FR-027: Explicit DTO exposure/exclusion rules

**Principle VII - Tooling & Automation**:

- [x] Pre-commit hooks compatible (no special setup needed)
  - ✅ FR-038: Husky + lint-staged configured
- [x] CI/CD pipeline compatibility verified
  - ✅ FR-039: CI/CD configuration included
- [x] Docker support maintained
  - ✅ FR-040: Dockerfile and docker-compose.yml provided

**Principle VIII - Extensibility & Maintainability**:

- [x] New feature module doesn't modify core
  - ✅ Modular design allows adding modules without touching shared code
- [x] Naming conventions followed (kebab-case folders, PascalCase classes)
  - ✅ Project Structure section enforces naming conventions
- [x] Code is self-documenting
  - ✅ Emphasis on clear naming and minimal comments
- [x] No premature abstraction
  - ✅ YAGNI principle mentioned in constitution

**GATE STATUS**: ✅ **PASSED** - All constitutional principles are satisfied by this boilerplate design.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# NestJS Clean Architecture Boilerplate Structure

src/
├── modules/                           # Feature modules (examples to demonstrate architecture)
│   ├── user/                          # Sample user module
│   │   ├── domain/                    # Pure business logic (framework-agnostic)
│   │   │   ├── entities/              # User.entity.ts (domain entity, NOT TypeORM)
│   │   │   ├── value-objects/         # Email.vo.ts, Password.vo.ts
│   │   │   ├── repositories/          # IUserRepository.interface.ts (port)
│   │   │   └── events/                # UserCreatedEvent, UserUpdatedEvent
│   │   ├── application/               # Application layer
│   │   │   ├── use-cases/             # CreateUserUseCase, GetUserUseCase
│   │   │   ├── dtos/                  # CreateUserDto, UpdateUserDto
│   │   │   └── ports/                 # Additional port interfaces if needed
│   │   ├── infrastructure/            # Framework & external dependencies
│   │   │   ├── persistence/           # TypeORM entities, repositories
│   │   │   │   ├── user.orm-entity.ts # TypeORM entity (maps to domain)
│   │   │   │   └── user.repository.ts # Implements IUserRepository
│   │   │   ├── cache/                 # UserCacheService (Redis caching)
│   │   │   └── mappers/               # ORM <-> Domain entity mappers
│   │   ├── interface/                 # Entry points
│   │   │   ├── http/                  # REST controllers
│   │   │   │   ├── controllers/       # UserController
│   │   │   │   └── dtos/              # Request/Response DTOs with @ApiProperty
│   │   │   └── events/                # Event handlers (if consuming domain events)
│   │   └── user.module.ts             # NestJS module definition
│   │
│   ├── auth/                          # Authentication module (JWT + Google OAuth)
│   │   ├── domain/                    # Session entity, AuthService (domain)
│   │   ├── application/               # LoginUseCase, RefreshTokenUseCase
│   │   ├── infrastructure/            # JWT strategy, Google OAuth strategy
│   │   ├── interface/                 # AuthController, JwtGuard
│   │   └── auth.module.ts
│   │
│   ├── post/                          # Sample aggregate root module
│   │   ├── domain/                    # Post aggregate, Comment entity
│   │   │   ├── aggregates/            # Post.aggregate.ts
│   │   │   ├── entities/              # Comment.entity.ts
│   │   │   ├── events/                # PostPublishedEvent
│   │   │   └── repositories/          # IPostRepository
│   │   ├── application/               # PublishPostUseCase (triggers events)
│   │   ├── infrastructure/            # PostRepository (with outbox integration)
│   │   └── interface/                 # PostController
│   │
│   └── notification/                  # Sample WebSocket module
│       ├── domain/                    # Notification entity
│       ├── application/               # SendNotificationUseCase
│       ├── infrastructure/            # NotificationRepository
│       ├── interface/
│       │   ├── websocket/             # NotificationGateway (Socket.IO)
│       │   └── http/                  # NotificationController (REST fallback)
│       └── notification.module.ts
│
├── shared/                            # Shared infrastructure modules
│   ├── config/                        # Configuration module
│   │   ├── config.module.ts
│   │   ├── config.service.ts
│   │   └── validation/                # Environment validation schemas
│   │
│   ├── database/                      # Database connection & base classes
│   │   ├── database.module.ts
│   │   ├── database.config.ts
│   │   ├── migrations/                # TypeORM migrations
│   │   └── base/                      # Base repository interfaces
│   │
│   ├── cache/                         # Redis cache module
│   │   ├── cache.module.ts
│   │   ├── cache.service.ts
│   │   └── decorators/                # @Cacheable decorator
│   │
│   ├── messaging/                     # Kafka + BullMQ modules
│   │   ├── kafka/
│   │   │   ├── kafka.module.ts
│   │   │   ├── kafka.service.ts
│   │   │   └── producers/             # Event producers
│   │   └── bullmq/
│   │       ├── bullmq.module.ts
│   │       ├── queue.service.ts
│   │       └── processors/            # Job processors
│   │
│   ├── websocket/                     # WebSocket infrastructure
│   │   ├── websocket.module.ts
│   │   ├── websocket.adapter.ts       # Redis adapter for multi-instance
│   │   └── decorators/                # @WebSocketGateway helpers
│   │
│   ├── logger/                        # Logging module
│   │   ├── logger.module.ts
│   │   └── logger.service.ts          # Structured logging with correlation IDs
│   │
│   ├── i18n/                          # Internationalization
│   │   ├── i18n.module.ts
│   │   └── translations/              # Language files
│   │
│   ├── storage/                       # File storage abstraction
│   │   ├── storage.module.ts
│   │   └── providers/                 # Local, S3, etc.
│   │
│   └── domain-events/                 # Transactional Outbox implementation
│       ├── domain-events.module.ts
│       ├── outbox/
│       │   ├── outbox.entity.ts       # DomainEventOutbox table
│       │   ├── outbox.repository.ts
│       │   └── outbox.processor.ts    # Background worker for publishing
│       └── decorators/                # @DomainEvent decorator
│
├── common/                            # Common utilities (cross-cutting)
│   ├── decorators/                    # @CurrentUser, @Public, etc.
│   ├── filters/                       # Global exception filters
│   ├── guards/                        # JwtAuthGuard, RolesGuard
│   ├── interceptors/                  # LoggingInterceptor, TransformInterceptor
│   ├── pipes/                         # ValidationPipe configuration
│   ├── middleware/                    # RequestIdMiddleware, RateLimitMiddleware
│   └── types/                         # Shared TypeScript types/interfaces
│
├── app.module.ts                      # Root application module
└── main.ts                            # Application entry point (Swagger setup here)

test/
├── unit/                              # Unit tests (domain/application)
│   ├── user/
│   │   ├── domain/                    # User.entity.spec.ts
│   │   └── application/               # CreateUserUseCase.spec.ts
│   └── post/
│       └── domain/                    # Post.aggregate.spec.ts
│
├── integration/                       # Integration tests (repositories)
│   ├── user/
│   │   └── infrastructure/            # UserRepository.integration.spec.ts
│   └── outbox/
│       └── outbox.processor.integration.spec.ts
│
└── e2e/                              # End-to-end tests (API flows)
    ├── user.e2e-spec.ts              # User CRUD flows
    ├── auth.e2e-spec.ts              # Authentication flows
    ├── websocket.e2e-spec.ts         # WebSocket communication
    └── helpers/                       # Test helpers, fixtures

docker/                                # Docker configuration
├── Dockerfile                         # Production image
├── Dockerfile.dev                     # Development image
└── docker-compose.yml                 # Local development stack
    ├── postgres                       # PostgreSQL 18+
    ├── redis                          # Redis 7.x
    ├── kafka                          # Kafka + Zookeeper
    └── app                            # NestJS application

.husky/                                # Git hooks
├── pre-commit                         # Runs lint-staged
└── commit-msg                         # Enforces conventional commits

config/                                # Configuration files
├── tsconfig.json                      # TypeScript configuration (strict mode)
├── .eslintrc.js                       # ESLint configuration
├── .prettierrc                        # Prettier configuration
├── jest.config.js                     # Jest configuration
└── .env.example                       # Environment variables template

docs/                                  # Documentation
├── architecture.md                    # Architecture overview
├── getting-started.md                 # Quickstart guide
├── testing.md                         # Testing guide
└── deployment.md                      # Deployment guide
```

**Structure Decision**:

This boilerplate structure demonstrates:

1. **Clean Architecture Layers**: Each feature module (user, auth, post, notification) has all 4 layers
2. **Shared Infrastructure**: Common concerns (config, database, cache, messaging, websocket, logger) are extracted to shared modules
3. **Transactional Outbox**: Implemented in `shared/domain-events/` as a reusable pattern
4. **Sample Modules**: User (basic CRUD), Auth (JWT + OAuth), Post (aggregate with events), Notification (WebSocket)
5. **Testing Pyramid**: Separate folders for unit, integration, and E2E tests matching src structure
6. **Developer Tooling**: Husky hooks, ESLint/Prettier, Docker setup, comprehensive config files
7. **Documentation**: Architecture guides and quickstart documentation

New features can be added as modules following the same 4-layer pattern without modifying core/shared code.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**No violations detected.** All constitutional principles are satisfied by this implementation plan.

This boilerplate is specifically designed to enforce the constitution, so all architectural decisions align with the defined principles.
