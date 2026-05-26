# Bismuth Design System

## Philosophy

**Plain. Descriptive. Consistent.**

The design system prioritizes:
1. **Clarity over decoration** - Plain text labels, no unnecessary embellishments
2. **Simplicity over complexity** - 2-3 colors maximum, high contrast
3. **Consistency over variety** - Reuse components, standardize patterns
4. **Function over form** - Design serves usability, not aesthetics
5. **Canvas-ready** - Documents can be embedded/extracted easily

**See**: `DESIGN_PRINCIPLES.md` for complete guidelines

---

## Color System

### CSS Variables (Light Theme)
```css
--bg-primary: #ffffff       /* Main background */
--bg-secondary: #f5f5f5     /* Sidebar, secondary areas */
--bg-hover: #f0f0f0         /* Hover states */
--bg-active: #e3f2fd        /* Active/selected items */

--text-primary: #333        /* Main text */
--text-muted: #666          /* Secondary text */

--border-color: #ddd        /* Borders, dividers */
--accent-color: #007bff     /* Primary actions */

--success-bg: #d4edda       /* Success states */
--success-text: #155724
--warning-bg: #fff3cd       /* Warning states */
--warning-text: #856404
```

### Usage
- Always use CSS variables, never hardcoded colors
- Enables easy theme switching (dark mode future)
- Consistent across all components

---

## Icon System

### Icon Component (`src/lib/components/icons/Icon.svelte`)

**Props**:
- `name: string` - Icon identifier
- `size: number = 20` - Size in pixels
- `color: string = 'currentColor'` - Stroke color
- `strokeWidth: number = 2` - Line thickness

**Available Icons**:

**File Operations**:
- `file` - Document icon
- `file-plus` - Create new file
- `folder` - Folder icon
- `folder-open` - Open folder

**Actions**:
- `plus` - Add/create
- `trash` - Delete
- `edit` - Edit/modify
- `save` - Save
- `check` - Confirm/success
- `x` - Close/cancel

**Navigation**:
- `chevron-right` - Expand/next
- `chevron-down` - Collapse/dropdown
- `search` - Search

**Status**:
- `loader` - Loading spinner
- `alert-circle` - Warning/error

**Canvas/Editor**:
- `layout` - Layout/grid
- `maximize` - Expand view
- `minimize` - Collapse view

### Usage Example
```svelte
<Icon name="file-plus" size={18} />
<Icon name="folder-open" size={24} color="var(--accent-color)" />
```

### Adding New Icons
1. Find Feather icon path from https://feathericons.com
2. Add to `icons` object in `Icon.svelte`
3. Use descriptive kebab-case name

---

## Typography

### Hierarchy
```css
h1: 1.75rem, font-weight: 600  /* Page titles */
h2: 1.1rem, font-weight: 600   /* Section headers */
h3: 1.3rem, font-weight: 600   /* Modal titles */

body: 1rem, line-height: 1.6   /* Main content */
small: 0.875rem                /* Helper text */
```

### Font Stack
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

---

## Component Patterns

### Buttons

**Primary Button**:
```svelte
<button class="btn btn-primary">
  <Icon name="plus" size={18} />
  <span>Create</span>
</button>
```

**Secondary Button**:
```svelte
<button class="btn btn-secondary">
  <Icon name="folder-open" size={18} />
  <span>Open</span>
</button>
```

**Danger Button**:
```svelte
<button class="btn btn-danger">
  <Icon name="trash" size={18} />
  <span>Delete</span>
</button>
```

**Styles**:
```css
.btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
```

### Modals

**Structure**:
```svelte
<div class="modal-overlay">
  <div class="modal">
    <h3>Modal Title</h3>
    <p>Content</p>
    <div class="modal-actions">
      <button class="btn btn-secondary">Cancel</button>
      <button class="btn btn-primary">Confirm</button>
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
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  min-width: 400px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}
```

### Lists

**File/Note List**:
```svelte
<ul class="note-list">
  {#each items as item}
    <li class="note-item" class:active={isActive(item)}>
      <button class="note-button">
        <Icon name="file" size={16} />
        <span class="note-title">{item.title}</span>
      </button>
    </li>
  {/each}
</ul>
```

---

## Canvas Integration Guidelines

### Document Structure for Canvas

**Markdown Note Format** (canvas-compatible):
```markdown
---
id: 202405261130
title: Note Title
tags: [tag1, tag2]
created: 2024-05-26T11:30:00Z
modified: 2024-05-26T11:35:00Z
---

# Note Title

Content here...

## References
[#citekey]: Author (Year): Title, Publisher.
```

### Canvas Embedding

**Note Card Component** (for canvas):
```svelte
<div class="canvas-card" data-note-id="{note.id}">
  <div class="card-header">
    <Icon name="file" size={16} />
    <h4>{note.title}</h4>
  </div>
  <div class="card-content">
    {note.preview}
  </div>
  <div class="card-footer">
    <span class="timestamp">{note.modified}</span>
  </div>
</div>
```

### Data Exchange Format

**Export to Canvas** (JSON):
```json
{
  "type": "bismuth-note",
  "version": "1.0",
  "id": "202405261130",
  "title": "Note Title",
  "content": "Markdown content...",
  "metadata": {
    "tags": ["tag1", "tag2"],
    "created": "2024-05-26T11:30:00Z",
    "modified": "2024-05-26T11:35:00Z"
  },
  "links": [
    {"type": "wikilink", "target": "202405261125"},
    {"type": "citation", "citekey": "author2024"}
  ]
}
```

**Import from Canvas**:
- Accept same JSON format
- Parse and create note file
- Preserve all metadata
- Reconstruct wikilinks

---

## Layout System

### Grid Layout (for canvas)
```css
.canvas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  padding: 1rem;
}
```

### Flex Layout (current)
```css
.app {
  display: flex;
  width: 100vw;
  height: 100vh;
}

.sidebar {
  width: 300px;
  flex-shrink: 0;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}
```

---

## Spacing System

**Consistent spacing scale**:
```css
0.25rem  /* 4px  - tight spacing */
0.5rem   /* 8px  - small gaps */
0.75rem  /* 12px - button padding */
1rem     /* 16px - standard spacing */
1.5rem   /* 24px - section spacing */
2rem     /* 32px - large spacing */
3rem     /* 48px - page padding */
```

---

## Animation Guidelines

### Transitions
```css
transition: all 0.2s;  /* Standard */
transition: transform 0.3s ease-out;  /* Smooth movement */
```

### Hover Effects
```css
.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
```

### Loading States
```css
@keyframes spin {
  to { transform: rotate(360deg); }
}

.spinner {
  animation: spin 1s linear infinite;
}
```

---

## Accessibility

### Focus States
```css
button:focus-visible {
  outline: 2px solid var(--accent-color);
  outline-offset: 2px;
}
```

### ARIA Labels
```svelte
<button aria-label="Create new note">
  <Icon name="plus" size={18} />
</button>
```

### Keyboard Navigation
- All interactive elements must be keyboard accessible
- Modal dialogs close on Escape
- Forms submit on Enter

---

## Future: Canvas Editor Integration

### Requirements
1. **Drag-and-drop** notes from sidebar to canvas
2. **Bidirectional sync** between editor and canvas
3. **Visual connections** (lines between related notes)
4. **Zoom/pan** canvas navigation
5. **Export canvas** as image or JSON

### Data Model
```typescript
interface CanvasNode {
  id: string;
  noteId: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

interface CanvasEdge {
  id: string;
  from: string;
  to: string;
  type: 'wikilink' | 'reference' | 'custom';
}

interface Canvas {
  id: string;
  title: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  viewport: { x: number; y: number; zoom: number };
}
```

---

## Component Checklist

When creating new components:
- [ ] Use Icon component (no emojis)
- [ ] Use CSS variables for colors
- [ ] Follow spacing system
- [ ] Add hover/focus states
- [ ] Include ARIA labels
- [ ] Support keyboard navigation
- [ ] Document in this file
- [ ] Consider canvas integration

---

## Resources

- **Icons**: Feather Icons (https://feathericons.com)
- **Colors**: CSS Variables (see above)
- **Fonts**: Inter (Google Fonts)
- **Inspiration**: Linear, Notion, Obsidian Canvas
