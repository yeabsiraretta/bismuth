# Code Map

Quick-reference module inventory for agent and developer orientation.
**Auto-validated** by `tests/architecture/__tests__/codeMap.test.ts`.

---

## Layer Structure

```
src/lib/
  config/          Constants, presets, feature flags
  types/           TypeScript interfaces (no runtime code)
  utils/           Pure helpers (no store/service imports)
  services/        Tauri IPC adapters (no UI logic)
  stores/          Global reactive state (Svelte writables)
  components/      UI components (grouped by domain)
  features/        Feature modules (self-contained: stores + services + components)
  assets/          Static data (icon paths, etc.)
```

---

## Config (`src/lib/config/`)

| File                          | Exports                                                                                                      | Purpose                               |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------- |
| `constants.ts`                | EDITOR, LAYOUT, PERFORMANCE, ANIMATION, ACCESSIBILITY, BREAKPOINTS, Z_INDEX, TOAST, FILE, FEATURES, DEBOUNCE | Canonical app-wide constants          |
| `presets.ts`                  | Barrel re-export of presets/                                                                                 | Entry point for preset data           |
| `presets/canvas-presets.ts`   | COLOR_PRESETS, ICON_PRESETS, KEYBOARD_SHORTCUTS, VALIDATION_RULES, ERROR_MESSAGES, SUCCESS_MESSAGES          | Visual and UX presets                 |
| `presets/template-presets.ts` | TEMPLATES, DEFAULT_SETTINGS                                                                                  | Note templates and defaults           |
| `presets/canvas-library/`     | BUILTIN_COMPONENTS, BUILTIN_CATEGORIES                                                                       | Built-in canvas component definitions |

---

## Types (`src/lib/types/`)

| File                       | Purpose                                |
| -------------------------- | -------------------------------------- |
| `layout.ts`                | SidebarTab, Theme, DEFAULT_*_TABS      |
| `data/vault.ts`            | Vault, Note, VaultTemplate             |
| `ipc-contracts.ts`         | Barrel for typed IPC command contracts |
| `ipc/vault-commands.ts`    | Vault CRUD command types               |
| `ipc/canvas-commands.ts`   | Canvas/component/design-doc types      |
| `ipc/content-commands.ts`  | Task/tag/property/lifecycle types      |
| `ipc/git-commands.ts`      | Git operation types                    |
| `ipc/template-commands.ts` | Template CRUD types                    |
| `ipc/theme-commands.ts`    | Theme/plugin types                     |

---

## Services (`src/lib/services/`)

| Module                     | Commands Wrapped                                      | Public API                                  |
| -------------------------- | ----------------------------------------------------- | ------------------------------------------- |
| `vault/vault.ts`           | open_vault, create_vault, read_note, write_note, etc. | openVault, createVault, readNote, writeNote |
| `vault/vaultManagement.ts` | scan_vault, list_notes                                | scanVault, listNotes                        |
| `vault/frontmatter.ts`     | parse_frontmatter, update_frontmatter_field           | parseFrontmatter, updateField               |
| `design-docs/`             | design_doc_read, design_doc_write                     | Full design doc lifecycle                   |
| `theme/`                   | load_theme, get_available_themes                      | loadTheme, getThemes                        |
| `app/zoom.ts`              | N/A (WebView zoom)                                    | setZoom, resetZoom                          |

---

## Stores (`src/lib/stores/`)

| Store                  | Owns                             | Key Exports                                |
| ---------------------- | -------------------------------- | ------------------------------------------ |
| `layout/layout.ts`     | Sidebar visibility, widths, tabs | layoutStore, toggleLeftSidebar, loadLayout |
| `vault/vault.ts`       | Active vault, notes, active note | vaultStore, setActiveNote                  |
| `theme/theme.ts`       | Theme preference                 | theme (store + setTheme + toggleTheme)     |
| `status/status.ts`     | Status bar messages              | statusStore                                |
| `commands/commands.ts` | Command palette registry         | commandStore, registerCommand              |

---

## Features (`src/lib/features/`)

| Feature        | Public Barrel            | Components                     | Stores                    |
| -------------- | ------------------------ | ------------------------------ | ------------------------- |
| `canvas/`      | `@/features/canvas`      | CanvasWorkspace, CanvasToolbar | canvasStore, historyStore |
| `tag/`         | `@/features/tag`         | TagPanel, TagInput             | tagStore                  |
| `tasks/`       | `@/features/tasks`       | TaskPanel, KanbanPanel         | taskStore                 |
| `graph/`       | `@/features/graph`       | GraphSidebarPanel              | graphStore                |
| `template/`    | `@/features/template`    | TemplatePanel                  | templateStore             |
| `changelog/`   | `@/features/changelog`   | ChangelogPanel                 | changelogStore            |
| `rss/`         | `@/features/rss`         | RssFeedList                    | rssStore                  |
| `publishing/`  | `@/features/publishing`  | PublicationDashboard           | publishingStore           |
| `entity/`      | `@/features/entity`      | EntityBrowser                  | entityStore               |
| `capture/`     | `@/features/capture`     | CapturePanel                   | captureStore              |
| `gamify/`      | `@/features/gamify`      | TaskPanelUnified               | gamifyStore               |
| `periodic/`    | `@/features/periodic`    | PeriodicPanel                  | periodicStore             |
| `navigator/`   | `@/features/navigator`   | Navigator                      | navigatorStore            |
| `connections/` | `@/features/connections` | ConnectionsView                | connectionsLogic          |
| `backlinks/`   | `@/features/backlinks`   | BacklinksPanel                 | —                         |
| `flashcards/`  | `@/features/flashcards`  | FlashcardPanel                 | —                         |
| `search/`      | `@/features/search`      | SearchPanel                    | —                         |
| `git/`         | `@/features/git`         | GitPanel                       | —                         |
| `linting/`     | `@/features/linting`     | WritingLintPanel               | —                         |
| `calendar/`    | `@/features/calendar`    | CalendarPanel                  | calendarStore             |
| `speedreader/` | `@/features/speedreader` | SpeedReaderPanel               | —                         |
| `voice/`       | `@/features/voice`       | VoicePanel                     | —                         |
| `longform/`    | `@/features/longform`    | LongformPanel                  | longformStore             |
| `arbor/`       | `@/features/arbor`       | ArborEditor                    | arborStore                |
| `wikilink/`    | `@/features/wikilink`    | AutoLinker                     | —                         |
| `versioning/`  | `@/features/versioning`  | VersioningPanel                | versionStore              |
| `music/`       | `@/features/music`       | MusicPanel                     | —                         |
| `media/`       | `@/features/media`       | MediaPanel                     | —                         |
| `spreadsheet/` | `@/features/spreadsheet` | SpreadsheetPanel               | —                         |
| `gym/`         | `@/features/gym`         | GymPanel                       | —                         |
| `pokemon/`     | `@/features/pokemon`     | PokemonPanel                   | —                         |
| `llm/`         | `@/features/llm`         | LlmPanel                       | —                         |
| `nas/`         | `@/features/nas`         | NasPanel                       | —                         |
| `ocr/`         | `@/features/ocr`         | OcrImportDialog                | —                         |

---

## Components (`src/lib/components/`)

| Domain      | Purpose                                 | Key Components                         |
| ----------- | --------------------------------------- | -------------------------------------- |
| `sidebar/`  | Sidebar shell, tab bar, content routing | SidebarShell, VerticalTabBar           |
| `vault/`    | File tree, toolbar                      | FileTree, FileTreeNode, VaultToolbar   |
| `editor/`   | CodeMirror wrapper, extensions          | Editor, EditorToolbar                  |
| `note/`     | Note view, preview                      | NoteView, NotePreview                  |
| `canvas/`   | Canvas workspace                        | CanvasWorkspaceInteractive             |
| `overlays/` | Modals, palettes                        | CommandPalette, SettingsModal          |
| `ui/`       | Shared UI primitives                    | Icon, ActionButton, PanelHeader, Modal |
| `icons/`    | Icon component                          | Icon.svelte                            |

---

## Utils (`src/lib/utils/`)

| Module                      | Purpose                      | Key Exports                     |
| --------------------------- | ---------------------------- | ------------------------------- |
| `ipc/invoke.ts`             | Type-safe IPC wrapper        | ipcCall                         |
| `storage/persistedStore.ts` | localStorage-backed store    | createPersistedStore            |
| `logger/logger.ts`          | Unified frontend logger      | log                             |
| `wikilink/`                 | Wikilink parsing             | parseWikilinks, resolveWikilink |
| `accessibility/`            | Focus trap, keyboard helpers | createFocusTrap                 |
| `style/`                    | CSS utility helpers          | (various)                       |

---

## Backend (`src-tauri/src/`)

| Module      | Purpose                                        |
| ----------- | ---------------------------------------------- |
| `commands/` | Tauri command handlers (split by domain)       |
| `services/` | Business logic (vault_service, canvas, search) |
| `logger.rs` | Tracing-based structured logging               |
| `engine.rs` | Core vault indexing engine                     |

---

## Architecture Tests (`tests/architecture/__tests__/`)

| Test                   | Validates                                 |
| ---------------------- | ----------------------------------------- |
| `fileSizes.test.ts`    | 300-line limit + 8-file density           |
| `iconRegistry.test.ts` | All Icon refs resolve to iconPaths        |
| `imports.test.ts`      | Layer separation (no cross-layer imports) |
| `codeMap.test.ts`      | CODE_MAP.md paths match filesystem        |
