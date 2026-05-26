# Bismuth Documentation

This directory contains technical documentation for Bismuth development.

---

## 📁 Directory Structure

```
docs/
├── README.md                           # This file
│
├── architecture/                       # System architecture
│   ├── bismuth-canvas-system.md
│   ├── canvas-mcp-protocol.md
│   ├── BISMUTH_ARCHITECTURE_PROPOSAL.md
│   ├── MODULAR_ARCHITECTURE.md
│   └── TOLARIA_ARCHITECTURE_ANALYSIS.md
│
├── development/                        # Development guides
│   ├── FEATURE_DEVELOPMENT_GUIDE.md
│   ├── DEMO_PLAN.md
│   └── DEMO_CHECKLIST.md
│
├── implementation/                     # Implementation tracking
│   └── mvp-checklist.md
│
├── milestones/                         # Completion reports
│   ├── phase-1-complete.md
│   ├── phase-2.1-complete.md
│   └── functional-ui-complete.md
│
├── processes/                          # Project processes
│   ├── GIT_WORKFLOW.md
│   ├── GIT_SETUP_SUMMARY.md
│   ├── VERSIONING.md
│   ├── GIT_IMPLEMENTATION_COMPLETE.md
│   ├── MODULAR_ARCHITECTURE_COMPLETE.md
│   └── VERSIONING_SETUP_COMPLETE.md
│
├── standards/                          # Project standards
│   ├── naming-conventions.md
│   └── documentation-template.md
│
└── status/                             # Project status
    ├── IMPLEMENTATION_STATUS.md
    └── ASSETS_TRACKER.md
```

---

## 📖 Documentation Categories

### Architecture Documents

High-level system design and technical decisions:

- **[Bismuth Canvas System](./architecture/bismuth-canvas-system.md)** - Figma-like design tool integration
- **[Canvas MCP Protocol](./architecture/canvas-mcp-protocol.md)** - MCP server specification for design-to-code
- **[Bismuth Architecture Proposal](./architecture/BISMUTH_ARCHITECTURE_PROPOSAL.md)** - Initial architecture design
- **[Modular Architecture](./architecture/MODULAR_ARCHITECTURE.md)** - Component-based design
- **[Tolaria Architecture Analysis](./architecture/TOLARIA_ARCHITECTURE_ANALYSIS.md)** - Reference architecture study

### Development Guides

Guides for implementing features and managing development:

- **[Feature Development Guide](./development/FEATURE_DEVELOPMENT_GUIDE.md)** - How to build features
- **[Demo Plan](./development/DEMO_PLAN.md)** - MVP demo planning
- **[Demo Checklist](./development/DEMO_CHECKLIST.md)** - Demo validation

### Process Documentation

Project management and workflow processes:

- **[Git Workflow](./processes/GIT_WORKFLOW.md)** - Branching and commit strategy
- **[Git Setup Summary](./processes/GIT_SETUP_SUMMARY.md)** - Git configuration
- **[Versioning](./processes/VERSIONING.md)** - Semantic versioning guide
- **[Git Implementation Complete](./processes/GIT_IMPLEMENTATION_COMPLETE.md)** - Git setup completion
- **[Modular Architecture Complete](./processes/MODULAR_ARCHITECTURE_COMPLETE.md)** - Architecture setup completion
- **[Versioning Setup Complete](./processes/VERSIONING_SETUP_COMPLETE.md)** - Versioning setup completion

### Implementation Tracking

Implementation progress and checklists:

- **[MVP Checklist](./implementation/mvp-checklist.md)** - Complete MVP implementation checklist

### Milestones

Completed phase reports and achievements:

- **[Phase 1 Complete](./milestones/phase-1-complete.md)** - Project setup completion
- **[Phase 2.1 Complete](./milestones/phase-2.1-complete.md)** - Rust data models completion
- **[Functional UI Complete](./milestones/functional-ui-complete.md)** - UI implementation completion

### Project Standards

Coding standards and conventions:

- **[Naming Conventions](./standards/naming-conventions.md)** - File and code naming standards
- **[Documentation Template](./standards/documentation-template.md)** - Standard doc format

### Status Tracking

Current project status and progress:

- **[Implementation Status](./status/IMPLEMENTATION_STATUS.md)** - Detailed progress tracking
- **[Assets Tracker](./status/ASSETS_TRACKER.md)** - Asset creation and management

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

**Standard**: Use `kebab-case.md` for all new markdown documentation

- ✅ `bismuth-canvas-system.md`
- ✅ `phase-2.1-complete.md`
- ✅ `naming-conventions.md`
- ❌ `BISMUTH_CANVAS_SYSTEM.md`
- ❌ `Phase_2_Complete.md`

**Exceptions**: `README.md`, `CHANGELOG.md`, `LICENSE.md` (standard conventions)

**Legacy**: Existing `SCREAMING_SNAKE_CASE.md` files will be migrated gradually

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
| System architecture  | [Architecture Proposal](./architecture/BISMUTH_ARCHITECTURE_PROPOSAL.md) |
| Build a feature      | [Feature Development Guide](./development/FEATURE_DEVELOPMENT_GUIDE.md)  |
| MVP checklist        | [MVP Checklist](./implementation/mvp-checklist.md)                       |
| Naming standards     | [Naming Conventions](./standards/naming-conventions.md)                  |
| Git workflow         | [Git Workflow](./processes/GIT_WORKFLOW.md)                              |
| Current progress     | [Implementation Status](./status/IMPLEMENTATION_STATUS.md)               |
| Latest milestone     | [Phase 2.1 Complete](./milestones/phase-2.1-complete.md)                 |

---

**Last Updated**: 2026-05-26  
**Maintainer**: Yeabsira Moges
