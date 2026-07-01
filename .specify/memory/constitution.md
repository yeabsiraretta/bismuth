<!--
Sync Impact Report
Version change: 1.3.0 → 1.4.0
Modified principles:
- VI. Code Organization → Expanded with strict folder density limits and layer separation rules
Added:
- Folder density limits (max 8 files per directory before mandating subfolders)
- Explicit layer separation requirements (services, stores, logic, components, types, constants)
- Feature-scoped vs global scope enforcement
- Subfolder creation triggers
Templates requiring updates:
- ⚠ architecture_constitution.md §File Organization (updated in sync)
Follow-up TODOs:
- None
-->
# Bismuth Constitution

## Core Principles

### I. Maintainable Code Quality
All production code MUST be readable, cohesive, and consistent with existing project
patterns. Implementations MUST reuse established utilities, components, and abstractions
before introducing new ones. Duplicate logic MUST be extracted or explicitly justified
when extraction would reduce clarity. New architecture, dependencies, and abstractions
MUST be planned against expected feature evolution to keep bloat low and maintainability
high. **No single code or test file MUST exceed 300 lines** (tolerance to 350 when
splitting harms cohesion). Splitting strategies and barrel re-export requirements are
defined in `architecture_constitution.md`. Rationale: code quality is preserved by
minimizing unnecessary surface area, enforcing focused modules, and making future
changes predictable.

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

### VI. Code Organization, Folder Density, and Layer Separation

Code and test files MUST NOT exceed 300 lines (tolerance to 350). **No directory MUST
contain more than 8 implementation files** before being split into purposeful subfolders.
Each folder MUST have a clear, singular responsibility that is inferable from its name.
Layers MUST be physically separated into distinct directories:

- **services/** — external adapters (IPC wrappers, API clients); no UI logic
- **stores/** — global reactive state; no orchestration or side effects
- **types/** — TypeScript interfaces and type definitions; no runtime code
- **constants/** — shared enums, config objects, route definitions; no logic
- **components/** — UI components grouped by domain (`canvas/`, `sidebar/`, `editor/`)
- **utils/** — pure helper functions; no store/service imports

When a folder grows beyond 8 files, it MUST be split into domain-scoped subfolders
(e.g., `utils/canvas/` not a flat `utils/` with 20 files). Feature-scoped logic (helpers,
orchestration, complex derived state) MUST be co-located with the feature rather than
placed in a global shared folder. Enforceable splitting strategies and module conventions
are defined in `architecture_constitution.md` §File Organization Rules. Rationale:
strict folder density prevents discovery friction, enforces separation of concerns, and
ensures each directory is scannable at a glance.

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
All visual styling MUST use CSS custom properties (design tokens) as the single source
of truth. Components MUST use scoped CSS with `var()` token references — NOT inline
utility classes for visual properties. Enforceable file paths, dark mode mechanism,
import rules, and CodeMirror theme requirements are defined in
`architecture_constitution.md` §Styling Architecture. Rationale: a single token source
prevents drift between themes, ensures consistent styling, and makes global design
changes predictable.

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

### X. Production Release Standards
Before any tagged release, the codebase MUST pass a production readiness gate. This
includes: passing all test coverage thresholds, zero linting errors (ESLint + stylelint),
zero file-size violations, zero Rust clippy warnings, a clean `cargo audit`, a successful
production build with sourcemaps disabled, and verification of the Tauri CSP config.
Dead code detection (`pnpm lint:unused`) MUST be run and reviewed — unexpected unused
exports MUST either be removed or explained. Store mutation ownership MUST be enforced:
components call store action functions, not raw `.set()`/`.update()`. Feature module
barrels MUST use relative imports to preserve module boundaries. Full checklist in
`architecture_constitution.md` §Production Release Checklist.
Rationale: production releases that skip quality gates produce regressions that are hard
to isolate; gate automation removes the human-error surface from release preparation.

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
- **File size limits MUST be enforced automatically** (pre-commit + CI). Enforcement
  details in `architecture_constitution.md` §Validation Hooks.
- **Styling MUST NOT bypass tokens**: All visual values MUST reference CSS custom
  properties. Enforcement details in `architecture_constitution.md` §Styling Architecture.
- **Extensions MUST be used for governed workflows**: Manual lifecycle steps (planning
  without constitution load, implementing without architecture review) MUST be flagged.
- **Store mutations MUST go through named action functions**: Components MUST NOT call
  `.set()` or `.update()` on imported stores directly. Action functions in the store
  file own all mutation logic.
- **Feature barrel imports MUST use relative paths**: `index.ts` barrels MUST import
  from `./stores/`, `./types/`, `./components/` — never from `@/features/<name>/stores/`.
- **Dead code detection is a release gate**: `pnpm lint:unused` (knip) MUST pass
  before every tagged release. Unused exports MUST be removed, not suppressed.

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

**Version**: 1.5.0 | **Ratified**: 2026-05-25 | **Last Amended**: 2026-06-23

**Related Documents**:
- Architecture enforcement: `.specify/memory/architecture_constitution.md`
- Security standards: `.specify/memory/security_constitution.md`
- Memory workflow: `.specify/memory/workflow.md`
