# Memory-First Workflow

All AI agents and contributors MUST follow this workflow when planning, implementing, or reviewing features.

## Governed Pipeline (Preferred)

The governed workflow pipeline integrates memory, security, architecture, and quality skills into a single sequential flow:

```
/speckit.architecture-guard.governed-plan    -> plan.md
/speckit.architecture-guard.governed-tasks   -> tasks.md
/speckit.architecture-guard.governed-implement -> code + review
```

Each governed command handles memory synthesis automatically (Step 2 in each workflow).

## Before Planning

1. Read `docs/memory/INDEX.md` to identify relevant durable context.
2. Read relevant entries from `ARCHITECTURE.md`, `DECISIONS.md`, `BUGS.md`.
3. Read `.specify/memory/constitution.md` for governance constraints.
4. If a feature memory exists (`specs/<feature>/memory.md`), read it.
5. If a synthesis exists (`specs/<feature>/memory-synthesis.md`), prefer it over full reads.

## During Implementation

1. Honor all Active decisions in `docs/memory/DECISIONS.md`.
2. Avoid all patterns documented in `docs/memory/BUGS.md`.
3. Follow architecture boundaries documented in `docs/memory/ARCHITECTURE.md`.
4. Update `specs/<feature>/memory.md` with open questions and carry-forward notes.

## After Implementation

1. Run `/speckit.memory-md.capture` to propose durable lessons.
2. Review whether any new decision, bug pattern, or architecture insight emerged.
3. A task is not complete until memory review has been performed.

## Cross-Skill Quality Gates

The governed workflows apply quality skills at specific gates:

| Phase | Gate | Skills Applied |
|-------|------|----------------|
| Plan | Feasibility | code-review, component-gen, pict-test-designer, ux-review |
| Tasks | Generation | pict-test-designer, code-review, component-gen, ux-review |
| Implement | Coding | coding-principles, component-gen, agent-rules |
| Implement | Review | code-review (Fix Quality Bar), ux-review (smell detection) |
| Implement | Testing | pict-test-designer (pairwise coverage) |

## Memory Layers

| Layer | Location | Purpose |
|-------|----------|---------|
| Governance | `.specify/memory/` | Constitution, architecture rules, workflow |
| Durable | `docs/memory/` | Cross-feature knowledge, decisions, patterns |
| Active | `specs/<feature>/` | Feature-local constraints and synthesis |
| Ephemeral | Terminal/prompt state | Never committed |

## Extension Detection

- `flash-mem` -> check for `memory-md` in `.specify/extensions.yml`
- `spec-kit-security-review` -> check for `security-review` in `.specify/extensions.yml`
- When `memory-md` is in markdown-only mode: use `/speckit.memory-md.plan-with-memory`

## Commands

- `/speckit.memory-md.plan-with-memory` — Synthesize constraints before planning
- `/speckit.memory-md.capture` — Propose durable lessons after implementation
- `/speckit.memory-md.audit` — Check memory quality and freshness

## Skill References

- Code review: `.claude/skills/code-review/SKILL.md`
- UX review: `.claude/skills/ux-review/SKILL.md`
- Component gen: `.claude/skills/component-gen/SKILL.md`
- PICT test designer: `.claude/skills/pict-test-designer/SKILL.md`
- Root config: `CLAUDE.md` (full skill integration map)
