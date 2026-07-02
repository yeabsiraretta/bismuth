# Agent Rules for Bismuth

Core workflow rules extracted from steipete/agent-scripts. Terse, operational, token-efficient.

## Global Coding Principles

Produce clean, efficient, maintainable code. Strive for readability, simplicity, modularity regardless of language.
Respect language idioms, use intuitive naming, consider error handling and testing from the outset.
Balance clarity with performance, factor in future scalability and maintainability.

### Code Style and Readability

1. **Clarity Over Brevity**: Favor understandable code over clever tricks
2. **Consistent Naming**: Descriptive, self-explanatory names following language conventions
3. **Consistent Formatting**: Uniform indentation, spacing, line width via automated tools
4. **Comments That Add Value**: Explain "why" behind complex logic, not just "what"
5. **Small, Single-Responsibility Functions**: Concise, focused, one thing well

### Architecture and Modularity

1. **Encapsulate Complexity**: Hide complex logic behind clear interfaces
2. **Decouple Components**: Minimal direct knowledge, use interfaces/dependency injection
3. **DRY (Don't Repeat Yourself)**: Factor out repetitive patterns
4. **Design for Extensibility**: Add features without major rewrites

### Error Handling and Testing

1. **Fail Fast, Fail Loud**: Validate early, clear error messages
2. **Testability as Priority**: Easy to test in isolation, separate pure logic from side effects
3. **Thorough Input Validation**: Check correctness, sanity, security before processing
4. **Iterative Validation**: Run tests frequently, catch regressions early

### Performance and Resource Management

1. **Appropriate Data Structures**: Choose best-suited for problem, reasonable complexity
2. **Avoid Premature Optimization**: Start clean, measure with profiling, address hotspots
3. **Resource Lifecycle Awareness**: Proper memory, file handles, connections cleanup

### Git and Commit Guidelines

- **Never use terminal Git commands in Cascade chat**
- **Commit message format**: `prefix: short description (max one sentence)`
- **Prefixes**: feat, fix, tweak, style, refactor, perf, test, docs, chore, ci, build, revert, hotfix, init, merge
- Always format commit messages in code blocks

## Work Style

- Telegraph style; noun-phrases ok; drop grammar; min tokens
- Avoid Markdown tables in CLI output; use bullets or `key: value` lines
- Token-efficient, relaxed grammar, terse descriptions
- No emojis in code, commits, documentation, or responses
- Professional technical communication only

## Pre-Action Review

**Before Every Task**:

1. Read `.claude/agent-rules.md` (this file) for workflow rules
2. Check `.claude/project-context.md` for architecture and patterns
3. Review Constitution (`.specify/memory/constitution.md`) for constraints
4. Run `pnpm docs:list` to find relevant documentation
5. Check existing code for similar patterns

**Before Code Changes**:

1. Verify file won't exceed 300-line limit after changes
2. Check if tests exist for affected behavior
3. Review UX principles if UI changes (`.claude/ux-evaluator.md`)
4. Confirm tech stack alignment (Svelte, Rust, Tauri, TypeScript)

**Before Creating Files**:

1. Verify file doesn't already exist in similar form
2. Confirm it fits Constitution principles
3. Check if content belongs in existing file instead
4. Plan file structure to stay under 300 lines

**Before Documentation Changes**:

1. Check if information exists elsewhere
2. Verify it's not temporary/scratch content
3. Confirm it adds value to knowledge base
4. Plan consolidation over creation

## Core Workflow

### Repository Management

- Workspace: `/Users/yeabsiramoges/Desktop/bismuth`
- If cwd is in git repo: work there; don't jump to sibling checkout unless asked
- No `git worktree` unless user asks
- Safe by default: `git status/diff/log`
- Push only when user asks
- End in visible checkout/branch user expects
- Destructive ops forbidden unless explicit: `reset --hard`, `clean`, `restore`, `rm`

### Commits

- Use Conventional Commits: `feat|fix|refactor|build|ci|chore|docs|style|perf|test`
- No amend unless asked
- Changelogs: match file style; one bullet per entry on one line; no hard-wrap
- User-facing fixes/landed PRs: update changelog unless pure test/internal

### File Operations

- Need upstream file: stage in `/tmp/`, then cherry-pick; never overwrite tracked files
- No repo-wide search/replace scripts; keep edits small/reviewable
- Unrecognized changes: assume other agent; keep going; focus your changes

### Dependencies & Tools

- Use repo package manager/runtime; no swaps without approval
- New deps: quick health check for recent releases/commits/adoption
- Read repo docs before coding; update docs/changelog for user-visible behavior changes

### Documentation & Knowledge Base

**Before Making Changes**:

- Read existing docs in `docs/` folder first
- Check `.claude/` rules and best practices
- Review Constitution (`.specify/memory/constitution.md`)
- Run `pnpm docs:list` to discover relevant documentation
- Verify similar patterns exist in codebase

**Documentation Standards**:

- NEVER create new docs without explicit need
- PREFER: Update existing docs over creating new ones
- PREFER: Add to CHANGELOG.md over separate notes
- PREFER: Save to memory over creating reference files
- Only create new docs for: major architecture, required tooling, or when content doesn't fit existing structure

**When Creating Docs**:

- Add YAML frontmatter with `summary` and `read_when` fields
- Place in appropriate `docs/` subdirectory (architecture, development, implementation, standards, etc.)
- Update `docs/README.md` with new file reference
- Keep focused and concise; avoid redundancy with existing docs
- Document changes in CHANGELOG.md

**Documentation Anti-Patterns**:

- Do NOT create separate quick-reference guides (consolidate into main docs)
- Do NOT create "notes" or "scratch" files (use memory or existing docs)
- Do NOT duplicate information across multiple files
- Do NOT create docs for temporary information
- Do NOT bloat the docs folder with redundant content

**Change Documentation**:

- Document all user-facing changes in CHANGELOG.md immediately
- Update relevant docs when behavior changes
- Add code comments only for tricky/bug-prone logic
- Keep commit messages precise and informative (Conventional Commits)

**Knowledge Base Expansion**:

- Expand existing docs with new learnings
- Add examples to existing documentation
- Update best practices in-place
- Consolidate related information
- Remove outdated information when updating

## Code Quality

### Bugs & Fixes

- Add regression test when it fits
- Fixes/refactors: delete old paths by default
- "Shipped" means in a release Git tag, not main/GitHub/PR
- Compat needs explicit contract: public API/CLI/config/data, tagged upgrade path, security boundary
- If unsure, ask before keeping aliases/shims/fallbacks
- Tests alone are not contracts

### Comments & Documentation

- Inline code comments: brief notes for tricky, bug-prone, or previously buggy logic
- Update docs/changelog for user-visible behavior changes
- No separate notes files; terse edits to existing docs

## Safety & Security

### Runtime Safety

- zsh: don't use `status` as a variable
- Secrets: never run `env`, `set`, `export -p`, or broad secret regex dumps
- Query exact names only; redact values
- After touching secrets/env, unset tokens before public operations

### Git Safety

- Branch changes require user consent
- If user types a command ("pull and push"), that's consent for that command
- No destructive ops without explicit user request

## PR & CI Workflow

### GitHub Operations

- Use `gh` CLI for GitHub refs, not web browsing:
  ```bash
  gh issue view <n> --json number,title,state,author,body,comments
  gh pr view <n> --json number,title,state,author,body,files,commits
  gh pr diff <n> --patch
  ```
- Pasted GitHub issue/PR: first `git status -sb`; if dirty, yell; then `git push` + `git pull --ff-only`
- PRs: prefer rewriting/fixing the PR, then merging it, over closing and committing equivalent files directly

### CI & Testing

- `fix ci`: consent to pull, commit, push; fix/rerun/watch until CI green
- CI: `gh run list/view`; rerun/fix until green when asked
- Pre-commit code changes: run quality checks until no actionable findings remain

### After Landing

- Final includes 2-5 sentence recap of what landed
- Checkout `main`, pull `--ff-only`, verify `git status -sb`, then final
- When merging contributor PRs: thank contributor in `CHANGELOG.md`

## Review Standards

### Code Review Depth

Read past the first touched file. Follow the real call path:

- entrypoint → validation/parsing → routing/dispatch → owner module → shared helper → persistence/network/runtime boundary
- config/schema/docs → runtime usage → doctor/migration/fix path
- tests around the touched surface plus adjacent regression tests

### Fix Quality Bar

Good fixes usually:

- Live at the ownership boundary where the bug belongs
- Preserve public/backward-compatible behavior unless retiring it
- Add regression test at the smallest meaningful seam
- Avoid broad special cases, hidden migrations, semantic sentinels
- Update docs/changelog when user-visible behavior changes
- Fail clearly in runtime paths; repair through doctor/migration paths

### Review Contract

Always answer explicitly:

- What is the bug or behavior being fixed?
- Can we identify the root cause? If yes, where in code and why. If no, what evidence is missing.
- Is the current/proposed fix the best possible fix after reading adjacent code?
- Would a bigger refactor improve correctness, clarity, or future maintainability?
- What proof exists: tests, live repro, CI checks, docs
- What remains risky or unverified

## Bismuth-Specific Rules

### File Size Compliance

- Constitution Principle VI: No file >300 lines
- Before adding functionality to large files, refactor first
- Run `pnpm check:file-sizes` before commits touching code files

### UX Evaluation

- Constitution Principle III: All UI components MUST be evaluated against UX principles
- Use `.claude/ux-evaluator.md` for review
- Use `.claude/component-guide.md` before generating components
- Apply smell detection: overloaded screens, form graveyards, mystery navigation

### Testing

- Constitution Principle II: 90%+ coverage required
- Tests MUST pass before work is complete
- Failing tests MUST block release or merge

### Tech Stack

- Frontend: Svelte 4.2+ with TypeScript
- Backend: Rust with Tauri 1.5+
- Editor: CodeMirror 6
- Database: SQLite (local)
- Search: Tantivy (full-text)

### Common Commands

```bash
# Development
pnpm dev                    # Start dev server
pnpm tauri:dev             # Start Tauri app

# Quality checks
pnpm check                 # Full quality check
pnpm check:file-sizes      # Verify 300-line limit
pnpm lint                  # ESLint
pnpm test                  # Run tests

# Build
pnpm build                 # Build frontend
pnpm tauri:build          # Build desktop app
```

## Output Templates

### Bug Review

```text
Ref: #123 / PR #456
Surface: <runtime/CLI/component/service>

Bug: <one or two sentences>
Cause: <code path + confidence>
Best fix: <what should change and why>
Refactor: <yes/no, specific shape>
Proof: <tests/live/CI/source>
Risk: <remaining uncertainty>
```

### Component Generation

Before generating UI components:

1. Check `.claude/component-guide.md` for type-specific requirements
2. Apply UX guardrails (max 7 items, min 40px buttons, inline validation)
3. Follow Bismuth-specific patterns (note editor, file tree, graph view)
4. Verify against UX principles before submission

### Commit Message

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types: `feat|fix|refactor|build|ci|chore|docs|style|perf|test`

---

**Source**: Adapted from steipete/agent-scripts  
**Last Updated**: 2026-05-26  
**Maintainer**: Development Team
