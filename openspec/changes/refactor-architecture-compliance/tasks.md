## 1. Preparation & Analysis

- [ ] 1.1 Document all circular dependency paths with madge graph visualization
- [ ] 1.2 Run full test suite and record baseline coverage (pnpm test:cov)
- [ ] 1.3 Review database schema for FK constraints affected by ORM changes
- [ ] 1.4 Create backup branch from current state

## 2. Domain Exception Foundation

- [ ] 2.1 Create `src/shared/domain-events/exceptions/domain.exception.ts` base class
- [ ] 2.2 Create `src/modules/user/domain/exceptions/` directory with user-specific exceptions
  - InvalidEmailException
  - InvalidPasswordException
  - WeakPasswordException
  - UserNameTooShortException
  - UserNameTooLongException
- [ ] 2.3 Create `src/modules/post/domain/exceptions/` directory with post-specific exceptions
  - EmptyPostTitleException
  - PostTitleTooLongException
  - EmptyPostContentException
  - InvalidPostStateException
- [ ] 2.4 Create `src/modules/conversation/domain/exceptions/` directory
  - InvalidParticipantCountException
  - NotParticipantException
  - ConversationInactiveException
  - EmptyMessageException
- [ ] 2.5 Update all domain entities to use typed exceptions instead of `throw new Error()`
- [ ] 2.6 Update all value objects to use typed exceptions
- [ ] 2.7 Run unit tests and fix any breaking changes

## 3. Extract Repository Mappers

- [ ] 3.1 Create `src/modules/user/infrastructure/mappers/user-orm.mapper.ts`
- [ ] 3.2 Move `toOrmEntity()` method from UserRepository to UserOrmMapper.toDomain()
- [ ] 3.3 Move `toDomain()` method from UserRepository to UserOrmMapper.toOrm()
- [ ] 3.4 Inject UserOrmMapper into UserRepository constructor
- [ ] 3.5 Update UserRepository to use injected mapper
- [ ] 3.6 Add UserOrmMapper to user.module.ts providers
- [ ] 3.7 Run integration tests for user repository
- [ ] 3.8 Apply same pattern to PostRepository if similar issue exists
- [ ] 3.9 Apply same pattern to FileRepository if similar issue exists

## 4. Fix Post Aggregate

- [ ] 4.1 Update Post class to extend AggregateRoot base class
- [ ] 4.2 Remove manual `domainEvents` array and methods (use inherited)
- [ ] 4.3 Change `addDomainEvent()` visibility from private to protected (use base class)
- [ ] 4.4 Update `getDomainEvents()` to use inherited `domainEvents` getter
- [ ] 4.5 Update `clearDomainEvents()` to use inherited method
- [ ] 4.6 Run unit tests for Post aggregate
- [ ] 4.7 Run integration tests for Post repository
- [ ] 4.8 Verify PostPublishedEvent and PostArchivedEvent still emit correctly

## 5. Add User Domain Events

- [ ] 5.1 Create `src/modules/user/domain/events/user.events.ts` file
- [ ] 5.2 Implement UserCreatedEvent with proper IDomainEvent interface
- [ ] 5.3 Implement UserProfileUpdatedEvent
- [ ] 5.4 Implement UserDeactivatedEvent
- [ ] 5.5 Implement UserPasswordChangedEvent
- [ ] 5.6 Implement UserRoleChangedEvent
- [ ] 5.7 Update User entity to extend AggregateRoot (if not already)
- [ ] 5.8 Emit UserCreatedEvent in User.create() factory method
- [ ] 5.9 Emit UserProfileUpdatedEvent in updateProfile() method
- [ ] 5.10 Emit UserDeactivatedEvent in deactivate() method
- [ ] 5.11 Emit UserPasswordChangedEvent in changePassword() method
- [ ] 5.12 Emit UserRoleChangedEvent in promoteToAdmin/Moderator/demoteToUser methods
- [ ] 5.13 Update CreateUserUseCase to publish events via DomainEventPublisher
- [ ] 5.14 Update UpdateUserUseCase to publish events
- [ ] 5.15 Run unit tests for User entity
- [ ] 5.16 Run integration tests for user flows

## 6. Fix Circular Dependencies

- [ ] 6.1 Analyze conversation ORM entity relationships
- [ ] 6.2 Remove `@OneToMany` back-reference from ConversationParticipantOrmEntity to ConversationOrmEntity (use ID only)
- [ ] 6.3 Remove `@OneToMany` back-reference from MessageOrmEntity to ConversationOrmEntity (use ID only)
- [ ] 6.4 Update ConversationRepository queries to use explicit joins instead of navigation properties
- [ ] 6.5 Analyze post ORM entity relationships
- [ ] 6.6 Remove bidirectional reference between PostOrmEntity and CommentOrmEntity
- [ ] 6.7 Update CommentOrmEntity to reference postId as string instead of full PostOrmEntity
- [ ] 6.8 Update PostRepository to load comments with explicit join queries
- [ ] 6.9 Run `pnpm circular` and verify 0 circular dependencies
- [ ] 6.10 Generate migration if database schema changes (review carefully)
- [ ] 6.11 Run integration tests for conversation repository
- [ ] 6.12 Run integration tests for post repository
- [ ] 6.13 Run E2E tests for conversation flows
- [ ] 6.14 Run E2E tests for post flows

## 7. Update Use Case Error Handling

- [ ] 7.1 Update CreateUserUseCase to throw DuplicateEmailException (use existing from common/exceptions)
- [ ] 7.2 Update UpdateUserUseCase to throw UserNotFoundException and validation exceptions
- [ ] 7.3 Update DeleteUserUseCase to throw UserNotFoundException
- [ ] 7.4 Update GetUserUseCase to throw UserNotFoundException
- [ ] 7.5 Review all post use cases for proper exception usage
- [ ] 7.6 Review all conversation use cases for proper exception usage
- [ ] 7.7 Ensure exception filters properly map domain exceptions to HTTP responses
- [ ] 7.8 Run E2E tests for error scenarios (invalid input, not found, etc.)

## 8. Improve Conversation Aggregate

- [ ] 8.1 Verify Conversation aggregate extends AggregateRoot
- [ ] 8.2 Emit ConversationCreatedEvent in Conversation.create()
- [ ] 8.3 Emit MessageSentEvent in addMessage() method
- [ ] 8.4 Emit ParticipantAddedEvent in addParticipant() method
- [ ] 8.5 Emit ParticipantRemovedEvent in removeParticipant() method
- [ ] 8.6 Emit ConversationArchivedEvent in archive() method
- [ ] 8.7 Verify existing events (MessageSentEvent, MessageReadEvent, etc.) properly implement IDomainEvent
- [ ] 8.8 Run unit tests for Conversation aggregate
- [ ] 8.9 Run integration tests for conversation flows

## 9. Documentation Updates

- [ ] 9.1 Update README.md with new exception handling patterns
- [ ] 9.2 Update docs/architecture.md with mapper pattern examples
- [ ] 9.3 Update .github/copilot-instructions.md with domain exception guidelines
- [ ] 9.4 Add code comments explaining why circular deps were removed
- [ ] 9.5 Document domain event emission patterns in contributing guide

## 10. Testing & Validation

- [ ] 10.1 Run full test suite: `pnpm test`
- [ ] 10.2 Run integration tests: `pnpm test:integration`
- [ ] 10.3 Run E2E tests: `pnpm test:e2e`
- [ ] 10.4 Run coverage report: `pnpm test:cov` (ensure >=80% maintained)
- [ ] 10.5 Verify circular dependencies: `pnpm circular` (must be 0)
- [ ] 10.6 Run ESLint: `pnpm lint`
- [ ] 10.7 Test exception handling manually via Swagger UI
- [ ] 10.8 Verify domain events publish to outbox table
- [ ] 10.9 Test error scenarios (invalid input, not found, unauthorized)
- [ ] 10.10 Review code diff to ensure no unintended changes

## 11. Database Migration Review

- [ ] 11.1 Review generated migrations for FK constraint changes
- [ ] 11.2 Test migration up/down on development database
- [ ] 11.3 Verify no data loss occurs during migration
- [ ] 11.4 Document any manual migration steps required
- [ ] 11.5 Create rollback plan in case of issues

## 12. Final Validation

- [ ] 12.1 Code review checklist: Domain layer has no framework imports
- [ ] 12.2 Code review checklist: All aggregates extend AggregateRoot
- [ ] 12.3 Code review checklist: All repositories use dedicated mappers
- [ ] 12.4 Code review checklist: All domain exceptions extend DomainException
- [ ] 12.5 Code review checklist: No circular dependencies detected
- [ ] 12.6 Performance baseline test (compare before/after response times)
- [ ] 12.7 Update CHANGELOG.md with refactoring summary
- [ ] 12.8 Tag commit with version following semantic versioning

---

## Dependencies & Parallelization

**Can be parallelized:**

- Section 2 (Domain Exceptions) and Section 3 (Mappers) are independent
- Section 4 (Post Aggregate) and Section 5 (User Events) are independent
- Documentation (Section 9) can start after technical work completes

**Must be sequential:**

- Section 1 (Preparation) must complete before all others
- Section 6 (Circular Deps) should complete before integration tests (10.2, 10.3)
- Section 11 (Migration Review) must follow Section 6
- Section 12 (Final Validation) must be last

**Critical Path:**
1 → 6 → 11 → 10 → 12

**Estimated Effort:**

- Section 1: 1 hour
- Section 2: 3 hours
- Section 3: 2 hours
- Section 4: 1 hour
- Section 5: 3 hours
- Section 6: 4 hours (highest risk)
- Section 7: 2 hours
- Section 8: 2 hours
- Section 9: 1 hour
- Section 10: 2 hours
- Section 11: 2 hours
- Section 12: 1 hour

**Total: ~24 hours (3 working days)**
