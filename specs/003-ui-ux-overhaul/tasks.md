# Tasks: UI/UX Overhaul & Consistency Pass

**Input**: Design documents from `/specs/003-ui-ux-overhaul/`

**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: Not explicitly requested. No test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US32, US33)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create new shared types, styles, and stores that multiple user stories depend on.

- [x] T001 Create layout types file with StatusItem, SidebarTab, and SidebarConfig interfaces in `src/lib/types/layout.ts`
- [x] T002 [P] Create shared UI patterns stylesheet with badge, card, and button utility classes in `src/lib/styles/ui-patterns.css`
- [x] T003 [P] Create inspector panel shared stylesheet with consistent padding/typography classes in `src/lib/styles/inspector.css`
- [x] T004 Import new stylesheets in `src/App.svelte` (add `@/styles/ui-patterns.css` and `@/styles/inspector.css`)

**Checkpoint**: Shared types and styles available for all user stories.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core stores and abstractions that user stories build upon.

- [x] T005 Create extensible status store in `src/lib/stores/status/status.ts` with `registerStatusItem`, `removeStatusItem`, `statusItemsLeft`, `statusItemsRight`, `statusItemsCenter` exports
- [x] T006 [P] Create status store barrel export in `src/lib/stores/status/index.ts`
- [x] T007 Add `sidebarTabOrder` and `rightSidebarTabOrder` fields to layout store in `src/lib/stores/layout/layout.ts`

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: US32 — Unified Sidebar Architecture (P1) 🎯 MVP

**Goal**: Left and right sidebars share the same structural shell with extensible, configurable icon buttons.

**Independent Test**: Both sidebars render with mirrored look/feel; icons are configurable via props; no collapse arrow in panel header.

- [x] T008 [US32] Refactor `VerticalTabBar` to accept a `tabs` prop instead of hardcoded arrays in `src/lib/components/sidebar/VerticalTabBar.svelte`
- [x] T009 [US32] Remove hardcoded `leftTabs`, `rightTabs`, and `bottomTabs` arrays from `VerticalTabBar`; receive them as props with defaults
- [x] T010 [US32] Create `SidebarShell.svelte` component wrapping VerticalTabBar + ResizablePanel content in `src/lib/components/sidebar/SidebarShell.svelte`
- [x] T011 [US32] Remove the collapse arrow button from `ResizablePanel` panel-header (lines 74-87) in `src/lib/components/layout/ResizablePanel.svelte`
- [x] T012 [US32] Keep expand button for collapsed state but remove the panel-header arrow when panel is open in `src/lib/components/layout/ResizablePanel.svelte`
- [x] T013 [US32] Update `App.svelte` left sidebar to use `SidebarShell` with configured left tabs in `src/App.svelte`
- [x] T014 [US32] Add a `VerticalTabBar` instance to the right sidebar with right-specific tabs (backlinks, outline, properties, calendar) in `src/App.svelte`
- [x] T015 [US32] Wire right sidebar tab selection to show corresponding content panel (replace static `TabbedPanel`) in `src/App.svelte`
- [x] T016 [US32] Add sidebar tab swap support: store tab assignments in `layoutStore` (`leftTabs`/`rightTabs` arrays) in `src/lib/stores/layout/layout.ts`
- [x] T017 [US32] Add `moveTabToSidebar(tabId, target: 'left' | 'right')` action to layout store in `src/lib/stores/layout/layout.ts`

**Checkpoint**: Sidebars are visually symmetric, extensible via config, no redundant collapse arrows.

---

## Phase 4: US33 — Status Bar & Editor Footer Consolidation (P1)

**Goal**: Single extensible status bar replaces both `StatusBar.svelte` and the `.editor-footer` in NoteEditor.

**Independent Test**: Status bar shows vault info left, editor stats right. No duplicate footer in editor area. Saving indicator in status bar.

- [x] T018 [US33] Refactor `StatusBar.svelte` to read status items from the status store instead of computing inline in `src/lib/components/layout/StatusBar.svelte`
- [x] T019 [US33] Render left/center/right status item groups from store data in `StatusBar.svelte` in `src/lib/components/layout/StatusBar.svelte`
- [x] T020 [US33] Register vault info (vault name, note count) as status items from `App.svelte` using the status store in `src/App.svelte`
- [x] T021 [US33] Remove `.editor-footer` div and its styles from `NoteEditor.svelte` in `src/lib/components/note/NoteEditor.svelte`
- [x] T022 [US33] Push editor stats (word count, char count, line count) to status store from `NoteEditor.svelte` on content change in `src/lib/components/note/NoteEditor.svelte`
- [x] T023 [US33] Push saving indicator to status store (show "Saving..." / "Saved" in status bar) from `NoteEditor.svelte` in `src/lib/components/note/NoteEditor.svelte`
- [x] T024 [US33] Remove duplicated word/line/char count reactive declarations from `StatusBar.svelte` (now comes from store) in `src/lib/components/layout/StatusBar.svelte`

**Checkpoint**: Single status bar at bottom; no duplicate footer; any component can register status items.

---

## Phase 5: US34 — Search UX Improvement (P2)

**Goal**: Dedicated in-sidebar search panel with real-time results, content snippets, and filters.

**Independent Test**: Selecting search tab shows SearchPanel with input, real-time results, and filter chips. CommandPalette still works via Cmd+P.

- [x] T025 [P] [US34] Create `SearchPanel.svelte` component with search input, results list, and filter area in `src/lib/components/sidebar/SearchPanel.svelte`
- [x] T026 [US34] Implement real-time search (debounced 200ms) against notes store with title and content matching in `src/lib/components/sidebar/SearchPanel.svelte`
- [x] T027 [US34] Add content snippet rendering with highlighted match terms in search results in `src/lib/components/sidebar/SearchPanel.svelte`
- [x] T028 [US34] Add filter chips UI (tag filter, date range filter) in `src/lib/components/sidebar/SearchPanel.svelte`
- [x] T029 [US34] Persist recent searches (last 10) to localStorage and show as suggestions when input empty in `src/lib/components/sidebar/SearchPanel.svelte`
- [x] T030 [US34] Replace the search placeholder in `App.svelte` left sidebar (the `sidebar-placeholder` div) with `SearchPanel` component in `src/App.svelte`

**Checkpoint**: Search tab shows full search experience; CommandPalette remains as quick-switch.

---

## Phase 6: US35 — Capture Inbox Redesign (P2)

**Goal**: Modern, visually polished capture inbox with better card design and always-accessible batch operations.

**Independent Test**: Capture cards show colored type badges, relative dates, hover actions. Batch bar always visible. Sort/filter dropdown works.

- [x] T031 [P] [US35] Redesign `CaptureNoteCard.svelte` with colored type badge, relative timestamp, truncated content preview, hover quick-actions in `src/lib/components/capture/CaptureNoteCard.svelte`
- [x] T032 [US35] Add quick-action buttons (classify, archive, delete) that appear on card hover without requiring selection in `src/lib/components/capture/CaptureNoteCard.svelte`
- [x] T033 [US35] Redesign `CaptureBatchBar.svelte` to always be visible (collapsed state with count badge, expands on selection) in `src/lib/components/capture/CaptureBatchBar.svelte`
- [x] T034 [US35] Add sort/filter dropdown to `CaptureDashboard.svelte` header (sort by date/type/lifecycle, filter by type) in `src/lib/components/capture/CaptureDashboard.svelte`
- [x] T035 [US35] Redesign empty state in `CaptureDashboard.svelte` with illustration icon, descriptive text, and Quick Capture CTA button in `src/lib/components/capture/CaptureDashboard.svelte`
- [x] T036 [US35] Apply `ui-patterns.css` badge and card classes to capture components in `src/lib/components/capture/CaptureDashboard.svelte`

**Checkpoint**: Capture inbox feels modern; cards are scannable; batch ops are discoverable.

---

## Phase 7: US36 — Settings Modal Cleanup (P2)

**Goal**: Settings modal uses design tokens, has consistent alignment, and is properly wired to the sidebar button.

**Independent Test**: Clicking settings icon in sidebar opens the modal. All spacing/fonts use tokens. Labels aligned left, inputs aligned right.

- [x] T037 [US36] Wire settings button in `VerticalTabBar` to emit an `openSettings` event or call a store action instead of setting `activeTab` in `src/lib/components/sidebar/VerticalTabBar.svelte`
- [x] T038 [US36] Handle settings open action in `App.svelte` — open `SettingsModal` when settings button is clicked in `src/App.svelte`
- [x] T039 [US36] Refactor `SettingsModal.svelte` styles: replace all hard-coded px values with `--spacing-*`, `--font-*`, `--radius-*` tokens in `src/lib/components/modals/SettingsModal.svelte`
- [x] T040 [US36] Fix `.settings-sidebar` tab button alignment and add proper focus states in `src/lib/components/modals/SettingsModal.svelte`
- [x] T041 [P] [US36] Standardize `SettingsGeneral.svelte` with consistent `.setting-group`, `.setting-item`, `.setting-hint` class pattern and design tokens in `src/lib/components/settings/SettingsGeneral.svelte`
- [x] T042 [P] [US36] Standardize `SettingsEditor.svelte` with consistent layout and design tokens in `src/lib/components/settings/SettingsEditor.svelte`
- [x] T043 [P] [US36] Standardize `SettingsAppearance.svelte` with consistent layout and design tokens in `src/lib/components/settings/SettingsAppearance.svelte`
- [x] T044 [P] [US36] Standardize `SettingsVault.svelte` with consistent layout and design tokens in `src/lib/components/settings/SettingsVault.svelte`
- [x] T045 [P] [US36] Standardize `SettingsHotkeys.svelte` with consistent layout and design tokens in `src/lib/components/settings/SettingsHotkeys.svelte`
- [x] T046 [P] [US36] Standardize `SettingsAbout.svelte` with consistent layout and design tokens in `src/lib/components/settings/SettingsAbout.svelte`
- [x] T047 [US36] Add section dividers between setting groups and proper h3/h4 heading hierarchy across all settings panels in `src/lib/components/settings/`

**Checkpoint**: Settings modal looks polished, properly wired, consistent typography.

---

## Phase 8: US37 — Inspector Panel Styling Fix (P2)

**Goal**: Right sidebar inspector panels have consistent styling with shared CSS.

**Independent Test**: Switching between backlinks/entity/connections/git tabs shows consistent padding, fonts, and empty states.

- [x] T048 [US37] Apply `inspector.css` shared classes to `TabbedPanel.svelte` — fix tab indicator to use accent color and ensure fixed tab bar in `src/lib/components/sidebar/TabbedPanel.svelte`
- [x] T049 [P] [US37] Apply inspector panel styles to `BacklinksPanel.svelte` — standardize padding, list styles, empty state in `src/lib/components/sidebar/BacklinksPanel.svelte`
- [x] T050 [P] [US37] Apply inspector panel styles to `EntityPanel.svelte` — standardize padding, headings, content layout in `src/lib/components/sidebar/EntityPanel.svelte`
- [x] T051 [P] [US37] Apply inspector panel styles to `ConnectionsView.svelte` — standardize padding, list rendering, empty state in `src/lib/components/sidebar/ConnectionsView.svelte`
- [x] T052 [P] [US37] Apply inspector panel styles to `GitPanel.svelte` — standardize padding, status display, empty state in `src/lib/components/sidebar/GitPanel.svelte`
- [x] T053 [US37] Ensure consistent scrolling behavior: tabs fixed at top, `.panel-content` scrolls independently in `src/lib/components/sidebar/TabbedPanel.svelte`

**Checkpoint**: All inspector panels look unified; consistent empty states, padding, and typography.

---

## Phase 9: US38 — Notes Navigator Expansion (P3)

**Goal**: FileTree shows folder hierarchy with expand/collapse, drag-to-move, and context menu.

**Independent Test**: File tree shows nested folders; folders expand/collapse on click; right-click shows context menu; drag note to folder moves it.

- [x] T054 [US38] Refactor `FileTree.svelte` to build a tree structure from flat note paths (group by directory) in `src/lib/components/vault/FileTree.svelte`
- [x] T055 [US38] Render folder nodes as expandable/collapsible tree items with indent levels in `src/lib/components/vault/FileTree.svelte`
- [x] T056 [US38] Add expand/collapse state tracking (per-folder, persisted to localStorage) in `src/lib/components/vault/FileTree.svelte`
- [x] T057 [US38] Implement drag-and-drop: drag note onto folder to move it (call vault service `moveNote`) in `src/lib/components/vault/FileTree.svelte`
- [x] T058 [P] [US38] Create `FileTreeContextMenu.svelte` with rename, delete, move, new-note-in-folder actions in `src/lib/components/vault/FileTreeContextMenu.svelte`
- [x] T059 [US38] Wire right-click on file tree items to show `FileTreeContextMenu` in `src/lib/components/vault/FileTree.svelte`
- [x] T060 [US38] Add sort options dropdown (name, modified, created) to file tree header in `src/lib/components/vault/FileTree.svelte`
- [x] T061 [US38] Add inline folder creation (new folder button in header, inline rename input) in `src/lib/components/vault/FileTree.svelte`

**Checkpoint**: File tree shows hierarchy, supports drag-to-move, right-click context menu, sorting.

---

## Phase 10: US39 — Accessibility Audit & Fixes (P3)

**Goal**: All components pass basic accessibility requirements: keyboard navigation, aria labels, focus trapping, contrast.

**Independent Test**: Tab through all UI elements; all buttons reachable and labeled; modals trap focus; contrast ratios pass WCAG AA.

- [x] T062 [P] [US39] Audit and add missing `aria-label` to all icon-only buttons across all component files in `src/lib/components/`
- [x] T063 [US39] Implement focus trap utility function in `src/lib/utils/focusTrap.ts`
- [x] T064 [US39] Apply focus trap to `SettingsModal.svelte` — trap focus on open, return focus on close in `src/lib/components/modals/SettingsModal.svelte`
- [x] T065 [P] [US39] Apply focus trap to `CommandPalette.svelte` in `src/lib/components/modals/CommandPalette.svelte`
- [x] T066 [P] [US39] Apply focus trap to `AutoLinker.svelte` in `src/lib/components/modals/AutoLinker.svelte`
- [x] T067 [US39] Add arrow-key navigation to `VerticalTabBar.svelte` (up/down arrows cycle through tabs) in `src/lib/components/sidebar/VerticalTabBar.svelte`
- [x] T068 [US39] Add arrow-key navigation to `TabbedPanel.svelte` tabs (left/right arrows) in `src/lib/components/sidebar/TabbedPanel.svelte`
- [x] T069 [US39] Add arrow-key navigation to file tree items (up/down, left to collapse, right to expand) in `src/lib/components/vault/FileTree.svelte`
- [x] T070 [US39] Audit color contrast in `tokens.css` — verify `--text-muted` against backgrounds meets 4.5:1 ratio in `src/lib/styles/tokens.css`
- [x] T071 [US39] Add skip-to-content link as first focusable element in `src/App.svelte`
- [x] T072 [US39] Add `role`, `aria-expanded`, `aria-selected` attributes to sidebar tabs and tree nodes in `src/lib/components/sidebar/VerticalTabBar.svelte` and `src/lib/components/vault/FileTree.svelte`

**Checkpoint**: App is keyboard-navigable; modals trap focus; contrast passes WCAG AA.

---

## Phase 11: US40 — Grid System Adoption & Drag-to-Rearrange (P3)

**Goal**: Settings uses grid classes; sidebar tabs and status items are drag-reorderable.

**Independent Test**: Settings form uses grid layout; sidebar tabs can be dragged to reorder; order persists.

- [x] T073 [US40] Refactor `SettingsModal.svelte` body layout to use `.grid .grid-cols-*` classes from `grid-system.css` in `src/lib/components/modals/SettingsModal.svelte`
- [x] T074 [US40] Refactor settings panels to use grid classes for form label/input alignment in `src/lib/components/settings/SettingsGeneral.svelte`
- [x] T075 [US40] Add `draggable` attribute and drag event handlers to `VerticalTabBar` tab buttons for reordering in `src/lib/components/sidebar/VerticalTabBar.svelte`
- [x] T076 [US40] Implement drag-to-reorder logic: update `sidebarTabOrder` in layout store on drop in `src/lib/stores/layout/layout.ts`
- [x] T077 [US40] Persist tab order changes to localStorage via the existing `enableAutoSave` mechanism in `src/lib/stores/layout/layout.ts`
- [x] T078 [US40] Add drag-to-reorder for status bar items (left/right sections) in `src/lib/components/layout/StatusBar.svelte`
- [x] T079 [US40] Persist status item order in localStorage from the status store in `src/lib/stores/status/status.ts`

**Checkpoint**: Grid system used in settings; sidebar tabs and status items are draggable and persist order.

---

## Phase 12: US41 — File & Folder Structure Cleanup (P3)

**Goal**: Consistent file structure with barrel exports and co-located features.

**Independent Test**: All imports resolve correctly after moves; barrel files export all public components; README documents conventions.

- [x] T080 [P] [US41] Create barrel `index.ts` for `src/lib/components/sidebar/` exporting all sidebar components
- [x] T081 [P] [US41] Create barrel `index.ts` for `src/lib/components/layout/` exporting all layout components
- [x] T082 [P] [US41] Create barrel `index.ts` for `src/lib/components/capture/` exporting all capture components
- [x] T083 [P] [US41] Create barrel `index.ts` for `src/lib/components/settings/` exporting all settings components
- [x] T084 [P] [US41] Create barrel `index.ts` for `src/lib/components/vault/` exporting all vault components
- [x] T085 [US41] Move `src/lib/components/backlinks/` contents into `src/lib/components/sidebar/` (consolidate with BacklinksPanel already there)
- [x] T086 [US41] Rename `src/lib/components/modals/` to `src/lib/components/overlays/` and update all imports across codebase
- [x] T087 [US41] Create sub-directories: `overlays/command-palette/`, `overlays/settings/`, `overlays/auto-linker/` and move respective files
- [x] T088 [US41] Update all import paths in `src/App.svelte` and other files referencing moved components
- [x] T089 [US41] Create `src/lib/components/README.md` documenting the component directory conventions and naming rules
- [x] T090 [US41] Verify all imports resolve correctly and app builds without errors after restructuring

**Checkpoint**: Consistent structure; barrel exports; README documents conventions; build passes.

---

## Phase 13: Polish & Cross-Cutting Concerns

**Purpose**: Final integration verification and cleanup across all stories.

- [x] T091 Verify both sidebars render correctly with all tab configurations in `src/App.svelte`
- [x] T092 Verify status bar correctly shows items from multiple sources (vault, editor, plugins) in `src/lib/components/layout/StatusBar.svelte`
- [x] T093 Run full app build and verify no TypeScript errors across all modified files (verified: no broken imports remain)
- [x] T094 Verify localStorage backwards compatibility (old layout prefs still load correctly) in `src/lib/stores/layout/layout.ts`
- [x] T095 [P] Remove any dead code, unused imports, and commented-out blocks introduced during refactoring across `src/lib/components/`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories
- **Phase 3 (US32)**: Depends on Phase 2 — foundation for US34, US35, US38
- **Phase 4 (US33)**: Depends on Phase 2 — standalone, can parallel with US32
- **Phase 5 (US34)**: Depends on US32 (sidebar shell for SearchPanel)
- **Phase 6 (US35)**: Soft dependency on US32 (styling patterns)
- **Phase 7 (US36)**: Depends on Phase 2 — standalone
- **Phase 8 (US37)**: Depends on Phase 1 (inspector.css) — standalone
- **Phase 9 (US38)**: Depends on US32 (sidebar content area)
- **Phase 10 (US39)**: Should run after US32-US38 (audit final component state)
- **Phase 11 (US40)**: Depends on Phase 2 — standalone, pairs with US36
- **Phase 12 (US41)**: Run LAST to avoid merge conflicts with all other stories
- **Phase 13 (Polish)**: After all stories complete

### User Story Dependencies

```text
US32 ──┬──→ US34 (SearchPanel needs sidebar shell)
       ├──→ US35 (capture uses sidebar styling)
       └──→ US38 (navigator in sidebar content)

US33 ──→ standalone (no deps beyond Phase 2)
US36 ──→ standalone
US37 ──→ standalone (only needs inspector.css from Phase 1)
US39 ──→ after US32-US38 (audit final state)
US40 ──→ standalone (pairs with US36)
US41 ──→ LAST (file moves would conflict with active work)
```

### Parallel Opportunities

- **Phase 1**: T002, T003 can run in parallel
- **Phase 2**: T005, T006, T007 can run in parallel
- **US32 + US33**: Can run in parallel (different files)
- **US36 + US37**: Can run in parallel (settings vs inspector)
- **US36 settings panels**: T041-T046 all parallelizable (different files)
- **US37 inspector panels**: T049-T052 all parallelizable (different files)
- **US39 focus traps**: T064-T066 parallelizable
- **US41 barrel files**: T080-T084 all parallelizable

---

## Implementation Strategy

### MVP First (US32 + US33)

1. Complete Phase 1: Setup (types, styles)
2. Complete Phase 2: Foundational (status store, layout extensions)
3. Complete Phase 3: US32 (sidebar architecture)
4. Complete Phase 4: US33 (status consolidation)
5. **STOP and VALIDATE**: Sidebars symmetric, single status bar works

### Incremental Delivery

1. Setup + Foundational → shared infrastructure ready
2. US32 + US33 → layout foundation shipped (MVP!)
3. US34 + US35 + US36 + US37 → UX polish shipped
4. US38 + US39 + US40 → deep improvements shipped
5. US41 → file cleanup shipped last

---

## Summary

| Phase | Story | Tasks | Parallel |
|-------|-------|-------|----------|
| 1 Setup | — | 4 | 2 |
| 2 Foundational | — | 3 | 2 |
| 3 | US32 | 10 | 0 |
| 4 | US33 | 7 | 0 |
| 5 | US34 | 6 | 1 |
| 6 | US35 | 6 | 1 |
| 7 | US36 | 11 | 6 |
| 8 | US37 | 6 | 4 |
| 9 | US38 | 8 | 1 |
| 10 | US39 | 11 | 4 |
| 11 | US40 | 7 | 0 |
| 12 | US41 | 11 | 5 |
| 13 Polish | — | 5 | 1 |
| **Total** | | **95** | **27** |
