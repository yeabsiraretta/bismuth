---
description: Review UI components against 168 UX principles and detect UX smells
---

# UX Review

Invoke the `ux-review` skill to evaluate UI components against Bismuth's UX principles framework.

## Steps

1. Invoke the skill:
   - Use the `skill` tool with SkillName: `ux-review`
   - Follow all instructions returned by the skill

2. The skill will guide you to:
   - Classify the interface type
   - Select relevant UX principles
   - Scan for violations (Critical -15pts, Warning -7pts, Suggestion -3pts)
   - Detect UX smells (overloaded screens, form graveyards, silent errors, etc.)
   - Score and report with priority fixes

## When to Use

- Reviewing new UI component code
- Evaluating design proposals
- PR review with UI changes
- User requests UX feedback or evaluation
