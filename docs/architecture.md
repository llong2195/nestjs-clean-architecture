# Clean Architecture & DDD Guide

This document explains the architectural principles, patterns, and structure of the NestJS Clean Architecture Boilerplate.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Clean Architecture Layers](#clean-architecture-layers)
- [Domain-Driven Design](#domain-driven-design)
- [Module Structure](#module-structure)
- [Dependency Rules](#dependency-rules)
- [Design Patterns](#design-patterns)
- [Best Practices](#best-practices)

## Architecture Overview

This project implements **Clean Architecture** (Uncle Bob) combined with **Domain-Driven Design (DDD)** principles to create a maintainable, testable, and scalable application.

### Core Principles

1. **Independence of Frameworks**: Business logic doesn't depend on NestJS
2. **Testability**: Business logic can be tested without UI, database, or external services
3. **Independence of UI**: Can swap REST for GraphQL without changing business logic
4. **Independence of Database**: Can swap PostgreSQL for MongoDB without changing domain
5. **Independence of External Services**: Business logic doesn't know about external APIs

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                   Interface Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Controllers  │  │  Gateways    │  │  CLI/Jobs    │  │
│  │  (HTTP)      │  │ (WebSocket)  │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓ ↑
┌─────────────────────────────────────────────────────────┐
│               Infrastructure Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ TypeORM      │  │    Redis     │  │    Kafka     │  │
│  │ Repositories │  │    Cache     │  │  Messaging   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  External    │  │   Mappers    │  │   Config     │  │
│  │   Services   │  │ (ORM↔Domain) │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓ ↑
┌─────────────────────────────────────────────────────────┐
│                Application Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Use Cases   │  │     DTOs     │  │    Ports     │  │
│  │ (Business    │  │ (Request/    │  │ (Interfaces) │  │
│  │  Logic)      │  │  Response)   │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓ ↑
┌─────────────────────────────────────────────────────────┐
│                   Domain Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Entities    │  │    Value     │  │   Domain     │  │
│  │ (Aggregates) │  │   Objects    │  │   Events     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │ Repository   │  │   Business   │                    │
│  │  Interfaces  │  │    Rules     │                    │
│  └──────────────┘  └──────────────┘                    │
└─────────────────────────────────────────────────────────┘
```

## Clean Architecture Layers

### 1. Domain Layer (Core)

**Purpose**: Contains pure business logic and rules

**Characteristics**:

- Framework-agnostic (pure TypeScript)
- No external dependencies
- Innermost layer
- Most stable layer

**Components**:

#### Entities / Aggregates

Business objects with identity and lifecycle:

```typescript
// domain/entities/user.entity.ts
export class User {
  private constructor(
    public readonly id: string,
    private _email: Email,
    private _password: Password,
    private _userName: string,
    private _role: UserRole,
  ) {}

  static create(email: string, password: string, userName: string): User {
    return new User(
      uuid(),
      Email.create(email),
      Password.create(password),
      userName,
      UserRole.USER,
    );
  }

  updateProfile(userName: string): void {
    this._userName = userName;
    this.addDomainEvent(new UserProfileUpdatedEvent(this.id));
  }

  // No NestJS decorators
  // No TypeORM decorators
  // Pure business logic
}
```

#### Value Objects

Immutable objects defined by their attributes:

```typescript
// domain/value-objects/email.vo.ts
export class Email {
  private constructor(public readonly value: string) {}

  static create(email: string): Email {
    if (!this.isValid(email)) {
      throw new InvalidEmailException(email);
    }
    return new Email(email.toLowerCase());
  }

  private static isValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
```

#### Domain Events

Events that represent business occurrences:

```typescript
// domain/events/user.events.ts
export class UserCreatedEvent implements IDomainEvent {
  constructor(
    public readonly aggregateId: string,
    public readonly email: string,
    public readonly userName: string,
  ) {}

  get occurredOn(): Date {
    return new Date();
  }
}
```

#### Repository Interfaces

Contracts for data access (implementation in infrastructure):

```typescript
// domain/repositories/user.repository.interface.ts
export interface IUserRepository {
  save(user: User): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  delete(id: string): Promise<void>;
}
```

### 2. Application Layer

**Purpose**: Orchestrates business logic and use cases

**Characteristics**:

- Depends on domain layer only
- Coordinates domain objects
- Transaction boundaries
- DTO transformations

**Components**:

#### Use Cases

Application-specific business rules:

```typescript
// application/use-cases/create-user.use-case.ts
@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(dto: CreateUserDto): Promise<UserResponseDto> {
    // 1. Validate business rules
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new EmailAlreadyExistsException(dto.email);
    }

    // 2. Create domain entity
    const user = User.create(dto.email, dto.password, dto.userName);

    // 3. Persist
    const savedUser = await this.userRepository.save(user);

    // 4. Return DTO
    return UserMapper.toResponseDto(savedUser);
  }
}
```

#### DTOs (Data Transfer Objects)

Request/response data structures:

```typescript
// application/dtos/create-user.dto.ts
export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  userName: string;
}
```

#### Mappers

Convert between domain and DTOs:

```typescript
// application/mappers/user.mapper.ts
export class UserMapper {
  static toResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email.value,
      userName: user.userName,
      role: user.role.value,
      createdAt: user.createdAt,
    };
  }
}
```

### 3. Infrastructure Layer

**Purpose**: Implements technical details and external dependencies

**Characteristics**:

- Framework-specific code
- Database implementations
- External service integrations
- Adapters for ports

**Components**:

#### ORM Entities

TypeORM entities (separate from domain):

```typescript
// infrastructure/persistence/user.orm-entity.ts
@Entity({ name: 'users' })
export class UserOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'email', unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ name: 'user_name' })
  userName: string;

  @Column({ name: 'role', type: 'varchar' })
  role: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

#### Repository Implementations

Implement domain repository interfaces:

```typescript
// infrastructure/persistence/user.repository.ts
@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly ormRepository: Repository<UserOrmEntity>,
    private readonly mapper: UserOrmMapper,
  ) {}

  async save(user: User): Promise<User> {
    const ormEntity = this.mapper.toOrm(user);
    const saved = await this.ormRepository.save(ormEntity);
    return this.mapper.toDomain(saved);
  }

  async findById(id: string): Promise<User | null> {
    const ormEntity = await this.ormRepository.findOne({ where: { id } });
    return ormEntity ? this.mapper.toDomain(ormEntity) : null;
  }
}
```

#### ORM Mappers

Convert between ORM and domain entities:

```typescript
// infrastructure/persistence/mappers/user-orm.mapper.ts
@Injectable()
export class UserOrmMapper {
  toDomain(orm: UserOrmEntity): User {
    return User.reconstitute(
      orm.id,
      orm.email,
      orm.passwordHash,
      orm.userName,
      orm.role,
      orm.createdAt,
    );
  }

  toOrm(domain: User): UserOrmEntity {
    const orm = new UserOrmEntity();
    orm.id = domain.id;
    orm.email = domain.email.value;
    orm.passwordHash = domain.password.hash;
    orm.userName = domain.userName;
    orm.role = domain.role.value;
    return orm;
  }
}
```

### 4. Interface Layer

**Purpose**: Handles external communication (HTTP, WebSocket, CLI)

**Characteristics**:

- Framework adapters
- Request/response handling
- Input validation
- Error handling

**Components**:

#### Controllers

HTTP request handlers:

```typescript
// interface/http/user.controller.ts
@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly getUserUseCase: GetUserUseCase,
  ) {}

  @Post()
  @Public()
  @ApiOperation({ summary: 'Create new user' })
  @ApiResponse({ status: 201, type: UserResponseDto })
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    return this.createUserUseCase.execute(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    return this.getUserUseCase.execute(id);
  }
}
```

#### Gateways

WebSocket handlers:

```typescript
// interface/websocket/notification.gateway.ts
@WebSocketGateway()
export class NotificationGateway {
  @SubscribeMessage('subscribe')
  async handleSubscribe(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    // Handle subscription
  }
}
```

## Domain-Driven Design

### Aggregates

**Definition**: Cluster of domain objects treated as a single unit

**Example: Post Aggregate**

```typescript
// domain/aggregates/post.aggregate.ts
export class Post extends AggregateRoot {
  private _comments: Comment[] = [];
  private _tags: Tag[] = [];

  addComment(content: string, authorId: string): void {
    const comment = Comment.create(this.id, content, authorId);
    this._comments.push(comment);
    this.addDomainEvent(new CommentAddedEvent(this.id, comment.id));
  }

  publish(): void {
    if (this._status.value !== PostStatus.DRAFT) {
      throw new InvalidPostStateException('Only drafts can be published');
    }
    this._status = PostStatus.createPublished();
    this.addDomainEvent(new PostPublishedEvent(this.id, this._authorId));
  }

  // Aggregate root controls all changes to child entities
}
```

**Aggregate Rules**:

1. External objects can only reference the root by ID
2. Modifications go through the root
3. Root enforces invariants
4. Transactional boundary

### Bounded Contexts

Logical boundaries that define model scope:

```
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│  User Context   │   │  Post Context   │   │  Auth Context   │
│                 │   │                 │   │                 │
│  - User         │   │  - Post         │   │  - Session      │
│  - Profile      │   │  - Comment      │   │  - Token        │
│  - Role         │   │  - Tag          │   │  - OAuth        │
└─────────────────┘   └─────────────────┘   └─────────────────┘
```

### Ubiquitous Language

Common vocabulary shared between developers and domain experts:

- **User**: Person with account
- **Post**: Published content
- **Draft**: Unpublished post
- **Aggregate**: Consistency boundary
- **Repository**: Collection-like persistence abstraction
- **Value Object**: Immutable attribute

## Module Structure

### Standard Module Layout

```
src/modules/user/
├── domain/                    # Pure business logic
│   ├── entities/
│   │   └── user.entity.ts     # Domain entity (no decorators)
│   ├── value-objects/
│   │   ├── email.vo.ts
│   │   ├── password.vo.ts
│   │   └── user-role.vo.ts
│   ├── repositories/
│   │   └── user.repository.interface.ts  # Port
│   └── events/
│       └── user.events.ts
│
├── application/               # Use cases & orchestration
│   ├── use-cases/
│   │   ├── create-user.use-case.ts
│   │   ├── get-user.use-case.ts
│   │   ├── update-user.use-case.ts
│   │   └── delete-user.use-case.ts
│   ├── dtos/
│   │   ├── create-user.dto.ts
│   │   ├── update-user.dto.ts
│   │   └── user-response.dto.ts
│   └── mappers/
│       └── user.mapper.ts
│
├── infrastructure/            # Framework implementations
│   ├── persistence/
│   │   ├── user.orm-entity.ts        # TypeORM entity
│   │   ├── user.repository.ts        # Adapter
│   │   └── mappers/
│   │       └── user-orm.mapper.ts
│   └── cache/
│       └── user-cache.service.ts
│
├── interface/                 # Entry points
│   └── http/
│       ├── user.controller.ts
│       └── dtos/              # API-specific DTOs
│           └── ...
│
└── user.module.ts             # NestJS module
```

## Dependency Rules

### The Dependency Rule

**Dependencies point inward only:**

```
Interface Layer    →   Infrastructure Layer
                      ↓
                   Application Layer
                      ↓
                   Domain Layer (no dependencies)
```

### Dependency Inversion

Use interfaces to invert dependencies:

```typescript
// ✅ CORRECT: Use case depends on interface
export class CreateUserUseCase {
  constructor(
    @Inject('IUserRepository') // Interface, not concrete class
    private readonly userRepository: IUserRepository,
  ) {}
}

// ❌ WRONG: Use case depends on concrete implementation
export class CreateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository, // Concrete TypeORM repo
  ) {}
}
```

### Module Registration

```typescript
// user.module.ts
@Module({
  imports: [TypeOrmModule.forFeature([UserOrmEntity])],
  providers: [
    // Use cases
    CreateUserUseCase,
    GetUserUseCase,

    // Repository (bind interface to implementation)
    {
      provide: 'IUserRepository',
      useClass: UserRepository,
    },

    // Mappers
    UserMapper,
    UserOrmMapper,
  ],
  controllers: [UserController],
  exports: ['IUserRepository'],
})
export class UserModule {}
```

## Design Patterns

### 1. Repository Pattern

**Purpose**: Abstract data access

**Implementation**:

- Interface in domain layer
- Concrete class in infrastructure
- Methods return domain entities

### 2. Factory Pattern

**Purpose**: Encapsulate object creation

```typescript
export class User {
  static create(email: string, password: string, userName: string): User {
    // Validation & creation logic
    return new User(/* ... */);
  }

  static reconstitute(/* from DB */): User {
    // Rebuild from persistence
    return new User(/* ... */);
  }
}
```

### 3. Mapper Pattern

**Purpose**: Transform between layers

```typescript
export class UserMapper {
  static toResponseDto(user: User): UserResponseDto {
    /* ... */
  }
  static toEntity(dto: CreateUserDto): User {
    /* ... */
  }
}
```

### 4. Event-Driven Pattern

**Purpose**: Decouple components

```typescript
// Domain entity emits event
user.updateProfile(newName);
// Emits: UserProfileUpdatedEvent

// Event handler processes asynchronously
@Injectable()
export class UserEventHandler {
  @OnEvent('user.profile.updated')
  async handle(event: UserProfileUpdatedEvent) {
    // Send notification, update cache, etc.
  }
}
```

### 5. Transactional Outbox Pattern

**Purpose**: Ensure reliable event publishing

**Flow**:

1. Save entity + event to database (same transaction)
2. Background worker polls outbox table
3. Publish events to Kafka
4. Mark as processed

## Best Practices

### 1. Keep Domain Pure

```typescript
// ✅ GOOD
export class User {
  updateEmail(newEmail: string): void {
    this._email = Email.create(newEmail);
  }
}

// ❌ BAD
@Entity()
export class User {
  @Column()
  email: string;
}
```

### 2. Use Value Objects

```typescript
// ✅ GOOD
class User {
  private _email: Email; // Value object
}

// ❌ BAD
class User {
  private _email: string; // Primitive obsession
}
```

### 3. Validate in Domain

```typescript
// ✅ GOOD: Validation in value object
export class Email {
  static create(value: string): Email {
    if (!this.isValid(value)) {
      throw new InvalidEmailException();
    }
    return new Email(value);
  }
}

// ❌ BAD: Validation in controller
@Post()
async create(@Body() dto: CreateUserDto) {
  if (!isEmail(dto.email)) {  // Wrong layer!
    throw new BadRequestException();
  }
}
```

### 4. Use Dependency Injection

```typescript
// ✅ GOOD
constructor(
  @Inject('IUserRepository')
  private readonly userRepository: IUserRepository,
) {}

// ❌ BAD
constructor() {
  this.userRepository = new UserRepository();  // Hard coupling
}
```

### 5. Test Each Layer

```typescript
// Domain: Pure unit tests
describe('User Entity', () => {
  it('should update email', () => {
    const user = User.create(/* ... */);
    user.updateEmail('new@example.com');
    expect(user.email.value).toBe('new@example.com');
  });
});

// Application: Mock dependencies
describe('CreateUserUseCase', () => {
  it('should create user', async () => {
    const mockRepo = { save: jest.fn() };
    const useCase = new CreateUserUseCase(mockRepo);
    // Test...
  });
});

// Infrastructure: Integration tests
describe('UserRepository', () => {
  it('should save to database', async () => {
    // Use test containers
  });
});
```

### 6. Use Aggregates for Consistency

```typescript
// ✅ GOOD: Modify through aggregate root
post.addComment('Great post!', authorId);

// ❌ BAD: Modify child directly
comment.setContent('Great post!'); // Bypasses aggregate
```

### 7. Emit Domain Events

```typescript
// Domain entity
export class User extends AggregateRoot {
  updateProfile(userName: string): void {
    this._userName = userName;
    this.addDomainEvent(new UserProfileUpdatedEvent(this.id));
  }
}

// Event handler
@Injectable()
export class UserEventHandler {
  @OnEvent('user.profile.updated')
  async handle(event: UserProfileUpdatedEvent) {
    await this.cacheService.invalidate(`user:${event.userId}`);
    await this.emailService.sendProfileUpdateNotification(event.userId);
  }
}
```

## Summary

**Key Takeaways:**

1. ✅ **Domain layer is pure** - No framework dependencies
2. ✅ **Dependencies point inward** - From outer to inner layers
3. ✅ **Use interfaces for ports** - Dependency inversion principle
4. ✅ **Aggregates enforce invariants** - Consistency boundaries
5. ✅ **Value objects for immutability** - Prevent primitive obsession
6. ✅ **Repository pattern** - Abstract data access
7. ✅ **Domain events** - Decouple components
8. ✅ **Mappers transform data** - Between layers
9. ✅ **Each layer has clear responsibility** - Separation of concerns
10. ✅ **Test each layer independently** - Testability

This architecture ensures:

- **Maintainability**: Clear structure, easy to understand
- **Testability**: Pure business logic, easy to test
- **Scalability**: Modules can evolve independently
- **Flexibility**: Easy to swap implementations
- **Quality**: Enforces best practices

For more details on specific patterns and implementations, refer to the codebase examples in `src/modules/`.
