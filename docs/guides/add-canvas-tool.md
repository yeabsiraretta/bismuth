# How to Add a Canvas Tool

## Purpose

This guide explains how to add a new interactive tool to the Bismuth canvas toolbar. Canvas tools control what happens when the user clicks, drags, or interacts with the canvas surface.

## Files touched

- `src/lib/features/canvas/types/settings.ts` — add tool ID to `Tool` union
- `src/lib/features/canvas/components/workspace/canvasInteractions.ts` — handle the tool in `handleMouseDown`
- `src/lib/features/canvas/components/CanvasToolbar.svelte` — add toolbar button
- `src/lib/features/canvas/components/workspace/canvasShortcuts.ts` — register keyboard shortcut

---

## Step-by-step walkthrough

### 1. Add the tool ID to the `Tool` union

Open `src/lib/features/canvas/types/settings.ts`. Find the `Tool` type and append your new tool name.

```typescript
export type Tool =
  | 'select'
  | 'frame'
  | 'text'
  | 'shape'
  | 'pen'
  | 'preview'
  | 'my-tool'; // add this
```

The `activeTool` store in `canvasStore.ts` is typed against `Tool`, so TypeScript will now enforce correct usage everywhere.

### 2. Handle the tool in `handleMouseDown`

Open `src/lib/features/canvas/components/workspace/canvasInteractions.ts`. Find the `handleMouseDown` function and add a branch for your tool.

```typescript
export function handleMouseDown(
  e: MouseEvent,
  tool: Tool,
  ctx: CanvasInteractionContext
): void {
  switch (tool) {
    case 'select':
      handleSelectMouseDown(e, ctx);
      break;
    // ... existing cases ...

    case 'my-tool':
      handleMyToolMouseDown(e, ctx);
      break;

    default:
      break;
  }
}

function handleMyToolMouseDown(
  e: MouseEvent,
  ctx: CanvasInteractionContext
): void {
  const { x, y } = ctx.toCanvasCoords(e.clientX, e.clientY);
  log.debug('my-tool: mousedown at', { x, y });
  // implement tool-specific behavior here
}
```

Keep `canvasInteractions.ts` under 300 lines. If the handler is non-trivial, extract it to a sibling file (e.g. `myToolInteractions.ts`) in the same `workspace/` directory.

You may also need to handle `handleMouseMove` and `handleMouseUp` if the tool requires drag behavior. Follow the same switch pattern in those functions.

### 3. Add the toolbar button in `CanvasToolbar.svelte`

Open `src/lib/features/canvas/components/CanvasToolbar.svelte`. Add a button entry to the tool list.

```svelte
<script lang="ts">
  import { activeTool, setActiveTool } from '@/features/canvas/stores/canvasStore';
  // existing imports...
</script>

<div class="toolbar">
  <!-- existing buttons -->
  <button
    class="tool-btn {$activeTool === 'my-tool' ? 'active' : ''}"
    on:click={() => setActiveTool('my-tool')}
    title="My Tool (M)"
    aria-label="My Tool"
    aria-pressed={$activeTool === 'my-tool'}
  >
    <!-- use an icon from @/utils/icons.ts or an inline SVG under 24px -->
    M
  </button>
</div>
```

Use a keyboard shortcut hint in the `title` attribute to match what you register in the next step. Prefer icon keys from `src/lib/utils/icons.ts` over raw inline SVG to keep the component under 300 lines.

### 4. Register the keyboard shortcut in `canvasShortcuts.ts`

Open `src/lib/features/canvas/components/workspace/canvasShortcuts.ts`. Find the `handleCanvasShortcut` function and add your key binding.

```typescript
export function handleCanvasShortcut(
  e: KeyboardEvent,
  handlers: CanvasShortcutHandlers
): void {
  const { key, metaKey, ctrlKey, shiftKey } = e;

  // existing shortcuts ...

  // Tool: My Tool — press M (no modifiers)
  if (!metaKey && !ctrlKey && !shiftKey && key === 'm') {
    e.preventDefault();
    handlers.setTool?.('my-tool');
    return;
  }
}
```

Make sure `CanvasShortcutHandlers` in the same file includes `setTool?: (tool: Tool) => void` if it does not already. Update `CanvasApp.svelte` to pass `setTool: setActiveTool` when calling `handleCanvasShortcut`.

---

## Checklist

- [ ] `Tool` union in `types/settings.ts` includes the new tool ID
- [ ] `handleMouseDown` (and `handleMouseMove` / `handleMouseUp` if needed) has a case for the new tool
- [ ] Handler logic lives in `canvasInteractions.ts` or a sibling file — not in a Svelte component
- [ ] Toolbar button added to `CanvasToolbar.svelte` with correct `aria-pressed` binding
- [ ] Keyboard shortcut registered in `canvasShortcuts.ts`
- [ ] No `console.log` — use `log.debug` / `log.info` from `@/utils/logger`
- [ ] All modified files remain under 300 lines
