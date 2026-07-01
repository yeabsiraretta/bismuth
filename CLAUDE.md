# Bismuth AI Agent Configuration

## Project

**Bismuth** — Personal Knowledge Management editor built with Tauri (Rust) + Svelte + TypeScript + CodeMirror 6.

**AI/ML policy**: All AI features use open-source, locally-run implementations (Ollama, Tesseract, TrOCR ONNX, Demucs, ffmpeg.wasm) by default. Cloud APIs (Claude, OpenAI, etc.) are always opt-in — user supplies their own key via keychain. No paid API is ever required for core functionality.

**Active expansion specs** (spec 038 roadmap — each requires its own governed-plan before implementation):
- `specs/039-music-production/` — DAW canvas mode, Web Audio API, Demucs stem splitter
- `specs/040-llm-agent-access/` — Local/cloud LLM agents, REST API (extends SearchServer), all AI off by default
- `specs/041-calendar-enhancements/` — Day view, event types, colors, recurring events
- `specs/042-spreadsheets/` — CSV/JSON, formula engine (HyperFormula), charting, canvas frame
- `specs/043-slides/` — Presentation mode (extends spec 004 FlowPreview), speaker notes, export
- `specs/044-gym-tracking/` — Workout log, volume, calories, SQLite storage
- `specs/045-release-channels/` — Alpha/Beta/Release CI pipeline, Tauri updater
- `specs/046-roadmap-management/` — Feature roadmap canvas template, spec integration
- `specs/047-media-editing/` — Photo/video editing, non-destructive, ffmpeg.wasm
- `specs/048-pokemon-calculator/` — Damage calculator, team builder, Gen 9, Showdown import
- `specs/049-integration-docs/` — TSDoc, rustdoc, extension guide, tutorials
- `specs/050-nas-access/` — WebDAV, SMB, NFS, offline cache, keychain credentials
- `specs/051-knowledge-versioning/` — Semver frontmatter, deterministic complexity metric, diff storage
- `specs/038-ocr-handwriting/` — OCR pipeline, Amharic support, LLM correction (research in spec 038)

## Canonical Sources

- **Constitution**: `.specify/memory/constitution.md` (v1.4.0)
- **Architecture**: `.specify/memory/architecture_constitution.md` (v1.1.0)
- **Security**: `.specify/memory/security_constitution.md` (v1.0.0)
- **Extensions**: `.specify/extensions.yml` (installed: architecture-guard, memory-md, security-review, wireframe, changelog, git, memory-loader)

## Governed Workflow Pipeline

The three governed workflows form a sequential pipeline. Always follow this order:

```
/speckit.architecture-guard.governed-plan    → produces plan.md
/speckit.architecture-guard.governed-tasks   → produces tasks.md
/speckit.architecture-guard.governed-implement → executes tasks, reviews output
```

Each governed workflow integrates ALL quality skills automatically:
- **code-review**: Applied during governed-implement (Step 5 architecture review)
- **ux-review**: Applied when tasks involve UI components
- **component-gen**: Applied when implementing UI tasks (follows .claude/component-guide.md)
- **pict-test-designer**: Applied when generating test tasks or writing test implementations

## Key Rules

1. **300-line file limit** (Constitution Principle VI) — enforced, no exceptions
2. **Max 8 files per directory** before mandatory subfolder split
3. **Unified logger only** — never raw console.log (TS) or println! (Rust)
4. **No emojis** in code, commits, or responses
5. **Memory-first**: Always read `.specify/memory/` constitutions before coding
6. **Tests required**: 90%+ coverage, run tests before declaring work complete

## Tech Stack

- Frontend: Svelte 4.2+ / TypeScript / TailwindCSS / CodeMirror 6
- Backend: Rust / Tauri / SQLite / Tantivy
- Testing: Vitest (frontend), cargo test (backend), Playwright (e2e)

## Skill Integration Map

| Governed Step | Skills Activated |
|---|---|
| Plan: Architecture Validation | violation-detection, security-review.plan |
| Tasks: Generation | pict-test-designer (for test tasks), security-review.tasks |
| Tasks: Refactor Generation | refactor-generator, code-review (quality bar) |
| Implement: Coding | component-gen (UI tasks), coding-principles |
| Implement: Review | code-review, ux-review (UI changes), architecture-review |
| Implement: Memory Capture | memory-md.capture |

## Three-Layer Integration

The skill system is mirrored across three locations for full agent compatibility:

| Layer | Location | Purpose |
|-------|----------|---------|
| Agent Config | `.claude/skills/*/SKILL.md` | Claude/Windsurf skill definitions |
| Windsurf Workflows | `.windsurf/workflows/*.md` | Windsurf slash-command definitions |
| Extension Commands | `.specify/extensions/architecture-guard/commands/*.md` | Spec-Kit extension commands |

All three layers contain identical cross-skill integration sections. The canonical source of truth for the skill integration map is this file (`CLAUDE.md`).

## Feature Module Convention

New features with artifacts in 2+ layer directories MUST use the feature module pattern:

```
src/lib/features/<name>/
  index.ts          # Public API barrel (the ONLY import path for external consumers)
  stores/           # Feature-scoped reactive state
  services/         # IPC wrappers
  components/       # Svelte UI components
  types/            # Feature-specific interfaces
  __tests__/        # Co-located tests
```

Rules:
- Import from other features via barrel ONLY: `import { x } from '@/features/<name>'`
- Never import internal paths: `@/features/<name>/stores/...` is PROHIBITED externally
- Core layer (vault, layout, settings, theme, editor, canvas, ui) stays in top-level directories
- See `architecture_constitution.md` section "Feature Modules" for full rules

## File Layout

```
.claude/                    # Agent configuration
  agent-rules.md            # Workflow rules, commit standards
  coding-principles.md      # Language-specific coding standards
  component-guide.md        # UX requirements per component type
  ux-evaluator.md           # 168-principle evaluation framework
  skills/                   # Skill definitions (SKILL.md per skill)
.specify/                   # Spec-Kit governance
  memory/                   # Constitutions + workflow.md (architecture, security, governance)
  extensions/               # Installed extensions (architecture-guard, memory-md, etc.)
  extensions.yml            # Extension registry + hooks
  workflows/                # Workflow registry (governed-pipeline registered)
.windsurf/workflows/        # Workflow definitions (Windsurf format)
specs/<NNN-feature>/        # Feature specs, plans, tasks
src/lib/features/           # Feature modules (spec 026)
```
