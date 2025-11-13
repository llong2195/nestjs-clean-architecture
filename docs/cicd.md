# CI/CD Pipeline Documentation

This document describes the Continuous Integration and Continuous Deployment (CI/CD) pipeline for the NestJS Clean Architecture Boilerplate.

## Table of Contents

- [Overview](#overview)
- [GitHub Actions Workflow](#github-actions-workflow)
- [Pipeline Jobs](#pipeline-jobs)
- [Branch Protection Rules](#branch-protection-rules)
- [Pull Request Process](#pull-request-process)
- [Troubleshooting](#troubleshooting)

## Overview

The CI/CD pipeline automatically runs on:

- **Push to any branch**: Full test suite and build
- **Pull requests**: All checks + commit message validation

### Pipeline Stages

```
┌─────────────┐
│   Lint      │  ← ESLint + Prettier
├─────────────┤
│ Commitlint  │  ← Conventional commits (PR only)
├─────────────┤
│ Unit Tests  │  ← Fast, isolated tests
├─────────────┤
│ Integration │  ← Database + Redis tests
├─────────────┤
│   E2E       │  ← Full API flow tests
├─────────────┤
│   Build     │  ← TypeScript compilation
├─────────────┤
│   Docker    │  ← Image build test
├─────────────┤
│  Security   │  ← Dependency audit
├─────────────┤
│  Coverage   │  ← Combined coverage report
└─────────────┘
```

## GitHub Actions Workflow

### Workflow File

`.github/workflows/ci.yml`

### Trigger Events

```yaml
on:
  push:
    branches:
      - master
      - develop
      - '**' # All branches
  pull_request:
    branches:
      - master
      - develop
```

### Environment Variables

```yaml
env:
  NODE_VERSION: '22'
  PNPM_VERSION: '10.18.1'
```

### Concurrency Control

Automatically cancels in-progress runs for the same pull request:

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true
```

## Pipeline Jobs

### 1. Lint and Format

**Purpose**: Ensure code quality and consistent formatting

**Steps**:

1. Checkout code
2. Setup pnpm and Node.js
3. Install dependencies
4. Run ESLint
5. Check Prettier formatting

**Timeout**: 10 minutes

**Example**:

```bash
# Run locally
pnpm lint
pnpm format --check
```

### 2. Commitlint

**Purpose**: Validate commit messages follow conventional commits

**Runs**: Pull requests only

**Steps**:

1. Checkout code with full history
2. Setup pnpm and Node.js
3. Install dependencies
4. Validate commit messages from base to HEAD

**Timeout**: 5 minutes

**Valid Commit Formats**:

```bash
feat: add user authentication
fix: resolve null pointer in repository
docs: update README
test: add unit tests for Email value object
```

### 3. Unit Tests

**Purpose**: Run fast, isolated domain and application logic tests

**Steps**:

1. Checkout code
2. Setup pnpm and Node.js
3. Install dependencies
4. Run unit tests
5. Upload coverage to Codecov

**Timeout**: 15 minutes

**Example**:

```bash
# Run locally
pnpm test:unit
```

**Coverage Thresholds**:

- Domain layer: 90%
- Application layer: 85%
- Global: 80%

### 4. Integration Tests

**Purpose**: Test infrastructure components (repositories, cache, etc.)

**Services**:

- PostgreSQL 18 (port 5432)
- Redis 7 (port 6379)

**Steps**:

1. Start PostgreSQL and Redis services
2. Checkout code
3. Setup pnpm and Node.js
4. Install dependencies
5. Run integration tests
6. Upload coverage to Codecov

**Timeout**: 20 minutes

**Environment Variables**:

```yaml
DATABASE_HOST: localhost
DATABASE_PORT: 5432
DATABASE_USERNAME: postgres
DATABASE_PASSWORD: postgres
DATABASE_NAME: nestjs_clean_architecture_test
REDIS_HOST: localhost
REDIS_PORT: 6379
```

**Example**:

```bash
# Run locally with Docker
docker-compose up -d postgres redis
pnpm test:integration
```

### 5. E2E Tests

**Purpose**: Test complete API flows and user journeys

**Services**:

- PostgreSQL 18 (port 5432)
- Redis 7 (port 6379)

**Steps**:

1. Start PostgreSQL and Redis services
2. Checkout code
3. Setup pnpm and Node.js
4. Install dependencies
5. Run E2E tests
6. Upload coverage to Codecov

**Timeout**: 25 minutes

**Additional Environment Variables**:

```yaml
JWT_SECRET: test-secret-key
JWT_REFRESH_SECRET: test-refresh-secret-key
NODE_ENV: test
```

**Example**:

```bash
# Run locally with Docker
docker-compose up -d postgres redis
pnpm test:e2e
```

### 6. Build Application

**Purpose**: Ensure TypeScript compiles successfully

**Dependencies**: Requires `lint` and `test-unit` to pass

**Steps**:

1. Checkout code
2. Setup pnpm and Node.js
3. Install dependencies
4. Build application
5. Verify build artifacts exist
6. Upload build artifacts (retained for 7 days)

**Timeout**: 15 minutes

**Validation**:

```bash
# Checks for:
dist/main.js exists
dist/ directory exists
```

**Example**:

```bash
# Run locally
pnpm build
ls -la dist/
```

### 7. Docker Build Test

**Purpose**: Verify Docker images build successfully

**Dependencies**: Requires `lint` to pass

**Steps**:

1. Checkout code
2. Setup Docker Buildx
3. Build production image (Dockerfile)
4. Build development image (Dockerfile.dev)

**Timeout**: 20 minutes

**Features**:

- Uses GitHub Actions cache for faster builds
- Builds both production and development images
- No push (test only)

**Example**:

```bash
# Run locally
docker build -t nestjs-clean-architecture:test .
docker build -f Dockerfile.dev -t nestjs-clean-architecture:dev-test .
```

### 8. Security Audit

**Purpose**: Check for vulnerable dependencies

**Steps**:

1. Checkout code
2. Setup pnpm and Node.js
3. Run security audit (moderate level)
4. Check for high severity vulnerabilities

**Timeout**: 10 minutes

**Severity Levels**:

- **Moderate**: Warning only (continues)
- **High**: Warning with notification
- **Critical**: Should fail (recommended)

**Example**:

```bash
# Run locally
pnpm audit
pnpm audit --audit-level=high
```

### 9. Code Coverage Report

**Purpose**: Generate combined coverage report

**Dependencies**: Runs after all test jobs complete

**Steps**:

1. Checkout code
2. Setup pnpm and Node.js
3. Install dependencies
4. Generate combined coverage
5. Upload to Codecov

**Timeout**: 10 minutes

**Coverage Flags**:

- `unit` - Unit test coverage
- `integration` - Integration test coverage
- `e2e` - E2E test coverage
- `combined` - Combined coverage

**Example**:

```bash
# Run locally
pnpm test:cov
open coverage/lcov-report/index.html
```

### 10. All Checks Passed

**Purpose**: Final validation that all required checks passed

**Dependencies**: All previous jobs

**Steps**:

1. Verify each job result
2. Fail if any required job failed
3. Display success message if all pass

**Validation Logic**:

```bash
✓ Lint passed
✓ Unit tests passed
✓ Integration tests passed
✓ E2E tests passed
✓ Build passed
✓ Docker build passed
✓ All checks passed!
```

## Branch Protection Rules

### Recommended Settings

**For `master` branch:**

```yaml
Required status checks:
  - Lint and Format
  - Unit Tests
  - Integration Tests
  - E2E Tests
  - Build Application
  - Docker Build Test
  - All Checks Passed

Required reviews:
  - At least 1 approval
  - Dismiss stale reviews on push
  - Require review from code owners

Additional rules:
  - Require linear history (no merge commits)
  - Require signed commits
  - Require branches to be up to date
  - Do not allow force pushes
  - Do not allow deletions
```

**For `develop` branch:**

```yaml
Required status checks:
  - Lint and Format
  - Unit Tests
  - Build Application

Required reviews:
  - At least 1 approval

Additional rules:
  - Require linear history
  - Allow force pushes with lease
```

### GitHub Settings

Navigate to: **Settings → Branches → Branch protection rules**

1. **Add rule** for `master`
2. Enable protection settings listed above
3. **Add rule** for `develop` with relaxed settings

## Pull Request Process

### 1. Create Feature Branch

```bash
# Create branch from develop
git checkout develop
git pull origin develop
git checkout -b feat/user-authentication

# Or for bugfix
git checkout -b fix/null-pointer-error
```

### 2. Make Changes

```bash
# Write code following clean architecture
# Add tests
# Ensure linting passes locally

pnpm lint
pnpm format
pnpm test
```

### 3. Commit Changes

```bash
# Follow conventional commits
git add .
git commit -m "feat(auth): add JWT authentication"

# Pre-commit hooks run automatically
# - ESLint
# - Prettier
```

### 4. Push Branch

```bash
git push origin feat/user-authentication
```

### 5. Create Pull Request

1. Go to GitHub repository
2. Click "Compare & pull request"
3. Fill out PR template:
   - Description
   - Type of change
   - Related issue
   - Changes made
   - Testing details
   - Checklist items

### 6. CI/CD Pipeline Runs

Pipeline automatically triggers:

```
✓ Lint and Format (2 min)
✓ Commitlint (1 min)
✓ Unit Tests (5 min)
✓ Integration Tests (8 min)
✓ E2E Tests (12 min)
✓ Build Application (3 min)
✓ Docker Build Test (10 min)
✓ Security Audit (2 min)
✓ Coverage Report (3 min)
✓ All Checks Passed

Total time: ~15-20 minutes (parallel execution)
```

### 7. Address Review Comments

```bash
# Make changes
git add .
git commit -m "fix: address review comments"
git push origin feat/user-authentication

# CI/CD re-runs automatically
```

### 8. Merge Pull Request

**Options:**

1. **Squash and merge** (recommended)
   - Combines all commits into one
   - Keeps history clean

2. **Rebase and merge**
   - Preserves all commits
   - Linear history

3. **Merge commit**
   - Not recommended (violates linear history)

## Troubleshooting

### Pipeline Failures

#### Lint Failures

**Error**: ESLint errors

**Solution**:

```bash
# Fix linting issues
pnpm lint

# Auto-fix where possible
pnpm lint:fix
```

**Error**: Formatting issues

**Solution**:

```bash
# Format all files
pnpm format
```

#### Test Failures

**Error**: Unit tests fail

**Solution**:

```bash
# Run tests locally
pnpm test:unit

# Debug specific test
pnpm test:unit --testNamePattern="should create user"

# Run with coverage
pnpm test:cov
```

**Error**: Integration tests fail

**Solution**:

```bash
# Ensure Docker is running
docker ps

# Start required services
docker-compose up -d postgres redis

# Run integration tests
pnpm test:integration

# Check service health
docker-compose ps
```

**Error**: E2E tests fail

**Solution**:

```bash
# Start all services
docker-compose up -d

# Run E2E tests
pnpm test:e2e

# Check application logs
docker-compose logs app
```

#### Build Failures

**Error**: TypeScript compilation errors

**Solution**:

```bash
# Check TypeScript errors
pnpm build

# Fix type errors
# Re-run build
```

**Error**: Missing dependencies

**Solution**:

```bash
# Clean install
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

#### Docker Build Failures

**Error**: Docker image build fails

**Solution**:

```bash
# Build locally to debug
docker build -t test .

# Check Dockerfile syntax
docker build --no-cache -t test .

# Verify .dockerignore
cat .dockerignore
```

#### Security Audit Failures

**Error**: Vulnerable dependencies

**Solution**:

```bash
# Check vulnerabilities
pnpm audit

# Fix automatically where possible
pnpm audit --fix

# Update specific package
pnpm update package-name
```

### Slow Pipeline

**Issue**: Pipeline takes too long

**Solutions**:

1. **Cache optimization**:
   - pnpm cache already configured
   - Docker layer caching enabled

2. **Parallel execution**:
   - Tests run in parallel
   - Unrelated jobs run concurrently

3. **Selective testing**:
   - Unit tests run first (fast fail)
   - Integration/E2E only if unit tests pass

### Coverage Not Uploading

**Issue**: Codecov upload fails

**Solution**:

1. **Check Codecov token**:
   - Add `CODECOV_TOKEN` to GitHub secrets
   - Settings → Secrets → Actions → New secret

2. **Verify coverage files**:

   ```bash
   # Ensure coverage files exist
   ls -la coverage/
   ```

3. **Check Codecov action version**:
   ```yaml
   - uses: codecov/codecov-action@v4
     with:
       token: ${{ secrets.CODECOV_TOKEN }}
   ```

### Commitlint Failures

**Error**: Invalid commit message format

**Solution**:

```bash
# Rewrite commit message
git commit --amend -m "feat: add new feature"

# Or interactive rebase
git rebase -i HEAD~3

# Validate locally
echo "feat: test message" | pnpm commitlint
```

## Best Practices

### 1. Run Tests Locally First

```bash
# Before pushing
pnpm lint
pnpm format
pnpm test
pnpm build
```

### 2. Keep Commits Atomic

- One logical change per commit
- Follow conventional commits
- Write descriptive commit messages

### 3. Write Tests First (TDD)

- Write failing test
- Implement feature
- Ensure test passes
- Refactor

### 4. Keep PRs Small

- Easier to review
- Faster to merge
- Reduces merge conflicts
- Easier to rollback

### 5. Update Documentation

- Update README if needed
- Add inline comments
- Update Swagger annotations
- Document breaking changes

### 6. Monitor Pipeline

- Check CI status before requesting review
- Fix failures immediately
- Don't merge with failing tests

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Branch Protection Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/about-protected-branches)
- [Codecov Documentation](https://docs.codecov.com/)
- [Docker Build GitHub Action](https://github.com/docker/build-push-action)

## Summary

- ✅ Automated testing on every push and PR
- ✅ Lint, format, and commit message validation
- ✅ Unit, integration, and E2E tests
- ✅ Build verification and Docker image testing
- ✅ Security audits and dependency checks
- ✅ Code coverage tracking with Codecov
- ✅ Branch protection for master and develop
- ✅ Comprehensive PR template
- ✅ Clear failure troubleshooting guide
