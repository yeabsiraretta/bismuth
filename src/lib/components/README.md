# Component Directory Conventions

## Structure

This directory contains **shared, cross-cutting UI components** that are not owned by any
single feature. Feature-specific components live in `src/lib/features/<name>/components/`.

```text
components/
├── dialogs/        # Simple dialog prompts (DeleteConfirmDialog, etc.)
├── editor/         # CodeMirror editor wrapper, extensions, and plugins
├── icons/          # Icon component and SVG assets
├── layout/         # App shell (StatusBar, ResizablePanel, EditorToolbar)
├── note/           # Note editor and inline suggestions
├── overlays/       # Full overlays (Settings, LayoutManager)
├── sidebar/        # Sidebar shell, tab bars, panels (Outline, Properties, Recent)
├── ui/             # Shared UI primitives (Button, Modal, Toast, ThemeToggle)
└── vault/          # Vault management (FileTree, VaultPicker, Toolbar)
```

### Feature-Owned Components (in `src/lib/features/`)

The following features own their own components via feature module barrels:

- `@/features/backlinks` — BacklinksPanel, Backlinks, OutgoingLinks
- `@/features/calendar` — CalendarView, CalendarPanel, WeekView, MonthView, YearView
- `@/features/canvas` — CanvasApp, workspace, panels, flow, design, library, kanban
- `@/features/capture` — CaptureDashboard, CaptureNoteCard, CaptureBatchBar
- `@/features/changelog` — ChangelogPanel
- `@/features/entity` — EntityPanel, EntityBrowser
- `@/features/gamify` — TaskPanelUnified, GamifiedTaskPanel, QuestPanel, StatsView, TodayView
- `@/features/git` — GitPanel
- `@/features/graph` — GraphView, GraphSidebarPanel
- `@/features/linting` — WritingLintPanel
- `@/features/longform` — ManuscriptPanel
- `@/features/navigator` — Navigator, ListPane, NavigationPane
- `@/features/periodic` — PeriodicPanel
- `@/features/publishing` — PublishingPanel, PublicationDashboard, DeploySettings
- `@/features/rss` — RssFeedList, RssViewport
- `@/features/search` — SearchPanel, CommandPalette
- `@/features/speedreader` — SpeedReader, SpeedReaderPanel
- `@/features/tag` — TagPanel
- `@/features/tasks` — TaskPanel, KanbanPanel
- `@/features/template` — TemplatePanel
- `@/features/voice` — VoicePanel
- `@/features/wikilink` — AutoLinker, findUnlinkedReferences

## Naming Rules

- **Components**: PascalCase matching the filename (e.g., `FileTree.svelte`)
- **Barrel exports**: Each directory has an `index.ts` re-exporting all public components
- **Scoped styles**: Use `<style>` (not `<style lang="...">`) with CSS custom properties from `tokens.css`
- **Icons**: Always use the shared `<Icon>` component, never inline SVGs

## Import Conventions

- Use `@/` path alias for `src/lib/` imports (e.g., `@/components/icons/Icon.svelte`)
- **Feature components**: Import from barrel — `import { GraphView } from '@/features/graph'`
- **Shared components**: Import directly — `import Icon from '@/components/icons/Icon.svelte'`
- Types go in `src/lib/types/` or feature-scoped `features/<name>/types/`

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
