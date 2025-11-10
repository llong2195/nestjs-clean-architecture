<!--
SYNC IMPACT REPORT
==================
Version: 1.0.0 → 1.0.1
Rationale: PATCH update - Clarified package manager requirement (pnpm) in Technology Stack section

Changes Made:
- Updated Technology Stack & Constraints to specify pnpm as package manager
- Updated Pre-merge CI gates to use `pnpm audit` instead of `npm audit`
- No principle changes (PATCH version bump)

Principles Defined:
- I. Architecture & Modularity (Clean Architecture enforcement)
- II. Code Quality (TypeScript strictness, linting, type safety)
- III. Testing Standards (Multi-level testing with >80% coverage target)
- IV. Performance & Scalability (Redis caching, horizontal scaling, 12-factor)
- V. User Experience Consistency (API response format, OpenAPI documentation)
- VI. Security & Reliability (Input validation, sanitization, rate limiting)
- VII. Tooling & Automation (Husky, lint-staged, CI/CD enforcement)
- VIII. Extensibility & Maintainability (Modular design, naming conventions)

Sections Added:
- Core Principles (8 principles)
- Technology Stack & Constraints
- Development Workflow
- Governance

Templates Status:
✅ plan-template.md - Constitution Check section aligns with principles
✅ spec-template.md - Requirements and success criteria support principles
✅ tasks-template.md - Task organization supports modular, testable implementation
⚠️  All templates reviewed for consistency with new principles

Follow-up Actions:
- Ensure CI/CD pipeline enforces all principles
- Configure ESLint rules for Clean Architecture boundaries
- Set up test coverage reporting targeting >80%
- Configure Redis and PostgreSQL in docker-compose.yml
- Initialize pnpm workspace if using monorepo structure
-->

# NestJS Clean Architecture Boilerplate Constitution

## Core Principles

### I. Architecture & Modularity

**MUST** follow Clean Architecture with Domain-Driven Design (DDD) inspired modular structure. Every module MUST maintain clear separation of concerns across four distinct layers:

- **Domain layer**: Pure business logic (entities, value objects, domain services, use cases) - framework-agnostic, no external dependencies
- **Application layer**: Application services, port interfaces (repositories, adapters), use case orchestration
- **Infrastructure layer**: Framework-specific implementations (TypeORM repositories, Redis adapters, external service clients)
- **Interface layer**: Entry points (REST controllers, WebSocket gateways, CLI commands, gRPC services)

**Dependency Inversion**: Inner layers (domain, application) MUST NEVER depend on outer layers (infrastructure, interface). Dependencies flow inward only. Outer layers depend on abstractions (ports) defined by inner layers.

**Shared modules** (logger, config, database, cache) MUST be isolated, reusable, and follow the same layered structure.

**Rationale**: Ensures testability, maintainability, and framework independence. Business logic remains protected from infrastructure changes.

---

### II. Code Quality

**TypeScript strictness REQUIRED**: `strict: true`, `noImplicitAny: true`, `strictNullChecks: true` enforced in `tsconfig.json`.

**Code quality gates**:

- ESLint + Prettier configurations MUST be enforced pre-commit
- Zero circular dependencies allowed (enforced by `madge` or similar tool)
- All public interfaces MUST have explicit contracts via DTOs with `class-validator` decorators
- Business logic (domain layer) MUST be framework-agnostic - no NestJS decorators (`@Injectable`, `@Module`, etc.) inside `domain/` folders

**Type safety requirements**:

- No `any` types except in well-documented edge cases with justification
- Prefer strict typing over type assertions
- Use discriminated unions for polymorphic data

**Rationale**: Type safety prevents runtime errors, improves refactoring confidence, and serves as living documentation.

---

### III. Testing Standards

**Coverage target**: >80% for critical modules (domain, application layers). 100% coverage NOT mandatory but encouraged for pure business logic.

**Test pyramid MUST include**:

- **Unit tests** (Jest): Test domain logic, use cases, and services in isolation with mocked dependencies
- **Integration tests**: Test repository implementations against real databases (using test containers or in-memory alternatives)
- **E2E tests**: Test complete HTTP/WebSocket flows with full application context

**Test requirements**:

- All tests MUST run in isolation - no shared state between tests
- External systems (Redis, PostgreSQL, Kafka) MUST be mocked or containerized for tests
- Tests MUST support CI/CD execution without external dependencies
- Test naming convention: `describe('[Unit|Integration|E2E] - [Class/Feature]')`

**Rationale**: Multi-level testing ensures correctness at all architectural boundaries while maintaining fast feedback loops.

---

### IV. Performance & Scalability

**MUST** design for horizontal scalability and efficient resource usage:

**Caching strategy**:

- Redis caching REQUIRED for heavy read queries and computed results
- Cache invalidation strategies MUST be explicit and documented
- Cache keys MUST follow consistent naming conventions

**Database optimization**:

- TypeORM connection pooling MUST be configured appropriately
- Lazy loading and eager loading MUST be intentional (avoid N+1 queries)
- Database query monitoring REQUIRED in development (query logging enabled)
- Indexes MUST be defined for frequently queried fields

**Scalability requirements**:

- Application MUST be stateless to support horizontal scaling
- WebSocket scaling via Redis pub/sub REQUIRED for multi-instance deployments
- Follow 12-factor app principles: externalized config, stateless processes, disposability

**Performance baseline**: System MUST handle 1,000 requests/second without degradation under standard load.

**Rationale**: Performance is a feature. Proactive optimization prevents costly refactoring and ensures production readiness.

---

### V. User Experience Consistency (API Layer)

**Response format standardization REQUIRED**:

All API responses MUST follow this structure:

```json
{
  "status": "success" | "error",
  "data": { /* payload */ },
  "meta": { "timestamp": "ISO-8601", "requestId": "uuid" }
}
```

**Error handling**:

- Structured error codes MUST map to appropriate HTTP status codes
- Error responses MUST include: code, message, details (if applicable)
- No sensitive data exposure in error responses
- Use global exception filters for consistent error formatting

**WebSocket conventions**:

- Event names MUST use `snake_case` format
- Event versioning REQUIRED for breaking changes (e.g., `user_joined_v1`, `user_joined_v2`)
- Connection acknowledgments and error events MUST be standardized

**Documentation**:

- OpenAPI (Swagger) documentation MUST be auto-generated and kept up-to-date
- All endpoints MUST have examples and response schemas
- DTOs drive schema generation automatically

**Rationale**: Consistent interfaces reduce client integration effort and improve developer experience.

---

### VI. Security & Reliability

**Input validation MANDATORY**:

- All incoming data MUST be validated using `class-validator` decorators on DTOs
- Validation pipes MUST be globally configured
- Use `whitelist: true` and `forbidNonWhitelisted: true` to prevent unexpected properties

**Output sanitization**:

- DTOs MUST explicitly define which fields are exposed (use `class-transformer` `@Expose` and `@Exclude`)
- Never return raw entities to clients
- Sensitive data (passwords, tokens) MUST be excluded from all responses

**Communication security**:

- Redis and PostgreSQL connections MUST use TLS in production
- Environment-based security configuration (TLS disabled in local dev, enforced in staging/prod)

**Rate limiting & monitoring**:

- Rate limiting MUST be implemented on all public endpoints
- Request/response logging REQUIRED for debugging and audit trails
- Correlation IDs MUST be injected for request tracing

**Rationale**: Security is non-negotiable. Defense in depth prevents vulnerabilities and ensures regulatory compliance.

---

### VII. Tooling & Automation

**Pre-commit enforcement**:

- Husky + lint-staged MUST be configured to run type checks, linting, and formatting before commits
- Commits MUST follow conventional commit format (`feat:`, `fix:`, `docs:`, etc.)
- Git hooks enforce code quality gates before code reaches CI

**CI/CD pipeline requirements**:

- CI MUST run: build, type check, lint, unit tests, integration tests
- All checks MUST pass before merge
- CI environment MUST be isolated (no shared state between builds)

**Environment consistency**:

- `Dockerfile` and `docker-compose.yml` REQUIRED for reproducible local and production environments
- Development environment MUST match production environment closely (use same Node.js version, PostgreSQL version, Redis version)

**Automation philosophy**: If it can be automated, it MUST be automated. Manual quality checks are unreliable.

**Rationale**: Automation reduces human error, increases delivery speed, and ensures consistent quality.

---

### VIII. Extensibility & Maintainability

**Modularity principle**:

- New feature modules MUST be addable without modifying core/shared modules
- Modules MUST be loosely coupled via well-defined interfaces (ports)
- Prefer composition over inheritance for behavior reuse

**Naming conventions (STRICTLY ENFORCED)**:

- **Folders**: `kebab-case` (e.g., `user-management/`, `order-processing/`)
- **Classes**: `PascalCase` (e.g., `CreateUserUseCase`, `OrderRepository`)
- **Files**: `camelCase` or `kebab-case` for consistency within layers (e.g., `createUser.useCase.ts` or `create-user.use-case.ts`)
- **Interfaces**: Prefix with `I` or suffix with `Interface` (e.g., `IUserRepository` or `UserRepositoryInterface`)

**Code organization**:

- Each module follows the standard layer structure: `domain/`, `application/`, `infrastructure/`, `interface/`
- Shared utilities in `common/` or `shared/` at repository root
- Configuration files in `config/` module

**Maintainability principles**:

- Code MUST be self-documenting via clear naming
- Complex algorithms REQUIRE explanatory comments
- No magic numbers/strings - use constants or configuration
- YAGNI (You Aren't Gonna Need It) - avoid premature abstraction

**Rationale**: Maintainable code has a longer lifespan and lower total cost of ownership.

---

## Technology Stack & Constraints

**Core Technologies**:

- **Runtime**: Node.js 22+ (LTS versions only)
- **Language**: TypeScript 5.x with strict mode
- **Framework**: NestJS 11.x
- **Package Manager**: pnpm 10.x+ (REQUIRED - leverages workspace support and efficient disk usage)
- **Database**: PostgreSQL 18+ with TypeORM 0.3.x
- **Cache/Pub-Sub**: Redis 7.x
- **Testing**: Jest 29.x + Supertest for E2E

**Optional Integrations** (based on requirements):

- **Message Queue**: Kafka, BullMQ (Redis-based)
- **Protocols**: gRPC, REST (default), GraphQL (if needed)

**Constraints**:

- All dependencies MUST have active maintenance and security support
- Breaking changes in dependencies MUST be evaluated before upgrade
- Use exact versions in `package.json` for reproducibility (`1.2.3`, not `^1.2.3`)
- pnpm MUST be used for all dependency management (install, update, audit)

**Performance Standards**:

- API response time: p95 < 200ms for non-computation-heavy endpoints
- Database queries: p95 < 50ms for indexed queries
- Memory footprint: < 1024MB base memory per instance (idle)

---

## Development Workflow

### Code Review Requirements

- All code changes MUST go through pull request review
- PRs MUST pass CI checks before review
- At least one approval REQUIRED from code owner or senior developer
- Self-merging prohibited except for documentation-only changes

### Quality Gates

**Pre-commit**:

- TypeScript compilation successful
- ESLint passes with zero errors, zero warnings
- Prettier formatting applied

**Pre-merge (CI)**:

- All tests pass (unit, integration, e2e)
- Test coverage does not decrease
- No new security vulnerabilities (via `pnpm audit`)
- Build artifacts generated successfully

### Branching Strategy

- `main` branch MUST always be deployable
- Feature branches: `feature/###-descriptive-name`
- Bugfix branches: `fix/###-issue-description`
- Release branches: `release/vX.Y.Z` (if applicable)

### Commit Standards

- Follow conventional commits: `<type>(<scope>): <description>`
- Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `ci`
- Breaking changes MUST include `BREAKING CHANGE:` in commit body

---

## Governance

**Constitutional Authority**: This constitution supersedes all other development practices, guidelines, and preferences. When conflicts arise, this document is the authoritative reference.

**Compliance Verification**:

- All pull requests MUST verify compliance with architectural principles
- Code reviews MUST explicitly check for principle violations
- Constitution violations MUST be justified and documented in PR description if approved (rare exceptions only)

**Amendment Process**:

1. Proposed amendments MUST include rationale and impact assessment
2. Amendments require approval from project maintainers
3. Version bump follows semantic versioning:
   - **MAJOR**: Backward-incompatible governance changes or principle removal/redefinition
   - **MINOR**: New principles added or material expansion of existing guidance
   - **PATCH**: Clarifications, wording improvements, typo fixes, non-semantic refinements
4. All dependent templates and documentation MUST be updated within same PR as amendment
5. Migration plan REQUIRED for breaking changes affecting existing code

**Complexity Justification**: Any deviation from principles (e.g., violating dependency inversion, skipping tests) MUST be documented in implementation plan with:

- Why deviation is necessary
- Simpler alternatives considered and rejected
- Timeline for remediation (if temporary)

**Living Document**: This constitution will evolve with the project. Regular review (quarterly recommended) ensures principles remain relevant and actionable.

---

**Version**: 1.0.1 | **Ratified**: 2025-11-11 | **Last Amended**: 2025-11-11
