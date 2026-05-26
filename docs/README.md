# Bismuth Documentation

This directory contains technical documentation for Bismuth development.

---

## 📁 Directory Structure

```
docs/
├── README.md                           # This file (index)
│
├── architecture/                       # System architecture & design
│   ├── bismuth-architecture-proposal.md
│   ├── bismuth-canvas-system.md
│   ├── canvas-mcp-protocol.md
│   ├── modular-architecture.md
│   ├── tolaria-architecture-analysis.md
│   └── wiki-structure.md
│
├── development/                        # Development guides & processes
│   ├── demo-checklist.md
│   ├── demo-plan.md
│   ├── development-scripts.md
│   ├── feature-development-guide.md
│   ├── mcp-servers.md
│   └── tailwind-integration.md
│
├── implementation/                     # Feature implementation docs
│   ├── backlinks-implementation.md
│   ├── graph-view-implementation.md
│   └── mvp-checklist.md
│
├── milestones/                         # Completion reports
│   ├── functional-ui-complete.md
│   ├── phase-1-complete.md
│   └── phase-2.1-complete.md
│
├── processes/                          # Project workflows
│   ├── git-implementation-complete.md
│   ├── git-setup-summary.md
│   ├── git-workflow.md
│   ├── modular-architecture-complete.md
│   ├── versioning.md
│   └── versioning-setup-complete.md
│
├── standards/                          # Coding & design standards
│   ├── design-principles.md
│   ├── design-system.md
│   ├── design-system-quick-reference.md
│   ├── documentation-standards.md
│   ├── documentation-template.md
│   ├── naming-conventions.md
│   └── ux-principles.md
│
└── status/                             # Current project status
    ├── assets-tracker.md
    ├── implementation-status.md
    └── refactoring-summary.md
```

---

## 📖 Documentation Categories

### Architecture Documents

High-level system design and technical decisions:

- **[Bismuth Canvas System](./architecture/bismuth-canvas-system.md)** - Figma-like design tool integration
- **[Canvas MCP Protocol](./architecture/canvas-mcp-protocol.md)** - MCP server specification for design-to-code
- **[Bismuth Architecture Proposal](./architecture/bismuth-architecture-proposal.md)** - Initial architecture design
- **[Modular Architecture](./architecture/modular-architecture.md)** - Component-based design
- **[Wiki Structure](./architecture/wiki-structure.md)** - Documentation organization
- **[Tolaria Architecture Analysis](./architecture/tolaria-architecture-analysis.md)** - Reference architecture study

### Development Guides

Guides for implementing features and managing development:

- **[Feature Development Guide](./development/feature-development-guide.md)** - How to build features
- **[Demo Plan](./development/demo-plan.md)** - MVP demo planning
- **[Demo Checklist](./development/demo-checklist.md)** - Demo validation

### Process Documentation

Project management and workflow processes:

- **[Git Workflow](./processes/git-workflow.md)** - Branching and commit strategy
- **[Git Setup Summary](./processes/git-setup-summary.md)** - Git configuration
- **[Versioning](./processes/versioning.md)** - Semantic versioning guide
- **[Git Implementation Complete](./processes/git-implementation-complete.md)** - Git setup completion
- **[Modular Architecture Complete](./processes/modular-architecture-complete.md)** - Architecture setup completion
- **[Versioning Setup Complete](./processes/versioning-setup-complete.md)** - Versioning setup completion

### Implementation Tracking

Feature implementation documentation and progress:

- **[Backlinks Implementation](./implementation/backlinks-implementation.md)** - Backlinks feature details
- **[Graph View Implementation](./implementation/graph-view-implementation.md)** - Graph visualization details
- **[MVP Checklist](./implementation/mvp-checklist.md)** - Complete MVP implementation checklist

### Milestones

Completed phase reports and achievements:

- **[Phase 1 Complete](./milestones/phase-1-complete.md)** - Project setup completion
- **[Phase 2.1 Complete](./milestones/phase-2.1-complete.md)** - Rust data models completion
- **[Functional UI Complete](./milestones/functional-ui-complete.md)** - UI implementation completion

### Project Standards

Coding, design, and documentation standards:

- **[Design Principles](./standards/design-principles.md)** - Core design philosophy
- **[Design System](./standards/design-system.md)** - Complete design system
- **[Design System Quick Reference](./standards/design-system-quick-reference.md)** - Quick lookup guide
- **[UX Principles](./standards/ux-principles.md)** - 168 research-backed UX/UI principles (6 parts)
- **[Naming Conventions](./standards/naming-conventions.md)** - File and code naming standards
- **[Documentation Template](./standards/documentation-template.md)** - Standard doc format
- **[Documentation Standards](./standards/documentation-standards.md)** - Documentation guidelines

### Status Tracking

Current project status and progress:

- **[Implementation Status](./status/implementation-status.md)** - Detailed progress tracking
- **[Refactoring Summary](./status/refactoring-summary.md)** - Code refactoring status
- **[Assets Tracker](./status/assets-tracker.md)** - Asset creation and management

---

## 🔗 Related Documentation

### Root Level

- **[README.md](../README.md)** - Project overview
- **[CHANGELOG.md](../CHANGELOG.md)** - Version history
- **[CONTRIBUTING.md](../CONTRIBUTING.md)** - Contribution guidelines

### GitHub Wiki

- **[User Guide](https://github.com/yeabsiraretta/bismuth/wiki/User-Guide)** - For end users
- **[Developer Guide](https://github.com/yeabsiraretta/bismuth/wiki/Developer-Guide)** - For contributors
- **[API Reference](https://github.com/yeabsiraretta/bismuth/wiki/API-Reference)** - Complete API docs

### Specifications

- **[Feature Specs](../specs/feature/)** - Detailed feature specifications
- **[Tasks](../specs/feature/001-bismuth-pkm-editor/tasks.md)** - Implementation tasks

---

## 📝 Documentation Standards

### File Organization

- **Architecture** - System design, technical decisions, reference studies
- **Development** - Implementation guides, demo plans, checklists
- **Processes** - Git workflow, versioning, project management
- **Status** - Progress tracking, asset management

### File Naming

**Standard**: Use `lowercase-with-hyphens.md` (kebab-case) for all markdown documentation

- ✅ `bismuth-canvas-system.md`
- ✅ `phase-2.1-complete.md`
- ✅ `naming-conventions.md`
- ❌ `BISMUTH_CANVAS_SYSTEM.md`
- ❌ `Phase_2_Complete.md`

**Exceptions**: `README.md`, `CHANGELOG.md`, `LICENSE.md` (standard conventions)

**Status**: All documentation files migrated to lowercase naming (2026-05-26)

See **[Naming Conventions](./standards/naming-conventions.md)** for complete standards.

### Content Structure

```markdown
# Document Title

Brief description of what this document covers.

---

## Section 1

Content...

## Section 2

Content...

---

**Last Updated**: YYYY-MM-DD
**Author**: Name
```

---

## 🔄 Documentation Workflow

### Adding New Documentation

1. Determine the appropriate category (architecture/development/processes/status)
2. Create the file with proper naming convention
3. Follow the content structure template
4. Update this README.md with a link
5. Commit with descriptive message: `docs: add [topic] documentation`

### Updating Documentation

1. Make changes to the relevant file
2. Update "Last Updated" date
3. Commit with message: `docs: update [topic] documentation`
4. If structure changes, update this README.md

### Deprecating Documentation

1. Move to `docs/archive/` directory
2. Add deprecation notice to the file
3. Remove from this README.md
4. Update any cross-references

---

## 🎯 Quick Reference

| Need                 | Document                                                                 |
| -------------------- | ------------------------------------------------------------------------ |
| Canvas design system | [Bismuth Canvas System](./architecture/bismuth-canvas-system.md)         |
| MCP protocol         | [Canvas MCP Protocol](./architecture/canvas-mcp-protocol.md)             |
| System architecture  | [Architecture Proposal](./architecture/bismuth-architecture-proposal.md) |
| Build a feature      | [Feature Development Guide](./development/feature-development-guide.md)  |
| MVP checklist        | [MVP Checklist](./implementation/mvp-checklist.md)                       |
| Naming standards     | [Naming Conventions](./standards/naming-conventions.md)                  |
| Git workflow         | [Git Workflow](./processes/git-workflow.md)                              |
| Current progress     | [Implementation Status](./status/implementation-status.md)               |
| Latest milestone     | [Phase 2.1 Complete](./milestones/phase-2.1-complete.md)                 |

---

**Last Updated**: 2026-05-26  
**Maintainer**: Yeabsira Moges
