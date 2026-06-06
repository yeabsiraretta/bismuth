# Feature Specification: UI/UX Overhaul & Consistency Pass

**Feature**: 003-ui-ux-overhaul
**Priority**: P1 (MVP polish before release)
**Status**: Complete

---

## Overview

Comprehensive UI/UX improvements to the Bismuth PKM editor addressing layout symmetry, component extensibility, visual consistency, accessibility, and developer ergonomics. All changes are frontend-only and backwards-compatible with existing vaults.

---

## User Stories

### US32 — Unified Sidebar Architecture (P1)

**As a** user,
**I want** the left and right sidebars to look and feel the same while supporting different content,
**So that** the interface feels cohesive and predictable.

**Acceptance Criteria:**

- Both sidebars use the same structural shell component
- Icon buttons can be added to either sidebar's rail via configuration
- The redundant collapse arrow in the left sidebar panel header is removed
- Sidebar items can be moved between left and right via user preference

---

### US33 — Status Bar & Editor Footer Consolidation (P1)

**As a** user,
**I want** a single status bar that shows all relevant info without duplication,
**So that** I have a clean, consistent view of my editing context.

**Acceptance Criteria:**

- The `.editor-footer` in NoteEditor is removed
- A single `StatusBar` at the bottom shows vault info (left), editor stats (right)
- Any component can register status items (extensible API)
- Saving indicator appears in the status bar instead of inline

---

### US34 — Search UX Improvement (P2)

**As a** user,
**I want** a dedicated search panel in the sidebar with real-time results and filters,
**So that** I can find notes quickly without switching contexts.

**Acceptance Criteria:**

- A SearchPanel component renders in the left sidebar when the search tab is active
- Results update in real-time as the user types
- Content snippets with highlighted matches are shown
- Filter chips for tags, file type, date range are available
- Recent searches are persisted

---

### US35 — Capture Inbox Redesign (P2)

**As a** user,
**I want** the capture inbox to feel modern, organized, and easy to use,
**So that** I can quickly triage my captured notes.

**Acceptance Criteria:**

- Cards show colored type badges, relative timestamps, and content previews
- Quick-action buttons appear on hover without needing selection
- Sort and filter options are always accessible (not hidden behind selection)
- Empty state has a clear illustration and CTA
- Batch operations bar is always visible (collapsed when no selection)

---

### US36 — Settings Modal Cleanup (P2)

**As a** user,
**I want** the settings modal to look professional and well-aligned,
**So that** I can easily find and change configuration.

**Acceptance Criteria:**

- Settings button in the sidebar bottom actually opens the settings modal
- All spacing uses design tokens (no hard-coded pixels)
- Labels and inputs are consistently aligned
- Typography hierarchy is clear (sections → groups → items)
- The modal is visually polished with proper padding and dividers

---

### US37 — Inspector Panel Styling Fix (P2)

**As a** user,
**I want** the right sidebar inspector tabs to have consistent styling,
**So that** switching between panels feels seamless.

**Acceptance Criteria:**

- All inspector panels use shared CSS classes for consistent padding/typography
- Tab indicator uses the accent color consistently
- Empty states follow the same pattern across all panels
- Scrolling behavior is uniform (tabs fixed, content scrolls)

---

### US38 — Notes Navigator Expansion (P3)

**As a** user,
**I want** the file tree to show folder hierarchy with drag-to-move,
**So that** I can organize my notes spatially.

**Acceptance Criteria:**

- Folders render as expandable/collapsible tree nodes
- Drag-and-drop moves notes between folders
- Right-click context menu supports rename, delete, move, new note
- Sort options are available (name, modified, created)

---

### US39 — Accessibility Audit & Fixes (P3)

**As a** user relying on assistive technology,
**I want** the app to be fully keyboard-navigable and screen-reader friendly,
**So that** I can use all features without a mouse.

**Acceptance Criteria:**

- All icon-only buttons have `aria-label`
- Modals trap focus and return focus on close
- Sidebars support arrow-key navigation
- Color contrast meets WCAG AA (4.5:1 text, 3:1 UI)
- Skip-to-content link exists

---

### US40 — Grid System Adoption & Drag-to-Rearrange (P3)

**As a** power user,
**I want** to rearrange sidebar tabs and status items by dragging,
**So that** I can customize my workspace layout.

**Acceptance Criteria:**

- Settings form layouts use the grid system CSS classes
- Sidebar tabs are reorderable via drag
- Tab order persists across sessions
- Status bar items can be reordered

---

### US41 — File & Folder Structure Cleanup (P3)

**As a** developer,
**I want** a consistent, logical file structure with barrel exports,
**So that** navigating and importing is predictable.

**Acceptance Criteria:**

- Component directories have barrel `index.ts` files
- Related features are co-located (backlinks in sidebar, capture in sidebar)
- Modal/overlay components are grouped by function
- A `src/lib/components/README.md` documents the conventions

---

## Non-Functional Requirements

- **No new npm dependencies** unless explicitly justified
- **No backend changes** — all work is frontend TypeScript/Svelte/CSS
- **Backwards compatible** — existing vaults and localStorage settings continue to work
- **Performance** — no measurable regression in startup or interaction latency

---

## Out of Scope

- New features (e.g., new note types, AI integration, sync)
- Backend/Rust changes
- Mobile responsiveness (desktop-only for now)
- Plugin system architecture
