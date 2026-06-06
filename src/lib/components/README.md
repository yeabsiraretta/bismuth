# Component Directory Conventions

## Structure

```text
components/
├── canvas/         # Canvas/whiteboard components
├── capture/        # Capture inbox and note card components
├── dialogs/        # Simple dialog prompts (NewNoteDialog, etc.)
├── graph/          # Knowledge graph visualization
├── icons/          # Icon component and SVG assets
├── layout/         # App shell components (StatusBar, ResizablePanel, EditorToolbar)
├── modals/         # Full overlay modals (Settings, CommandPalette, SearchPanel, AutoLinker)
├── note/           # Note editor and inline suggestions
├── settings/       # Settings panel sub-components (one per tab)
├── sidebar/        # Sidebar panels, tab bars, and shell
├── ui/             # Shared UI primitives (Button, Modal, Toast, ThemeToggle)
└── vault/          # Vault management (FileTree, VaultPicker, WelcomeScreen)
```

## Naming Rules

- **Components**: PascalCase matching the filename (e.g., `FileTree.svelte`)
- **Barrel exports**: Each directory has an `index.ts` re-exporting all public components
- **Scoped styles**: Use `<style>` (not `<style lang="...">`) with CSS custom properties from `tokens.css`
- **Icons**: Always use the shared `<Icon>` component, never inline SVGs

## Import Conventions

- Use `@/` path alias for `src/lib/` imports (e.g., `@/components/icons/Icon.svelte`)
- Prefer barrel imports for directories that have them: `import { FileTree } from '@/components/vault'`
- Types go in `src/lib/types/` and are imported with `import type { ... }`

## Styling

- Design tokens: `src/lib/styles/tokens.css` (spacing, colors, typography, radii, shadows)
- Shared patterns: `src/lib/styles/ui-patterns.css` (reusable class patterns)
- Grid system: `src/lib/styles/grid-system.css` (layout utilities)
- Components use scoped CSS with `var(--token-name)` references, NOT Tailwind utility classes
- Dark mode: `data-theme="dark"` attribute on `:root`

## Accessibility

- All icon-only buttons must have `aria-label`
- Modals use focus traps (`@/utils/focusTrap`)
- Interactive lists use proper ARIA roles (`role="tree"`, `role="treeitem"`, etc.)
- Keyboard navigation: Arrow keys for lists/tabs, Escape to close overlays
