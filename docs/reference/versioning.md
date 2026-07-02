# Versioning Strategy

Bismuth uses **automated semantic versioning** tied to git operations.

## Version Format: X.Y.Z

- **X (Major)**: Breaking changes, major releases
- **Y (Minor)**: New features, pushes to remote
- **Z (Patch)**: Bug fixes, every commit

## Automatic Bumping

### On Commit (Patch)

Every commit automatically increments the **patch** version:

```
0.0.1 → 0.0.2 → 0.0.3
```

**Triggered by**: `post-commit` git hook  
**Updates**: `package.json`, `Cargo.toml`

### On Push (Minor)

Every push to remote increments the **minor** version and resets patch:

```
0.0.5 → 0.1.0
```

**Triggered by**: `pre-push` git hook  
**Updates**: `package.json`, `Cargo.toml`, `CHANGELOG.md`

### On Release (Major)

Manual major version bump for releases:

```bash
pnpm run version:release
```

```
0.5.0 → 1.0.0
```

**Triggered by**: Manual command  
**Updates**: `package.json`, `Cargo.toml`, `CHANGELOG.md`

## Manual Version Control

You can also manually bump versions:

```bash
# Bump patch (0.0.1 → 0.0.2)
pnpm run version:commit

# Bump minor (0.0.2 → 0.1.0)
pnpm run version:push

# Bump major (0.1.0 → 1.0.0)
pnpm run version:release
```

## Files Synchronized

The version number is kept in sync across:

1. **`package.json`** - Frontend version
2. **`src-tauri/Cargo.toml`** - Rust backend version
3. **`CHANGELOG.md`** - Version history (on push/release)

## CHANGELOG Format

The CHANGELOG follows [Keep a Changelog](https://keepachangelog.com/) format:

```markdown
## [Unreleased]

### Added

- New features go here

## [0.2.0] - 2026-05-26

### Added

- Feature X
- Feature Y

## [0.1.0] - 2026-05-25

### Added

- Initial release
```

## Workflow Example

```bash
# 1. Make changes
git add .
git commit -m "feat: add new feature"
# → Version bumps to 0.0.2 automatically

# 2. More commits
git commit -m "fix: bug fix"
# → Version bumps to 0.0.3

git commit -m "docs: update README"
# → Version bumps to 0.0.4

# 3. Push to remote
git push origin main
# → Version bumps to 0.1.0
# → CHANGELOG updated with [0.1.0] entry

# 4. Ready for release
pnpm run version:release
git add .
git commit -m "chore: release v1.0.0"
git tag v1.0.0
git push origin main --tags
# → Version bumps to 1.0.0
```

## Disabling Auto-Versioning

To temporarily disable auto-versioning:

```bash
# Commit without version bump
git commit --no-verify -m "your message"

# Push without version bump
git push --no-verify
```

## Implementation Details

- **Script**: `scripts/version-bump.js`
- **Hooks**: `.husky/post-commit`, `.husky/pre-push`
- **Package scripts**: `version:commit`, `version:push`, `version:release`

## Benefits

✅ **Consistent**: Version always reflects development state  
✅ **Automatic**: No manual version management needed  
✅ **Traceable**: Every commit has a unique version  
✅ **Synchronized**: Frontend and backend versions match  
✅ **Documented**: CHANGELOG auto-updates on push/release
