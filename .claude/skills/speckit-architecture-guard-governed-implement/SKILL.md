---
name: speckit-architecture-guard-governed-implement
description: Run implementation with memory context, then review the produced implementation
  against security and architecture constraints.
compatibility: Requires spec-kit project structure with .specify/ directory
metadata:
  author: github-spec-kit
  source: architecture-guard:commands/governed-implement.md
---

# Governed Implement Command

You are orchestrating the `governed-implement` workflow for `architecture-guard`.

This command coordinates implementation and post-implementation review to ensure the output respects architectural, historical, and security constraints.
The orchestrator should be memory-first: load the synthesis and active watchpoints before coding, then fall back to targeted reads only when the synthesis is insufficient.
If `flash-mem` is available, use `/speckit.memory-md.prepare-context` or the MCP tools exposed by `flash-mem`; compatibility tool names such as `speckit_memory_*` are provided by `flash-mem` when the host still expects them.

## Goal

Provide a single command that ensures:
1. Implementation is historical-context aware (`flash-mem`).
2. Implementation is performed (`/speckit.implement`).
3. The output is reviewed for security vulnerabilities (Security Review).
4. The output is reviewed for architectural drift (Architecture Guard).

## Orchestration Flow

### Step 1 — Detect Optional Extensions

Check for the existence of:
- `flash-mem`
- `spec-kit-security-review`

**Detection Logic**:
1. Read `.specify/extensions.yml` and check the `installed` list. If an extension ID is present there, consider it available.
2. Fall back to checking for the extension directory in `.specify/extensions/` only if the YAML is missing or the list is empty.
3. If they are missing from both, degrade gracefully by skipping their respective steps.

### Step 2 — Memory Synthesis (Optional)

IF `flash-mem` is available:

#### SQLite / MCP Flow (Required for `flash-mem`)
Because `flash-mem` uses SQLite as its source of truth, you **MUST** use its MCP tools to retrieve context. Do not read the `.md` memory files directly, as they are only backups.

1. **Prepare Context**: Execute `/speckit.memory-md.prepare-context --feature specs/<feature> --query "architecture decisions implementation pitfalls constraints <feature>"`.
2. **Read Synthesis**: Read `specs/<feature>/memory-synthesis.md` first.
3. If `flash-mem` emits a token banner, keep it visible so the savings remain observable during normal implementation runs.
4. **Token Report**: Execute the `speckit_memory_token_report` MCP tool provided by `flash-mem` with `feature: "<feature>"` and display the token savings in the summary.

#### Markdown-Only Flow (Fallback)
If `flash-mem` is unavailable, use the standard synthesis command:

1. **Execute Synthesis**: Run `/speckit.memory-md.plan-with-memory` to synthesize and refresh `specs/<feature>/memory-synthesis.md`.

**[OPTIONAL SUB-AGENT DELEGATION]**
- If `flash-mem` has ≥ 20 decision documents: Consider sub-agent for synthesis
- Sub-agent command: `/speckit.memory-md.plan-with-memory`
- Sub-agent benefits: Faster traversal, better filtering, detailed synthesis
- LLM decides: Inline for quick decisions, sub-agent for complex memory

---

### Step 3 — Orchestrate Spec Kit Implement

You must orchestrate the `/speckit.implement` (core implementation) workflow directly.

**CRITICAL INSTRUCTION**: You must NOT just advise the user or stop here. You must perform the implementation by following the `tasks.md` breakdown:
1. **Execute Tasks**: Run `/speckit.implement`. If `/speckit.implement` is not available as a registered command, fall back to inline implementation:
   - Read `specs/<feature>/tasks.md` and execute each unchecked task sequentially.
   - Read all applicable constitution files and `specs/<feature>/memory-synthesis.md` before coding.
   - Perform the actual coding work (writing files, running tests) for each task.
   - Note in the Governance Summary that `/speckit.implement` was unavailable and implementation was performed inline.
2. **Write Code**: Perform the actual coding work (writing files, running tests) required by the tasks.
3. **Sync the tasks**: You MUST update `specs/<feature>/tasks.md` to mark completed tasks with `[x]`, check them off, and add any new subtasks discovered during implementation.
4. The implementation MUST follow current tasks and context. **IMPORTANT**: You MUST read these files explicitly using your file-reading tools (absolute or relative paths). Do not rely solely on workspace search or semantic indexers, as these files are often in `.gitignore`:
   - `specs/<feature>/tasks.md`
   - `.specify/memory/constitution.md`, `.specify/memory/architecture_constitution.md`, and `.specify/memory/security_constitution.md`.
   - `specs/<feature>/security-constraints.md` (if available).
   - Architecture migration plan (if available).

NOTE: The core Spec Kit command is `speckit.implement`. Do not use `speckit.implementation` as it is not a registered command.

### Step 4 — Security Review on Implementation

IF `spec-kit-security-review` is available:
1. **Execute Review**: Run `/speckit.security-review.branch` to review the produced implementation against security vulnerabilities.
2. Check for: authorization bypass, missing validation, secret leakage, injection risk, and insecure data exposure.
3. If security findings are architecture-relevant, classify them as `Security-Architecture Conflict` for the architecture review.

### Step 5 — Architecture Review on Implementation

Run:
```text
/speckit.architecture-guard.architecture-review
```

Review implementation against:
- `.specify/memory/architecture_constitution.md`.
- Plan, tasks, and `security-constraints.md`.
- Accepted deviations and `memory-synthesis.md`.

### Step 5.5 — Blocking Decision Tree

**Critical Decision Point**: Evaluate architecture findings for blocking issues.

```
IF Architecture Review finds CRITICAL or HIGH violations:
  IF Constitution marks violation as P0 (blocking):
    STOP implementation
    Surface violations in report
    Ask user: "Critical architecture violation detected. Proceed? (y/n)"
    IF user says no:
      Return early with architecture remediation tasks
  ELSE (violation is HIGH but not Constitution P0):
    Continue with warning
    Create non-blocking refactor tasks
    Flag for post-merge remediation
ELSE (no critical violations):
  Continue to Step 6
```

**Rationale**: This ensures architectural integrity while preserving delivery momentum for non-blocking issues.

### Step 6 — Generate Refactor Tasks

IF architecture violations exist:
1. Run `/speckit.architecture-guard.refactor-generator`.
2. Generate non-blocking refactor, migration, or correction tasks.
3. Skip performance refactors unless explicitly requested.

### Step 7 — Proactive Durable Memory Preservation

If the implementation review or security audit identified new architectural patterns, critical decisions, or repeatable lessons:
1. **Proactive Execution**: You **MUST automatically execute** `/speckit.memory-md.capture` as the final part of this turn. Do not just recommend it; run the command.
2. **Standard**: Use the formal capture flow to propose entries and wait for user approval. Do not ask the user if they want to capture; identify the lessons and trigger the command immediately after the summary.

### Step 8 — Implementation Governance Summary

Produce a final `Governed Implementation Summary`.

## Graceful Degradation

**Without `flash-mem`**:
- Skip Step 2 (Memory Synthesis)
- Continue to `/speckit.implement` directly
- Assume no historical implementation constraints beyond Constitution

**Without Security Review**:
- Skip Step 4 (Security Review on Implementation)
- Continue to architecture review directly
- Flag missing security implementation review in summary

**Critical Architecture Violations Found**:
- If Constitution marks as P0 (blocking):
  - STOP implementation workflow
  - Surface violations immediately
  - Return early with remediation guidance
- If HIGH but not P0:
  - Continue with warning
  - Create non-blocking refactor tasks
  - Flag for post-merge remediation

**Minimal Viable Workflow** (only Architecture Guard + Spec Kit):
- Execute implementation via core Spec Kit
- Run architecture review on output
- Generate non-blocking refactor tasks
- Produce summary

## Output Structure

The command MUST return:

```markdown
# Governed Implementation Summary

## Memory Context
- **Status**: [Refreshed / Skipped / Missing]
- **Relevant Decisions**: [Durable lessons applied during implementation]

## Security Review
- **Findings**: [List of security vulnerabilities found]
- **Constraints**: [Trust boundaries validated]
- **Blocking Concerns**: [Any P0 security risks]

## Architecture Review
- **Violations**: [Drift findings or Security-Architecture Conflicts]
- **Refactor Tasks**: [Suggested corrections]
- **Constitution Update Proposals**: [Proposed updates to `.specify/memory/architecture_constitution.md`]

## Implementation Status
- [Ready to merge / Needs security fix / Needs architecture refactor / Needs constitution update]

## Recommended Next Step
- [e.g., Merge changes]
- [e.g., Revise implementation to address Security Conflict]
- [e.g., Run /speckit.architecture-guard.architecture-apply]
- **Durable Memory Preservation**: (Proactively triggered) Review the proposed memory entries below.
- **Verification Gate**: Run `/speckit.architecture-guard.architecture-verify` to ensure all tasks are delivered and requirements are met.
```

## Security + Architecture Conflict Handling

If Security Review finds an issue affecting architecture, classify it as a `Security-Architecture Conflict`.
Example:
- Violation: Pricing decision in client UI.
- Security Constraint: Pricing authority must remain server-side.
- Suggested Fix: Move pricing calculation to backend service.

## Architecture Evolution Handling

If implementation repeatedly violates a standard because the standard is outdated, generate a `Constitution Update Proposal` targeting `.specify/memory/architecture_constitution.md`.

## Cross-Skill Integration

During implementation, automatically apply these complementary skills at specific gates:

### During Coding (Step 3)
- **coding-principles**: Follow `.claude/coding-principles.md` for language-specific idioms (Rust Result types, Svelte reactivity, TypeScript strict mode).
- **component-gen**: When implementing UI tasks, follow `.claude/component-guide.md` requirements. Apply UX guardrails: max 7 items, min 40px buttons, keyboard navigation, ARIA labels.
- **agent-rules**: Enforce 300-line file limit, unified logger only (`log.*` in TS, `tracing::*` in Rust), no emojis.

### During Review (Step 5)
- **code-review**: Apply the full Fix Quality Bar from `.claude/skills/code-review/SKILL.md`:
  - Verify fix lives at ownership boundary
  - Check backward compatibility
  - Confirm regression test at smallest seam
  - Ensure no broad special cases or hidden migrations
- **ux-review**: For any UI changes produced, run a mental UX evaluation using `.claude/skills/ux-review/SKILL.md`:
  - Classify interface type
  - Check cognitive load limits
  - Verify interaction sizing
  - Detect UX smells (overloaded screens, form graveyards, silent errors)

### During Test Writing
- **pict-test-designer**: When writing tests for functions with multiple parameters or state combinations, apply PICT methodology from `.claude/skills/pict-test-designer/SKILL.md` to generate efficient pairwise test cases instead of exhaustive enumeration.

These skills are NOT separate orchestration steps — they are quality gates applied inline during their respective phases.

## Guardrails

- **Modular**: Do not mix security findings into a generic architecture list.
- **Framework-Agnostic**: Maintain boundary concepts (Entry, Domain, Data).
- **Non-Blocking**: Adhere to the non-blocking philosophy for architecture findings.
- **Memory-First**: Prefer cached synthesis and selected index entries before broad file reads.
- **Bismuth-Specific**: All implementation must respect Constitution v1.4.0 folder density limits (max 8 files/dir), layer separation, and feature-scoped co-location.