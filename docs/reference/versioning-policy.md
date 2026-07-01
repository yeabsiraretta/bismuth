# Versioning Strategy for Bismuth

## Overview

Bismuth follows **Semantic Versioning 2.0.0** (SemVer) for all releases. This document explains our versioning strategy, release process, and how to manage versions across the codebase.

## Semantic Versioning

### Version Format

```
MAJOR.MINOR.PATCH[-PRERELEASE][+BUILD]

Example: 1.2.3-beta.1+20260525
```

### Version Components

**MAJOR** (X.0.0):

- Incompatible API changes
- Breaking changes to public interfaces
- Removal of deprecated features
- Major architectural changes
- User-facing breaking changes

**MINOR** (0.X.0):

- New features (backward compatible)
- New user stories implemented
- Non-breaking API additions
- Deprecation of features (with warnings)
- Significant improvements

**PATCH** (0.0.X):

- Bug fixes (backward compatible)
- Performance improvements
- Documentation updates
- Security patches
- Minor improvements

**PRERELEASE** (optional):

- Alpha: `1.0.0-alpha.1` (early testing)
- Beta: `1.0.0-beta.1` (feature complete, testing)
- RC: `1.0.0-rc.1` (release candidate)

**BUILD** (optional):

- Build metadata: `1.0.0+20260525`
- Not considered in version precedence

## Pre-1.0.0 Development

### Special Rules for 0.x.x

During initial development (versions 0.x.x):

1. **Anything may change at any time**
   - Public API is not stable
   - Breaking changes allowed in minor versions
   - Use with caution in production

2. **Version Bumping**:
   - **0.x.0**: New features, may include breaking changes
   - **0.x.y**: Bug fixes and minor improvements (should be backward compatible)

3. **Examples**:

   ```
   0.1.0 → 0.2.0  (new features, possible breaking changes)
   0.2.0 → 0.2.1  (bug fixes, backward compatible)
   0.2.1 → 0.3.0  (new features, possible breaking changes)
   ```

4. **Transition to 1.0.0**:
   - When public API is stable
   - When ready for production use
   - When backward compatibility guarantees can be made
   - When all MVP features are complete and tested

## Version Lifecycle

### Development Phases

```
0.0.1 (Initial)
  ↓
0.1.0 (MVP - Core features)
  ↓
0.2.0 (Wikilinks & Graph)
  ↓
0.3.0 (Search & Indexing)
  ↓
0.4.0 (Lifecycle Management)
  ↓
0.5.0 (Tags & Metadata)
  ↓
0.6.0 (Advanced Features)
  ↓
1.0.0 (Stable Release)
  ↓
1.1.0 (New features)
  ↓
1.1.1 (Bug fixes)
  ↓
2.0.0 (Breaking changes)
```

### Release Types

#### Alpha Releases (0.x.0-alpha.y)

- **Purpose**: Early testing, unstable
- **Audience**: Developers, early adopters
- **Frequency**: As needed during development
- **Example**: `0.1.0-alpha.1`

#### Beta Releases (0.x.0-beta.y)

- **Purpose**: Feature complete, testing
- **Audience**: Beta testers, power users
- **Frequency**: Before each minor release
- **Example**: `0.1.0-beta.1`

#### Release Candidates (0.x.0-rc.y)

- **Purpose**: Final testing before release
- **Audience**: All users
- **Frequency**: 1-2 weeks before release
- **Example**: `0.1.0-rc.1`

#### Stable Releases (0.x.0)

- **Purpose**: Production use
- **Audience**: All users
- **Frequency**: Every 4 weeks (minor), as needed (patch)
- **Example**: `0.1.0`

## Version Management

### Files to Update

When bumping version, update these files:

1. **`package.json`**

   ```json
   {
     "version": "0.1.0"
   }
   ```

2. **`src-tauri/Cargo.toml`**

   ```toml
   [package]
   version = "0.1.0"
   ```

3. **`src-tauri/tauri.conf.json`**

   ```json
   {
     "package": {
       "version": "0.1.0"
     }
   }
   ```

4. **`CHANGELOG.md`**
   ```markdown
   ## [0.1.0] - 2026-06-15
   ```

### Automated Version Bumping

Use `standard-version` for automated version management:

```bash
# Patch release (0.1.0 → 0.1.1)
pnpm release:patch

# Minor release (0.1.0 → 0.2.0)
pnpm release:minor

# Major release (0.1.0 → 1.0.0)
pnpm release:major

# First release
pnpm release -- --first-release

# Prerelease
pnpm release -- --prerelease alpha
```

**What `standard-version` does**:

1. Bumps version in all files
2. Updates CHANGELOG.md from commits
3. Creates a git commit
4. Creates a git tag
5. Pushes to remote (if configured)

## Release Process

### 1. Prepare Release

```bash
# Ensure on develop branch
git checkout develop
git pull origin develop

# Run tests
pnpm test
cd src-tauri && cargo test

# Check for uncommitted changes
git status
```

### 2. Create Release Branch

```bash
# Create release branch
git checkout -b release/v0.1.0

# Bump version
pnpm release:minor  # or :patch or :major

# Review changes
git log -1
git diff HEAD~1
```

### 3. Update Documentation

```bash
# Update CHANGELOG.md manually if needed
# Ensure all features documented
# Add migration guide if breaking changes
```

### 4. Test Release

```bash
# Build for all platforms
pnpm tauri:build

# Run full test suite
pnpm test:ci
pnpm e2e

# Manual testing checklist
# - Test on macOS
# - Test on Linux
# - Test on Windows
```

### 5. Create Pull Request

```bash
# Push release branch
git push origin release/v0.1.0

# Create PR to main on GitHub
# - Title: "Release v0.1.0"
# - Description: Copy from CHANGELOG.md
# - Reviewers: 2 required
# - Labels: release
```

### 6. Merge and Tag

```bash
# After PR approval and merge
git checkout main
git pull origin main

# Tag should be created by standard-version
# If not, create manually:
git tag -a v0.1.0 -m "Release v0.1.0"
git push origin v0.1.0

# GitHub Actions will build and publish release
```

### 7. Merge Back to Develop

```bash
# Merge main back to develop
git checkout develop
git merge main
git push origin develop
```

### 8. Announce Release

- Update GitHub release notes
- Post to discussions (if public)
- Update documentation site
- Notify users (if applicable)

## Version Constraints

### Dependency Versioning

**Rust (Cargo.toml)**:

```toml
[dependencies]
serde = "1.0"           # ^1.0.0 (compatible)
tokio = "~1.35"         # ~1.35.0 (patch updates only)
tauri = "=1.5.4"        # Exact version
```

**npm (package.json)**:

```json
{
  "dependencies": {
    "svelte": "^4.2.0", // Compatible (4.x.x)
    "@tauri-apps/api": "~1.5.0" // Patch updates (1.5.x)
  }
}
```

### Version Ranges

- `^1.2.3`: Compatible (>=1.2.3 <2.0.0)
- `~1.2.3`: Patch updates (>=1.2.3 <1.3.0)
- `=1.2.3`: Exact version
- `>=1.2.3`: Greater than or equal
- `1.2.x`: Any patch version

## Breaking Changes

### How to Handle

1. **Deprecation First** (if possible):

   ```rust
   #[deprecated(since = "0.5.0", note = "Use new_function instead")]
   pub fn old_function() { }
   ```

2. **Document in CHANGELOG**:

   ```markdown
   ### Changed

   - **BREAKING**: Renamed `old_function` to `new_function` (#123)
   ```

3. **Provide Migration Guide**:

   ```markdown
   ## Migration from 0.4.0 to 0.5.0

   ### API Changes

   - `old_function()` → `new_function()`
   - `OldStruct` → `NewStruct`
   ```

4. **Bump Major Version** (post-1.0.0):
   ```bash
   pnpm release:major
   ```

### Pre-1.0.0 Breaking Changes

During 0.x.x development:

- Breaking changes allowed in minor versions
- Document clearly in CHANGELOG
- Provide migration notes
- Consider deprecation warnings

## Version Comparison

### Precedence Rules

```
1.0.0-alpha < 1.0.0-alpha.1 < 1.0.0-alpha.beta < 1.0.0-beta
< 1.0.0-beta.2 < 1.0.0-beta.11 < 1.0.0-rc.1 < 1.0.0
```

### Examples

```
0.1.0 < 0.2.0 < 0.10.0 < 1.0.0 < 1.1.0 < 2.0.0
0.1.0-alpha.1 < 0.1.0-beta.1 < 0.1.0-rc.1 < 0.1.0
```

## Git Tags

### Tag Format

```bash
# Annotated tags (preferred)
git tag -a v0.1.0 -m "Release v0.1.0"

# Lightweight tags (not recommended)
git tag v0.1.0
```

### Tag Naming

- **Releases**: `v0.1.0`, `v1.0.0`
- **Prereleases**: `v0.1.0-alpha.1`, `v0.1.0-beta.1`
- **No prefix**: Not recommended (harder to distinguish)

### Tag Management

```bash
# List tags
git tag -l

# Show tag details
git show v0.1.0

# Delete local tag
git tag -d v0.1.0

# Delete remote tag
git push origin :refs/tags/v0.1.0

# Push all tags
git push origin --tags

# Push specific tag
git push origin v0.1.0
```

## Continuous Versioning

### Automatic Version from Commits

Using conventional commits, versions can be auto-determined:

**Commit Types → Version Bump**:

- `feat:` → Minor version (0.x.0)
- `fix:` → Patch version (0.0.x)
- `BREAKING CHANGE:` → Major version (x.0.0)
- `docs:`, `style:`, `refactor:`, `perf:`, `test:`, `chore:` → No version bump

**Example**:

```bash
# These commits:
feat(US1): add vault editor
fix(search): resolve crash
feat(US2): add wikilinks

# Result in version bump:
0.1.0 → 0.2.0 (two feat commits)
```

## Version Metadata

### Build Information

Include build metadata in releases:

```json
{
  "version": "0.1.0",
  "build": {
    "date": "2026-05-25T12:00:00Z",
    "commit": "abc123def",
    "branch": "main",
    "platform": "darwin-arm64"
  }
}
```

### Runtime Version Check

```rust
pub const VERSION: &str = env!("CARGO_PKG_VERSION");
pub const BUILD_DATE: &str = env!("BUILD_DATE");
pub const GIT_COMMIT: &str = env!("GIT_COMMIT");

pub fn version_info() -> String {
    format!("Bismuth v{} ({})", VERSION, GIT_COMMIT)
}
```

## Troubleshooting

### Version Mismatch

**Problem**: Different versions in different files

**Solution**:

```bash
# Use standard-version to sync all files
pnpm release -- --dry-run  # Preview changes
pnpm release:patch         # Apply changes
```

### Tag Already Exists

**Problem**: Git tag already exists

**Solution**:

```bash
# Delete and recreate
git tag -d v0.1.0
git push origin :refs/tags/v0.1.0
git tag -a v0.1.0 -m "Release v0.1.0"
git push origin v0.1.0
```

### Failed Release

**Problem**: Release process failed mid-way

**Solution**:

```bash
# Rollback version changes
git reset --hard HEAD~1

# Delete tag if created
git tag -d v0.1.0

# Start over
```

## Best Practices

1. **Always use annotated tags** (`-a` flag)
2. **Never reuse version numbers**
3. **Document breaking changes clearly**
4. **Test before releasing**
5. **Keep CHANGELOG.md updated**
6. **Use conventional commits**
7. **Automate version bumping**
8. **Sync versions across all files**
9. **Tag releases consistently**
10. **Provide migration guides for breaking changes**

## Resources

- [Semantic Versioning 2.0.0](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [standard-version](https://github.com/conventional-changelog/standard-version)
- [Git Tagging](https://git-scm.com/book/en/v2/Git-Basics-Tagging)

---

**Last Updated**: 2026-05-25  
**Maintained By**: @yeabsiraretta
