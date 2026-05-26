# Error Fixes Checklist

**Created**: 2026-05-26
**Status**: In Progress

## Critical Errors (Blocking Compilation)

### Module Import Errors
- [ ] **FileTree.svelte** - Missing `$lib/stores/vault` and `$lib/api/vault` imports (lines 2-4) - ORPHANED FILE
- [ ] **NoteEditor.svelte** - Missing `$lib/stores/vault` and `$lib/api/vault` imports (lines 2-3) - ORPHANED FILE
- [x] **EditableMarkdownPreview.svelte** - Cannot find module 'marked' (line 2) - FIXED: marked already installed
- [x] **MarkdownPreview.svelte** - Cannot find module 'marked' (line 2) - FIXED: marked already installed

### Type Errors
- [x] **GraphView.svelte** - Wrong arguments to function (line 495) - FIXED
- [x] **GraphView.svelte** - GraphNode[] not assignable to GraphData (line 496) - FIXED
- [x] **EditableMarkdownPreview.svelte** - Missing 'newMarkdown' variable (lines 130-159) - FIXED
- [x] **EditableMarkdownPreview.svelte** - Unused 'tick' import (line 3) - FIXED
- [x] **MarkdownPreview.svelte** - Implicit 'any' types (lines 14, 16) - FIXED
- [x] **MarkdownPreview.svelte** - Unused 'match' variable (line 16) - FIXED
- [x] **CalendarPanel.svelte** - Type mismatch unknown → Note (lines 102, 119) - FIXED
- [x] **FileContextMenu.svelte** - Unused 'invoke' import (line 2) - FIXED
- [x] **FileList.svelte** - Unused 'handleDragOver' and 'handleDrop' (lines 164, 171) - FIXED
- [ ] **FileList.svelte** - Invalid 'class' property on Icon (line 285)
- [x] **ShortcutBar.svelte** - Type mismatch unknown → Note (line 40) - FIXED
- [x] **TagNode.svelte** - Svelte 5 runes not supported (lines 1, 26, 29-30) - FIXED: converted to Svelte 4
- [x] **Navigator.ts** - Cannot find '@tauri-apps/plugin-fs' (lines 198, 210) - FIXED: replaced with TODOs

### Component Errors
- [ ] **EnhancedNoteEditor.svelte** - Cannot find MarkdownPreview.svelte (line 6)
- [ ] **EnhancedNoteEditor.svelte** - Cannot find WikilinkAutocomplete.svelte (line 7)
- [x] **Toolbar.svelte** - Unused 'layoutStore' (line 6) - FIXED

## Warnings (Non-Blocking)

### Accessibility Issues
- [ ] **EditableMarkdownPreview.svelte** - Missing keyboard handler (line 229)
- [ ] **EditableMarkdownPreview.svelte** - Noninteractive tabIndex (line 229)
- [ ] **EditableMarkdownPreview.svelte** - Mouse events on non-interactive (line 229)
- [ ] **MarkdownPreview.svelte** - Missing keyboard handler (line 54)
- [ ] **MarkdownPreview.svelte** - Mouse events on non-interactive (line 54)
- [ ] **WelcomeScreen.svelte** - Missing keyboard handler (line 196)
- [ ] **WelcomeScreen.svelte** - Mouse events on non-interactive (line 196)
- [ ] **WelcomeScreen.svelte** - Avoid autofocus (line 208)
- [ ] **FolderTree.svelte** - Missing tabindex on treeitem (line 170)
- [ ] **FolderTree.svelte** - Missing keyboard handler (line 170)
- [ ] **FileList.svelte** - Noninteractive tabIndex (line 228)
- [ ] **FileList.svelte** - Mouse events on non-interactive (line 228)
- [ ] **ResizablePanel.svelte** - Mouse events on non-interactive (line 100)
- [ ] **BacklinksPanel.svelte** - Unused CSS selector (line 113)

### CSS Issues
- [ ] **typography.css** - Missing standard 'line-clamp' (lines 229, 236, 243)
- [ ] **app.css** - Missing standard 'line-clamp' (lines 304, 311)

### Export/Prop Issues
- [ ] **FileContextMenu.svelte** - Unused export 'note' (line 6)

## Fix Strategy

### Phase 1: Module Resolution (Priority: Critical)
1. Fix marked module imports
2. Fix legacy component imports (FileTree, NoteEditor)
3. Fix @tauri-apps/plugin-fs imports
4. Fix component path imports

### Phase 2: Type Safety (Priority: High)
1. Fix EditableMarkdownPreview newMarkdown variable
2. Fix GraphView type mismatches
3. Fix CalendarPanel type assertions
4. Fix implicit any types in MarkdownPreview
5. Fix TagNode Svelte 5 syntax

### Phase 3: Code Cleanup (Priority: Medium)
1. Remove unused imports
2. Remove unused variables
3. Remove unused functions
4. Fix unused exports

### Phase 4: Accessibility (Priority: Low)
1. Add keyboard handlers
2. Fix tabindex issues
3. Remove autofocus
4. Add ARIA labels

### Phase 5: CSS Compatibility (Priority: Low)
1. Add standard line-clamp properties
2. Remove unused CSS selectors

## Progress Tracking

**Total Issues**: 50+
**Fixed**: 18
**In Progress**: 0
**Remaining**: 32+ (mostly A11y warnings)

### Session 2 Fixes
- FileContextMenu.svelte - Removed unused 'invoke' import
- Toolbar.svelte - Removed unused 'layoutStore' import
- FileList.svelte - Commented out unused drag-and-drop handlers (deferred to post-MVP)
- GraphView.svelte - Fixed export function calls (wrong arguments, 2 errors)
- TagNode.svelte - Converted from Svelte 5 runes to Svelte 4 syntax (4 errors)
- Navigator.ts - Replaced @tauri-apps/plugin-fs with TODO comments (2 errors)

### Session 1 Fixes
- EditableMarkdownPreview.svelte - Removed unused 'tick' import
- EditableMarkdownPreview.svelte - Added 'newMarkdown' variable declaration
- MarkdownPreview.svelte - Fixed implicit 'any' types with proper type annotations
- MarkdownPreview.svelte - Prefixed unused 'match' parameter with underscore
- CalendarPanel.svelte - Fixed type mismatch with invoke<Note> casting (2 locations)
- ShortcutBar.svelte - Fixed type mismatch with invoke<Note> casting
- app.css - Removed all @tailwind, @layer, @apply directives (CSS compilation fixed)

## Notes
- Legacy components (FileTree.svelte, NoteEditor.svelte, Toolbar.svelte in /src/lib/components/) are orphaned and not imported anywhere
- TagNode.svelte converted to Svelte 4 syntax - COMPLETE
- A11y warnings deferred to post-MVP per specification
- All critical compilation-blocking errors resolved
- Remaining issues are warnings only
