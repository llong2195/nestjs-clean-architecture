# Tasks: Real-time Chat Module

**Feature**: Real-time Chat Module  
**Branch**: `002-chat-module`  
**Tech Stack**: NestJS 11.x, TypeScript 5.x, TypeORM 0.3.x, Socket.IO 4.x, Redis 7.x, PostgreSQL 18+  
**Package Manager**: pnpm 10.x+ (REQUIRED)

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/rest-api.yaml, contracts/websocket-events.md

**Tests**: Per Constitution Principle III, testing is mandatory. All tasks include comprehensive unit/integration/e2e tests. Target >80% coverage for critical modules.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. Follow Clean Architecture layering (Constitution Principle I).

**Constitution Compliance**: All tasks adhere to the 8 core principles defined in `.specify/memory/constitution.md`.

---

## Overview

This task list implements real-time messaging with WebSocket (Socket.IO), extending the existing `conversation` module. Each phase builds upon the previous, following Clean Architecture principles.

**Key Principles**:

- MVP-first: User Story 1 (P1) is the minimum viable product
- Incremental delivery: Each user story is a complete, testable feature
- Parallel execution: Tasks marked [P] can be implemented simultaneously
- Clean Architecture: All tasks respect domain → application → infrastructure → interface layering
- Module reuse: Extends existing `src/modules/conversation/` module (no new chat module)

**Total Estimated Tasks**: 95 tasks  
**Parallel Opportunities**: 48+ tasks can run in parallel  
**MVP Scope**: Phase 1-3 (Setup + Foundational + User Story 1)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Database schema updates and module configuration

**Estimated Duration**: 2-3 hours

**Note**: Existing conversation module structure already exists. This phase adds missing infrastructure.

- [ ] T001 Generate TypeORM migration for conversation indexes in src/shared/database/migrations/
- [ ] T002 [P] Create application/use-cases/ directory in src/modules/conversation/
- [ ] T003 [P] Create application/dtos/ directory in src/modules/conversation/
- [ ] T004 [P] Create infrastructure/cache/ directory in src/modules/conversation/
- [ ] T005 [P] Create interface/http/controllers/ directory in src/modules/conversation/
- [ ] T006 [P] Create interface/http/dtos/ directory in src/modules/conversation/
- [ ] T007 Run migration to add indexes: idx_messages_search_vector (GIN), idx_messages_conversation_created, idx_conversation_participants_user_active
- [ ] T008 Update conversation.module.ts to import WebSocketModule, CacheModule, LoggerModule

**Validation**:

- ✓ All directory structure matches plan.md exactly
- ✓ Migration adds 3 performance indexes without errors
- ✓ Module imports all required shared modules
- ✓ Running `pnpm migration:run` succeeds without errors

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

**Estimated Duration**: 6-8 hours

- [ ] T009 [P] Create domain/events/message-sent.event.ts in src/modules/conversation/
- [ ] T010 [P] Create domain/events/typing-started.event.ts in src/modules/conversation/
- [ ] T011 [P] Create infrastructure/mappers/conversation.mapper.ts with toDomain() and toOrm() methods
- [ ] T012 [P] Create infrastructure/mappers/message.mapper.ts with toDomain() and toOrm() methods
- [ ] T013 Implement ConversationRepository from interface in src/modules/conversation/infrastructure/persistence/conversation.repository.ts
- [ ] T014 Add methods to ConversationRepository: save, findById, findByParticipants, findByUser, getUnreadCount
- [ ] T015 Add methods to ConversationRepository: searchMessages (using PostgreSQL tsvector)
- [ ] T016 [P] Create infrastructure/cache/typing-indicator.cache.ts with Redis SETEX (3-second TTL)
- [ ] T017 Register all repository providers and mappers in conversation.module.ts

**Validation**:

- ✓ Domain events are pure TypeScript classes (no NestJS decorators)
- ✓ All repository methods have proper type signatures
- ✓ Mappers correctly transform between ORM and domain entities
- ✓ Module providers array includes all repository bindings
- ✓ TypingIndicatorCache uses Redis with 3-second TTL

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Direct Messaging and Group Conversations (Priority: P1) 🎯 MVP

**User Story**: Users can send and receive real-time text messages in both one-on-one conversations and group conversations with multiple participants. Messages are delivered instantly when recipients are online, and stored for offline delivery when recipients are unavailable.

**Goal**: Implement core messaging functionality with real-time delivery for DIRECT and GROUP conversation types

**Estimated Duration**: 2-3 days

**Independent Test Criteria**:

- ✓ Two users can exchange messages in real-time via WebSocket (DIRECT conversation)
- ✓ Three+ users can exchange messages in group chat (GROUP conversation)
- ✓ Messages are persisted and survive server restart
- ✓ Offline messages are delivered when recipient reconnects
- ✓ Message history loads chronologically with pagination
- ✓ DIRECT conversations enforce uniqueness (same 2 users = 1 conversation)
- ✓ GROUP conversations allow multiple instances with same participants

### Application Layer - DTOs

- [ ] T018 [P] [US1] Create SendMessageDto with validation (@IsUUID conversationId, @IsString content, @MinLength(1), @MaxLength(5000)) in src/modules/conversation/application/dtos/send-message.dto.ts
- [ ] T019 [P] [US1] Create CreateConversationDto with validation (@IsEnum type, @IsArray participantIds, @IsOptional name) in src/modules/conversation/application/dtos/create-conversation.dto.ts
- [ ] T020 [P] [US1] Create MessageResponseDto with @Expose decorators in src/modules/conversation/application/dtos/message-response.dto.ts
- [ ] T021 [P] [US1] Create ConversationResponseDto with lastMessage, unreadCount fields in src/modules/conversation/application/dtos/conversation-response.dto.ts

### Application Layer - Use Cases

- [ ] T022 [US1] Implement SendMessageUseCase with conversation participant check, rate limiting (10 msgs/min) in src/modules/conversation/application/use-cases/send-message.use-case.ts
- [ ] T023 [US1] Implement CreateConversationUseCase with type validation (DIRECT=2 participants, GROUP=3+) in src/modules/conversation/application/use-cases/create-conversation.use-case.ts
- [ ] T024 [US1] Add DIRECT uniqueness check to CreateConversationUseCase (query before creation, return existing if found)
- [ ] T025 [US1] Implement GetMessageHistoryUseCase with pagination (before/limit params, 50 msgs default) in src/modules/conversation/application/use-cases/get-message-history.use-case.ts
- [ ] T026 [US1] Implement AddParticipantUseCase with GROUP-only validation in src/modules/conversation/application/use-cases/add-participant.use-case.ts

### Infrastructure Layer - Offline Delivery

- [ ] T027 [P] [US1] Create BullMQ queue configuration for offline-delivery in src/modules/conversation/infrastructure/queues/offline-delivery.queue.ts
- [ ] T028 [P] [US1] Create OfflineDeliveryWorker with exponential backoff (2s, 4s, 8s) in src/modules/conversation/infrastructure/workers/offline-delivery.worker.ts

### Interface Layer - WebSocket (Gateway Enhancement)

- [ ] T029 [P] [US1] Create WsJwtAuthGuard extending WsCurrentUserDecorator in src/modules/conversation/interface/websocket/ws-jwt-auth.guard.ts
- [ ] T030 [US1] Enhance ConversationGateway with connection authentication (JWT from auth parameter)
- [ ] T031 [US1] Add automatic room joining on connection: user:{userId}, conversation:{conversationId} for all user's conversations
- [ ] T032 [US1] Add @SubscribeMessage('message:send') handler in ConversationGateway with rate limiting (@UseGuards(ThrottlerGuard))
- [ ] T033 [US1] Implement message:send handler to call SendMessageUseCase and emit to conversation room
- [ ] T034 [US1] Add 'message:received' emission to conversation:{conversationId} room (broadcasts to all participants)
- [ ] T035 [US1] Add WebSocket error handling with structured error codes (CHAT_UNAUTHORIZED, CHAT_FORBIDDEN, CHAT_RATE_LIMIT_EXCEEDED)
- [ ] T036 [US1] Add disconnect handler to clean up user rooms and typing indicators

### Interface Layer - REST (New Controller)

- [ ] T037 [P] [US1] Create ConversationController with @Controller('conversations') in src/modules/conversation/interface/http/controllers/conversation.controller.ts
- [ ] T038 [P] [US1] Create HTTP DTOs in src/modules/conversation/interface/http/dtos/: CreateConversationRequestDto, GetMessagesQueryDto, SendMessageRequestDto
- [ ] T039 [US1] Add POST /conversations endpoint with @ApiTags, @ApiOperation, @ApiResponse decorators in ConversationController
- [ ] T040 [US1] Add GET /conversations endpoint with pagination (limit/offset params) in ConversationController
- [ ] T041 [US1] Add GET /conversations/:id/messages endpoint with pagination (before/limit params) in ConversationController
- [ ] T042 [US1] Add POST /conversations/:id/participants endpoint (GROUP only) in ConversationController
- [ ] T043 [US1] Add authentication guards (@UseGuards(JwtAuthGuard)) to all ConversationController endpoints

**Validation** (MVP Acceptance):

- ✓ User A sends message to User B via WebSocket, User B receives instantly (DIRECT conversation)
- ✓ User A creates group with Users B and C, all 3 can send/receive messages (GROUP conversation)
- ✓ Message persists to database with isDelivered=false, isRead=false
- ✓ DIRECT conversation creation with same 2 users returns existing conversation (uniqueness enforced)
- ✓ GROUP conversation creation with same participants creates new conversation (no uniqueness)
- ✓ GET /conversations/:id/messages returns 50 messages in chronological order (oldest first)
- ✓ Offline user receives message when they reconnect (BullMQ offline delivery)
- ✓ Rate limiting blocks > 10 messages/minute per user
- ✓ Non-participant cannot access conversation (403 Forbidden)

**Parallel Opportunities**: T018-T021, T027-T029, T037-T038 (9 tasks can run in parallel)

**Checkpoint**: At this point, User Story 1 (MVP) should be fully functional and testable independently

---

## Phase 4: User Story 2 - Message Status and Read Receipts (Priority: P2)

**User Story**: Users can see whether their messages have been delivered and read by recipients. The system provides visual indicators for message states: sent, delivered, and read.

**Goal**: Track and broadcast message status transitions using boolean fields (isDelivered, isRead)

**Estimated Duration**: 1 day

**Independent Test Criteria**:

- ✓ Message status updates to isDelivered=true when recipient receives it
- ✓ Message status updates to isRead=true when recipient views conversation
- ✓ Sender sees status changes in real-time via WebSocket
- ✓ Status transitions follow correct order (sent → delivered → read)

### Domain Events

- [ ] T044 [P] [US2] Create MessageDeliveredEvent domain event in src/modules/conversation/domain/events/message-delivered.event.ts
- [ ] T045 [P] [US2] Create MessageReadEvent domain event in src/modules/conversation/domain/events/message-read.event.ts

### Application Layer

- [ ] T046 [P] [US2] Create MarkMessagesReadDto with validation (@IsUUID conversationId, @IsOptional @IsDate lastReadAt) in src/modules/conversation/application/dtos/mark-messages-read.dto.ts
- [ ] T047 [US2] Implement MarkMessagesAsReadUseCase with participant authorization check in src/modules/conversation/application/use-cases/mark-messages-as-read.use-case.ts
- [ ] T048 [US2] Add markAsDelivered() and markAsRead() business logic to Message entity if not already present

### Interface Layer - WebSocket

- [ ] T049 [US2] Add @SubscribeMessage('messages:delivered') handler in ConversationGateway calling Message.markAsDelivered()
- [ ] T050 [US2] Add @SubscribeMessage('messages:read') handler in ConversationGateway calling MarkMessagesAsReadUseCase
- [ ] T051 [US2] Add 'message:status_changed' emission to sender when status updates (delivered or read)
- [ ] T052 [US2] Update 'message:received' handler to auto-mark message as delivered (isDelivered=true) when emitted

### Interface Layer - REST

- [ ] T053 [US2] Add PATCH /conversations/:id/messages/read endpoint in ConversationController with Swagger decorators

**Validation**:

- ✓ Recipient receives message, status changes to isDelivered=true, sender sees update via WebSocket
- ✓ Recipient opens conversation, all messages marked isRead=true, sender sees update
- ✓ Status timestamps (createdAt, updatedAt) are recorded correctly
- ✓ PATCH /conversations/:id/messages/read returns success response
- ✓ Only conversation participants can mark messages as read (403 for non-participants)

**Parallel Opportunities**: T044-T046 (3 tasks)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 4 - Conversation List and Management (Priority: P2)

**User Story**: Users can view all their active conversations in a list, sorted by most recent activity. Each conversation shows a preview of the last message and unread message count.

**Goal**: Implement conversation list with last message preview, unread counts, and real-time updates

**Estimated Duration**: 1 day

**Independent Test Criteria**:

- ✓ Conversation list sorted by most recent message timestamp (updatedAt DESC)
- ✓ Unread message count displayed for each conversation (derived from last_read_at)
- ✓ Last message preview shown (first 50 characters)
- ✓ List updates in real-time when new message arrives
- ✓ Pagination works correctly (limit/offset)

### Infrastructure Layer - Caching

- [ ] T054 [P] [US4] Implement ConversationCacheService with Redis for caching conversation list in src/modules/conversation/infrastructure/cache/conversation-cache.service.ts
- [ ] T055 [P] [US4] Add cache invalidation on new message, mark-as-read in ConversationCacheService with 60-second TTL

### Application Layer

- [ ] T056 [P] [US4] Create GetConversationListDto with pagination params (@IsOptional @IsInt limit, @IsOptional @IsInt offset, @IsOptional @IsEnum type) in src/modules/conversation/application/dtos/get-conversation-list.dto.ts
- [ ] T057 [US4] Implement GetConversationListUseCase with Redis caching, sorting by updatedAt DESC in src/modules/conversation/application/use-cases/get-conversation-list.use-case.ts
- [ ] T058 [US4] Add unread count calculation in GetConversationListUseCase using ConversationRepository.getUnreadCount()
- [ ] T059 [US4] Add last message loading with truncation to 50 chars in GetConversationListUseCase

### Interface Layer - REST

- [ ] T060 [P] [US4] Update GET /conversations endpoint implementation with pagination, type filtering, caching in ConversationController
- [ ] T061 [US4] Add GET /conversations/:id endpoint for single conversation details in ConversationController

### Interface Layer - WebSocket

- [ ] T062 [US4] Add 'conversation:updated' event emission on new message in ConversationGateway
- [ ] T063 [US4] Add automatic cache invalidation trigger on message send/read in ConversationGateway

**Validation**:

- ✓ GET /conversations returns sorted list with correct unread counts
- ✓ New message arrival updates conversation list in real-time via 'conversation:updated' event
- ✓ Cached conversation list improves response time (<100ms for cached)
- ✓ Pagination works correctly with limit/offset parameters
- ✓ Last message preview truncates at 50 characters (per spec)
- ✓ Type filter works (DIRECT vs GROUP conversations)

**Parallel Opportunities**: T054-T056, T060 (4 tasks)

**Checkpoint**: At this point, User Stories 1, 2, AND 4 should all work independently

---

## Phase 6: User Story 3 - Typing Indicators (Priority: P3)

**User Story**: Users can see when the other person is actively typing a message in the conversation. This provides real-time feedback about engagement without requiring message sending.

**Goal**: Implement ephemeral typing state with Redis TTL and real-time broadcasting

**Estimated Duration**: 6-8 hours

**Independent Test Criteria**:

- ✓ User A starts typing, User B sees "User A is typing..." indicator
- ✓ Indicator disappears after 3 seconds of inactivity (TTL expiration)
- ✓ Indicator disappears immediately when message is sent
- ✓ Typing state doesn't persist across server restart (ephemeral Redis-only)
- ✓ Multiple users can type simultaneously in group conversations

### Application Layer

- [ ] T064 [P] [US3] Create StartTypingDto with validation (@IsUUID conversationId) in src/modules/conversation/application/dtos/start-typing.dto.ts
- [ ] T065 [US3] Implement StartTypingUseCase with participant authorization check in src/modules/conversation/application/use-cases/start-typing.use-case.ts

### Infrastructure Layer

- [ ] T066 [P] [US3] Add startTyping(conversationId, userId) method to TypingIndicatorCache with Redis key pattern typing:{conversationId}:{userId}
- [ ] T067 [P] [US3] Add stopTyping(conversationId, userId) method to TypingIndicatorCache with Redis DEL
- [ ] T068 [P] [US3] Add getTypingUsers(conversationId) method to TypingIndicatorCache to retrieve active typers

### Interface Layer - WebSocket

- [ ] T069 [US3] Add @SubscribeMessage('typing:start') handler in ConversationGateway calling StartTypingUseCase
- [ ] T070 [US3] Add @SubscribeMessage('typing:stop') handler in ConversationGateway calling TypingIndicatorCache.stopTyping()
- [ ] T071 [US3] Add 'typing:indicator' event broadcast to conversation room (excludes sender)
- [ ] T072 [US3] Add automatic typing:stop trigger when message is sent (in message:send handler)
- [ ] T073 [US3] Add rate limiting to typing:start (max 1 event/second per user) using @UseGuards(ThrottlerGuard)

**Validation**:

- ✓ typing:start event broadcasts 'typing:indicator' to other participants
- ✓ Redis TTL auto-expires typing indicator after 3 seconds
- ✓ typing:stop event clears indicator immediately
- ✓ Sending message auto-triggers typing:stop
- ✓ Multiple users can type simultaneously in group conversations
- ✓ Rate limiting prevents spam (max 1 typing:start per second)
- ✓ Only conversation participants can trigger typing indicators (403 for non-participants)

**Parallel Opportunities**: T064, T066-T068 (4 tasks can run in parallel)

**Checkpoint**: At this point, User Stories 1, 2, 3, AND 4 should all work independently

---

## Phase 7: User Story 5 - Message Search and History (Priority: P3)

**User Story**: Users can search through their message history to find specific conversations or messages. Search works across all conversations and supports text matching.

**Goal**: Implement full-text search using PostgreSQL tsvector with relevance ranking

**Estimated Duration**: 1 day

**Independent Test Criteria**:

- ✓ Search finds messages containing keyword across all user's conversations
- ✓ Results ranked by relevance (ts_rank)
- ✓ Search returns within 3 seconds for 10,000 messages
- ✓ User can only search their own conversations (security check)
- ✓ Empty query returns 400 Bad Request

### Application Layer

- [ ] T074 [P] [US5] Create SearchMessagesDto with query validation (@IsString @MinLength(1) @MaxLength(100) query) in src/modules/conversation/application/dtos/search-messages.dto.ts
- [ ] T075 [P] [US5] Create MessageSearchResultDto extending MessageResponseDto with rank field in src/modules/conversation/application/dtos/message-search-result.dto.ts
- [ ] T076 [US5] Implement SearchMessagesUseCase with authorization, pagination (limit 50) in src/modules/conversation/application/use-cases/search-messages.use-case.ts

### Infrastructure Layer

- [ ] T077 [US5] Implement full-text search in ConversationRepository.searchMessages() using PostgreSQL plainto_tsquery and ts_rank
- [ ] T078 [US5] Add user authorization filter to search query (only search conversations user participates in)
- [ ] T079 [US5] Add result limiting (max 50 results) and relevance sorting (ORDER BY ts_rank DESC) in search query

### Interface Layer - REST

- [ ] T080 [P] [US5] Create SearchMessagesRequestDto for HTTP request in src/modules/conversation/interface/http/dtos/search-messages-request.dto.ts
- [ ] T081 [US5] Add POST /messages/search endpoint in ConversationController with Swagger decorators
- [ ] T082 [US5] Add pagination metadata (total, hasMore) to search response in ConversationController
- [ ] T083 [US5] Add error handling for empty search query and no results in ConversationController

**Validation**:

- ✓ POST /messages/search with query "hello" returns all matching messages
- ✓ Results sorted by relevance (highest ts_rank first)
- ✓ Search limited to user's conversations only (cannot see other users' messages)
- ✓ Search completes within 3 seconds for 10,000 messages (performance test with sample data)
- ✓ Empty query returns 400 Bad Request with structured error code
- ✓ Pagination works correctly (limit parameter)

**Parallel Opportunities**: T074-T075, T080 (3 tasks)

**Checkpoint**: At this point, all user stories (1-5) should be independently functional

---

## Phase 8: Testing & Quality Assurance

**Goal**: Comprehensive test coverage (>80%) across all layers per Constitution Principle III

**Estimated Duration**: 2-3 days

### Unit Tests (Domain & Application)

- [ ] T084 [P] Write unit tests for Conversation aggregate (create, addMessage, addParticipant, validateType) in test/unit/conversation/aggregates/conversation.aggregate.spec.ts
- [ ] T085 [P] Write unit tests for Message entity (create, markAsDelivered, markAsRead, validation) in test/unit/conversation/entities/message.entity.spec.ts
- [ ] T086 [P] Write unit tests for SendMessageUseCase with mocked repositories in test/unit/conversation/use-cases/send-message.use-case.spec.ts
- [ ] T087 [P] Write unit tests for CreateConversationUseCase with DIRECT uniqueness check in test/unit/conversation/use-cases/create-conversation.use-case.spec.ts
- [ ] T088 [P] Write unit tests for GetMessageHistoryUseCase with pagination in test/unit/conversation/use-cases/get-message-history.use-case.spec.ts
- [ ] T089 [P] Write unit tests for MarkMessagesAsReadUseCase with authorization in test/unit/conversation/use-cases/mark-messages-as-read.use-case.spec.ts
- [ ] T090 [P] Write unit tests for GetConversationListUseCase with caching in test/unit/conversation/use-cases/get-conversation-list.use-case.spec.ts
- [ ] T091 [P] Write unit tests for SearchMessagesUseCase with authorization in test/unit/conversation/use-cases/search-messages.use-case.spec.ts
- [ ] T092 [P] Write unit tests for mappers (ConversationMapper, MessageMapper) in test/unit/conversation/mappers/

### Integration Tests (Infrastructure)

- [ ] T093 [P] Write integration tests for ConversationRepository with test containers (PostgreSQL) in test/integration/conversation/repositories/conversation.repository.spec.ts
- [ ] T094 [P] Write integration tests for DIRECT conversation uniqueness constraint in test/integration/conversation/repositories/conversation-uniqueness.spec.ts
- [ ] T095 [P] Write integration tests for full-text search with tsvector in test/integration/conversation/repositories/message-search.spec.ts
- [ ] T096 [P] Write integration tests for ConversationCacheService with test Redis in test/integration/conversation/cache/conversation-cache.service.spec.ts
- [ ] T097 [P] Write integration tests for TypingIndicatorCache with TTL validation in test/integration/conversation/cache/typing-indicator.cache.spec.ts

### E2E Tests (Full Flows)

- [ ] T098 Write E2E test for full message flow (send → receive → deliver → read) with 2 Socket.IO clients in test/e2e/conversation.e2e-spec.ts
- [ ] T099 Write E2E test for group conversation with 3+ participants in test/e2e/conversation-group.e2e-spec.ts
- [ ] T100 Write E2E test for conversation list with pagination and unread counts in test/e2e/conversation-list.e2e-spec.ts
- [ ] T101 Write E2E test for multi-instance WebSocket scaling with Redis pub/sub in test/e2e/conversation-multi-instance.e2e-spec.ts
- [ ] T102 Write E2E test for offline message delivery via BullMQ in test/e2e/conversation-offline.e2e-spec.ts

**Validation**:

- ✓ All unit tests pass with >80% coverage for domain/application layers
- ✓ Integration tests use test containers (isolated PostgreSQL and Redis)
- ✓ E2E tests validate complete user scenarios end-to-end
- ✓ Multi-instance test confirms Redis pub/sub works across instances
- ✓ Running `pnpm test` passes all tests
- ✓ Running `pnpm test:cov` shows >80% coverage for conversation module

**Parallel Opportunities**: All 19 test tasks can run in parallel (T084-T102)

---

## Phase 9: Polish & Cross-Cutting Concerns

**Goal**: Add observability, error handling, documentation, and performance optimizations

**Estimated Duration**: 1 day

### Error Handling

- [ ] T103 [P] Define conversation-specific error codes (CONVERSATION_MESSAGE_TOO_LONG, CONVERSATION_RATE_LIMIT_EXCEEDED, CONVERSATION_NOT_FOUND, CONVERSATION_FORBIDDEN, CONVERSATION_INVALID_TYPE) in src/common/types/error-codes.enum.ts
- [ ] T104 [P] Create conversation exception classes extending DomainException in src/modules/conversation/domain/exceptions/
- [ ] T105 Update ConversationController and ConversationGateway to use structured error codes in all catch blocks

### Swagger Documentation

- [ ] T106 [P] Add @ApiTags('Conversations') to ConversationController
- [ ] T107 [P] Add @ApiOperation, @ApiResponse decorators to all ConversationController endpoints
- [ ] T108 [P] Add @ApiProperty with examples to all DTOs (request and response)
- [ ] T109 Generate OpenAPI spec with `pnpm build` and verify matches contracts/rest-api.yaml

### Performance Optimization

- [ ] T110 Add database query logging and slow query detection (>100ms) in ConversationRepository
- [ ] T111 Verify conversation list caching is implemented with 60-second TTL in ConversationCacheService
- [ ] T112 Add Redis connection pooling configuration in conversation.module.ts

### Observability

- [ ] T113 Add structured logging for message send/receive with correlation IDs in ConversationGateway
- [ ] T114 Add WebSocket connection metrics (active connections, messages/sec) in ConversationGateway
- [ ] T115 Add error rate monitoring hooks in global exception filter for conversation endpoints

### Documentation

- [ ] T116 Update README.md with conversation module setup instructions and WebSocket connection examples
- [ ] T117 Create API usage examples in specs/002-chat-module/examples/ directory (curl, JavaScript client)

**Validation**:

- ✓ Swagger UI displays all 8 REST endpoints with examples at /api/docs
- ✓ Error responses use structured format with error codes from ErrorCode enum
- ✓ Slow queries logged to console with >100ms threshold
- ✓ Conversation list cache reduces database load (verify with Redis MONITOR)
- ✓ WebSocket metrics logged periodically
- ✓ README.md has complete setup and usage instructions

**Parallel Opportunities**: T103-T104, T106-T108 (5 tasks)

---

## Dependencies & Execution Order

### Critical Path (Must Complete Sequentially)

```
Phase 1 (Setup) → Phase 2 (Foundational) → Phase 3 (US1 - MVP)
```

### Independent User Stories (Can Implement in Any Order After Phase 3)

```
Phase 3 (US1 - MVP) ─┬→ Phase 4 (US2 - Status)
                     ├→ Phase 5 (US4 - List)
                     ├→ Phase 6 (US3 - Typing)
                     └→ Phase 7 (US5 - Search)
```

### Story Dependencies

- **User Story 1 (P1)**: No dependencies (MVP baseline) - DIRECT and GROUP messaging
- **User Story 2 (P2)**: Requires US1 (extends message with status tracking)
- **User Story 3 (P3)**: Requires US1 (typing in active conversations)
- **User Story 4 (P2)**: Requires US1 (displays conversation list with message previews)
- **User Story 5 (P3)**: Requires US1 (searches messages across conversations)

### Testing & Polish (Can Start After Any User Story)

```
Any User Story → Phase 8 (Testing for that story)
All User Stories Complete → Phase 9 (Polish)
```

---

## Parallel Execution Examples

### Maximum Parallelization by Phase

**Phase 2 (Foundational)**: 6 parallel tracks

```
Track A: T009 (MessageSentEvent)
Track B: T010 (TypingStartedEvent)
Track C: T011 (ConversationMapper)
Track D: T012 (MessageMapper)
Track E: T016 (TypingIndicatorCache)
```

**Phase 3 (User Story 1)**: 9 parallel tracks

```
Track A: T018 (SendMessageDto)
Track B: T019 (CreateConversationDto)
Track C: T020 (MessageResponseDto)
Track D: T021 (ConversationResponseDto)
Track E: T027 (BullMQ offline-delivery queue)
Track F: T028 (OfflineDeliveryWorker)
Track G: T029 (WsJwtAuthGuard)
Track H: T037 (ConversationController creation)
Track I: T038 (HTTP DTOs)
```

Then sequentially: T022 → T023 → T024 → T025 → T026 (use cases)
Then sequentially: T030 → T031 → T032 → T033 → T034 → T035 → T036 (ConversationGateway enhancement)
Then: T039 → T040 → T041 → T042 → T043 (ConversationController endpoints)

**Phase 8 (Testing)**: 19 parallel tracks (all test files independent)

### Recommended MVP Implementation Plan (2-week sprint)

**Week 1: Foundation + MVP**

- Days 1-2: Phase 1 (Setup) + Phase 2 (Foundational)
- Days 3-5: Phase 3 (User Story 1 - Direct Messaging and Group Conversations)
- Unit tests for completed features (T084-T088)

**Week 2: Enhancements + Testing**

- Days 6-7: Phase 4 (User Story 2 - Status) + Phase 5 (User Story 4 - List)
- Days 8-9: Phase 8 (Testing) - comprehensive test suite
- Day 10: Phase 9 (Polish, Swagger, Documentation)

---

## Implementation Strategy

### MVP-First Approach

**Minimum Viable Product (MVP)**: User Story 1 only

- **Scope**: Phases 1-3 (43 tasks)
- **Deliverable**: Real-time messaging (DIRECT and GROUP) with persistence and history
- **Timeline**: ~1 week
- **Value**: Core chat functionality is usable for both one-on-one and group conversations

**MVP + Essential Features**: User Stories 1, 2, 4

- **Scope**: Phases 1-5 (63 tasks)
- **Deliverable**: Messaging + read receipts + conversation list
- **Timeline**: ~1.5 weeks
- **Value**: Production-ready chat with key UX features

**Full Feature Set**: All User Stories

- **Scope**: Phases 1-9 (117 tasks)
- **Deliverable**: Complete conversation module with search and typing indicators
- **Timeline**: ~2-3 weeks
- **Value**: Feature-complete real-time messaging system

### Incremental Delivery

Each user story is independently deployable:

1. **Deploy US1** → Users can message in DIRECT and GROUP conversations
2. **Deploy US2** → Users see delivery and read receipts
3. **Deploy US4** → Users see conversation list with unread counts
4. **Deploy US3** → Users see typing indicators
5. **Deploy US5** → Users can search message history

### Risk Mitigation

**High-Risk Areas**:

- WebSocket multi-instance scaling with Redis adapter (Phase 3, T030-T036)
  - **Mitigation**: Test with existing multi-instance E2E test, expand coverage
- Full-text search performance with PostgreSQL tsvector (Phase 7, T077-T079)
  - **Mitigation**: Load test with 10,000+ messages early, monitor query plans
- DIRECT conversation uniqueness constraint (Phase 3, T024)
  - **Mitigation**: Write integration test first (T094), verify with concurrent requests
- Offline message delivery via BullMQ (Phase 3, T027-T028)
  - **Mitigation**: E2E test for offline delivery (T102), monitor queue metrics

**Testing Strategy**:

- Write domain unit tests immediately after implementing aggregates/entities (T084-T085)
- Write use case unit tests before implementing controllers/gateways (T086-T091)
- Run integration tests after repository implementations (T093-T097)
- Run E2E test suite after each user story completion (T098-T102)
- Performance test WebSocket scaling and search before production deployment

---

## Task Completion Checklist

For each task, verify:

- [ ] Code follows Clean Architecture (correct layer placement)
- [ ] TypeScript compiles without errors (strict mode)
- [ ] ESLint passes with no warnings
- [ ] File path matches task specification exactly
- [ ] Related tests pass (unit/integration/e2e as applicable)
- [ ] Swagger documentation added (for public APIs)
- [ ] Error handling uses structured error codes
- [ ] Logging added for debugging (with correlation IDs)
- [ ] No circular dependencies introduced (check with madge)
- [ ] Git commit message references task ID (e.g., "[T001] Generate TypeORM migration for indexes")

---

## Success Metrics

### Technical Metrics

- ✅ **Test Coverage**: >80% for domain and application layers
- ✅ **Type Safety**: 100% TypeScript strict mode compliance
- ✅ **Performance**: <1s message delivery latency (p95)
- ✅ **Scalability**: 1,000 concurrent WebSocket connections per instance
- ✅ **Availability**: 99.9% message delivery success rate
- ✅ **Response Time**: <2s conversation history load (50 messages)
- ✅ **Search Performance**: <3s full-text search across 10,000 messages

### User Story Acceptance

- ✅ **US1**: Users exchange real-time messages in DIRECT and GROUP conversations, history loads correctly
- ✅ **US2**: Message status updates in real-time (sent → delivered → read)
- ✅ **US3**: Typing indicators appear/disappear with 3-second timeout
- ✅ **US4**: Conversation list sorted by recent activity with unread counts
- ✅ **US5**: Full-text search returns relevant messages within 3 seconds

---

## Total Task Summary

| Phase                 | Tasks   | Parallel | Estimated Duration |
| --------------------- | ------- | -------- | ------------------ |
| Phase 1: Setup        | 8       | 6        | 2-3 hours          |
| Phase 2: Foundational | 9       | 6        | 6-8 hours          |
| Phase 3: US1 (P1) MVP | 26      | 9        | 2-3 days           |
| Phase 4: US2 (P2)     | 10      | 3        | 1 day              |
| Phase 5: US4 (P2)     | 10      | 4        | 1 day              |
| Phase 6: US3 (P3)     | 10      | 4        | 6-8 hours          |
| Phase 7: US5 (P3)     | 10      | 3        | 1 day              |
| Phase 8: Testing      | 19      | 19       | 2-3 days           |
| Phase 9: Polish       | 15      | 5        | 1 day              |
| **TOTAL**             | **117** | **59**   | **2-3 weeks**      |

**Parallel Efficiency**: 50% of tasks can be parallelized (59/117)

---

## Next Steps

1. **Review this task list** with team for estimates and scope agreement
2. **Create MVP milestone** in project tracker (Phases 1-3 only, 43 tasks)
3. **Assign tasks** to developers (consider parallel tracks)
4. **Verify feature branch exists**: `git checkout 002-chat-module` (already created)
5. **Start with Phase 1** (T001-T008): Database migration and module configuration
6. **Deploy MVP** after Phase 3 completion for early user feedback
7. **Iterate** with remaining user stories based on user priorities

**Recommended First Task**: T001 - Generate TypeORM migration for conversation indexes

**Key Architecture Note**: This implementation extends the existing `src/modules/conversation/` module. DO NOT create a new `chat` module. All work happens within the conversation module structure.

**Ready to implement!** 🚀
