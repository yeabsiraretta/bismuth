# Contributing to Bismuth

Thank you for your interest in contributing to Bismuth! This document provides guidelines and workflows for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Branch Strategy](#branch-strategy)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Maintain professional communication

## Getting Started

### Prerequisites

- **Rust**: 1.95+ (`rustup install stable`)
- **Node.js**: 20+ (`nvm install 20`)
- **pnpm**: 9+ (`corepack enable && corepack prepare pnpm@9 --activate`)
- **Git**: 2.40+

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/yeabsiraretta/bismuth.git
cd bismuth

# Install dependencies
pnpm install

# Install Rust dependencies
cd src-tauri && cargo build

# Set up Git hooks
pnpm prepare
```

## Development Workflow

### 1. Create a Feature Branch

```bash
# Always branch from develop
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/US1-vault-editor
```

### 2. Make Changes

- Write code following our [coding standards](#coding-standards)
- Add tests for new functionality
- Update documentation as needed

### 3. Commit Changes

```bash
# Stage changes
git add .

# Commit (triggers pre-commit hooks)
git commit -m "feat(US1): implement vault editor with CodeMirror 6"
```

### 4. Push and Create PR

```bash
# Push to remote
git push origin feature/US1-vault-editor

# Create PR on GitHub targeting 'develop' branch
```

## Branch Strategy

We follow **Git Flow** with branch protection:

### Branch Types

#### `main`

- **Protected**: ✅ Yes
- **Purpose**: Production-ready code
- **Merges from**: `develop` (via release branches)
- **Direct commits**: ❌ Forbidden
- **Required reviews**: 2
- **Status checks**: All CI must pass

#### `develop`

- **Protected**: ✅ Yes
- **Purpose**: Integration branch for features
- **Merges from**: `feature/*`, `bugfix/*`
- **Direct commits**: ❌ Forbidden
- **Required reviews**: 1
- **Status checks**: All CI must pass

#### `feature/*`

- **Protected**: ❌ No
- **Purpose**: New features (e.g., `feature/US1-vault-editor`)
- **Branches from**: `develop`
- **Merges to**: `develop`
- **Naming**: `feature/<user-story>-<short-description>`

#### `bugfix/*`

- **Protected**: ❌ No
- **Purpose**: Bug fixes
- **Branches from**: `develop`
- **Merges to**: `develop`
- **Naming**: `bugfix/<issue-number>-<short-description>`

#### `hotfix/*`

- **Protected**: ❌ No
- **Purpose**: Critical production fixes
- **Branches from**: `main`
- **Merges to**: `main` AND `develop`
- **Naming**: `hotfix/<version>-<description>`

#### `release/*`

- **Protected**: ✅ Yes
- **Purpose**: Release preparation
- **Branches from**: `develop`
- **Merges to**: `main` AND `develop`
- **Naming**: `release/v<version>`

### Branch Lifecycle

```text
develop ──┬─→ feature/US1 ──→ develop
          ├─→ feature/US2 ──→ develop
          └─→ release/v0.1.0 ──→ main ──→ v0.1.0 tag
                                    └──→ develop

main ──→ hotfix/v0.1.1 ──→ main ──→ v0.1.1 tag
                           └──→ develop
```

## Commit Guidelines

We use **Conventional Commits** enforced by `commitlint`.

### Format

```text
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature (e.g., `feat(US1): add vault editor`)
- `fix`: Bug fix (e.g., `fix(search): resolve indexing crash`)
- `docs`: Documentation only
- `style`: Code style (formatting, no logic change)
- `refactor`: Code refactoring (no feature change)
- `perf`: Performance improvement
- `test`: Adding or updating tests
- `build`: Build system changes
- `ci`: CI configuration changes
- `chore`: Other changes (dependencies, etc.)

### Scope

Use user story IDs or component names:

- `US1`, `US2`, `US15` (user stories)
- `vault`, `editor`, `search`, `graph` (components)
- `deps`, `config`, `docs` (infrastructure)

### Examples

```bash
# Good commits
git commit -m "feat(US1): implement CodeMirror 6 integration"
git commit -m "fix(search): prevent index corruption on concurrent writes"
git commit -m "docs(US15): add Navigator keyboard shortcuts to README"
git commit -m "test(vault): add integration tests for crash recovery"

# Bad commits (will be rejected)
git commit -m "fixed stuff"
git commit -m "WIP"
git commit -m "Update file.ts"
```

### Multi-line Commits

```bash
git commit -m "feat(US2): implement graph view with Konva.js

- Add force-directed layout algorithm
- Implement node filtering by tag and type
- Add pan/zoom controls
- Optimize rendering for 10k+ nodes

Closes #42"
```

## Pull Request Process

### 1. PR Title

Follow commit message format:

```text
feat(US1): implement vault editor
```

### 2. PR Description Template

```markdown
## Description
Brief description of changes

## Related Issues
Closes #42

## Type of Change
- [ ] Bug fix
- [x] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [x] Unit tests pass
- [x] E2E tests pass
- [x] Manual testing completed

## Checklist
- [x] Code follows style guidelines
- [x] Self-review completed
- [x] Comments added for complex logic
- [x] Documentation updated
- [x] No new warnings generated
- [x] Tests added for new functionality
```

### 3. Review Process

- **Automated checks**: All CI must pass
- **Code review**: At least 1 approval required for `develop`, 2 for `main`
- **Review focus**:
  - Code quality and readability
  - Test coverage
  - Performance implications
  - Security considerations
  - Documentation completeness

### 4. Merge Strategy

- **Squash and merge**: For feature branches → develop
- **Merge commit**: For release branches → main
- **Delete branch**: After merge

## Coding Standards

### Rust

```rust
// Use explicit types for public APIs
pub fn create_vault(path: PathBuf) -> Result<Vault, BismuthError> {
    // Implementation
}

// Document public functions
/// Creates a new vault at the specified path.
///
/// # Arguments
/// * `path` - The filesystem path for the vault root
///
/// # Errors
/// Returns `BismuthError::InvalidPath` if path is outside vault root
pub fn create_vault(path: PathBuf) -> Result<Vault, BismuthError> {
    // Implementation
}

// Use descriptive variable names
let vault_root = PathBuf::from("/path/to/vault");
let note_content = fs::read_to_string(&note_path)?;

// Prefer early returns
pub fn validate_path(path: &Path) -> Result<()> {
    if !path.exists() {
        return Err(BismuthError::NotFound("Path does not exist".into()));
    }
    if !path.is_dir() {
        return Err(BismuthError::InvalidPath("Path is not a directory".into()));
    }
    Ok(())
}
```

### TypeScript/Svelte

```typescript
// Use TypeScript for type safety
interface Note {
  path: string;
  title: string;
  content: string;
  frontmatter: Record<string, unknown>;
}

// Document complex functions
/**
 * Opens a note in the editor
 * @param path - Absolute path to the note file
 * @returns Promise resolving to the note content
 */
async function openNote(path: string): Promise<Note> {
  return invoke('get_note', { path });
}

// Use async/await over promises
async function saveNote(path: string, content: string): Promise<void> {
  await invoke('write_note', { path, content });
  toast.success('Note saved');
}
```

### File Organization

```text
src-tauri/
├── src/
│   ├── main.rs              # Entry point
│   ├── error.rs             # Error types
│   ├── config.rs            # Configuration
│   ├── models/              # Data models
│   │   ├── mod.rs
│   │   ├── note.rs
│   │   └── vault.rs
│   ├── services/            # Business logic
│   │   ├── mod.rs
│   │   ├── vault_service.rs
│   │   └── index_service.rs
│   ├── commands/            # Tauri IPC commands
│   │   ├── mod.rs
│   │   ├── vault.rs
│   │   └── search.rs
│   └── utils/               # Utilities
│       └── path.rs

src/
├── lib/
│   ├── components/          # Svelte components
│   │   ├── ui/             # Base UI components
│   │   ├── editor/         # Editor components
│   │   └── sidebar/        # Sidebar components
│   ├── stores/             # Svelte stores
│   ├── services/           # Frontend services
│   ├── types/              # TypeScript types
│   └── styles/             # Global styles
└── App.svelte              # Root component
```

## Testing Requirements

### Unit Tests

**Rust**: Minimum 80% coverage

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_vault_creation() {
        let temp_dir = tempdir().unwrap();
        let vault = VaultService::create(temp_dir.path()).unwrap();
        assert_eq!(vault.root_path, temp_dir.path());
    }
}
```

**TypeScript**: Minimum 80% coverage

```typescript
import { describe, it, expect } from 'vitest';

describe('VaultStore', () => {
  it('should update active note path', () => {
    const store = createVaultStore();
    store.setActiveNote('/path/to/note.md');
    expect(get(store).activeNotePath).toBe('/path/to/note.md');
  });
});
```

### Integration Tests

Test cross-component interactions:

```rust
#[tokio::test]
async fn test_note_save_and_index() {
    let vault = setup_test_vault().await;
    let note = Note::new("test.md", "# Test");
    
    vault.write_note(&note).await.unwrap();
    let results = vault.search("Test").await.unwrap();
    
    assert_eq!(results.len(), 1);
}
```

### E2E Tests

Use Playwright for critical user flows:

```typescript
test('create and edit note', async ({ page }) => {
  await page.goto('http://localhost:1420');
  await page.click('text=Create Note');
  await page.fill('[data-testid="note-title"]', 'My Note');
  await page.fill('[data-testid="editor"]', '# Hello World');
  await page.click('text=Save');
  
  await expect(page.locator('text=Saved')).toBeVisible();
});
```

### Test Coverage Requirements

- **New features**: 100% coverage required
- **Bug fixes**: Test case reproducing the bug required
- **Refactoring**: Existing tests must pass

## Performance Guidelines

- **Editor latency**: <16ms input response
- **Search**: <200ms for 50k documents
- **Graph rendering**: <3s for 10k nodes
- **Startup time**: <3s cold start

## Security Guidelines

- Never commit secrets or API keys
- Validate all user input
- Sanitize file paths (prevent traversal)
- Use parameterized queries for SQL
- Keep dependencies updated

## Documentation

Update documentation for:

- New features → `spec.md`, `README.md`
- API changes → Inline docs + `docs/api.md`
- Breaking changes → `CHANGELOG.md`

## Questions?

- Open a discussion on GitHub
- Check existing issues and PRs
- Review the spec documents in `specs/`

---

**Thank you for contributing to Bismuth!** 🚀
