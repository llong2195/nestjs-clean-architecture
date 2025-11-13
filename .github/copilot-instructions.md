# clean-architecture Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-11-11

## Active Technologies

- **Language**: TypeScript 5.x (strict mode enabled)
- **Runtime**: Node.js 22+ (LTS)
- **Framework**: NestJS 11.x
- **Package Manager**: pnpm 10.x+ (REQUIRED)
- **Database**: PostgreSQL 18+ with TypeORM 0.3.x
- **Cache**: Redis 7.x
- **Message Queue**: Kafka (KafkaJS) + BullMQ
- **WebSocket**: Socket.IO with Redis adapter
- **Testing**: Jest 29.x + Supertest
- **API Docs**: @nestjs/swagger (OpenAPI 3.0)
- **Validation**: class-validator + class-transformer

## Architecture Principles

This project follows **Clean Architecture** with **Domain-Driven Design (DDD)** patterns:

### 4-Layer Architecture

```text
┌─────────────────────────────────────────┐
│  Interface Layer (Controllers, Gateways)│  ← Entry points (HTTP, WebSocket, CLI)
├─────────────────────────────────────────┤
│  Infrastructure Layer (TypeORM, Redis)  │  ← Framework implementations
├─────────────────────────────────────────┤
│  Application Layer (Use Cases, DTOs)    │  ← Business orchestration
├─────────────────────────────────────────┤
│  Domain Layer (Entities, Value Objects) │  ← Pure business logic (framework-agnostic)
└─────────────────────────────────────────┘
```

**Dependency Rule**: Inner layers NEVER depend on outer layers.

### Module Structure

Each feature module MUST follow this structure:

```text
src/modules/{feature}/
├── domain/              # Pure business logic (NO NestJS decorators)
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

## Project Structure

```text
src/
├── modules/                    # Feature modules
│   ├── user/                   # Sample: Authentication & user management
│   ├── auth/                   # Sample: JWT + Google OAuth
│   ├── post/                   # Sample: Aggregate root with events
│   └── notification/           # Sample: WebSocket notifications
├── shared/                     # Shared infrastructure
│   ├── config/                 # Environment configuration + Joi validation
│   ├── database/               # TypeORM connection + migrations
│   ├── cache/                  # Redis cache module
│   ├── messaging/              # Kafka + BullMQ modules
│   ├── websocket/              # Socket.IO Redis adapter
│   ├── logger/                 # Structured logging with correlation IDs
│   ├── i18n/                   # Internationalization (EN, VI, JA)
│   ├── storage/                # File storage abstraction (local/S3)
│   └── domain-events/          # Transactional Outbox pattern
├── common/                     # Cross-cutting concerns
│   ├── decorators/             # @CurrentUser, @Public, @Roles
│   ├── filters/                # Global exception filters
│   ├── guards/                 # JwtAuthGuard, RolesGuard
│   ├── interceptors/           # Logging, transformation
│   ├── pipes/                  # Validation pipes
│   └── middleware/             # Request ID, rate limiting
├── app.module.ts
└── main.ts                     # Swagger setup here

test/
├── unit/                       # Domain & application tests
├── integration/                # Repository & infrastructure tests
└── e2e/                        # End-to-end API tests
```

## Naming Conventions

### Files & Folders

- **Folders**: `kebab-case` (e.g., `user-management/`, `order-processing/`)
- **Classes**: `PascalCase` (e.g., `CreateUserUseCase`, `UserRepository`)
- **Files**: Match class names (e.g., `create-user.use-case.ts`, `user.repository.ts`)
- **Interfaces**: Prefix with `I` (e.g., `IUserRepository`)

### Database

- **Tables**: `snake_case`, singular or plural based on convention (e.g., `users`, `posts`)
- **Columns**: `snake_case` (e.g., `user_name`, `created_at`, `post_id`)
- **Indexes**: `idx_{table}_{column}` (e.g., `idx_users_email`)
- **Foreign Keys**: `fk_{table}_{ref_table}` (e.g., `fk_posts_author`)

### TypeORM Mapping

```typescript
@Entity({ name: "users" })
export class UserOrmEntity {
  @Column({ name: "user_name" })
  userName: string; // camelCase in TypeScript

  @Column({ name: "created_at" })
  createdAt: Date;
}
```

## Critical Rules

### 1. Database Design

- ✅ **DO**: Use `snake_case` for ALL table and column names
- ✅ **DO**: Create explicit junction tables (e.g., `post_tags`, `conversation_participants`)
- ❌ **DON'T**: Use TypeORM's `@ManyToMany` decorator
- ❌ **DON'T**: Use camelCase in database schema

### 2. Domain Layer Purity

- ✅ **DO**: Keep domain layer framework-agnostic (pure TypeScript)
- ✅ **DO**: Use factory methods for entity creation
- ❌ **DON'T**: Import NestJS decorators in domain layer
- ❌ **DON'T**: Import TypeORM decorators in domain entities

### 3. Authentication

- ✅ **DO**: Use pure NestJS guards (@nestjs/jwt)
- ✅ **DO**: Implement custom JWT validation logic
- ❌ **DON'T**: Use Passport.js library
- ❌ **DON'T**: Store tokens in plaintext (use bcrypt hashing)

### 4. API Design

- ✅ **DO**: Use standardized response format:
  ```typescript
  {
    status: 'success' | 'error',
    data: { /* payload */ },
    meta: { timestamp: string, requestId: string }
  }
  ```
- ✅ **DO**: Add Swagger decorators (@ApiTags, @ApiOperation, @ApiProperty)
- ✅ **DO**: Validate all inputs with class-validator
- ❌ **DON'T**: Return raw entities (use DTOs)

### 5. Testing

- ✅ **DO**: Write unit tests for domain logic (>80% coverage)
- ✅ **DO**: Mock external dependencies in unit tests
- ✅ **DO**: Use test containers for integration tests
- ❌ **DON'T**: Share state between tests

### 6. Event-Driven Architecture

- ✅ **DO**: Use Transactional Outbox pattern for reliability
- ✅ **DO**: Save events to `domain_event_outbox` table in same transaction
- ✅ **DO**: Poll outbox with BullMQ worker to publish to Kafka
- ❌ **DON'T**: Publish events directly to Kafka from use cases

## Commands

```bash
# Package management (MUST use pnpm)
pnpm install
pnpm add <package>
pnpm remove <package>

# Development
pnpm start:dev          # Start with hot-reload
pnpm build              # Build for production
pnpm start:prod         # Start production server

# Testing
pnpm test               # Run unit tests
pnpm test:e2e           # Run E2E tests
pnpm test:cov           # Run with coverage

# Database
pnpm migration:generate src/shared/database/migrations/MigrationName
pnpm migration:run      # Run pending migrations
pnpm migration:revert   # Revert last migration

# Code Quality
pnpm lint               # Run ESLint
pnpm lint:fix           # Auto-fix linting errors
pnpm format             # Format with Prettier

# Docker
docker-compose up -d    # Start all services (PostgreSQL, Redis, Kafka)
docker-compose down     # Stop all services
docker-compose logs -f  # View logs
```

## Code Style

### TypeScript Configuration

- **strict**: `true` (strictNullChecks, noImplicitAny, etc.)
- **target**: ES2022
- **moduleResolution**: Node
- **experimentalDecorators**: `true` (for NestJS)
- **emitDecoratorMetadata**: `true`

### ESLint Rules

- No `any` types (except well-documented edge cases)
- No circular dependencies (enforced by madge)
- Prefer `const` over `let`
- Use explicit return types on public methods
- Maximum file length: 400 lines

### Domain Entity Example

```typescript
// ✅ CORRECT: Pure domain entity
export class User {
  private constructor(
    public readonly id: string,
    private _email: Email,
    private _password: Password,
    private _name: string
  ) {}

  static create(email: string, password: string, name: string): User {
    return new User(
      uuid(),
      Email.create(email),
      Password.create(password),
      name
    );
  }

  updateProfile(name: string): void {
    this._name = name;
    this.addDomainEvent(new UserProfileUpdatedEvent(this.id));
  }
}

// ❌ WRONG: TypeORM decorators in domain
@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;
  // This violates Clean Architecture!
}
```

### Repository Pattern

```typescript
// Domain layer: Interface (port)
export interface IUserRepository {
  save(user: User): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
}

// Infrastructure layer: Implementation (adapter)
@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly ormRepo: Repository<UserOrmEntity>,
    private readonly mapper: UserMapper
  ) {}

  async save(user: User): Promise<User> {
    const ormEntity = this.mapper.toOrm(user);
    const saved = await this.ormRepo.save(ormEntity);
    return this.mapper.toDomain(saved);
  }
}
```

## Recent Changes

- 2025-11-11: Initial boilerplate setup with Clean Architecture
- 2025-11-11: Added sample modules (user, auth, post, notification)
- 2025-11-11: Configured Transactional Outbox pattern
- 2025-11-11: Set up JWT authentication without Passport.js
- 2025-11-11: Added Swagger/OpenAPI documentation

## Quick Reference

### Create New Module

```bash
# Generate module structure manually following 4-layer pattern
mkdir -p src/modules/product/{domain,application,infrastructure,interface}
mkdir -p src/modules/product/domain/{entities,value-objects,repositories,events}
mkdir -p src/modules/product/application/{use-cases,dtos}
mkdir -p src/modules/product/infrastructure/{persistence,cache}
mkdir -p src/modules/product/interface/http/{controllers,dtos}
```

### Database Entity Checklist

- [ ] Table name is snake_case
- [ ] All columns are snake_case
- [ ] Timestamps: created_at, updated_at
- [ ] Soft delete: deleted_at (nullable)
- [ ] Foreign keys have indexes
- [ ] Unique constraints defined
- [ ] No @ManyToMany (use junction tables)

### API Endpoint Checklist

- [ ] Controller has @ApiTags decorator
- [ ] Method has @ApiOperation with summary
- [ ] DTOs have @ApiProperty with examples
- [ ] All status codes documented with @ApiResponse
- [ ] Input validation with class-validator
- [ ] Protected routes use @UseGuards(JwtAuthGuard)
- [ ] Returns standardized response format

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
