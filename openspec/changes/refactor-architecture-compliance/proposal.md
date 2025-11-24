# Change: Refactor Architecture Compliance

## Why

After a comprehensive audit of the codebase, several violations of Clean Architecture and DDD principles have been identified that could lead to maintainability issues, tight coupling, and inconsistent error handling as the project grows:

1. **Circular Dependencies**: 3 circular dependencies detected in ORM entities, violating dependency inversion
2. **Domain Layer Purity**: Post aggregate doesn't extend AggregateRoot base class, User entity missing domain events
3. **Inconsistent Error Handling**: Domain layer uses generic `Error` instead of domain-specific exceptions
4. **Missing Mappers**: UserRepository contains mapping logic instead of using dedicated mapper classes
5. **Repository Pattern**: Missing clear separation between ORM entities and domain mappers

These issues violate the project's own documented standards in `.github/copilot-instructions.md` and `docs/architecture.md`.

## What Changes

### 1. Fix Circular Dependencies (Breaking: Infrastructure)

- **BREAKING**: Restructure ORM entity relationships to eliminate cycles
- Remove bidirectional references in TypeORM entities
- Use ID references instead of object references where appropriate
- Affected: `conversation.orm-entity.ts`, `message.orm-entity.ts`, `post.orm-entity.ts`, `comment.orm-entity.ts`

### 2. Enforce Domain Layer Purity

- Make Post aggregate extend AggregateRoot base class (currently has manual implementation)
- Add domain events to User entity (UserCreatedEvent, UserUpdatedEvent, UserDeactivatedEvent)
- Ensure Conversation aggregate properly uses AggregateRoot event system
- Remove any framework-specific code from domain layer

### 3. Implement Domain-Specific Exceptions

- Create domain exception hierarchy (DomainException base class)
- Replace generic `throw new Error()` with typed exceptions in domain layer
- Examples: `InvalidEmailException`, `InvalidPasswordException`, `InvalidPostStateException`
- Keep domain exceptions framework-agnostic (no NestJS HttpException in domain)

### 4. Extract Repository Mappers

- Create dedicated `UserOrmMapper` class in infrastructure/mappers
- Move `toOrmEntity()` and `toDomain()` logic from UserRepository to mapper
- Apply same pattern to all repositories for consistency
- Follow existing pattern from ConversationRepository

### 5. Improve Use Case Error Handling

- Replace generic `throw new Error()` in use cases with domain exceptions
- Let exception filters handle conversion to HTTP responses
- Improve error messages with context (include entity IDs, validation details)

## Impact

### Affected Specs

- **code-quality**: Circular dependency resolution, mapper extraction
- **domain-purity**: AggregateRoot usage, domain events, exception handling
- **error-handling**: Domain exceptions, use case error handling

### Affected Code

**High Priority:**

- `src/modules/post/domain/aggregates/post.aggregate.ts` - Extend AggregateRoot
- `src/modules/user/domain/entities/user.entity.ts` - Add domain events
- `src/modules/user/infrastructure/persistence/user.repository.ts` - Extract mapper
- `src/modules/conversation/infrastructure/persistence/*.orm-entity.ts` - Fix circular deps
- `src/modules/post/infrastructure/persistence/*.orm-entity.ts` - Fix circular deps

**Medium Priority:**

- `src/modules/*/domain/entities/*.ts` - Replace generic Error with domain exceptions
- `src/modules/*/domain/value-objects/*.ts` - Replace generic Error with domain exceptions
- `src/modules/*/application/use-cases/*.ts` - Improve error handling

**New Files:**

- `src/shared/domain-events/exceptions/domain.exception.ts` - Base domain exception
- `src/modules/user/domain/exceptions/*.ts` - User-specific exceptions
- `src/modules/post/domain/exceptions/*.ts` - Post-specific exceptions
- `src/modules/conversation/domain/exceptions/*.ts` - Conversation-specific exceptions
- `src/modules/user/domain/events/user.events.ts` - User domain events
- `src/modules/user/infrastructure/mappers/user-orm.mapper.ts` - User ORM mapper

### Breaking Changes

- **ORM Entity Structure**: Changes to TypeORM relationships may require database migration review
- **Repository Interface**: Mapper extraction doesn't change public API but changes internal structure
- **Exception Types**: Code catching generic `Error` from domain layer will need updates

### Migration Path

1. Create domain exception classes (non-breaking)
2. Extract mapper classes (non-breaking, internal refactor)
3. Fix circular dependencies (review migrations, may need cascade rule adjustments)
4. Update Post aggregate to extend AggregateRoot (non-breaking)
5. Add domain events to User entity (non-breaking, enables future event-driven features)
6. Replace Error usages with domain exceptions (semi-breaking, improve error specificity)

### Benefits

- **Maintainability**: Clear separation of concerns, easier to understand and modify
- **Testability**: Domain logic testable without framework dependencies
- **Consistency**: All aggregates follow same patterns, all errors properly typed
- **Scalability**: No circular dependencies blocking future refactoring
- **Reliability**: Typed exceptions prevent silent failures
- **Compliance**: Aligns 100% with documented Clean Architecture standards

### Risks

- **Testing Burden**: Need to update existing tests to use new exception types
- **Migration Complexity**: ORM changes may require careful database migration planning
- **Learning Curve**: Team needs to understand domain exception hierarchy

## Non-Goals

- Rewriting existing functionality or business logic
- Adding new features or capabilities
- Performance optimization (focus is architectural correctness)
- Changing public API contracts (DTOs, controller signatures remain same)
- Migrating to different ORM or database
