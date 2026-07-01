# Development Scripts

Automated quality control and helper scripts enforcing Constitution principles (v1.4.0).

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
| `validate-workflows.sh` | Validates workflow/skill files across all three layers | `pnpm validate:workflows` |

The `validate-workflows.sh` script validates:
- `.windsurf/workflows/*.md` — Windsurf slash-command definitions
- `.claude/skills/*/SKILL.md` — Claude/Windsurf skill definitions
- `.specify/extensions/*/commands/*.md` — Extension command definitions

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

## Governed Pipeline Integration

These scripts support the governed workflow pipeline:
- `validate-workflows.sh` ensures all three skill layers are in sync
- `check-file-sizes.sh` enforces the 300-line limit checked by governed-implement
- `committer.sh` uses conventional commit format required by changelog extension

See `docs/development/extension-integration.md` for full governed pipeline docs.
