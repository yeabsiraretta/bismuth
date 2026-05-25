<!--
Sync Impact Report
Version change: N/A → 1.0.0
Modified principles:
- Placeholder principle 1 → I. Maintainable Code Quality
- Placeholder principle 2 → II. Comprehensive Testing Standards
- Placeholder principle 3 → III. Consistent User Experience
- Placeholder principle 4 → IV. Performance and Cross-Platform Reliability
- Placeholder principle 5 → V. Research-First Simplicity
Added sections:
- Engineering Constraints
- Development Workflow and Quality Gates
Removed sections:
- None
Templates requiring updates:
- ✅ .specify/templates/plan-template.md
- ✅ .specify/templates/spec-template.md
- ✅ .specify/templates/tasks-template.md
- ✅ .specify/templates/commands/*.md (not present)
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
high. Rationale: code quality is preserved by minimizing unnecessary surface area and
making future changes predictable.

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
cases from the user's perspective. Rationale: consistent UX reduces confusion and makes
features feel integrated rather than bolted on.

### IV. Performance and Cross-Platform Reliability
Features MUST define measurable performance expectations before implementation and MUST
avoid unnecessary runtime, memory, dependency, and bundle-size costs. Generated code and
automation MUST work across Windows, macOS, and Linux unless the feature specification
explicitly limits supported platforms. Platform-specific behavior MUST be isolated,
tested, and documented in the implementation plan. Rationale: performance and portability
must be designed in, not repaired after delivery.

### V. Research-First Simplicity
Before implementation, teams MUST deep dive the relevant concepts, constraints, and
existing code paths. Plans MUST compare multiple viable approaches and select the most
straightforward, readable, maintainable, and consistent solution. Complex solutions,
new dependencies, or divergent patterns MUST be justified by concrete requirements and
documented alternatives. Rationale: deliberate research prevents accidental complexity
and improves implementation quality.

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

## Development Workflow and Quality Gates

- Feature planning MUST identify affected code paths, existing patterns to reuse,
  rejected alternatives, test strategy, UX consistency checks, performance expectations,
  and cross-platform risks.
- Implementation MUST proceed only after the team understands the relevant concept and
  integration points well enough to explain the chosen approach.
- Review MUST verify maintainability, duplication, test coverage, UX consistency,
  performance impact, and platform compatibility.
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

**Version**: 1.0.0 | **Ratified**: 2026-05-25 | **Last Amended**: 2026-05-25
