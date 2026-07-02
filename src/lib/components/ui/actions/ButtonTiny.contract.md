# ButtonTiny Contract

**Version**: 1.0.0
**Layer**: `components/ui/actions/`
**Last reviewed**: 2026-06-23

---

## What it does

A 24px-height button for compact UI surfaces — inline toolbars, edit-on-glass overlays, and data
row actions — where standard buttons are too large but a proper interactive element is still required.
Use only in surfaces explicitly designed for 24px buttons.

---

## Props

| Prop        | Type                                     | Required | Default       | Description                                              |
| ----------- | ---------------------------------------- | -------- | ------------- | -------------------------------------------------------- |
| `variant`   | `'primary' \| 'secondary' \| 'tertiary'` | No       | `'secondary'` | Visual style: filled, outlined, or text-only             |
| `iconOnly`  | `boolean`                                | No       | `false`       | Hides label and renders icon only. Requires `ariaLabel`. |
| `ariaLabel` | `string`                                 | No       | `undefined`   | Accessible name. Required when `iconOnly={true}`.        |
| `disabled`  | `boolean`                                | No       | `false`       | Prevents interaction and dims the button                 |
| `type`      | `'button' \| 'submit' \| 'reset'`        | No       | `'button'`    | HTML button type                                         |

---

## States

| State        | How triggered     | Visual change                                           |
| ------------ | ----------------- | ------------------------------------------------------- |
| Default      | Always            | Normal appearance per variant                           |
| Hover        | Mouse hover       | Background tint (secondary/tertiary) or darker primary  |
| Disabled     | `disabled={true}` | 50% opacity, `cursor: not-allowed`, HTML `disabled` set |
| N/A: Loading | —                 | Not applicable at this size; use a parent-level spinner |
| N/A: Error   | —                 | Not applicable                                          |

---

## Accessibility

**ARIA role**: Native `<button>` — no explicit role needed

**Keyboard behavior**:

- `Tab` — receives focus
- `Enter` / `Space` — activates the button
- Focus ring: `2px solid var(--interactive-accent)` on `:focus-visible`

**Screen reader behavior**:

- When `iconOnly={false}`: reads slot content (label text)
- When `iconOnly={true}`: reads `ariaLabel` — required, enforced via `log.warn` at runtime

**Focus management**: N/A — button retains focus after click

---

## Design tokens used

| CSS property                   | Token                         | Fallback  |
| ------------------------------ | ----------------------------- | --------- |
| `height`                       | `--size-4-6`                  | `24px`    |
| `background` (primary)         | `--interactive-accent`        | `#dc2626` |
| `background` (secondary hover) | `--background-modifier-hover` | `#f3f4f6` |
| `color` (primary)              | `--text-on-accent`            | `#ffffff` |
| `color` (secondary)            | `--text-normal`               | `#1f2937` |
| `color` (tertiary)             | `--text-muted`                | `#6b7280` |
| `border` (secondary)           | `--border-color`              | `#e5e7eb` |
| `border-radius`                | `--radius-s`                  | `4px`     |
| Focus ring                     | `--interactive-accent`        | `#dc2626` |

---

## Data pattern

**Arity**: 1:1 — one button performs one action.

---

## Known limitations

- The 24px touch target is below the WCAG 2.2 minimum of 24×24px target area (technically
  borderline). Only use in surfaces explicitly designed for compact toolbars where the
  reduced target size is an accepted design tradeoff.
- Max 3 `ButtonTiny` instances in any single inline toolbar. Beyond 3, use a `ContextMenu`.
- The `tertiary` variant is an addition not present in the standard `Button.svelte` — if
  `Button.svelte` is ever extended with `tertiary`, this component should be unified.
