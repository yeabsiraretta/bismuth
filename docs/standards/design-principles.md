# Bismuth Design Principles

## Core Philosophy

**Plain. Descriptive. Consistent.**

Every design decision prioritizes:
1. **Clarity over decoration** - Plain text labels, no unnecessary embellishments
2. **Simplicity over complexity** - 2-3 colors maximum, high contrast
3. **Consistency over variety** - Reuse components, standardize patterns
4. **Function over form** - Design serves usability, not aesthetics

---

## Color Palette (Maximum 3 Colors)

### Primary Palette
```css
/* Neutral Base (Gray Scale) */
--color-bg: #ffffff           /* Background */
--color-surface: #f8f9fa      /* Cards, panels */
--color-border: #dee2e6       /* Borders, dividers */
--color-text: #212529         /* Primary text */
--color-text-muted: #6c757d   /* Secondary text */

/* Accent (Blue) */
--color-primary: #0d6efd      /* Primary actions, links */
--color-primary-hover: #0b5ed7

/* Semantic (Minimal) */
--color-danger: #dc3545       /* Destructive actions only */
```

### Usage Rules
- **Never use more than 3 colors** in a single view
- **High contrast required**: Text must be WCAG AA compliant (4.5:1 minimum)
- **No gradients, shadows, or effects** unless absolutely necessary
- **Semantic colors** (danger) only for critical actions

---

## Typography

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

### Hierarchy (Plain Text Only)
```css
/* Headings */
h1: 1.5rem, font-weight: 600, color: var(--color-text)
h2: 1.25rem, font-weight: 600, color: var(--color-text)
h3: 1.125rem, font-weight: 600, color: var(--color-text)

/* Body */
body: 0.875rem, font-weight: 400, line-height: 1.5
small: 0.75rem, font-weight: 400, color: var(--color-text-muted)

/* Interactive */
button: 0.875rem, font-weight: 500
link: 0.875rem, font-weight: 400, color: var(--color-primary)
```

### Rules
- **No bold unless it's a heading or button**
- **No italics** - use color differentiation instead
- **No uppercase transformation** - write labels in sentence case
- **No custom fonts** - system fonts only

---

## Spacing System

### Scale (8px base unit)
```css
--space-1: 0.25rem  /* 4px  - tight */
--space-2: 0.5rem   /* 8px  - small */
--space-3: 0.75rem  /* 12px - medium */
--space-4: 1rem     /* 16px - standard */
--space-6: 1.5rem   /* 24px - large */
--space-8: 2rem     /* 32px - extra large */
```

### Application
- **Padding**: Use space-3 (12px) for buttons, space-4 (16px) for cards
- **Margins**: Use space-4 (16px) between sections, space-2 (8px) between related items
- **Gaps**: Use space-2 (8px) for inline elements, space-4 (16px) for blocks

---

## Component Standards

### Buttons

**Primary Button** (Single action per view):
```svelte
<button class="btn btn-primary">
  <Icon name="plus" size={16} />
  <span>Create note</span>
</button>
```

**Secondary Button** (Alternative actions):
```svelte
<button class="btn">
  <Icon name="folder-open" size={16} />
  <span>Open vault</span>
</button>
```

**Danger Button** (Destructive actions only):
```svelte
<button class="btn btn-danger">
  <Icon name="trash" size={16} />
  <span>Delete</span>
</button>
```

**Styles**:
```css
.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
  cursor: pointer;
}

.btn:hover {
  background: var(--color-border);
}

.btn-primary {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background: var(--color-primary-hover);
}

.btn-danger {
  background: var(--color-danger);
  border-color: var(--color-danger);
  color: white;
}
```

### Lists

**Standard List** (No bullets, plain text):
```svelte
<ul class="list">
  {#each items as item}
    <li class="list-item" class:active={isActive(item)}>
      <button class="list-button">
        <Icon name="file" size={16} />
        <span class="list-label">{item.title}</span>
      </button>
    </li>
  {/each}
</ul>
```

**Styles**:
```css
.list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.list-item {
  border-bottom: 1px solid var(--color-border);
}

.list-item.active {
  background: var(--color-surface);
}

.list-button {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
}

.list-button:hover {
  background: var(--color-surface);
}

.list-label {
  font-size: 0.875rem;
  color: var(--color-text);
}
```

### Forms

**Input Field**:
```svelte
<div class="form-group">
  <label class="form-label">Note name</label>
  <input type="text" class="form-input" placeholder="Enter name" />
</div>
```

**Styles**:
```css
.form-group {
  margin-bottom: var(--space-4);
}

.form-label {
  display: block;
  margin-bottom: var(--space-2);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
}

.form-input {
  width: 100%;
  padding: var(--space-3);
  background: white;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 0.875rem;
  color: var(--color-text);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
}
```

### Modals

**Structure**:
```svelte
<div class="modal-overlay">
  <div class="modal">
    <h3 class="modal-title">Delete note?</h3>
    <p class="modal-text">This action cannot be undone.</p>
    <div class="modal-actions">
      <button class="btn">Cancel</button>
      <button class="btn btn-danger">Delete</button>
    </div>
  </div>
</div>
```

**Styles**:
```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal {
  background: white;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: var(--space-6);
  min-width: 400px;
  max-width: 600px;
}

.modal-title {
  margin: 0 0 var(--space-4) 0;
  font-size: 1.125rem;
  font-weight: 600;
}

.modal-text {
  margin: 0 0 var(--space-6) 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.modal-actions {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
}
```

---

## Icon Usage

### Rules
- **16px default size** for inline icons
- **20px for standalone** icons (toolbar, headers)
- **Stroke width: 2** (consistent line thickness)
- **Color: currentColor** (inherits text color)
- **No decorative icons** - every icon must have a function

### Standard Icons
```
file          - Document/note
folder        - Directory/vault
folder-open   - Active directory
plus          - Create/add
trash         - Delete
edit          - Modify
save          - Save changes
search        - Search/find
x             - Close/cancel
check         - Confirm/success
alert-circle  - Warning/error
```

---

## Layout Patterns

### Application Shell
```css
.app {
  display: flex;
  height: 100vh;
}

.sidebar {
  width: 240px;
  border-right: 1px solid var(--color-border);
  background: var(--color-surface);
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.toolbar {
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border);
  background: white;
}

.content {
  flex: 1;
  padding: var(--space-6);
  overflow-y: auto;
}
```

### Grid (For canvas/dashboard)
```css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-4);
}
```

---

## Forbidden Patterns

### ❌ DO NOT USE
- Gradients
- Drop shadows (except modals: `box-shadow: 0 2px 8px rgba(0,0,0,0.1)`)
- Rounded corners >4px
- Animations (except loading spinners)
- Hover effects beyond background color change
- More than 3 colors in a view
- Emojis in UI
- Custom fonts
- Bold text outside headings/buttons
- Uppercase text transformation
- Decorative icons

### ✅ DO USE
- Plain text labels
- High contrast colors
- System fonts
- Consistent spacing
- Reusable components
- Semantic HTML
- ARIA labels
- Keyboard navigation

---

## Accessibility Requirements

### Contrast
- **Text**: 4.5:1 minimum (WCAG AA)
- **Large text**: 3:1 minimum
- **Interactive elements**: 3:1 minimum

### Focus States
```css
*:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

### Keyboard Navigation
- All interactive elements must be keyboard accessible
- Tab order must be logical
- Escape closes modals
- Enter submits forms

### Screen Readers
- Use semantic HTML (`<button>`, `<nav>`, `<main>`)
- Add ARIA labels where needed
- Announce state changes

---

## Component Checklist

Before creating a component:
- [ ] Uses maximum 3 colors
- [ ] Plain text labels (no decoration)
- [ ] System font only
- [ ] Spacing from 8px scale
- [ ] High contrast (4.5:1 minimum)
- [ ] Reuses existing patterns
- [ ] Keyboard accessible
- [ ] ARIA labels added
- [ ] No shadows/gradients/effects
- [ ] Documented in this file

---

## Migration from Current Design

### Changes Required

**Color Variables** (Update `App.svelte`):
```css
:root {
  --color-bg: #ffffff;
  --color-surface: #f8f9fa;
  --color-border: #dee2e6;
  --color-text: #212529;
  --color-text-muted: #6c757d;
  --color-primary: #0d6efd;
  --color-primary-hover: #0b5ed7;
  --color-danger: #dc3545;
}
```

**Remove**:
- `--bg-active: #e3f2fd` (use `--color-surface` instead)
- `--success-bg`, `--warning-bg` (not needed)
- All gradient backgrounds
- Box shadows except modals

**Typography** (Update all components):
- Reduce font sizes (1.75rem → 1.5rem for h1)
- Remove font-weight: 700 (use 600 max)
- Standardize to 0.875rem body text

**Spacing** (Update all components):
- Replace arbitrary values with space scale
- `padding: 1rem` → `padding: var(--space-4)`
- `gap: 0.5rem` → `gap: var(--space-2)`

**Components** (Update):
- VaultPicker: Remove gradient, simplify
- FileTree: Plain list, no active highlight color
- Toolbar: Reduce button padding
- NoteEditor: Plain textarea, no fancy styling

---

## Examples

### Before (Current)
```svelte
<div class="vault-picker" style="background: linear-gradient(...)">
  <h1 style="font-size: 2.5rem; font-weight: 700">Welcome to Bismuth</h1>
  <button class="btn-primary" style="box-shadow: 0 4px 12px...">
    <span style="font-size: 1.3rem">✨</span>
    Create New Vault
  </button>
</div>
```

### After (Principles Applied)
```svelte
<div class="vault-picker">
  <h1>Welcome to Bismuth</h1>
  <button class="btn btn-primary">
    <Icon name="plus" size={16} />
    <span>Create vault</span>
  </button>
</div>
```

---

## Rationale

**Why plain text?**
- Faster to read
- Easier to translate
- Better for accessibility
- Reduces cognitive load

**Why 2-3 colors?**
- Prevents visual clutter
- Improves focus
- Easier to maintain
- Better for colorblind users

**Why system fonts?**
- Faster load times
- Native OS feel
- No licensing issues
- Consistent across platforms

**Why no effects?**
- Reduces complexity
- Improves performance
- Easier to implement
- Timeless design

---

## Resources

- **Contrast Checker**: https://webaim.org/resources/contrastchecker/
- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **System Fonts**: https://systemfontstack.com/
- **Icon Library**: Feather Icons (https://feathericons.com)
