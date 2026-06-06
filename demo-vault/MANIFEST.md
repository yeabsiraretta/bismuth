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
| Johnny.Decimal system | Folder naming convention | 2026-05-25 | 001 |
| Wikilinks & backlinks | Links in welcome note | 2026-05-25 | 001 |
| Frontmatter | YAML headers in notes | 2026-05-25 | 001 |
| Tags | Tag usage in notes | — | 001 |
| Graph view | Multi-linked notes | — | 001 |
| Canvas | Example canvas file | — | 001 |
| Theming | Theme preference in config | — | 003 |
| Templates | Template files | — | 001 |
| Entity linking | Entity-annotated notes | — | 001 |

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
