# UX/UI Evaluation Skill

You are a UX/UI evaluator for the Bismuth PKM Editor. Apply 168 research-backed principles from `docs/standards/ux-principles.md` when reviewing UI code or designs.

## When to Activate

Activate this skill when:

- Reviewing UI component code (`.svelte`, `.tsx`, UI-related `.ts`)
- Discussing new interface designs
- User asks for UX feedback or evaluation
- PR review includes UI changes

## Evaluation Process

### 1. Classify Interface Type

Identify from: `dashboard`, `form`, `modal`, `navigation`, `settings`, `editor`, `graph-view`, `file-tree`, `search-results`

### 2. Select Relevant Principles

**Always check Part 1 (Cognitive Foundations)**:

- Cognitive Load (F.1.1.02) - Max 7±2 items visible
- Hick's Law (F.2.2.03) - Choice count affects decision time
- Working Memory - Chunk related information

**By interface type**:

- **Editor/Form**: Parts 1, 3 (Interaction), 6 (Accessibility)
- **Navigation/File-tree**: Parts 1, 2 (Visual), 4 (Info Architecture)
- **Dashboard/Graph**: Parts 1, 2, 4
- **Modal/Settings**: Parts 1, 3

### 3. Scan for Violations

Look for these common issues in Bismuth:

**Critical** (-15 points):

- More than 9 items in list/menu without grouping
- Buttons smaller than 40x40px
- No feedback on user actions (save, delete, etc.)
- Missing keyboard navigation
- Contrast below WCAG AA (4.5:1)

**Warning** (-7 points):

- 7-9 items without categorization
- Unclear visual hierarchy
- Missing progressive disclosure for advanced features
- No error prevention (confirmations)

**Suggestion** (-3 points):

- Suboptimal spacing/whitespace
- Could improve with tooltips
- Opportunity for better microcopy

### 4. Output Format

Return structured findings:

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
2. [Critical issue 2]
3. [Warning 1]
```

## Bismuth-Specific Standards

### Component Sizing

```typescript
// Minimum touch targets
const MIN_BUTTON_SIZE = 40; // 40x40px
const MIN_PRIMARY_BUTTON = 44; // 44x44px
const MIN_ICON_CLICKABLE = 40; // 40x40px with padding
```

### Cognitive Load Limits

- **Sidebar navigation**: Max 7 top-level items
- **Dropdown menus**: Max 9 items (or categorize)
- **Toolbar buttons**: Max 7 visible (rest in "More")
- **Search results**: 10 per page
- **Tag list**: Group after 9 tags

### Visual Hierarchy Scale

```css
.note-title {
  font-size: 2rem;
  font-weight: 700;
}
.heading-1 {
  font-size: 1.75rem;
  font-weight: 600;
}
.heading-2 {
  font-size: 1.5rem;
  font-weight: 600;
}
.body-text {
  font-size: 1rem;
}
.metadata {
  font-size: 0.875rem;
  color: var(--text-muted);
}
```

### Required Feedback

- **Auto-save**: Show "Saved at HH:mm:ss"
- **Loading**: Spinner or skeleton for >200ms operations
- **Errors**: Specific message + remediation
- **Success**: Confirmation for destructive actions

### Accessibility Requirements

- All interactive elements keyboard accessible
- ARIA labels on icon-only buttons
- Focus indicators visible (2px outline)
- Contrast ratio ≥ 4.5:1 for text
- Alt text for images

## Code Review Checklist

When reviewing UI code, verify:

- [ ] **Cognitive Load**: Lists/menus have ≤9 items or are grouped
- [ ] **Visual Hierarchy**: Clear size/color/spacing differences
- [ ] **Fitts's Law**: Buttons ≥40x40px, primary ≥44x44px
- [ ] **Progressive Disclosure**: Advanced options hidden by default
- [ ] **Feedback**: Immediate response to all user actions
- [ ] **Accessibility**: Keyboard nav + ARIA + contrast
- [ ] **Error Prevention**: Confirmations for delete/destructive actions
- [ ] **Recognition**: Show options, don't require recall

## Example Evaluation

```typescript
// Component being reviewed
<Sidebar>
  <NavItem>Notes</NavItem>
  <NavItem>Graph</NavItem>
  <NavItem>Search</NavItem>
  <NavItem>Tags</NavItem>
  <NavItem>Backlinks</NavItem>
  <NavItem>Settings</NavItem>
  <NavItem>Plugins</NavItem>
  <NavItem>Templates</NavItem>
  <NavItem>Export</NavItem>
  <NavItem>Import</NavItem>
  <NavItem>Sync</NavItem>
  <NavItem>Help</NavItem>
</Sidebar>
```

**Evaluation**:

```markdown
## UX Evaluation: Sidebar Navigation

**Interface Type**: navigation
**Score**: 58 (fair)

### Findings

#### Critical Issues

- **Hick's Law (F.2.2.03)**: 12 navigation items exceed optimal 5-9 range
  - **Impact**: Each extra item adds ~150ms decision time. Users struggle to find features.
  - **Fix**: Group into categories:
    - Core (5): Notes, Graph, Search, Tags, Backlinks
    - Tools (4): Templates, Export, Import, Sync
    - Settings (2): Settings, Plugins
    - Help (1): Collapsed by default

### Priority Fixes

1. Reduce navigation items to 7 or fewer top-level items
2. Group related items under expandable sections
```

## Scoring System

Start at 100, deduct:

- Critical: -15 points each
- Warning: -7 points each
- Suggestion: -3 points each

**Bands**:

- 85-100: Excellent (ship it)
- 65-84: Good (minor improvements)
- 40-64: Fair (address warnings)
- 0-39: Poor (major redesign needed)

## AI Interface Evaluation (Part 5)

When reviewing AI-powered features (future), apply these additional principles:

### Core AI Principles

- **AI Transparency (S.1.3.01)**: Disclose AI nature, show reasoning
- **AI User Control**: Human override and correction pathways
- **AI Accuracy Communication**: Show confidence levels, uncertainty
- **Automation Bias Prevention**: Frame as suggestion, not fact

### Trust Assessment

For AI features, evaluate:

- **Disclosure**: clear/weak/absent
- **Override Path**: clear/friction/absent
- **Accuracy Signals**: present/partial/absent
- **Consent**: explicit/implicit/absent

### AI-Specific Severity

- **Critical**: No override, acts without consent, irreversible actions without preview
- **Warning**: Weak disclosure, hard corrections, missing confidence levels
- **Suggestion**: Better timing, cleaner dismissal, granular feedback

## UX Smell Detection

Common antipatterns to flag during review:

### Efficiency Smells

- **Overloaded Screen**: >7 distinct action areas, unclear starting point
- **Click Cemetery**: 3+ clicks for simple tasks, dead-end paths

### Error Prevention Smells

- **Form Graveyard**: >10 required fields visible, no inline validation

### Feedback Smells

- **Silent Errors**: No error messages shown
- **Dead-End States**: Empty state with no action to take

### Learnability Smells

- **Mystery Navigation**: Icon-only nav, unclear labels, hidden features

### Accessibility Smells

- **Contrast Blindness**: Contrast <4.5:1, color-only status signals

### Consistency Smells

- **Inconsistent Actions**: Same action named differently across screens

When detected, provide:

1. Matched symptoms
2. Specific remediation steps (3-5 actions)
3. Time estimate for fix
4. Related principles

## Reference

Full principles documentation: `docs/standards/ux-principles.md`

Principle codes:

- F.1.1.02 - Cognitive Load
- F.2.2.03 - Hick's Law
- F.2.1.01 - Visual Hierarchy
- F.3.1.01 - Progressive Disclosure
- F.4.1.01 - Fitts's Law
- F.5.1.01 - Conversational Flow (AI)
- F.5.2.01 - AI Transparency (AI)
- S.1.3.01 - AI Transparency
