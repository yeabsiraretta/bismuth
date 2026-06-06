<!--
Sync Impact Report
Version change: 1.1.0 → 1.2.0
Modified principles:
- I. Maintainable Code Quality → Added barrel re-export pattern requirement
- VI. Code Organization → Expanded with modularization patterns and tolerance threshold
Added sections:
- VII. Specification-Driven Development
- VIII. Design Token and Styling Architecture
- IX. Multi-Agent Governance
Removed sections:
- None
Templates requiring updates:
- ⚠ .specify/templates/plan-template.md (add extension hook awareness)
- ⚠ .specify/templates/tasks-template.md (add spec-driven workflow reference)
- ✅ docs/development/extension-integration.md (created)
- ✅ scripts/ reorganized into quality/, git/, build/ subfolders
Follow-up TODOs:
- None (all prior TODOs from v1.1.0 resolved: scripts created, hooks active)
-->
# Bismuth Constitution

## Core Principles

### I. Maintainable Code Quality
All production code MUST be readable, cohesive, and consistent with existing project
patterns. Implementations MUST reuse established utilities, components, and abstractions
before introducing new ones. Duplicate logic MUST be extracted or explicitly justified
when extraction would reduce clarity. New architecture, dependencies, and abstractions
MUST be planned against expected feature evolution to keep bloat low and maintainability
high. **No single code or test file MUST exceed 300 lines** (files up to 350 lines are
acceptable when further splitting would harm cohesion). Files approaching this limit
MUST be refactored into smaller, focused modules. When splitting modules, the **barrel
re-export pattern** MUST be used to maintain API compatibility — original import paths
MUST continue to work via re-exports from the original file location. Rationale: code
quality is preserved by minimizing unnecessary surface area, enforcing focused modules,
maintaining backward-compatible imports, and making future changes predictable.

### II. Comprehensive Testing Standards
Every change MUST include appropriate automated tests for the affected behavior unless
the change is documentation-only. The project MUST maintain at least 90% coverage across
lines, branches, statements, and functions for all code files. Tests MUST pass before
work is considered complete, and failing tests MUST block release or merge. Coverage
exceptions require written justification and a follow-up remediation plan. Rationale:
high coverage and passing tests provide confidence that behavior is correct and stable.

### III. Consistent User Experience
User-facing changes MUST preserve a consistent experience across flows, screens,
messages, accessibility expectations, and platform conventions. Existing components,
design tokens, copy patterns, and interaction models MUST be reused before creating new
variants. Acceptance criteria MUST cover the primary user journey and relevant edge
cases from the user's perspective. All UI components MUST be evaluated against UX
principles documented in `docs/standards/ux-principles.md` before implementation.
Rationale: consistent UX reduces confusion and makes features feel integrated rather
than bolted on.

### IV. Performance and Cross-Platform Reliability
Features MUST define measurable performance expectations before implementation and MUST
avoid unnecessary runtime, memory, dependency, and bundle-size costs. Generated code and
automation MUST work across Windows, macOS, and Linux unless the feature specification
explicitly limits supported platforms. Platform-specific behavior MUST be isolated,
tested, and documented in the implementation plan. Performance targets: input latency
<16ms, page load <1s, search results <200ms, graph rendering <3s for 10k nodes,
auto-save debounce 500ms. Rationale: performance and portability must be designed in,
not repaired after delivery.

### V. Research-First Simplicity
Before implementation, teams MUST deep dive the relevant concepts, constraints, and
existing code paths. Plans MUST compare multiple viable approaches and select the most
straightforward, readable, maintainable, and consistent solution. Complex solutions,
new dependencies, or divergent patterns MUST be justified by concrete requirements and
documented alternatives. Rationale: deliberate research prevents accidental complexity
and improves implementation quality.

### VI. Code Organization and File Size Limits
Code and test files MUST NOT exceed 300 lines (tolerance up to 350 when splitting would
reduce cohesion). Files exceeding this limit MUST be refactored into smaller, focused
modules with clear responsibilities. When splitting:
- Extract logic into co-located `.ts` modules (e.g., `componentLogic.ts`)
- Use recursive components to eliminate template duplication in Svelte
- Apply barrel re-exports from the original path for API compatibility
- Condense CSS rules to single-line format when styles push files over limit
Templates, large text collections, and static assets MUST be extracted into dedicated
directories. Large data collections MUST be externalized to JSON/YAML in `config/`.
Scripts MUST be organized into categorical subfolders (`quality/`, `git/`, `build/`).
Rationale: enforcing file size limits improves readability, reduces merge conflicts,
enables better code review, and makes the codebase maintainable.

### VII. Specification-Driven Development
All features MUST follow the Spec Kit lifecycle: specify → plan → tasks → implement.
The project constitution (this file) MUST be loaded automatically before every lifecycle
command via the memory-loader extension. Architecture drift MUST be detected after
planning via the architecture-guard extension. Feature branches MUST be created before
specification. Changes MUST be auto-committed at lifecycle boundaries via git hooks.
Extensions registered in `.specify/extensions.yml` define the governed workflow. New
capabilities MUST be added as extensions, not ad-hoc scripts. The demo vault MUST be
updated when new user-facing features land (tracked in `demo-vault/MANIFEST.md`).
Rationale: specification-driven development ensures features are designed before built,
reviewed against governance, and tracked through completion.

### VIII. Design Token and Styling Architecture
All visual styling MUST use CSS custom properties (design tokens) defined in
`src/lib/styles/tokens.css` as the single source of truth. Components MUST use scoped
CSS with `var()` references to tokens — NOT inline Tailwind utility classes. The
`@theme` block in `src/app.css` maps tokens into the Tailwind namespace for cases where
utilities are needed. Dark mode MUST use `data-theme="dark"` attribute (NOT `.dark`
class). New colors, spacing, or typography values MUST be added to tokens.css first,
then referenced by components. CSS imports MUST be centralized in `src/app.css`.
Rationale: a single token source prevents drift between themes, ensures consistent
styling, and makes global design changes predictable.

### IX. Multi-Agent Governance
The project supports multiple AI development agents (Windsurf/Cascade, Devin, Claude).
All agents MUST operate under the same constitution and constraints. Agent-specific
configuration MUST be kept in their respective directories (`.windsurf/`, `.devin/`,
`.claude/`) but MUST NOT contradict this constitution. Shared context (constitution,
project rules, UX principles) MUST be referenced rather than duplicated. When a
constraint is updated here, all agent configs MUST be synchronized. The Windsurf
integration is primary; other integrations MUST mirror its workflow files.
Rationale: consistent governance across agents prevents conflicting implementations
and ensures any agent can pick up work without violating project standards.

## Engineering Constraints

- Code coverage MUST remain at or above 90% for lines, branches, statements, and
  functions across all code files.
- All supported workflows MUST pass on Windows, macOS, and Linux or document an approved
  platform limitation in the feature specification and implementation plan.
- New dependencies, frameworks, or large generated code paths MUST include a bloat and
  reuse review explaining why existing code cannot satisfy the requirement.
- Performance budgets MUST be measurable and validated for features where latency,
  throughput, memory, startup time, rendering smoothness, or bundle size can affect
  users.
- Shared components and utilities MUST be preferred over one-off implementations when
  they preserve readability and reduce duplication.
- **File size limits MUST be enforced automatically** via `scripts/quality/check-file-sizes.sh`
  (pre-commit hook, CI pipeline). Files over 300 lines trigger warnings; over 400 lines
  block commits (excluding generated code and dependencies).
- **Styling MUST NOT bypass tokens**: Direct hex colors, hardcoded spacing, or inline
  style attributes in components MUST be flagged in review. All values MUST reference
  CSS custom properties from the token system.
- **Extensions MUST be used for governed workflows**: Manual lifecycle steps (planning
  without constitution load, implementing without architecture review) MUST be flagged.

## Development Workflow and Quality Gates

- Feature planning MUST identify affected code paths, existing patterns to reuse,
  rejected alternatives, test strategy, UX consistency checks, performance expectations,
  and cross-platform risks.
- Implementation MUST proceed only after the team understands the relevant concept and
  integration points well enough to explain the chosen approach.
- The Spec Kit lifecycle (`/speckit.specify` → `/speckit.plan` → `/speckit.tasks` →
  `/speckit.implement`) MUST be followed for all non-trivial features. Hotfixes MAY
  bypass specification if they include tests and are tracked retroactively.
- Review MUST verify maintainability, duplication, test coverage, UX consistency,
  performance impact, platform compatibility, and token usage.
- Completion requires all tests and quality checks to pass, including the 90% coverage
  threshold, unless an approved exception is documented with remediation tasks.
- Any constitutional violation MUST be recorded in the implementation plan with the
  simpler alternative considered and the reason it was rejected.

## Governance

This constitution supersedes conflicting project practices, templates, and local
preferences. Amendments require a documented rationale, an impact review for dependent
templates and workflows, and approval by project maintainers before adoption.

Versioning follows semantic versioning:
- MAJOR: Backward-incompatible governance changes, principle removals, or redefinitions.
- MINOR: New principles, new required sections, or materially expanded governance.
- PATCH: Clarifications, wording improvements, and non-semantic refinements.

Compliance review is mandatory during specification, planning, task generation,
implementation, and final validation. Plans and reviews MUST explicitly address all
principles. Non-compliant work MUST either be corrected before completion or documented
as an approved exception with owner, reason, and remediation plan.

**Version**: 1.2.0 | **Ratified**: 2026-05-25 | **Last Amended**: 2026-06-05
