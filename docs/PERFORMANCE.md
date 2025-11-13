# Performance Optimization Guide

## Database Optimizations

### Indexes

All critical database indexes are in place:

- **Users table**: email (unique), created_at
- **Posts table**: author_id, status, created_at, updated_at
- **Post_tags junction**: post_id, tag_id (composite)
- **Comments table**: post_id, author_id, created_at
- **Sessions table**: user_id, token (unique), expires_at
- **Notifications table**: user_id, is_read, created_at
- **Conversations**: created_at, updated_at
- **Conversation_participants**: conversation_id, user_id (composite), user_id
- **Messages**: conversation_id, sender_id, created_at
- **File_metadata**: uploaded_by, storage_key (unique), uploaded_at

### Query Logging

- Enabled in development mode
- Logs all queries and errors
- Tracks slow queries (>1000ms) in development

### Connection Pooling

- Pool size: 10 connections (configurable)
- Optimized for typical workload
- Adjust based on concurrent user load

## Cache Strategy

### TTL Configuration

Environment variable: `CACHE_TTL` (default: 3600 seconds = 1 hour)

**Recommended TTL values by data type:**

```typescript
// User data: Infrequently changes
userCache: 3600 (1 hour)

// Posts: Moderate change frequency
postCache: 1800 (30 minutes)

// Session data: Short-lived but important
sessionCache: 900 (15 minutes)

// Static/reference data: Rarely changes
referenceData: 86400 (24 hours)

// Real-time data: Very short cache
notifications: 60 (1 minute)
```

### Cache Invalidation

- Automatic invalidation on write operations
- Manual cache busting for critical updates
- Use cache tags for related data

## HTTP Compression

### Compression Middleware

- Enabled globally in production
- Reduces response payload size by ~70% for JSON
- Automatic Content-Encoding: gzip

**Best practices:**

- Minimum size threshold: 1KB (default)
- Compression level: 6 (balanced)
- Skip compression for: images, videos, already compressed

## Connection Pooling

### PostgreSQL Pool Configuration

Current settings:

```typescript
poolSize: 10; // Maximum concurrent connections
```

**Tuning guidelines:**

- Development: 5-10 connections
- Production (small): 10-20 connections
- Production (medium): 20-50 connections
- Production (large): 50-100 connections

Formula: `pool_size = ((core_count * 2) + effective_spindle_count)`

### Redis Connection

- Single connection for cache operations
- Redis Pub/Sub for WebSocket adapter
- Connection pooling handled by ioredis

## API Response Optimization

### Pagination

- Default limit: 10-50 items per page
- Maximum limit: 100 items
- Use cursor-based pagination for large datasets

### Selective Field Loading

- Use DTOs to expose only needed fields
- Avoid N+1 queries with eager loading
- Use `relations` option in TypeORM queries

### Example Optimized Query

```typescript
// BAD: N+1 query problem
const posts = await postRepository.find();
for (const post of posts) {
  post.author = await userRepository.findOne(post.authorId);
}

// GOOD: Single query with joins
const posts = await postRepository.find({
  relations: ['author', 'tags'],
  take: 20,
  skip: 0,
});
```

## Rate Limiting

Current configuration:

- 100 requests per 60 seconds per IP
- Applies globally to all endpoints
- Use `@SkipThrottle()` for health checks

**Production recommendations:**

- Public APIs: 100 req/min
- Authenticated users: 1000 req/min
- Admin endpoints: 10000 req/min

## Monitoring Recommendations

### Metrics to Track

1. **Response Times**
   - P50: <100ms
   - P95: <500ms
   - P99: <1000ms

2. **Database Performance**
   - Query execution time
   - Connection pool usage
   - Slow query log (>1s)

3. **Cache Hit Ratio**
   - Target: >80% for frequently accessed data
   - Monitor cache memory usage

4. **System Resources**
   - CPU usage: <70%
   - Memory usage: <80%
   - Database connections: <80% of pool

### APM Tools

Recommended for production:

- New Relic
- DataDog
- Elastic APM
- AWS CloudWatch (if on AWS)

## Load Testing

Baseline performance targets:

- **Throughput**: 1,000 requests/second
- **Concurrent users**: 500+
- **Error rate**: <0.1%

### Load Testing Tools

```bash
# Artillery
artillery quick --count 100 --num 1000 http://localhost:3000/api/health

# k6
k6 run --vus 100 --duration 30s load-test.js

# Apache Bench
ab -n 10000 -c 100 http://localhost:3000/api/health
```

## Production Checklist

- [ ] Enable compression middleware
- [ ] Configure appropriate cache TTL
- [ ] Set up connection pooling (10-50)
- [ ] Enable rate limiting
- [ ] Add APM monitoring
- [ ] Configure log aggregation
- [ ] Set up alerts for slow queries (>1s)
- [ ] Monitor cache hit ratio
- [ ] Run load tests before deployment
- [ ] Profile database query performance
