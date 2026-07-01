---
name: ux-review
description: 'Review UI components against 168 UX principles and detect smells'
---

# UX Review Skill

Review UI components, screens, or interfaces against Bismuth's UX principles framework.

## When to Use

- Reviewing new UI component code
- Evaluating design proposals
- PR review with UI changes
- User requests UX feedback or evaluation

## Process

1. **Classify Interface Type**
   - Identify: form, table, navigation, modal, dashboard, settings, etc.
   - Reference: `.claude/component-guide.md` for type mapping

2. **Select Relevant Principles**
   - Always check Part 1 (Cognitive Foundations)
   - Add type-specific parts from `.claude/ux-evaluator.md`

3. **Scan for Violations**
   - **Critical** (-15 points): Blocks task completion, accessibility failure
   - **Warning** (-7 points): Degrades experience, affects metrics
   - **Suggestion** (-3 points): Improvement opportunity

4. **Detect UX Smells**
   - Overloaded Screen (>7 action areas)
   - Form Graveyard (>10 required fields, no inline validation)
   - Silent Errors (no error messages)
   - Mystery Navigation (icon-only, unclear labels)
   - Contrast Blindness (<4.5:1 contrast)
   - Inconsistent Actions (same action named differently)

5. **Score and Report**
   - Start at 100, deduct for violations
   - Bands: 85-100 excellent, 65-84 good, 40-64 fair, 0-39 poor
   - Provide priority fixes list

## Output Format

```markdown
## UX Evaluation: [Component Name]

**Interface Type**: [type]
**Score**: [0-100] ([band])

### Findings

#### Critical Issues

- **Cognitive Load (F.1.1.02)**: [specific issue]
  - **Impact**: [what happens]
  - **Fix**: [concrete remediation]

#### Warnings

- **Fitts's Law (F.4.1.01)**: [specific issue]
  - **Fix**: [remediation]

#### Suggestions

- **Progressive Disclosure (F.3.1.01)**: [opportunity]
  - **Fix**: [improvement]

### Strengths

- [What's done well]

### Priority Fixes

1. [Critical issue 1]
2. [Warning 1]
```

## Bismuth-Specific Standards

### Component Sizing

- Min button size: 40x40px
- Min primary button: 44x44px
- Min icon clickable area: 40x40px with padding

### Cognitive Load Limits

- Sidebar navigation: Max 7 top-level items
- Dropdown menus: Max 9 items (or categorize)
- Toolbar buttons: Max 7 visible (rest in "More")
- Search results: 10 per page
- Tag list: Group after 9 tags

### Required Feedback

- Auto-save: Show "Saved at HH:mm:ss"
- Loading: Spinner or skeleton for >200ms operations
- Errors: Specific message + remediation
- Success: Confirmation for destructive actions

### Accessibility Requirements

- All interactive elements keyboard accessible
- ARIA labels on icon-only buttons
- Focus indicators visible (2px outline)
- Contrast ratio ≥ 4.5:1 for text
- Alt text for images

## References

- Full principles: `docs/standards/ux-principles.md`
- Evaluator guide: `.claude/ux-evaluator.md`
- Component guide: `.claude/component-guide.md`
- Constitution Principle III: UX evaluation required before UI implementation
