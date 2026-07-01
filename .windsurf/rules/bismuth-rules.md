# Bismuth Project Rules for Windsurf/Cascade

This file integrates all Claude tooling and project-specific rules for AI-assisted development in Windsurf.

## Quick Reference

- **Project Context**: `.claude/project-context.md` - Architecture, tech stack, standards
- **UX Evaluation**: `.claude/ux-evaluator.md` - 168 UX principles, smell detection
- **Component Guide**: `.claude/component-guide.md` - Component generation with UX principles
- **Agent Rules**: `.claude/agent-rules.md` - Workflow rules, coding principles, Git guidelines
- **Constitution**: `.specify/memory/constitution.md` - Core project principles and constraints
- **Skills**: `.claude/skills/` - Reusable workflows (ux-review, code-review, component-gen)

## Core Principles

### Constitution Constraints (MUST FOLLOW)

1. **File Size Limit**: No code or test file may exceed 300 lines
   - Check: `pnpm check:file-sizes`
   - Refactor into smaller, focused modules before adding functionality

2. **Test Coverage**: Maintain 90%+ coverage
   - Check: `pnpm test:ci`
   - Write tests before implementation (TDD)

3. **UX Evaluation Required**: All UI changes must be evaluated against UX principles
   - Reference: `.claude/ux-evaluator.md`
   - Use skill: `ux-review`

4. **Consistent User Experience**: Apply UX principles across all interfaces
   - Min button size: 40x40px (primary: 44x44px)
   - Max 7 items in lists/menus (cognitive load)
   - Immediate feedback on all actions
   - Keyboard navigation for all features

## Global Coding Principles

### Code Style and Readability

- **Clarity Over Brevity**: Favor understandable code over clever tricks
- **Consistent Naming**: Descriptive names following language conventions
- **Consistent Formatting**: Use automated tools (linters, formatters)
- **Comments That Add Value**: Explain "why" behind complex logic
- **Small Functions**: Single-responsibility, concise, focused

### Architecture and Modularity

- **Encapsulate Complexity**: Hide complex logic behind clear interfaces
- **Decouple Components**: Use interfaces/dependency injection
- **DRY**: Factor out repetitive patterns
- **Design for Extensibility**: Add features without major rewrites

### Error Handling and Testing

- **Fail Fast, Fail Loud**: Validate early, clear error messages
- **Testability as Priority**: Easy to test in isolation
- **Thorough Input Validation**: Check correctness, sanity, security
- **Iterative Validation**: Run tests frequently

### Performance and Resource Management

- **Appropriate Data Structures**: Choose best-suited for problem
- **Avoid Premature Optimization**: Start clean, measure, address hotspots
- **Resource Lifecycle Awareness**: Proper cleanup (memory, files, connections)

## Tech Stack

### Frontend

- **Framework**: Svelte 4.2+ with TypeScript
- **Editor**: CodeMirror 6
- **Styling**: Tailwind CSS + CSS custom properties
- **Icons**: Lucide icons
- **Build**: Vite 5.4+

### Backend

- **Runtime**: Rust with Tauri 1.5+
- **Database**: SQLite (local, embedded)
- **Search**: Tantivy (full-text search)
- **File Watching**: notify crate

### Testing

- **Frontend**: Vitest + Testing Library
- **Backend**: Rust built-in testing + tempfile
- **E2E**: Playwright (planned)

## Pre-Action Checklist

**Before Every Task**:

1. Read `.claude/agent-rules.md` for workflow rules
2. Check `.claude/project-context.md` for architecture
3. Review Constitution for constraints
4. Run `pnpm docs:list` to find relevant documentation
5. Check existing code for similar patterns

**Before Code Changes**:

1. Verify file won't exceed 300-line limit
2. Check if tests exist for affected behavior
3. Review UX principles if UI changes
4. Confirm tech stack alignment

**Before Creating Files**:

1. Verify file doesn't already exist
2. Confirm it fits Constitution principles
3. Check if content belongs in existing file
4. Plan file structure to stay under 300 lines

**Before Documentation Changes**:

1. Check if information exists elsewhere
2. Verify it's not temporary/scratch content
3. Confirm it adds value to knowledge base
4. Plan consolidation over creation

## Documentation Standards

**Anti-Bloat Rules**:

- NEVER create new docs without explicit need
- PREFER: Update existing docs over creating new ones
- PREFER: Add to CHANGELOG.md over separate notes
- PREFER: Save to memory over creating reference files
- Only create for: major architecture, required tooling, or when doesn't fit existing structure

**When Creating Docs**:

- Add YAML frontmatter with `summary` and `read_when` fields
- Place in appropriate `docs/` subdirectory
- Update `docs/README.md` with reference
- Keep focused and concise
- Document changes in CHANGELOG.md

## Available Skills

Invoke skills when user request matches the description:

### ux-review

**Trigger**: User requests UX feedback, evaluation, or review
**Process**: Classify interface → Select principles → Scan violations → Detect smells → Score
**Output**: Structured evaluation (0-100 score, findings, priority fixes)

### code-review

**Trigger**: User requests code/PR review or asks "is this the best fix"
**Process**: Identify change → Find root cause → Evaluate fix → Check refactor → Verify proof
**Output**: Structured review with root cause, evaluation, recommendation

### component-gen

**Trigger**: User asks to create/build UI component
**Process**: Identify type → Check requirements → Apply guardrails → Generate → Verify
**Output**: Production-ready component with UX principles baked in

## Git and Commit Guidelines

- **Never use terminal Git commands in Cascade chat**
- **Commit message format**: `prefix: short description (max one sentence)`
- **Prefixes**: feat, fix, tweak, style, refactor, perf, test, docs, chore, ci, build, revert, hotfix, init, merge
- Always format commit messages in code blocks

## Work Style

- Telegraph style; noun-phrases ok; drop grammar; min tokens
- Token-efficient, relaxed grammar, terse descriptions
- No emojis in code, commits, documentation, or responses
- Professional technical communication only

## Common Commands

```bash
# Development
pnpm dev              # Start dev server
pnpm tauri dev        # Start Tauri app

# Quality Checks
pnpm check            # Run all checks
pnpm check:file-sizes # Verify 300-line limit
pnpm test:ci          # Run tests with coverage
pnpm lint             # Lint code
pnpm format           # Format code

# Documentation
pnpm docs:list        # List docs with summaries
pnpm validate:workflows # Validate workflow files

# Build
pnpm build            # Build frontend
pnpm tauri build      # Build Tauri app
```

## File Organization

```
bismuth/
├── .claude/                    # AI assistant configuration
│   ├── agent-rules.md         # Workflow rules, coding principles
│   ├── component-guide.md     # Component generation guide
│   ├── project-context.md     # Project overview
│   ├── ux-evaluator.md        # UX evaluation framework
│   ├── skills/                # Reusable workflows
│   │   ├── ux-review/
│   │   ├── code-review/
│   │   └── component-gen/
│   └── README.md              # AI config documentation
├── .specify/                   # Spec Kit configuration
│   └── memory/
│       └── constitution.md    # Core principles
├── docs/                       # Project documentation
│   ├── standards/             # Coding standards, UX principles
│   ├── architecture/          # Architecture decisions
│   └── development/           # Development guides
├── src/                        # Frontend source (Svelte + TypeScript)
├── src-tauri/                  # Backend source (Rust + Tauri)
└── scripts/                    # Development scripts
```

## UX Guardrails (Non-Negotiable)

### Cognitive Load

- Max 7±2 items in any list, menu, or visible set
- Group when exceeding 9 items
- Progressive disclosure for advanced options

### Interaction

- Min 40x40px for all interactive elements
- Min 44x44px for primary actions
- Immediate feedback on all user actions
- Confirmation for destructive actions

### Accessibility

- Keyboard navigation for all features
- ARIA labels on icon-only buttons
- Focus indicators visible (2px outline)
- Contrast ≥4.5:1 for text
- Alt text for images

## Error Prevention

- Validate inputs before processing
- Disable submit until valid
- Show inline validation on blur
- Provide specific, actionable error messages
- Offer undo for destructive actions

## Performance Targets

- Input latency: <16ms
- Page load: <1s
- Search results: <200ms
- Graph rendering: <3s for 10k nodes
- Auto-save debounce: 500ms

---

**Last Updated**: 2026-05-26
**Source**: Integrated from `.claude/` folder and Constitution
