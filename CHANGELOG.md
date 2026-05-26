# Changelog

All notable changes to Bismuth will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Production-grade Git workflow with branch protection policies
- Comprehensive CI/CD pipelines for multi-platform testing (Linux, macOS, Windows)
- Pre-commit hooks with Husky for automated quality checks
- Conventional commits enforcement with commitlint
- Automated dependency updates with Dependabot
- CodeQL security scanning for vulnerability detection
- Code coverage tracking with Codecov
- Comprehensive contributing guidelines (CONTRIBUTING.md)
- Detailed Git workflow documentation (docs/GIT_WORKFLOW.md)
- Automated setup script (scripts/setup-git.sh)
- PR and issue templates for structured collaboration
- CODEOWNERS file for automatic reviewer assignment
- EditorConfig for consistent coding styles across editors
- Lint-staged configuration for efficient pre-commit checks
- E2E testing setup with Playwright
- Multi-platform release automation

### Changed
- N/A

### Deprecated
- N/A

### Removed
- N/A

### Fixed
- N/A

### Security
- Enabled secret scanning and push protection
- Implemented signed commits requirement for protected branches
- Added automated security audits (cargo audit, npm audit)
- Configured CodeQL for weekly security scans

---

## Development Roadmap (Pre-1.0.0)

Following semantic versioning for 0.x.x releases:
- **0.x.0**: Minor version - New features, may have breaking changes
- **0.x.y**: Patch version - Bug fixes and minor improvements
- **1.0.0**: First stable release - API stability guaranteed

### Planned Releases

#### [0.1.0] - Target: Week 14 (MVP Release)
**Focus**: Core vault and editor functionality

**Planned Features**:
- Vault creation and management (US1)
- CodeMirror 6 editor integration with <16ms latency
- Markdown syntax highlighting and editing
- Wikilink support with click-to-navigate
- Auto-save with 500ms debounce
- Crash recovery system
- Split-pane editing (horizontal/vertical)
- Edit history with version restore
- File size and nesting depth warnings
- Notebook Navigator (US15) with keyboard-first navigation
- File operations (create, rename, delete, move)
- Vault profiles and pinning
- Color/icon assignment for files
- Drag-and-drop file organization

**Technical Stack**:
- Tauri 1.5+ (Rust backend)
- Svelte 4.2+ (Frontend framework)
- CodeMirror 6 (Editor)
- SQLite (Local database)
- Tantivy (Full-text search)

#### [0.2.0] - Target: Week 18
**Focus**: Wikilinks and graph visualization

**Planned Features**:
- Bidirectional wikilinks (US2)
- Backlinks panel with context preview
- Unlinked mentions detection
- Wikilink autocomplete
- Graph view with Konva.js (US8)
- Force-directed layout algorithm
- Node filtering by tag, type, folder
- Pan/zoom controls
- Graph export (PNG, SVG, JSON)

#### [0.3.0] - Target: Week 22
**Focus**: Search and indexing

**Planned Features**:
- Full-text search with Tantivy (US7)
- BM25 ranking algorithm
- Fuzzy search support
- Search filters (tag, folder, date, type)
- Search history and saved searches
- Real-time indexing with file watching
- Search performance <200ms for 50k documents

#### [0.4.0] - Target: Week 26
**Focus**: Lifecycle management and organization

**Planned Features**:
- Lifecycle Dashboard (US11)
- Inbox for quick capture
- Auto-categorization suggestions
- Orphan note detection
- Stale note identification
- Archive workflow
- Bulk operations (tag, move, delete)

#### [0.5.0] - Target: Week 30
**Focus**: Tags and metadata

**Planned Features**:
- Hierarchical tag system (US3)
- Nested tags with inheritance
- Tag autocomplete
- Tag renaming with propagation
- Tag-based filtering and search
- Tag cloud visualization
- Frontmatter YAML support (US4)
- Custom metadata fields
- Metadata templates

#### [0.6.0] - Target: Week 34
**Focus**: Advanced features and polish

**Planned Features**:
- Command palette (US5)
- Keyboard shortcuts
- Quick switcher
- Recent files
- Theme system with Obsidian compatibility
- Export functionality (Markdown, PDF, HTML)
- Import from Obsidian/Notion
- Performance optimizations

#### [1.0.0] - Target: TBD
**Focus**: Stable release with API guarantees

**Requirements for 1.0.0**:
- All MVP features stable and tested
- Comprehensive documentation
- Migration guides
- API stability guarantees
- Performance benchmarks met
- Security audit completed
- User feedback incorporated
- Breaking changes finalized

---

## Version History

### [0.0.1] - 2026-05-25

#### Added
- Initial project structure with Tauri + Svelte + Rust
- Git repository initialization
- Branch protection policies documentation
- CI/CD pipeline configuration
- Pre-commit hooks setup
- Conventional commits enforcement
- Contributing guidelines
- Code quality tooling (ESLint, Prettier, Clippy, Rustfmt)
- Security scanning setup (CodeQL, Dependabot)
- Automated testing framework
- Documentation structure

#### Infrastructure
- GitHub Actions workflows for CI/CD
- Husky for Git hooks
- Commitlint for commit message validation
- Lint-staged for efficient pre-commit checks
- Playwright for E2E testing
- Vitest for unit testing
- EditorConfig for coding style consistency

---

## How to Update This Changelog

### When to Update

**On every PR merge**:
1. Add changes to `[Unreleased]` section
2. Use appropriate category (Added, Changed, Fixed, etc.)
3. Include PR number: `- Feature description (#123)`

**On release**:
1. Move `[Unreleased]` changes to new version section
2. Add release date: `## [0.1.0] - 2026-06-15`
3. Update version links at bottom
4. Create new empty `[Unreleased]` section

### Categories

- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Now removed features
- **Fixed**: Bug fixes
- **Security**: Vulnerability fixes

### Format Rules

```markdown
## [Version] - YYYY-MM-DD

### Added
- Feature description with context (#PR-number)
- Another feature (#PR-number)

### Fixed
- Bug fix with impact description (#PR-number)

### Security
- Security fix with CVE if applicable (#PR-number)
```

### Examples

**Good entries**:
```markdown
### Added
- Vault editor with CodeMirror 6 integration, <16ms input latency (#42)
- Wikilink support with click-to-navigate and autocomplete (#45)
- Auto-save with 500ms debounce, shows save indicator (#47)

### Fixed
- Crash recovery now properly restores unsaved changes on app restart (#50)
- Path traversal vulnerability in vault operations, validates all paths (#52)

### Security
- Updated rusqlite to 0.31.1 to fix SQL injection (CVE-2024-1234) (#53)
```

**Bad entries**:
```markdown
### Added
- Added stuff
- Fixed things
- Updated dependencies
```

### Semantic Versioning Guide

**Given a version number MAJOR.MINOR.PATCH (e.g., 1.2.3)**:

1. **MAJOR** (1.x.x): Incompatible API changes
   - Breaking changes to public API
   - Removal of deprecated features
   - Major architectural changes
   - Example: `0.9.0 → 1.0.0`

2. **MINOR** (x.2.x): New features, backward compatible
   - New functionality added
   - New user stories implemented
   - Non-breaking API additions
   - Example: `0.1.0 → 0.2.0`

3. **PATCH** (x.x.3): Bug fixes, backward compatible
   - Bug fixes
   - Performance improvements
   - Documentation updates
   - Security patches
   - Example: `0.1.0 → 0.1.1`

**Pre-1.0.0 versions (0.x.x)**:
- Anything may change at any time
- Minor version (0.x.0) may include breaking changes
- Patch version (0.x.y) should be backward compatible
- Public API should not be considered stable

**Post-1.0.0 versions**:
- Public API is stable
- Breaking changes require major version bump
- Deprecation warnings before removal
- Migration guides for breaking changes

### Release Checklist

Before creating a release:

- [ ] All planned features merged to `develop`
- [ ] All tests passing on `develop`
- [ ] Update CHANGELOG.md with version and date
- [ ] Update version in `Cargo.toml`
- [ ] Update version in `package.json`
- [ ] Update version in `src-tauri/tauri.conf.json`
- [ ] Create release branch: `release/vX.Y.Z`
- [ ] Run full test suite on all platforms
- [ ] Create PR to `main` with 2 reviewers
- [ ] After merge, tag release: `git tag -a vX.Y.Z -m "Release vX.Y.Z"`
- [ ] Push tag: `git push origin vX.Y.Z`
- [ ] GitHub Actions builds and publishes release
- [ ] Merge `main` back to `develop`
- [ ] Announce release (if public)

---

## Links

- [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
- [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Releases](https://github.com/yeabsiraretta/bismuth/releases)

---

[Unreleased]: https://github.com/yeabsiraretta/bismuth/compare/v0.0.1...HEAD
[0.0.1]: https://github.com/yeabsiraretta/bismuth/releases/tag/v0.0.1
