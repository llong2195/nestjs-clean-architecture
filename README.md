<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

Production-ready NestJS Clean Architecture Boilerplate with TypeScript, PostgreSQL, Redis, and comprehensive caching.

### ✨ Features

- 🏗️ **Clean Architecture** (4-layer: Domain/Application/Infrastructure/Interface)
- 📦 **Domain-Driven Design** with Aggregates and Value Objects
- 🔄 **Redis Caching** with read-through and write-through patterns
- 🗃️ **PostgreSQL + TypeORM** with migrations
- 🔐 **Session Management** with Redis TTL
- 📝 **Swagger/OpenAPI** documentation
- 🧪 **Jest** testing setup
- 📊 **Winston** structured logging
- ✅ **Class-validator** DTO validation

## Prerequisites

- Node.js 22+ (LTS)
- pnpm 10.x+
- PostgreSQL 16+ OR Docker
- Redis 7+ OR Docker

## Quick Start

### Option 1: Local PostgreSQL/Redis (Recommended for Development)

If you have PostgreSQL and Redis installed locally, see **[LOCAL_SETUP.md](LOCAL_SETUP.md)** for detailed instructions.

**Quick steps:**

1. Configure PostgreSQL password in `.env`
2. Create database: `psql -U postgres -c "CREATE DATABASE nestjs_clean_architecture;"`
3. Run migrations: `pnpm migration:run`
4. Start server: `pnpm start:dev`

### Option 2: Docker

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Start Infrastructure (Docker)

```bash
docker-compose up -d
```

This starts:

- PostgreSQL (port 5432)
- Redis (port 6379)

### 3. Configure Environment

Copy `.env.example` to `.env` (already configured for local development):

```bash
cp .env.example .env
```

### 4. Run Database Migrations

```bash
pnpm migration:run
```

This creates tables:

- `users` - User accounts
- `posts` - Blog posts with status
- `comments` - Post comments
- `tags` - Post tags
- `post_tags` - Junction table
- `sessions` - User sessions

### 5. Start Development Server

```bash
pnpm start:dev
```

Server runs at: http://localhost:3000

API Documentation (Swagger): http://localhost:3000/api/docs

## Documentation

- **[docs/testing.md](docs/testing.md)** - Complete testing guide (unit/integration/E2E)
- **[docs/git-hooks.md](docs/git-hooks.md)** - Git hooks and commit conventions
- **[LOCAL_SETUP.md](LOCAL_SETUP.md)** - Running with local PostgreSQL/Redis
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - What's completed and next steps
- **[QUICKSTART.md](QUICKSTART.md)** - Step-by-step checklist
- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Detailed development guide
- **[PROJECT_STATUS.md](PROJECT_STATUS.md)** - Current features and architecture

## Project Setup (Manual)

If you prefer to run services manually:

### PostgreSQL

```bash
# Create database
createdb nestjs_clean_architecture

# Or using psql
psql -U postgres -c "CREATE DATABASE nestjs_clean_architecture;"
```

### Redis

```bash
# Start Redis server
redis-server
```

## Available Scripts

```bash
# Development
pnpm start:dev          # Start with hot-reload

# Build
pnpm build              # Compile TypeScript
pnpm start:prod         # Start production build

# Database
pnpm migration:generate src/shared/database/migrations/MigrationName
pnpm migration:run      # Run pending migrations
pnpm migration:revert   # Rollback last migration

# Testing
pnpm test               # Unit tests
pnpm test:e2e           # End-to-end tests
pnpm test:cov           # Coverage report

# Code Quality
pnpm lint               # Run ESLint
pnpm lint:fix           # Auto-fix issues
pnpm format             # Format with Prettier
```

## Git Hooks

The project uses automated Git hooks to enforce code quality and commit conventions. See **[docs/git-hooks.md](docs/git-hooks.md)** for complete guide.

### Automatic Checks

**Pre-commit hook** runs on every commit:

- ✅ ESLint with auto-fix
- ✅ Prettier formatting

**Commit message hook** validates commit format:

```bash
# ✅ Valid commit messages (Conventional Commits)
git commit -m "feat: add user authentication"
git commit -m "fix: resolve null pointer in repository"
git commit -m "docs: update README"

# ❌ Invalid commit messages
git commit -m "update code"           # Missing type
git commit -m "Fix bug"               # Type must be lowercase
```

### Commit Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `test` - Tests
- `refactor` - Code refactoring
- `style` - Code formatting
- `perf` - Performance
- `chore` - Maintenance

See **[docs/git-hooks.md](docs/git-hooks.md)** for troubleshooting and advanced usage.

## Testing

The project includes comprehensive unit, integration, and end-to-end tests. See **[docs/testing.md](docs/testing.md)** for complete testing guide.

### Quick Test Commands

```bash
# Run all tests
pnpm test

# Run specific test suites
pnpm test:unit          # Unit tests (fast, isolated)
pnpm test:integration   # Integration tests (requires Docker)
pnpm test:e2e           # End-to-end tests (requires running app)

# Watch mode
pnpm test:watch         # Auto-run tests on file changes

# Coverage report
pnpm test:cov           # Generate HTML coverage report
```

### Test Structure

```
test/
├── unit/                   # Domain & application logic tests (70%)
│   ├── user/              # User entity and use case tests
│   └── post/              # Post aggregate tests
├── integration/            # Infrastructure tests (20%)
│   ├── user/              # User repository integration tests
│   └── post/              # Post repository integration tests
└── e2e/                    # API flow tests (10%)
    ├── auth.e2e-spec.ts   # Authentication flows
    ├── user.e2e-spec.ts   # User CRUD operations
    └── post.e2e-spec.ts   # Post lifecycle
```

### Coverage Requirements

- **Global**: 80% (branches, functions, lines, statements)
- **Domain Layer**: 90% (critical business logic)
- **Application Layer**: 85% (use cases)

### Example: Running Tests

```bash
# Run tests for a specific module
pnpm test user

# Run tests with specific name pattern
pnpm test --testNamePattern="should create user"

# Run tests with detailed output
pnpm test --verbose

# Debug tests
pnpm test:debug
```

For complete testing documentation including best practices, troubleshooting, and examples, see **[docs/testing.md](docs/testing.md)**.

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ pnpm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
