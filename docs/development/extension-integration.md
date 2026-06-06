---
summary: How Spec Kit extensions integrate into Bismuth's AI-assisted development workflows
read_when: Setting up development environment, understanding speckit extensions, configuring AI workflows
---

# Spec Kit Extension Integration Guide

## Overview

Bismuth uses [Spec Kit](https://speckit.dev) as its specification-driven development engine. Extensions add capabilities to the lifecycle (specify → plan → tasks → implement) and integrate with AI assistants (Windsurf/Cascade, Devin, Claude).

## Installed Extensions

| Extension | Version | Purpose |
|-----------|---------|---------|
| `git` | built-in | Branch management, auto-commits at lifecycle boundaries |
| `memory-loader` | 1.0.0 | Loads `.specify/memory/` files (constitution) before every lifecycle command |
| `architecture-guard` | 1.8.9 | Architecture drift detection, violation scanning, refactor task generation |
| `wireframe` | latest | SVG wireframe generation, review, and regression screenshots |

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
  └─ AFTER:  git.commit, wireframe.generate (optional)

/speckit.plan
  ├─ BEFORE: git.commit, memory-loader.load, wireframe.review (optional)
  └─ AFTER:  git.commit, architecture-guard.violation-detection (optional)

/speckit.tasks
  ├─ BEFORE: git.commit, memory-loader.load
  └─ AFTER:  git.commit, architecture-guard.refactor-generator (optional)

/speckit.implement
  ├─ BEFORE: git.commit, memory-loader.load
  └─ AFTER:  git.commit, architecture-guard.architecture-review (optional),
             wireframe.screenshots (optional)
```

## Windsurf/Cascade Integration

### How It Works

Spec Kit generates `.windsurf/workflows/` files — one per command. These become slash commands in Cascade:

| Slash Command | Action |
|---------------|--------|
| `/speckit.specify` | Create or update feature spec |
| `/speckit.plan` | Generate implementation plan |
| `/speckit.tasks` | Generate dependency-ordered task list |
| `/speckit.implement` | Execute all tasks from tasks.md |
| `/speckit.clarify` | Ask clarification questions about spec |
| `/speckit.analyze` | Cross-artifact consistency check |
| `/speckit.checklist` | Generate custom checklist |
| `/speckit.constitution` | Update project constitution |
| `/speckit.architecture-guard.*` | Architecture review commands |
| `/speckit.wireframe.*` | Wireframe generation/review |
| `/speckit.git.*` | Git workflow commands |
| `/speckit.memory-loader.load` | Load memory context |

### Rules File

`.windsurf/rules/specify-rules.md` points Cascade to the current feature's plan. Updated automatically by Spec Kit when you switch features.

### Skills (via `.claude/`)

Three skills are available in Cascade's skill system:
- **ux-review**: 168-principle UX evaluation
- **code-review**: Deep code/PR review with root cause analysis
- **component-gen**: Generate components with UX principles baked in

## Devin Integration

### Configuration

`.devin/cascade.json` defines Devin's project awareness:
- Rules files to load
- Context documents (constitution, project-context, UX principles)
- Skills to activate
- Constraints (300-line limit, 90% coverage, etc.)
- Tech stack reference
- Performance targets

### Devin Workflow

Devin reads `.devin/cascade.json` at session start and gets:
1. Project rules from `.windsurf/rules/`
2. Context from `.claude/` and `.specify/memory/`
3. Available skills and constraints
4. Command shortcuts

## Architecture Guard Deep Dive

### Commands

| Command | When to Use |
|---------|-------------|
| `init` | Set up governance + architecture constitutions |
| `violation-detection` | After planning — scan for drift |
| `refactor-generator` | After task gen — convert violations to tasks |
| `architecture-review` | After implementation — full review |
| `architecture-verify` | Verification gate before merge |
| `architecture-apply` | Apply approved refactors to plan/tasks |
| `governed-plan` | Plan with memory + security + architecture |
| `governed-tasks` | Tasks with all constraints |
| `governed-implement` | Implement with post-review |
| `architecture-workflow` | Single workflow combining all |

### Typical Usage

```bash
# After writing a plan:
/speckit.architecture-guard.violation-detection

# Before implementation:
/speckit.architecture-guard.governed-implement

# After implementation:
/speckit.architecture-guard.architecture-verify
```

## Memory Loader

Automatically loads `.specify/memory/constitution.md` before every lifecycle command. This ensures the AI always has governance context (300-line limit, testing standards, UX requirements) without manual prompting.

## Extension Catalog

Catalog config at `.specify/extension-catalogs.yml`. Extensions are installed locally in `.specify/extensions/`. The catalog is only needed for `specify extension add` — already-installed extensions work regardless of catalog availability.

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

## Troubleshooting

- **Catalog fetch fails**: Extensions still work if already in `.specify/extensions/`. Catalog only needed for discovery/install.
- **Hook not firing**: Check `.specify/extensions.yml` — ensure `enabled: true` and extension is in `installed` list.
- **Workflow missing**: Run `specify integration sync windsurf` to regenerate `.windsurf/workflows/`.
- **Memory not loaded**: Ensure `.specify/memory/` directory has files and memory-loader is in `installed` list.
