# Bismuth Wiki

> Local-first Personal Knowledge Management editor with canvas design, knowledge graphs, and intelligent organization.

---

## Quick Navigation

| Section                                                | Description                                     |
| ------------------------------------------------------ | ----------------------------------------------- |
| [Getting Started](guides/getting-started.md)           | Install, configure, and start using Bismuth     |
| [Architecture](architecture/overview.md)               | System design and technical decisions           |
| [Developer Guide](guides/feature-development-guide.md) | How to contribute and build features            |
| [Standards](standards/design-system.md)                | Design system, naming, and UX principles        |
| [Reference](reference/folder-structure.md)             | Technical reference and API documentation       |
| [Specs](../specs/)                                     | Feature specifications and implementation plans |

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

**Version**: 0.3.0  
**Architecture**: Tauri 2 + Svelte 4 + Rust  
**Constitution**: v1.4.0 (9 principles, folder density, layer separation)  
**Features Shipped**: Vault management, note editor, wikilinks, graph view, canvas system, sidebar navigation, settings, command palette, capture inbox, theming, design tokens, tasks query engine

---

## AI-Assisted Development

Bismuth uses a **governed workflow pipeline** for feature development:

```
/speckit.specify                              # Write spec
/speckit.architecture-guard.governed-plan      # Plan with governance
/speckit.architecture-guard.governed-tasks     # Tasks with quality gates
/speckit.architecture-guard.governed-implement # Implement with review
```

The pipeline integrates memory synthesis, security review, architecture validation, and four quality skills (code-review, ux-review, component-gen, pict-test-designer).

See [Extension Integration](development/extension-integration.md) for full details.

---

## Documentation Map

```text
docs/
├── Home.md              ← You are here
├── _Sidebar.md          ← Wiki navigation
├── architecture/        ← System design (7 docs)
├── development/         ← Extension integration, AI workflows
├── guides/              ← Developer guides (7 docs)
├── standards/           ← Active standards (7 docs)
├── reference/           ← Technical reference (8 docs)
├── memory/              ← Durable knowledge (decisions, bugs, architecture)
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
