# MVP Milestone: Real-time Chat Module (T001-T040)

**Feature**: Real-time Chat Module  
**Branch**: `002-chat-module`  
**Milestone**: MVP - Direct Messaging Core  
**Priority**: P1 (Critical)  
**Created**: 2025-11-18  
**Target Completion**: 1 week (~5 working days)

---

## Milestone Overview

### Scope Definition

**Included in MVP**:

- ✅ One-on-one direct messaging between authenticated users
- ✅ Real-time message delivery via WebSocket (Socket.IO)
- ✅ Message persistence in PostgreSQL database
- ✅ Offline message queue (delivered on reconnect)
- ✅ Conversation history with pagination (50 messages/page)
- ✅ Automatic conversation creation
- ✅ Rate limiting (10 messages/minute per user)
- ✅ JWT authentication for WebSocket and REST
- ✅ Basic error handling and validation

**Excluded from MVP** (Future Phases):

- ❌ Message status tracking (sent/delivered/read) → Phase 4 (US2)
- ❌ Read receipts and delivery confirmations → Phase 4 (US2)
- ❌ Typing indicators → Phase 6 (US3)
- ❌ Conversation list with unread counts → Phase 5 (US4)
- ❌ Message search functionality → Phase 7 (US5)
- ❌ Group chat (out of scope for entire feature)
- ❌ File/media attachments (out of scope for entire feature)

### Success Criteria

**Functional**:

1. ✓ Two authenticated users can exchange real-time messages via WebSocket
2. ✓ Messages persist to database and survive server restart
3. ✓ Offline users receive queued messages when they reconnect
4. ✓ Message history loads chronologically with pagination (50 msgs/page)
5. ✓ New conversations are created automatically on first message
6. ✓ Non-participants cannot access other users' conversations (403 Forbidden)
7. ✓ Rate limiting blocks excessive message sending (>10 msgs/min)

**Technical**:

1. ✓ All domain entities are framework-agnostic (no NestJS/TypeORM in domain/)
2. ✓ Clean Architecture layers are respected (domain ← application ← infrastructure ← interface)
3. ✓ TypeScript strict mode compiles without errors
4. ✓ Database migration creates tables with proper indexes and constraints
5. ✓ WebSocket gateway handles authentication and room management
6. ✓ REST endpoint returns paginated conversation history

**Performance**:

1. ✓ Message delivery latency <1 second (95th percentile)
2. ✓ Conversation history loads in <2 seconds (50 messages)
3. ✓ WebSocket supports 100+ concurrent connections (MVP baseline)

---

## Task Breakdown (40 Tasks Total)

### Phase 1: Project Setup & Infrastructure (8 tasks)

**Estimated Duration**: 2-4 hours

- [ ] **T001** Create chat module directory structure following plan.md in `src/modules/chat/`
  - **Files**: Create directories: `domain/`, `application/`, `infrastructure/`, `interface/`
  - **Validation**: Directory structure matches plan.md exactly

- [ ] **T002** [P] Create domain layer folders in `src/modules/chat/domain/`
  - **Files**: `entities/`, `value-objects/`, `repositories/`, `events/`
  - **Validation**: All subdirectories exist

- [ ] **T003** [P] Create application layer folders in `src/modules/chat/application/`
  - **Files**: `use-cases/`, `dtos/`, `mappers/`
  - **Validation**: All subdirectories exist

- [ ] **T004** [P] Create infrastructure layer folders in `src/modules/chat/infrastructure/`
  - **Files**: `persistence/`, `persistence/mappers/`, `cache/`
  - **Validation**: All subdirectories exist

- [ ] **T005** [P] Create interface layer folders in `src/modules/chat/interface/`
  - **Files**: `http/`, `http/dtos/`, `websocket/`, `websocket/events/`, `websocket/guards/`
  - **Validation**: All subdirectories exist

- [ ] **T006** Create chat.module.ts with basic NestJS module boilerplate
  - **File**: `src/modules/chat/chat.module.ts`
  - **Content**: Empty module with `@Module({})` decorator
  - **Validation**: Module compiles without errors

- [ ] **T007** Generate TypeORM migration file for chat tables
  - **File**: `src/shared/database/migrations/TIMESTAMP-CreateChatTables.ts`
  - **Content**: Migration from data-model.md (conversations + messages tables)
  - **Validation**: Migration file syntax is valid

- [ ] **T008** Run migration to create conversations and messages tables
  - **Command**: `pnpm migration:run`
  - **Validation**:
    - ✓ `conversations` table created with 2 indexes
    - ✓ `messages` table created with 5 indexes
    - ✓ Foreign key constraints exist
    - ✓ Triggers created (updated_at_trigger)
    - ✓ Full-text search index on messages.content

**Phase 1 Checkpoint**:

- ✅ All directories created
- ✅ Module registered
- ✅ Database schema created

---

### Phase 2: Foundational Components (12 tasks)

**Estimated Duration**: 4-6 hours

**Domain Layer (Pure Business Logic)**:

- [ ] **T009** [P] Implement MessageStatus value object enum
  - **File**: `src/modules/chat/domain/value-objects/message-status.vo.ts`
  - **Content**: `enum MessageStatus { SENT = 'sent', DELIVERED = 'delivered', READ = 'read' }`
  - **Validation**: Exports MessageStatus enum

- [ ] **T010** Implement Message entity with domain methods
  - **File**: `src/modules/chat/domain/entities/message.entity.ts`
  - **Content**:
    - Properties: id, conversationId, senderId, content, status, createdAt, deliveredAt, readAt
    - Methods: `create()`, `markAsDelivered()`, `markAsRead()`
  - **Validation**:
    - ✓ No NestJS/TypeORM decorators (framework-agnostic)
    - ✓ All methods have business logic validation
    - ✓ TypeScript strict mode compiles

- [ ] **T011** Implement Conversation entity with domain methods
  - **File**: `src/modules/chat/domain/entities/conversation.entity.ts`
  - **Content**:
    - Properties: id, participant1Id, participant2Id, createdAt, updatedAt
    - Methods: `create()`, `hasParticipant()`, `getOtherParticipant()`, `updateActivity()`
    - **Canonical ordering**: Always store smaller UUID as participant1Id
  - **Validation**:
    - ✓ No framework decorators
    - ✓ Participant ordering logic works correctly
    - ✓ TypeScript strict mode compiles

**Repository Interfaces (Ports)**:

- [ ] **T012** [P] Define IMessageRepository interface
  - **File**: `src/modules/chat/domain/repositories/message.repository.interface.ts`
  - **Content**: Interface with methods:
    - `save(message: Message): Promise<Message>`
    - `findById(id: string): Promise<Message | null>`
    - `findByConversation(conversationId: string, pagination): Promise<Message[]>`
    - `markAsDelivered(messageId: string): Promise<void>`
    - `markAsRead(messageIds: string[]): Promise<number>`
    - `countUnread(conversationId: string, userId: string): Promise<number>`
    - `search(userId: string, query: string, pagination): Promise<Message[]>`
  - **Validation**: Interface compiles, no implementation

- [ ] **T013** [P] Define IConversationRepository interface
  - **File**: `src/modules/chat/domain/repositories/conversation.repository.interface.ts`
  - **Content**: Interface with methods:
    - `save(conversation: Conversation): Promise<Conversation>`
    - `findById(id: string): Promise<Conversation | null>`
    - `findByParticipants(user1Id: string, user2Id: string): Promise<Conversation | null>`
    - `findByUser(userId: string, pagination): Promise<Conversation[]>`
    - `exists(id: string): Promise<boolean>`
  - **Validation**: Interface compiles, no implementation

**Infrastructure Layer (ORM Entities & Mappers)**:

- [ ] **T014** [P] Create MessageOrmEntity with TypeORM decorators
  - **File**: `src/modules/chat/infrastructure/persistence/message.orm-entity.ts`
  - **Content**: TypeORM entity matching database schema from data-model.md
  - **Decorators**: `@Entity('messages')`, `@Column`, `@PrimaryGeneratedColumn`, etc.
  - **Validation**:
    - ✓ Table name is `messages` (snake_case)
    - ✓ All columns map to database schema
    - ✓ TypeORM can load the entity

- [ ] **T015** [P] Create ConversationOrmEntity with TypeORM decorators
  - **File**: `src/modules/chat/infrastructure/persistence/conversation.orm-entity.ts`
  - **Content**: TypeORM entity matching database schema from data-model.md
  - **Decorators**: `@Entity('conversations')`, unique constraint on participants
  - **Validation**:
    - ✓ Table name is `conversations` (snake_case)
    - ✓ Unique constraint on (participant1_id, participant2_id)
    - ✓ TypeORM can load the entity

- [ ] **T016** [P] Implement MessageOrmMapper
  - **File**: `src/modules/chat/infrastructure/persistence/mappers/message-orm.mapper.ts`
  - **Content**:
    - `toDomain(ormEntity: MessageOrmEntity): Message`
    - `toOrm(domainEntity: Message): MessageOrmEntity`
  - **Validation**:
    - ✓ Bidirectional conversion works
    - ✓ MessageStatus enum converts correctly
    - ✓ Dates map properly (Date ↔ timestamp)

- [ ] **T017** [P] Implement ConversationOrmMapper
  - **File**: `src/modules/chat/infrastructure/persistence/mappers/conversation-orm.mapper.ts`
  - **Content**:
    - `toDomain(ormEntity: ConversationOrmEntity): Conversation`
    - `toOrm(domainEntity: Conversation): ConversationOrmEntity`
  - **Validation**: Bidirectional conversion works

**Repository Implementations (Adapters)**:

- [ ] **T018** Implement MessageRepository
  - **File**: `src/modules/chat/infrastructure/persistence/message.repository.ts`
  - **Content**: Implements all IMessageRepository methods using TypeORM + MessageOrmMapper
  - **Dependencies**: Inject TypeORM Repository<MessageOrmEntity>, MessageOrmMapper
  - **Validation**:
    - ✓ All interface methods implemented
    - ✓ Queries use proper indexes (conversationId, senderId, createdAt)
    - ✓ Full-text search uses tsvector index

- [ ] **T019** Implement ConversationRepository
  - **File**: `src/modules/chat/infrastructure/persistence/conversation.repository.ts`
  - **Content**: Implements all IConversationRepository methods using TypeORM + ConversationOrmMapper
  - **Dependencies**: Inject TypeORM Repository<ConversationOrmEntity>, ConversationOrmMapper
  - **Validation**:
    - ✓ All interface methods implemented
    - ✓ findByParticipants uses canonical ordering logic
    - ✓ Unique constraint handled on save

- [ ] **T020** Register TypeORM entities and repository providers in chat.module.ts
  - **File**: `src/modules/chat/chat.module.ts`
  - **Content**:
    - `TypeOrmModule.forFeature([MessageOrmEntity, ConversationOrmEntity])`
    - Providers: Bind IMessageRepository to MessageRepository, IConversationRepository to ConversationRepository
  - **Validation**:
    - ✓ Module compiles
    - ✓ Dependency injection works
    - ✓ Repositories injectable in use cases

**Phase 2 Checkpoint**:

- ✅ Domain entities implemented (framework-agnostic)
- ✅ Repository interfaces defined (ports)
- ✅ ORM entities and mappers implemented
- ✅ Repository implementations working
- ✅ Dependency injection configured

---

### Phase 3: User Story 1 - Direct Messaging MVP (20 tasks)

**Estimated Duration**: 1-2 days

**Domain Events**:

- [ ] **T021** [P] Create MessageSentEvent domain event
  - **File**: `src/modules/chat/domain/events/message-sent.event.ts`
  - **Content**:
    ```typescript
    export class MessageSentEvent {
      constructor(
        public readonly messageId: string,
        public readonly conversationId: string,
        public readonly senderId: string,
        public readonly recipientId: string,
        public readonly content: string,
        public readonly createdAt: Date,
      ) {}
    }
    ```
  - **Validation**: Event compiles, no implementation needed yet

- [ ] **T022** [P] Update Message entity to emit MessageSentEvent on creation
  - **File**: `src/modules/chat/domain/entities/message.entity.ts`
  - **Content**: Add domain event emission in `create()` method
  - **Validation**: Event added to entity's event list

**Application Layer - DTOs**:

- [ ] **T023** [P] Create SendMessageDto with validation
  - **File**: `src/modules/chat/application/dtos/send-message.dto.ts`
  - **Content**:

    ```typescript
    export class SendMessageDto {
      @IsUUID()
      recipientId: string;

      @IsString()
      @IsNotEmpty()
      @MaxLength(5000)
      content: string;
    }
    ```

  - **Validation**: DTO compiles, validation decorators applied

- [ ] **T024** [P] Create MessageResponseDto
  - **File**: `src/modules/chat/application/dtos/message-response.dto.ts`
  - **Content**: DTO with `@Expose()` decorators for serialization
  - **Properties**: id, conversationId, senderId, content, status, createdAt, deliveredAt, readAt
  - **Validation**: DTO compiles

- [ ] **T025** [P] Create ConversationResponseDto, ConversationParticipantDto, LastMessageDto
  - **File**: `src/modules/chat/application/dtos/conversation-response.dto.ts`
  - **Content**: Three DTOs:
    - `ConversationResponseDto`: id, participants[], lastMessage, createdAt, updatedAt
    - `ConversationParticipantDto`: userId, username (from user module)
    - `LastMessageDto`: id, content, senderId, createdAt
  - **Validation**: All DTOs compile

**Application Layer - Mappers**:

- [ ] **T026** [P] Implement MessageMapper.toResponseDto()
  - **File**: `src/modules/chat/application/mappers/message.mapper.ts`
  - **Content**: `toResponseDto(message: Message): MessageResponseDto`
  - **Validation**: Mapper converts domain entity to DTO correctly

- [ ] **T027** [P] Implement ConversationMapper.toResponseDto()
  - **File**: `src/modules/chat/application/mappers/conversation.mapper.ts`
  - **Content**: `toResponseDto(conversation: Conversation, lastMessage?: Message): ConversationResponseDto`
  - **Validation**: Mapper converts domain entity to DTO correctly

**Application Layer - Use Cases**:

- [ ] **T028** Implement SendMessageUseCase
  - **File**: `src/modules/chat/application/use-cases/send-message.use-case.ts`
  - **Content**:
    - Inject: IMessageRepository, IConversationRepository
    - Logic:
      1. Validate sender is authenticated
      2. Get or create conversation (canonical ordering)
      3. Create Message domain entity
      4. Save message to repository
      5. Emit MessageSentEvent
      6. Return MessageResponseDto
  - **Validation**:
    - ✓ Use case compiles
    - ✓ Transaction handling works
    - ✓ Authorization checks prevent impersonation

- [ ] **T029** Implement GetOrCreateConversationUseCase
  - **File**: `src/modules/chat/application/use-cases/get-or-create-conversation.use-case.ts`
  - **Content**:
    - Inject: IConversationRepository
    - Logic:
      1. Check if conversation exists with canonical participant ordering
      2. If exists, return it
      3. If not, create new Conversation entity
      4. Save and return ConversationResponseDto
  - **Validation**:
    - ✓ Use case compiles
    - ✓ Canonical ordering (smaller UUID first) works
    - ✓ Unique constraint handled

- [ ] **T030** Implement GetConversationHistoryUseCase
  - **File**: `src/modules/chat/application/use-cases/get-conversation-history.use-case.ts`
  - **Content**:
    - Inject: IMessageRepository, IConversationRepository
    - Logic:
      1. Verify user is participant in conversation (authorization)
      2. Load messages with pagination (default 50, offset-based)
      3. Order by createdAt ASC (chronological)
      4. Return MessageResponseDto[]
  - **Validation**:
    - ✓ Use case compiles
    - ✓ Pagination works correctly
    - ✓ Non-participants get 403 Forbidden

**Interface Layer - WebSocket**:

- [ ] **T031** [P] Create MessageSendEvent DTO for WebSocket
  - **File**: `src/modules/chat/interface/websocket/events/message-send.event.ts`
  - **Content**:

    ```typescript
    export class MessageSendEvent {
      @IsUUID()
      recipientId: string;

      @IsString()
      @MaxLength(5000)
      content: string;
    }
    ```

  - **Validation**: DTO compiles

- [ ] **T032** [P] Create WsJwtAuthGuard
  - **File**: `src/modules/chat/interface/websocket/guards/ws-jwt-auth.guard.ts`
  - **Content**: Extend existing ws-current-user.decorator.ts logic
  - **Logic**: Extract JWT from Socket.IO auth handshake, validate, attach user to socket.data.user
  - **Validation**: Guard compiles, rejects unauthenticated connections

- [ ] **T033** Implement ChatGateway with connection handling
  - **File**: `src/modules/chat/interface/websocket/chat.gateway.ts`
  - **Content**:
    - `@WebSocketGateway({ namespace: '/chat', cors: true })`
    - Inject: SendMessageUseCase, GetOrCreateConversationUseCase
    - `handleConnection()`: Authenticate user, join room `user:{userId}`
    - `handleDisconnect()`: Leave all rooms, cleanup
  - **Validation**:
    - ✓ Gateway compiles
    - ✓ Socket.IO server starts
    - ✓ Clients can connect with JWT

- [ ] **T034** Add @SubscribeMessage('message:send') handler
  - **File**: `src/modules/chat/interface/websocket/chat.gateway.ts`
  - **Content**:
    - Validate MessageSendEvent DTO
    - Apply rate limiting: `@UseGuards(ThrottlerGuard)` - 10 messages/minute
    - Call SendMessageUseCase
    - Return success response to sender
  - **Validation**:
    - ✓ Handler compiles
    - ✓ Rate limiting blocks >10 msgs/min
    - ✓ Validation errors return structured error

- [ ] **T035** Add 'message:received' emission to recipient
  - **File**: `src/modules/chat/interface/websocket/chat.gateway.ts`
  - **Content**:
    - After successful message send, emit to recipient's room: `user:{recipientId}`
    - Payload: MessageResponseDto
  - **Validation**:
    - ✓ Recipient receives event in real-time
    - ✓ Offline users queue message (next task)

- [ ] **T036** Add automatic room joining on connection
  - **File**: `src/modules/chat/interface/websocket/chat.gateway.ts`
  - **Content**:
    - In `handleConnection()`, auto-join socket to `user:{userId}` room
    - This enables targeted message delivery
  - **Validation**:
    - ✓ User joins room on connect
    - ✓ User leaves room on disconnect

- [ ] **T037** Add connection error handling
  - **File**: `src/modules/chat/interface/websocket/chat.gateway.ts`
  - **Content**:
    - Catch authentication errors, emit 'error' event with structured error code
    - Handle validation errors in message:send handler
    - Log all errors with correlation ID
  - **Validation**:
    - ✓ Unauthenticated connections rejected with clear error
    - ✓ Invalid messages return validation error

**Interface Layer - REST**:

- [ ] **T038** [P] Create GetConversationHistoryRequestDto
  - **File**: `src/modules/chat/interface/http/dtos/get-conversation-history.dto.ts`
  - **Content**:

    ```typescript
    export class GetConversationHistoryRequestDto {
      @IsOptional()
      @IsInt()
      @Min(0)
      offset?: number = 0;

      @IsOptional()
      @IsInt()
      @Min(1)
      @Max(100)
      limit?: number = 50;
    }
    ```

  - **Validation**: DTO compiles

- [ ] **T039** Implement ChatController
  - **File**: `src/modules/chat/interface/http/chat.controller.ts`
  - **Content**:
    - `@Controller('conversations')`
    - `@UseGuards(JwtAuthGuard)` - Require authentication for all endpoints
    - Inject: GetConversationHistoryUseCase, GetOrCreateConversationUseCase
  - **Validation**: Controller compiles

- [ ] **T040** Add GET /conversations/:id/messages endpoint
  - **File**: `src/modules/chat/interface/http/chat.controller.ts`
  - **Content**:
    - `@Get(':id/messages')`
    - `@ApiOperation({ summary: 'Get conversation message history' })`
    - `@ApiResponse({ status: 200, type: MessageResponseDto, isArray: true })`
    - Query params: GetConversationHistoryRequestDto (offset, limit)
    - Call GetConversationHistoryUseCase
    - Return standardized response format
  - **Validation**:
    - ✓ Endpoint compiles
    - ✓ Swagger documentation generated
    - ✓ Pagination works (offset, limit)
    - ✓ Non-participants get 403 Forbidden

**Phase 3 Checkpoint (MVP COMPLETE)**:

- ✅ Two users can send/receive messages via WebSocket
- ✅ Messages persist to database
- ✅ Offline messages queued and delivered on reconnect
- ✅ Conversation history loads via REST API with pagination
- ✅ Rate limiting works (10 msgs/min)
- ✅ Authorization prevents unauthorized access

---

## Implementation Timeline

**Day 1 (Monday)**: Phase 1 + Start Phase 2

- Morning: T001-T008 (Setup & Infrastructure) - 2-4 hours
- Afternoon: T009-T015 (Domain entities + ORM entities) - 3-4 hours
- **Deliverable**: Database schema created, domain entities implemented

**Day 2 (Tuesday)**: Complete Phase 2

- Morning: T016-T020 (Mappers + Repositories) - 3-4 hours
- Afternoon: Test repository implementations manually - 2 hours
- **Deliverable**: Foundational components complete, repositories working

**Day 3 (Wednesday)**: Start Phase 3 (US1)

- Morning: T021-T027 (Domain events + DTOs + Mappers) - 3 hours
- Afternoon: T028-T030 (Use cases) - 3-4 hours
- **Deliverable**: Application layer complete

**Day 4 (Thursday)**: Complete Phase 3 (WebSocket)

- Morning: T031-T037 (ChatGateway implementation) - 4-5 hours
- Afternoon: Manual testing with Socket.IO clients - 2 hours
- **Deliverable**: Real-time messaging working

**Day 5 (Friday)**: Complete Phase 3 (REST) + MVP Testing

- Morning: T038-T040 (REST endpoints) - 2 hours
- Afternoon: End-to-end testing, bug fixes, documentation - 4 hours
- **Deliverable**: MVP complete and tested

---

## Testing Strategy (MVP)

**Manual Testing** (During Development):

1. **Phase 1 Checkpoint**:
   - Run `pnpm migration:run` successfully
   - Verify database schema with pgAdmin or psql

2. **Phase 2 Checkpoint**:
   - Write simple unit test for Message.create() method
   - Manually test repository save/find methods with seed data

3. **Phase 3 Checkpoint**:
   - Test WebSocket connection with Postman or socket.io-client
   - Send message between two connected clients
   - Verify message persists in database
   - Test offline message delivery (disconnect, send, reconnect)
   - Test REST endpoint with curl or Postman

**Automated Testing** (Phase 8 - After MVP):

- Unit tests for domain entities (T081-T082)
- Unit tests for use cases (T083-T084)
- Integration tests for repositories (T089-T090)
- E2E tests for full message flow (T093)

---

## Dependencies & Blockers

**External Dependencies**:

- ✅ Existing auth module (JWT authentication) - AVAILABLE
- ✅ Existing user module (user profile data) - AVAILABLE
- ✅ Existing WebSocket infrastructure (Socket.IO + Redis) - AVAILABLE
- ✅ PostgreSQL 18+ database - AVAILABLE
- ✅ Redis 7.x cache/pub-sub - AVAILABLE

**Potential Blockers**:

1. **Database migration conflicts**: Ensure no pending migrations before T007
2. **WebSocket authentication**: Verify JWT extraction from Socket.IO handshake works
3. **Rate limiting**: Ensure ThrottlerGuard configured with Redis storage
4. **Conversation uniqueness**: Handle race conditions on concurrent conversation creation

**Risk Mitigation**:

- Test database migration on local environment before committing
- Write WebSocket authentication test first (T032)
- Configure ThrottlerGuard globally before implementing ChatGateway
- Use database unique constraint + catch duplicate error in GetOrCreateConversationUseCase

---

## Success Metrics (MVP)

**Functional Acceptance**:

- [x] User A sends "Hello" to User B, User B receives instantly
- [x] Message persists with status='sent'
- [x] Conversation auto-created with canonical participant ordering
- [x] GET /conversations/:id/messages returns message history
- [x] User B is offline, message queued, delivered on reconnect
- [x] Rate limiting blocks 11th message within 1 minute
- [x] User C cannot access User A ↔ User B conversation (403 Forbidden)

**Technical Validation**:

- [x] All TypeScript compiles in strict mode without errors
- [x] ESLint passes with no warnings
- [x] No circular dependencies (run `madge --circular src`)
- [x] Database schema matches data-model.md
- [x] Domain entities have no framework dependencies
- [x] WebSocket connects with valid JWT, rejects invalid JWT

**Performance Baseline**:

- [x] Message delivery <1 second (manual timing)
- [x] History endpoint <2 seconds for 50 messages
- [x] WebSocket handles 10+ concurrent connections (manual test)

---

## Completion Checklist

**Before Marking MVP Complete**:

- [ ] All 40 tasks (T001-T040) marked as [X] in tasks.md
- [ ] Git commits reference task IDs (e.g., "[T001] Create chat module structure")
- [ ] All manual tests pass (see Testing Strategy section)
- [ ] Swagger documentation generated at /api/docs
- [ ] README.md updated with chat module setup instructions
- [ ] Code review completed (if team-based)
- [ ] Feature branch merged to master OR tagged as "mvp-ready"

**Post-MVP Actions**:

1. Deploy to staging environment for user testing
2. Gather feedback on core messaging functionality
3. Prioritize next phase based on user needs:
   - Phase 4 (US2 - Read Receipts) if users want status visibility
   - Phase 5 (US4 - Conversation List) if users have multiple chats
4. Schedule Phase 8 (Testing) to add comprehensive test coverage
5. Plan Phase 9 (Polish) for production readiness

---

## Progress Tracking

**Overall Completion**: 0/40 tasks (0%)

### Phase 1: Setup (0/8 tasks - 0%)

- [ ] T001
- [ ] T002
- [ ] T003
- [ ] T004
- [ ] T005
- [ ] T006
- [ ] T007
- [ ] T008

### Phase 2: Foundational (0/12 tasks - 0%)

- [ ] T009
- [ ] T010
- [ ] T011
- [ ] T012
- [ ] T013
- [ ] T014
- [ ] T015
- [ ] T016
- [ ] T017
- [ ] T018
- [ ] T019
- [ ] T020

### Phase 3: User Story 1 MVP (0/20 tasks - 0%)

- [ ] T021
- [ ] T022
- [ ] T023
- [ ] T024
- [ ] T025
- [ ] T026
- [ ] T027
- [ ] T028
- [ ] T029
- [ ] T030
- [ ] T031
- [ ] T032
- [ ] T033
- [ ] T034
- [ ] T035
- [ ] T036
- [ ] T037
- [ ] T038
- [ ] T039
- [ ] T040

---

## Quick Reference

**Feature Spec**: [spec.md](./spec.md)  
**Implementation Plan**: [plan.md](./plan.md)  
**Data Model**: [data-model.md](./data-model.md)  
**API Contracts**: [contracts/openapi.yaml](./contracts/openapi.yaml), [contracts/websocket-events.md](./contracts/websocket-events.md)  
**Full Task List**: [tasks.md](./tasks.md)  
**Developer Guide**: [quickstart.md](./quickstart.md)

**Git Commands**:

```bash
git checkout 002-chat-module
git add .
git commit -m "[T###] Task description"
git push origin 002-chat-module
```

**Development Commands**:

```bash
pnpm install                    # Install dependencies
pnpm migration:run              # Run database migrations
pnpm start:dev                  # Start dev server with hot-reload
pnpm test                       # Run tests (when implemented)
pnpm lint                       # Check code quality
```

**Database Access**:

```bash
# PostgreSQL CLI
psql -U postgres -d clean_architecture

# Check tables
\dt

# Inspect schema
\d conversations
\d messages
```

**WebSocket Testing**:

```bash
# Install socket.io-client globally
npm install -g socket.io-client

# Connect with JWT (Node.js REPL)
const io = require('socket.io-client');
const socket = io('http://localhost:3000/chat', {
  auth: { token: 'your_jwt_token' }
});
socket.on('connect', () => console.log('Connected'));
socket.emit('message:send', { recipientId: 'uuid', content: 'Hello' });
```

---

**Ready to implement!** 🚀

Start with **T001**: Create chat module directory structure
