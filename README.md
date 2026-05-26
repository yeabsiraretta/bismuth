# Bismuth PKM Editor

> A local-first Personal Knowledge Management editor combining Johnny.Decimal, Zettelkasten, and intelligent knowledge organization.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Built with Tauri](https://img.shields.io/badge/Built%20with-Tauri-24C8DB?logo=tauri)](https://tauri.app)
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

📖 **[User Guide](https://github.com/yeabsiraretta/bismuth/wiki)** - Complete documentation

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

📐 **[Developer Guide](https://github.com/yeabsiraretta/bismuth/wiki/Developer-Guide)** - Setup and contribution guide

---

## 📚 Documentation

- **[Wiki](https://github.com/yeabsiraretta/bismuth/wiki)** - Complete user and developer documentation
- **[User Guide](https://github.com/yeabsiraretta/bismuth/wiki/User-Guide)** - How to use Bismuth
- **[Developer Guide](https://github.com/yeabsiraretta/bismuth/wiki/Developer-Guide)** - Contributing to Bismuth
- **[Architecture](https://github.com/yeabsiraretta/bismuth/wiki/Architecture)** - System design
- **[API Reference](https://github.com/yeabsiraretta/bismuth/wiki/API-Reference)** - Tauri commands and events
- **[Changelog](./CHANGELOG.md)** - Version history

---

## 🛠️ Tech Stack

### Frontend
- **[Svelte 4](https://svelte.dev)** - Reactive UI framework
- **[TypeScript 5](https://www.typescriptlang.org)** - Type-safe JavaScript
- **[Vite 5](https://vitejs.dev)** - Build tool and dev server
- **[CodeMirror 6](https://codemirror.net)** - Code editor component
- **[Konva](https://konvajs.org)** - Canvas rendering for graphs

### Backend
- **[Rust 1.95](https://www.rust-lang.org)** - Systems programming language
- **[Tauri 1.5](https://tauri.app)** - Desktop application framework
- **[SQLite](https://www.sqlite.org)** - Embedded database
- **[Tantivy](https://github.com/quickwit-oss/tantivy)** - Full-text search engine (planned)
- **[notify](https://github.com/notify-rs/notify)** - File system watcher

### Development Tools
- **[pnpm](https://pnpm.io)** - Fast, disk space efficient package manager
- **[ESLint](https://eslint.org)** - JavaScript/TypeScript linting
- **[Prettier](https://prettier.io)** - Code formatting
- **[Vitest](https://vitest.dev)** - Unit testing framework
- **[Playwright](https://playwright.dev)** - End-to-end testing

---

## 🗺️ Roadmap

### Phase 1: Foundation (Current)
- [x] Project setup and tooling
- [x] Tauri + Svelte + Rust integration
- [ ] Basic note editor
- [ ] File system operations
- [ ] Markdown parsing

### Phase 2: Core Features
- [ ] Wikilink support
- [ ] Graph visualization
- [ ] Full-text search
- [ ] Tag system
- [ ] Theme support

### Phase 3: Advanced Features
- [ ] Johnny.Decimal organization
- [ ] Zettelkasten workflow
- [ ] PDF annotation
- [ ] Template system
- [ ] Plugin API

See the **[full roadmap](https://github.com/yeabsiraretta/bismuth/wiki/Roadmap)** for details.

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

**Current Version**: v0.0.1 (MVP in development)  
**Phase**: 1 - Project Setup  
**Progress**: 3/112 tasks complete (2.7%)

See **[Implementation Status](./docs/IMPLEMENTATION_STATUS.md)** for detailed progress.

---

## 📄 License

Bismuth is licensed under the [MIT License](./LICENSE).

```
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
