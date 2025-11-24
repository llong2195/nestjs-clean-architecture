## ADDED Requirements

### Requirement: Domain Exception Hierarchy

The domain layer SHALL use typed domain exceptions instead of generic `Error` for all validation and business rule violations.

#### Scenario: Domain exceptions extend base class

- **GIVEN** a domain exception class (e.g., InvalidEmailException)
- **WHEN** examining the class definition
- **THEN** the exception SHALL extend DomainException base class
- **AND** the exception SHALL NOT extend HttpException or any framework-specific exception
- **AND** the exception SHALL provide a descriptive error message with context

#### Scenario: Value object validation uses domain exceptions

- **GIVEN** an Email value object with invalid input
- **WHEN** calling Email.create('invalid-email')
- **THEN** the method SHALL throw InvalidEmailException
- **AND** the exception message SHALL include the invalid email value
- **AND** the exception SHALL NOT leak framework details

#### Scenario: Entity validation uses domain exceptions

- **GIVEN** a User entity with invalid username length
- **WHEN** calling user.updateProfile(userName: 'ab')
- **THEN** the method SHALL throw UserNameTooShortException
- **AND** the exception SHALL include minimum length requirement in message
- **AND** the exception SHALL be catchable as DomainException base type

#### Scenario: Exception filter maps domain exceptions to HTTP

- **GIVEN** a DomainExceptionFilter registered globally
- **WHEN** a controller action throws InvalidEmailException
- **THEN** the filter SHALL catch the domain exception
- **AND** the filter SHALL map it to appropriate HTTP status (400 Bad Request)
- **AND** the response SHALL use standardized error format { status, message, errorCode }

### Requirement: AggregateRoot Consistency

All aggregate root entities SHALL extend the AggregateRoot base class to ensure consistent domain event handling.

#### Scenario: Post aggregate extends AggregateRoot

- **GIVEN** the Post aggregate class
- **WHEN** examining the class definition
- **THEN** Post SHALL extend AggregateRoot
- **AND** Post SHALL NOT have a manual domainEvents array
- **AND** Post SHALL use inherited addDomainEvent() method (protected)
- **AND** Post SHALL use inherited domainEvents getter, clearDomainEvents(), and hasDomainEvents()

#### Scenario: User entity extends AggregateRoot

- **GIVEN** the User entity class
- **WHEN** examining the class definition
- **THEN** User SHALL extend AggregateRoot
- **AND** User SHALL emit domain events for all state changes
- **AND** User SHALL use inherited event management methods

#### Scenario: Aggregate emits events correctly

- **GIVEN** a Post aggregate that has been published
- **WHEN** calling post.getDomainEvents() or accessing post.domainEvents
- **THEN** the events array SHALL contain PostPublishedEvent
- **AND** the event SHALL implement IDomainEvent interface
- **AND** the event SHALL have correct aggregateId, eventType, and payload

### Requirement: User Domain Events

The User entity SHALL emit domain events for all significant state changes to enable event-driven features.

#### Scenario: User creation emits UserCreatedEvent

- **GIVEN** valid user registration data
- **WHEN** calling User.create(email, password, userName)
- **THEN** the user instance SHALL add UserCreatedEvent to domain events
- **AND** the event SHALL include email, userName, provider, and role
- **AND** the event aggregateId SHALL match the user's ID

#### Scenario: Profile update emits UserProfileUpdatedEvent

- **GIVEN** an existing user
- **WHEN** calling user.updateProfile(userName: 'newname', email: 'new@example.com')
- **THEN** the user SHALL add UserProfileUpdatedEvent to domain events
- **AND** the event SHALL include old and new values
- **AND** the event occurredOn SHALL be current timestamp

#### Scenario: Password change emits UserPasswordChangedEvent

- **GIVEN** an existing user with local provider
- **WHEN** calling user.changePassword('newSecurePassword123!')
- **THEN** the user SHALL add UserPasswordChangedEvent to domain events
- **AND** the event SHALL NOT include the actual password (security)
- **AND** the event SHALL indicate a password change occurred

#### Scenario: Deactivation emits UserDeactivatedEvent

- **GIVEN** an active user
- **WHEN** calling user.deactivate()
- **THEN** the user SHALL add UserDeactivatedEvent to domain events
- **AND** the user isActive status SHALL be false
- **AND** the event SHALL include the reason if provided

#### Scenario: Role change emits UserRoleChangedEvent

- **GIVEN** a user with USER role
- **WHEN** calling user.promoteToAdmin()
- **THEN** the user SHALL add UserRoleChangedEvent to domain events
- **AND** the event SHALL include previousRole: 'USER' and newRole: 'ADMIN'
- **AND** the event SHALL be publishable via transactional outbox

### Requirement: No Framework Dependencies in Domain

The domain layer SHALL remain framework-agnostic with zero imports from NestJS or TypeORM.

#### Scenario: Domain entities are pure TypeScript

- **GIVEN** any file in src/modules/\*/domain/entities/
- **WHEN** analyzing imports
- **THEN** the file SHALL NOT import from '@nestjs/\*'
- **AND** the file SHALL NOT import from 'typeorm'
- **AND** the file SHALL NOT import from 'class-validator'
- **AND** the file MAY import from shared/domain-events/ (framework-agnostic)

#### Scenario: Value objects are pure TypeScript

- **GIVEN** any file in src/modules/\*/domain/value-objects/
- **WHEN** analyzing imports
- **THEN** the file SHALL NOT import any framework-specific packages
- **AND** the file SHALL only use standard TypeScript/JavaScript features
- **AND** validation logic SHALL be self-contained

#### Scenario: Domain exceptions are framework-agnostic

- **GIVEN** any file in src/modules/\*/domain/exceptions/
- **WHEN** analyzing the exception class
- **THEN** the exception SHALL extend DomainException (pure Error subclass)
- **AND** the exception SHALL NOT extend HttpException
- **AND** the exception SHALL NOT reference HTTP status codes

### Requirement: Conversation Aggregate Event Completeness

The Conversation aggregate SHALL emit comprehensive domain events for all state transitions.

#### Scenario: Conversation creation emits ConversationCreatedEvent

- **GIVEN** valid conversation creation parameters
- **WHEN** calling Conversation.create(name, type, createdBy, participants)
- **THEN** the conversation SHALL add ConversationCreatedEvent to domain events
- **AND** the event SHALL include type, participant count, and creator ID

#### Scenario: Message addition emits MessageSentEvent

- **GIVEN** an active conversation
- **WHEN** calling conversation.addMessage(senderId, content)
- **THEN** the conversation SHALL add MessageSentEvent to domain events
- **AND** the event SHALL include messageId, senderId, and conversationId
- **AND** existing MessageSentEvent implementation SHALL be verified/updated to comply

#### Scenario: Participant changes emit events

- **GIVEN** a group conversation
- **WHEN** calling conversation.addParticipant(userId, addedBy)
- **THEN** the conversation SHALL add ParticipantAddedEvent to domain events
- **WHEN** calling conversation.removeParticipant(userId, removedBy)
- **THEN** the conversation SHALL add ParticipantRemovedEvent to domain events

## MODIFIED Requirements

None - These are new requirements to enforce domain layer purity and consistency.

## REMOVED Requirements

None - No existing requirements are being removed, only enhanced.
