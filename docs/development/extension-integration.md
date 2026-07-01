---
summary: How Spec Kit extensions and the governed workflow pipeline integrate into Bismuth's AI-assisted development
read_when: Setting up development environment, understanding speckit extensions, configuring AI workflows, running governed workflows
---

# Spec Kit Extension Integration Guide

## Overview

Bismuth uses [Spec Kit](https://speckit.dev) as its specification-driven development engine. Extensions add capabilities to the lifecycle (specify → plan → tasks → implement) and integrate with AI assistants (Windsurf/Cascade, Claude).

The **governed workflow pipeline** extends the basic lifecycle with architecture validation, security review, memory synthesis, and cross-skill quality gates.

## Installed Extensions

| Extension            | Version  | Purpose                                                                      |
| -------------------- | -------- | ---------------------------------------------------------------------------- |
| `git`                | built-in | Branch management, auto-commits at lifecycle boundaries                      |
| `memory-loader`      | 1.0.0    | Loads `.specify/memory/` files (constitution) before every lifecycle command |
| `memory-md`          | latest   | Markdown-based durable memory, synthesis, and capture                        |
| `architecture-guard` | 1.9.0    | Architecture drift detection, governed workflows, cross-skill orchestration  |
| `security-review`    | latest   | Security review at plan, task, branch, and audit levels                      |
| `wireframe`          | latest   | SVG wireframe generation, review, and regression screenshots                 |
| `changelog`          | latest   | Changelog generation and release notes                                       |

## Governed Workflow Pipeline (Preferred)

The governed pipeline integrates ALL extensions and quality skills into a single sequential flow:

```
/speckit.architecture-guard.governed-plan    → plan.md
/speckit.architecture-guard.governed-tasks   → tasks.md
/speckit.architecture-guard.governed-implement → code + review
```

Each governed command automatically handles:

- Memory synthesis (reads `.specify/memory/` + `docs/memory/`)
- Plan/task generation (calls core spec-kit)
- Security review (trust boundaries, authorization)
- Architecture validation (drift detection, constitution compliance)
- Cross-skill quality gates (code-review, ux-review, component-gen, pict-test-designer)
- Memory capture (proposes durable lessons after implementation)

### Cross-Skill Quality Gates

| Phase     | Gate        | Skills Applied                                                                                                                    |
| --------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Plan      | Feasibility | code-review (quality bar), component-gen (UX mapping), pict-test-designer (test boundaries), ux-review (interaction surfaces)     |
| Tasks     | Generation  | pict-test-designer (combinatorial tests), code-review (ownership), component-gen (UI guardrails), ux-review (acceptance criteria) |
| Implement | Coding      | coding-principles, component-gen, agent-rules                                                                                     |
| Implement | Review      | code-review (Fix Quality Bar), ux-review (smell detection)                                                                        |
| Implement | Testing     | pict-test-designer (pairwise coverage)                                                                                            |

## How Extensions Work

### Hook System

Extensions register hooks at lifecycle boundaries in `.specify/extensions.yml`:

```
before_specify → before_plan → before_tasks → before_implement
after_specify  → after_plan  → after_tasks  → after_implement
```

Each hook can be:

- **Mandatory** (`optional: false`): Auto-executes without asking
- **Optional** (`optional: true`): Prompts the user before running

### Current Hook Flow

```
/speckit.specify
  ├─ BEFORE: git.feature (create branch), memory-loader.load
  └─ AFTER:  git.commit, changelog.generate, wireframe.generate (optional)

/speckit.plan
  ├─ BEFORE: git.commit, memory-loader.load, wireframe.review, memory-md.plan-with-memory
  └─ AFTER:  git.commit, architecture-guard.violation-detection, security-review.plan

/speckit.tasks
  ├─ BEFORE: git.commit, memory-loader.load
  └─ AFTER:  git.commit, architecture-guard.refactor-generator, security-review.tasks

/speckit.implement
  ├─ BEFORE: git.commit, memory-loader.load
  └─ AFTER:  git.commit, changelog.release, architecture-guard.architecture-review,
             wireframe.screenshots, memory-md.capture-from-diff, security-review.branch
```

## Three-Layer Skill Architecture

The skill system is mirrored across three locations for full agent compatibility:

| Layer              | Location                                               | Purpose                            |
| ------------------ | ------------------------------------------------------ | ---------------------------------- |
| Agent Config       | `.claude/skills/*/SKILL.md`                            | Claude/Windsurf skill definitions  |
| Windsurf Workflows | `.windsurf/workflows/*.md`                             | Windsurf slash-command definitions |
| Extension Commands | `.specify/extensions/architecture-guard/commands/*.md` | Spec-Kit extension commands        |

Canonical source of truth: `CLAUDE.md` at repo root.

## Windsurf/Cascade Integration

### How It Works

Spec Kit generates `.windsurf/workflows/` files — one per command. These become slash commands in Cascade:

| Slash Command                                     | Action                                        |
| ------------------------------------------------- | --------------------------------------------- |
| `/speckit.architecture-guard.governed-plan`       | Plan with full governance (preferred)         |
| `/speckit.architecture-guard.governed-tasks`      | Tasks with quality gates (preferred)          |
| `/speckit.architecture-guard.governed-implement`  | Implement with review gates (preferred)       |
| `/speckit.specify`                                | Create or update feature spec                 |
| `/speckit.plan`                                   | Generate implementation plan (basic)          |
| `/speckit.tasks`                                  | Generate dependency-ordered task list (basic) |
| `/speckit.implement`                              | Execute all tasks from tasks.md (basic)       |
| `/speckit.clarify`                                | Ask clarification questions about spec        |
| `/speckit.analyze`                                | Cross-artifact consistency check              |
| `/speckit.architecture-guard.architecture-review` | Post-implementation review                    |
| `/speckit.architecture-guard.architecture-verify` | Verification gate                             |
| `/speckit.security-review.*`                      | Security review commands                      |
| `/speckit.memory-md.*`                            | Memory management commands                    |
| `/speckit.wireframe.*`                            | Wireframe generation/review                   |
| `/speckit.git.*`                                  | Git workflow commands                         |

### Rules File

`.windsurf/rules/specify-rules.md` points Cascade to the current feature's plan. Updated automatically by Spec Kit when you switch features.

### Skills (via `.claude/`)

Four quality skills are available in Cascade's skill system:

- **code-review**: Deep code/PR review with Fix Quality Bar
- **ux-review**: 168-principle UX evaluation with smell detection
- **component-gen**: Generate components with UX guardrails baked in
- **pict-test-designer**: Combinatorial test case generation

## Architecture Guard Deep Dive

### Commands

| Command                 | When to Use                                                               |
| ----------------------- | ------------------------------------------------------------------------- |
| `governed-plan`         | **Primary** — Plan with memory + security + architecture + quality skills |
| `governed-tasks`        | **Primary** — Tasks with all constraints + PICT + ownership               |
| `governed-implement`    | **Primary** — Implement with inline review gates                          |
| `init`                  | Set up governance + architecture constitutions                            |
| `violation-detection`   | After planning — scan for drift                                           |
| `refactor-generator`    | After task gen — convert violations to tasks                              |
| `architecture-review`   | After implementation — full review                                        |
| `architecture-verify`   | Verification gate before merge                                            |
| `architecture-apply`    | Apply approved refactors to plan/tasks                                    |
| `architecture-workflow` | Single workflow combining all                                             |

### Typical Usage (Governed Pipeline)

```bash
# Full feature development cycle:
/speckit.specify               # Write the spec
/speckit.architecture-guard.governed-plan      # Plan with all governance
/speckit.architecture-guard.governed-tasks     # Generate quality tasks
/speckit.architecture-guard.governed-implement # Implement with review gates

# Standalone commands (when not using full pipeline):
/speckit.architecture-guard.violation-detection  # Scan plan for drift
/speckit.architecture-guard.architecture-verify  # Verification gate
```

### Governed Workflow Internals

Each governed command follows this pattern:

1. Detect available extensions (memory-md, security-review)
2. Synthesize memory context
3. Execute core spec-kit command (plan/tasks/implement)
4. Run security review
5. Run architecture validation
6. Apply cross-skill quality gates
7. Capture durable memory lessons

## Memory System

### memory-loader

Automatically loads `.specify/memory/constitution.md` before every lifecycle command. Ensures governance context is always available.

### memory-md

Provides durable knowledge management:

- `/speckit.memory-md.plan-with-memory` — Synthesize constraints before planning
- `/speckit.memory-md.capture` — Propose durable lessons after implementation
- `/speckit.memory-md.capture-from-diff` — Capture from git diff
- `/speckit.memory-md.audit` — Check memory quality and freshness

Config: `.specify/extensions/memory-md/config.yml` (markdown-only mode)

## Security Review

| Command                  | When                                  |
| ------------------------ | ------------------------------------- |
| `security-review.plan`   | After plan generation                 |
| `security-review.tasks`  | After task generation                 |
| `security-review.branch` | After implementation (branch changes) |
| `security-review.audit`  | Full-system security audit            |
| `security-review.staged` | Review staged git changes             |

## Extension Catalog

Catalog config at `.specify/extension-catalogs.yml`. Extensions are installed locally in `.specify/extensions/`. The catalog is only needed for `specify extension add`.

## Adding New Extensions

```bash
# From project root:
specify extension add <extension-name>

# Or manually:
# 1. Clone extension to .specify/extensions/<name>/
# 2. Add to .specify/extensions.yml installed list
# 3. Run: specify extension sync
```

After adding, run `specify integration sync windsurf` to regenerate workflow files.

## Key Configuration Files

| File                                           | Purpose                               |
| ---------------------------------------------- | ------------------------------------- |
| `CLAUDE.md`                                    | Root AI config, skill integration map |
| `.specify/extensions.yml`                      | Extension registry + hook definitions |
| `.specify/memory/workflow.md`                  | Memory-first workflow rules           |
| `.specify/memory/constitution.md`              | Governance constitution (v1.4.0)      |
| `.specify/memory/architecture_constitution.md` | Architecture rules (v1.1.0)           |
| `.specify/memory/security_constitution.md`     | Security standards (v1.0.0)           |
| `.specify/workflows/workflow-registry.json`    | Registered workflows                  |
| `.claude/agent-rules.md`                       | AI assistant workflow rules           |
| `.claude/skills/README.md`                     | Skill documentation                   |

## Troubleshooting

- **Catalog fetch fails**: Extensions still work if already in `.specify/extensions/`. Catalog only needed for discovery/install.
- **Hook not firing**: Check `.specify/extensions.yml` — ensure `enabled: true` and extension is in `installed` list.
- **Workflow missing**: Run `specify integration sync windsurf` to regenerate `.windsurf/workflows/`.
- **Memory not loaded**: Ensure `.specify/memory/` directory has files and memory-loader is in `installed` list.
- **Governed workflow not running skills**: Verify `.claude/skills/*/SKILL.md` files exist.
- **Security review skipped**: Ensure `security-review` is in `.specify/extensions.yml` installed list.

---

_Last Updated: 2026-06-13_
