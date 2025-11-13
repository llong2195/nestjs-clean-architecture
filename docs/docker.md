# Docker Deployment Guide

This guide covers Docker deployment for the NestJS Clean Architecture Boilerplate.

## Table of Contents

- [Quick Start](#quick-start)
- [Docker Files](#docker-files)
- [Development Environment](#development-environment)
- [Production Deployment](#production-deployment)
- [Docker Compose Services](#docker-compose-services)
- [Environment Variables](#environment-variables)
- [Health Checks](#health-checks)
- [Troubleshooting](#troubleshooting)

## Quick Start

### Development (with hot-reload)

```bash
# Start all services in development mode
pnpm docker:dev

# Or rebuild if dependencies changed
pnpm docker:dev:build

# Stop all services
pnpm docker:dev:down
```

### Production

```bash
# Start all services in production mode
pnpm docker:prod

# Or rebuild
pnpm docker:prod:build

# Stop all services
pnpm docker:prod:down
```

### Clean Up

```bash
# Remove all containers, networks, and volumes
pnpm docker:clean
```

## Docker Files

### `Dockerfile` (Production)

Multi-stage build optimized for production:

1. **Stage 1 (deps)**: Install production dependencies only
2. **Stage 2 (builder)**: Build the application
3. **Stage 3 (production)**: Create lean final image

**Features:**

- Multi-stage build for smaller image size
- Non-root user for security
- dumb-init for proper signal handling
- Health checks included
- Production-ready configuration

**Image Size:** ~200MB (Alpine-based)

### `Dockerfile.dev` (Development)

Development-optimized build:

**Features:**

- Hot-reload support via volume mounts
- Debug port exposed (9229)
- Development tools included (bash, git, curl, vim)
- All dependencies installed
- Faster rebuilds

**Image Size:** ~400MB

### `.dockerignore`

Excludes unnecessary files from Docker context:

- `node_modules/`
- `dist/`, `build/`
- Git files
- Test coverage
- Logs and temporary files

## Development Environment

### Start Development Stack

```bash
# Start with docker-compose
docker-compose -f docker-compose.dev.yml up

# Or use npm script
pnpm docker:dev
```

### Services Included

- **PostgreSQL** (port 5432)
- **Redis** (port 6379)
- **Zookeeper** (internal)
- **Kafka** (port 9092)
- **NestJS App** (port 3000, debug port 9229)

### Hot-Reload

Source code is mounted as volumes:

```yaml
volumes:
  - ./src:/app/src:delegated
  - ./test:/app/test:delegated
  - /app/node_modules # Excluded from mount
```

Any changes to `src/` trigger automatic reload.

### Debugging

Attach debugger to port `9229`:

**VS Code Launch Configuration:**

```json
{
  "type": "node",
  "request": "attach",
  "name": "Docker: Attach to Node",
  "port": 9229,
  "address": "localhost",
  "localRoot": "${workspaceFolder}",
  "remoteRoot": "/app",
  "protocol": "inspector"
}
```

## Production Deployment

### Build Production Image

```bash
# Build the image
docker build -t nestjs-clean-architecture:latest .

# Or use docker-compose
docker-compose build
```

### Run Production Stack

```bash
# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f app

# Check health
docker-compose ps
```

### Environment Variables

Create `.env.production` file:

```bash
NODE_ENV=production
PORT=3000

# Database
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=strong-password-here
DATABASE_NAME=nestjs_clean_architecture

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Kafka
KAFKA_BROKERS=kafka:29092

# JWT Secrets (CHANGE THESE!)
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
```

**Load environment file:**

```bash
docker-compose --env-file .env.production up -d
```

## Docker Compose Services

### PostgreSQL

```yaml
postgres:
  image: postgres:18-alpine
  ports:
    - '5432:5432'
  environment:
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: postgres
    POSTGRES_DB: nestjs_clean_architecture
  volumes:
    - postgres_data:/var/lib/postgresql/data
```

**Access:**

```bash
# Connect to database
docker exec -it nestjs-postgres psql -U postgres -d nestjs_clean_architecture

# Run migrations
docker exec nestjs-app pnpm migration:run
```

### Redis

```yaml
redis:
  image: redis:7-alpine
  ports:
    - '6379:6379'
  volumes:
    - redis_data:/data
```

**Access:**

```bash
# Connect to Redis CLI
docker exec -it nestjs-redis redis-cli

# Check keys
docker exec -it nestjs-redis redis-cli KEYS '*'

# Monitor commands
docker exec -it nestjs-redis redis-cli MONITOR
```

### Kafka

```yaml
kafka:
  image: confluentinc/cp-kafka:7.5.0
  ports:
    - '9092:9092'
  environment:
    KAFKA_BROKER_ID: 1
    KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
```

**Access:**

```bash
# List topics
docker exec nestjs-kafka kafka-topics --list --bootstrap-server localhost:9092

# Create topic
docker exec nestjs-kafka kafka-topics --create \
  --bootstrap-server localhost:9092 \
  --topic test-topic \
  --partitions 3 \
  --replication-factor 1

# Consume messages
docker exec nestjs-kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic post.published \
  --from-beginning
```

### NestJS Application

```yaml
app:
  build:
    context: .
    dockerfile: Dockerfile
  ports:
    - '3000:3000'
  depends_on:
    - postgres
    - redis
    - kafka
```

**Access:**

```bash
# View logs
docker logs nestjs-app -f

# Execute command inside container
docker exec -it nestjs-app sh

# Run migrations
docker exec nestjs-app pnpm migration:run

# Restart application
docker restart nestjs-app
```

## Environment Variables

### Required Variables

| Variable             | Description          | Default                     | Example                     |
| -------------------- | -------------------- | --------------------------- | --------------------------- |
| `NODE_ENV`           | Environment mode     | `development`               | `production`                |
| `PORT`               | Application port     | `3000`                      | `3000`                      |
| `DATABASE_HOST`      | PostgreSQL host      | `localhost`                 | `postgres`                  |
| `DATABASE_PORT`      | PostgreSQL port      | `5432`                      | `5432`                      |
| `DATABASE_USERNAME`  | Database user        | `postgres`                  | `postgres`                  |
| `DATABASE_PASSWORD`  | Database password    | `postgres`                  | `strong-password`           |
| `DATABASE_NAME`      | Database name        | `nestjs_clean_architecture` | `nestjs_clean_architecture` |
| `REDIS_HOST`         | Redis host           | `localhost`                 | `redis`                     |
| `REDIS_PORT`         | Redis port           | `6379`                      | `6379`                      |
| `KAFKA_BROKERS`      | Kafka brokers        | `localhost:9092`            | `kafka:29092`               |
| `JWT_SECRET`         | JWT signing secret   | -                           | `your-secret-key`           |
| `JWT_REFRESH_SECRET` | Refresh token secret | -                           | `your-refresh-secret`       |

### Optional Variables

| Variable               | Description            | Default |
| ---------------------- | ---------------------- | ------- |
| `GOOGLE_CLIENT_ID`     | Google OAuth Client ID | -       |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Secret    | -       |
| `GOOGLE_CALLBACK_URL`  | OAuth callback URL     | -       |
| `LOG_LEVEL`            | Logging level          | `info`  |

## Health Checks

All services include health checks:

### Check Service Health

```bash
# Check all services
docker-compose ps

# Check specific service
docker inspect --format='{{json .State.Health}}' nestjs-app | jq

# View health check logs
docker inspect nestjs-app | jq '.[0].State.Health'
```

### Application Health Endpoint

```bash
# HTTP health check
curl http://localhost:3000/health

# Expected response
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "redis": { "status": "up" }
  }
}
```

### Health Check Intervals

| Service  | Interval | Timeout | Retries | Start Period |
| -------- | -------- | ------- | ------- | ------------ |
| postgres | 10s      | 5s      | 5       | -            |
| redis    | 10s      | 5s      | 5       | -            |
| kafka    | 30s      | 10s     | 5       | -            |
| app      | 30s      | 3s      | 3       | 40s          |

## Troubleshooting

### Container Won't Start

**Check logs:**

```bash
docker logs nestjs-app
docker-compose logs app
```

**Common issues:**

1. **Port conflict**: Another service using port 3000/5432/6379

   ```bash
   # Check what's using the port
   lsof -i :3000
   # Or on Windows
   netstat -ano | findstr :3000
   ```

2. **Database not ready**: App starts before PostgreSQL is ready
   - Health checks should prevent this
   - Add longer `start_period` in health check

3. **Missing environment variables**
   ```bash
   # Check environment
   docker exec nestjs-app env | grep DATABASE
   ```

### Database Connection Failed

```bash
# Verify PostgreSQL is running
docker ps | grep postgres

# Test connection
docker exec -it nestjs-postgres psql -U postgres -d nestjs_clean_architecture

# Check network
docker network inspect nestjs-network
```

### Redis Connection Failed

```bash
# Test Redis connection
docker exec -it nestjs-redis redis-cli PING

# Expected: PONG
```

### Kafka Connection Failed

```bash
# Check Zookeeper
docker logs nestjs-zookeeper

# Check Kafka
docker logs nestjs-kafka

# Verify topic creation
docker exec nestjs-kafka kafka-topics --list --bootstrap-server localhost:9092
```

### Hot-Reload Not Working

**Development mode issues:**

1. **Check volume mounts:**

   ```bash
   docker inspect nestjs-app-dev | jq '.[0].Mounts'
   ```

2. **Verify file changes are detected:**

   ```bash
   docker logs nestjs-app-dev -f
   # Should show "File change detected. Starting incremental compilation..."
   ```

3. **Rebuild if needed:**
   ```bash
   pnpm docker:dev:down
   pnpm docker:dev:build
   ```

### Out of Disk Space

```bash
# Check Docker disk usage
docker system df

# Clean up unused resources
docker system prune -a

# Remove all volumes (⚠️ DESTROYS DATA)
docker volume prune
```

### Slow Build Times

**Optimize Docker build:**

1. **Use BuildKit:**

   ```bash
   export DOCKER_BUILDKIT=1
   docker build .
   ```

2. **Check .dockerignore:**
   - Ensure `node_modules/` is excluded
   - Exclude large files/directories

3. **Use layer caching:**
   - Package files copied before source code
   - Only rebuilds when dependencies change

### Permission Issues

**Linux/Mac file permissions:**

```bash
# Change ownership to current user
sudo chown -R $USER:$USER .

# Or run container with current user
docker-compose run --user $(id -u):$(id -g) app sh
```

## Best Practices

### Security

1. **Never use default passwords in production**
2. **Use secrets management** (Docker Secrets, AWS Secrets Manager)
3. **Run as non-root user** (already configured)
4. **Keep images updated** regularly
5. **Scan for vulnerabilities:**
   ```bash
   docker scan nestjs-clean-architecture:latest
   ```

### Performance

1. **Use multi-stage builds** (already implemented)
2. **Minimize layer count**
3. **Use .dockerignore** to reduce context size
4. **Enable BuildKit** for faster builds
5. **Use specific image tags** (not `latest`)

### Monitoring

1. **View logs:**

   ```bash
   docker-compose logs -f
   ```

2. **Resource usage:**

   ```bash
   docker stats
   ```

3. **Inspect containers:**
   ```bash
   docker inspect nestjs-app
   ```

## Production Deployment Checklist

- [ ] Change default passwords in environment variables
- [ ] Set strong JWT secrets
- [ ] Configure proper CORS origins
- [ ] Enable HTTPS/TLS
- [ ] Set up log aggregation
- [ ] Configure backup strategy for PostgreSQL
- [ ] Set up monitoring and alerting
- [ ] Configure resource limits
- [ ] Review security settings
- [ ] Test health checks
- [ ] Document disaster recovery plan

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [NestJS Docker Guide](https://docs.nestjs.com/deployment#docker)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
- [Redis Docker Hub](https://hub.docker.com/_/redis)
- [Kafka Docker Guide](https://docs.confluent.io/platform/current/installation/docker/index.html)

## Summary

- ✅ Production Dockerfile with multi-stage build
- ✅ Development Dockerfile with hot-reload
- ✅ Docker Compose for both environments
- ✅ Health checks for all services
- ✅ Volume persistence for data
- ✅ Proper networking configuration
- ✅ Non-root user security
- ✅ Comprehensive documentation
