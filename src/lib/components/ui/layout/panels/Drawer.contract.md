# Drawer Contract

**Version**: 1.0.0
**Layer**: `components/ui/layout/panels/`
**Last reviewed**: 2026-06-23

---

## What it does

A right-edge slide-in panel for contextual sub-tasks that layer over the current page — provides
focus trap, scroll lock, animation, and named slots for header, body, staging, and footer zones
without prescribing content.

---

## Props

| Prop        | Type               | Required | Default       | Description                                             |
| ----------- | ------------------ | -------- | ------------- | ------------------------------------------------------- |
| `open`      | `boolean`          | Yes      | —             | Controls visibility; drives focus trap and scroll lock  |
| `title`     | `string`           | Yes      | —             | Panel header title; also the accessible dialog label    |
| `subtitle`  | `string`           | No       | `undefined`   | Optional secondary line below the title                 |
| `width`     | `number \| string` | No       | `480`         | Panel width in px (number) or any CSS width string      |
| `ariaLabel` | `string`           | No       | `title` value | Custom accessible label overriding the title            |
| `onClose`   | `() => void`       | Yes      | —             | Called on X button click, backdrop click, or Escape key |

---

## Slots

| Slot                 | Purpose                 | Notes                                       |
| -------------------- | ----------------------- | ------------------------------------------- |
| default              | Scrollable body content | Owns all panel content                      |
| `staging`            | Fixed zone above footer | Use for accumulated selections or summaries |
| `footer-regressive`  | Left footer zone        | Cancel, Back actions                        |
| `footer-progressive` | Right footer zone       | Primary CTA                                 |

---

## States

| State         | How triggered  | Visual change                                                 |
| ------------- | -------------- | ------------------------------------------------------------- |
| Closed        | `open={false}` | Drawer not rendered; scroll lock released                     |
| Open          | `open={true}`  | Slides in from right; backdrop fades in; focus trap activates |
| N/A: Loading  | —              | Body slot owns loading state                                  |
| N/A: Disabled | —              | Not applicable; drawer is always interactive when open        |
| N/A: Error    | —              | Body slot owns error state                                    |

---

## Accessibility

**ARIA role**: `role="dialog"` + `aria-modal="true"` — standard dialog pattern

**Keyboard behavior**:

- `Tab` / `Shift+Tab` — cycles focus within the drawer (focus trap active)
- `Escape` — calls `onClose`
- Close button is the first focusable element on open

**Screen reader behavior**:

- Dialog announced with `aria-labelledby` pointing to `drawer-title` heading
- Backdrop is `role="presentation"` — not announced

**Focus management**:

- On open: focus moves to the close button
- On close: focus returns to the element that triggered the drawer (`returnFocus: true`)

---

## Design tokens used

| CSS property       | Token                                       | Fallback              |
| ------------------ | ------------------------------------------- | --------------------- |
| `background`       | `--background-primary`                      | `#ffffff`             |
| `border-left`      | `--background-modifier-border`              | `#d1d5db`             |
| `z-index`          | `--layer-modal`                             | `1000`                |
| Animation          | `--transition-medium`                       | `250ms ease`          |
| Spacing            | `--spacing-l`, `--spacing-m`, `--spacing-s` | `16px`, `12px`, `8px` |
| Close button hover | `--background-modifier-hover`               | `#f3f4f6`             |

---

## Data pattern

**Arity**: 1:1 — one drawer per trigger. Body content may render 1:Many items internally.

---

## Known limitations

- Scroll lock uses `document.body.style.overflow = 'hidden'`; restored in `onDestroy`. If multiple
  drawers are ever nested (rare), overflow restoration may conflict.
- Width below 600px viewport automatically becomes 100vw; the `width` prop is ignored at that
  breakpoint.
- Focus trap requires at least one focusable element in the body.
