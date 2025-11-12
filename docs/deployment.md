# Deployment Guide

This guide covers deploying the NestJS Clean Architecture Boilerplate to various environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Local Development](#local-development)
- [Docker Deployment](#docker-deployment)
- [Cloud Platforms](#cloud-platforms)
- [Database Migrations](#database-migrations)
- [Monitoring & Logging](#monitoring--logging)
- [Security Considerations](#security-considerations)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

- **Node.js**: 22.x LTS or higher
- **pnpm**: 10.18.1 or higher
- **PostgreSQL**: 18.x or higher
- **Redis**: 7.x or higher
- **Docker**: 24.x or higher (for containerized deployment)
- **Docker Compose**: 2.x or higher

### Required Accounts

- Docker Hub (for pulling base images)
- Cloud provider account (AWS, GCP, Azure, etc.)
- Database hosting (if not self-hosted)
- Redis hosting (if not self-hosted)

## Environment Configuration

### Environment Variables

Create `.env` file in project root:

```bash
# Application
NODE_ENV=production
PORT=3000
API_PREFIX=api/v1

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=yourSecurePassword
DATABASE_NAME=clean_architecture_prod
DATABASE_SSL=true
DATABASE_LOGGING=false

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=yourRedisPassword
REDIS_DB=0

# JWT
JWT_SECRET=yourVerySecureJwtSecret
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=yourVerySecureRefreshSecret
JWT_REFRESH_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Kafka
KAFKA_BROKERS=localhost:9092,localhost:9093
KAFKA_CLIENT_ID=clean-architecture-app
KAFKA_GROUP_ID=clean-architecture-group

# Email (if using)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourapp.com

# File Storage (if using)
STORAGE_TYPE=local  # local | s3
AWS_S3_BUCKET=your-bucket-name
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Monitoring
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
LOG_LEVEL=info  # debug | info | warn | error

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

### Environment-Specific Configs

#### Development (.env.development)

```bash
NODE_ENV=development
PORT=3000
DATABASE_SSL=false
DATABASE_LOGGING=true
LOG_LEVEL=debug
```

#### Staging (.env.staging)

```bash
NODE_ENV=staging
PORT=3000
DATABASE_SSL=true
DATABASE_LOGGING=false
LOG_LEVEL=info
```

#### Production (.env.production)

```bash
NODE_ENV=production
PORT=3000
DATABASE_SSL=true
DATABASE_LOGGING=false
LOG_LEVEL=warn
```

### Loading Environment Files

```bash
# Development
cp .env.example .env.development
pnpm start:dev

# Production
cp .env.example .env.production
pnpm build
pnpm start:prod
```

## Local Development

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Start Services

```bash
# Start PostgreSQL, Redis, Kafka
docker-compose up -d postgres redis kafka
```

### 3. Run Migrations

```bash
pnpm migration:run
```

### 4. Start Application

```bash
pnpm start:dev
```

### 5. Verify

```bash
# Health check
curl http://localhost:3000/health

# API documentation
open http://localhost:3000/api/docs
```

## Docker Deployment

### Quick Start

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop all services
docker-compose down
```

### Production Docker Deployment

#### 1. Build Production Image

```bash
docker build -t clean-architecture-app:latest -f Dockerfile .
```

#### 2. Run with Docker Compose

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    image: clean-architecture-app:latest
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
      - DATABASE_HOST=postgres
      - REDIS_HOST=redis
      - KAFKA_BROKERS=kafka:9092
    env_file:
      - .env.production
    depends_on:
      - postgres
      - redis
      - kafka
    restart: unless-stopped
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3000/health']
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  postgres:
    image: postgres:18-alpine
    environment:
      POSTGRES_DB: clean_architecture_prod
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    environment:
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092
    depends_on:
      - zookeeper
    restart: unless-stopped

  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

#### 3. Deploy

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Multi-Stage Build Details

Our `Dockerfile` uses multi-stage builds for optimization:

```dockerfile
# Stage 1: Dependencies
FROM node:22-alpine AS deps
# Install dependencies only

# Stage 2: Builder
FROM node:22-alpine AS builder
# Build TypeScript to JavaScript

# Stage 3: Production
FROM node:22-alpine AS production
# Copy only production files
# Run as non-root user
# Minimal image size
```

**Benefits**:

- Smaller final image (~200MB vs ~1GB)
- Faster deployment
- More secure (no build tools in production)

## Cloud Platforms

### AWS Deployment

#### Option 1: Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init -p docker clean-architecture-app

# Create environment
eb create clean-architecture-prod \
  --database \
  --database.engine postgres \
  --database.version 18 \
  --envvars NODE_ENV=production

# Deploy
eb deploy
```

#### Option 2: ECS (Elastic Container Service)

```bash
# 1. Push image to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
docker tag clean-architecture-app:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/clean-architecture-app:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/clean-architecture-app:latest

# 2. Create task definition (task-definition.json)
{
  "family": "clean-architecture-app",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "app",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/clean-architecture-app:latest",
      "portMappings": [{ "containerPort": 3000 }],
      "environment": [
        { "name": "NODE_ENV", "value": "production" }
      ],
      "secrets": [
        { "name": "DATABASE_PASSWORD", "valueFrom": "arn:aws:secretsmanager:..." }
      ]
    }
  ]
}

# 3. Create service
aws ecs create-service \
  --cluster clean-architecture-cluster \
  --service-name clean-architecture-service \
  --task-definition clean-architecture-app \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

#### AWS RDS for PostgreSQL

```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier clean-architecture-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 18 \
  --master-username postgres \
  --master-user-password YourSecurePassword \
  --allocated-storage 20

# Get endpoint
aws rds describe-db-instances --db-instance-identifier clean-architecture-db --query 'DBInstances[0].Endpoint.Address'
```

#### AWS ElastiCache for Redis

```bash
# Create Redis cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id clean-architecture-redis \
  --engine redis \
  --cache-node-type cache.t3.micro \
  --num-cache-nodes 1

# Get endpoint
aws elasticache describe-cache-clusters --cache-cluster-id clean-architecture-redis --show-cache-node-info
```

### Google Cloud Platform (GCP)

#### Cloud Run Deployment

```bash
# 1. Build and push to GCR
gcloud builds submit --tag gcr.io/PROJECT_ID/clean-architecture-app

# 2. Deploy to Cloud Run
gcloud run deploy clean-architecture-app \
  --image gcr.io/PROJECT_ID/clean-architecture-app \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production \
  --set-secrets DATABASE_PASSWORD=db-password:latest \
  --min-instances 1 \
  --max-instances 10 \
  --memory 1Gi \
  --cpu 1
```

#### Cloud SQL for PostgreSQL

```bash
# Create instance
gcloud sql instances create clean-architecture-db \
  --database-version=POSTGRES_18 \
  --tier=db-f1-micro \
  --region=us-central1

# Create database
gcloud sql databases create clean_architecture_prod --instance=clean-architecture-db

# Connect Cloud Run to Cloud SQL
gcloud run services update clean-architecture-app \
  --add-cloudsql-instances PROJECT_ID:us-central1:clean-architecture-db
```

### Azure

#### App Service Deployment

```bash
# 1. Create resource group
az group create --name clean-architecture-rg --location eastus

# 2. Create App Service plan
az appservice plan create \
  --name clean-architecture-plan \
  --resource-group clean-architecture-rg \
  --is-linux \
  --sku B1

# 3. Create web app
az webapp create \
  --resource-group clean-architecture-rg \
  --plan clean-architecture-plan \
  --name clean-architecture-app \
  --deployment-container-image-name clean-architecture-app:latest

# 4. Configure app settings
az webapp config appsettings set \
  --resource-group clean-architecture-rg \
  --name clean-architecture-app \
  --settings NODE_ENV=production
```

### Heroku

```bash
# 1. Create app
heroku create clean-architecture-app

# 2. Add PostgreSQL
heroku addons:create heroku-postgresql:standard-0

# 3. Add Redis
heroku addons:create heroku-redis:premium-0

# 4. Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret

# 5. Deploy
git push heroku main

# 6. Run migrations
heroku run pnpm migration:run
```

### DigitalOcean App Platform

```yaml
# .do/app.yaml
name: clean-architecture-app
services:
  - name: web
    dockerfile_path: Dockerfile
    github:
      repo: your-username/clean-architecture
      branch: main
      deploy_on_push: true
    envs:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        value: ${db.DATABASE_URL}
    instance_count: 2
    instance_size_slug: basic-xs

databases:
  - name: db
    engine: PG
    version: '18'
    size: db-s-1vcpu-1gb

  - name: redis
    engine: REDIS
    version: '7'
    size: db-s-1vcpu-1gb
```

## Database Migrations

### Development Workflow

```bash
# 1. Make entity changes
# Edit src/modules/user/infrastructure/persistence/user.orm-entity.ts

# 2. Generate migration
pnpm migration:generate src/shared/database/migrations/AddUserRoleColumn

# 3. Review migration
# Check src/shared/database/migrations/*-AddUserRoleColumn.ts

# 4. Run migration
pnpm migration:run

# 5. Verify
psql -U postgres -d clean_architecture_dev -c '\dt'
```

### Production Migration

```bash
# 1. Backup database first!
pg_dump -U postgres -d clean_architecture_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Test migration on staging
NODE_ENV=staging pnpm migration:run

# 3. Run on production (with downtime window)
NODE_ENV=production pnpm migration:run

# 4. Verify
NODE_ENV=production pnpm migration:show
```

### Zero-Downtime Migration Strategy

For production systems requiring zero downtime:

**Step 1: Add new column (nullable)**

```typescript
@Column({ name: 'new_column', nullable: true })
newColumn: string;
```

**Step 2: Deploy code that writes to both columns**

```typescript
await userRepository.update(id, {
  oldColumn: value,
  newColumn: value, // Dual write
});
```

**Step 3: Backfill data**

```sql
UPDATE users SET new_column = old_column WHERE new_column IS NULL;
```

**Step 4: Make column non-nullable**

```typescript
@Column({ name: 'new_column', nullable: false })
newColumn: string;
```

**Step 5: Remove old column**

```typescript
// Remove oldColumn from entity
```

### Rollback Strategy

```bash
# Revert last migration
pnpm migration:revert

# Revert to specific migration
# 1. Find migration timestamp
pnpm migration:show

# 2. Manually run down() method
# Or restore from backup
psql -U postgres -d clean_architecture_prod < backup_20250111_120000.sql
```

## Monitoring & Logging

### Application Logs

Logs are written to:

- **Console**: Structured JSON logs
- **Files**: `logs/app.log`, `logs/error.log`
- **External**: Sentry, CloudWatch, etc.

#### Log Levels

```typescript
// In code
this.logger.debug('Detailed debug info');
this.logger.log('General info');
this.logger.warn('Warning message');
this.logger.error('Error occurred', error.stack);
```

#### Log Format

```json
{
  "timestamp": "2025-01-11T12:00:00.000Z",
  "level": "info",
  "context": "UserController",
  "message": "User created successfully",
  "requestId": "uuid-123-456",
  "userId": "user-789",
  "metadata": {
    "email": "user@example.com"
  }
}
```

### Health Checks

```bash
# Application health
curl http://localhost:3000/health

# Response:
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "redis": { "status": "up" }
  }
}
```

### Metrics

Integration with monitoring tools:

#### Prometheus

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'clean-architecture-app'
    static_configs:
      - targets: ['app:3000']
    metrics_path: '/metrics'
```

#### Grafana Dashboards

Import dashboard for:

- Request rate
- Response time (p50, p95, p99)
- Error rate
- Database query time
- Redis hit rate
- WebSocket connections

### Error Tracking

#### Sentry Integration

```typescript
// Already configured in main.ts
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

Access errors at: https://sentry.io/organizations/your-org/issues/

## Security Considerations

### Pre-Deployment Checklist

- [ ] All environment variables set (no defaults in production)
- [ ] JWT secrets are strong (min 256 bits)
- [ ] Database uses SSL/TLS
- [ ] Redis requires password
- [ ] Rate limiting enabled
- [ ] CORS configured properly
- [ ] Helmet security headers enabled
- [ ] Input validation on all endpoints
- [ ] Dependencies audited (`pnpm audit`)
- [ ] Secrets stored in vault (not in code)
- [ ] Database backups configured
- [ ] Monitoring & alerts set up

### SSL/TLS Configuration

#### Let's Encrypt (Free SSL)

```bash
# Install certbot
sudo apt-get install certbot

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

#### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Database Security

```sql
-- Create read-only user for reporting
CREATE USER reporting_user WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE clean_architecture_prod TO reporting_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO reporting_user;

-- Revoke public access
REVOKE ALL ON SCHEMA public FROM public;
GRANT ALL ON SCHEMA public TO postgres;
```

### Secrets Management

#### AWS Secrets Manager

```bash
# Store secret
aws secretsmanager create-secret \
  --name clean-architecture/jwt-secret \
  --secret-string "your-jwt-secret"

# Retrieve in code
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({ region: 'us-east-1' });
const command = new GetSecretValueCommand({ SecretId: 'clean-architecture/jwt-secret' });
const secret = await client.send(command);
```

## Troubleshooting

### Common Issues

#### 1. Application Won't Start

```bash
# Check logs
docker-compose logs app

# Common causes:
# - Database not ready
# - Missing environment variables
# - Port already in use

# Solution: Add healthcheck dependency
depends_on:
  postgres:
    condition: service_healthy
```

#### 2. Database Connection Failed

```bash
# Test connection
psql -h DATABASE_HOST -U DATABASE_USERNAME -d DATABASE_NAME

# Check:
# - Host/port correct
# - Credentials correct
# - Database exists
# - Firewall allows connection
```

#### 3. Redis Connection Failed

```bash
# Test connection
redis-cli -h REDIS_HOST -p REDIS_PORT -a REDIS_PASSWORD ping

# Should return: PONG
```

#### 4. Migration Failed

```bash
# Check migration status
pnpm migration:show

# Manually fix database
psql -U postgres -d clean_architecture_prod

# Then retry migration
pnpm migration:run
```

#### 5. High Memory Usage

```bash
# Check memory
docker stats

# Solutions:
# - Increase container memory limit
# - Optimize queries (add indexes)
# - Enable Redis caching
# - Add pagination
```

#### 6. Slow API Responses

```bash
# Enable query logging
DATABASE_LOGGING=true

# Check slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

# Add indexes as needed
```

### Performance Optimization

#### Database Indexes

```sql
-- Add index on frequently queried columns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
```

#### Redis Caching

```typescript
// Cache frequently accessed data
@Injectable()
export class UserService {
  async getUser(id: string): Promise<User> {
    // Check cache first
    const cached = await this.cacheService.get(`user:${id}`);
    if (cached) return cached;

    // Fetch from database
    const user = await this.userRepository.findById(id);

    // Cache for 5 minutes
    await this.cacheService.set(`user:${id}`, user, 300);

    return user;
  }
}
```

#### Connection Pooling

```typescript
// TypeORM configuration
{
  type: 'postgres',
  extra: {
    max: 20,  // Maximum pool size
    min: 5,   // Minimum pool size
    idleTimeoutMillis: 30000,
  }
}
```

## Rollback Strategy

### Application Rollback

```bash
# Docker
docker-compose down
docker-compose -f docker-compose.prod.yml up -d --force-recreate

# Kubernetes
kubectl rollout undo deployment/clean-architecture-app

# ECS
aws ecs update-service \
  --cluster clean-architecture-cluster \
  --service clean-architecture-service \
  --task-definition clean-architecture-app:PREVIOUS_VERSION
```

### Database Rollback

```bash
# Restore from backup
pg_restore -U postgres -d clean_architecture_prod backup_20250111_120000.sql

# Or revert migration
pnpm migration:revert
```

## Next Steps

After successful deployment:

1. ✅ Monitor application metrics
2. ✅ Set up alerts (CPU, memory, errors)
3. ✅ Configure auto-scaling
4. ✅ Test disaster recovery
5. ✅ Document runbooks
6. ✅ Train team on deployment process

For more information:

- [Docker Guide](./docker.md)
- [CI/CD Guide](./cicd.md)
- [Testing Guide](./testing.md)
- [Architecture Guide](./architecture.md)
