# Implementation Plan: Real-time Chat Module

**Branch**: `002-chat-module` | **Date**: 2025-11-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-chat-module/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement real-time one-on-one chat messaging between authenticated users with WebSocket-based instant delivery, persistent message storage for offline users, message status tracking (sent/delivered/read), typing indicators, conversation management, and message search. Core MVP prioritizes direct messaging (P1) with read receipts and conversation list as P2 enhancements, and typing indicators and search as P3 features. Technical approach leverages existing Socket.IO infrastructure with Redis pub/sub for multi-instance scaling, TypeORM for message persistence, and Clean Architecture patterns for maintainability.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 22+ (LTS)
**Framework**: NestJS 11.x
**Package Manager**: pnpm 10.x+ (REQUIRED per constitution)
**Primary Dependencies**:

- TypeORM 0.3.x (message/conversation persistence)
- Socket.IO 4.x with Redis adapter (real-time WebSocket communication)
- Redis 7.x (pub/sub for multi-instance, typing indicator ephemeral state)
- Jest 29.x (testing framework)
- class-validator, class-transformer (DTO validation/serialization)

**Storage**: PostgreSQL 18+ with TypeORM
**Real-time Protocol**: WebSocket via Socket.IO (existing infrastructure)
**Testing**: Jest (unit/integration), Supertest + Socket.IO client (e2e)
**Target Platform**: Linux server / Docker containers
**Project Type**: Backend API (Clean Architecture) with WebSocket gateway
**Performance Goals**:

- 1,000 concurrent WebSocket connections per instance
- <1 second message delivery latency (95th percentile)
- 99.9% message delivery success rate
- <2 seconds conversation history load (50 messages)

**Constraints**:

- <1024MB idle memory per instance
- Stateless for horizontal scaling
- 10 messages/minute rate limit per user
- 5,000 character limit per message

**Scale/Scope**:

- One-on-one conversations only (no group chat in MVP)
- Plain text messages only (no rich text, files, images)
- 24 functional requirements across 5 user stories (P1-P3 priority)
- Integration with existing auth module (JWT), user module, notification module

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

**Principle I - Architecture & Modularity**:

- [x] Feature follows Clean Architecture layering (domain/application/infrastructure/interface)
  - Domain: Message, Conversation entities; MessageStatus value object
  - Application: SendMessage, GetConversationHistory, MarkAsRead, SearchMessages use cases
  - Infrastructure: TypeORM repositories, WebSocket gateway implementation, Redis adapter
  - Interface: ChatGateway (WebSocket), ChatController (REST for history/search)
- [x] No dependencies from inner to outer layers (domain/application are pure TypeScript)
- [x] Shared modules are isolated and reusable (leverages existing auth, user, websocket modules)

**Principle II - Code Quality**:

- [x] TypeScript strict mode enforced (per project standard)
- [x] ESLint + Prettier configured (pre-existing)
- [x] No circular dependencies (enforced by project tooling)
- [x] DTOs defined for all public interfaces (SendMessageDto, MessageResponseDto, ConversationDto)
- [x] Domain layer is framework-agnostic (Message and Conversation entities are pure TypeScript classes)

**Principle III - Testing Standards**:

- [x] Unit tests for domain logic planned (Message entity validation, status transitions)
- [x] Integration tests for repositories planned (message persistence, conversation queries)
- [x] E2E tests for API/WebSocket flows planned (full message send/receive flow with multiple clients)
- [x] Test coverage target >80% for critical modules (domain/application layers)
- [x] All tests run in isolation (mocked Redis, test containers for PostgreSQL)

**Principle IV - Performance & Scalability**:

- [x] Redis caching strategy defined (conversation list caching, unread counts)
- [x] Database indexes identified for queries (conversation participants, message timestamps, search text)
- [x] Stateless design for horizontal scaling (Redis pub/sub for WebSocket synchronization)
- [x] 1,000 req/s baseline requirement considered (WebSocket: 1,000 concurrent connections, REST: search/history endpoints)

**Principle V - User Experience Consistency**:

- [x] API responses follow standard format (status, data, meta) for REST endpoints
- [x] Error handling with structured codes planned (CHAT_MESSAGE_TOO_LONG, CHAT_RATE_LIMIT_EXCEEDED, CHAT_CONVERSATION_NOT_FOUND)
- [x] WebSocket events use snake_case with versioning (message:send, message:delivered, message:read, typing:start, typing:stop)
- [x] OpenAPI/Swagger documentation planned (REST endpoints: GET /conversations, GET /conversations/:id/messages, POST /messages/search)

**Principle VI - Security & Reliability**:

- [x] Input validation via class-validator planned (SendMessageDto with @MaxLength(5000), @IsNotEmpty)
- [x] Output sanitization via DTOs planned (MessageResponseDto excludes sensitive fields)
- [x] Rate limiting considered (10 messages/minute per user via ThrottlerGuard)
- [x] No sensitive data in responses (user passwords excluded, only public profile fields)

**Principle VII - Tooling & Automation**:

- [x] Pre-commit hooks compatible (no special setup needed, follows project standards)
- [x] CI/CD pipeline compatibility verified (uses existing Jest config, Docker setup)
- [x] Docker support maintained (no new services required, uses existing Redis/PostgreSQL)

**Principle VIII - Extensibility & Maintainability**:

- [x] New feature module doesn't modify core (adds new chat module alongside existing modules)
- [x] Naming conventions followed (kebab-case: chat/, PascalCase: ChatGateway, SendMessageUseCase)
- [x] Code is self-documenting (clear entity names: Message, Conversation, MessageStatus)
- [x] No premature abstraction (MessageStatus as simple value object, not over-engineered)

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# NestJS Clean Architecture Structure (per docs/architecture.md)

src/
├── modules/
│   ├── chat/                          # NEW: Chat module
│   │   ├── domain/                    # Pure business logic (framework-agnostic)
│   │   │   ├── entities/
│   │   │   │   ├── message.entity.ts          # Message aggregate root
│   │   │   │   └── conversation.entity.ts     # Conversation aggregate root
│   │   │   ├── value-objects/
│   │   │   │   └── message-status.vo.ts       # Sent/Delivered/Read status enum
│   │   │   ├── repositories/
│   │   │   │   ├── message.repository.interface.ts    # IMessageRepository port
│   │   │   │   └── conversation.repository.interface.ts  # IConversationRepository port
│   │   │   └── events/
│   │   │       ├── message-sent.event.ts      # Domain event
│   │   │       ├── message-delivered.event.ts
│   │   │       └── message-read.event.ts
│   │   │
│   │   ├── application/               # Use cases & orchestration
│   │   │   ├── use-cases/
│   │   │   │   ├── send-message.use-case.ts
│   │   │   │   ├── get-conversation-history.use-case.ts
│   │   │   │   ├── mark-messages-as-read.use-case.ts
│   │   │   │   ├── get-conversation-list.use-case.ts
│   │   │   │   ├── get-or-create-conversation.use-case.ts
│   │   │   │   └── search-messages.use-case.ts
│   │   │   ├── dtos/
│   │   │   │   ├── send-message.dto.ts
│   │   │   │   ├── message-response.dto.ts
│   │   │   │   ├── conversation-response.dto.ts
│   │   │   │   ├── last-message.dto.ts
│   │   │   │   └── search-messages.dto.ts
│   │   │   └── mappers/
│   │   │       ├── message.mapper.ts          # Domain ↔ DTO mapper
│   │   │       └── conversation.mapper.ts     # Domain ↔ DTO mapper
│   │   │
│   │   ├── infrastructure/            # Framework implementations & adapters
│   │   │   ├── persistence/
│   │   │   │   ├── message.orm-entity.ts          # TypeORM entity
│   │   │   │   ├── conversation.orm-entity.ts     # TypeORM entity
│   │   │   │   ├── message.repository.ts          # Implements IMessageRepository
│   │   │   │   ├── conversation.repository.ts     # Implements IConversationRepository
│   │   │   │   └── mappers/
│   │   │   │       ├── message-orm.mapper.ts      # ORM ↔ Domain mapper
│   │   │   │       └── conversation-orm.mapper.ts # ORM ↔ Domain mapper
│   │   │   └── cache/
│   │   │       └── conversation-cache.service.ts  # Redis caching for conversation list
│   │   │
│   │   ├── interface/                 # Entry points (HTTP, WebSocket)
│   │   │   ├── http/
│   │   │   │   ├── chat.controller.ts             # REST endpoints
│   │   │   │   └── dtos/                          # API-specific request DTOs
│   │   │   │       ├── get-conversation-history.dto.ts
│   │   │   │       ├── mark-messages-read.dto.ts
│   │   │   │       └── search-messages-request.dto.ts
│   │   │   └── websocket/
│   │   │       ├── chat.gateway.ts                # Socket.IO gateway
│   │   │       ├── events/                        # WebSocket event DTOs
│   │   │       │   ├── message-send.event.ts
│   │   │       │   ├── typing-start.event.ts
│   │   │       │   └── typing-stop.event.ts
│   │   │       └── guards/
│   │   │           └── ws-jwt-auth.guard.ts       # WebSocket JWT authentication
│   │   │
│   │   └── chat.module.ts             # NestJS module definition
│   │
│   ├── user/                          # EXISTING: User module (dependency)
│   ├── auth/                          # EXISTING: Auth module (dependency)
│   └── notification/                  # EXISTING: Notification module (dependency)
│
├── shared/                            # EXISTING: Shared infrastructure
│   ├── websocket/                     # Socket.IO Redis adapter (existing)
│   ├── cache/                         # Redis cache module (existing)
│   ├── database/                      # TypeORM connection (existing)
│   │   └── migrations/
│   │       └── 1731500000000-CreateChatTables.ts  # NEW: Chat schema migration
│   ├── logger/                        # Winston logger (existing)
│   └── domain-events/                 # Transactional Outbox pattern (existing)
│
└── common/                            # EXISTING: Cross-cutting concerns
    ├── decorators/
    │   ├── current-user.decorator.ts  # Extract JWT user from request
    │   └── ws-current-user.decorator.ts  # Extract JWT user from WebSocket
    ├── guards/
    │   └── jwt-auth.guard.ts          # REST JWT authentication
    ├── filters/
    │   └── http-exception.filter.ts   # Global exception handling
    ├── interceptors/
    │   └── transform.interceptor.ts   # Response formatting
    └── pipes/
        └── validation.pipe.ts         # DTO validation

test/
├── unit/                              # Unit tests (domain/application layers)
│   └── chat/
│       ├── entities/
│       │   ├── message.entity.spec.ts
│       │   └── conversation.entity.spec.ts
│       ├── use-cases/
│       │   ├── send-message.use-case.spec.ts
│       │   ├── get-conversation-history.use-case.spec.ts
│       │   └── mark-messages-as-read.use-case.spec.ts
│       └── mappers/
│           ├── message.mapper.spec.ts
│           └── conversation.mapper.spec.ts
│
├── integration/                       # Integration tests (infrastructure)
│   └── chat/
│       ├── repositories/
│       │   ├── message.repository.spec.ts
│       │   └── conversation.repository.spec.ts
│       └── cache/
│           └── conversation-cache.service.spec.ts
│
└── e2e/                              # End-to-end tests (full API flows)
    ├── chat.e2e-spec.ts              # REST + WebSocket integration
    └── chat-multi-instance.e2e-spec.ts  # Multi-instance WebSocket scaling
```

**Structure Decision**:

- New `chat` module added under `src/modules/` following standard Clean Architecture pattern per `docs/architecture.md`
- **Domain layer**: Pure TypeScript entities and value objects (no framework dependencies)
- **Application layer**: Use cases orchestrate domain logic; mappers transform domain ↔ DTOs
- **Infrastructure layer**:
  - `persistence/` contains TypeORM entities and repository implementations
  - `persistence/mappers/` contains ORM ↔ Domain mappers (separate from application mappers)
  - `cache/` contains Redis caching service
- **Interface layer**:
  - `http/` contains REST controllers + API-specific request DTOs
  - `websocket/` contains Socket.IO gateway + WebSocket event DTOs + guards
- Leverages existing shared infrastructure (websocket, cache, database, logger, domain-events)
- WebSocket gateway reuses existing Socket.IO setup with Redis adapter for multi-instance scaling
- Database migration creates 2 tables: `conversations`, `messages` (no junction table needed for 1:1 chat)
- Test structure mirrors module layers: unit (domain/application), integration (infrastructure), e2e (full flows)
- No modifications to core/shared modules required (Principle VIII compliance)

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**No violations identified** - All constitutional principles are satisfied by the chat module design.

---

## Phase 0: Research - ✅ COMPLETE

**Status**: All unknowns resolved, decisions documented

**Deliverable**: [research.md](./research.md)

**Key Decisions**:

1. WebSocket Architecture: Socket.IO with Redis adapter for multi-instance scaling
2. Message Persistence: TypeORM + PostgreSQL with full-text search via tsvector
3. Status Tracking: Embedded in messages table (sufficient for 1:1 chat MVP)
4. Typing Indicators: Redis with TTL for ephemeral state
5. Rate Limiting: ThrottlerGuard with Redis storage
6. Offline Delivery: PostgreSQL queue + sync on reconnect
7. Security: Multi-layer (JWT + authorization + validation + rate limiting)

---

## Phase 1: Design & Contracts - ✅ COMPLETE

**Status**: Data model, API contracts, and quickstart guide generated

**Deliverables**:

- ✅ [data-model.md](./data-model.md) - Domain entities, database schema, TypeORM entities
- ✅ [contracts/openapi.yaml](./contracts/openapi.yaml) - REST API specification (6 endpoints)
- ✅ [contracts/websocket-events.md](./contracts/websocket-events.md) - WebSocket event documentation
- ✅ [quickstart.md](./quickstart.md) - Local setup and testing guide
- ✅ Agent context updated: `.github/copilot-instructions.md`

**Key Artifacts**:

1. **Domain Entities**: Message, Conversation (aggregate roots); MessageStatus (value object)
2. **Database Schema**: 2 tables (conversations, messages) with indexes and triggers
3. **REST Endpoints**: 6 endpoints (conversation list, get conversation, history, get-or-create, search, mark-read)
4. **WebSocket Events**: 10 events (send, receive, read, typing, sync)
5. **DTOs**: 8 DTOs for request/response with validation rules

---

## Constitution Re-Check (Post-Design)

**All principles verified against detailed design**:

✅ **Principle I**: Clean Architecture layers confirmed in project structure  
✅ **Principle II**: TypeScript strict mode, DTOs with validation, framework-agnostic domain  
✅ **Principle III**: Test strategy defined (unit/integration/e2e)  
✅ **Principle IV**: Caching (Redis), indexes (PostgreSQL), stateless design  
✅ **Principle V**: Standard response format, structured errors, OpenAPI docs  
✅ **Principle VI**: Input validation, output sanitization, rate limiting  
✅ **Principle VII**: No special tooling required, Docker compatible  
✅ **Principle VIII**: New module, no core modifications, naming conventions followed

**Design validates all constitutional requirements** ✅

---

## Next Steps

✅ Phase 0: Research complete (research.md generated)  
✅ Phase 1: Design complete (data-model.md, contracts/, quickstart.md generated)  
✅ Agent context updated (.github/copilot-instructions.md)  
⏭️ **Phase 2**: Generate implementation tasks with `/speckit.tasks`

**Command**: `/speckit.tasks` to generate `tasks.md` with detailed implementation checklist

---

## Planning Summary

**Feature**: Real-time Chat Module  
**Branch**: 002-chat-module  
**Status**: Planning Complete ✅

**Artifacts Generated**:

- [x] plan.md (this file)
- [x] research.md (10 research decisions)
- [x] data-model.md (entities, schema, DTOs)
- [x] contracts/openapi.yaml (REST API spec - 6 endpoints)
- [x] contracts/websocket-events.md (WebSocket events - 10 events)
- [x] quickstart.md (setup guide)
- [x] Agent context updated

**Ready for**: Implementation tasks generation (`/speckit.tasks`)

**Estimated Implementation**:

- **Lines of Code**: ~3,500-4,000 LOC
- **Files**: ~40 files (domain, application, infrastructure, interface, tests)
- **REST Endpoints**: 6 (conversations list, get conversation, history, get-or-create, search, mark-read)
- **WebSocket Events**: 10 (send, receive, read, typing, sync, errors)
- **Test Coverage**: Target >80% for critical paths
- **Timeline**: 2-3 weeks (assuming 1 developer)
