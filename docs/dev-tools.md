# Development Tools Guide

This document covers the development tools configured in this project to maintain code quality, prevent circular dependencies, and automate versioning.

## Table of Contents

- [Circular Dependency Detection](#circular-dependency-detection)
- [Automated Versioning](#automated-versioning)
- [Pre-commit Hooks](#pre-commit-hooks)
- [Troubleshooting](#troubleshooting)

## Circular Dependency Detection

We use [madge](https://github.com/pahen/madge) to detect and visualize circular dependencies in the codebase.

### Why Circular Dependencies Are Bad

Circular dependencies can cause:

- **Runtime errors**: Modules may not initialize properly
- **Hard-to-debug issues**: Unpredictable behavior
- **Build failures**: Bundlers may fail to resolve modules
- **Memory leaks**: Modules holding references to each other

### Check for Circular Dependencies

```bash
# Check for circular dependencies (exit code 1 if found)
pnpm circular

# Example output:
# ✖ Found 3 circular dependencies!
#
# 1) user.module.ts > auth.module.ts
# 2) auth.module.ts > user.module.ts
```

### Visualize Dependencies

```bash
# Generate SVG image of circular dependencies
pnpm circular:graph

# This creates: circular-deps.svg
```

```bash
# Generate full dependency graph
pnpm deps:graph

# This creates: dependency-graph.svg
```

### Fix Circular Dependencies

**Option 1: Extract to Shared Module**

```typescript
// ❌ BAD: Circular dependency
// user.module.ts
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
})
export class UserModule {}

// auth.module.ts
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule], // Circular!
})
export class AuthModule {}
```

```typescript
// ✅ GOOD: Extract shared interfaces
// shared/interfaces/user.interface.ts
export interface IUser {
  id: string;
  email: string;
}

// user.module.ts
@Module({
  providers: [
    {
      provide: 'IUserRepository',
      useClass: UserRepository,
    },
  ],
  exports: ['IUserRepository'],
})
export class UserModule {}

// auth.module.ts
@Module({
  imports: [UserModule], // No circular dependency
})
export class AuthModule {}
```

**Option 2: Use forwardRef()**

Only use as a last resort:

```typescript
// ❌ Last resort (avoid if possible)
import { forwardRef } from '@nestjs/common';

@Module({
  imports: [forwardRef(() => UserModule)],
})
export class AuthModule {}
```

**Option 3: Dependency Inversion**

```typescript
// ✅ BEST: Use interfaces (ports)
// domain/repositories/user.repository.interface.ts
export interface IUserRepository {
  findById(id: string): Promise<User | null>;
}

// application/use-cases/login.use-case.ts
@Injectable()
export class LoginUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}
}
```

### CI/CD Integration

Add to `.github/workflows/ci.yml`:

```yaml
- name: Check Circular Dependencies
  run: pnpm circular
```

This will fail the build if circular dependencies are detected.

### Known Acceptable Circular Dependencies

Some circular dependencies in ORM entities are acceptable due to TypeORM's bidirectional relations:

```typescript
// Acceptable: TypeORM bidirectional relations
@Entity()
export class Post {
  @OneToMany(() => Comment, (comment) => comment.post)
  comments: Comment[];
}

@Entity()
export class Comment {
  @ManyToOne(() => Post, (post) => post.comments)
  post: Post;
}
```

To exclude these from checks, create `.madgerc`:

```json
{
  "fileExtensions": ["ts"],
  "excludeRegExp": [".*\\.spec\\.ts$", ".*\\.orm-entity\\.ts$"]
}
```

## Automated Versioning

We use [standard-version](https://github.com/conventional-changelog/standard-version) for automatic versioning and CHANGELOG generation based on Conventional Commits.

### Semantic Versioning

Follows [SemVer](https://semver.org/): `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes (`BREAKING CHANGE:` in commit)
- **MINOR**: New features (`feat:` commits)
- **PATCH**: Bug fixes (`fix:` commits)

### Create a Release

```bash
# Automatic version bump based on commits
pnpm release

# Example:
# ✔ bumping version in package.json from 0.0.1 to 0.1.0
# ✔ created CHANGELOG.md
# ✔ committed package.json and CHANGELOG.md
# ✔ tagged release v0.1.0
```

### Specific Version Bump

```bash
# Bump minor version (0.1.0 -> 0.2.0)
pnpm release:minor

# Bump major version (0.1.0 -> 1.0.0)
pnpm release:major

# Custom version
pnpm release -- --release-as 2.0.0
```

### Pre-release Versions

```bash
# Create pre-release (0.1.0 -> 0.1.1-0)
pnpm release -- --prerelease

# Create alpha release (0.1.0 -> 0.1.1-alpha.0)
pnpm release -- --prerelease alpha

# Create beta release (0.1.0 -> 0.1.1-beta.0)
pnpm release -- --prerelease beta
```

### First Release

```bash
# First release (creates 1.0.0)
pnpm release -- --first-release
```

### Dry Run

```bash
# See what would happen without making changes
pnpm release -- --dry-run
```

### CHANGELOG.md

Standard-version automatically generates `CHANGELOG.md` based on commits:

```markdown
# Changelog

## [0.2.0](https://github.com/your-org/clean-architecture/compare/v0.1.0...v0.2.0) (2025-01-11)

### ✨ Features

- **auth**: add Google OAuth authentication ([abc1234](https://github.com/your-org/clean-architecture/commit/abc1234))
- **user**: add user profile endpoints ([def5678](https://github.com/your-org/clean-architecture/commit/def5678))

### 🐛 Bug Fixes

- **post**: resolve null pointer in repository ([ghi9012](https://github.com/your-org/clean-architecture/commit/ghi9012))

### 📚 Documentation

- update API documentation ([jkl3456](https://github.com/your-org/clean-architecture/commit/jkl3456))
```

### Configuration

CHANGELOG format is configured in `.versionrc.json`:

```json
{
  "types": [
    { "type": "feat", "section": "✨ Features" },
    { "type": "fix", "section": "🐛 Bug Fixes" },
    { "type": "perf", "section": "⚡ Performance Improvements" },
    { "type": "refactor", "section": "♻️ Code Refactoring" },
    { "type": "docs", "section": "📚 Documentation" },
    { "type": "test", "section": "✅ Tests" }
  ]
}
```

### Release Workflow

1. **Make changes** following Conventional Commits
2. **Commit changes**:
   ```bash
   git commit -m "feat(user): add user avatar upload"
   git commit -m "fix(auth): resolve token expiration bug"
   ```
3. **Create release**:
   ```bash
   pnpm release
   ```
4. **Push to repository**:
   ```bash
   git push --follow-tags origin main
   ```
5. **Create GitHub Release** (optional):
   - Go to GitHub → Releases → Draft a new release
   - Choose the tag created by standard-version
   - Copy content from CHANGELOG.md
   - Publish release

### Automating GitHub Releases

Add to `.github/workflows/release.yml`:

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Create GitHub Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          body_path: CHANGELOG.md
          draft: false
          prerelease: false
```

## Pre-commit Hooks

Pre-commit hooks run automatically before each commit. See [Git Hooks Guide](./git-hooks.md) for details.

### Configured Hooks

**Pre-commit** (runs on staged files):

- ESLint with auto-fix
- Prettier formatting
- Type checking (optional)

**Commit-msg** (validates commit message):

- Conventional Commits format
- Minimum length requirements
- No trailing periods

### Bypass Hooks (Emergency Only)

```bash
# Skip pre-commit hooks (NOT RECOMMENDED)
git commit --no-verify -m "emergency fix"

# Or set environment variable
HUSKY=0 git commit -m "emergency fix"
```

**Warning**: Only bypass hooks in emergencies. The CI/CD pipeline will still run all checks.

## Troubleshooting

### Madge Issues

**Problem**: `madge: command not found`

```bash
# Solution: Reinstall dependencies
pnpm install
```

**Problem**: Madge not detecting TypeScript files

```bash
# Solution: Ensure TypeScript is installed
pnpm add -D typescript @types/node
```

**Problem**: Too many circular dependencies

```bash
# Solution: Exclude ORM entities
echo '{ "excludeRegExp": [".*\\.orm-entity\\.ts$"] }' > .madgerc
```

### Standard-Version Issues

**Problem**: `standard-version: command not found`

```bash
# Solution: Reinstall dependencies
pnpm install
```

**Problem**: No commits found

```bash
# Solution: Ensure you have conventional commits
git log --oneline

# If no commits match, use --first-release
pnpm release -- --first-release
```

**Problem**: Wrong version bump

```bash
# Solution: Specify version explicitly
pnpm release -- --release-as 1.2.3
```

**Problem**: CHANGELOG not updating

```bash
# Solution: Regenerate CHANGELOG
rm CHANGELOG.md
pnpm release -- --first-release
```

### Git Hooks Issues

**Problem**: Husky hooks not running

```bash
# Solution: Reinstall husky
rm -rf .husky
pnpm prepare
```

**Problem**: ESLint errors blocking commit

```bash
# Solution: Fix errors automatically
pnpm lint:fix

# Or check specific file
pnpm lint src/path/to/file.ts --fix
```

**Problem**: Commitlint failing

```bash
# Solution: Use conventional commit format
git commit -m "feat: add new feature"  # ✅ Valid
git commit -m "add new feature"        # ❌ Invalid
```

## Best Practices

### Circular Dependencies

1. ✅ **Run checks frequently**: `pnpm circular`
2. ✅ **Use dependency inversion**: Depend on interfaces, not concrete classes
3. ✅ **Extract shared logic**: Create shared modules for common functionality
4. ✅ **Avoid forwardRef()**: Use proper architecture instead
5. ✅ **Document exceptions**: If circular deps are unavoidable, document why

### Versioning

1. ✅ **Use conventional commits**: Required for automatic versioning
2. ✅ **Create releases regularly**: Don't accumulate too many changes
3. ✅ **Review CHANGELOG**: Before pushing, verify CHANGELOG is accurate
4. ✅ **Tag releases**: Always push tags with `git push --follow-tags`
5. ✅ **Document breaking changes**: Use `BREAKING CHANGE:` in commit body

### Git Hooks

1. ✅ **Keep hooks fast**: Pre-commit should run in < 10 seconds
2. ✅ **Fix issues before commit**: Don't bypass hooks
3. ✅ **Update hooks as needed**: Modify `.husky/pre-commit` for new checks
4. ✅ **Test hooks locally**: Ensure they work before pushing
5. ✅ **Document custom hooks**: Add comments explaining complex checks

## Summary

**Development Tools Overview:**

| Tool                 | Purpose                       | Command         | When to Use              |
| -------------------- | ----------------------------- | --------------- | ------------------------ |
| **madge**            | Circular dependency detection | `pnpm circular` | Before commits, in CI/CD |
| **standard-version** | Automated versioning          | `pnpm release`  | When creating releases   |
| **Husky**            | Git hooks                     | Automatic       | Every commit             |
| **lint-staged**      | Staged file linting           | Automatic       | Every commit             |
| **commitlint**       | Commit message validation     | Automatic       | Every commit             |

**Quick Reference:**

```bash
# Check circular dependencies
pnpm circular

# Visualize dependencies
pnpm circular:graph
pnpm deps:graph

# Create release
pnpm release              # Auto version bump
pnpm release:minor        # Minor version bump
pnpm release:major        # Major version bump

# Dry run (see what would happen)
pnpm release -- --dry-run
```

## Next Steps

- [Git Hooks Guide](./git-hooks.md) - Detailed Git hooks documentation
- [CI/CD Guide](./cicd.md) - Integrate tools into CI/CD pipeline
- [Contributing Guide](../CONTRIBUTING.md) - Contribution workflow
- [Architecture Guide](./architecture.md) - Prevent circular dependencies with Clean Architecture
