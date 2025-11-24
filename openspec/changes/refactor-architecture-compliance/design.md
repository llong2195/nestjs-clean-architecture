## Context

This change addresses architectural debt accumulated in the NestJS Clean Architecture boilerplate that violates documented standards. The refactoring focuses on three core areas:

1. **Circular Dependencies**: TypeORM entity relationships create import cycles that block future refactoring
2. **Domain Purity**: Inconsistent use of AggregateRoot base class and missing domain events
3. **Error Handling**: Generic Error usage instead of typed domain exceptions

## Goals

- **Zero circular dependencies** verified by madge
- **100% AggregateRoot compliance** for all aggregates (Post, Conversation, User where applicable)
- **Typed domain exceptions** replacing all generic `Error` throws in domain layer
- **Dedicated mapper classes** for all repositories following hexagonal architecture
- **Consistent domain event emission** for all state changes

## Non-Goals

- Rewriting business logic or adding new features
- Performance optimization (unless architectural fix provides it)
- Changing public API contracts (DTOs, endpoints)
- Database schema changes beyond fixing circular dependencies
- Replacing TypeORM with different ORM

## Decisions

### Decision 1: Domain Exception Hierarchy

**Choice**: Create `DomainException` base class in `shared/domain-events/exceptions/`

**Why**:

- Keeps domain layer framework-agnostic (no NestJS HttpException)
- Allows exception filters to map domain exceptions to HTTP status codes
- Provides type safety and better error messages

**Alternatives Considered**:

- Use existing HttpException in domain (rejected: violates domain purity)
- Keep using generic Error (rejected: loses type information and context)

**Implementation**:

```typescript
// src/shared/domain-events/exceptions/domain.exception.ts
export abstract class DomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// src/modules/user/domain/exceptions/invalid-email.exception.ts
export class InvalidEmailException extends DomainException {
  constructor(email: string) {
    super(`Invalid email format: ${email}`);
  }
}
```

**Exception Filter Mapping**:

```typescript
// src/common/filters/domain-exception.filter.ts
@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainException, host: ArgumentsHost) {
    // Map domain exceptions to appropriate HTTP status codes
    const statusCode = this.getStatusCode(exception);
    // Return standardized error response
  }
}
```

### Decision 2: Repository Mapper Extraction

**Choice**: Extract ORM mapping to dedicated `*OrmMapper` classes in `infrastructure/mappers/`

**Why**:

- Follows Single Responsibility Principle (repository handles persistence, mapper handles translation)
- Makes mapping logic testable in isolation
- Consistent with ConversationRepository pattern already in codebase
- Easier to swap ORM in future (though not planned)

**Alternatives Considered**:

- Keep mapping in repository (rejected: violates SRP, harder to test)
- Use AutoMapper library (rejected: adds dependency, overkill for simple mappings)

**Implementation**:

```typescript
// src/modules/user/infrastructure/mappers/user-orm.mapper.ts
@Injectable()
export class UserOrmMapper {
  toOrm(domain: User): UserOrmEntity {
    const orm = new UserOrmEntity();
    orm.id = domain.id;
    orm.email = domain.email;
    // ... other fields
    return orm;
  }

  toDomain(orm: UserOrmEntity): User {
    return User.reconstitute(
      orm.id,
      orm.email,
      // ... other fields
    );
  }
}

// src/modules/user/infrastructure/persistence/user.repository.ts
@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly ormRepository: Repository<UserOrmEntity>,
    private readonly mapper: UserOrmMapper, // Inject mapper
  ) {}

  async save(user: User): Promise<User> {
    const ormEntity = this.mapper.toOrm(user); // Use mapper
    const saved = await this.ormRepository.save(ormEntity);
    return this.mapper.toDomain(saved); // Use mapper
  }
}
```

### Decision 3: Fixing Circular Dependencies

**Choice**: Remove bidirectional TypeORM relationships, use ID references instead

**Why**:

- Breaks import cycles at ORM layer
- Forces explicit queries with joins (more transparent, easier to optimize)
- Aligns with DDD principle: aggregates reference other aggregates by ID, not object

**Alternatives Considered**:

- Keep bidirectional but restructure files (rejected: doesn't solve root cause)
- Use lazy loading with string imports (rejected: hacky, doesn't work with TypeScript strict mode)

**Implementation**:

```typescript
// BEFORE (Circular):
@Entity()
export class ConversationOrmEntity {
  @OneToMany(() => MessageOrmEntity, message => message.conversation)
  messages: MessageOrmEntity[];
}

@Entity()
export class MessageOrmEntity {
  @ManyToOne(() => ConversationOrmEntity, conv => conv.messages)
  conversation: ConversationOrmEntity; // Causes circular import
}

// AFTER (No Circular):
@Entity()
export class ConversationOrmEntity {
  // No back-reference to messages
}

@Entity()
export class MessageOrmEntity {
  @Column()
  conversationId: string; // Store ID only

  // No object reference, load explicitly when needed
}

// In repository:
async findConversationWithMessages(id: string): Promise<Conversation> {
  const conv = await this.ormRepo.findOne({ where: { id } });
  const messages = await this.messageRepo.find({
    where: { conversationId: id },
    order: { createdAt: 'ASC' }
  });
  // Map to domain aggregate
}
```

### Decision 4: Post Aggregate Refactoring

**Choice**: Make Post extend AggregateRoot instead of manual event implementation

**Why**:

- Consistency with Conversation aggregate (already extends AggregateRoot)
- Avoids code duplication (manual `domainEvents` array, methods)
- Ensures all aggregates follow same pattern
- Easier for new developers to understand

**Alternatives Considered**:

- Keep manual implementation (rejected: inconsistent with rest of codebase)
- Convert Conversation to manual (rejected: already works well)

**Implementation**:

```typescript
// BEFORE:
export class Post {
  private domainEvents: any[] = [];

  private addDomainEvent(event: any): void {
    this.domainEvents.push(event);
  }

  getDomainEvents(): any[] {
    return [...this.domainEvents];
  }
  clearDomainEvents(): void {
    this.domainEvents = [];
  }
}

// AFTER:
export class Post extends AggregateRoot {
  // Remove manual implementation, use inherited:
  // - protected addDomainEvent(event: IDomainEvent): void
  // - get domainEvents(): ReadonlyArray<IDomainEvent>
  // - clearDomainEvents(): void
  // - hasDomainEvents(): boolean
}
```

### Decision 5: User Domain Events

**Choice**: Add comprehensive domain events to User entity

**Why**:

- Enables event-driven notifications (welcome emails, audit logs)
- Supports future features (analytics, user activity tracking)
- Consistent with Post aggregate (already has events)
- Follows CQRS/Event Sourcing readiness

**Events to Add**:

- UserCreatedEvent (registration, OAuth signup)
- UserProfileUpdatedEvent (name/email changes)
- UserPasswordChangedEvent (security audit)
- UserDeactivatedEvent (account closure)
- UserRoleChangedEvent (permission changes)

**Implementation**:

```typescript
// src/modules/user/domain/events/user.events.ts
export class UserCreatedEvent implements IDomainEvent {
  constructor(
    public readonly aggregateId: string,
    public readonly email: string,
    public readonly userName: string,
    public readonly provider: string,
  ) {}

  eventId = uuid();
  aggregateType = 'User';
  eventType = 'UserCreated';
  occurredOn = new Date();
  payload = {
    email: this.email,
    userName: this.userName,
    provider: this.provider,
  };
}

// In User entity:
static async create(...): Promise<User> {
  const user = new User(...);
  user.addDomainEvent(new UserCreatedEvent(user.id, ...));
  return user;
}
```

## Risks & Trade-offs

### Risk 1: ORM Relationship Changes

**Risk**: Removing bidirectional relationships may require database migration

**Mitigation**:

- Review generated migrations carefully
- Test on dev database before production
- Only remove TypeScript references, keep database FKs intact
- Explicitly load related entities with queries (no behavior change)

**Rollback Plan**: Revert ORM entity changes, keep old navigation properties

### Risk 2: Exception Type Changes

**Risk**: Code catching generic `Error` will miss domain exceptions

**Mitigation**:

- Search codebase for `catch (error: Error)` or `catch (e)`
- Update exception filters to handle DomainException hierarchy
- Add tests for error scenarios

**Rollback Plan**: Domain exceptions still extend Error, so `catch (error)` still works

### Risk 3: Mapper Injection Breaking Tests

**Risk**: Tests that instantiate repositories directly will fail (missing mapper)

**Mitigation**:

- Update test setup to provide mapper mocks
- Use NestJS testing module for integration tests
- Document mapper requirement in repository comments

**Rollback Plan**: Temporarily make mapper optional parameter with default implementation

### Risk 4: Test Coverage Drop

**Risk**: Refactoring may break existing tests, reducing coverage

**Mitigation**:

- Run test suite after each section completes
- Fix broken tests immediately before moving forward
- Add new tests for exception paths

**Target**: Maintain ≥80% coverage throughout refactoring

## Migration Plan

### Phase 1: Non-Breaking Changes (Days 1-2)

1. Add domain exceptions (backward compatible, Error subclass)
2. Extract mapper classes (internal change only)
3. Update Post aggregate (backward compatible)
4. Add User events (backward compatible, no consumers yet)

**Validation**: Run full test suite, verify 0 regressions

### Phase 2: Breaking Changes (Day 2-3)

1. Fix circular dependencies (ORM structure changes)
2. Update repositories to use mappers
3. Replace Error throws with domain exceptions

**Validation**:

- `pnpm circular` shows 0 dependencies
- Integration tests pass
- E2E tests pass

### Phase 3: Documentation & Cleanup (Day 3)

1. Update architecture docs
2. Update copilot instructions
3. Add code comments
4. Review migrations

**Validation**: Code review, documentation review

### Rollback Strategy

If critical issues found:

**During Phase 1**: Simple `git revert` of individual commits

**During Phase 2**:

1. Revert ORM changes
2. Keep domain exceptions (they're useful even without full adoption)
3. Keep mapper classes (can coexist with inline mapping)

**After Phase 3**: Not recommended, forward-fix instead

## Open Questions

1. **Should we migrate existing Error catches to domain exceptions immediately?**
   - Proposal: No, let old code continue working, only new code uses domain exceptions
   - Alternative: Update all at once (higher risk)

2. **Should Comment entity become part of Post aggregate?**
   - Current: Comment is separate entity with postId reference
   - Proposal: Keep separate for now (Post aggregate already manages tags and status)
   - Alternative: Make Comment a child entity of Post (larger refactoring)

3. **Should we add domain events to FileMetadata entity?**
   - Current: FileMetadata extends AggregateRoot but doesn't emit events
   - Proposal: Add FileUploadedEvent, FileDeletedEvent
   - Alternative: Skip for now, add when needed

4. **Database migration for circular dependency fix - generate or manual?**
   - Proposal: Let TypeORM generate, review carefully, test extensively
   - Alternative: Write manual migration (more control, more work)

**Resolution Required Before Implementation**: Question 4 (migration strategy)

## Success Criteria

- ✅ `pnpm circular` reports 0 circular dependencies
- ✅ All aggregates (Post, Conversation, FileMetadata) extend AggregateRoot
- ✅ All repositories use dedicated mapper classes
- ✅ All domain layer exceptions extend DomainException (no generic Error)
- ✅ User entity emits domain events for all state changes
- ✅ Test coverage remains ≥80%
- ✅ All tests pass (unit, integration, E2E)
- ✅ ESLint reports 0 errors
- ✅ Documentation updated to reflect new patterns
