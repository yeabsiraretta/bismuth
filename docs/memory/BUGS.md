# Recurring Bug Patterns (`docs/memory/`)

This file stores durable implementation bug patterns and their mitigations.

---

### 2026-06-08 - Svelte reactive loops from store-component feedback

**Status**: Active

**Symptoms**: UI freezes, infinite re-renders, editor becomes unresponsive after typing.

**Root Cause**: Reactive statement `$: if ($store) { localVar = $store.value }` fires on every store update, including updates triggered by the component itself (e.g., save → updateNoteInStore → $activeNote changes → content reset → editor re-sync → repeat).

**Future mistake prevented**: Never write `$: if ($activeNote) { content = $activeNote.content }` without a guard. The store update from save will trigger re-read, creating infinite cycles.

**Evidence**: Fixed in `NoteEditor.svelte` — added `lastNotePath` guard so content only loads on note switch, not on every store mutation.

**Prevention / Detection**: Always guard reactive statements that read from stores with a reference check (path, ID, or version). Add `mounted` flags to prevent reactive dispatch before component initialization.

**Where to look next**: `src/lib/components/note/NoteEditor.svelte`, `src/lib/components/editor/Editor.svelte`

---

### 2026-06-08 - CodeMirror RangeSetBuilder ordering violation

**Status**: Active

**Symptoms**: Decorations silently fail to apply. No error in console but live preview stops rendering formatted text.

**Root Cause**: `RangeSetBuilder` requires decorations added in strict ascending document position order. When multiple regex passes (bold, italic, code, etc.) scan the same line, they add decorations out-of-order relative to each other.

**Future mistake prevented**: Never use `RangeSetBuilder` when collecting decorations from multiple independent regex patterns on the same text. Use `Decoration.set(array, true)` with the sort flag instead.

**Evidence**: Fixed in `livePreview.ts` — replaced RangeSetBuilder with array collection + `Decoration.set(decos, true)`.

**Prevention / Detection**: If a ViewPlugin's decorations aren't rendering, check whether the builder approach is used with multi-pattern scanning. The `true` flag on `Decoration.set()` enables automatic sorting.

**Where to look next**: `src/lib/components/editor/extensions/livePreview.ts`, `src/lib/components/editor/extensions/wikilink.ts` (correctly uses RangeSetBuilder because it processes one line at a time in order)

---

### 2026-06-21 - Circular store re-export between split modules causes latent init-order bugs

**Status**: Active

**Symptoms**: Module works correctly at runtime but produces `undefined` errors during hot-reload, tree-shaking, or Vitest isolation where ESM evaluation order differs from the browser.

**Root Cause**: When splitting a large store file to stay under 300 lines, the original file re-exported functions from the new sibling module. The sibling already imported from the original. Both modules depended on each other at import time, creating a circular ESM graph.

**Future mistake prevented**: After splitting a store, never re-export from the new sibling back in the original. Route all consumers directly to the module that defines the symbol.

**Evidence**: Architecture review V1 on spec 004; fixed by removing the re-export block from `componentLibrary.ts` and updating `CanvasContextMenu.svelte` and `ComponentEditor.svelte` to import from `componentEditMode` directly.

**Prevention / Detection**: Architecture review circular-import check. If a split produces a `A re-exports from B` + `B imports from A` pattern, restructure before merging.

**Where to look next**: `src/lib/features/canvas/stores/componentEditMode.ts`, `src/lib/features/canvas/stores/componentLibrary.ts`

---

### 2026-06-21 - Bulk-delete operations must mirror all cascade side effects of the single-element path

**Status**: Active

**Symptoms**: After multi-selecting and deleting frames, flow link arrows remain on canvas. Navigation links in preview mode point to non-existent frames.

**Root Cause**: `deleteElement` (single) correctly called `removeFlowLinksForElement` before element removal. `deleteSelectedElements` (bulk) only filtered the `elements` array and skipped `flowLinks` entirely — a "one path forgot" bug.

**Future mistake prevented**: When implementing a bulk version of an operation with cascade logic in its single-element version, audit the single-element path for all side effects (linked records, selection state, history entries) and mirror every one.

**Evidence**: Identified during fix-findings pass on spec 004; fixed in `canvasElements.ts:deleteSelectedElements` with an inline `flowLinks` filter inside the same `currentCanvas.update` call.

**Prevention / Detection**: Write a test for the bulk delete path that asserts the same cascade as the single-element test. The T060/T062 test suite covers this.

**Where to look next**: `src/lib/features/canvas/stores/canvasElements.ts:59-77`, `stores/__tests__/canvasElements.test.ts` (deleteSelectedElements cascade suite)

---

### 2026-06-21 - Rust path confinement: canonicalize then starts_with is the only safe pattern

**Status**: Active

**Symptoms**: User-supplied path (e.g. `source_path` in import commands) contains `../` sequences; `Path::new(user_path).join(sub)` resolves the traversal and escapes the vault directory.

**Root Cause**: `Path::new(input)` does not resolve `..` segments or symlinks. Checking `starts_with(vault_root)` before `canonicalize()` is ineffective — the `..` is still in the string.

**Required pattern**:
```rust
let canon_root = Path::new(&vault_root).canonicalize()
    .map_err(|e| format!("Cannot canonicalize vault root: {}", e))?;
let canon_input = Path::new(&user_input).canonicalize()
    .map_err(|_| "Path not found or inaccessible".to_string())?;
if !canon_input.starts_with(&canon_root) {
    return Err("Path escapes vault boundary".into());
}
```

**Future mistake prevented**: Any IPC command accepting a user-supplied path (import, read, copy, write) that trusts the raw string before canonicalization is vulnerable to path traversal.

**Evidence**: Implemented in `commands/system/themes.rs:import_theme_folder` and verified in `commands/canvas/component.rs`. Pattern enforces spec 037 SEC-037-001 Rust side.

**Where to look next**: `src-tauri/src/commands/system/themes.rs`, `src-tauri/src/commands/canvas/component.rs`, security constitution §5 (IPC security)
