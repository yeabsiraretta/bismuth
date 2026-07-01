# Windsurf Rules for Bismuth

This directory contains rules that Windsurf/Cascade automatically loads for AI-assisted development.

## Files

### bismuth-rules.md

**Primary rules file** - Comprehensive integration of all Claude tooling and project standards.

**Contains**:

- Quick reference to all `.claude/` resources
- Constitution constraints (300-line limit, 90% coverage, UX evaluation)
- Global coding principles (clarity, DRY, fail fast, etc.)
- Tech stack reference
- Pre-action checklists
- Documentation standards
- Available skills (ux-review, code-review, component-gen)
- Git and commit guidelines
- Common commands
- File organization
- UX guardrails
- Performance targets

**When loaded**: Automatically by Windsurf on project open

### specify-rules.md

**Spec Kit integration** - References current plan for project context.

## How It Works

Windsurf automatically loads all `.md` files in `.windsurf/rules/` as context for AI assistance.

This means:

1. All Claude tooling from `.claude/` is available in Windsurf
2. Constitution constraints are enforced
3. Skills can be invoked by user request
4. Coding principles guide all AI-generated code
5. Pre-action checklists ensure quality

## Skills Available

Skills auto-activate based on user request:

- **ux-review**: Review UI components against 168 UX principles
- **code-review**: Deep code review with evidence-first analysis
- **component-gen**: Generate components with UX principles baked in

## Key Resources

All resources from `.claude/` folder are referenced and available:

- `.claude/agent-rules.md` - Workflow rules, coding principles
- `.claude/project-context.md` - Architecture, tech stack
- `.claude/ux-evaluator.md` - UX evaluation framework
- `.claude/component-guide.md` - Component generation guide
- `.claude/skills/` - Reusable workflow skills
- `.specify/memory/constitution.md` - Core project principles

## Usage

Simply work in Windsurf - all rules are automatically applied. The AI will:

1. Follow Constitution constraints (300-line limit, test coverage, UX evaluation)
2. Apply global coding principles (clarity, DRY, testability)
3. Reference project context and architecture
4. Use appropriate skills when triggered
5. Maintain documentation standards
6. Follow Git commit guidelines

No additional configuration needed!
