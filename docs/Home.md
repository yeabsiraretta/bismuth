# Bismuth Wiki

> Local-first Personal Knowledge Management editor with canvas design, knowledge graphs, and intelligent organization.

---

## Quick Navigation

| Section | Description |
|---------|-------------|
| [Getting Started](guides/getting-started.md) | Install, configure, and start using Bismuth |
| [Architecture](architecture/overview.md) | System design and technical decisions |
| [Developer Guide](guides/feature-development-guide.md) | How to contribute and build features |
| [Standards](standards/design-system.md) | Design system, naming, and UX principles |
| [Reference](reference/folder-structure.md) | Technical reference and API documentation |
| [Specs](../specs/) | Feature specifications and implementation plans |

---

## What is Bismuth?

**Bismuth** is a desktop application for personal knowledge management that combines:

- **Canvas Design** — Figma-like infinite canvas for visual thinking, component libraries, and flow prototyping
- **Zettelkasten** — Atomic notes with bidirectional wikilinks and knowledge graphs
- **Johnny.Decimal** — Hierarchical file organization with decimal notation
- **Intelligent Organization** — Semantic relationships, auto-linking, and entity recognition

Built with **Tauri 2** (Rust backend) + **Svelte 4** (TypeScript frontend) for native performance and complete data ownership.

---

## Project Status

**Version**: 0.2.0  
**Architecture**: Tauri 2 + Svelte 4 + Rust  
**Features Shipped**: Vault management, note editor, wikilinks, graph view, canvas system, sidebar navigation, settings, command palette, capture inbox, theming

---

## Documentation Map

```text
docs/
├── Home.md              ← You are here
├── _Sidebar.md          ← Wiki navigation
├── architecture/        ← System design (4 docs)
├── guides/              ← Developer guides (5 docs)
├── standards/           ← Active standards (7 docs)
├── reference/           ← Technical reference (7 docs)
└── archive/             ← Historical records
```

---

## Contributing to Docs

1. Create new pages in the appropriate category directory
2. Use kebab-case filenames: `my-new-page.md`
3. Add the page to `_Sidebar.md` under the correct section
4. Cross-link related pages using relative paths
5. Commit: `docs: add [topic]` or `docs: update [topic]`

See [Documentation Standards](standards/documentation-standards.md) for full guidelines.
