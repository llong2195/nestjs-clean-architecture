## Description

<!-- Provide a brief description of the changes in this PR -->

## Type of Change

<!-- Mark the relevant option with an "x" -->

- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📝 Documentation update
- [ ] 🎨 Code style update (formatting, renaming)
- [ ] ♻️ Code refactoring (no functional changes)
- [ ] ⚡ Performance improvement
- [ ] ✅ Test update
- [ ] 🔧 Build configuration change
- [ ] 🔒 Security fix

## Related Issue

<!-- Link to the issue this PR addresses (if applicable) -->

Closes #

## Changes Made

<!-- List the specific changes made in this PR -->

-
-
-

## Architecture Layers Affected

<!-- Mark the affected Clean Architecture layers -->

- [ ] Domain Layer (entities, value objects, domain events)
- [ ] Application Layer (use cases, DTOs)
- [ ] Infrastructure Layer (repositories, external services)
- [ ] Interface Layer (controllers, gateways)
- [ ] Shared/Common modules

## Testing

<!-- Describe the tests you've added or run -->

### Test Coverage

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] All tests passing locally

### Manual Testing

<!-- Describe any manual testing performed -->

```bash
# Commands run for testing
pnpm test
pnpm test:integration
pnpm test:e2e
```

## Checklist

<!-- Ensure all items are checked before submitting -->

### Code Quality

- [ ] My code follows the project's style guidelines (ESLint + Prettier)
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] My changes generate no new warnings or errors
- [ ] I have removed unnecessary console.log statements

### Clean Architecture

- [ ] Domain layer contains no framework dependencies (pure TypeScript)
- [ ] Dependencies point inward (domain ← application ← infrastructure)
- [ ] Repository interfaces are in domain layer, implementations in infrastructure
- [ ] Use cases orchestrate business logic in application layer
- [ ] Controllers/gateways are thin and delegate to use cases

### Database & Migrations

- [ ] Database schema changes include migration scripts
- [ ] Column names use `snake_case`
- [ ] No `@ManyToMany` decorators (using junction tables instead)
- [ ] Migrations tested locally

### Testing

- [ ] Code coverage meets thresholds (80% global, 90% domain, 85% application)
- [ ] Tests follow AAA pattern (Arrange, Act, Assert)
- [ ] Unit tests mock all external dependencies
- [ ] Integration tests use test containers (if applicable)
- [ ] E2E tests cover critical user journeys

### Documentation

- [ ] I have updated the documentation accordingly
- [ ] API changes are reflected in Swagger annotations
- [ ] README.md updated (if needed)
- [ ] Inline comments added for complex logic

### Git Conventions

- [ ] Commit messages follow conventional commits format
- [ ] Branch name follows convention (feat/, fix/, docs/, etc.)
- [ ] No merge commits (rebased on latest main/develop)

## Screenshots (if applicable)

<!-- Add screenshots for UI changes or API responses -->

## Performance Considerations

<!-- Describe any performance implications -->

- [ ] No significant performance impact
- [ ] Performance tested and optimized
- [ ] Database queries optimized (no N+1 queries)
- [ ] Caching implemented where appropriate

## Breaking Changes

<!-- List any breaking changes and migration steps -->

### Migration Steps

<!-- Steps to migrate from previous version -->

1.
2.
3.

## Security Considerations

<!-- Describe security implications -->

- [ ] No security vulnerabilities introduced
- [ ] Sensitive data properly encrypted/hashed
- [ ] Input validation implemented
- [ ] Authentication/authorization checks in place

## Dependencies

<!-- List any new dependencies added -->

### New Dependencies

-
-

### Why These Dependencies?

<!-- Justify any new dependencies -->

## Deployment Notes

<!-- Any special deployment considerations -->

- [ ] No special deployment steps required
- [ ] Environment variables updated
- [ ] Database migrations need to run
- [ ] Cache needs to be cleared
- [ ] Docker image needs rebuild

## Rollback Plan

<!-- Describe how to rollback if issues arise -->

## Additional Notes

<!-- Any additional information for reviewers -->

---

## Reviewer Checklist

<!-- For reviewers -->

- [ ] Code follows clean architecture principles
- [ ] Test coverage is adequate
- [ ] No security vulnerabilities
- [ ] Documentation is clear and complete
- [ ] Performance is acceptable
- [ ] Breaking changes are justified and documented
