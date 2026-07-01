# ComponentName Contract

**Version**: 1.0.0
**Layer**: `components/ui/<category>/`
**Last reviewed**: YYYY-MM-DD

---

## What it does

<!-- One to two sentences. Plain language. This is preserved verbatim in contribution PRs. -->

---

## Props

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `propName` | `string` | Yes | — | What this prop controls |
| `optional` | `boolean` | No | `false` | What this prop controls |

---

## States

| State | How triggered | Visual change |
|---|---|---|
| Default | Always | Normal appearance |
| Disabled | `disabled={true}` | 50% opacity, `cursor: not-allowed` |
| Loading | `loading={true}` | Spinner replaces content |
| Error | `error="message"` | Red border + error message below |

<!-- Mark any state as "N/A — not applicable" with a brief explanation -->

---

## Accessibility

**ARIA role**: `role="<role>"` — reason why this role was chosen

**Keyboard behavior**:
- `Tab` — focus enters the component
- `Enter` / `Space` — activates the primary action (or: "no keyboard interaction required — read-only/decorative")
- `Escape` — closes or cancels (if applicable)

**Screen reader behavior**:
- <!-- What does a screen reader announce when focus lands here? -->
- <!-- What does it announce when state changes? -->

**Focus management**:
- <!-- Where does focus go when this opens? -->
- <!-- Where does focus return when this closes? -->

---

## Design tokens used

| CSS property | Token | Fallback |
|---|---|---|
| `color` | `--text-normal` | `#1f2937` |
| `background` | `--background-primary` | `#ffffff` |
| `border-radius` | `--radius-s` | `4px` |

---

## Data pattern

**Arity**: 1:1 (one instance per object) _or_ 1:Many (one instance per item in a collection)

<!-- For 1:Many: explain what prop accepts the collection and how callers render it -->

---

## Known limitations

<!-- Open questions, unvalidated states, accessibility gaps not yet addressed -->
