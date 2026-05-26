# Bismuth AI Skills

Reusable workflow skills for AI assistants working on Bismuth.

## Available Skills

### ux-review
**Trigger**: User requests UX feedback, evaluation, or review

**Purpose**: Review UI components against 168 research-backed UX principles

**Process**:
1. Classify interface type
2. Select relevant principles
3. Scan for violations (critical/warning/suggestion)
4. Detect UX smells
5. Score and report (0-100)

**Output**: Structured evaluation with findings, strengths, priority fixes

### code-review
**Trigger**: User requests code review, PR review, or asks "is this the best fix"

**Purpose**: Deep code review with evidence-first analysis

**Process**:
1. Identify what's being fixed/changed
2. Find root cause
3. Evaluate if it's the best fix
4. Check refactor opportunities
5. Verify proof (tests, coverage, docs)
6. Assess risk

**Output**: Structured review with root cause, evaluation, findings, recommendation

### component-gen
**Trigger**: User asks to create/build a new UI component

**Purpose**: Generate components with UX principles baked in from the start

**Process**:
1. Identify component type
2. Check component guide for requirements
3. Apply UX guardrails
4. Generate code with proper sizing, accessibility, feedback
5. Verify post-generation checklist

**Output**: Production-ready component code following Bismuth patterns

## Skill Format

Each skill follows this structure:

```
skills/
└── skill-name/
    └── SKILL.md
```

### SKILL.md Format

```yaml
---
name: skill-name
description: "Short generic trigger phrase"
---

# Skill Title

[Skill content]
```

## Using Skills

Skills are automatically discovered by AI assistants when:
- User request matches the skill description
- Skill name is mentioned explicitly
- Task context aligns with skill purpose

## Adding New Skills

1. Create folder: `.claude/skills/new-skill/`
2. Create `SKILL.md` with YAML frontmatter
3. Include:
   - `name`: kebab-case skill name
   - `description`: Short trigger phrase (quoted)
4. Document: When to use, process, output format, references
5. Keep terse and operational

## Validation

Run validation to check all skills:

```bash
# Validate skill frontmatter (if script exists)
pnpm validate:workflows  # Also validates skills
```

## References

- Agent rules: `.claude/agent-rules.md`
- UX evaluator: `.claude/ux-evaluator.md`
- Component guide: `.claude/component-guide.md`
- Project context: `.claude/project-context.md`

---

**Source**: Adapted from steipete/agent-scripts skill pattern  
**Last Updated**: 2026-05-26
