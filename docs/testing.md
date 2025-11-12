# Testing Guide

This guide explains the testing strategy and practices for the NestJS Clean Architecture Boilerplate.

## Table of Contents

- [Testing Philosophy](#testing-philosophy)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Test Coverage](#test-coverage)
- [Best Practices](#best-practices)

## Testing Philosophy

This project follows the **Testing Pyramid** approach with three distinct test layers:

```
        /\
       /  \
      / E2E \         <- Few, slow, high-level
     /______\
    /        \
   / INTEGR.  \      <- Some, medium speed
  /____________\
 /              \
/   UNIT TESTS   \   <- Many, fast, isolated
/__________________\
```

### Test Distribution Goals

- **70%** Unit Tests - Fast, isolated domain logic tests
- **20%** Integration Tests - Database and infrastructure tests
- **10%** E2E Tests - Complete user journey tests

## Test Structure

```
test/
├── unit/                        # Unit tests (domain & application logic)
│   ├── user/
│   │   ├── domain/              # Domain entities, value objects
│   │   └── application/         # Use cases, business logic
│   └── post/
│       ├── domain/
│       └── application/
│
├── integration/                 # Integration tests (infrastructure)
│   ├── user/                    # User repository tests
│   ├── post/                    # Post repository tests
│   └── outbox/                  # Outbox processor tests
│
├── e2e/                         # End-to-end tests (full API flows)
│   ├── auth.e2e-spec.ts         # Authentication flows
│   ├── user.e2e-spec.ts         # User CRUD operations
│   ├── post.e2e-spec.ts         # Post lifecycle
│   ├── multi-instance-websocket.spec.ts  # WebSocket scaling
│   └── setup.ts                 # E2E test utilities
│
└── helpers/                     # Test utilities
    ├── database-test.helper.ts  # Database test containers
    └── redis-test.helper.ts     # Redis test containers
```

## Running Tests

### All Tests

```bash
# Run all tests (unit + integration + e2e)
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage report
pnpm test:cov
```

### Specific Test Suites

```bash
# Run only unit tests
pnpm test:unit

# Run only integration tests (requires Docker)
pnpm test:integration

# Run only E2E tests (requires running app services)
pnpm test:e2e
```

### Run Specific Test File

```bash
# Run a specific test file
pnpm test user.entity.spec.ts

# Run tests matching a pattern
pnpm test --testPathPattern=user

# Run tests with specific name
pnpm test --testNamePattern="should create user"
```

### Debug Tests

```bash
# Run tests in debug mode
pnpm test:debug

# Or use VS Code debugger with this launch configuration:
# .vscode/launch.json
```

## Writing Tests

### 1. Unit Tests (Domain Layer)

Unit tests verify pure business logic without external dependencies.

**Example: Domain Entity Test**

```typescript
// test/unit/user/domain/user.entity.spec.ts
import { User } from '@/modules/user/domain/entities/user.entity';
import { Email } from '@/modules/user/domain/value-objects/email.vo';

describe('User Entity', () => {
  describe('create', () => {
    it('should create a valid user', () => {
      const user = User.create('test@example.com', 'Password123!', 'Test User');

      expect(user).toBeDefined();
      expect(user.email.value).toBe('test@example.com');
      expect(user.userName).toBe('Test User');
    });

    it('should throw error for invalid email', () => {
      expect(() => {
        User.create('invalid-email', 'Password123!', 'Test User');
      }).toThrow('Invalid email format');
    });
  });

  describe('updateProfile', () => {
    it('should update user name', () => {
      const user = User.create('test@example.com', 'Password123!', 'Old Name');

      user.updateProfile('New Name');

      expect(user.userName).toBe('New Name');
    });

    it('should dispatch UserUpdatedEvent', () => {
      const user = User.create('test@example.com', 'Password123!', 'Test User');

      user.updateProfile('Updated Name');

      const events = user.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].constructor.name).toBe('UserUpdatedEvent');
    });
  });
});
```

### 2. Unit Tests (Application Layer)

Application layer tests verify use case orchestration with mocked dependencies.

**Example: Use Case Test**

```typescript
// test/unit/user/application/create-user.use-case.spec.ts
import { CreateUserUseCase } from '@/modules/user/application/use-cases/create-user.use-case';
import { IUserRepository } from '@/modules/user/domain/repositories/user.repository.interface';

describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    mockUserRepository = {
      save: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
      count: jest.fn(),
    };

    useCase = new CreateUserUseCase(mockUserRepository);
  });

  it('should create user when email is unique', async () => {
    // Arrange
    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockUserRepository.save.mockImplementation((user) => Promise.resolve(user));

    // Act
    const result = await useCase.execute({
      email: 'test@example.com',
      password: 'Password123!',
      userName: 'Test User',
    });

    // Assert
    expect(result).toBeDefined();
    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
    expect(mockUserRepository.save).toHaveBeenCalled();
  });

  it('should throw error when email already exists', async () => {
    // Arrange
    const existingUser = User.create('test@example.com', 'Pass123!', 'Existing');
    mockUserRepository.findByEmail.mockResolvedValue(existingUser);

    // Act & Assert
    await expect(
      useCase.execute({
        email: 'test@example.com',
        password: 'Password123!',
        userName: 'Test User',
      }),
    ).rejects.toThrow('Email already exists');
  });
});
```

### 3. Integration Tests

Integration tests verify infrastructure components against real external services (using test containers).

**Example: Repository Integration Test**

```typescript
// test/integration/user/user.repository.integration.spec.ts
import { DataSource } from 'typeorm';
import { UserRepository } from '@/modules/user/infrastructure/persistence/user.repository';
import { DatabaseTestHelper } from '@/test/helpers/database-test.helper';

describe('UserRepository Integration Tests', () => {
  let dataSource: DataSource;
  let repository: UserRepository;

  beforeAll(async () => {
    // Start test database container
    dataSource = await DatabaseTestHelper.setupDatabase();
    repository = new UserRepository(dataSource);
  });

  afterAll(async () => {
    await DatabaseTestHelper.teardownDatabase();
  });

  afterEach(async () => {
    await dataSource.createQueryBuilder().delete().from('users').execute();
  });

  it('should save and retrieve user', async () => {
    // Arrange
    const user = User.create('test@example.com', 'Password123!', 'Test User');

    // Act
    await repository.save(user);
    const found = await repository.findByEmail('test@example.com');

    // Assert
    expect(found).toBeDefined();
    expect(found!.email.value).toBe('test@example.com');
  });

  it('should handle concurrent saves correctly', async () => {
    const user1 = User.create('user1@example.com', 'Pass123!', 'User 1');
    const user2 = User.create('user2@example.com', 'Pass123!', 'User 2');

    await Promise.all([repository.save(user1), repository.save(user2)]);

    const count = await repository.count();
    expect(count).toBe(2);
  });
});
```

### 4. E2E Tests

E2E tests verify complete API flows with full application context.

**Example: E2E Test**

```typescript
// test/e2e/auth.e2e-spec.ts
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { E2ETestSetup } from './setup';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await E2ETestSetup.createTestApp();
  });

  afterAll(async () => {
    await E2ETestSetup.closeApp(app);
  });

  it('should complete full auth flow', async () => {
    // 1. Register
    const userData = {
      email: 'test@example.com',
      password: 'Password123!',
      userName: 'Test User',
    };

    await request(app.getHttpServer()).post('/api/users').send(userData).expect(201);

    // 2. Login
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: userData.email, password: userData.password })
      .expect(200);

    const { accessToken, refreshToken } = loginResponse.body.data;

    // 3. Access protected route
    await request(app.getHttpServer())
      .get('/api/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    // 4. Refresh token
    await request(app.getHttpServer()).post('/api/auth/refresh').send({ refreshToken }).expect(200);

    // 5. Logout
    await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken })
      .expect(200);
  });
});
```

## Test Coverage

### Coverage Requirements

The project enforces the following coverage thresholds:

- **Global**: 80% (branches, functions, lines, statements)
- **Domain Layer**: 90% (critical business logic)
- **Application Layer**: 85% (use cases)

### Viewing Coverage

```bash
# Generate HTML coverage report
pnpm test:cov

# Open coverage report in browser
open coverage/lcov-report/index.html
```

### Coverage Exclusions

The following files are excluded from coverage requirements:

- `*.spec.ts` - Test files
- `*.module.ts` - NestJS modules
- `*.config.ts` - Configuration files
- `main.ts` - Application entry point
- `migrations/*.ts` - Database migrations

## Best Practices

### General Principles

1. **Arrange-Act-Assert (AAA) Pattern**

   ```typescript
   it('should do something', () => {
     // Arrange - Set up test data
     const input = 'test';

     // Act - Execute the operation
     const result = doSomething(input);

     // Assert - Verify the result
     expect(result).toBe('expected');
   });
   ```

2. **One Assertion Per Test** (when possible)

   ```typescript
   // Good
   it('should return user name', () => {
     expect(user.userName).toBe('Test User');
   });

   it('should return user email', () => {
     expect(user.email).toBe('test@example.com');
   });

   // Avoid (multiple unrelated assertions)
   it('should have correct properties', () => {
     expect(user.userName).toBe('Test User');
     expect(user.email).toBe('test@example.com');
     expect(user.role).toBe('user');
   });
   ```

3. **Descriptive Test Names**

   ```typescript
   // Good
   it('should throw error when email format is invalid', () => {});

   // Bad
   it('should work', () => {});
   it('test email', () => {});
   ```

### Domain Layer Testing

- **Never mock domain entities** - They should be pure and testable without mocks
- **Test business rules exhaustively** - Domain logic is critical
- **Test state transitions** - Verify entity lifecycle
- **Test domain events** - Ensure events are dispatched correctly

### Application Layer Testing

- **Mock all infrastructure dependencies** - Repositories, services, external APIs
- **Test happy path and error scenarios** - Cover success and failure cases
- **Verify repository calls** - Ensure correct data access patterns
- **Test authorization logic** - Verify access control

### Integration Testing

- **Use test containers** - Real databases/services in Docker
- **Clean up between tests** - Ensure test isolation
- **Test database constraints** - Unique keys, foreign keys, etc.
- **Test transaction behavior** - Rollback, commit scenarios

### E2E Testing

- **Test critical user journeys** - Authentication, core features
- **Minimize E2E tests** - They're slow and brittle
- **Use realistic data** - Match production scenarios
- **Test error responses** - Verify error handling

### Mocking Guidelines

```typescript
// Good - Mock interfaces
const mockRepository: jest.Mocked<IUserRepository> = {
  save: jest.fn(),
  findById: jest.fn(),
};

// Bad - Mock concrete classes
const mockRepository = jest.fn<UserRepository>();
```

### Test Data Management

```typescript
// Good - Use factories
const user = TestDataFactory.createTestUser({
  email: 'custom@example.com',
});

// Bad - Hardcode test data everywhere
const user = {
  email: 'test@example.com',
  password: 'Password123!',
  userName: 'Test User',
};
```

## Continuous Integration

Tests run automatically on:

- **Every commit** - Unit tests (fast feedback)
- **Pull requests** - Full test suite (integration + e2e)
- **Before deployment** - Full test suite with coverage check

## Troubleshooting

### Integration Tests Failing

**Problem**: "Could not find a working container runtime strategy"

**Solution**: Ensure Docker is running

```bash
docker ps  # Verify Docker is accessible
```

### E2E Tests Timing Out

**Problem**: Tests exceed timeout

**Solution**: Increase timeout for slow tests

```typescript
it('should complete slow operation', async () => {
  // test code
}, 30000); // 30 second timeout
```

### Database Lock Errors

**Problem**: "Database is locked" or deadlock errors

**Solution**: Ensure proper cleanup and use `runInBand` for integration tests

```bash
pnpm test:integration --runInBand
```

### Mock Not Working

**Problem**: Mock return value not being used

**Solution**: Verify mock implementation

```typescript
// Ensure mock is properly set up
mockRepository.findById.mockResolvedValue(expectedUser);

// Verify mock was called
expect(mockRepository.findById).toHaveBeenCalledWith('user-id');
```

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://testingjavascript.com/)
- [NestJS Testing Guide](https://docs.nestjs.com/fundamentals/testing)
- [Test Containers](https://testcontainers.com/)
- [Clean Architecture Testing](https://blog.cleancoder.com/uncle-bob/2017/10/03/TestContravariance.html)

## Summary

- **Write tests first** - TDD leads to better design
- **Keep tests isolated** - No shared state between tests
- **Fast feedback loop** - Unit tests should run in seconds
- **Test behavior, not implementation** - Focus on what, not how
- **Maintain high coverage** - 80% minimum, 90%+ for critical code
