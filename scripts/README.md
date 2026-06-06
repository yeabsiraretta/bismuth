# Development Scripts

Automated quality control and helper scripts enforcing Constitution principles.

```
scripts/
├── quality/          # Validation & linting
│   ├── check-file-sizes.sh
│   ├── validate-file-sizes.sh
│   └── validate-workflows.sh
├── git/              # Git workflow helpers
│   ├── committer.sh
│   └── setup-git.sh
├── build/            # Build, versioning & docs tooling
│   ├── cargo-version-updater.js
│   ├── version-bump.js
│   └── docs-list.ts
└── README.md
```

## quality/

| Script | Purpose | Usage |
|--------|---------|-------|
| `check-file-sizes.sh` | Enforces 300-line file limit (Constitution Principle VI) | `pnpm check:file-sizes` |
| `validate-file-sizes.sh` | Alternative file-size validator | `bash scripts/quality/validate-file-sizes.sh` |
| `validate-workflows.sh` | Validates `.specify/workflows/` YAML frontmatter | `pnpm validate:workflows` |

## git/

| Script | Purpose | Usage |
|--------|---------|-------|
| `committer.sh` | Safe commit helper — stages only specified files | `./scripts/git/committer.sh "msg" file.ts` |
| `setup-git.sh` | Initialize git hooks and config | `bash scripts/git/setup-git.sh` |

## build/

| Script | Purpose | Usage |
|--------|---------|-------|
| `cargo-version-updater.js` | Sync Cargo.toml version with package.json | `node scripts/build/cargo-version-updater.js` |
| `version-bump.js` | Bump version across the monorepo | `node scripts/build/version-bump.js` |
| `docs-list.ts` | List docs/ markdown files with metadata | `pnpm docs:list` |
