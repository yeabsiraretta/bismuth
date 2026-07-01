# Bismuth Frontmatter Schema

**Version**: 1.0.0
**Status**: Canonical

This document defines the standard YAML frontmatter schema for all Bismuth-generated notes. The schema uses standard YAML types and is parseable by any YAML-compliant tool.

---

## Standard Fields (Top-Level)

These fields are widely supported across PKM tools (Obsidian, Logseq, Zettlr, etc.).

| Field      | Type              | Required | Description                               |
| ---------- | ----------------- | -------- | ----------------------------------------- |
| `title`    | string            | Yes      | Human-readable note title                 |
| `created`  | string (ISO 8601) | Yes      | Creation timestamp (RFC 3339)             |
| `modified` | string (ISO 8601) | No       | Last modification timestamp               |
| `tags`     | string[]          | No       | Array of tag strings (without `#` prefix) |
| `aliases`  | string[]          | No       | Alternative titles for linking            |

---

## Bismuth Namespace

Bismuth-specific metadata lives under the `bismuth` key to avoid conflicts with user-defined fields or other tools.

| Field                 | Type                                            | Description                            |
| --------------------- | ----------------------------------------------- | -------------------------------------- |
| `bismuth.lifecycle`   | enum: `"captured"`, `"organized"`, `"archived"` | Note lifecycle state                   |
| `bismuth.captured_at` | string (ISO 8601)                               | When note entered the capture pipeline |

---

## Examples

### New Capture Note

```yaml
---
title: Meeting Notes 2026-06-10
created: 2026-06-10T14:00:00Z
modified: 2026-06-10T14:00:00Z
tags: []
aliases: []
bismuth:
  lifecycle: captured
  captured_at: 2026-06-10T14:00:00Z
---
```

### Organized Note

```yaml
---
title: Rust Error Handling Patterns
created: 2026-05-15T09:30:00Z
modified: 2026-06-10T16:45:00Z
tags: [rust, patterns, error-handling]
aliases: [rust errors, thiserror patterns]
bismuth:
  lifecycle: organized
  captured_at: 2026-05-15T09:30:00Z
---
```

### Minimal Note (No Bismuth Fields)

Notes without the `bismuth` namespace are treated as `captured` (inbox) by default.

```yaml
---
title: Quick Thought
created: 2026-06-10T14:00:00Z
tags: [idea]
---
```

---

## Backward Compatibility

- Notes with legacy flat fields (`organized: true`, `archived: false`) are read correctly
- On next save, Bismuth writes the new schema (adds `bismuth` namespace)
- Old fields are preserved (not deleted) for compatibility with other tools
- Notes without any frontmatter are treated as untitled captures

## Field Type Rules

- **Dates**: Always ISO 8601 / RFC 3339 format (`2026-06-10T14:00:00Z`)
- **Arrays**: Always YAML flow format (`[item1, item2]`) or block format
- **Strings**: Unquoted unless they contain special YAML characters
- **Booleans**: Never used for lifecycle (use `bismuth.lifecycle` enum instead)
- **No binary or encoded values**: All fields must be human-readable
