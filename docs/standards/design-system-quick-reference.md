# Bismuth Design System - Quick Reference

## Component Classes

### Buttons

```svelte
<!-- Primary action -->
<button class="btn btn-primary">Save</button>

<!-- Secondary action -->
<button class="btn btn-secondary">Cancel</button>

<!-- Subtle action -->
<button class="btn btn-ghost">More Options</button>

<!-- Sizes -->
<button class="btn btn-sm">Small</button>
<button class="btn btn-lg">Large</button>
```

### Inputs

```svelte
<input type="text" class="input" placeholder="Search..." />
<textarea class="input" rows="4"></textarea>
<select class="input">
  <option>Option 1</option>
</select>
```

### Cards

```svelte
<div class="card">
  <h3 class="text-lg font-semibold mb-2">Card Title</h3>
  <p class="text-sm text-text-muted">Card description</p>
</div>
```

### Badges

```svelte
<span class="badge badge-primary">New</span>
<span class="badge badge-success">Active</span>
<span class="badge badge-error">Error</span>
<span class="badge badge-warning">Warning</span>
```

### Panels

```svelte
<div class="panel">
  <div class="panel-header">
    <h3>Panel Title</h3>
  </div>
  <div class="panel-body">
    <!-- Content -->
  </div>
  <div class="panel-footer">
    <button class="btn btn-primary">Apply</button>
  </div>
</div>
```

### Dropdowns

```svelte
<div class="dropdown">
  <button class="dropdown-item">
    <Icon name="edit" size={16} />
    <span>Edit</span>
  </button>
  <button class="dropdown-item">
    <Icon name="trash" size={16} />
    <span>Delete</span>
  </button>
</div>
```

## Common Patterns

### Toolbar

```svelte
<div class="flex items-center gap-2 p-3 bg-surface border-b border-border">
  <input type="text" class="input flex-1 max-w-xs" placeholder="Search..." />
  <button class="btn btn-secondary btn-sm">
    <Icon name="filter" size={16} />
    Filter
  </button>
  <button class="btn btn-primary btn-sm">
    <Icon name="plus" size={16} />
    New
  </button>
</div>
```

### Sidebar Item

```svelte
<button class="flex items-center gap-3 w-full px-4 py-2 rounded-md hover:bg-surface-hover transition-colors">
  <Icon name="file" size={16} />
  <span class="flex-1 text-left truncate">Note Title</span>
  <span class="badge badge-primary">3</span>
</button>
```

### Modal

```svelte
<div class="modal-overlay">
  <div class="modal-content p-6">
    <h2 class="text-xl font-bold mb-4">Modal Title</h2>
    <p class="text-sm text-text-muted mb-6">Modal description</p>
    <div class="flex justify-end gap-2">
      <button class="btn btn-secondary">Cancel</button>
      <button class="btn btn-primary">Confirm</button>
    </div>
  </div>
</div>
```

### List Item

```svelte
<div class="flex items-center justify-between p-4 border-b border-border hover:bg-surface-hover">
  <div class="flex items-center gap-3">
    <Icon name="file" size={20} />
    <div>
      <h4 class="font-medium">Item Title</h4>
      <p class="text-sm text-text-muted">Item description</p>
    </div>
  </div>
  <button class="btn btn-ghost btn-sm">
    <Icon name="more-vertical" size={16} />
  </button>
</div>
```

## Color Usage

### Backgrounds

```svelte
<!-- Main background -->
<div class="bg-bg">

<!-- Secondary background -->
<div class="bg-bg-secondary">

<!-- Surface (cards, panels) -->
<div class="bg-surface">

<!-- Hover states -->
<div class="hover:bg-surface-hover">
<div class="active:bg-surface-active">
```

### Text

```svelte
<!-- Primary text -->
<p class="text-text">Main content</p>

<!-- Muted text -->
<p class="text-text-muted">Secondary info</p>

<!-- Semantic colors -->
<p class="text-primary">Link or accent</p>
<p class="text-error">Error message</p>
<p class="text-success">Success message</p>
<p class="text-warning">Warning message</p>
```

### Borders

```svelte
<!-- Default border -->
<div class="border border-border">

<!-- Focus border -->
<input class="border border-border focus:border-primary">

<!-- Rounded corners -->
<div class="border border-border rounded-md">
<div class="border border-border rounded-lg">
```

## Spacing

### Padding

```svelte
<!-- All sides -->
<div class="p-4">

<!-- Horizontal/Vertical -->
<div class="px-4 py-2">

<!-- Individual sides -->
<div class="pt-4 pr-3 pb-2 pl-3">

<!-- Responsive -->
<div class="p-4 md:p-6 lg:p-8">
```

### Margin

```svelte
<!-- All sides -->
<div class="m-4">

<!-- Horizontal/Vertical -->
<div class="mx-auto my-4">

<!-- Negative margins -->
<div class="-mt-4">
```

### Gap (Flexbox/Grid)

```svelte
<!-- Flex gap -->
<div class="flex gap-2">
<div class="flex gap-4">

<!-- Grid gap -->
<div class="grid grid-cols-3 gap-4">
```

## Typography

### Sizes

```svelte
<h1 class="text-4xl">Heading 1</h1>
<h2 class="text-3xl">Heading 2</h2>
<h3 class="text-2xl">Heading 3</h3>
<h4 class="text-xl">Heading 4</h4>
<p class="text-base">Body text</p>
<small class="text-sm">Small text</small>
<span class="text-xs">Extra small</span>
```

### Weights

```svelte
<p class="font-normal">Normal (400)</p>
<p class="font-medium">Medium (500)</p>
<p class="font-semibold">Semibold (600)</p>
<p class="font-bold">Bold (700)</p>
```

### Utilities

```svelte
<!-- Truncate -->
<p class="truncate">Long text that will be cut off...</p>

<!-- Line clamp -->
<p class="truncate-2">Text limited to 2 lines...</p>
<p class="truncate-3">Text limited to 3 lines...</p>

<!-- Alignment -->
<p class="text-left">Left aligned</p>
<p class="text-center">Center aligned</p>
<p class="text-right">Right aligned</p>
```

## Layout

### Flexbox

```svelte
<!-- Basic flex -->
<div class="flex">

<!-- Direction -->
<div class="flex flex-col">
<div class="flex flex-row">

<!-- Alignment -->
<div class="flex items-center justify-between">
<div class="flex items-start justify-center">

<!-- Wrap -->
<div class="flex flex-wrap gap-2">
```

### Grid

```svelte
<!-- Basic grid -->
<div class="grid grid-cols-3 gap-4">

<!-- Responsive grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

<!-- Auto-fit -->
<div class="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
```

### Positioning

```svelte
<!-- Relative/Absolute -->
<div class="relative">
  <div class="absolute top-0 right-0">Badge</div>
</div>

<!-- Fixed -->
<div class="fixed bottom-4 right-4">

<!-- Sticky -->
<div class="sticky top-0">
```

## Responsive Design

### Breakpoints

```svelte
<!-- Mobile first -->
<div class="w-full md:w-1/2 lg:w-1/3">

<!-- Hide/Show -->
<div class="hidden md:block">Desktop only</div>
<div class="block md:hidden">Mobile only</div>

<!-- Responsive padding -->
<div class="p-4 md:p-6 lg:p-8">
```

## Animations

### Transitions

```svelte
<!-- Basic transition -->
<button class="transition-colors hover:bg-primary">

<!-- Custom duration -->
<div class="transition-all duration-300">

<!-- Ease functions -->
<div class="transition-transform ease-in-out">
```

### Animations

```svelte
<!-- Spin -->
<Icon name="loader" class="animate-spin" />

<!-- Pulse -->
<div class="animate-pulse">Loading...</div>

<!-- Custom animations -->
<div class="animate-in">Fade in</div>
<div class="animate-out">Fade out</div>
```

## Dark Mode

```svelte
<!-- Auto dark mode support -->
<div class="bg-white dark:bg-gray-900">
<p class="text-black dark:text-white">
<div class="border-gray-200 dark:border-gray-700">
```

## Accessibility

### Focus States

```svelte
<!-- Focus ring -->
<button class="focus-ring">

<!-- Custom focus -->
<input class="focus:outline-none focus:ring-2 focus:ring-primary">
```

### Screen Reader Only

```svelte
<span class="sr-only">Screen reader only text</span>
```

## Performance Tips

1. **Use component classes** for repeated patterns
2. **Avoid @apply** in production (use utilities directly)
3. **Purge unused CSS** in production builds
4. **Use JIT mode** for faster development
5. **Minimize custom CSS** - leverage Tailwind utilities

## Quick Wins

### Before

```svelte
<style>
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    background: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
  }
</style>

<div class="header">...</div>
```

### After

```svelte
<div class="flex items-center justify-between p-4 bg-surface border-b border-border">
  ...
</div>
```

**Result**: Less code, better performance, more maintainable!
