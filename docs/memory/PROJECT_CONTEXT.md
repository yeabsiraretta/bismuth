# Project Context

Last reviewed: 2026-06-08

## Product / Service

Bismuth is a desktop personal knowledge management (PKM) editor built with Svelte and Tauri. It provides markdown editing with live preview, a graph view of note connections, and an infinite canvas for spatial thinking. Users organize notes in vaults (local filesystem directories) with wikilink-based interconnection.

## Key Constraints

- Desktop-only via Tauri (macOS, Windows, Linux)
- All data stored locally in user's vault directory (no cloud sync)
- Must maintain <16ms input latency for editor responsiveness
- File size limit: 300 lines per source file (350 tolerance)
- 90% test coverage requirement across all code files
- Single token source (`tokens.css`) for all visual styling

## Important Domains

- **Note editing**: Markdown with wikilinks, frontmatter, live preview
- **Canvas**: Infinite spatial workspace with components, flows, and pages
- **Graph**: Bidirectional link visualization between notes
- **Vault management**: File tree, search, note CRUD via Tauri IPC

## Current Priorities

- Complete canvas component system (spec 004)
- Editor bug fixes and interaction reliability
- Codebase restructure for maintainability (spec 005)

## Keep Here

- Durable product constraints
- Domain language and invariants
- Project-wide priorities that shape feature tradeoffs

## Never Store Here

- Feature-specific acceptance criteria
- Task lists
- Transient implementation notes
- Changelog entries

Update the review date when constraints or priorities materially change.
