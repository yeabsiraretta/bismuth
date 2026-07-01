# WorkflowBadge Contract

**Version**: 1.0.0
**Layer**: `components/ui/feedback/badges/`
**Last reviewed**: 2026-06-23

---

## What it does

A small, read-only status label that maps an entity's workflow stage to a semantic color category,
giving users an at-a-glance signal about state without requiring them to open the item.

---

## Props

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `category` | `WorkflowCategory` | Yes | — | Which color palette and semantic meaning to apply |
| `label` | `string` | Yes | — | The text shown inside the badge — keep short and human-readable |
| `showIcon` | `boolean` | No | `false` | Whether to show a leading dot icon for extra visual emphasis |

**`WorkflowCategory` values**: `draft` | `active` | `complete` | `blocked` | `archived` | `review` | `published` | `pending`

---

## States

| State | How triggered | Visual change |
|---|---|---|
| Default | Always | Colored badge with label |
| N/A: Disabled | — | Badges are read-only; use the `archived` category to signal inactive |
| N/A: Loading | — | Not applicable |
| N/A: Error | — | Use `blocked` category for error states |

---

## Accessibility

**ARIA role**: `role="status"` + `aria-live="polite"` — announces updates to screen readers without
interrupting the user

**Keyboard behavior**: Never focusable — `tabindex` is never set. This is intentional: badges are
read-only indicators, not interactive controls.

**Screen reader behavior**:
- Reads the label text (the color is supplementary, never the primary signal)
- When badge text updates dynamically (e.g., status changes), `aria-live="polite"` announces the
  new label after the current speech finishes

**Focus management**: N/A — not focusable

---

## Design tokens used

| CSS property | Token | Fallback |
|---|---|---|
| `color` (draft) | `--status-warning` | `#f59e0b` |
| `color` (active) | `--status-info` | `#3b82f6` |
| `color` (complete) | `--status-added` | `#10b981` |
| `color` (blocked) | `--status-deleted` | `#ef4444` |
| `color` (archived/pending) | `--text-muted` | `#6b7280` |
| `color` (review) | `--status-modified` | `#3b82f6` |
| `color` (published) | `--interactive-accent` | `#dc2626` |
| `background` | `color-mix(in srgb, [token] 15%, transparent)` | derived |
| `border-radius` | `--radius-s` | `4px` |

---

## Data pattern

**Arity**: 1:1 — one badge represents one entity's current workflow state.

---

## Known limitations

- `color-mix()` background requires a modern browser (Chromium ≥111, Firefox ≥113). Tauri's embedded
  WebView is Chromium-based; this is not a concern for the desktop app.
- Color contrast for `draft` (warning yellow) on white backgrounds may fall below WCAG AA at small
  sizes — test in context.
