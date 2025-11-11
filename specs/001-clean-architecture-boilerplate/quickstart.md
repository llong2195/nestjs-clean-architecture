# Quickstart Guide: NestJS Clean Architecture Boilerplate

**Feature**: 001-clean-architecture-boilerplate  
**Date**: 2025-11-11  
**Audience**: Developers setting up the boilerplate for the first time

This guide will get you up and running with the NestJS Clean Architecture boilerplate in under 10 minutes.

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: 22+ (LTS recommended)
- **pnpm**: 10.x+ (required package manager)
- **Docker** and **Docker Compose**: For local services (PostgreSQL, Redis, Kafka)
- **Git**: For version control

Check your versions:

```bash
node --version  # Should be >= 22.0.0
pnpm --version  # Should be >= 10.0.0
docker --version
docker-compose --version
```

If you don't have pnpm installed:

```bash
npm install -g pnpm
```

---

## Quick Start (5 Minutes)

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/nestjs-clean-architecture.git
cd nestjs-clean-architecture
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your preferred editor and update any necessary values:

```env
# Application
NODE_ENV=development
PORT=3000

# Database (PostgreSQL)
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=nest_clean_arch
DATABASE_LOGGING=true

# Cache (Redis)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-me-in-production
JWT_EXPIRATION=15m
REFRESH_TOKEN_EXPIRATION=7d

# Google OAuth (Optional - leave empty for local development)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Message Queue (Kafka)
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=nestjs-clean-arch

# File Storage
STORAGE_TYPE=local  # local | s3
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760  # 10MB

# Logging
LOG_LEVEL=debug  # error | warn | info | debug
```

### 4. Start Docker Services

Start PostgreSQL, Redis, and Kafka using Docker Compose:

```bash
docker-compose up -d
```

Verify services are running:

```bash
docker-compose ps
```

You should see:

- `postgres` on port 5432
- `redis` on port 6379
- `kafka` on port 9092
- `zookeeper` on port 2181

### 5. Run Database Migrations

Create the database schema:

```bash
pnpm migration:run
```

(Optional) Seed the database with sample data:

```bash
pnpm seed
```

### 6. Start the Application

Run in development mode with hot-reload:

```bash
pnpm start:dev
```

You should see output like:

```
[Nest] 12345  - 11/11/2025, 10:30:00 AM     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 11/11/2025, 10:30:00 AM     LOG [InstanceLoader] AppModule dependencies initialized
[Nest] 12345  - 11/11/2025, 10:30:01 AM     LOG [RoutesResolver] UserController {/api/users}
[Nest] 12345  - 11/11/2025, 10:30:01 AM     LOG [NestApplication] Nest application successfully started
🚀 Application running on: http://localhost:3000
📚 Swagger docs available at: http://localhost:3000/api/docs
```

### 7. Access Swagger UI

Open your browser and navigate to:

**http://localhost:3000/api/docs**

You'll see the interactive API documentation where you can:

- Explore all available endpoints
- Test API requests directly
- View request/response schemas

---

## Verify Installation

### Test Health Check

```bash
curl http://localhost:3000/api/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2025-11-11T10:30:00.000Z",
  "uptime": 123.456,
  "database": "up",
  "redis": "up",
  "kafka": "up"
}
```

### Create Your First User

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "userName": "Test User"
  }'
```

Expected response:

```json
{
  "status": "success",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "test@example.com",
    "userName": "Test User",
    "role": "user",
    "provider": "local",
    "createdAt": "2025-11-11T10:30:00.000Z"
  },
  "meta": {
    "timestamp": "2025-11-11T10:30:00.000Z",
    "requestId": "abc-def-123"
  }
}
```

### Login and Get JWT Token

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

Expected response:

```json
{
  "status": "success",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_abc123...",
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "test@example.com",
      "userName": "Test User"
    }
  },
  "meta": {
    "timestamp": "2025-11-11T10:30:00.000Z",
    "requestId": "xyz-789"
  }
}
```

### Make Authenticated Request

Use the `accessToken` from the login response:

```bash
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

---

## Project Structure Overview

```
src/
├── modules/              # Feature modules
│   ├── user/             # User management module
│   ├── auth/             # Authentication module
│   ├── post/             # Blog post module (example)
│   └── notification/     # Notification module
│
├── shared/               # Shared infrastructure
│   ├── config/           # Configuration management
│   ├── database/         # Database connection & migrations
│   ├── cache/            # Redis caching
│   ├── messaging/        # Kafka & BullMQ
│   ├── websocket/        # WebSocket setup
│   └── domain-events/    # Transactional outbox
│
├── common/               # Common utilities
│   ├── decorators/       # Custom decorators (@CurrentUser, etc.)
│   ├── filters/          # Exception filters
│   ├── guards/           # Auth guards
│   ├── interceptors/     # Logging, transformation
│   └── pipes/            # Validation pipes
│
├── app.module.ts         # Root module
└── main.ts               # Application entry point
```

**Module Structure** (Clean Architecture layers):

```
src/modules/user/
├── domain/               # Business logic (framework-agnostic)
│   ├── entities/         # User.entity.ts
│   ├── value-objects/    # Email.vo.ts, Password.vo.ts
│   └── repositories/     # IUserRepository.interface.ts
│
├── application/          # Use cases
│   ├── use-cases/        # CreateUserUseCase, GetUserUseCase
│   └── dtos/             # CreateUserDto, UpdateUserDto
│
├── infrastructure/       # Framework implementations
│   ├── persistence/      # TypeORM repositories
│   └── cache/            # Redis caching logic
│
├── interface/            # Entry points
│   └── http/             # REST controllers
│
└── user.module.ts        # NestJS module definition
```

---

## Common Development Tasks

### Running Tests

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Test coverage
pnpm test:cov
```

### Database Migrations

```bash
# Generate a new migration
pnpm migration:generate src/shared/database/migrations/AddNewColumn

# Run pending migrations
pnpm migration:run

# Revert last migration
pnpm migration:revert
```

### Linting and Formatting

```bash
# Run ESLint
pnpm lint

# Auto-fix linting errors
pnpm lint:fix

# Format code with Prettier
pnpm format
```

### Building for Production

```bash
# Build the application
pnpm build

# Start production server
pnpm start:prod
```

---

## WebSocket Testing

### Connect to WebSocket

Use a WebSocket client (e.g., wscat):

```bash
npm install -g wscat

# Connect to notification gateway
wscat -c "ws://localhost:3000/notifications?token=YOUR_JWT_TOKEN"
```

### Send Message

```json
{
  "event": "send_message",
  "data": {
    "conversationId": "123e4567-e89b-12d3-a456-426614174000",
    "content": "Hello, World!"
  }
}
```

---

## Troubleshooting

### Port Already in Use

If you see "Port 3000 is already in use":

```bash
# Find process using port 3000
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill the process or change PORT in .env
```

### Database Connection Error

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Redis Connection Error

```bash
# Check Redis status
docker-compose ps redis

# Test Redis connection
docker exec -it nestjs-clean-arch-redis redis-cli ping
# Should return "PONG"
```

### Kafka Connection Error

```bash
# Check Kafka status
docker-compose ps kafka

# View Kafka logs
docker-compose logs kafka

# Verify topics
docker exec -it nestjs-clean-arch-kafka kafka-topics --list --bootstrap-server localhost:9092
```

### Permission Errors on Linux

```bash
# Fix Docker volume permissions
sudo chown -R $USER:$USER .
```

---

## Next Steps

Now that you have the boilerplate running, you can:

1. **Explore the Sample Modules**: Check out `src/modules/user/` and `src/modules/post/` to see Clean Architecture in action

2. **Create Your First Feature Module**:

   ```bash
   nest g module modules/product
   nest g controller modules/product/interface/http/controllers/product
   nest g service modules/product/application/use-cases/create-product
   ```

3. **Read the Architecture Documentation**: See `docs/architecture.md` for detailed explanations of the design patterns

4. **Run the Test Suite**: Verify everything works with `pnpm test:e2e`

5. **Customize for Your Project**: Update domain entities, add your own use cases, configure external services

---

## Useful Commands Reference

| Command                  | Description                              |
| ------------------------ | ---------------------------------------- |
| `pnpm install`           | Install dependencies                     |
| `pnpm start:dev`         | Start development server with hot-reload |
| `pnpm start:prod`        | Start production server                  |
| `pnpm build`             | Build for production                     |
| `pnpm test`              | Run unit tests                           |
| `pnpm test:e2e`          | Run E2E tests                            |
| `pnpm test:cov`          | Run tests with coverage                  |
| `pnpm lint`              | Run ESLint                               |
| `pnpm format`            | Format code with Prettier                |
| `pnpm migration:run`     | Run database migrations                  |
| `pnpm migration:revert`  | Revert last migration                    |
| `docker-compose up -d`   | Start all services                       |
| `docker-compose down`    | Stop all services                        |
| `docker-compose logs -f` | View logs (follow mode)                  |

---

## Getting Help

- **Documentation**: See `docs/` folder for detailed guides
- **API Reference**: http://localhost:3000/api/docs (Swagger UI)
- **Issues**: Report bugs or ask questions on GitHub Issues
- **Discussions**: Join community discussions on GitHub Discussions

---

**Congratulations! 🎉** You now have a fully functional Clean Architecture boilerplate running. Happy coding!
