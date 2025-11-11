# Research: NestJS Clean Architecture Boilerplate

**Feature**: 001-clean-architecture-boilerplate  
**Date**: 2025-11-11  
**Phase**: Phase 0 - Research & Design Decisions

This document consolidates research findings and technical decisions for building the NestJS Clean Architecture boilerplate.

---

## 1. Clean Architecture Implementation in NestJS

### Decision: 4-Layer Architecture with Domain-Driven Design

**Rationale**:

- **Domain Layer**: Pure business logic isolated from framework concerns enables framework independence and easier testing
- **Application Layer**: Use case orchestration provides clear API for business operations
- **Infrastructure Layer**: Framework-specific implementations (TypeORM, Redis clients) are isolated and replaceable
- **Interface Layer**: Multiple entry points (HTTP, WebSocket, CLI) can coexist without coupling

**Alternatives Considered**:

1. **Traditional 3-tier (Controller-Service-Repository)**: Rejected because it couples business logic to framework and doesn't enforce dependency inversion
2. **Hexagonal Architecture (Ports & Adapters)**: Similar to Clean Architecture but less prescriptive about layers. Chose Clean Architecture for clearer layer boundaries
3. **Vertical Slice Architecture**: Good for feature isolation but less structured than Clean Architecture for large teams

**Best Practices**:

- Domain entities should NOT be TypeORM entities - use separate ORM entities with mappers
- Repository interfaces (ports) defined in domain, implemented in infrastructure
- Use NestJS dependency injection to wire ports to adapters
- Domain events dispatched from aggregates, handled by infrastructure layer

**References**:

- Clean Architecture book by Robert C. Martin
- NestJS documentation on modular architecture
- DDD patterns in TypeScript/NestJS community

---

## 2. Transactional Outbox Pattern

### Decision: Implement outbox pattern using PostgreSQL table + background worker

**Rationale**:

- **Problem**: Domain events must be published reliably when aggregate state changes, but external message bus (Kafka) can fail independently of database
- **Solution**: Save events to `domain_event_outbox` table in same transaction as aggregate changes, then background worker polls and publishes to Kafka
- **Guarantee**: Atomic database write + event persistence ensures no lost events even if Kafka is temporarily down

**Alternatives Considered**:

1. **Two-Phase Commit (2PC)**: Rejected due to complexity and poor performance (requires distributed transaction coordinator)
2. **Direct Kafka publish in transaction**: Rejected because Kafka doesn't support transactions with PostgreSQL
3. **Change Data Capture (CDC)**: Considered (e.g., Debezium) but adds infrastructure complexity; outbox pattern is simpler for this boilerplate

**Implementation Details**:

- **Outbox Table Schema**:
  ```sql
  CREATE TABLE domain_event_outbox (
    id UUID PRIMARY KEY,
    aggregate_id UUID NOT NULL,
    aggregate_type VARCHAR(255) NOT NULL,
    event_type VARCHAR(255) NOT NULL,
    event_data JSONB NOT NULL,
    occurred_at TIMESTAMP NOT NULL,
    published_at TIMESTAMP NULL,
    retry_count INTEGER DEFAULT 0,
    INDEX idx_outbox_unpublished (published_at, occurred_at) WHERE published_at IS NULL
  );
  ```
- **Background Worker**: BullMQ job that polls outbox every 5 seconds, publishes to Kafka, marks as published
- **Retry Strategy**: Exponential backoff for failed publishes (1s, 2s, 4s, 8s, 16s max)
- **Cleanup**: Soft delete or archive events older than 30 days

**Best Practices**:

- Use partial index on `published_at IS NULL` for efficient polling
- Include `aggregate_id` and `aggregate_type` for event sourcing queries
- Store event data as JSONB for flexibility
- Monitor outbox lag (time between `occurred_at` and `published_at`)

**References**:

- Microservices Patterns by Chris Richardson (Chapter 3: Transactional Messaging)
- NestJS CQRS module examples
- Kafka documentation on idempotent producers

---

## 3. Authentication Without Passport.js

### Decision: Pure NestJS authentication using @nestjs/jwt + custom guards

**Rationale**:

- **Why avoid Passport**: Adds abstraction layer (Strategy pattern) that obscures authentication flow and makes customization harder
- **NestJS Native Approach**: Use `@nestjs/jwt` for token generation/validation with custom guards for route protection
- **Google OAuth**: Use direct OAuth2 flow with `axios` instead of `passport-google-oauth20`

**Alternatives Considered**:

1. **Passport.js with strategies**: Rejected due to unnecessary complexity and less control
2. **Manual JWT implementation**: Rejected because `@nestjs/jwt` is well-tested and maintained
3. **Third-party auth service (Auth0, Cognito)**: Out of scope for boilerplate (should be easy to integrate if needed)

**Implementation Details**:

**JWT Authentication Flow**:

1. User logs in with email/password → validate credentials
2. Generate JWT access token (15min expiry) + refresh token (7 days)
3. Store refresh token in database (`sessions` table) with hashed value
4. Return both tokens to client
5. Client sends access token in `Authorization: Bearer <token>` header
6. `JwtAuthGuard` validates token and extracts user payload
7. Refresh endpoint exchanges valid refresh token for new access token

**Google OAuth Flow**:

1. Frontend redirects to `/auth/google` → backend redirects to Google OAuth consent
2. Google redirects to `/auth/google/callback` with authorization code
3. Backend exchanges code for Google access token
4. Fetch user profile from Google API
5. Find or create user in database
6. Generate JWT tokens same as email/password flow

**Guards Implementation**:

```typescript
// JwtAuthGuard: Validates JWT token and attaches user to request
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) throw new UnauthorizedException();

    try {
      const payload = await this.jwtService.verifyAsync(token);
      request.user = payload; // Attach user to request
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}

// RolesGuard: Checks user has required role
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get("roles", context.getHandler());
    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}
```

**Best Practices**:

- Hash refresh tokens before storing in database (use bcrypt)
- Implement token rotation: issue new refresh token on each refresh
- Add `@Public()` decorator for routes that don't require authentication
- Store JWT secret in environment variables
- Use short-lived access tokens (15min) to limit exposure

**References**:

- NestJS authentication documentation
- JWT RFC 7519 specification
- Google OAuth 2.0 documentation

---

## 4. WebSocket Scaling with Redis Pub/Sub

### Decision: Use Socket.IO with Redis adapter for multi-instance scaling

**Rationale**:

- **Problem**: WebSocket connections are stateful - client connects to specific server instance
- **Solution**: Redis pub/sub broadcasts messages across all instances, ensuring all clients receive updates regardless of which instance they're connected to
- **Socket.IO Adapter**: `@socket.io/redis-adapter` handles Redis pub/sub automatically

**Alternatives Considered**:

1. **Sticky sessions (load balancer)**: Rejected because it doesn't solve broadcasting across instances
2. **Native WebSocket with custom Redis logic**: Rejected because Socket.IO provides robust fallbacks and reconnection
3. **Kafka for WebSocket events**: Overkill for simple broadcasting, adds latency

**Implementation Details**:

```typescript
// WebSocket adapter configuration
import { IoAdapter } from "@nestjs/platform-socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;

  async connectToRedis(): Promise<void> {
    const pubClient = createClient({ url: "redis://localhost:6379" });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: any): any {
    const server = super.createIOServer(port, options);
    server.adapter(this.adapterConstructor);
    return server;
  }
}
```

**Best Practices**:

- Use separate Redis clients for pub and sub to avoid blocking
- Configure connection pooling for Redis clients
- Add heartbeat/ping for WebSocket connection health
- Implement reconnection logic on client side
- Use namespaces to separate different WebSocket features

**References**:

- Socket.IO documentation on scaling
- Redis pub/sub patterns
- NestJS WebSocket gateways documentation

---

## 5. Database Schema Design: snake_case vs camelCase

### Decision: Use snake_case for all database columns, camelCase in TypeScript

**Rationale**:

- **PostgreSQL Convention**: snake_case is standard in SQL databases (e.g., `created_at`, `user_name`)
- **TypeScript Convention**: camelCase is standard in JavaScript/TypeScript (e.g., `createdAt`, `userName`)
- **Mapping**: TypeORM `@Column({ name: 'snake_case' })` decorator handles automatic conversion

**Alternatives Considered**:

1. **camelCase everywhere**: Rejected because it violates SQL naming conventions
2. **PascalCase for tables**: Rejected for consistency (tables should match column style)
3. **Auto-generate column names**: TypeORM can do this but makes SQL queries harder to read

**Implementation Example**:

```typescript
// Domain entity (pure TypeScript)
export class User {
  id: string;
  userName: string;
  createdAt: Date;
}

// TypeORM entity (infrastructure layer)
@Entity({ name: "users" })
export class UserOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "user_name" })
  userName: string;

  @Column({ name: "created_at" })
  createdAt: Date;
}
```

**Best Practices**:

- Always use `@Column({ name: 'snake_case' })` for explicit mapping
- Keep domain entities separate from ORM entities
- Use mappers to convert between domain and ORM entities
- Document naming convention in project README

**References**:

- PostgreSQL naming conventions
- TypeORM documentation on column options
- Clean Architecture guidelines on persistence ignorance

---

## 6. Junction Tables Instead of @ManyToMany

### Decision: Explicitly define junction/pivot tables as entities, avoid TypeORM @ManyToMany

**Rationale**:

- **Control**: Explicit junction tables allow adding metadata (e.g., `created_at`, `role` in user-conversation)
- **Visibility**: Junction tables are visible in database schema and migration files
- **Query Flexibility**: Easier to query and index junction tables directly
- **Clean Architecture**: Explicit entities align better with domain modeling

**Alternatives Considered**:

1. **@ManyToMany decorator**: Rejected because it hides junction table and limits control
2. **Graph database**: Out of scope for this boilerplate (PostgreSQL is sufficient)

**Implementation Example**:

```typescript
// Bad: @ManyToMany hides junction table
@Entity()
class Post {
  @ManyToMany(() => Tag)
  @JoinTable()
  tags: Tag[];
}

// Good: Explicit junction table
@Entity({ name: "post_tags" })
class PostTag {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "post_id" })
  postId: string;

  @Column({ name: "tag_id" })
  tagId: string;

  @Column({ name: "created_at" })
  createdAt: Date;

  @ManyToOne(() => Post, (post) => post.postTags)
  @JoinColumn({ name: "post_id" })
  post: Post;

  @ManyToOne(() => Tag, (tag) => tag.postTags)
  @JoinColumn({ name: "tag_id" })
  tag: Tag;
}
```

**Best Practices**:

- Name junction tables as `{table1}_{table2}` (e.g., `post_tags`, `user_roles`)
- Add `created_at` timestamp for audit purposes
- Add unique constraint on foreign key pair to prevent duplicates
- Use `@ManyToOne` on both sides of junction table for proper relationships

**References**:

- TypeORM relationships documentation
- Database normalization best practices
- DDD aggregate design patterns

---

## 7. Testing Strategy: Unit, Integration, E2E

### Decision: Three-tier testing pyramid with Jest + Supertest

**Rationale**:

- **Unit Tests**: Fast, isolated tests for domain entities and use cases (no database, no HTTP)
- **Integration Tests**: Test repository implementations against real database (use test containers or in-memory DB)
- **E2E Tests**: Test complete HTTP/WebSocket flows with full application context

**Alternatives Considered**:

1. **Only E2E tests**: Rejected because they're slow and hard to debug
2. **Only unit tests**: Rejected because they don't catch integration issues
3. **Different test frameworks**: Jest is standard for TypeScript projects

**Implementation Details**:

**Unit Test Example**:

```typescript
describe("Unit - CreateUserUseCase", () => {
  let useCase: CreateUserUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    mockUserRepository = {
      save: jest.fn(),
      findByEmail: jest.fn(),
    };
    useCase = new CreateUserUseCase(mockUserRepository);
  });

  it("should create user when email is unique", async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockUserRepository.save.mockResolvedValue(mockUser);

    const result = await useCase.execute({ email: "test@test.com" });

    expect(result).toBeDefined();
    expect(mockUserRepository.save).toHaveBeenCalled();
  });
});
```

**Integration Test Example**:

```typescript
describe("Integration - UserRepository", () => {
  let repository: UserRepository;
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = await new DataSource({
      type: "postgres",
      host: "localhost",
      port: 5433, // Test database
      database: "test_db",
      entities: [UserOrmEntity],
      synchronize: true,
    }).initialize();
    repository = new UserRepository(dataSource);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it("should save and retrieve user", async () => {
    const user = new User("test@test.com", "Test User");
    await repository.save(user);

    const found = await repository.findByEmail("test@test.com");
    expect(found).toBeDefined();
    expect(found.userName).toBe("Test User");
  });
});
```

**E2E Test Example**:

```typescript
describe("E2E - User API", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("POST /users - should create user", () => {
    return request(app.getHttpServer())
      .post("/users")
      .send({ email: "test@test.com", name: "Test User" })
      .expect(201)
      .expect((res) => {
        expect(res.body.data.id).toBeDefined();
      });
  });
});
```

**Best Practices**:

- Run unit tests on every commit (fast feedback)
- Run integration tests before merge (catch DB issues)
- Run E2E tests in CI pipeline (full validation)
- Use test containers for integration tests (Docker-based real databases)
- Mock external services (Kafka, third-party APIs) in tests
- Aim for >80% coverage on domain and application layers

**References**:

- Jest documentation
- NestJS testing guide
- Test Driven Development (TDD) best practices

---

## 8. Environment Configuration & Validation

### Decision: Use @nestjs/config with Joi schema validation

**Rationale**:

- **Type Safety**: Environment variables validated at startup
- **Documentation**: Joi schema serves as documentation for required config
- **Fail Fast**: Application won't start with invalid configuration

**Alternatives Considered**:

1. **dotenv only**: Rejected because no validation or type safety
2. **Custom validation**: Rejected because Joi is well-tested and feature-rich
3. **Config files (JSON/YAML)**: Rejected because environment variables are more secure for secrets

**Implementation Example**:

```typescript
// config.validation.ts
import * as Joi from "joi";

export const configValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "production", "test", "staging")
    .default("development"),
  PORT: Joi.number().default(3000),

  DATABASE_HOST: Joi.string().required(),
  DATABASE_PORT: Joi.number().default(5432),
  DATABASE_USERNAME: Joi.string().required(),
  DATABASE_PASSWORD: Joi.string().required(),
  DATABASE_NAME: Joi.string().required(),

  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().default(6379),

  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRATION: Joi.string().default("15m"),

  GOOGLE_CLIENT_ID: Joi.string().when("NODE_ENV", {
    is: "production",
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  GOOGLE_CLIENT_SECRET: Joi.string().when("NODE_ENV", {
    is: "production",
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
});

// config.module.ts
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: configValidationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),
  ],
})
export class AppConfigModule {}
```

**Best Practices**:

- Validate all environment variables at startup
- Provide sensible defaults for non-secret values
- Use `.env.example` to document required variables
- Never commit `.env` files to git
- Use different configs for dev/staging/prod
- Inject `ConfigService` instead of accessing `process.env` directly

**References**:

- NestJS configuration documentation
- Joi schema validation library
- 12-factor app configuration guidelines

---

## 9. Docker & Development Environment

### Decision: Docker Compose for local development with hot-reload

**Rationale**:

- **Consistency**: Same PostgreSQL, Redis, Kafka versions as production
- **Isolation**: Dependencies don't pollute host machine
- **Onboarding**: New developers run `docker-compose up` and start coding

**Implementation Example**:

```yaml
# docker-compose.yml
version: "3.8"

services:
  postgres:
    image: postgres:18-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: nest_clean_arch
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  zookeeper:
    image: confluentinc/cp-zookeeper:latest
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181

  kafka:
    image: confluentinc/cp-kafka:latest
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092

  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      - postgres
      - redis
      - kafka
    environment:
      DATABASE_HOST: postgres
      REDIS_HOST: redis
      KAFKA_BROKERS: kafka:9092

volumes:
  postgres_data:
  redis_data:
```

**Best Practices**:

- Use Alpine images for smaller size
- Mount source code as volume for hot-reload
- Use named volumes for data persistence
- Match versions to production environment
- Include health checks for services
- Document port mappings in README

**References**:

- Docker Compose documentation
- NestJS Docker deployment guide
- Production-grade Docker best practices

---

## 10. API Documentation with Swagger

### Decision: Auto-generate OpenAPI 3.0 spec using @nestjs/swagger decorators

**Rationale**:

- **Single Source of Truth**: Documentation generated from code
- **Always Updated**: Can't get out of sync with implementation
- **Interactive Testing**: Swagger UI allows testing endpoints in browser
- **Client SDK Generation**: OpenAPI spec can generate TypeScript/Python/etc. clients

**Implementation Example**:

```typescript
// main.ts - Swagger setup
const config = new DocumentBuilder()
  .setTitle("NestJS Clean Architecture API")
  .setDescription("Production-ready backend boilerplate")
  .setVersion("1.0")
  .addBearerAuth()
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup("api/docs", app, document);

// user.controller.ts - Decorator examples
@ApiTags("users")
@Controller("users")
export class UserController {
  @Post()
  @ApiOperation({ summary: "Create a new user" })
  @ApiResponse({
    status: 201,
    description: "User created",
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: "Invalid input" })
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }
}

// create-user.dto.ts - DTO with Swagger decorators
export class CreateUserDto {
  @ApiProperty({
    example: "test@example.com",
    description: "User email address",
  })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "John Doe", description: "User full name" })
  @IsString()
  @MinLength(3)
  name: string;
}
```

**Best Practices**:

- Add `@ApiProperty` to all DTO fields with examples
- Use `@ApiResponse` for all status codes (success + errors)
- Group endpoints with `@ApiTags`
- Enable Swagger only in dev/staging (disable in production for security)
- Export OpenAPI JSON for client SDK generation

**References**:

- NestJS OpenAPI documentation
- Swagger/OpenAPI specification
- Best practices for API documentation

---

## Summary of Key Decisions

| Topic             | Decision                                 | Primary Benefit                                      |
| ----------------- | ---------------------------------------- | ---------------------------------------------------- |
| Architecture      | 4-layer Clean Architecture               | Testability, maintainability, framework independence |
| Outbox Pattern    | PostgreSQL table + BullMQ worker         | Reliable event publishing, atomic guarantees         |
| Authentication    | Pure NestJS (no Passport)                | Simplicity, control, easier debugging                |
| WebSocket Scaling | Socket.IO + Redis adapter                | Multi-instance support, horizontal scaling           |
| Database Naming   | snake_case columns, camelCase TypeScript | Convention adherence, readability                    |
| Relationships     | Explicit junction tables                 | Control, visibility, flexibility                     |
| Testing           | Jest unit/integration/E2E                | Comprehensive coverage, fast feedback                |
| Configuration     | @nestjs/config + Joi validation          | Type safety, fail-fast startup                       |
| Development       | Docker Compose                           | Environment consistency, easy onboarding             |
| Documentation     | @nestjs/swagger auto-gen                 | Always up-to-date, interactive testing               |

All decisions align with the project constitution and support the goal of creating a production-ready, maintainable boilerplate.
