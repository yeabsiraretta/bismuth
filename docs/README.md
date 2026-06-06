# Bismuth Documentation

This directory is the **Bismuth Wiki** — a GitHub Wiki-compatible documentation system that lives in the repository.

---

## Structure

```text
docs/
├── Home.md              # Wiki landing page
├── _Sidebar.md          # Navigation (GitHub Wiki sidebar)
├── _Footer.md           # Page footer
├── README.md            # This index file
│
├── architecture/        # System design & technical decisions
│   ├── overview.md
│   ├── bismuth-architecture-proposal.md
│   ├── bismuth-canvas-system.md
│   ├── canvas-mcp-protocol.md
│   └── modular-architecture.md
│
├── guides/              # Developer how-to guides
│   ├── getting-started.md
│   ├── feature-development-guide.md
│   ├── configuration.md
│   ├── logging.md
│   ├── tailwind-integration.md
│   └── development-scripts.md
│
├── standards/           # Active coding & design standards
│   ├── design-system.md
│   ├── design-system-quick-reference.md
│   ├── design-principles.md
│   ├── ux-principles.md
│   ├── naming-conventions.md
│   ├── documentation-standards.md
│   └── documentation-template.md
│
├── reference/           # Technical reference
│   ├── folder-structure.md
│   ├── git-workflow.md
│   ├── versioning.md
│   ├── versioning-policy.md
│   ├── backlinks-implementation.md
│   ├── graph-view-implementation.md
│   └── mvp-checklist.md
│
└── archive/             # Historical records (not active)
    ├── milestones/
    ├── setup-reports/
    └── ...
```

---

## Using as GitHub Wiki

This `docs/` directory can be published to the GitHub Wiki repo:

```bash
# Clone the wiki repo
git clone https://github.com/yeabsiraretta/bismuth.wiki.git

# Copy docs content into the wiki
cp docs/Home.md bismuth.wiki/
cp docs/_Sidebar.md bismuth.wiki/
cp docs/_Footer.md bismuth.wiki/
cp -r docs/architecture docs/guides docs/standards docs/reference bismuth.wiki/

# Push to wiki
cd bismuth.wiki && git add -A && git commit -m "Sync docs" && git push
```

Or automate with a GitHub Action that syncs on push to `main`.

---

## Adding Pages

1. Choose the correct directory (`architecture/`, `guides/`, `standards/`, `reference/`)
2. Create `my-page-name.md` (kebab-case)
3. Add the page to `_Sidebar.md`
4. Cross-link from related pages using relative paths
5. Commit: `docs: add [topic]`

## Archiving Pages

1. Move to `archive/`
2. Remove from `_Sidebar.md`
3. Commit: `docs: archive [topic]`

---

## Quick Reference

| Need | Document |
|------|----------|
| Architecture overview | [overview.md](architecture/overview.md) |
| Canvas system | [bismuth-canvas-system.md](architecture/bismuth-canvas-system.md) |
| Start developing | [getting-started.md](guides/getting-started.md) |
| Build a feature | [feature-development-guide.md](guides/feature-development-guide.md) |
| Design tokens | [design-system.md](standards/design-system.md) |
| Naming rules | [naming-conventions.md](standards/naming-conventions.md) |
| Git branching | [git-workflow.md](reference/git-workflow.md) |
| Project layout | [folder-structure.md](reference/folder-structure.md) |

---

**Last Updated**: 2026-06-05
**Maintainer**: Yeabsira Moges
