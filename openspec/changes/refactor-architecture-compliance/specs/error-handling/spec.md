## ADDED Requirements

### Requirement: Domain Exception Base Class

The system SHALL provide a DomainException base class that all domain-specific exceptions extend.

#### Scenario: DomainException extends Error

- **GIVEN** the DomainException base class
- **WHEN** examining the class hierarchy
- **THEN** DomainException SHALL extend Error
- **AND** DomainException SHALL be an abstract class
- **AND** DomainException SHALL capture stack traces properly
- **AND** DomainException constructor SHALL accept a message parameter

#### Scenario: Domain exceptions are catchable as Error

- **GIVEN** code that throws InvalidEmailException
- **WHEN** catching with `catch (error: Error)`
- **THEN** the catch block SHALL successfully catch the exception
- **AND** the error SHALL be instanceof DomainException
- **AND** the error SHALL be instanceof Error
- **AND** backward compatibility with existing error handling is maintained

### Requirement: User Domain Exceptions

The User module SHALL provide specific exception types for all validation and business rule violations.

#### Scenario: InvalidEmailException for email validation

- **GIVEN** invalid email format
- **WHEN** Email.create('not-an-email') is called
- **THEN** the method SHALL throw InvalidEmailException
- **AND** the exception message SHALL include the invalid email value
- **AND** the exception SHALL extend DomainException

#### Scenario: InvalidPasswordException for password validation

- **GIVEN** invalid password (e.g., too short, missing complexity)
- **WHEN** Password.create('weak') is called
- **THEN** the method SHALL throw appropriate exception (WeakPasswordException, PasswordTooShortException)
- **AND** the exception message SHALL explain the validation rule violated
- **AND** the exception SHALL provide actionable feedback

#### Scenario: UserNameTooShortException for username validation

- **GIVEN** username with less than 3 characters
- **WHEN** User.create(..., userName: 'ab') is called
- **THEN** the method SHALL throw UserNameTooShortException
- **AND** the exception message SHALL include minimum length requirement (3)
- **AND** the exception message SHALL include the provided username length

#### Scenario: UserNameTooLongException for username validation

- **GIVEN** username exceeding 50 characters
- **WHEN** User.create(..., userName: 'a'.repeat(51)) is called
- **THEN** the method SHALL throw UserNameTooLongException
- **AND** the exception message SHALL include maximum length requirement (50)

### Requirement: Post Domain Exceptions

The Post module SHALL provide specific exception types for all content and state transition validations.

#### Scenario: EmptyPostTitleException for title validation

- **GIVEN** empty or whitespace-only title
- **WHEN** Post.create(authorId, title: '', content) is called
- **THEN** the method SHALL throw EmptyPostTitleException
- **AND** the exception message SHALL indicate title cannot be empty

#### Scenario: PostTitleTooLongException for title length validation

- **GIVEN** title exceeding 200 characters
- **WHEN** Post.create(authorId, title: 'a'.repeat(201), content) is called
- **THEN** the method SHALL throw PostTitleTooLongException
- **AND** the exception message SHALL include maximum length (200)

#### Scenario: EmptyPostContentException for content validation

- **GIVEN** empty or whitespace-only content
- **WHEN** Post.create(authorId, title, content: '') is called
- **THEN** the method SHALL throw EmptyPostContentException
- **AND** the exception message SHALL indicate content cannot be empty

#### Scenario: InvalidPostStateException for state transitions

- **GIVEN** a published post
- **WHEN** calling post.publish() again
- **THEN** the method SHALL throw InvalidPostStateException
- **AND** the exception message SHALL indicate current state and attempted transition
- **AND** the exception message SHALL explain why transition is invalid

### Requirement: Conversation Domain Exceptions

The Conversation module SHALL provide specific exception types for all business rule violations.

#### Scenario: InvalidParticipantCountException for direct conversations

- **GIVEN** attempt to create direct conversation with 3 participants
- **WHEN** Conversation.create(name, ConversationType.DIRECT, createdBy, [user1, user2, user3])
- **THEN** the method SHALL throw InvalidParticipantCountException
- **AND** the exception message SHALL indicate direct conversations require exactly 2 participants

#### Scenario: NotParticipantException for unauthorized actions

- **GIVEN** a conversation with specific participants
- **WHEN** a non-participant tries to send message
- **THEN** the method SHALL throw NotParticipantException
- **AND** the exception message SHALL include userId and conversationId

#### Scenario: ConversationInactiveException for archived conversations

- **GIVEN** an archived conversation
- **WHEN** calling conversation.addMessage(senderId, content)
- **THEN** the method SHALL throw ConversationInactiveException
- **AND** the exception message SHALL indicate conversation is archived

#### Scenario: EmptyMessageException for message validation

- **GIVEN** empty or whitespace-only message content
- **WHEN** calling conversation.addMessage(senderId, '')
- **THEN** the method SHALL throw EmptyMessageException
- **AND** the exception message SHALL indicate message content cannot be empty

### Requirement: Use Case Error Handling

Use cases SHALL throw domain exceptions for validation errors and use common exceptions for HTTP-level concerns.

#### Scenario: CreateUserUseCase throws DuplicateEmailException

- **GIVEN** an existing user with email 'test@example.com'
- **WHEN** CreateUserUseCase.execute({ email: 'test@example.com', ... })
- **THEN** the use case SHALL throw DuplicateEmailException (from common/exceptions)
- **AND** the exception SHALL be caught by global exception filter
- **AND** the HTTP response SHALL be 409 Conflict

#### Scenario: GetUserUseCase throws UserNotFoundException

- **GIVEN** no user exists with ID '123'
- **WHEN** GetUserUseCase.execute('123')
- **THEN** the use case SHALL throw UserNotFoundException (from common/exceptions)
- **AND** the exception SHALL be caught by global exception filter
- **AND** the HTTP response SHALL be 404 Not Found

#### Scenario: Domain exceptions propagate through use cases

- **GIVEN** CreateUserUseCase receives invalid email
- **WHEN** User.create() throws InvalidEmailException
- **THEN** the use case SHALL let the exception propagate (no catch)
- **AND** the DomainExceptionFilter SHALL catch it
- **AND** the HTTP response SHALL be 400 Bad Request

### Requirement: Exception Filter Mapping

The system SHALL provide exception filters that map domain exceptions to appropriate HTTP responses.

#### Scenario: DomainExceptionFilter catches domain exceptions

- **GIVEN** a controller action throws a DomainException subclass
- **WHEN** the exception propagates to the filter layer
- **THEN** DomainExceptionFilter SHALL catch it
- **AND** the filter SHALL map exception type to HTTP status code
- **AND** the response SHALL use standardized format { status: 'error', message, meta }

#### Scenario: Validation exceptions map to 400 Bad Request

- **GIVEN** InvalidEmailException, WeakPasswordException, EmptyPostTitleException
- **WHEN** caught by DomainExceptionFilter
- **THEN** the HTTP status code SHALL be 400
- **AND** the error code SHALL indicate validation failure

#### Scenario: State transition exceptions map to 409 Conflict

- **GIVEN** InvalidPostStateException
- **WHEN** caught by DomainExceptionFilter
- **THEN** the HTTP status code SHALL be 409
- **AND** the error message SHALL explain the invalid state transition

#### Scenario: Authorization exceptions map to 403 Forbidden

- **GIVEN** NotParticipantException
- **WHEN** caught by DomainExceptionFilter
- **THEN** the HTTP status code SHALL be 403
- **AND** the error message SHALL indicate insufficient permissions

### Requirement: Exception Error Codes

Domain exceptions SHALL provide unique error codes for programmatic error handling by API clients.

#### Scenario: Each exception type has unique error code

- **GIVEN** any domain exception class
- **WHEN** examining the exception properties
- **THEN** the exception SHALL provide an errorCode property
- **AND** the error code SHALL be unique within the module
- **AND** the error code SHALL follow pattern MODULE_ERROR_NAME (e.g., USER_INVALID_EMAIL)

#### Scenario: Error codes included in API responses

- **GIVEN** a request that triggers InvalidEmailException
- **WHEN** the exception is caught and transformed to HTTP response
- **THEN** the response body SHALL include errorCode field
- **AND** the errorCode SHALL be 'USER_INVALID_EMAIL'
- **AND** clients SHALL be able to handle specific errors programmatically

## MODIFIED Requirements

None - These are new requirements to standardize error handling across the domain layer.

## REMOVED Requirements

None - Existing error handling continues to work, these requirements enhance it.
