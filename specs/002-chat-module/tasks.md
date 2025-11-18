# Implementation Tasks: Real-time Chat Module

**Feature**: Real-time Chat Module  
**Branch**: `002-chat-module`  
**Tech Stack**: NestJS 11.x, TypeScript 5.x, TypeORM 0.3.x, Socket.IO 4.x, Redis 7.x, PostgreSQL 18+  
**Package Manager**: pnpm 10.x+ (REQUIRED)

---

## Overview

This task list breaks down the chat module implementation into executable, independently testable increments organized by user story priority. Each phase builds upon the previous, following Clean Architecture principles.

**Key Principles**:

- MVP-first: User Story 1 (P1) is the minimum viable product
- Incremental delivery: Each user story is a complete, testable feature
- Parallel execution: Tasks marked [P] can be implemented simultaneously
- Clean Architecture: All tasks respect domain → application → infrastructure → interface layering

**Total Estimated Tasks**: 85 tasks  
**Parallel Opportunities**: 35+ tasks can run in parallel  
**MVP Scope**: Phase 1-4 (Setup + Foundational + User Story 1)

---

## Phase 1: Project Setup & Infrastructure (8 tasks)

**Goal**: Initialize chat module structure and database foundation

**Estimated Duration**: 2-4 hours

### Tasks

- [ ] T001 Create chat module directory structure following plan.md in src/modules/chat/
- [ ] T002 [P] Create domain layer folders: entities/, value-objects/, repositories/, events/ in src/modules/chat/domain/
- [ ] T003 [P] Create application layer folders: use-cases/, dtos/, mappers/ in src/modules/chat/application/
- [ ] T004 [P] Create infrastructure layer folders: persistence/, persistence/mappers/, cache/ in src/modules/chat/infrastructure/
- [ ] T005 [P] Create interface layer folders: http/, http/dtos/, websocket/, websocket/events/, websocket/guards/ in src/modules/chat/interface/
- [ ] T006 Create chat.module.ts with basic NestJS module boilerplate in src/modules/chat/
- [ ] T007 Generate TypeORM migration file for chat tables in src/shared/database/migrations/TIMESTAMP-CreateChatTables.ts
- [ ] T008 Run migration to create conversations and messages tables with all indexes and triggers

**Validation**:

- ✓ All directory structure matches plan.md exactly
- ✓ Migration creates 2 tables with proper constraints and indexes
- ✓ Running `pnpm migration:run` succeeds without errors

---

## Phase 2: Foundational Components (12 tasks)

**Goal**: Implement core domain models and shared infrastructure (blocking prerequisites for all user stories)

**Estimated Duration**: 4-6 hours

### Tasks

- [ ] T009 [P] Implement MessageStatus value object enum (SENT, DELIVERED, READ) in src/modules/chat/domain/value-objects/message-status.vo.ts
- [ ] T010 Implement Message entity with create(), markAsDelivered(), markAsRead() methods in src/modules/chat/domain/entities/message.entity.ts
- [ ] T011 Implement Conversation entity with create(), hasParticipant(), getOtherParticipant(), updateActivity() in src/modules/chat/domain/entities/conversation.entity.ts
- [ ] T012 [P] Define IMessageRepository interface with save, findById, findByConversation, markAsDelivered, markAsRead, countUnread, search methods in src/modules/chat/domain/repositories/message.repository.interface.ts
- [ ] T013 [P] Define IConversationRepository interface with save, findById, findByParticipants, findByUser, exists methods in src/modules/chat/domain/repositories/conversation.repository.interface.ts
- [ ] T014 [P] Create MessageOrmEntity with TypeORM decorators matching database schema in src/modules/chat/infrastructure/persistence/message.orm-entity.ts
- [ ] T015 [P] Create ConversationOrmEntity with TypeORM decorators matching database schema in src/modules/chat/infrastructure/persistence/conversation.orm-entity.ts
- [ ] T016 [P] Implement MessageOrmMapper with toDomain() and toOrm() methods in src/modules/chat/infrastructure/persistence/mappers/message-orm.mapper.ts
- [ ] T017 [P] Implement ConversationOrmMapper with toDomain() and toOrm() methods in src/modules/chat/infrastructure/persistence/mappers/conversation-orm.mapper.ts
- [ ] T018 Implement MessageRepository with all IMessageRepository methods using TypeORM in src/modules/chat/infrastructure/persistence/message.repository.ts
- [ ] T019 Implement ConversationRepository with all IConversationRepository methods using TypeORM in src/modules/chat/infrastructure/persistence/conversation.repository.ts
- [ ] T020 Register TypeORM entities and repository providers in chat.module.ts with dependency injection bindings

**Validation**:

- ✓ Domain entities compile without NestJS/TypeORM decorators (framework-agnostic)
- ✓ All repository methods have proper type signatures
- ✓ Mappers correctly transform between ORM and domain entities
- ✓ Module providers array includes repository interface bindings

**Parallel Opportunities**: T009, T012-T017 can all run simultaneously (different files, no dependencies)

---

## Phase 3: User Story 1 - Direct Messaging (P1) [MVP] (20 tasks)

**User Story**: Users can send and receive real-time text messages through private one-on-one conversations

**Goal**: Implement core messaging functionality with real-time delivery, persistence, and history

**Estimated Duration**: 1-2 days

**Independent Test Criteria**:

- ✓ Two users can exchange messages in real-time via WebSocket
- ✓ Messages are persisted and survive server restart
- ✓ Offline messages are delivered when recipient reconnects
- ✓ Message history loads chronologically with pagination
- ✓ New conversation creation works correctly

### Domain Events

- [ ] T021 [P] [US1] Create MessageSentEvent domain event in src/modules/chat/domain/events/message-sent.event.ts
- [ ] T022 [P] [US1] Update Message entity to emit MessageSentEvent on creation

### Application Layer - DTOs

- [ ] T023 [P] [US1] Create SendMessageDto with validation (@IsUUID, @IsString, @MaxLength(5000), @IsNotEmpty) in src/modules/chat/application/dtos/send-message.dto.ts
- [ ] T024 [P] [US1] Create MessageResponseDto with @Expose decorators in src/modules/chat/application/dtos/message-response.dto.ts
- [ ] T025 [P] [US1] Create ConversationResponseDto and ConversationParticipantDto, LastMessageDto in src/modules/chat/application/dtos/conversation-response.dto.ts

### Application Layer - Mappers

- [ ] T026 [P] [US1] Implement MessageMapper.toResponseDto() in src/modules/chat/application/mappers/message.mapper.ts
- [ ] T027 [P] [US1] Implement ConversationMapper.toResponseDto() in src/modules/chat/application/mappers/conversation.mapper.ts

### Application Layer - Use Cases

- [ ] T028 [US1] Implement SendMessageUseCase with message validation, conversation participant check, persistence in src/modules/chat/application/use-cases/send-message.use-case.ts
- [ ] T029 [US1] Implement GetOrCreateConversationUseCase with canonical participant ordering logic in src/modules/chat/application/use-cases/get-or-create-conversation.use-case.ts
- [ ] T030 [US1] Implement GetConversationHistoryUseCase with pagination (50 msgs per page) in src/modules/chat/application/use-cases/get-conversation-history.use-case.ts

### Interface Layer - WebSocket

- [ ] T031 [P] [US1] Create MessageSendEvent DTO for WebSocket payload validation in src/modules/chat/interface/websocket/events/message-send.event.ts
- [ ] T032 [P] [US1] Create WsJwtAuthGuard extending existing ws-current-user.decorator.ts logic in src/modules/chat/interface/websocket/guards/ws-jwt-auth.guard.ts
- [ ] T033 [US1] Implement ChatGateway with @WebSocketGateway decorator, connection handling, room management in src/modules/chat/interface/websocket/chat.gateway.ts
- [ ] T034 [US1] Add @SubscribeMessage('message:send') handler in ChatGateway with rate limiting (@UseGuards(ThrottlerGuard))
- [ ] T035 [US1] Add 'message:received' emission to recipient's room (user:{recipientId}) in ChatGateway
- [ ] T036 [US1] Add automatic room joining (user:{userId}) on WebSocket connection in ChatGateway
- [ ] T037 [US1] Add connection error handling and authentication validation in ChatGateway

### Interface Layer - REST

- [ ] T038 [P] [US1] Create GetConversationHistoryRequestDto for query params in src/modules/chat/interface/http/dtos/get-conversation-history.dto.ts
- [ ] T039 [US1] Implement ChatController with @Controller('conversations') in src/modules/chat/interface/http/chat.controller.ts
- [ ] T040 [US1] Add GET /conversations/:id/messages endpoint with pagination, JWT auth, Swagger decorators in ChatController

**Validation** (MVP Acceptance):

- ✓ User A sends message to User B via WebSocket, User B receives instantly
- ✓ Message persists to database with status='sent'
- ✓ Conversation created automatically with canonical participant ordering
- ✓ GET /conversations/:id/messages returns 50 messages in chronological order
- ✓ Offline user receives message when they reconnect
- ✓ Rate limiting blocks > 10 messages/minute
- ✓ Non-participant cannot access conversation (403 Forbidden)

**Parallel Opportunities**: T021-T027, T031-T032, T038 (16 tasks can run in parallel)

---

## Phase 4: User Story 2 - Message Status & Read Receipts (P2) (10 tasks)

**User Story**: Users can see message delivery and read status with real-time updates

**Goal**: Track and broadcast message status transitions (sent → delivered → read)

**Estimated Duration**: 6-8 hours

**Independent Test Criteria**:

- ✓ Message status updates to 'delivered' when recipient receives it
- ✓ Message status updates to 'read' when recipient views conversation
- ✓ Sender sees status changes in real-time via WebSocket
- ✓ Status transitions follow correct order (sent → delivered → read)

### Domain Events

- [ ] T041 [P] [US2] Create MessageDeliveredEvent domain event in src/modules/chat/domain/events/message-delivered.event.ts
- [ ] T042 [P] [US2] Create MessageReadEvent domain event in src/modules/chat/domain/events/message-read.event.ts
- [ ] T043 [US2] Update Message entity to emit MessageDeliveredEvent on markAsDelivered()
- [ ] T044 [US2] Update Message entity to emit MessageReadEvent on markAsRead()

### Application Layer

- [ ] T045 [P] [US2] Create MarkMessagesReadDto in src/modules/chat/application/dtos/mark-messages-read.dto.ts
- [ ] T046 [US2] Implement MarkMessagesAsReadUseCase with authorization check in src/modules/chat/application/use-cases/mark-messages-as-read.use-case.ts

### Interface Layer - WebSocket

- [ ] T047 [US2] Add @SubscribeMessage('messages:read') handler in ChatGateway calling MarkMessagesAsReadUseCase
- [ ] T048 [US2] Add 'messages:read_ack' emission to sender in ChatGateway after marking messages read
- [ ] T049 [US2] Update 'message:received' handler to auto-mark message as 'delivered' when emitted

### Interface Layer - REST

- [ ] T050 [US2] Add PATCH /messages/mark-read endpoint in ChatController with Swagger decorators

**Validation**:

- ✓ Recipient receives message, status changes to 'delivered', sender sees update
- ✓ Recipient opens conversation, all messages marked 'read', sender sees update
- ✓ Status timestamps (deliveredAt, readAt) are recorded correctly
- ✓ PATCH /messages/mark-read returns count of marked messages

**Parallel Opportunities**: T041-T042, T045 (3 tasks)

---

## Phase 5: User Story 4 - Conversation List & Management (P2) (12 tasks)

**User Story**: Users can view all conversations sorted by recent activity with unread counts

**Goal**: Implement conversation list with last message preview, unread counts, and real-time updates

**Estimated Duration**: 8-10 hours

**Independent Test Criteria**:

- ✓ Conversation list sorted by most recent message timestamp
- ✓ Unread message count displayed for each conversation
- ✓ Last message preview shown (truncated to 100 chars)
- ✓ List updates in real-time when new message arrives

### Infrastructure Layer - Caching

- [ ] T051 [P] [US4] Implement ConversationCacheService with Redis for caching conversation list in src/modules/chat/infrastructure/cache/conversation-cache.service.ts
- [ ] T052 [P] [US4] Add cache invalidation on new message, mark-as-read in ConversationCacheService

### Application Layer

- [ ] T053 [P] [US4] Create GetConversationListDto with pagination params in src/modules/chat/application/dtos/get-conversation-list.dto.ts
- [ ] T054 [US4] Implement GetConversationListUseCase with Redis caching, sorting by updatedAt DESC in src/modules/chat/application/use-cases/get-conversation-list.use-case.ts
- [ ] T055 [US4] Add unread count calculation in GetConversationListUseCase (use IMessageRepository.countUnread)
- [ ] T056 [US4] Add last message loading with truncation to 100 chars in GetConversationListUseCase

### Interface Layer - REST

- [ ] T057 [P] [US4] Create pagination response DTOs (PaginationMeta) in src/modules/chat/interface/http/dtos/pagination.dto.ts
- [ ] T058 [US4] Add GET /conversations endpoint with pagination, sorting, caching in ChatController
- [ ] T059 [US4] Add GET /conversations/:id endpoint for single conversation details in ChatController

### Interface Layer - WebSocket

- [ ] T060 [US4] Add 'conversation:updated' event emission on new message in ChatGateway
- [ ] T061 [US4] Add automatic cache invalidation trigger on message send/read in ChatGateway
- [ ] T062 [US4] Add 'conversation:joined' event on successful room join in ChatGateway

**Validation**:

- ✓ GET /conversations returns sorted list with correct unread counts
- ✓ New message arrival updates conversation list in real-time
- ✓ Cached conversation list improves response time (<100ms for cached)
- ✓ Pagination works correctly (page 1, page 2, etc.)
- ✓ Last message preview truncates at 100 characters

**Parallel Opportunities**: T051-T053, T057 (4 tasks)

---

## Phase 6: User Story 3 - Typing Indicators (P3) (8 tasks)

**User Story**: Users see when the other person is typing with automatic 3-second timeout

**Goal**: Implement ephemeral typing state with Redis TTL and real-time broadcasting

**Estimated Duration**: 4-6 hours

**Independent Test Criteria**:

- ✓ User A starts typing, User B sees "typing..." indicator
- ✓ Indicator disappears after 3 seconds of inactivity
- ✓ Indicator disappears immediately when message is sent
- ✓ Typing state doesn't persist across server restart (ephemeral)

### Infrastructure Layer

- [ ] T063 [P] [US3] Implement TypingIndicatorService with Redis SETEX (3-second TTL) in src/modules/chat/infrastructure/cache/typing-indicator.service.ts
- [ ] T064 [P] [US3] Add startTyping(conversationId, userId) method with Redis key pattern typing:{conversationId}:{userId}
- [ ] T065 [P] [US3] Add stopTyping(conversationId, userId) method with Redis DEL
- [ ] T066 [P] [US3] Add getTypingUsers(conversationId) method to check active typing indicators

### Interface Layer - WebSocket

- [ ] T067 [P] [US3] Create TypingStartEvent DTO in src/modules/chat/interface/websocket/events/typing-start.event.ts
- [ ] T068 [P] [US3] Create TypingStopEvent DTO in src/modules/chat/interface/websocket/events/typing-stop.event.ts
- [ ] T069 [US3] Add @SubscribeMessage('typing:start') handler in ChatGateway calling TypingIndicatorService
- [ ] T070 [US3] Add @SubscribeMessage('typing:stop') handler in ChatGateway with automatic cleanup on message send

**Validation**:

- ✓ typing:start event broadcasts to other participant
- ✓ Redis TTL auto-expires typing indicator after 3 seconds
- ✓ typing:stop event clears indicator immediately
- ✓ Sending message auto-triggers typing:stop
- ✓ Multiple users can type simultaneously in different conversations

**Parallel Opportunities**: T063-T068 (6 tasks can run in parallel)

---

## Phase 7: User Story 5 - Message Search & History (P3) (10 tasks)

**User Story**: Users can search messages by keyword across all conversations

**Goal**: Implement full-text search using PostgreSQL tsvector with relevance ranking

**Estimated Duration**: 6-8 hours

**Independent Test Criteria**:

- ✓ Search finds messages containing keyword across all user's conversations
- ✓ Results ranked by relevance (ts_rank)
- ✓ Search returns within 3 seconds for 10,000 messages
- ✓ User can only search their own conversations (security check)

### Application Layer

- [ ] T071 [P] [US5] Create SearchMessagesDto with query validation (@MinLength(1), @MaxLength(100)) in src/modules/chat/application/dtos/search-messages.dto.ts
- [ ] T072 [P] [US5] Create MessageSearchResultDto extending MessageResponseDto with rank field in src/modules/chat/application/dtos/message-search-result.dto.ts
- [ ] T073 [US5] Implement SearchMessagesUseCase with authorization, pagination (limit 50) in src/modules/chat/application/use-cases/search-messages.use-case.ts

### Infrastructure Layer

- [ ] T074 [US5] Implement full-text search query in MessageRepository using PostgreSQL plainto_tsquery and ts_rank
- [ ] T075 [US5] Add user authorization filter to search (only search conversations user participates in)
- [ ] T076 [US5] Add result limiting (max 50 results) and relevance sorting in MessageRepository.search()

### Interface Layer - REST

- [ ] T077 [P] [US5] Create SearchMessagesRequestDto for HTTP request in src/modules/chat/interface/http/dtos/search-messages-request.dto.ts
- [ ] T078 [US5] Add POST /messages/search endpoint in ChatController with Swagger decorators
- [ ] T079 [US5] Add pagination and total count to search response in ChatController
- [ ] T080 [US5] Add error handling for empty search query and no results in ChatController

**Validation**:

- ✓ POST /messages/search with query "hello" returns all matching messages
- ✓ Results sorted by relevance (highest rank first)
- ✓ Search limited to user's conversations only (cannot see other users' messages)
- ✓ Search completes within 3 seconds for 10,000 messages (performance test)
- ✓ Empty query returns 400 Bad Request

**Parallel Opportunities**: T071-T072, T077 (3 tasks)

---

## Phase 8: Testing & Quality Assurance (15 tasks)

**Goal**: Comprehensive test coverage (>80%) across all layers

**Estimated Duration**: 1-2 days

### Unit Tests (Domain & Application)

- [ ] T081 [P] Write unit tests for Message entity (create, markAsDelivered, markAsRead, validation) in test/unit/chat/entities/message.entity.spec.ts
- [ ] T082 [P] Write unit tests for Conversation entity (create, hasParticipant, canonical ordering) in test/unit/chat/entities/conversation.entity.spec.ts
- [ ] T083 [P] Write unit tests for SendMessageUseCase with mocked repositories in test/unit/chat/use-cases/send-message.use-case.spec.ts
- [ ] T084 [P] Write unit tests for GetConversationHistoryUseCase with pagination in test/unit/chat/use-cases/get-conversation-history.use-case.spec.ts
- [ ] T085 [P] Write unit tests for MarkMessagesAsReadUseCase with authorization in test/unit/chat/use-cases/mark-messages-as-read.use-case.spec.ts
- [ ] T086 [P] Write unit tests for GetConversationListUseCase with caching in test/unit/chat/use-cases/get-conversation-list.use-case.spec.ts
- [ ] T087 [P] Write unit tests for SearchMessagesUseCase with authorization in test/unit/chat/use-cases/search-messages.use-case.spec.ts
- [ ] T088 [P] Write unit tests for MessageMapper and ConversationMapper in test/unit/chat/mappers/

### Integration Tests (Infrastructure)

- [ ] T089 [P] Write integration tests for MessageRepository with test containers (PostgreSQL) in test/integration/chat/repositories/message.repository.spec.ts
- [ ] T090 [P] Write integration tests for ConversationRepository with uniqueness constraints in test/integration/chat/repositories/conversation.repository.spec.ts
- [ ] T091 [P] Write integration tests for ConversationCacheService with test Redis in test/integration/chat/cache/conversation-cache.service.spec.ts
- [ ] T092 [P] Write integration tests for TypingIndicatorService with TTL validation in test/integration/chat/cache/typing-indicator.service.spec.ts

### E2E Tests (Full Flows)

- [ ] T093 Write E2E test for full message flow (send → receive → deliver → read) with 2 Socket.IO clients in test/e2e/chat.e2e-spec.ts
- [ ] T094 Write E2E test for conversation list with pagination and unread counts in test/e2e/chat.e2e-spec.ts
- [ ] T095 Write E2E test for multi-instance WebSocket scaling with Redis pub/sub in test/e2e/chat-multi-instance.e2e-spec.ts

**Validation**:

- ✓ All unit tests pass with >80% coverage for domain/application layers
- ✓ Integration tests use test containers (isolated database)
- ✓ E2E tests validate complete user scenarios end-to-end
- ✓ Multi-instance test confirms Redis pub/sub works across instances
- ✓ Running `pnpm test` passes all tests

**Parallel Opportunities**: All 15 test tasks can run in parallel (T081-T095)

---

## Phase 9: Polish & Cross-Cutting Concerns (10 tasks)

**Goal**: Add observability, error handling, documentation, and performance optimizations

**Estimated Duration**: 8-12 hours

### Error Handling

- [ ] T096 [P] Define chat-specific error codes (CHAT_MESSAGE_TOO_LONG, CHAT_RATE_LIMIT_EXCEEDED, CHAT_CONVERSATION_NOT_FOUND, CHAT_FORBIDDEN) in src/common/types/error-codes.enum.ts
- [ ] T097 [P] Create chat exception classes extending DomainException in src/modules/chat/domain/exceptions/
- [ ] T098 Update ChatController and ChatGateway to use structured error codes in all catch blocks

### Swagger Documentation

- [ ] T099 [P] Add @ApiTags('Chat') to ChatController
- [ ] T100 [P] Add @ApiOperation, @ApiResponse decorators to all ChatController endpoints
- [ ] T101 [P] Add @ApiProperty with examples to all DTOs
- [ ] T102 Generate OpenAPI spec with `pnpm build` and verify matches contracts/openapi.yaml

### Performance Optimization

- [ ] T103 Add database query logging and slow query detection (>100ms) in MessageRepository and ConversationRepository
- [ ] T104 Implement conversation list caching with 60-second TTL in ConversationCacheService
- [ ] T105 Add Redis connection pooling configuration in chat.module.ts

### Observability

- [ ] T106 Add structured logging for message send/receive with correlation IDs in ChatGateway
- [ ] T107 Add WebSocket connection metrics (active connections, messages/sec) in ChatGateway
- [ ] T108 Add error rate monitoring and alerting hooks in global exception filter

### Documentation

- [ ] T109 Update README.md with chat module setup instructions and WebSocket connection examples
- [ ] T110 Create API usage examples in specs/002-chat-module/examples/ directory

**Validation**:

- ✓ Swagger UI displays all 6 REST endpoints with examples at /api/docs
- ✓ Error responses use structured format with error codes
- ✓ Slow queries logged to console (>100ms threshold)
- ✓ Conversation list cache reduces load on database
- ✓ WebSocket metrics logged every minute

**Parallel Opportunities**: T096-T097, T099-T101 (5 tasks)

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

- **User Story 1 (P1)**: No dependencies (MVP baseline)
- **User Story 2 (P2)**: Requires US1 (extends message lifecycle)
- **User Story 3 (P3)**: Requires US1 (typing in active conversations)
- **User Story 4 (P2)**: Requires US1 (displays message previews)
- **User Story 5 (P3)**: Requires US1 (searches messages)

### Testing & Polish (Can Start After Any User Story)

```
Any User Story → Phase 8 (Testing for that story)
All User Stories Complete → Phase 9 (Polish)
```

---

## Parallel Execution Examples

### Maximum Parallelization by Phase

**Phase 2 (Foundational)**: 8 parallel tracks

```
Track A: T009 (MessageStatus VO)
Track B: T012 (IMessageRepository interface)
Track C: T013 (IConversationRepository interface)
Track D: T014 (MessageOrmEntity)
Track E: T015 (ConversationOrmEntity)
Track F: T016 (MessageOrmMapper)
Track G: T017 (ConversationOrmMapper)
```

**Phase 3 (User Story 1)**: 16 parallel tracks

```
Track A: T021-T022 (Domain events)
Track B: T023 (SendMessageDto)
Track C: T024 (MessageResponseDto)
Track D: T025 (ConversationResponseDto)
Track E: T026 (MessageMapper)
Track F: T027 (ConversationMapper)
Track G: T031 (MessageSendEvent)
Track H: T032 (WsJwtAuthGuard)
Track I: T038 (GetConversationHistoryRequestDto)
```

Then sequentially: T028 → T029 → T030 (use cases with dependencies)
Then sequentially: T033 → T034 → T035 → T036 → T037 (ChatGateway)
Then: T039 → T040 (ChatController)

**Phase 8 (Testing)**: 15 parallel tracks (all test files independent)

### Recommended MVP Implementation Plan (2-week sprint)

**Week 1: Foundation + MVP**

- Days 1-2: Phase 1 (Setup) + Phase 2 (Foundational)
- Days 3-5: Phase 3 (User Story 1 - Direct Messaging)
- Unit tests for completed features (T081-T084)

**Week 2: Enhancements + Testing**

- Days 6-7: Phase 4 (User Story 2 - Status) OR Phase 5 (User Story 4 - List)
- Days 8-9: Remaining P2 story + Phase 8 (Testing)
- Day 10: Phase 9 (Polish, Swagger, Documentation)

---

## Implementation Strategy

### MVP-First Approach

**Minimum Viable Product (MVP)**: User Story 1 only

- **Scope**: Phases 1-3 (30 tasks)
- **Deliverable**: Real-time one-on-one messaging with persistence and history
- **Timeline**: ~1 week
- **Value**: Core chat functionality is usable

**MVP + Essential Features**: User Stories 1, 2, 4

- **Scope**: Phases 1-5 (52 tasks)
- **Deliverable**: Messaging + read receipts + conversation list
- **Timeline**: ~1.5 weeks
- **Value**: Production-ready chat with key UX features

**Full Feature Set**: All User Stories

- **Scope**: Phases 1-9 (110 tasks)
- **Deliverable**: Complete chat module with search and typing indicators
- **Timeline**: ~2-3 weeks
- **Value**: Feature-complete real-time chat system

### Incremental Delivery

Each user story is independently deployable:

1. **Deploy US1** → Users can message each other
2. **Deploy US2** → Users see read receipts
3. **Deploy US4** → Users see conversation list
4. **Deploy US3** → Users see typing indicators
5. **Deploy US5** → Users can search messages

### Risk Mitigation

**High-Risk Areas**:

- WebSocket multi-instance scaling (Phase 3, T033-T037)
  - **Mitigation**: Test with redis-cli MONITOR before integration
- Full-text search performance (Phase 7, T074-T076)
  - **Mitigation**: Load test with 10,000+ messages early
- Conversation uniqueness constraint (Phase 2, T011, T019)
  - **Mitigation**: Write integration test first (T090)

**Testing Strategy**:

- Write domain unit tests immediately after implementing entities (T081-T082)
- Write use case unit tests before implementing controllers/gateways
- Run E2E test suite after each user story completion
- Performance test WebSocket scaling before production deployment

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
- [ ] Git commit message references task ID (e.g., "[T001] Create chat module structure")

---

## Success Metrics

### Technical Metrics

- ✅ **Test Coverage**: >80% for domain and application layers
- ✅ **Type Safety**: 100% TypeScript strict mode compliance
- ✅ **Performance**: <1s message delivery latency (p95)
- ✅ **Scalability**: 1,000 concurrent WebSocket connections per instance
- ✅ **Availability**: 99.9% message delivery success rate
- ✅ **Response Time**: <2s conversation history load (50 messages)

### User Story Acceptance

- ✅ **US1**: Two users exchange real-time messages, history loads correctly
- ✅ **US2**: Message status updates in real-time (sent → delivered → read)
- ✅ **US3**: Typing indicators appear/disappear with 3-second timeout
- ✅ **US4**: Conversation list sorted by recent activity with unread counts
- ✅ **US5**: Full-text search returns relevant messages within 3 seconds

---

## Total Task Summary

| Phase                 | Tasks   | Parallel | Estimated Duration |
| --------------------- | ------- | -------- | ------------------ |
| Phase 1: Setup        | 8       | 4        | 2-4 hours          |
| Phase 2: Foundational | 12      | 8        | 4-6 hours          |
| Phase 3: US1 (P1) MVP | 20      | 16       | 1-2 days           |
| Phase 4: US2 (P2)     | 10      | 3        | 6-8 hours          |
| Phase 5: US4 (P2)     | 12      | 4        | 8-10 hours         |
| Phase 6: US3 (P3)     | 8       | 6        | 4-6 hours          |
| Phase 7: US5 (P3)     | 10      | 3        | 6-8 hours          |
| Phase 8: Testing      | 15      | 15       | 1-2 days           |
| Phase 9: Polish       | 15      | 5        | 8-12 hours         |
| **TOTAL**             | **110** | **64**   | **2-3 weeks**      |

**Parallel Efficiency**: 58% of tasks can be parallelized (64/110)

---

## Next Steps

1. **Review this task list** with team for estimates and scope agreement
2. **Create MVP milestone** in project tracker (Phases 1-3 only)
3. **Assign tasks** to developers (consider parallel tracks)
4. **Set up feature branch** from master: `git checkout -b 002-chat-module`
5. **Start with Phase 1** (T001-T008): Project setup and database migration
6. **Deploy MVP** after Phase 3 completion for early user feedback
7. **Iterate** with remaining user stories based on user priorities

**Recommended First Task**: T001 - Create chat module directory structure

**Ready to implement!** 🚀
