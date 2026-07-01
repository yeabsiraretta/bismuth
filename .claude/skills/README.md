# Bismuth AI Skills

Reusable workflow skills for AI assistants working on Bismuth. Skills are organized into two tiers:

1. **Quality Skills** (standalone, reusable) — code-review, ux-review, component-gen, pict-test-designer
2. **Governed Workflows** (orchestration, multi-skill) — governed-plan, governed-tasks, governed-implement

## Governed Pipeline

The three governed workflows form a sequential pipeline that automatically integrates all quality skills:

```
governed-plan → governed-tasks → governed-implement
```

Each governed workflow activates quality skills at specific gates:

| Workflow           | Gate             | Skills Applied                                                                                                                    |
| ------------------ | ---------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| governed-plan      | Plan feasibility | code-review (quality bar), component-gen (UX mapping), pict-test-designer (test boundaries), ux-review (interaction surfaces)     |
| governed-tasks     | Task generation  | pict-test-designer (combinatorial tests), code-review (ownership), component-gen (UI guardrails), ux-review (acceptance criteria) |
| governed-implement | Coding           | coding-principles, component-gen, agent-rules                                                                                     |
| governed-implement | Review           | code-review (full bar), ux-review (evaluation)                                                                                    |
| governed-implement | Testing          | pict-test-designer (pairwise coverage)                                                                                            |

## Quality Skills

### code-review

**Trigger**: Code review, PR review, "is this the best fix"
**Key**: Fix Quality Bar, ownership boundaries, regression tests, backward compat

### ux-review

**Trigger**: UX feedback, UI evaluation, component review
**Key**: 168 principles, smell detection, scoring (0-100), priority fixes

### component-gen

**Trigger**: Create/build UI component
**Key**: Type-specific requirements, UX guardrails, post-gen checklist

### pict-test-designer

**Trigger**: Test design for combinatorial inputs
**Key**: Pairwise coverage, parameter models, constraint definitions

## Skill Format

Each skill directory contains a single `SKILL.md` with YAML frontmatter:

```yaml
---
name: skill-name
description: 'Short trigger phrase'
---
```

## Integration Points

- Governed workflows reference skills via `.claude/skills/<name>/SKILL.md`
- Windsurf workflows mirror skills at `.windsurf/workflows/<name>.md`
- Root config: `CLAUDE.md` (maps skills to workflow gates)
- Constitution files: `.specify/memory/` (architecture, security, governance)
- Agent rules: `.claude/agent-rules.md` (300-line limit, logger, commits)
- Component guide: `.claude/component-guide.md` (UX requirements per type)
- UX evaluator: `.claude/ux-evaluator.md` (168-principle framework)

---

**Last Updated**: 2026-06-13
