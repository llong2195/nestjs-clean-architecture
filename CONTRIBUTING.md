# Contributing to Clean Architecture Boilerplate

Thank you for your interest in contributing! This document provides guidelines for contributing to the NestJS Clean Architecture Boilerplate.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing Requirements](#testing-requirements)
- [Documentation](#documentation)
- [Community](#community)

## Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

**Positive behavior includes:**

- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behavior includes:**

- Trolling, insulting/derogatory comments, and personal attacks
- Public or private harassment
- Publishing others' private information without permission
- Other conduct which could reasonably be considered inappropriate

### Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported by contacting the project team. All complaints will be reviewed and investigated promptly and fairly.

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Node.js**: 22.x LTS or higher
- **pnpm**: 10.18.1 or higher
- **Docker**: 24.x or higher
- **Git**: 2.x or higher
- **VS Code**: Recommended IDE

### Fork and Clone

```bash
# 1. Fork repository on GitHub
# Click "Fork" button at https://github.com/your-org/clean-architecture

# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/clean-architecture.git
cd clean-architecture

# 3. Add upstream remote
git remote add upstream https://github.com/your-org/clean-architecture.git

# 4. Verify remotes
git remote -v
# origin    https://github.com/YOUR_USERNAME/clean-architecture.git (fetch)
# origin    https://github.com/YOUR_USERNAME/clean-architecture.git (push)
# upstream  https://github.com/your-org/clean-architecture.git (fetch)
# upstream  https://github.com/your-org/clean-architecture.git (push)
```

### Setup Development Environment

```bash
# 1. Install dependencies
pnpm install

# 2. Copy environment file
cp .env.example .env.development

# 3. Start services
docker-compose up -d postgres redis kafka

# 4. Run migrations
pnpm migration:run

# 5. Start application
pnpm start:dev

# 6. Verify setup
curl http://localhost:3000/health
```

### Keep Your Fork Updated

```bash
# Fetch upstream changes
git fetch upstream

# Merge upstream main into your main
git checkout main
git merge upstream/main

# Push to your fork
git push origin main
```

## Development Workflow

### 1. Create Feature Branch

```bash
# Create branch from main
git checkout main
git pull upstream main
git checkout -b feature/your-feature-name

# Branch naming conventions:
# - feature/add-user-authentication
# - fix/user-login-bug
# - refactor/user-repository
# - docs/api-documentation
# - test/user-service-tests
```

### 2. Make Changes

Follow the [Coding Standards](#coding-standards) and [Architecture Guidelines](./docs/architecture.md).

```bash
# Check file structure before making changes
tree src/modules/

# Create new feature following Clean Architecture
mkdir -p src/modules/product/{domain,application,infrastructure,interface}
```

### 3. Write Tests

```bash
# Write unit tests
# test/unit/product/create-product.use-case.spec.ts

# Write integration tests
# test/integration/product/product-repository.spec.ts

# Write E2E tests
# test/e2e/product.e2e-spec.ts

# Run tests
pnpm test
pnpm test:e2e
pnpm test:cov
```

### 4. Commit Changes

Follow [Conventional Commits](#commit-guidelines):

```bash
# Stage changes
git add .

# Commit with conventional commit message
git commit -m "feat(product): add product CRUD endpoints"

# Push to your fork
git push origin feature/your-feature-name
```

### 5. Create Pull Request

1. Go to your fork on GitHub
2. Click "Compare & pull request"
3. Fill out PR template
4. Request review from maintainers

## Coding Standards

### TypeScript Style

#### 1. Use Strict Type Checking

```typescript
// ✅ GOOD: Explicit types
function createUser(email: string, password: string): User {
  return User.create(email, password);
}

// ❌ BAD: Implicit any
function createUser(email, password) {
  return User.create(email, password);
}
```

#### 2. Prefer Const Over Let

```typescript
// ✅ GOOD
const users = await this.userRepository.findAll();

// ❌ BAD
let users = await this.userRepository.findAll();
```

#### 3. Use Interfaces for Contracts

```typescript
// ✅ GOOD: Interface for port
export interface IUserRepository {
  save(user: User): Promise<User>;
  findById(id: string): Promise<User | null>;
}

// ❌ BAD: Concrete class in domain
export class UserRepository {
  save(user: User): Promise<User> {
    /* ... */
  }
}
```

### Clean Architecture Principles

#### 1. Domain Layer Must Be Pure

```typescript
// ✅ GOOD: Pure domain entity
export class User {
  private constructor(
    public readonly id: string,
    private _email: Email,
  ) {}

  static create(email: string): User {
    return new User(uuid(), Email.create(email));
  }
}

// ❌ BAD: Framework dependencies in domain
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;
}
```

#### 2. Dependencies Point Inward

```typescript
// ✅ GOOD: Use case depends on interface
@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}
}

// ❌ BAD: Use case depends on concrete implementation
@Injectable()
export class CreateUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}
}
```

#### 3. Use Value Objects

```typescript
// ✅ GOOD: Value object for email
export class Email {
  private constructor(public readonly value: string) {}

  static create(value: string): Email {
    if (!this.isValid(value)) {
      throw new InvalidEmailException();
    }
    return new Email(value.toLowerCase());
  }

  private static isValid(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }
}

// ❌ BAD: Primitive obsession
export class User {
  private _email: string; // String instead of Email value object
}
```

### Naming Conventions

#### Files and Folders

```
✅ GOOD:
src/modules/user/domain/entities/user.entity.ts
src/modules/user/application/use-cases/create-user.use-case.ts
src/modules/user/infrastructure/persistence/user.orm-entity.ts

❌ BAD:
src/modules/user/domain/entities/User.ts
src/modules/user/application/use-cases/createUser.ts
src/modules/user/infrastructure/persistence/userEntity.ts
```

#### Classes and Interfaces

```typescript
// ✅ GOOD: Clear naming
export class CreateUserUseCase {}
export class UserRepository implements IUserRepository {}
export interface IUserRepository {}

// ❌ BAD: Unclear naming
export class UserCreator {}
export class UserRepo {}
export interface UserRepositoryInterface {}
```

#### Database Schema

```typescript
// ✅ GOOD: snake_case for database
@Entity({ name: 'users' })
export class UserOrmEntity {
  @Column({ name: 'user_name' })
  userName: string;

  @Column({ name: 'created_at' })
  createdAt: Date;
}

// ❌ BAD: camelCase for database
@Entity({ name: 'Users' })
export class UserOrmEntity {
  @Column({ name: 'userName' })
  userName: string;
}
```

### ESLint Rules

Run linter before committing:

```bash
# Check for errors
pnpm lint

# Auto-fix errors
pnpm lint:fix

# Format code
pnpm format
```

**Key rules:**

- No unused variables
- No console.log (use logger)
- No any type (unless documented)
- Explicit return types on public methods
- Maximum file length: 400 lines
- Maximum function length: 50 lines

## Commit Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, no logic change)
- **refactor**: Code refactoring (no feature or bug fix)
- **test**: Adding or updating tests
- **chore**: Build process, dependency updates
- **perf**: Performance improvements
- **ci**: CI/CD configuration changes

### Examples

```bash
# Feature
git commit -m "feat(auth): add Google OAuth authentication"

# Bug fix
git commit -m "fix(user): resolve email validation error"

# Documentation
git commit -m "docs(readme): update installation instructions"

# Refactor
git commit -m "refactor(user): extract email validation to value object"

# Test
git commit -m "test(post): add unit tests for post creation"

# Breaking change
git commit -m "feat(api)!: change response format

BREAKING CHANGE: API responses now return data in 'data' field instead of root level"
```

### Commit Message Validation

Commits are validated by commitlint (configured in `.husky/commit-msg`):

```bash
# Valid commit
git commit -m "feat(user): add user profile endpoint"
# ✅ Passes

# Invalid commit
git commit -m "added new feature"
# ❌ Fails: Missing type and scope
```

## Pull Request Process

### Before Creating PR

1. ✅ All tests pass (`pnpm test`, `pnpm test:e2e`)
2. ✅ Code coverage meets requirements (80% global, 90% domain)
3. ✅ No linting errors (`pnpm lint`)
4. ✅ Code is formatted (`pnpm format`)
5. ✅ Documentation updated (if applicable)
6. ✅ Conventional commit messages
7. ✅ Branch is up-to-date with main

```bash
# Run full check
pnpm lint && pnpm test && pnpm test:e2e && pnpm build
```

### PR Template

Our PR template (`.github/pull_request_template.md`) includes:

#### 1. Description

- What changes were made
- Why these changes were necessary
- Related issues (e.g., Fixes #123)

#### 2. Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

#### 3. Architecture Layers Affected

- [ ] Domain Layer
- [ ] Application Layer
- [ ] Infrastructure Layer
- [ ] Interface Layer

#### 4. Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] All tests pass

#### 5. Clean Architecture Checklist

- [ ] Domain layer is framework-agnostic
- [ ] Dependencies point inward
- [ ] Repository interfaces in domain layer
- [ ] DTOs used for API requests/responses
- [ ] No circular dependencies

#### 6. Code Quality

- [ ] Code follows project conventions
- [ ] No linting errors
- [ ] Code is formatted
- [ ] No console.log statements

### Review Process

1. **Automated Checks**: CI/CD runs all tests and checks
2. **Code Review**: At least one maintainer reviews code
3. **Feedback**: Address review comments
4. **Approval**: Maintainer approves PR
5. **Merge**: Maintainer merges PR to main

### After Merge

```bash
# Update your local main
git checkout main
git pull upstream main

# Delete feature branch
git branch -d feature/your-feature-name
git push origin --delete feature/your-feature-name
```

## Testing Requirements

### Coverage Requirements

- **Global**: Minimum 80% coverage
- **Domain Layer**: Minimum 90% coverage
- **Application Layer**: Minimum 85% coverage

```bash
# Run with coverage
pnpm test:cov

# View coverage report
open coverage/lcov-report/index.html
```

### Test Structure

#### Unit Tests

```typescript
describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase;
  let mockRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findByEmail: jest.fn(),
    } as any;

    useCase = new CreateUserUseCase(mockRepository);
  });

  describe('execute', () => {
    it('should create user successfully', async () => {
      // Arrange
      const dto: CreateUserDto = {
        email: 'user@example.com',
        password: 'Password123!',
        userName: 'John Doe',
      };
      mockRepository.findByEmail.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue(expect.any(Object));

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result.email).toBe(dto.email);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should throw error if email already exists', async () => {
      // Arrange
      const dto: CreateUserDto = {
        email: 'existing@example.com',
        password: 'Password123!',
        userName: 'John Doe',
      };
      mockRepository.findByEmail.mockResolvedValue(expect.any(Object));

      // Act & Assert
      await expect(useCase.execute(dto)).rejects.toThrow(EmailAlreadyExistsException);
    });
  });
});
```

#### Integration Tests

```typescript
describe('UserRepository Integration Tests', () => {
  let repository: UserRepository;
  let dataSource: DataSource;

  beforeAll(async () => {
    // Setup test database
    dataSource = await setupTestDatabase();
    repository = new UserRepository(/* ... */);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it('should save and retrieve user', async () => {
    const user = User.create('user@example.com', 'Password123!', 'John Doe');

    await repository.save(user);

    const retrieved = await repository.findById(user.id);
    expect(retrieved).toBeDefined();
    expect(retrieved.email.value).toBe('user@example.com');
  });
});
```

#### E2E Tests

```typescript
describe('UserController (e2e)', () => {
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

  it('POST /users - should create user', () => {
    return request(app.getHttpServer())
      .post('/api/v1/users')
      .send({
        email: 'user@example.com',
        password: 'Password123!',
        userName: 'John Doe',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.status).toBe('success');
        expect(res.body.data.email).toBe('user@example.com');
      });
  });
});
```

## Documentation

### Code Documentation

Use JSDoc comments for public APIs:

```typescript
/**
 * Creates a new user in the system
 *
 * @param dto - User creation data
 * @returns Created user data
 * @throws {EmailAlreadyExistsException} If email is already registered
 *
 * @example
 * const dto: CreateUserDto = {
 *   email: 'user@example.com',
 *   password: 'Password123!',
 *   userName: 'John Doe'
 * };
 * const user = await createUserUseCase.execute(dto);
 */
async execute(dto: CreateUserDto): Promise<UserResponseDto> {
  // Implementation
}
```

### Updating Documentation

When making changes, update relevant documentation:

- **README.md**: Project overview, quick start
- **docs/architecture.md**: Architecture decisions
- **docs/api-development.md**: API development guide
- **docs/testing.md**: Testing strategies
- **OpenAPI/Swagger**: API documentation (auto-generated)

```bash
# Generate updated API docs
pnpm start:dev
open http://localhost:3000/api/docs
```

## Community

### Communication Channels

- **GitHub Issues**: Bug reports, feature requests
- **GitHub Discussions**: Questions, ideas, general discussions
- **Pull Requests**: Code contributions

### Getting Help

1. **Check Documentation**: Read docs/ folder
2. **Search Issues**: Someone may have asked already
3. **Ask in Discussions**: For general questions
4. **Create Issue**: For bugs or feature requests

### Reporting Bugs

Use the bug report template:

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:

1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Environment**

- OS: [e.g., Windows 11]
- Node.js: [e.g., 22.0.0]
- pnpm: [e.g., 10.18.1]
```

### Feature Requests

Use the feature request template:

```markdown
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
What you want to happen.

**Describe alternatives you've considered**
Other solutions you've thought about.

**Additional context**
Any other context or screenshots.
```

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

## Thank You!

Your contributions make this project better for everyone. We appreciate your time and effort! 🎉

---

**Questions?** Feel free to open a [GitHub Discussion](https://github.com/your-org/clean-architecture/discussions).
