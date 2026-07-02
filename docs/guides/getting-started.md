# Getting Started

Set up Bismuth for development.

---

## Prerequisites

- **Rust**: 1.95+ — `rustup install stable`
- **Node.js**: 20+ — `nvm install 20`
- **pnpm**: 9+ — `npm install -g pnpm`
- **Platform deps**: See [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)

---

## Setup

```bash
git clone https://github.com/yeabsiraretta/bismuth.git
cd bismuth
pnpm install
```

---

## Development

```bash
# Start dev server with hot reload
pnpm tauri dev

# Frontend only (no Rust backend)
pnpm dev

# Run tests
pnpm test

# Type check
pnpm check
```

---

## Project Layout

```text
bismuth/
├── src/                 # Svelte frontend
│   ├── lib/             # Application code
│   │   ├── components/  # UI components
│   │   ├── stores/      # State management
│   │   ├── services/    # IPC wrappers
│   │   ├── utils/       # Utilities
│   │   ├── types/       # TypeScript types
│   │   └── styles/      # CSS tokens & patterns
│   └── App.svelte       # Root component
├── src-tauri/           # Rust backend
│   └── src/
│       ├── main.rs      # Entry point
│       └── commands/    # IPC handlers
├── docs/                # Documentation (this wiki)
└── specs/               # Feature specifications
```

See [Folder Structure](../reference/folder-structure.md) for the complete layout.

---

## Key Commands

| Command            | Description              |
| ------------------ | ------------------------ |
| `pnpm tauri dev`   | Full app with hot reload |
| `pnpm dev`         | Frontend only            |
| `pnpm test`        | Run Vitest tests         |
| `pnpm build`       | Production build         |
| `pnpm tauri build` | Package desktop app      |

---

## Next Steps

- [Feature Development Guide](feature-development-guide.md) — How to build new features
- [Architecture Overview](../architecture/overview.md) — Understand the system design
- [Design System](../standards/design-system.md) — Styling conventions
- [Git Workflow](../reference/git-workflow.md) — Branching and commits
