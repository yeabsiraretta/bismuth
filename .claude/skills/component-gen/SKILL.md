---
name: component-gen
description: "Generate UI components with UX principles baked in"
---

# Component Generation Skill

Generate Bismuth UI components with research-backed UX requirements from the start.

## When to Use

- User asks to create/build a new UI component
- Planning component architecture
- Implementing features that involve UI

## Pre-Generation Checklist

Before writing code:

1. **Identify component type** (form, table, nav, modal, settings, dashboard, etc.)
2. **Check `.claude/component-guide.md`** for type-specific requirements
3. **Apply UX guardrails** (max 7 items, min 40px buttons, etc.)
4. **Verify tech stack** (Svelte + TypeScript + Tailwind)
5. **Plan file structure** (keep under 300 lines)

## Component Type → Requirements

### Form
- Max 7 visible fields (use multi-step for more)
- Inline validation on blur
- Required fields marked with *
- Error messages specific and actionable
- Submit disabled until valid
- Min 44x44px touch targets

### Data Table
- Max 5-7 visible columns
- Sticky header for scroll context
- Row actions in kebab menu (not inline)
- Sortable columns with aria-sort
- Pagination with count (not infinite scroll)

### Navigation
- Max 7 top-level items
- Group related items under expandable sections
- Active state clearly visible
- Icons with text labels (not icon-only)
- Keyboard navigation (arrow keys, Enter)

### Modal
- Single focus (one modal at a time)
- Close button 44x44px minimum
- Escape key closes
- Focus trap (tab cycles within modal)
- aria-modal="true" and role="dialog"

### Settings
- One section at a time (sidebar or tabs)
- Current state visible (toggles, selected values)
- Auto-save toggles, explicit Save for forms
- Destructive actions at bottom with confirmation

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

## Generation Template

```svelte
<script lang="ts">
  // Props with UX constraints
  export let items: Item[];  // Max 7-9 visible
  export let onAction: (item: Item) => void;
  export let disabled: boolean = false;
  
  // State
  let selectedId: string | null = null;
  
  // Ensure cognitive load limits
  $: visibleItems = items.slice(0, 7);
  $: hasMore = items.length > 7;
</script>

<div class="component">
  <!-- Accessible, properly sized elements -->
  {#each visibleItems as item (item.id)}
    <button
      class="min-w-[40px] min-h-[40px] px-4 py-2"
      aria-label={item.label}
      on:click={() => onAction(item)}
      {disabled}
    >
      {item.label}
    </button>
  {/each}
  
  {#if hasMore}
    <button class="min-h-[40px]" aria-label="Show more">
      More ({items.length - 7})
    </button>
  {/if}
</div>

<style>
  /* Use CSS variables from design system */
  .component {
    color: var(--text-normal);
    background: var(--background-primary);
  }
  
  button:focus-visible {
    outline: 2px solid var(--interactive-accent);
    outline-offset: 2px;
  }
</style>
```

## Post-Generation Checklist

After generating component:

- [ ] File size <300 lines
- [ ] Cognitive load: ≤7 items in lists/menus
- [ ] Button sizes: ≥40px, primary ≥44px
- [ ] Feedback: Immediate response to actions
- [ ] Keyboard: Full keyboard navigation
- [ ] ARIA: Labels on icon buttons
- [ ] Contrast: ≥4.5:1 for text
- [ ] Error prevention: Confirmations for destructive actions
- [ ] Progressive disclosure: Advanced options hidden

## Bismuth-Specific Patterns

### Note Editor
```typescript
// Auto-save with 500ms debounce
let saveTimer: ReturnType<typeof setTimeout> | null = null;
const autoSaveDelay = 500;

function handleChange(newContent: string) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    await onSave(filePath, newContent);
  }, autoSaveDelay);
}
```

### File Tree
```svelte
<!-- Max 7-9 top-level folders visible -->
<nav aria-label="File tree">
  {#each topLevelFolders.slice(0, 9) as folder}
    <FolderItem {folder} />
  {/each}
</nav>
```

### Wikilink Autocomplete
```svelte
<!-- Recognition vs Recall: Show existing notes -->
<Autocomplete
  placeholder="Link to note..."
  suggestions={existingNotes}
  on:select={insertWikilink}
/>
```

## References

- Component guide: `.claude/component-guide.md`
- UX principles: `docs/standards/ux-principles.md`
- Design system: `docs/standards/design-system.md`
- Constitution Principle III: UX evaluation required
