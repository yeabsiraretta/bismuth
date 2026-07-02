# Bismuth PKM Editor

> A local-first Personal Knowledge Management editor combining Johnny.Decimal, Zettelkasten, and intelligent knowledge organization.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Built with Tauri](https://img.shields.io/badge/Built%20with-Tauri%202-24C8DB?logo=tauri)](https://v2.tauri.app)
[![Svelte](https://img.shields.io/badge/Svelte-4-FF3E00?logo=svelte)](https://svelte.dev)
[![Rust](https://img.shields.io/badge/Rust-1.95-orange?logo=rust)](https://www.rust-lang.org)

---

## 🎯 What is Bismuth?

**Bismuth** is a desktop application for personal knowledge management that combines three powerful organizational systems:

- **📊 Johnny.Decimal** - Hierarchical file organization with decimal notation (e.g., `11.01 Project Ideas`)
- **🗂️ Zettelkasten** - Atomic note-taking with bidirectional wikilinks
- **🧠 Lightweight Ontologies** - Semantic concept relationships and intelligent suggestions

Built with modern technologies for native performance and complete data ownership.

---

## ✨ Key Features

- ⚡ **Native Performance** - Built with Tauri and Rust for blazing-fast speed
- 🔒 **Local-First** - Your data stays on your computer, complete ownership
- 📝 **Markdown-Based** - Plain text files, future-proof and portable
- 🎨 **Obsidian-Compatible** - Use existing Obsidian themes and vaults
- 📊 **Graph Visualization** - Interactive knowledge graph
- 🔍 **Full-Text Search** - Powered by Tantivy search engine
- 🌓 **Dark/Light Themes** - Beautiful, customizable interface
- 🖥️ **Cross-Platform** - macOS, Windows, and Linux support

---

## 🚀 Quick Start

### For Users

**Download** the latest release:

- [macOS (Apple Silicon)](https://github.com/yeabsiraretta/bismuth/releases)
- [macOS (Intel)](https://github.com/yeabsiraretta/bismuth/releases)
- [Windows](https://github.com/yeabsiraretta/bismuth/releases)
- [Linux](https://github.com/yeabsiraretta/bismuth/releases)

**Install** and launch Bismuth, then:

1. Create a new vault or open an existing one
2. Start taking notes with Markdown
3. Link notes with `[[wikilinks]]`
4. Organize with Johnny.Decimal folders

📖 **[Documentation](./docs/Home.md)** — Complete wiki

### For Developers

```bash
# Clone the repository
git clone https://github.com/yeabsiraretta/bismuth.git
cd bismuth

# Install dependencies
pnpm install

# Run development server
pnpm tauri dev
```

📐 **[Developer Guide](./docs/guides/getting-started.md)** — Setup and contribution guide

---

## 📚 Documentation

- **[Wiki Home](./docs/Home.md)** — Documentation landing page
- **[Getting Started](./docs/guides/getting-started.md)** — Development setup
- **[Architecture](./docs/architecture/overview.md)** — System design
- **[Standards](./docs/standards/design-system.md)** — Design system & conventions
- **[Changelog](./CHANGELOG.md)** — Version history

---

## 🛠️ Tech Stack

### Frontend

- **[Svelte 4](https://svelte.dev)** — Reactive UI framework
- **[TypeScript 5](https://www.typescriptlang.org)** — Type-safe JavaScript
- **[Vite 6](https://vitejs.dev)** — Build tool and dev server
- **[Tailwind CSS 4](https://tailwindcss.com)** — Utility CSS (CSS-based config)
- **[CodeMirror 6](https://codemirror.net)** — Markdown editor

### Backend

- **[Rust 1.95](https://www.rust-lang.org)** — Systems programming language
- **[Tauri 2](https://tauri.app)** — Desktop application framework
- **[notify](https://github.com/notify-rs/notify)** — File system watcher

### Development Tools

- **[pnpm](https://pnpm.io)** — Package manager
- **[Vitest](https://vitest.dev)** — Unit testing
- **[Playwright](https://playwright.dev)** — End-to-end testing
- **[ESLint](https://eslint.org)** / **[Prettier](https://prettier.io)** — Linting & formatting

---

## 🗺️ Roadmap

### Completed

- [x] Project setup (Tauri 2 + Svelte + Rust)
- [x] Vault management (create, open, file tree)
- [x] Note editor with Markdown support
- [x] Wikilink system with bidirectional linking
- [x] Graph visualization (global + local)
- [x] Navigator sidebar (profiles, shortcuts, tags)
- [x] Canvas system (infinite canvas, elements, layers)
- [x] Theme system (light/dark)
- [x] Command palette + hotkeys
- [x] Settings modal
- [x] Toast notifications
- [x] Capture inbox

### In Progress

- [ ] Canvas component system (reusable composites, component libraries)
- [ ] Multi-page flows with preview mode
- [ ] UI/UX overhaul (responsive layout, accessibility)

### Planned

- [ ] Full-text search (Tantivy)
- [ ] Plugin API
- [ ] Template system
- [ ] PDF annotation

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

- 🐛 **Report bugs** - [Open an issue](https://github.com/yeabsiraretta/bismuth/issues/new?template=bug_report.md)
- 💡 **Suggest features** - [Open an issue](https://github.com/yeabsiraretta/bismuth/issues/new?template=feature_request.md)
- 📝 **Improve docs** - Submit a PR to the wiki
- 💻 **Write code** - Check out [good first issues](https://github.com/yeabsiraretta/bismuth/labels/good%20first%20issue)

Please read our **[Contributing Guide](./CONTRIBUTING.md)** before submitting a PR.

---

## 📊 Project Status

**Current Version**: 0.2.0  
**Stage**: Active development  
**Focus**: Canvas component system + UI/UX overhaul

See **[Feature Specs](./specs/)** for detailed planning.

---

## 📄 License

Bismuth is licensed under the [MIT License](./LICENSE).

```text
Copyright (c) 2026 Yeabsira Moges

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 🙏 Acknowledgments

Bismuth is inspired by and builds upon the work of:

- **[Obsidian](https://obsidian.md)** - PKM application design patterns
- **[Johnny.Decimal](https://johnnydecimal.com)** - Organizational system
- **[Zettelkasten Method](https://zettelkasten.de)** - Note-taking methodology
- **[Tauri](https://tauri.app)** - Desktop application framework

Special thanks to all contributors and the open-source community.

---

## 📞 Contact & Support

- **Issues**: [GitHub Issues](https://github.com/yeabsiraretta/bismuth/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yeabsiraretta/bismuth/discussions)
- **Email**: yeabsiraretta@proton.me
- **Wiki**: [Documentation](https://github.com/yeabsiraretta/bismuth/wiki)

---

<p align="center">
  <sub>Built with ❤️ by <a href="https://github.com/yeabsiraretta">Yeabsira Moges</a></sub>
</p>
