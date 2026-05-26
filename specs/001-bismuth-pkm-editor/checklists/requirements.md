# Specification Quality Checklist: Bismuth — Personal Knowledge Management Editor

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-05-25
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain — **RESOLVED**: Runtime host = Tauri v2, Structured data = YAML frontmatter (confirmed in plan.md)
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All [NEEDS CLARIFICATION] items resolved before planning proceeds
- [x] User stories are independently testable
- [x] Each user story delivers standalone MVP value
- [x] Priorities (P1–P7) assigned to all user stories (US8 P3, US9 P4 added)
- [x] Key entities defined

## Constitution Alignment

- [x] FR-026 enforces code reuse principle (Constitution I)
- [x] SC-005 mandates 90% coverage across lines, branches, statements, functions (Constitution II)
- [x] FR-027 and SC-007 enforce consistent design across all surfaces (Constitution III)
- [x] NFR-001–NFR-007 define measurable performance budgets (Constitution IV)
- [x] SC-006 mandates cross-platform validation on Windows, macOS, Linux (Constitution IV)
- [x] Assumptions section documents deferred architectural decisions (Constitution V)

## Open Items

- [x] Resolve: Runtime host (Tauri vs Electron vs browser) — **RESOLVED**: Tauri v2.10.0 selected (plan.md)
- [x] Resolve: Structured data format (YAML frontmatter / sidecar JSON / SQLite) — **RESOLVED**: YAML frontmatter selected (plan.md)
- [x] Spec directory restructured to `specs/feature/001-bismuth-pkm-editor/` (type-based organization adopted)
- [x] User Story 8 (Search Engine — MiniSearch, BM25, OCR, HTTP API, Vim nav) added as P3
- [x] User Story 9 (Canvas — JSON Canvas, nodes/edges, groups, portals, presentation) added as P4
- [x] User Story 10 (Local REST API & MCP Server — CRUD, surgical patch, JsonLogic search, periodic notes, command execution, API key auth, MCP protocol) added as P3
- [x] User Story 11 (Capture & Lifecycle Dashboard — inbox triage, quick capture, batch classify, archived visibility, real-time REST API integration) added as P2
- [x] User Story 12 (Template Engine — `<% %>` tokens, `tp.file`/`tp.date` modules, sandboxed JS blocks, folder-scoped and Portent-type templates, helper functions, error containment) added as P2
- [x] User Story 13 (Content Consumption: Feeds & RSVP Speed Reader — RSS/Atom/JSON/YouTube/podcast, reader view, save-to-vault, OPML; **merged with US21**: RSVP overlay, ORP highlight, markdown stripping, natural pacing, live WPM, focus mode) added as P5 *(Group G)*
- [x] User Story 14 (Typing Enhancements & Rule Engine — CJK auto-spacing, full-width punctuation, auto-pairing, tabout, smart backspace/paste, format commands, Input/Delete/SelectKey rules with regex/tabstops/JS sandbox, JSON import/export) added as P3
- [x] User Story 15 (Notebook Navigator — two-pane browser, folder/tag/property tree, vault profiles, shortcut slots 1-9, filter search with AND/OR/date/property operators, pin, color+icon, drag-and-drop, multi-select, folder notes, calendar, public plugin API) added as P1
- [x] User Story 16 (Note Sequencer — `prev`/`next` frontmatter chain, header arrows, insert before/after, remove/delete with auto-reconnect, sibling-only picker, cycle detection warning) added as P4
- [x] User Story 17 (Vertical Tabs & Tab Management — vertical list, tab groups with 4 view modes, Zen Mode, per-tab zoom, enhanced keyboard switcher, tab history, Smart Navigation, Ephemeral tabs, Tab Deduplication, hover preview, group colors/icons) added as P3
- [x] User Story 18 (Long-form Project & Draft Management — frontmatter-native project/scene/sub-scene/draft model, versioned draft snapshots, Manuscript Builder with presets and 4 export formats, continuous Preview tab, status-based scene workflow, Scrivener 3 import) added as P3
- [x] User Story 19 (Branching Block Editor — left-to-right block tree in a single note, HTML-comment block markers, base64 metadata recovery, block CRUD/move/duplicate/drag-and-drop, selected-block panel, context dimming, block search, independent undo/redo) added as P4
- [x] User Story 20 (Radial Story Timeline — SVG radial diagram per project, subplot rings, 4 grammar modes: Narrative/Chronologue/Progress/Gossamer, hover tooltips, cross-ring subplot highlighting, reactive frontmatter updates, zoom/pan) added as P4
- [x] User Story 21 — **consolidated into US13** (forwarding reference retained; see Group G)
- [x] User Story 22 (Git Version Control — auto-detect repo, Source Control View, History View, Diff View, editor gutter signs with per-hunk stage/reset, auto commit-and-sync schedule, auto-pull on startup, branch/remote management, GitHub open-in-browser, .gitignore editor) added as P2
- [x] User Story 23 (Startup Experience, Homepage & Personal Tips — 7 homepage types, 3 tab behaviors, view-revert, post-open command chain; **merged with US24**: tips library in `.bismuth/tips/`, 3 display surfaces, random/sequential cycling, snooze/dismiss) added as P3 *(Group I)*
- [x] User Story 24 — **consolidated into US23** (forwarding reference retained; see Group I)
- [x] User Story 31 (Digital Garden Publishing — selective publish via `dg-publish: true` frontmatter flag, static site with wikilinks/embeds/transclusions/callouts/MathJax/Mermaid/Dataview/Canvas/Excalidraw, file-tree/search/backlinks/graphs/TOC/hover previews, theme + Style Settings + custom regex filters, Vercel/Netlify one-click deploy, Publish command with Git push + rebuild trigger, local preview server with hot-reload) added as P4 *(Group H)*
- [x] User Story 30 (LaTeX Math Suite — snippet engine with text/regex triggers and JS function replacements, built-in Greek/math library with JSON import/export, auto-fraction, matrix shortcuts, Conceal mode with delayed reveal, Tab-navigation, inline math preview popover, visual wrapping snippets, auto-enlarge brackets, bracket color/highlight, Box/Select equation commands) added as P3 *(Group D)*
- [x] User Story 29 (Typewriter Mode & Focus Writing — typewriter scrolling at configurable screen position, current line highlight, paragraph dimming, sentence dimming, configurable line-length limit, cursor position restore, Hemingway mode, all sub-features independently togglable, per-instance in split/popout panes) added as P3 *(Group D)*
- [x] User Story 28 (Rich Editing Toolbar — top/following/tiny display modes, built-in formatting slots incl. font/background color pickers, text alignment, H1–H6, indent/undent, focus modes; drag-and-drop slot reorder; custom icons/names; submenus; formatting brush; adaptive icon width; multi-window support) added as P2 *(Group D)*
- [x] User Story 27 (Semantic Connections & Vault Intelligence — local embedding model, zero-setup background indexing, Connections view with auto-update/pin/pause/random/copy, Lookup view for natural language queries, drag-to-insert wikilink, excluded paths/tags, configurable model, `.bismuth/embeddings/` cache auto-gitignored) added as P2 *(Group A)*
- [x] User Story 26 (Recent Files Sidebar — reverse-chronological sidebar panel, real-time updates, session persistence, click/Ctrl-click/right-click/drag interactions, hover preview, folder+tag+bookmark exclusions, frontmatter display title support) added as P3 *(Group C)*
- [x] User Story 25 (Vault Activity Changelog — dedicated changelog note, auto-update on file save within 2 s, manual update command, configurable path/datetime format/max entries/wikilinks/heading/excluded folders, self-exclusion, atomic overwrite with edit warning) added as P4
- [x] FR-011 strengthened to require Obsidian theme compatibility (CSS variable naming conventions: `--background-primary`, `--text-normal`, `--interactive-accent`, etc.) + Style Settings system (parse `/* @settings` YAML in CSS, generate dynamic UI for class toggles, variable controls, color gradients, themed colors, sliders, localization)
- [x] Assumption added: Bismuth UI foundation MUST be Obsidian-compatible; Tolaria referenced as prior art for component library design
- [x] FR-245–FR-247 added to US2 for consistent wikilink note creation (New Note Fixer behavior): always respect default location setting, ignore path components in wikilinks, prevent creation outside vault root
- [x] FR-248–FR-251 added to US5 for comprehensive Linter (beyond write-good): 50+ independently togglable rules across YAML/Headings/Footnotes/Content/Spacing categories, manual + auto-on-save + paste rules, per-rule configuration, change summary + undo integration
- [x] FR-252–FR-255 added to US11 for Inbox Organiser: auto-move newly created notes from watched folder to inbox, organizer modal with folder-picker dropdowns for batch/individual moves, periodic reminders with dismissible notices, independent inbox/watched folder configuration
- [x] FR-256–FR-258 added to US3 for automatic note linking (beyond basic FR-010 suggestions): command palette accessible scanner for unlinked references to note titles/aliases, reviewable list grouped by target note, batch link creation with atomic operation + undo, respect existing wikilinks, case-insensitive matching option
- [x] FR-015 strengthened to specify write-good checks: passive voice, lexical illusions, "So"/"There is/are" sentence starts, weasel words, adverbs, wordy phrases, clichés, E-Prime violations; each check independently togglable; opt-in per note via command/hotkey
- [x] FR-024 strengthened for Tag Wrangler features: context menu with rename (hierarchical child propagation + merge warnings), search (add/exclude), tag pages (create/open aliased notes, Alt-click, hover preview), drag-and-drop reorganization, collapse/expand, random note; renaming uses parse data to avoid false matches, updates body + frontmatter YAML atomically
- [x] FR-131 confirmed to cover Mononote behavior: Tab Deduplication prevents opening same note in multiple tabs, redirects focus to existing tab instead; configurable scope (same group, all groups, including sidebar/popup)
- [x] FR-266–FR-267 added to spec.md for Longform features: single-scene projects (prose in project note itself, not separate scenes) + daily writing session goals (word count/duration targets, real-time progress, daily reset, configurable scope)
- [x] FR-268–FR-272 added to spec.md for Kanban boards: markdown-backed boards stored as notes, columns as headings, cards as list items with metadata, drag-and-drop between columns, card editing (inline/modal), date tracking, tags, linked notes, archive column, board/column/card settings, board view + source view toggle
- [x] FR-273–FR-274 added to spec.md for automatic metadata updates: auto-update frontmatter `created` (ctime) and `updated` (mtime) on file save, configurable date format (Obsidian default or custom), support string/number types (Unix timestamps), exclude folders (templates), read from filesystem for external changes
- [x] FR-259–FR-265 added to US5 for comprehensive PDF++ features (beyond basic FR-017): backlink-to-highlight transformation with `&color=` parameter, color palette toolbar with customizable link templates, hover-to-preview/open + double-click-to-open highlights, backlink filtering by page + bidirectional hover sync + optional direct PDF annotation, page composition + outline editing + page labels, enhanced PDF embeds (click-to-open, trim-selection, rect embeds), keyboard shortcuts + external app integration with focus sync
- [x] FR-028–FR-244, NFR-009–NFR-026, SC-011–SC-057 added for search, canvas, API, lifecycle, templates, feeds, typing, navigator, sequencer, tabs, longform, branching, radial timeline, speed reader, git, homepage, tips, changelog, recent files, semantic connections, rich editing toolbar, typewriter mode, LaTeX math suite, and digital garden publishing
- [x] Resolve the 2 remaining NEEDS CLARIFICATION markers before proceeding to /speckit.plan — **COMPLETE**: All items resolved
