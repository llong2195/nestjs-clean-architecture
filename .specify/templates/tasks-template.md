---
description: "Task list template for feature implementation"
---

# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Per Constitution Principle III, testing is mandatory. Tasks MUST include unit/integration/e2e tests as appropriate. Target >80% coverage for critical modules.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. Follow Clean Architecture layering (Constitution Principle I).

**Constitution Compliance**: All tasks must adhere to the 8 core principles defined in `.specify/memory/constitution.md`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

**NestJS Clean Architecture Structure** (per Constitution Principle I):

Each module follows layered structure:

- `src/[module]/domain/` - Entities, value objects, domain services (framework-agnostic)
- `src/[module]/application/` - Use cases, DTOs, port interfaces
- `src/[module]/infrastructure/` - TypeORM repositories, Redis adapters, external clients
- `src/[module]/interface/` - Controllers, WebSocket gateways, CLI commands

**Shared modules**:

- `src/common/` or `src/shared/` - Utilities, base classes, shared types
- `src/config/` - Configuration module
- `src/database/` - Database connection and migrations
- `src/cache/` - Redis cache module

**Tests**:

- `test/unit/` - Unit tests for domain/application logic
- `test/integration/` - Repository and adapter integration tests
- `test/e2e/` - End-to-end API/WebSocket tests

**Naming conventions** (Constitution Principle VIII):

- Folders: `kebab-case` (e.g., `user-management/`)
- Classes: `PascalCase` (e.g., `CreateUserUseCase`)
- Files: `camelCase` or `kebab-case` (e.g., `createUser.useCase.ts`)

<!--
  ============================================================================
  IMPORTANT: The tasks below are SAMPLE TASKS for illustration purposes only.

  The /speckit.tasks command MUST replace these with actual tasks based on:
  - User stories from spec.md (with their priorities P1, P2, P3...)
  - Feature requirements from plan.md
  - Entities from data-model.md
  - Endpoints from contracts/

  Tasks MUST be organized by user story so each story can be:
  - Implemented independently
  - Tested independently
  - Delivered as an MVP increment

  DO NOT keep these sample tasks in the generated tasks.md file.
  ============================================================================
-->

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create project structure per implementation plan
- [ ] T002 Initialize NestJS project with pnpm (pnpm install)
- [ ] T003 [P] Configure ESLint, Prettier, and TypeScript strict mode

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

Examples of foundational tasks (adjust based on your project):

- [ ] T004 Setup PostgreSQL database schema and TypeORM migrations
- [ ] T005 [P] Configure Redis connection and caching module
- [ ] T006 [P] Setup global exception filters and validation pipes
- [ ] T007 Create shared DTOs and response formatters (status, data, meta structure)
- [ ] T008 Configure logger module with correlation IDs
- [ ] T009 Setup environment configuration (development, staging, production)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - [Title] (Priority: P1) 🎯 MVP

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 1 (MANDATORY per Constitution Principle III) ✅

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T010 [P] [US1] Unit tests for domain logic in test/unit/[feature-module]/
- [ ] T011 [P] [US1] Integration tests for repositories in test/integration/[feature-module]/
- [ ] T012 [P] [US1] E2E tests for API endpoints in test/e2e/[feature-module].e2e-spec.ts

### Implementation for User Story 1

- [ ] T013 [P] [US1] Create domain entities in src/[feature-module]/domain/entities/
- [ ] T014 [P] [US1] Create repository interfaces in src/[feature-module]/domain/repositories/
- [ ] T015 [US1] Implement use cases in src/[feature-module]/application/use-cases/
- [ ] T016 [US1] Create DTOs in src/[feature-module]/application/dtos/
- [ ] T017 [US1] Implement TypeORM repositories in src/[feature-module]/infrastructure/persistence/
- [ ] T018 [US1] Implement controllers in src/[feature-module]/interface/controllers/
- [ ] T019 [US1] Configure module in src/[feature-module]/[feature-module].module.ts
- [ ] T020 [US1] Add input validation and error handling
- [ ] T021 [US1] Add logging and correlation IDs

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - [Title] (Priority: P2)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 2 (MANDATORY per Constitution Principle III) ✅

- [ ] T022 [P] [US2] Unit tests for domain logic in test/unit/[feature-module]/
- [ ] T023 [P] [US2] Integration tests for repositories in test/integration/[feature-module]/
- [ ] T024 [P] [US2] E2E tests for API endpoints in test/e2e/[feature-module].e2e-spec.ts

### Implementation for User Story 2

- [ ] T025 [P] [US2] Create domain entities in src/[feature-module]/domain/entities/
- [ ] T026 [P] [US2] Create repository interfaces in src/[feature-module]/domain/repositories/
- [ ] T027 [US2] Implement use cases in src/[feature-module]/application/use-cases/
- [ ] T028 [US2] Create DTOs in src/[feature-module]/application/dtos/
- [ ] T029 [US2] Implement TypeORM repositories in src/[feature-module]/infrastructure/persistence/
- [ ] T030 [US2] Implement controllers/gateways in src/[feature-module]/interface/
- [ ] T031 [US2] Integrate with User Story 1 components (if needed)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - [Title] (Priority: P3)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 3 (MANDATORY per Constitution Principle III) ✅

- [ ] T032 [P] [US3] Unit tests for domain logic in test/unit/[feature-module]/
- [ ] T033 [P] [US3] Integration tests for repositories in test/integration/[feature-module]/
- [ ] T034 [P] [US3] E2E tests for API endpoints in test/e2e/[feature-module].e2e-spec.ts

### Implementation for User Story 3

- [ ] T035 [P] [US3] Create domain entities in src/[feature-module]/domain/entities/
- [ ] T036 [P] [US3] Create repository interfaces in src/[feature-module]/domain/repositories/
- [ ] T037 [US3] Implement use cases in src/[feature-module]/application/use-cases/
- [ ] T038 [US3] Create DTOs in src/[feature-module]/application/dtos/
- [ ] T039 [US3] Implement TypeORM repositories in src/[feature-module]/infrastructure/persistence/
- [ ] T040 [US3] Implement controllers/gateways in src/[feature-module]/interface/

**Checkpoint**: All user stories should now be independently functional

---

[Add more user story phases as needed, following the same pattern]

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] TXXX [P] Update OpenAPI/Swagger documentation
- [ ] TXXX Code cleanup and refactoring
- [ ] TXXX Performance optimization and Redis caching tuning
- [ ] TXXX Verify >80% test coverage for critical modules
- [ ] TXXX Security hardening (rate limiting, CORS, helmet)
- [ ] TXXX Run end-to-end validation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together (MANDATORY per constitution):
Task: "Unit tests for domain logic in test/unit/[feature-module]/"
Task: "Integration tests for repositories in test/integration/[feature-module]/"
Task: "E2E tests for API endpoints in test/e2e/[feature-module].e2e-spec.ts"

# Launch all domain entities together:
Task: "Create domain entities in src/[feature-module]/domain/entities/"
Task: "Create repository interfaces in src/[feature-module]/domain/repositories/"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
