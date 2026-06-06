# Claude/Windsurf AI Assistant Configuration

This folder contains project-specific context and skills for AI assistants (Claude, Windsurf/Cascade, etc.).

## Files

### `project-context.md`
**Purpose**: High-level project overview for AI assistants

**Contains**:
- Project architecture and tech stack
- Current development phase and completed tasks
- Code organization and patterns
- Constitution principles and standards
- Common commands and workflows
- Key files to reference

**When to use**: Automatically loaded by AI assistants to understand project context

### `ux-evaluator.md`
**Purpose**: UX/UI evaluation skill based on 168 research-backed principles

**Contains**:
- Evaluation workflow (classify → select principles → scan → score)
- Bismuth-specific standards (button sizes, cognitive load limits)
- AI interface evaluation (transparency, trust, control)
- UX smell detection (antipatterns)
- Code review checklist
- Severity levels and scoring system

**When to use**: 
- Reviewing UI component code
- Discussing new interface designs
- PR review with UI changes
- User requests UX feedback

### `component-guide.md`
**Purpose**: UX-informed requirements for generating UI components

**Contains**:
- Component type → principles mapping
- Generation requirements by component (forms, tables, navigation, etc.)
- UX guardrails (non-negotiable rules)
- Component checklist
- Anti-patterns to avoid
- Bismuth-specific patterns

**When to use**:
- Before generating new UI components
- Planning component architecture
- Ensuring UX compliance from the start

### `agent-rules.md`
**Purpose**: Core workflow rules for AI assistants

**Contains**:
- Work style (telegraph, terse, token-efficient)
- Repository management (git workflow, commits, file operations)
- Code quality standards (bugs, fixes, comments)
- Safety & security (runtime safety, git safety)
- PR & CI workflow (GitHub operations, testing, landing)
- Review standards (code review depth, fix quality bar)
- Bismuth-specific rules (file size, UX evaluation, testing, tech stack)
- Output templates (bug review, component generation, commit messages)

**When to use**:
- Automatically loaded for all interactions
- Reference for workflow decisions
- Commit message formatting
- Code review standards

### `skills/` Folder
**Purpose**: Reusable workflow skills for specific tasks

**Available Skills**:
- **ux-review**: Review UI components against 168 UX principles
- **code-review**: Deep code review with evidence-first analysis
- **component-gen**: Generate components with UX principles baked in

**When to use**:
- Skills auto-activate based on user request
- Explicit skill invocation by name
- Task context alignment

**See**: `skills/README.md` for full documentation

## How It Works

### In Windsurf/Cascade

**Automatic Integration**: All Claude tooling is integrated into Windsurf via `.windsurf/rules/bismuth-rules.md`

The AI assistant will:
1. Read `project-context.md` to understand Bismuth architecture
2. Follow `agent-rules.md` for workflow decisions and code review
3. Apply `ux-evaluator.md` when reviewing UI code
4. Use `component-guide.md` before generating components
5. Reference constitution and UX principles during all work
6. Auto-activate skills based on user requests

**Windsurf Configuration**:
- `.windsurf/rules/bismuth-rules.md` - Primary rules file (integrates all Claude tooling)
- `.windsurf/cascade.json` - Configuration with context paths, commands, constraints
- `.windsurf/rules/README.md` - Documentation on how rules work

**Skills Available in Windsurf**:
- `ux-review` - Triggered when user requests UX feedback/evaluation
- `code-review` - Triggered when user requests code/PR review
- `component-gen` - Triggered when user asks to create UI component

### In Claude Desktop
Add to your Claude Desktop configuration to enable project-specific context.

### In Other Tools
These markdown files serve as documentation and can be manually referenced.

## Updating

When you make significant project changes:

1. **Update `project-context.md`** if:
   - Architecture changes (new tech, major refactor)
   - Phase completion (update completed tasks)
   - New standards or patterns emerge
   - File organization changes

2. **Update `ux-evaluator.md`** if:
   - New UX standards added to `docs/standards/ux-principles.md`
   - Bismuth-specific UI patterns change
   - New component sizing requirements

## Related Documentation

- **Full UX Principles**: `docs/standards/ux-principles.md` (168 principles, 6 parts)
- **Constitution**: `.specify/memory/constitution.md` (governance)
- **Design System**: `docs/standards/design-system.md` (visual standards)
- **Tasks**: `specs/001-bismuth-pkm-editor/tasks.md` (current work)

## Best Practices

✅ **DO**:
- Keep context files concise and scannable
- Update when project structure changes significantly
- Reference full docs for detailed information
- Use clear examples and code snippets

❌ **DON'T**:
- Duplicate full documentation here (link instead)
- Include sensitive information (API keys, secrets)
- Let context files get stale (update regularly)
- Make files too long (>500 lines)

---

**Last Updated**: 2026-05-26  
**Maintainer**: Development Team
