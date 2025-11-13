# Git Hooks Documentation

This project uses Git hooks to enforce code quality and commit message standards automatically.

## Overview

We use the following tools:

- **[Husky](https://typicode.github.io/husky/)** - Git hooks manager
- **[lint-staged](https://github.com/lint-staged/lint-staged)** - Run linters on staged files
- **[commitlint](https://commitlint.js.org/)** - Validate commit messages

## Automatic Checks

### Pre-commit Hook

Before each commit, the following checks run automatically on **staged files only**:

1. **ESLint** - Linting with auto-fix
2. **Prettier** - Code formatting

If any check fails, the commit is aborted. Fix the issues and try again.

### Commit Message Hook

Commit messages must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

#### Valid Commit Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, missing semicolons, etc.)
- `refactor` - Code refactoring
- `perf` - Performance improvements
- `test` - Adding or updating tests
- `build` - Build system or external dependencies
- `ci` - CI/CD configuration
- `chore` - Other changes that don't modify src or test files
- `revert` - Revert previous commit

#### Examples

✅ **Good commit messages:**

```bash
git commit -m "feat: add user authentication module"
git commit -m "fix: resolve null pointer in post repository"
git commit -m "docs: update README with testing instructions"
git commit -m "refactor(user): simplify email validation logic"
git commit -m "test: add unit tests for Password value object"
```

❌ **Bad commit messages:**

```bash
git commit -m "update code"           # Missing type
git commit -m "Fix bug"               # Type must be lowercase
git commit -m "added new feature"     # Wrong format
```

## Configuration Files

### `.lintstagedrc.js`

Configures which commands run on staged files:

```javascript
module.exports = {
  '*.ts': ['eslint --fix', 'prettier --write'],
  '*.{json,yaml,yml,md}': ['prettier --write'],
};
```

### `commitlint.config.js`

Configures commit message validation rules:

```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', ['feat', 'fix', 'docs' /* ... */]],
  },
};
```

### `.husky/` Directory

Contains Git hook scripts:

- `pre-commit` - Runs lint-staged before commit
- `commit-msg` - Validates commit message format

## Manual Usage

### Test Commit Message

Validate a commit message without committing:

```bash
echo "feat: add new feature" | pnpm commitlint
```

### Run Lint-Staged Manually

Check staged files without committing:

```bash
pnpm lint-staged
```

### Skip Hooks (Use Sparingly)

In exceptional cases, you can skip hooks:

```bash
# Skip pre-commit hook
git commit --no-verify -m "feat: emergency hotfix"

# Skip commit-msg hook
HUSKY_SKIP_HOOKS=1 git commit -m "WIP: work in progress"
```

⚠️ **Warning**: Skipping hooks should be rare and only for emergency situations.

## Troubleshooting

### Hooks Not Running

**Problem**: Git hooks don't execute after cloning

**Solution**: Run the prepare script manually

```bash
pnpm install  # This runs 'prepare' script automatically
# Or manually:
pnpm prepare
```

### ESLint Errors

**Problem**: Pre-commit hook fails with ESLint errors

**Solution**: Fix the errors or run auto-fix

```bash
# Auto-fix ESLint issues
pnpm lint

# Check specific file
pnpm eslint src/path/to/file.ts --fix
```

### Prettier Formatting

**Problem**: Pre-commit hook fails due to formatting

**Solution**: Format files with Prettier

```bash
# Format all files
pnpm format

# Format specific file
pnpm prettier --write src/path/to/file.ts
```

### Commit Message Rejected

**Problem**: Commit message doesn't follow convention

**Solution**: Rewrite commit message using conventional format

```bash
# Amend last commit message
git commit --amend -m "feat: proper commit message"
```

### Husky Command Not Found

**Problem**: `husky: command not found`

**Solution**: Reinstall dependencies

```bash
rm -rf node_modules
pnpm install
```

### Windows-Specific Issues

**Problem**: Hooks don't work on Windows

**Solution**: Ensure Git is configured correctly

```bash
# Check Git hooks path
git config core.hooksPath

# Should output: .husky
```

## Development Workflow

### Making a Commit

1. **Stage your changes:**

   ```bash
   git add src/modules/user/domain/entities/user.entity.ts
   ```

2. **Commit with conventional message:**

   ```bash
   git commit -m "feat(user): add email validation to User entity"
   ```

3. **Hooks run automatically:**
   - ✅ Pre-commit: ESLint + Prettier on staged files
   - ✅ Commit-msg: Validate message format

4. **If hooks pass:**

   ```bash
   [main abc1234] feat(user): add email validation to User entity
    1 file changed, 15 insertions(+)
   ```

5. **If hooks fail:**
   ```bash
   ✖ ESLint found errors
   ✖ Commit message does not follow conventional format
   ```
   Fix the issues and try again.

### Incremental Commits

You can make multiple small commits:

```bash
# Commit 1: Domain entity
git add src/modules/user/domain/entities/user.entity.ts
git commit -m "feat(user): create User domain entity"

# Commit 2: Value object
git add src/modules/user/domain/value-objects/email.vo.ts
git commit -m "feat(user): add Email value object"

# Commit 3: Use case
git add src/modules/user/application/use-cases/create-user.use-case.ts
git commit -m "feat(user): implement CreateUser use case"
```

## Best Practices

### 1. Commit Often

Make small, focused commits:

```bash
git commit -m "feat(user): add User entity"
git commit -m "feat(user): add User repository interface"
git commit -m "test(user): add User entity unit tests"
```

### 2. Use Descriptive Messages

Be specific about what changed:

```bash
# Good
git commit -m "fix(auth): prevent token expiration edge case"

# Bad
git commit -m "fix: bug fix"
```

### 3. Scope Your Commits

Use optional scope to indicate module:

```bash
git commit -m "feat(post): add comment functionality"
git commit -m "refactor(cache): optimize Redis key generation"
git commit -m "test(auth): add JWT validation tests"
```

### 4. Stage Changes Carefully

Only stage files you intend to commit:

```bash
# Stage specific files
git add src/modules/user/domain/entities/user.entity.ts

# Don't use 'git add .' unless you've reviewed all changes
git status  # Review changes first
git add .   # Then stage if appropriate
```

### 5. Fix Issues Before Committing

If hooks fail, fix issues before re-attempting:

```bash
# Fix linting issues
pnpm lint

# Fix formatting issues
pnpm format

# Then retry commit
git commit -m "feat: add new feature"
```

## CI/CD Integration

These same checks run in CI/CD:

- **Pull Requests**: ESLint, Prettier, commitlint
- **Merge**: All tests must pass

Local hooks ensure you catch issues early before pushing.

## Disabling Hooks (Not Recommended)

To temporarily disable hooks for development:

```bash
# Disable all Husky hooks
export HUSKY=0

# Re-enable
unset HUSKY
```

⚠️ **Warning**: Only use this for local experimentation. Always re-enable before committing.

## Additional Resources

- [Husky Documentation](https://typicode.github.io/husky/)
- [lint-staged Documentation](https://github.com/lint-staged/lint-staged)
- [Commitlint Documentation](https://commitlint.js.org/)
- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [Git Hooks Guide](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks)

## Summary

- ✅ Pre-commit hooks enforce code quality automatically
- ✅ Commit message hooks enforce conventional commits
- ✅ Hooks run on staged files only (fast feedback)
- ✅ CI/CD runs same checks (consistent quality)
- ✅ Local hooks catch issues before pushing
