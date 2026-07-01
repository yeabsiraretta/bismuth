---
publish: true
---
# Demo Vault Manifest

This file tracks what capabilities the demo vault showcases and when each section was last updated.

## Update Policy

When a new Bismuth feature lands, add or update demo content that exercises it.
Run `scripts/build/sync-demo-vault.sh` after changes to validate structure.

## Feature Coverage
| Feature | Demo Content | Last Updated | Spec |
|---------|-------------|--------------|------|
| Vault creation & opening | Root structure + .bismuth/ | 2026-05-25 | 001 |
| Markdown notes | `10-19-personal/11.01-welcome-to-bismuth.md` | 2026-05-25 | 001 |
| Johnny.Decimal system | `10-19-personal/11.02-johnny-decimal-system.md` | 2026-05-25 | 001 |
| Zettelkasten method | `10-19-personal/11.03-zettelkasten-method.md` | 2026-06-18 | 001 |
| Markdown guide | `10-19-personal/11.04-markdown-guide.md` | 2026-06-18 | 001 |
| Keyboard shortcuts | `10-19-personal/11.05-keyboard-shortcuts.md` | 2026-06-18 | 001 |
| Architecture | `20-29-projects/21.01-bismuth-architecture.md` | 2026-06-18 | 001 |
| Command palette | `20-29-projects/21.02-command-palette.md` | 2026-06-18 | 001 |
| Graph visualization | `20-29-projects/21.03-graph-visualization.md` | 2026-06-18 | 001 |
| Note types | `30-39-reference/31.01-note-types.md` | 2026-06-18 | 001 |
| Frontmatter reference | `30-39-reference/31.02-frontmatter-reference.md` | 2026-06-18 | 001 |
| Settings reference | `30-39-reference/31.03-settings-reference.md` | 2026-06-18 | 001 |
| Templates reference | `30-39-reference/31.04-templates.md` | 2026-06-18 | 001 |
| Wikilinks & backlinks | Cross-links across 15+ notes | 2026-06-18 | 001 |
| Frontmatter | YAML headers in all notes | 2026-06-18 | 001 |
| Tags | Rich tag usage across notes | 2026-06-18 | 001 |
| Graph view | 15+ densely-linked notes for web visualization | 2026-06-18 | 001 |
| Canvas | `40-49-canvas/41.01-self-design-workflow.md` | 2026-06-13 | 001 |
| Theming | Theme preference in config | — | 003 |
| Templates | Template files + reference | 2026-06-18 | 001 |
| Entity linking | Entity-annotated notes | — | 001 |
| Feature Index | `50-59-advanced/50.01-feature-index.md` | 2026-06-30 | — |
| Tags & Entities | `50-59-advanced/51.01-tags-and-entities.md` | 2026-06-30 | — |
| Backlinks & Connections | `50-59-advanced/51.02-backlinks-and-connections.md` | 2026-06-30 | — |
| Navigator | `50-59-advanced/51.03-navigator.md` | 2026-06-30 | — |
| Tasks & Kanban | `50-59-advanced/52.01-tasks-and-kanban.md` | 2026-06-30 | — |
| Flashcards & Study | `50-59-advanced/52.02-flashcards-and-study.md` | 2026-06-30 | — |
| Calendar & Planner | `50-59-advanced/52.03-calendar-and-daily-planner.md` | 2026-06-30 | — |
| Gamified Tasks | `50-59-advanced/52.04-gamify.md` | 2026-06-30 | — |
| Writing Lint & Speed Reader | `50-59-advanced/52.05-writing-lint-and-speed-reader.md` | 2026-06-30 | — |
| Creative Tools | `50-59-advanced/53.01-creative-tools.md` | 2026-06-30 | — |
| Integrations | `50-59-advanced/54.01-integrations.md` | 2026-06-30 | — |
| PDF/EPUB Annotator | `50-59-advanced/54.02-annotator.md` | 2026-06-30 | — |
| Advanced URI | `50-59-advanced/54.03-advanced-uri.md` | 2026-06-30 | — |
| Experimental Features | `50-59-advanced/55.01-experimental-features.md` | 2026-06-30 | — |

## `.bismuth/` Directory Structure

The `.bismuth/` hidden directory stores vault-level configuration and data:

| Subdirectory | Purpose | Service Owner |
|---|---|---|
| `canvas/` | Canvas document `.canvas` files | canvas_service |
| `components/` | Reusable component definitions | component commands |
| `design-docs/` | Design documents (pages, layouts, flows, themes) | design_doc commands |
| `history/` | Edit history per file (JSONL) | vault_history |
| `index/` | Search/embedding index | embedding_service |
| `plugins/` | Plugin directories with manifests | plugin_service |
| `recovery/` | Crash recovery temp files | vault_recovery |
| `styles/` | Per-canvas style overrides | styles commands |
| `templates/` | Note templates | template_service |
| `themes/` | Custom themes | theme_service |
| `tokens/` | Design token collections | token commands |

Top-level files:

| File | Purpose |
|---|---|
| `config.json` | Vault settings |
| `style.json` | CSS token overrides (synced to Style Settings) |
| `navigator.json` | Navigator panel state |

## Self-Design Canvas

The `design-docs/pages/bismuth-design.json` file contains Bismuth's own living design — a canvas document that maps 1-to-1 with the app's UI components, tokens, and architecture. Use the Canvas view to open and edit this design. Changes round-trip through the document reflectors back into code.

## Adding New Demo Content

1. Create files under the appropriate Johnny.Decimal area
2. Update this manifest table
3. Run `scripts/build/sync-demo-vault.sh` to validate
4. Commit with message: `demo: add <feature> showcase content`

## Folder Areas

| Range | Area | Purpose |
|-------|------|---------|
| 10-19 | Personal | Core note-taking, journal, knowledge |
| 20-29 | Projects | Project management, development notes |
| 30-39 | Reference | Templates, examples, imported content |
| 40-49 | Canvas | Canvas workspace demos |
| 50-59 | Advanced | Plugins, entities, automation |
