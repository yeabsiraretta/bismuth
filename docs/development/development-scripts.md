# Bismuth Development Scripts

Quick reference for running, building, and testing Bismuth.

---

## Quick Start

### Using the Shell Script (Recommended)

```bash
# Make executable (first time only)
chmod +x bismuth.sh

# Start development
./bismuth.sh dev

# Build everything
./bismuth.sh build:all

# Run all checks
./bismuth.sh check
```

### Using pnpm Scripts

```bash
# Start development
pnpm start

# Build everything
pnpm run build:all

# Run all checks
pnpm run check
```

---

## Development Commands

### Starting Development Server

**Desktop App (Tauri)**:
```bash
./bismuth.sh dev
# or
pnpm start
```

**Web Only (Vite)**:
```bash
./bismuth.sh dev:web
# or
pnpm run start:web
```

---

## Building

### Build Web Assets Only

```bash
./bismuth.sh build
# or
pnpm run build:web
```

### Build Desktop App Only

```bash
./bismuth.sh build:desktop
# or
pnpm run build:desktop
```

### Build Everything (Web + Desktop)

```bash
./bismuth.sh build:all
# or
pnpm run build:all
```

---

## Testing

### Unit Tests

**Watch Mode** (interactive):
```bash
./bismuth.sh test
# or
pnpm test
```

**CI Mode** (run once with coverage):
```bash
./bismuth.sh test:ci
# or
pnpm run test:ci
```

**UI Mode** (visual test runner):
```bash
./bismuth.sh test:ui
# or
pnpm run test:ui
```

### End-to-End Tests

**Run E2E Tests**:
```bash
./bismuth.sh e2e
# or
pnpm run e2e
```

**E2E with UI**:
```bash
./bismuth.sh e2e:ui
# or
pnpm run e2e:ui
```

**Debug E2E**:
```bash
./bismuth.sh e2e:debug
# or
pnpm run e2e:debug
```

---

## Code Quality

### Run All Checks

Runs format check, lint, type-check, and tests:

```bash
./bismuth.sh check
# or
pnpm run check
```

### Auto-Fix Issues

Formats code and fixes linting issues:

```bash
./bismuth.sh fix
# or
pnpm run fix
```

### Verify Build

Runs all checks + builds (simulates pre-commit):

```bash
./bismuth.sh verify
# or
pnpm run verify
```

### Individual Checks

**Linting**:
```bash
./bismuth.sh lint
# or
pnpm run lint
```

**Formatting**:
```bash
./bismuth.sh format
# or
pnpm run format
```

**Type Checking**:
```bash
./bismuth.sh type-check
# or
pnpm run type-check
```

---

## Maintenance

### Setup Project

Install dependencies and setup Git hooks:

```bash
./bismuth.sh setup
# or
pnpm run setup
```

### Clean Build Artifacts

```bash
./bismuth.sh clean
# or
pnpm run clean
```

### Deep Clean

Remove everything and reinstall:

```bash
./bismuth.sh clean:all
# or
pnpm run clean:all
```

---

## Git Workflow

### Interactive Commit

Uses Commitizen for conventional commits:

```bash
./bismuth.sh commit
# or
pnpm run commit
```

---

## Release Management

### Create Release

**Automatic Versioning** (based on commits):
```bash
./bismuth.sh release
# or
pnpm run release
```

**Specific Version Bump**:
```bash
# Patch (0.0.x)
./bismuth.sh release:patch
pnpm run release:patch

# Minor (0.x.0)
./bismuth.sh release:minor
pnpm run release:minor

# Major (x.0.0)
./bismuth.sh release:major
pnpm run release:major
```

**Pre-release Versions**:
```bash
# Alpha
pnpm run release:alpha

# Beta
pnpm run release:beta

# Release Candidate
pnpm run release:rc
```

**Dry Run** (preview without committing):
```bash
pnpm run release:dry
```

---

## Complete Workflow Examples

### Daily Development

```bash
# 1. Start development server
./bismuth.sh dev

# 2. Make changes...

# 3. Run checks before committing
./bismuth.sh check

# 4. Fix any issues
./bismuth.sh fix

# 5. Commit with conventional format
./bismuth.sh commit
```

### Pre-Release Checklist

```bash
# 1. Run all checks
./bismuth.sh check

# 2. Build everything
./bismuth.sh build:all

# 3. Run E2E tests
./bismuth.sh e2e

# 4. Create release
./bismuth.sh release
```

### Fresh Start

```bash
# Clean everything and reinstall
./bismuth.sh clean:all

# Verify setup
./bismuth.sh check
```

---

## Script Help

### View All Commands

```bash
./bismuth.sh help
```

### Script Features

The `bismuth.sh` script provides:

- ✅ **Colored output** for better readability
- ✅ **Error handling** with helpful messages
- ✅ **Dependency checks** (verifies pnpm is installed)
- ✅ **Progress indicators** for multi-step operations
- ✅ **Success/failure feedback** for each operation

---

## Troubleshooting

### pnpm Not Found

Install pnpm globally:

```bash
npm install -g pnpm
```

### Permission Denied

Make script executable:

```bash
chmod +x bismuth.sh
```

### Build Failures

Try a clean rebuild:

```bash
./bismuth.sh clean:all
./bismuth.sh check
```

### Git Hooks Not Working

Reinstall hooks:

```bash
pnpm run prepare
```

---

## Environment Requirements

- **Node.js**: ≥20.0.0
- **pnpm**: ≥8.0.0
- **Rust**: Latest stable (for Tauri)
- **OS**: macOS, Linux, or Windows

---

## Additional Resources

- **[Feature Development Guide](./FEATURE_DEVELOPMENT_GUIDE.md)** - How to implement features
- **[Git Workflow](../processes/GIT_WORKFLOW.md)** - Branching and commit strategy
- **[Naming Conventions](../standards/naming-conventions.md)** - File naming standards

---

**Last Updated**: 2026-05-26  
**Maintainer**: Yeabsira Moges
