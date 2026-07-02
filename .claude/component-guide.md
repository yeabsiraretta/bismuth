# Component Generation Guide

UX-informed requirements for generating Bismuth UI components. Apply these before writing code.

## Component Type → Principles Mapping

| Component           | Primary Principles                     | Key Requirements                                                |
| ------------------- | -------------------------------------- | --------------------------------------------------------------- |
| **Form**            | Cognitive Load, Error Prevention       | Max 7 fields visible, inline validation, clear labels           |
| **Multi-step Form** | Progressive Disclosure, Cognitive Load | 4-5 fields per step, progress indicator, save state             |
| **Data Table**      | Cognitive Load, Hick's Law             | Max 5-7 visible columns, sticky header, row actions in menu     |
| **Navigation**      | Hick's Law, Recognition vs Recall      | Max 7 items, clear labels, active state visible                 |
| **Modal**           | Cognitive Load, Fitts's Law            | Single focus, 44x44px close button, escape key                  |
| **Settings**        | Progressive Disclosure, Recognition    | One section at a time, current state visible, auto-save toggles |
| **Dashboard**       | Cognitive Load, Visual Hierarchy       | Max 5-7 KPI cards, grouped metrics, progressive disclosure      |
| **Empty State**     | Progressive Disclosure, Mental Model   | Clear action, illustration optional, helpful copy               |
| **Search**          | Recognition vs Recall, Mental Model    | Autocomplete, recent searches, clear results                    |

## Generation Requirements by Component

### Forms

```typescript
// Requirements
- Max 7 visible fields (use steps for more)
- Inline validation on blur
- Required fields marked with *
- Error messages specific and actionable
- Submit button disabled until valid
- Labels above fields (not placeholder-only)
- Min 44x44px touch targets
```

**Example prompt**:

```
Create a note metadata form with:
- Title (required, max 200 chars)
- Tags (autocomplete from existing)
- Folder (dropdown, max 9 options)
- Template (optional dropdown)

Requirements:
- Inline validation on blur
- Show character count for title
- Disable save until title filled
- 44x44px minimum button size
- Keyboard: Enter to save, Esc to cancel
```

### Data Tables

```typescript
// Requirements
- Max 5-7 visible columns
- Hide secondary columns in "More" dropdown
- Sticky header for scroll context
- Row actions in kebab menu (not inline)
- Sortable columns with aria-sort
- Pagination with count (not infinite scroll)
- Search/filter prominently placed
```

### Navigation

```typescript
// Requirements
- Max 7 top-level items
- Group related items under expandable sections
- Active state clearly visible
- Icons with text labels (not icon-only)
- Keyboard navigation (arrow keys, Enter)
- aria-current on active item
```

### Modals

```typescript
// Requirements
- Single focus (one modal at a time)
- Close button 44x44px minimum
- Escape key closes
- Focus trap (tab cycles within modal)
- Backdrop click closes (optional)
- aria-modal="true" and role="dialog"
```

## UX Guardrails (Non-Negotiable)

### Cognitive Load

- **Max 7±2 items** in any list, menu, or visible set
- **Group** when exceeding 9 items
- **Progressive disclosure** for advanced options

### Interaction

- **Min 40x40px** for all interactive elements
- **Min 44x44px** for primary actions
- **Immediate feedback** on all user actions
- **Confirmation** for destructive actions

### Accessibility

- **Keyboard navigation** for all features
- **ARIA labels** on icon-only buttons
- **Focus indicators** visible (2px outline)
- **Contrast ≥4.5:1** for text
- **Alt text** for images

### Error Handling

- **Inline validation** on blur (forms)
- **Specific error messages** with remediation
- **Prevent errors** before they happen
- **No silent failures**

## Component Checklist

Before submitting component code, verify:

- [ ] Cognitive load: ≤7 items in lists/menus
- [ ] Button sizes: ≥40px, primary ≥44px
- [ ] Feedback: Immediate response to actions
- [ ] Keyboard: Full keyboard navigation
- [ ] ARIA: Labels on icon buttons
- [ ] Contrast: ≥4.5:1 for text
- [ ] Error prevention: Confirmations for destructive actions
- [ ] Progressive disclosure: Advanced options hidden by default

## Bismuth-Specific Patterns

### Note Editor

- Auto-save with 500ms debounce
- Save indicator: "Saved at HH:mm:ss"
- Wikilink autocomplete from existing notes
- Keyboard: Cmd+S force save, Cmd+K insert link

### File Tree

- Max 7-9 top-level folders visible
- Expand/collapse with arrow keys
- Active note highlighted
- Drag-drop for move operations

### Graph View

- Start simple, add filters progressively
- Max 100 nodes visible initially
- Filter by tag, folder, date range
- Click node to open note

### Search Results

- 10 results per page
- Show context snippet
- Highlight matches
- Filter by folder, tag, date

## Anti-Patterns to Avoid

### ❌ Overloaded Screen

- More than 7 action areas visible
- No clear starting point
- **Fix**: Group into sections, use tabs/accordion

### ❌ Form Graveyard

- More than 10 required fields visible
- No inline validation
- **Fix**: Multi-step wizard, 4-5 fields per step

### ❌ Mystery Navigation

- Icon-only navigation without labels
- Unclear where features are
- **Fix**: Add text labels, use standard patterns

### ❌ Silent Errors

- Errors occur but no message shown
- User doesn't know what went wrong
- **Fix**: Show specific error with remediation

### ❌ Click Cemetery

- 3+ clicks for simple tasks
- Dead-end paths with no outcome
- **Fix**: Reduce steps, add shortcuts

## Tech Stack Integration

### Svelte + Tailwind

```svelte
<!-- Accessible button with proper sizing -->
<button
  class="min-w-[44px] min-h-[44px] px-4 py-2"
  aria-label="Delete note"
  on:click={handleDelete}
>
  <TrashIcon />
</button>

<!-- Form with inline validation -->
<input
  type="text"
  bind:value={title}
  on:blur={validateTitle}
  class="min-h-[44px]"
  aria-invalid={titleError ? 'true' : 'false'}
  aria-describedby={titleError ? 'title-error' : undefined}
/>
{#if titleError}
  <p id="title-error" class="text-red-600">{titleError}</p>
{/if}
```

### TypeScript Types

```typescript
// Component props with UX constraints
interface DataTableProps {
  columns: Column[]; // Max 7 visible
  rows: Row[];
  onSort?: (column: string) => void;
  maxVisibleColumns?: number; // Default 7
}

interface FormProps {
  fields: FormField[]; // Max 7 per step
  onSubmit: (data: FormData) => Promise<void>;
  showInlineValidation?: boolean; // Default true
}
```

## Quick Reference

**Cognitive Load**: Max 7±2 items  
**Hick's Law**: Fewer choices = faster decisions  
**Fitts's Law**: Larger targets = easier clicks (min 40px)  
**Progressive Disclosure**: Hide advanced options  
**Recognition vs Recall**: Show options, don't make users remember  
**Error Prevention**: Validate early, confirm destructive actions

---

## Typography Rules

**Golden rule**: Choose typography by semantic intent, not pixel size.

**Zero redundancy rule**: Buttons, inputs, tabs, and badges manage their own
typography via design tokens. Never apply `.bismuth-heading-*` or `.bismuth-body-*`
to these components.

**Semantic map** (use these classes for human-readable content):

| Class                 | Intended use                                    |
| --------------------- | ----------------------------------------------- |
| `.bismuth-heading-xl` | Page empty states, major system alerts          |
| `.bismuth-heading-lg` | Page H1 — one per screen                        |
| `.bismuth-heading-md` | Section title inside a panel or workspace       |
| `.bismuth-heading-sm` | Card header, sidebar heading, sub-section label |
| `.bismuth-body`       | Standard paragraphs, user content, AI output    |
| `.bismuth-body-sm`    | Captions, helper text, metadata labels          |
| `.bismuth-body-code`  | Entity IDs, exact-match strings, inline code    |
| `.bismuth-caption`    | Fine print, timestamps, supplemental notes      |

**Overflow utilities** — apply only when text breaks its bounding box:

- `.bismuth-truncate` — single-line ellipsis
- `.bismuth-clamp-2` / `.bismuth-clamp-3` — multi-line clamp
- `.bismuth-nowrap` — prevent line break

All classes are defined in `src/lib/styles/typography.css`.

**Last Updated**: 2026-05-26  
**Source**: docs/standards/ux-principles.md
