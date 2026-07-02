# Changelog

All notable changes to Bismuth will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.5.0 (2026-07-01)


### ⚠ BREAKING CHANGES

* Upgraded from Tauri 1.x to Tauri 2.x

Changes:
- Upgraded @tauri-apps/api: 1.6.0 → 2.11.0
- Upgraded @tauri-apps/cli: 1.6.3 → 2.11.2
- Added @tauri-apps/plugin-shell: 2.3.5
- Updated Cargo.toml: tauri 1.x → 2.x
- Updated tauri.conf.json to Tauri 2.x format
  - Changed devPath → devUrl
  - Changed distDir → frontendDist
  - Removed allowlist (now uses plugins)
  - Updated window configuration structure
- Updated main.rs to use plugin system

Icon Assets:
- Created SVG icon with Bismuth branding (purple gradient)
- Generated PNG icons using macOS sips tool:
  - icon.png (512x512)
  - 32x32.png
  - 128x128.png
  - 128x128@2x.png

Result: ✅ APPLICATION RUNS SUCCESSFULLY
- No more macOS event loop crash
- Tauri window opens properly
- Frontend renders correctly
- Hot reload works

Verified on macOS with Tauri 2.11.2

### 📚 Documentation

* add comprehensive MVP implementation checklist ([c8b0032](https://github.com/yeabsiraretta/bismuth/commit/c8b0032a65c081c11f32ad24f71cb7dceb399c98))
* add functional UI completion report ([2047ebf](https://github.com/yeabsiraretta/bismuth/commit/2047ebf7e5f0e362816142675a8e34992cc8dbdd))
* add Phase 2.1 completion milestone ([bde82b4](https://github.com/yeabsiraretta/bismuth/commit/bde82b443c08e5ab111f06c9169b08f3801725af))
* **assets:** create comprehensive assets tracking document ([db9775d](https://github.com/yeabsiraretta/bismuth/commit/db9775d8731b197c2569c2a3311dca42d1f01357))
* establish consistent kebab-case naming conventions ([64711d2](https://github.com/yeabsiraretta/bismuth/commit/64711d2bf5cef2822d9a2e7f526b94f5c9eb5a8d))
* ratify constitution v1.0.0 with quality and testing principles ([e9330d1](https://github.com/yeabsiraretta/bismuth/commit/e9330d10b050c4d0b052db216c8cff1f7c1841eb))
* **setup:** add implementation status tracking document ([42f9c97](https://github.com/yeabsiraretta/bismuth/commit/42f9c9755c97ea1dd542cd00f6072ab902cf9e86)), closes [#1](https://github.com/yeabsiraretta/bismuth/issues/1)


### 🐛 Bug Fixes

* attempt to resolve Tauri macOS event loop crash ([ce28f32](https://github.com/yeabsiraretta/bismuth/commit/ce28f32437e6fda9eb03e06a4ac1cad41d48fc5a))
* remove unused imports and dead code ([669dc99](https://github.com/yeabsiraretta/bismuth/commit/669dc9907cfc7fb4bb2aed2e5099b20de7787eba))
* upgrade to Tauri 2.x and resolve macOS crash ([4042900](https://github.com/yeabsiraretta/bismuth/commit/40429009f7c280b0ee3d6cf18a1f119eec874567)), closes [#1](https://github.com/yeabsiraretta/bismuth/issues/1)


### ✨ Features

* add comprehensive development workflow scripts ([68c406d](https://github.com/yeabsiraretta/bismuth/commit/68c406d8aa67f21200b3e7d8deec69223cf5eae0))
* add specs, tasks, research, knowledge-frameworks, and speckit config ([749edb9](https://github.com/yeabsiraretta/bismuth/commit/749edb9367bd6ae380e7fabc22bbeedba31e68c1))
* Complete Canvas Component Design Tool (Phases 1-4) ([0e8b4f0](https://github.com/yeabsiraretta/bismuth/commit/0e8b4f010191311edf907e579e29152eced01a8d))
* **deps:** install frontend dependencies for T002 ([c455b05](https://github.com/yeabsiraretta/bismuth/commit/c455b05806d11ddfa6289867e00b11a7fa35d9f1)), closes [#2](https://github.com/yeabsiraretta/bismuth/issues/2)
* **deps:** install Rust dependencies for T003 ([f72f0d7](https://github.com/yeabsiraretta/bismuth/commit/f72f0d7613a27df19349a98da7ff488c221c1b90)), closes [#3](https://github.com/yeabsiraretta/bismuth/issues/3)
* **docs:** add comprehensive type definitions and JSDoc documentation ([3ed3922](https://github.com/yeabsiraretta/bismuth/commit/3ed39220191b11ad6c4fa6e195c7e848b6ce4ae0))
* **phase-2.1:** implement Rust data models (T010-T013) ([f0fb4d1](https://github.com/yeabsiraretta/bismuth/commit/f0fb4d143c69dba591afabe0f99bad1619067eca))
* **setup:** complete T004-T006 and fix pre-commit hook ([5bbb5f8](https://github.com/yeabsiraretta/bismuth/commit/5bbb5f8e25df83aa0557cec46b0b6039569052e0))
* **setup:** complete T007-T009 - PHASE 1 COMPLETE! 🎉 ([d1a6d9d](https://github.com/yeabsiraretta/bismuth/commit/d1a6d9d5984b314401baf76116d0701b2169fe4f))
* **setup:** initialize Tauri + Svelte + TypeScript project structure ([b4f17e2](https://github.com/yeabsiraretta/bismuth/commit/b4f17e2c167714c8d4bd86b00f1a82aa5080533f)), closes [#1](https://github.com/yeabsiraretta/bismuth/issues/1)
* **setup:** install Rust toolchain and verify compilation ([c4bf189](https://github.com/yeabsiraretta/bismuth/commit/c4bf189030c1768150fe0af7bcd92c6fc1e5d698)), closes [#1](https://github.com/yeabsiraretta/bismuth/issues/1)
* **ui:** implement functional Bismuth UI with basic interactivity ([45b19fc](https://github.com/yeabsiraretta/bismuth/commit/45b19fca6fab0ca434c5968a3419ab6a3c4f0de0))


### 🔧 Chores

* bump version on push ([29bd329](https://github.com/yeabsiraretta/bismuth/commit/29bd329b2e4ae72a6d639a994b0822d983239df8))
* bump version on push ([af6efb0](https://github.com/yeabsiraretta/bismuth/commit/af6efb0b9231d72b9829df97a4e4312f20d11ad4))


### ♻️ Code Refactoring

* code haul ([cc87bef](https://github.com/yeabsiraretta/bismuth/commit/cc87befdc58e382315799b4101db1f91a986c89c))
* prod ([c632480](https://github.com/yeabsiraretta/bismuth/commit/c6324806993921dbe87c2c2e55206b4d8db7d701))
* prod 2 ([af31a72](https://github.com/yeabsiraretta/bismuth/commit/af31a72dfba6a2335ad8e9048f62446b4d918f57))
* prod 3 ([09cfd01](https://github.com/yeabsiraretta/bismuth/commit/09cfd012b4a5ca1b8bf53b55ea6ba00af6b325d0))
* updated docs ([5130e7b](https://github.com/yeabsiraretta/bismuth/commit/5130e7b0c84e72ceed5aa8ef01183d3875d7d021))

## [0.4.0] - 2026-06-30

### Added

- **Bismuth PKM Editor** (spec 001): Core personal knowledge management editor with markdown-first storage
- **Canvas Component Design** (spec 002): Canvas-based component design tool with drag-and-drop
- **Canvas Component System** (spec 004): Full component system with templates, presets, and library
- **Canvas Self-Design System** (spec 007): Canvas self-design with extractors, reflectors, diff engine, and MCP tools
- **Deferred Features** (spec 009): Deferred feature implementations (graph view, backlinks, flashcards, etc.)
- **Data Portability** (spec 010): Markdown-first storage with vault portability, frontmatter schema, canvas files
- **Feature Expansion** (spec 012): Homepage selection, feature toggles, editor toolbar, tag management, task parser, navigator
- **Design System Upgrade** (spec 013): Design tokens, CSS custom properties, theme system overhaul
- **Visual Integration** (spec 014): Visual integration and revitalization of UI components
- **Tasks Query Engine** (spec 019): Task query engine with parser, filters, and sidebar panel
- **Sidebar Panels** (spec 022): Sidebar panels and integrated systems (backlinks, outline, tags, properties)
- **Canvas Component Library** (spec 023): Shared component library with categories and search
- **Publishing Upgrade** (spec 025): Publishing service with canvas renderer and static site generation
- **Settings Overhaul** (spec 037): Settings system restructure with feature registry and categorized panels
- **Expansion Roadmap** (spec 038): Feature expansion modules (music, LLM, calendar, spreadsheets, slides, gym, media, pokemon, NAS, OCR)
- **Music Production** (spec 039): Music production workspace module
- **LLM Agent Access** (spec 040): LLM agent integration for knowledge management
- **Calendar Enhancements** (spec 041): Calendar system with daily notes and task integration
- **Spreadsheets** (spec 042): Spreadsheet module with formula engine
- **Slides** (spec 043): Presentation/slides module
- **Gym Tracking** (spec 044): Gym and health tracking module
- **Release Channels** (spec 045): Release channel management (stable, beta, nightly)
- **Roadmap Management** (spec 046): Feature roadmap management and tracking
- **Media Editing** (spec 047): Media editing capabilities
- **Pokemon Calculator** (spec 048): Pokemon damage calculator module
- **Integration Docs** (spec 049): Integration documentation for all modules
- **NAS Access** (spec 050): Network-attached storage access module
- **Knowledge Versioning** (spec 051): Deterministic knowledge versioning system
- **OCR/Handwriting** (spec 053): Handwritten content recognition via OCR
- **Flashcards** (spec 054): Spaced-repetition flashcard system
- **Constitution Compliance Checker**: Vitest-based architecture constitution checker (`pnpm check:constitution`)
- **Obsidian Vault Detection**: Automatic `.obsidian` directory detection with `is_obsidian_vault` flag and coexistence logging

### Changed

- **Architecture Review** (spec 008): 9 phantom IPC commands, dead code removal, file-size splits, layer violations fixed
- **UI/UX Overhaul** (spec 003): Consistency pass across all components
- **Codebase Restructure** (spec 005): Modular infrastructure with clear service/store/component boundaries
- **Component Reusability** (spec 015): Component extraction and folder cohesion
- **Rust Restructure** (spec 016): Rust backend restructure with domain cohesion
- **UX Polish** (spec 017): UX polish and feature completeness pass
- **Style Settings Plugin** (spec 018): CSS variable-based style settings with vault sync
- **.bismuth Cleanup** (spec 020): .bismuth directory cleanup and self-design canvas integration
- **Feature Module Consolidation** (spec 026): Feature module consolidation into `features/` directory
- **Feature Extraction Wave 2** (spec 027): Second wave of feature extraction to `features/`
- **Feature Quality Remediation** (spec 028): Quality remediation across all feature modules
- **Rust Domain Cohesion** (spec 029): Rust domain cohesion with facade modules
- **Library Extraction** (spec 030): Library extraction and dead code maintenance
- **Standardization** (spec 034): Production readiness standardization
- **MVP Completion** (spec 035): MVP completion roadmap finalization
- **Bundle Size** (spec 036): Bundle size optimization and feature loading
- **Infrastructure Improvement** (spec 052): Infrastructure improvement pass
- **Highlight Click**: Clicking highlights now directly removes them (mousedown) instead of showing popup
- **Import Style**: All non-feature relative imports converted to `@/` aliases

### Fixed

- **Service Bugfixes** (spec 006): Service layer bug fixes across vault, search, and canvas services
- **Documentation** (spec 011): Rust and TypeScript documentation standardization
- **Test Infrastructure** (spec 021): Test infrastructure improvement with mocks, fixtures, and architecture tests
- **Combined Test Suite** (spec 024): Unified test suite with coverage reporting
- **Sidebar Bugfixes** (spec 032): Sidebar panel deep-dive bug fixes
- **Developer Tooling** (spec 033): Developer tooling infrastructure (IPC contracts, code map, component templates)
- **Full Codebase Audit** (spec 031): P0 security fixes (DOMPurify, escapeHtml), type errors, layer violations, file-size splits

## [0.2.0] - 2026-06-04

## [0.1.0] - 2026-05-28

### Added
- **Phase 4: Navigator System** (9/13 tasks complete)
  - Navigator store with profiles, pinning, shortcuts (T043)
  - FolderTree with keyboard navigation j/k/arrows (T044)
  - FileList with previews and sorting (T045)
  - Navigator shell with two-pane layout (T046)
  - ShortcutBar with Cmd/Ctrl+1-9 support (T049)
  - CalendarPanel for daily notes (T050)
  - ColorIconPicker for customization (T047)
  - TagTree for hierarchical tag browsing (T054)
  - PropertyBrowser for frontmatter filtering (T055)
  - Total: 2,600+ lines of Navigator code

### Changed
- **Path Alias System**: Replaced relative `../` imports with `@/` alias
  - Added `@` alias to vite.config.ts and tsconfig.json
  - `@/` maps to `src/lib/` for cleaner imports
  - Updated all service, store, and utility imports to use `@/`
  - Example: `../../types/vault` → `@/types/vault`
  - Maintains `$lib` alias for backward compatibility

### Fixed
- **Vault Creation Flow**: Added vault naming dialog that prompts user to name the vault folder before creation
- **Import Path Issues**: Fixed all `$lib/stores/vault` and `$lib/api/vault` imports to use `@/` alias
- **Wikilink Property Names**: Fixed Link type property names to use snake_case (source_path, target_path, target_title, is_resolved)
- **IPC Command Integration**: Replaced deprecated API functions with Tauri invoke commands
  - FileTree, Toolbar, VaultPicker, NoteEditor now use invoke('read_note', 'write_note', 'delete_note', etc.)
- **TypeScript Errors**: Resolved all module resolution and type mismatch errors
- **Component Imports**: Fixed all old component import paths to use correct @ alias structure
- **Background Color Consistency**: Fixed inconsistent backgrounds between welcome screen and vault view
  - Changed hardcoded `#ffffff` to `var(--background-primary)` in App.svelte
  - Updated body and app container to use CSS variables
  - Ensures consistent dark theme across all screens
- **Design Token Migration**: Replaced 35+ hardcoded values with CSS variables in RightSidebar.svelte
  - Spacing: `0.25rem`, `0.5rem`, `0.75rem`, `1rem` → `var(--spacing-xs/s/m)`
  - Font sizes: `14px`, `16px`, `18px` → `var(--font-ui-small/medium/large)`
  - Border radius: `0.25rem`, `0.375rem` → `var(--radius-xs/s)`
  - Transitions: `0.15s ease` → `var(--transition-fast)`
  - Shadows: `0 1px 3px rgba(...)` → `var(--shadow-s)`
  - Sizes: `2.5rem`, `6rem` → `var(--size-4-9)`, `var(--size-4-16)`
  - Created comprehensive design tokens usage guide in `docs/DESIGN_TOKENS_USAGE.md`
- **TailwindCSS Integration**: Fixed completely non-functional TailwindCSS setup
  - **CRITICAL**: Added missing `import "./app.css"` to `main.ts` - Tailwind was never loaded!
  - Unified CSS variable systems: Tailwind now uses Obsidian-style tokens from `tokens.css`
  - Updated `tailwind.config.js` to reference Obsidian variables for consistency
  - Colors: `bg-primary`, `text-normal`, `accent`, `border` now map to Obsidian tokens
  - Spacing: `xs`, `s`, `m`, `l`, `xl`, `xxl` map to `--spacing-*` tokens
  - Border radius: `xs`, `s`, `m`, `l`, `xl` map to `--radius-*` tokens
  - Shadows: `s`, `m`, `l`, `xl` map to `--shadow-*` tokens
  - Font families: `text`, `mono`, `interface` map to `--font-*` tokens
  - Font sizes: `ui-small`, `ui-medium`, `ui-large` map to `--font-ui-*` tokens
  - Created detailed analysis in `docs/TAILWIND_INTEGRATION_ANALYSIS.md`
  - Single source of truth: All design tokens now in `tokens.css`
- **Sidebar Toggle Buttons**: Added toolbar buttons to restore collapsed sidebars
  - Left sidebar toggle button (file explorer) on the left side of toolbar
  - Right sidebar toggle button on the right side of toolbar
  - Icon-only buttons with tooltips for clean UI
  - Visual divider separating toggle from action buttons
  - Flexible spacer pushing right toggle to the far right
  - Fixes issue where sidebars couldn't be reopened once closed
- **ColorIconPicker Design Tokens**: Replaced hardcoded spacing/sizing with CSS variables
  - Spacing: `1rem`, `0.75rem`, `0.5rem` → `var(--spacing-m/s)`
  - Border radius: `0.5rem`, `0.375rem`, `0.25rem` → `var(--radius-m/s/xs)`
  - Transitions: `0.15s ease` → `var(--transition-fast)`
  - Sizes: `2rem` → `var(--size-4-8)`
  - Font sizes: `var(--font-size-sm)` → `var(--font-ui-small)`
  - **Note**: User-selectable accent colors (#ef4444, #f97316, etc.) intentionally kept hardcoded
  - These are content choices, not theme colors - should remain consistent across themes
  - User selects parent directory, then names the vault
  - Shows preview of full path: `parent/vault-name`
  - Creates vault folder automatically with chosen name
  - Prevents empty vault names
- **Right Sidebar Panels**: Added tabbed sidebar with icon buttons for:
  - Backlinks panel (shows notes linking to current note)
  - Outline panel (auto-generated from headings)
  - Tags panel (from frontmatter)
  - Properties panel (all frontmatter key-value pairs)
  - Calendar panel (placeholder for future daily notes)
  - Each panel shows helpful placeholder text when no data available
- Removed duplicate `config.rs` file causing module ambiguity error
- Added missing `log` and `dirs` dependencies to Cargo.toml
- Removed unused `PathBuf` import from vault_history.rs
- Fixed `AppConfig` references to use correct `AppSettings` type
- Changed config file name from `config.json` to `settings.json`
- Fixed WelcomeScreen imports to use `@/` alias consistently
- Removed unused `splitHorizontal` and `splitVertical` functions from SplitPane
- Added `tabindex` and `aria-label` to resizable dividers for better accessibility
- Fixed all import paths after folder reorganization:
  - Updated vault store imports to use `$lib/stores/vault/vault`
  - Updated service imports to use nested paths
  - Fixed component imports (Icon, Button, dialogs) to use `../` paths
  - Fixed NoteEditor import in SplitPane to use `../note/NoteEditor.svelte`
  - Fixed Link type import in wikilink utils
- Exported `splitHorizontal` and `splitVertical` functions from SplitPane for future command use

### Added
- **Typography System** (`src/lib/styles/typography.css` - 490 lines):
  - Consistent font families (Inter, JetBrains Mono, Georgia)
  - Fluid type scale with responsive sizing (xs to 5xl)
  - Proper heading hierarchy (h1-h6) with semantic sizing
  - Line height system (none, tight, snug, normal, relaxed, loose)
  - Font weight scale (thin to black, 100-900)
  - Letter spacing utilities (tighter to widest)
  - Text color palette (primary, secondary, muted, disabled, etc.)
  - Utility classes for all typography properties
  - Semantic text styles (label, caption, overline, subtitle)
  - Line clamping utilities (1-3 lines)
  - Responsive typography for mobile and print
  - Accessibility support (high contrast, reduced motion)
  - Consistent code, blockquote, and list styling
- **Standardized Folder Structure**:
  - Reorganized components into feature-based folders (vault, note, editor, etc.)
  - Created index files for clean barrel exports
  - Nested related files in appropriate subdirectories
  - Moved services, stores, and utils into organized subfolders
  - Documentation: `docs/development/folder-structure.md` with guidelines
  - Improved discoverability and maintainability
- **Centralized Configuration System**:
  - **Backend Constants** (`src-tauri/src/config/constants.rs` - 207 lines):
    - Organized by domain (filesystem, editor, performance, security, etc.)
    - Type-safe with documentation for all values
    - Validation helpers for common checks
    - Zero runtime cost (compile-time inlining)
  - **User Settings** (`src-tauri/src/config/settings.rs` - 283 lines):
    - JSON-based persistent configuration
    - Four categories: Editor, Layout, Performance, Advanced
    - Automatic validation and constraint enforcement
    - Vault-specific and global settings support
    - Reset functionality for each category
  - **Frontend Constants** (`src/lib/config/constants.ts` - 197 lines):
    - TypeScript const assertions for type safety
    - Validation helpers with type guards
    - Responsive breakpoints, z-index layers, animation durations
    - Accessibility requirements (touch targets, contrast, cognitive load)
  - **Documentation** (`docs/development/configuration.md`):
    - Complete usage guide with examples
    - Security considerations and best practices
    - Migration strategies for breaking changes
    - Testing guidelines
- **Grid-Based Layout System** (`src/lib/styles/grid-system.css`):
  - Standardized grid utilities (1-12 columns)
  - Gap utilities (xs, sm, md, lg, xl)
  - Responsive column spans and auto-fit/fill
  - Panel component system with header/body/footer
  - Panel variants: flat, bordered, elevated
  - Stack and inline layout helpers
  - Alignment and overflow utilities
  - Consistent white backgrounds across all panels
- **Resizable Panel Component** (`ResizablePanel.svelte`):
  - Drag-to-resize functionality with visual feedback
  - Collapse/expand controls with smooth animations
  - Min/max width constraints (200-600px)
  - Position-aware (left/right) with appropriate controls
  - Accessible resize handles with ARIA attributes
  - Mobile responsive (full-width on <640px)
  - Expand button when collapsed for easy restoration
- **Standardized Panel Styling**:
  - All three panels (left sidebar, editor, right sidebar) now white
  - Consistent borders (#e5e7eb) and header backgrounds (#f9fafb)
  - Grid-based content organization in right sidebar
  - Reactive updates on resize/collapse events
  - Unified visual hierarchy across the application
- **Responsive Design System** (`src/lib/styles/responsive.css`):
  - Fluid spacing scale with clamp() for adaptive sizing
  - Fluid typography (--text-xs through --text-3xl)
  - Adaptive component sizing (buttons, inputs, sidebars)
  - Mobile-first breakpoints (xs: 480px, sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px)
  - Touch target minimum (44px) for accessibility
  - Responsive grid and flex utilities
  - High DPI, reduced motion, and high contrast support
  - Print styles
  - Window adaptive sizing (min 320x480px)
- **Adaptive Layout** (App.svelte):
  - Responsive sidebar widths: clamp(200px, 25vw, 320px)
  - Mobile stacking (column layout on <640px)
  - Sidebar becomes full-width on mobile with 40vh max-height
  - Smooth transitions for all size changes
- **Windsurf Integration**: Complete Claude tooling integration for Windsurf/Cascade
  - `.windsurf/rules/bismuth-rules.md` - Primary rules file with all Claude tooling
  - `.windsurf/cascade.json` - Configuration with context paths, commands, constraints
  - `.windsurf/rules/README.md` - Documentation on rules system
  - Auto-loads Constitution, UX principles, coding standards, skills
  - Skills auto-activate based on user requests (ux-review, code-review, component-gen)
  - All `.claude/` resources available in Windsurf without additional configuration
- **Crash Recovery** (T039): Automatic recovery file system
  - `vault_recovery.rs` - Recovery service with SHA256-based file tracking
  - Recovery files saved to `.bismuth/recovery/<hash>.tmp` before each write
  - Timestamp comparison on vault open to detect unsaved changes
  - `check_recovery_files()` - Scans recovery directory and identifies newer versions
  - `restore_from_recovery()` - Restores content from recovery files
  - Integrated into `write_note` operation for automatic protection
- **Split-Pane Layout** (T040): Side-by-side note editing
  - `SplitPane.svelte` - Horizontal/vertical split with draggable divider
  - Resize range: 20-80% with smooth visual feedback
  - Mobile responsive: stacks vertically on small screens
  - Close pane functionality with header controls
- **Edit History** (T041): Version tracking and restoration
  - `vault_history.rs` - History service with JSONL storage
  - Appends to `.bismuth/history/<sha256>.jsonl` on every write
  - `get_history()` - Returns sorted history entries
  - `restore_version()` - Restores content from specific timestamp
  - Integrated into `write_note` operation
- **Size/Depth Warnings** (T042): Non-blocking validation
  - File size validation: warns if >10MB
  - Path depth validation: warns if >10 levels
  - `ToastManager.svelte` - Toast notification system
  - Listens for `vault://warning` events
  - Severity-based styling (info, warning, error, success)

#### Phase 3: Core Vault & Editor (US1)
- **Vault Templates** (T035): Four template types for vault creation
  - PARA method (Projects, Areas, Resources, Archive)
  - Johnny.Decimal system (10-19 Personal, 20-29 Work)
  - Zettelkasten method (inbox, permanent, templates)
  - Blank template with welcome README
  - Each template includes explanatory README with methodology details
  - Backend IPC command `create_vault_from_template` exposed to frontend
- **CodeMirror 6 Editor** (T036): Production-ready markdown editor
  - Syntax highlighting with defaultHighlightStyle
  - Line numbers, history (undo/redo), line wrapping
  - Performance monitoring with <16ms input latency target
  - Automatic latency warnings when exceeding 16ms threshold
  - Integrated with Bismuth theme CSS variables
  - Export methods: `getContent()`, `setContent()`, `focus()`
- **Wikilink Extension** (T037): Interactive wikilink support
  - Regex-based detection of `[[wikilinks]]` in editor
  - Blue, clickable links with hover underline styling
  - Custom `wikilink-click` event for navigation
  - ViewPlugin with Decoration API for efficient rendering
  - `onWikilinkClick` callback prop for parent components
- **Auto-Save** (T038): Automatic content persistence with visual feedback
  - 500ms debounce delay (configurable via `autoSaveDelay` prop)
  - Save status indicator showing "Saving...", "Saved at HH:mm:ss", or "Unsaved changes"
  - Async save callback with error handling
  - Timer cleanup on component destroy
  - Visual states: saved (✓), saving (⏳), unsaved (●)

#### Constitution & Code Quality
- **Constitution v1.1.0**: Enhanced governance with code organization principles
  - New Principle VI: Code Organization and File Size Limits
  - 300-line maximum for all code and test files
  - Templates/assets must be extracted to external folders
  - Template strings >50 lines moved to separate files
  - SVGs stored in dedicated `assets/svg/` directories
  - Large data externalized to JSON/YAML files
- **Automated File Size Enforcement**:
  - ESLint `max-lines` rule configured (300 lines, skip blanks/comments)
  - Clippy configuration with function length warnings (100 lines)
  - Shell script `scripts/check-file-sizes.sh` for automated checking
  - Pre-commit hook blocks commits with oversized files
  - GitHub Actions workflow for CI/CD enforcement
  - `pnpm check:file-sizes` command for manual validation
- **Quality Documentation**:
  - `docs/file-size-violations.md`: Current violations and refactoring plans
  - `scripts/README.md`: Script usage and integration guide
  - Detailed remediation timeline for existing violations
- **UX/UI Principles** (`docs/standards/ux-principles.md`):
  - 168 research-backed principles across 6 parts
  - Cognitive Foundations, Visual Design, Interaction Design, Information Architecture, AI/Emerging, Human-Centered
  - Code examples for Bismuth-specific applications
  - PR checklist for UX compliance
  - Severity levels and scoring system (0-100)
- **AI Assistant Integration** (`.claude/` folder):
  - `project-context.md` - Project overview, architecture, standards for AI assistants
  - `ux-evaluator.md` - UX evaluation with AI interface principles and smell detection
  - `component-guide.md` - UX-informed component generation requirements
  - `agent-rules.md` - Core workflow rules with global coding principles, pre-action review, documentation standards, Git guidelines
  - `skills/` - Reusable workflow skills (ux-review, code-review, component-gen)
  - `README.md` - Documentation on AI assistant configuration
  - Automatically loaded by Windsurf/Cascade for context-aware assistance
  - Constitution updated to require UX evaluation before UI implementation
  - Strict documentation anti-bloat rules: prefer updates over creation, consolidate over duplicate
  - Global coding principles: clarity over brevity, DRY, fail fast, appropriate data structures
- **Development Scripts** (adapted from steipete/agent-scripts):
  - `scripts/validate-workflows.sh` - Validates workflow YAML frontmatter
  - `scripts/docs-list.ts` - Lists docs with summaries and "read when" hints
  - `scripts/committer.sh` - Safe commit helper (stages specific files, enforces non-empty message)
  - All integrated into `pnpm check` or available as standalone commands

#### Infrastructure
- Production-grade Git workflow with branch protection policies
- Comprehensive CI/CD pipelines for multi-platform testing (Linux, macOS, Windows)
- Pre-commit hooks with Husky for automated quality checks
- Conventional commits enforcement with commitlint
- Automated dependency updates with Dependabot
- CodeQL security scanning for vulnerability detection
- Code coverage tracking with Codecov
- Comprehensive contributing guidelines (CONTRIBUTING.md)
- Detailed Git workflow documentation (docs/GIT_WORKFLOW.md)
- Automated setup script (scripts/setup-git.sh)
- PR and issue templates for structured collaboration
- CODEOWNERS file for automatic reviewer assignment
- EditorConfig for consistent coding styles across editors
- Lint-staged configuration for efficient pre-commit checks
- E2E testing setup with Playwright
- Multi-platform release automation

### Changed
- **ESLint Configuration**: Added `max-lines: 300` rule for file size enforcement
- **Pre-commit Hook**: Now includes file size validation step
- **Package.json**: Added `check:file-sizes` script to quality check pipeline
- **Constitution**: Updated from v1.0.0 to v1.1.0 (MINOR version bump)
- **Docs Folder**: Reorganized as clean git wiki structure
  - Only README.md at root level (comprehensive index)
  - All docs moved to subdirectories: architecture/, development/, implementation/, milestones/, processes/, standards/, status/
  - Updated README.md with complete navigation and file listings
  - Deleted redundant CHANGELOG_GUIDE.md and file-size-violations.md (consolidated)

### Deprecated
- N/A

### Removed
- N/A

### Fixed
- **TypeScript Imports**: Fixed `VaultTemplate` import to allow value usage in comparisons
- **Wikilink Extension**: Separated type and value imports for `DecorationSet` to satisfy verbatimModuleSyntax
- **Tauri Dialog Plugin**: Removed invalid configuration options causing deserialization error
- **Type Organization**: Split `src/types/index.ts` (302 lines) into 5 focused modules (21-78 lines each)
  - `types/note.ts` - Note, Link, Tag, JohnnyDecimalId
  - `types/vault.ts` - Vault, VaultConfig, VaultTemplate, FileEvent  
  - `types/graph.ts` - GraphNode, GraphEdge, Graph
  - `types/search.ts` - SearchResult, SearchState, SearchFilters
  - `types/state.ts` - EditorState, UIState, AppState, CommandResult
- **Vault Service Refactoring**: Split `vault_service.rs` (608 lines) into 4 focused modules (97-257 lines each)
  - `vault_service.rs` - Core service coordination (257 lines)
  - `vault_service/vault_operations.rs` - CRUD operations (97 lines)
  - `vault_service/vault_scanner.rs` - Scanning and indexing (100 lines)
  - `vault_service/vault_templates.rs` - Template creation (157 lines)

### Security
- Enabled secret scanning and push protection
- Implemented signed commits requirement for protected branches
- Added automated security audits (cargo audit, npm audit)
- Configured CodeQL for weekly security scans

### Technical Debt
- **5 files exceed 300-line limit** (refactoring in progress):
  - `src/lib/components/graph/GraphView.svelte` (617 lines) - Critical
  - `src-tauri/src/services/vault_service.rs` (608 lines) - Critical  
  - `src/lib/components/backlinks/Backlinks.svelte` (448 lines) - High
  - `src-tauri/src/db.rs` (410 lines) - High
  - `src/lib/components/backlinks/OutgoingLinks.svelte` (348 lines) - Medium
- ✅ `src/types/index.ts` refactored (was 302 lines, now 21 lines with 5 focused modules)
- Refactoring plans saved to memory with severity levels and module split strategies

---

## Development Roadmap (Pre-1.0.0)

Following semantic versioning for 0.x.x releases:
- **0.x.0**: Minor version - New features, may have breaking changes
- **0.x.y**: Patch version - Bug fixes and minor improvements
- **1.0.0**: First stable release - API stability guaranteed

### Planned Releases

#### [0.1.0] - Target: Week 14 (MVP Release)
**Focus**: Core vault and editor functionality

**Planned Features**:
- Vault creation and management (US1)
- CodeMirror 6 editor integration with <16ms latency
- Markdown syntax highlighting and editing
- Wikilink support with click-to-navigate
- Auto-save with 500ms debounce
- Crash recovery system
- Split-pane editing (horizontal/vertical)
- Edit history with version restore
- File size and nesting depth warnings
- Notebook Navigator (US15) with keyboard-first navigation
- File operations (create, rename, delete, move)
- Vault profiles and pinning
- Color/icon assignment for files
- Drag-and-drop file organization

**Technical Stack**:
- Tauri 1.5+ (Rust backend)
- Svelte 4.2+ (Frontend framework)
- CodeMirror 6 (Editor)
- SQLite (Local database)
- Tantivy (Full-text search)

#### [0.2.0] - Target: Week 18
**Focus**: Wikilinks and graph visualization

**Planned Features**:
- Bidirectional wikilinks (US2)
- Backlinks panel with context preview
- Unlinked mentions detection
- Wikilink autocomplete
- Graph view with Konva.js (US8)
- Force-directed layout algorithm
- Node filtering by tag, type, folder
- Pan/zoom controls
- Graph export (PNG, SVG, JSON)

#### [0.3.0] - Target: Week 22
**Focus**: Search and indexing

**Planned Features**:
- Full-text search with Tantivy (US7)
- BM25 ranking algorithm
- Fuzzy search support
- Search filters (tag, folder, date, type)
- Search history and saved searches
- Real-time indexing with file watching
- Search performance <200ms for 50k documents

#### [0.4.0] - Target: Week 26
**Focus**: Lifecycle management and organization

**Planned Features**:
- Lifecycle Dashboard (US11)
- Inbox for quick capture
- Auto-categorization suggestions
- Orphan note detection
- Stale note identification
- Archive workflow
- Bulk operations (tag, move, delete)

#### [0.5.0] - Target: Week 30
**Focus**: Tags and metadata

**Planned Features**:
- Hierarchical tag system (US3)
- Nested tags with inheritance
- Tag autocomplete
- Tag renaming with propagation
- Tag-based filtering and search
- Tag cloud visualization
- Frontmatter YAML support (US4)
- Custom metadata fields
- Metadata templates

#### [0.6.0] - Target: Week 34
**Focus**: Advanced features and polish

**Planned Features**:
- Command palette (US5)
- Keyboard shortcuts
- Quick switcher
- Recent files
- Theme system with Obsidian compatibility
- Export functionality (Markdown, PDF, HTML)
- Import from Obsidian/Notion
- Performance optimizations

#### [1.0.0] - Target: TBD
**Focus**: Stable release with API guarantees

**Requirements for 1.0.0**:
- All MVP features stable and tested
- Comprehensive documentation
- Migration guides
- API stability guarantees
- Performance benchmarks met
- Security audit completed
- User feedback incorporated
- Breaking changes finalized

---

## Version History

### [0.0.1] - 2026-05-25

#### Added
- Initial project structure with Tauri + Svelte + Rust
- Git repository initialization
- Branch protection policies documentation
- CI/CD pipeline configuration
- Pre-commit hooks setup
- Conventional commits enforcement
- Contributing guidelines
- Code quality tooling (ESLint, Prettier, Clippy, Rustfmt)
- Security scanning setup (CodeQL, Dependabot)
- Automated testing framework
- Documentation structure

#### Infrastructure
- GitHub Actions workflows for CI/CD
- Husky for Git hooks
- Commitlint for commit message validation
- Lint-staged for efficient pre-commit checks
- Playwright for E2E testing
- Vitest for unit testing
- EditorConfig for coding style consistency

---

## How to Update This Changelog

### Quick Reference

**Update immediately after:** Completing tasks, merging features, fixing bugs, config changes  
**Don't update for:** WIP commits, internal refactoring, doc typos

### Entry Template

```markdown
- **Feature Name** (Task ID): Brief description
  - Key capability 1 with technical detail
  - Key capability 2
```

### Categories

- **Added**: New features, tools, capabilities
- **Changed**: Modifications to existing functionality
- **Fixed**: Bug fixes, error corrections
- **Security**: Vulnerability fixes, hardening
- **Technical Debt**: Known issues, planned refactoring

### Good vs Bad Examples

**✅ Good** (scannable, specific, traceable):
```markdown
- **Vault Templates** (T035): Four template types for vault creation
  - PARA method (Projects, Areas, Resources, Archive)
  - Backend IPC command `create_vault_from_template` exposed
```

**❌ Bad** (vague, no context):
```markdown
- Added stuff
- Fixed things
```

### Grouping Strategy

Group related changes under headers for scannability:
```markdown
#### Phase 3: Core Vault & Editor (US1)
- Task 1
- Task 2

#### Constitution & Code Quality
- Governance changes
```

### Technical Debt Format

Include severity and file paths:
```markdown
- **6 files exceed 300-line limit**:
  - `src/lib/components/graph/GraphView.svelte` (617 lines) - Critical
  - `src-tauri/src/db.rs` (410 lines) - High
```

### Semantic Versioning Guide

**Given a version number MAJOR.MINOR.PATCH (e.g., 1.2.3)**:

1. **MAJOR** (1.x.x): Incompatible API changes
   - Breaking changes to public API
   - Removal of deprecated features
   - Major architectural changes
   - Example: `0.9.0 → 1.0.0`

2. **MINOR** (x.2.x): New features, backward compatible
   - New functionality added
   - New user stories implemented
   - Non-breaking API additions
   - Example: `0.1.0 → 0.2.0`

3. **PATCH** (x.x.3): Bug fixes, backward compatible
   - Bug fixes
   - Performance improvements
   - Documentation updates
   - Security patches
   - Example: `0.1.0 → 0.1.1`

**Pre-1.0.0 versions (0.x.x)**:
- Anything may change at any time
- Minor version (0.x.0) may include breaking changes
- Patch version (0.x.y) should be backward compatible
- Public API should not be considered stable

**Post-1.0.0 versions**:
- Public API is stable
- Breaking changes require major version bump
- Deprecation warnings before removal
- Migration guides for breaking changes

### Release Checklist

Before creating a release:

- [ ] All planned features merged to `develop`
- [ ] All tests passing on `develop`
- [ ] Update CHANGELOG.md with version and date
- [ ] Update version in `Cargo.toml`
- [ ] Update version in `package.json`
- [ ] Update version in `src-tauri/tauri.conf.json`
- [ ] Create release branch: `release/vX.Y.Z`
- [ ] Run full test suite on all platforms
- [ ] Create PR to `main` with 2 reviewers
- [ ] After merge, tag release: `git tag -a vX.Y.Z -m "Release vX.Y.Z"`
- [ ] Push tag: `git push origin vX.Y.Z`
- [ ] GitHub Actions builds and publishes release
- [ ] Merge `main` back to `develop`
- [ ] Announce release (if public)

---

## Links

- [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
- [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Releases](https://github.com/yeabsiraretta/bismuth/releases)

---

[Unreleased]: https://github.com/yeabsiraretta/bismuth/compare/v0.0.1...HEAD
[0.0.1]: https://github.com/yeabsiraretta/bismuth/releases/tag/v0.0.1
