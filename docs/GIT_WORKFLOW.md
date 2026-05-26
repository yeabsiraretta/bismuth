# Git Workflow Guide for Bismuth

## Table of Contents

- [Overview](#overview)
- [Branch Strategy](#branch-strategy)
- [Commit Guidelines](#commit-guidelines)
- [Pre-commit Checks](#pre-commit-checks)
- [Pull Request Process](#pull-request-process)
- [Release Process](#release-process)
- [Troubleshooting](#troubleshooting)

## Overview

Bismuth uses **Git Flow** with strict branch protection, automated testing, and conventional commits to maintain code quality and enable safe collaboration.

### Key Principles

1. **Never commit directly to `main` or `develop`**
2. **All changes go through pull requests**
3. **All commits follow conventional commit format**
4. **All tests must pass before merge**
5. **Code must be reviewed before merge**

## Branch Strategy

### Branch Types and Rules

```
main (protected)
├── develop (protected)
│   ├── feature/US1-vault-editor
│   ├── feature/US2-wikilinks
│   ├── bugfix/123-search-crash
│   └── ...
└── hotfix/v0.1.1-critical-fix
```

### `main` Branch

**Purpose**: Production-ready code only

**Protection Rules**:
- ✅ Requires 2 approvals
- ✅ All CI checks must pass
- ✅ Signed commits required
- ✅ Linear history enforced
- ❌ No direct pushes
- ❌ No force pushes
- ❌ No deletions

**Merge Sources**: Only from `release/*` or `hotfix/*` branches

### `develop` Branch

**Purpose**: Integration branch for all features

**Protection Rules**:
- ✅ Requires 1 approval
- ✅ All CI checks must pass
- ✅ Signed commits required
- ❌ No direct pushes
- ❌ No force pushes
- ❌ No deletions

**Merge Sources**: From `feature/*` and `bugfix/*` branches

### Feature Branches

**Naming**: `feature/<user-story>-<short-description>`

**Examples**:
- `feature/US1-vault-editor`
- `feature/US15-navigator`
- `feature/US2-wikilinks-graph`

**Workflow**:
```bash
# Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/US1-vault-editor

# Work on feature
git add .
git commit -m "feat(US1): implement CodeMirror 6 integration"

# Push to remote
git push origin feature/US1-vault-editor

# Create PR on GitHub targeting develop
```

**Lifespan**: Delete after merge to `develop`

### Bugfix Branches

**Naming**: `bugfix/<issue-number>-<short-description>`

**Examples**:
- `bugfix/123-search-crash`
- `bugfix/456-memory-leak`

**Workflow**: Same as feature branches

### Hotfix Branches

**Naming**: `hotfix/v<version>-<description>`

**Examples**:
- `hotfix/v0.1.1-security-patch`
- `hotfix/v0.2.1-data-corruption`

**Workflow**:
```bash
# Create from main
git checkout main
git pull origin main
git checkout -b hotfix/v0.1.1-security-patch

# Fix the issue
git add .
git commit -m "fix: patch critical security vulnerability"

# Bump version in Cargo.toml and package.json
git commit -m "chore: bump version to 0.1.1"

# Push and create PR to main
git push origin hotfix/v0.1.1-security-patch

# After merge to main, also merge to develop
git checkout develop
git merge main
git push origin develop
```

### Release Branches

**Naming**: `release/v<version>`

**Examples**:
- `release/v0.1.0`
- `release/v0.2.0`

**Workflow**:
```bash
# Create from develop
git checkout develop
git pull origin develop
git checkout -b release/v0.1.0

# Bump version
# Update CHANGELOG.md
git commit -m "chore: prepare release v0.1.0"

# Push and create PR to main
git push origin release/v0.1.0

# After merge to main, tag the release
git checkout main
git pull origin main
git tag -a v0.1.0 -m "Release v0.1.0"
git push origin v0.1.0

# Merge back to develop
git checkout develop
git merge main
git push origin develop
```

## Commit Guidelines

### Conventional Commits Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Commit Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(US1): add vault editor` |
| `fix` | Bug fix | `fix(search): resolve indexing crash` |
| `docs` | Documentation only | `docs: update API documentation` |
| `style` | Code style (no logic change) | `style: format with prettier` |
| `refactor` | Code refactoring | `refactor(vault): extract service layer` |
| `perf` | Performance improvement | `perf(search): optimize index queries` |
| `test` | Add/update tests | `test(vault): add integration tests` |
| `build` | Build system changes | `build: update dependencies` |
| `ci` | CI configuration | `ci: add caching to workflows` |
| `chore` | Other changes | `chore(deps): update rust to 1.76` |
| `revert` | Revert previous commit | `revert: revert "feat: add feature X"` |

### Scope Examples

- User stories: `US1`, `US2`, `US15`
- Components: `vault`, `editor`, `search`, `graph`, `navigator`
- Infrastructure: `deps`, `config`, `ci`, `docs`

### Commit Message Rules

✅ **Good commits**:
```bash
feat(US1): implement CodeMirror 6 integration
fix(search): prevent index corruption on concurrent writes
docs(US15): add Navigator keyboard shortcuts
test(vault): add crash recovery integration tests
perf(graph): optimize rendering for 10k+ nodes
```

❌ **Bad commits** (will be rejected):
```bash
fixed stuff
WIP
Update file.ts
asdf
quick fix
```

### Multi-line Commits

```bash
git commit -m "feat(US2): implement graph view with Konva.js

- Add force-directed layout algorithm
- Implement node filtering by tag and type
- Add pan/zoom controls with mouse and touch support
- Optimize rendering for 10k+ nodes using viewport culling

Performance: Renders 10k nodes in <3s, maintains 60fps during interaction

Closes #42"
```

### Breaking Changes

```bash
git commit -m "feat(vault)!: change vault configuration format

BREAKING CHANGE: Vault configuration now uses TOML instead of JSON.
Migration: Run 'bismuth migrate-config' to convert existing vaults.

Closes #78"
```

## Pre-commit Checks

Husky runs these checks automatically before every commit:

### 1. Lint-staged (Frontend)

Runs on staged files only:
- **ESLint**: Fixes and checks TypeScript/Svelte files
- **Prettier**: Formats all staged files
- **Rustfmt**: Formats Rust files

### 2. Rust Formatting Check

```bash
cd src-tauri && cargo fmt --all -- --check
```

Ensures all Rust code is formatted according to project standards.

### 3. Clippy (Rust Linter)

```bash
cd src-tauri && cargo clippy --all-targets --all-features -- -D warnings
```

Catches common mistakes and enforces best practices.

### Bypassing Pre-commit Hooks (Emergency Only)

```bash
# NOT RECOMMENDED - Only for emergencies
git commit --no-verify -m "emergency fix"
```

**Warning**: Bypassing hooks will likely cause CI to fail.

## Pull Request Process

### 1. Create Pull Request

**Title**: Follow commit message format
```
feat(US1): implement vault editor
```

**Description**: Use the PR template (auto-populated)

### 2. Automated Checks

GitHub Actions will run:
- ✅ Rust checks (format, clippy, tests) on all platforms
- ✅ Frontend checks (ESLint, Prettier, type-check, tests)
- ✅ E2E tests on all platforms
- ✅ Security audit (cargo audit, npm audit)
- ✅ Code coverage
- ✅ Commit message validation
- ✅ CodeQL security scan

### 3. Code Review

**For `develop` branch**:
- Minimum 1 approval required
- Reviewers check:
  - Code quality and readability
  - Test coverage
  - Performance implications
  - Security concerns
  - Documentation completeness

**For `main` branch**:
- Minimum 2 approvals required
- Additional checks:
  - Breaking changes justified
  - CHANGELOG.md updated
  - Version bumped correctly
  - Migration guide (if needed)

### 4. Merge Strategy

**Feature → Develop**: Squash and merge
- Combines all commits into one
- Keeps develop history clean
- Preserves original commits in feature branch

**Release → Main**: Merge commit
- Preserves release history
- Maintains traceability
- Creates clear version boundaries

### 5. Post-merge

- Branch is automatically deleted
- CI runs on target branch
- Dependabot checks for updates

## Release Process

### Semantic Versioning

Bismuth follows [SemVer](https://semver.org/):

```
v<MAJOR>.<MINOR>.<PATCH>

v0.1.0 → v0.1.1 (patch: bug fixes)
v0.1.1 → v0.2.0 (minor: new features, backward compatible)
v0.2.0 → v1.0.0 (major: breaking changes)
```

### Release Checklist

- [ ] All features for release merged to `develop`
- [ ] All tests passing on `develop`
- [ ] Create `release/v<version>` branch from `develop`
- [ ] Update version in `Cargo.toml` and `package.json`
- [ ] Update `CHANGELOG.md` with all changes
- [ ] Create PR to `main` with 2 reviewers
- [ ] After merge, tag release: `git tag -a v<version> -m "Release v<version>"`
- [ ] Push tag: `git push origin v<version>`
- [ ] GitHub Actions builds and publishes release artifacts
- [ ] Merge `main` back to `develop`
- [ ] Announce release

### Hotfix Release

For critical bugs in production:

1. Create `hotfix/v<version>` from `main`
2. Fix the bug
3. Bump patch version
4. Update CHANGELOG.md
5. PR to `main` (requires 2 approvals)
6. Tag and release
7. Merge to `develop`

## Troubleshooting

### Pre-commit Hook Fails

**Problem**: Commit rejected due to formatting/linting errors

**Solution**:
```bash
# Fix Rust formatting
cd src-tauri && cargo fmt --all

# Fix Clippy warnings
cd src-tauri && cargo clippy --fix --allow-dirty

# Fix frontend issues
pnpm eslint --fix .
pnpm prettier --write .

# Try commit again
git add .
git commit -m "your message"
```

### CI Fails After Push

**Problem**: Tests pass locally but fail in CI

**Common causes**:
- Platform-specific issues (test on Linux/macOS/Windows)
- Missing dependencies in CI environment
- Race conditions in tests
- Hardcoded paths

**Solution**:
```bash
# Run tests in CI mode locally
pnpm test --ci
cargo test --all-features

# Check CI logs for specific errors
# Fix and push again
```

### Merge Conflicts

**Problem**: Cannot merge PR due to conflicts

**Solution**:
```bash
# Update your branch with latest develop
git checkout feature/your-branch
git fetch origin
git rebase origin/develop

# Resolve conflicts
# Edit conflicted files
git add .
git rebase --continue

# Force push (rebase rewrites history)
git push --force-with-lease origin feature/your-branch
```

### Commit Message Rejected

**Problem**: Commit message doesn't follow conventional format

**Solution**:
```bash
# Amend last commit message
git commit --amend

# Or reset and recommit
git reset HEAD~1
git commit -m "feat(scope): proper message"
```

### Branch Protection Prevents Push

**Problem**: Cannot push to `main` or `develop`

**Solution**: You shouldn't push directly! Create a PR instead:
```bash
# Push to feature branch
git push origin feature/your-branch

# Create PR on GitHub
```

## Best Practices

### 1. Keep Commits Atomic

Each commit should represent one logical change:
```bash
# Good: One feature per commit
git commit -m "feat(US1): add vault editor"
git commit -m "test(US1): add vault editor tests"

# Bad: Multiple unrelated changes
git commit -m "add editor, fix search, update docs"
```

### 2. Write Descriptive Commit Messages

```bash
# Good: Explains what and why
git commit -m "fix(search): prevent index corruption on concurrent writes

The search index was not thread-safe, causing corruption when
multiple notes were indexed simultaneously. Added mutex protection
around index writes.

Fixes #123"

# Bad: Vague
git commit -m "fix search"
```

### 3. Test Before Committing

```bash
# Run tests
pnpm test
cd src-tauri && cargo test

# Run linters
pnpm eslint .
cargo clippy

# Then commit
git commit -m "your message"
```

### 4. Keep PRs Small

- Aim for <500 lines changed
- One feature per PR
- Easier to review
- Faster to merge
- Lower risk of conflicts

### 5. Update Documentation

When adding features:
- Update `README.md` if user-facing
- Update `CHANGELOG.md`
- Add inline code documentation
- Update `spec.md` if changing requirements

## Quick Reference

### Common Commands

```bash
# Start new feature
git checkout develop && git pull
git checkout -b feature/US1-description

# Commit changes
git add .
git commit -m "feat(US1): description"

# Push and create PR
git push origin feature/US1-description

# Update branch with latest develop
git fetch origin
git rebase origin/develop

# Squash last 3 commits
git rebase -i HEAD~3

# Amend last commit
git commit --amend

# Undo last commit (keep changes)
git reset HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1
```

### Useful Aliases

Add to `~/.gitconfig`:

```ini
[alias]
  co = checkout
  br = branch
  ci = commit
  st = status
  unstage = reset HEAD --
  last = log -1 HEAD
  visual = log --graph --oneline --all
  amend = commit --amend --no-edit
```

## Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)
- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)

---

**Questions?** Open a discussion on GitHub or check `CONTRIBUTING.md`.
