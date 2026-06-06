# TailwindCSS Integration for Bismuth

## Overview

Integrated TailwindCSS v4 into Bismuth for design standardization, performance, and maintainability. Tailwind provides utility-first CSS with excellent tree-shaking, resulting in minimal production bundle sizes.

> **Note**: Tailwind v4 uses CSS-based configuration (`@theme` blocks in `src/app.css`) instead of `tailwind.config.js`. The JS config file is kept only for IDE tooling compatibility.

## Why Tailwind for Bismuth?

### Performance Benefits
- **Tree-shaking**: Only includes CSS actually used in components (~10-20KB gzipped in production)
- **No runtime**: Pure CSS, no JavaScript overhead
- **Optimized builds**: PostCSS processes and minifies automatically
- **JIT mode**: Generates styles on-demand during development

### Developer Experience
- **Utility-first**: Rapid prototyping with consistent spacing/colors
- **Type-safe**: Works seamlessly with TypeScript and Svelte
- **Autocomplete**: IDE support for class names
- **No naming conflicts**: Utility classes eliminate CSS naming issues

### Design Consistency
- **Design tokens**: Centralized color, spacing, typography system
- **Responsive**: Mobile-first breakpoints built-in
- **Dark mode**: Attribute-based dark mode support (`data-theme="dark"`)
- **Customizable**: Extends with Bismuth-specific design system

## Tech Stack Integration

### Svelte Compatibility
- ✅ Works perfectly with Svelte components
- ✅ Supports `class:` directives
- ✅ Compatible with scoped styles
- ✅ No conflicts with Svelte's CSS processing

### Tauri Compatibility
- ✅ Pure CSS, no Node.js runtime required
- ✅ Compiles at build time
- ✅ Works with Tauri's asset bundling
- ✅ Minimal bundle size impact

### PostCSS Pipeline

```
Svelte → PostCSS → @tailwindcss/postcss (v4) → Autoprefixer → Minified CSS
```

## Files & Architecture

### 1. `src/app.css` (Primary Configuration)

**Purpose**: CSS entry point with Tailwind v4 integration

**Structure**:

1. `@import "tailwindcss"` — activates Tailwind v4 (preflight + utilities)
2. `@import "./lib/styles/tokens.css"` — design token variables
3. `@import "./lib/styles/typography.css"` — font system
4. `@import "./lib/styles/responsive.css"` — fluid sizing
5. `@import "./lib/styles/grid-system.css"` — layout primitives
6. `@theme { ... }` — maps tokens into Tailwind utility names
7. `@custom-variant dark` — binds `dark:` to `data-theme="dark"`
8. `:root { ... }` — supplemental variables for component scoped styles
9. Theme variants (`[data-theme='light']`, `[data-theme='dark']`)
10. Base styles, scrollbar, component patterns, custom utilities

### 2. `tailwind.config.js` (IDE Shim Only)

**Purpose**: Exists solely for IDE IntelliSense/autocomplete tooling.
Does NOT drive configuration — the `@theme` block in `app.css` is authoritative.

### 3. `postcss.config.js`

**Purpose**: PostCSS configuration for processing Tailwind

**Plugins**:
- `@tailwindcss/postcss`: Tailwind v4 PostCSS plugin
- `autoprefixer`: Adds vendor prefixes for browser compatibility

### 4. `src/lib/styles/tokens.css`

**Purpose**: Single source of truth for design tokens

**Contains**: Color palettes (light + dark via `[data-theme]`), spacing scale,
typography, border radius, shadows, z-index, and layout variables.

## Design System

### Color Palette

**Primary Colors** (Blue):
```css
primary-50  → #f0f9ff
primary-500 → #0ea5e9 (main)
primary-900 → #0c4a6e
```

**Semantic Colors**:
```css
--color-bg: Background
--color-surface: Cards, panels
--color-text: Primary text
--color-text-muted: Secondary text
--color-border: Dividers, outlines
--color-error: #ef4444
--color-success: #10b981
--color-warning: #f59e0b
```

### Spacing Scale

```css
--space-1: 0.25rem (4px)
--space-2: 0.5rem  (8px)
--space-3: 0.75rem (12px)
--space-4: 1rem    (16px)
--space-5: 1.5rem  (24px)
--space-6: 2rem    (32px)
--space-7: 3rem    (48px)
--space-8: 4rem    (64px)
```

### Typography

**Font Families**:
- **Sans**: System UI stack (optimal for each OS)
- **Mono**: Code fonts (SF Mono, Fira Code, etc.)

**Font Sizes**:
```css
text-xs   → 0.75rem (12px)
text-sm   → 0.875rem (14px)
text-base → 1rem (16px)
text-lg   → 1.125rem (18px)
text-xl   → 1.25rem (20px)
text-2xl  → 1.5rem (24px)
```

## Component Classes

### Buttons

```svelte
<!-- Primary button -->
<button class="btn btn-primary">Save</button>

<!-- Secondary button -->
<button class="btn btn-secondary">Cancel</button>

<!-- Ghost button -->
<button class="btn btn-ghost">More</button>

<!-- Small button -->
<button class="btn btn-sm">Compact</button>
```

### Inputs

```svelte
<input type="text" class="input" placeholder="Search..." />
```

### Cards

```svelte
<div class="card">
  <h3>Card Title</h3>
  <p>Card content</p>
</div>
```

### Badges

```svelte
<span class="badge badge-primary">New</span>
<span class="badge badge-success">Active</span>
<span class="badge badge-error">Error</span>
```

### Panels

```svelte
<div class="panel">
  <div class="panel-header">Settings</div>
  <div class="panel-body">
    <!-- Content -->
  </div>
  <div class="panel-footer">
    <button class="btn btn-primary">Apply</button>
  </div>
</div>
```

## Utility Classes

### Layout

```svelte
<!-- Flexbox -->
<div class="flex items-center justify-between gap-4">

<!-- Grid -->
<div class="grid grid-cols-3 gap-4">

<!-- Spacing -->
<div class="p-4 m-2">
<div class="px-6 py-3">
```

### Typography

```svelte
<!-- Text size and weight -->
<h1 class="text-2xl font-bold">Title</h1>
<p class="text-sm text-text-muted">Subtitle</p>

<!-- Truncation -->
<p class="truncate">Long text...</p>
<p class="truncate-2">Two lines max...</p>
```

### Colors

```svelte
<!-- Background -->
<div class="bg-surface hover:bg-surface-hover">

<!-- Text -->
<span class="text-primary">Link</span>
<span class="text-error">Error message</span>

<!-- Border -->
<div class="border border-border rounded-lg">
```

### Responsive Design

```svelte
<!-- Mobile-first breakpoints -->
<div class="w-full md:w-1/2 lg:w-1/3">
  
<!-- Hide on mobile -->
<div class="hidden md:block">

<!-- Stack on mobile, row on desktop -->
<div class="flex flex-col md:flex-row">
```

### Dark Mode

```svelte
<!-- Automatic dark mode support -->
<div class="bg-white dark:bg-gray-900">
<span class="text-black dark:text-white">
```

## Migration Strategy

### Phase 1: New Components (Current)
- Use Tailwind for all new components
- Gradually adopt component classes
- Maintain existing CSS for legacy components

### Phase 2: Refactor Existing Components
- Convert inline styles to Tailwind utilities
- Replace custom CSS with component classes
- Remove duplicate CSS rules

### Phase 3: Optimize
- Remove unused CSS variables
- Consolidate component variants
- Tree-shake unused Tailwind classes

## Usage Examples

### Before (Custom CSS)

```svelte
<style>
  .button {
    padding: 0.5rem 1rem;
    background: var(--color-primary);
    color: white;
    border-radius: 0.375rem;
    font-weight: 500;
    transition: background 0.2s;
  }
  
  .button:hover {
    background: var(--color-primary-hover);
  }
</style>

<button class="button">Click me</button>
```

### After (Tailwind)

```svelte
<button class="btn btn-primary">
  Click me
</button>
```

### Complex Example

```svelte
<!-- Graph controls with Tailwind -->
<div class="flex items-center gap-2 p-3 bg-surface border-b border-border">
  <input
    type="text"
    placeholder="Search nodes..."
    class="input flex-1 max-w-xs"
  />
  <button class="btn btn-secondary btn-sm">
    <Icon name="settings" size={16} />
    Settings
  </button>
  <button class="btn btn-primary btn-sm">
    Export
  </button>
</div>
```

## Performance Metrics

### Development
- **Build time**: +~200ms (PostCSS processing)
- **HMR**: Instant (Tailwind JIT)
- **File size**: ~3MB (all utilities, dev only)

### Production
- **CSS bundle**: ~15-25KB gzipped (tree-shaken)
- **Load time**: <50ms (cached)
- **Render performance**: No impact (pure CSS)

## Best Practices

### 1. Use Component Classes for Reusable Patterns

```svelte
<!-- ❌ Don't repeat utilities -->
<button class="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover">
<button class="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover">

<!-- ✅ Use component class -->
<button class="btn btn-primary">
<button class="btn btn-primary">
```

### 2. Combine with CSS Variables

```svelte
<!-- Use Tailwind utilities with CSS variables -->
<div class="p-[var(--space-4)] bg-[var(--color-surface)]">
```

### 3. Keep Scoped Styles for Complex Components

```svelte
<script>
  // Component logic
</script>

<!-- Use Tailwind for layout/spacing -->
<div class="flex flex-col gap-4 p-6">
  <canvas bind:this={canvas} class="flex-1" />
</div>

<!-- Keep scoped styles for canvas-specific CSS -->
<style>
  canvas {
    cursor: grab;
  }
  
  canvas:active {
    cursor: grabbing;
  }
</style>
```

### 4. Use @apply Sparingly

```css
/* ❌ Avoid overusing @apply */
.my-component {
  @apply flex items-center justify-between p-4 bg-surface border border-border rounded-lg shadow-md hover:shadow-lg transition-shadow;
}

/* ✅ Better: Use utilities directly in HTML */
<div class="flex items-center justify-between p-4 bg-surface border border-border rounded-lg shadow-md hover:shadow-lg transition-shadow">
```

## Customization

### Adding Custom Colors

```js
// tailwind.config.js
theme: {
  extend: {
    colors: {
      brand: {
        50: '#...',
        500: '#...',
        900: '#...'
      }
    }
  }
}
```

### Adding Custom Utilities

```css
/* app.css */
@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
  
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
}
```

### Adding Custom Components

```css
/* app.css */
@layer components {
  .sidebar-item {
    @apply flex items-center gap-3 px-4 py-2 rounded-md;
    @apply hover:bg-surface-hover transition-colors;
  }
}
```

## IDE Setup

### VS Code

Install extensions:
- **Tailwind CSS IntelliSense**: Autocomplete, linting, hover previews
- **PostCSS Language Support**: Syntax highlighting for @apply

### Settings

```json
{
  "tailwindCSS.experimental.classRegex": [
    ["class:\\s*{([^}]*)}"]
  ],
  "css.validate": false,
  "tailwindCSS.includeLanguages": {
    "svelte": "html"
  }
}
```

## Troubleshooting

### CSS Not Applying

**Issue**: Tailwind classes not working

**Solution**:
1. Check `content` paths in `tailwind.config.js`
2. Ensure `app.css` is imported in `+layout.svelte`
3. Restart dev server

### Purging Too Aggressively

**Issue**: Classes removed in production

**Solution**:
```js
// tailwind.config.js
safelist: [
  'bg-primary',
  'text-error',
  // Add dynamic classes here
]
```

### Conflicts with Existing CSS

**Issue**: Tailwind resets override custom styles

**Solution**:
```css
/* Use layers to control specificity */
@layer base {
  /* Tailwind base */
}

@layer components {
  /* Your components */
}

@layer utilities {
  /* Tailwind utilities (highest specificity) */
}
```

## Next Steps

1. **Refactor existing components**: Convert to Tailwind utilities
2. **Create component library**: Document all component classes
3. **Optimize bundle**: Remove unused CSS variables
4. **Add variants**: Create more button/input variants
5. **Theme system**: Implement theme switcher (light/dark/custom)

## Resources

- [Tailwind Documentation](https://tailwindcss.com/docs)
- [Tailwind with Svelte](https://tailwindcss.com/docs/guides/sveltekit)
- [Tailwind Play](https://play.tailwindcss.com/) - Online playground
- [Tailwind UI](https://tailwindui.com/) - Component examples

## Status

✅ **COMPLETE** - TailwindCSS fully integrated:
1. ✅ Configuration files created
2. ✅ Design system defined
3. ✅ Component classes implemented
4. ✅ Utility classes added
5. ✅ Dark mode support
6. ✅ Documentation complete

Bismuth now has a modern, performant, and maintainable CSS architecture!
