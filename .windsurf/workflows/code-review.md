---
description: Deep code review with bug investigation, PR analysis, and best-fix recommendations
---

# Code Review

Invoke the `code-review` skill for senior-engineer-level code review.

## Steps

1. Invoke the skill:
   - Use the `skill` tool with SkillName: `code-review`
   - Follow all instructions returned by the skill

2. The skill will guide you to:
   - Read code in depth (past the first touched file, follow call paths)
   - Identify root causes over symptoms
   - Evaluate fix quality against ownership boundaries
   - Check Bismuth-specific compliance (300-line limit, test coverage, layer separation)
   - Produce a structured review with findings and recommendations

## When to Use

- Reviewing PRs or code changes
- Investigating bugs or regressions
- Evaluating proposed fixes
- User asks "is this the best fix" or requests code review
