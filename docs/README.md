# Bismuth Documentation

This directory contains technical documentation for Bismuth development.

---

## 📁 Directory Structure

```
docs/
├── README.md                           # This file
├── WIKI_STRUCTURE.md                   # GitHub Wiki organization plan
│
├── architecture/                       # System architecture
│   ├── BISMUTH_ARCHITECTURE_PROPOSAL.md
│   ├── MODULAR_ARCHITECTURE.md
│   └── TOLARIA_ARCHITECTURE_ANALYSIS.md
│
├── development/                        # Development guides
│   ├── FEATURE_DEVELOPMENT_GUIDE.md
│   ├── DEMO_PLAN.md
│   └── DEMO_CHECKLIST.md
│
├── processes/                          # Project processes
│   ├── GIT_WORKFLOW.md
│   ├── GIT_SETUP_SUMMARY.md
│   ├── VERSIONING.md
│   ├── GIT_IMPLEMENTATION_COMPLETE.md
│   ├── MODULAR_ARCHITECTURE_COMPLETE.md
│   └── VERSIONING_SETUP_COMPLETE.md
│
└── status/                             # Project status
    ├── IMPLEMENTATION_STATUS.md
    └── ASSETS_TRACKER.md
```

---

## 📖 Documentation Categories

### Architecture Documents

High-level system design and technical decisions:

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

- Use `SCREAMING_SNAKE_CASE.md` for technical docs
- Use `kebab-case.md` for user-facing docs (wiki)
- Be descriptive: `FEATURE_DEVELOPMENT_GUIDE.md` not `GUIDE.md`

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

| Need | Document |
|------|----------|
| System architecture | [Architecture Proposal](./architecture/BISMUTH_ARCHITECTURE_PROPOSAL.md) |
| Build a feature | [Feature Development Guide](./development/FEATURE_DEVELOPMENT_GUIDE.md) |
| Git workflow | [Git Workflow](./processes/GIT_WORKFLOW.md) |
| Current progress | [Implementation Status](./status/IMPLEMENTATION_STATUS.md) |
| Missing assets | [Assets Tracker](./status/ASSETS_TRACKER.md) |
| Demo preparation | [Demo Checklist](./development/DEMO_CHECKLIST.md) |

---

**Last Updated**: 2026-05-25  
**Maintainer**: Yeabsira Moges
