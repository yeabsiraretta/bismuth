# Development Scripts

Automated quality control and helper scripts enforcing Constitution principles.

## Quality Control

### check-file-sizes.sh

**Purpose**: Enforces 300-line file limit (Constitution Principle VI)

**Usage**:
```bash
pnpm check:file-sizes
bash scripts/check-file-sizes.sh
```

**Checks**: All `.ts`, `.js`, `.svelte`, `.rs` files (excludes node_modules, dist, build artifacts)

**Integration**: Pre-commit hook, CI/CD, `pnpm check`

**On Failure**: Split files into focused modules. See Constitution Principle VI.

### validate-workflows.sh

**Purpose**: Validates Windsurf workflow files in `.specify/workflows/`

**Usage**:
```bash
pnpm validate:workflows
bash scripts/validate-workflows.sh
```

**Checks**: YAML frontmatter, required `description` field

**Integration**: `pnpm check`

## Documentation

### docs-list.ts

**Purpose**: List all markdown files in `docs/` with frontmatter metadata

**Usage**:
```bash
pnpm docs:list
tsx scripts/docs-list.ts
```

**Output**: File paths with summaries and "read when" hints

**Use case**: Discover relevant docs before coding

## Git Helpers

### committer.sh

**Purpose**: Safe commit helper - stages specific files, enforces non-empty message

**Usage**:
```bash
./scripts/committer.sh "commit message" file1.ts file2.svelte
./scripts/committer.sh --force "message" file.ts  # Remove stale lock if needed
```

**Safety**:
- Stages only specified files (prevents accidental `git add .`)
- Validates commit message is non-empty
- Prevents staging "." (entire repo)
- Supports `--force` to remove stale git locks

**Integration**: Can be used by AI assistants for safe commits
