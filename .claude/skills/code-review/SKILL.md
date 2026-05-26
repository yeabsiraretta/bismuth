---
name: code-review
description: "Deep code review: bugs, PRs, best fix, read code first"
---

# Code Review Skill

Review like a senior engineer: high-confidence, evidence-first, code-aware.

## When to Use

- Reviewing PRs or code changes
- Investigating bugs or regressions
- Evaluating proposed fixes
- User requests code review or asks "is this the best fix"

## Review Contract

Always answer these explicitly:

1. **What is being fixed/changed?** Bug, feature, refactor, etc.
2. **Can we identify the root cause?** If yes, where in code and why. If no, what evidence is missing.
3. **For regressions**: Who/what introduced it and when? Include commit/PR provenance when traceable.
4. **Is this the best possible fix** after reading adjacent code?
5. **Would a bigger refactor improve** correctness, clarity, or future maintainability?
6. **What proof exists?** Tests, live repro, CI checks, docs.
7. **What remains risky or unverified?**

## Code Reading Depth

Read past the first touched file. Follow the real call path:

- **Frontend**: Component → service → IPC → backend command
- **Backend**: Command → service → model → database/filesystem
- **Config**: Schema → runtime usage → validation
- **Tests**: Around touched surface + adjacent regression tests

When behavior depends on a dependency, read the upstream docs/source/types before assuming.

## Fix Quality Bar

Good fixes usually:

- **Live at ownership boundary** where the bug belongs
- **Preserve backward compatibility** unless retiring it
- **Add regression test** at smallest meaningful seam
- **Avoid broad special cases**, hidden migrations, semantic sentinels
- **Update docs/changelog** when user-visible behavior changes
- **Fail clearly** in runtime paths; repair through doctor/migration paths

Call out when a fix is only symptom-level. If a slightly larger refactor makes the invariant obvious and reduces future bugs, recommend it.

## Bismuth-Specific Checks

### File Size Compliance
- Check if changes push file over 300-line limit
- If so, recommend refactoring before adding functionality
- Reference: Constitution Principle VI

### Test Coverage
- Verify tests exist for changed behavior
- Check coverage doesn't drop below 90%
- Reference: Constitution Principle II

### UX Impact
- If UI changes, verify UX evaluation was done
- Check against `.claude/ux-evaluator.md` principles
- Reference: Constitution Principle III

### Tech Stack Alignment
- Frontend: Svelte 4.2+ with TypeScript
- Backend: Rust with Tauri 1.5+
- Editor: CodeMirror 6
- Database: SQLite (local)

## Output Template

```markdown
## Code Review: [PR/Issue #]

**Surface**: [component/service/command]
**Type**: [bug fix/feature/refactor]

### Summary
[One or two sentences about what changed]

### Analysis

**Root Cause**: [Code path + confidence level]
**Provenance**: [Introduced by commit/PR/date, or N/A/unknown]

### Evaluation

**Best Fix**: [Yes/No + explanation]
- [Why this approach is/isn't optimal]
- [Alternative if not optimal]

**Refactor Opportunity**: [Yes/No]
- [Specific shape if yes]
- [Why it would improve design]

**Proof Checked**:
- [✓] Tests pass
- [✓] Coverage maintained
- [✓] File size limits respected
- [✓] UX evaluation (if UI changes)

**Risk**: [Remaining uncertainty or gaps]

### Findings

[File/line/symbol references with concrete failure modes]

### Recommendation

[Approve/Request changes/Needs discussion]
```

## Safety Checks

Before approving:

- [ ] No file exceeds 300 lines after changes
- [ ] Tests exist and pass
- [ ] Coverage ≥ 90%
- [ ] UI changes have UX evaluation
- [ ] Docs/changelog updated for user-visible changes
- [ ] No broad special cases or hidden migrations
- [ ] Backward compatibility preserved (unless explicitly retiring)

## References

- Agent rules: `.claude/agent-rules.md`
- Constitution: `.specify/memory/constitution.md`
- File size check: `pnpm check:file-sizes`
- Test coverage: `pnpm test:ci`
