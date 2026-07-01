# Technical Decisions (`docs/memory/`)

> **Canonical ADR source**: This file is the authoritative architecture decision log for Bismuth.
> Format: `### YYYY-MM-DD - Title` | `**Status**: Active/Needs Review/Superseded` | `**Decision**:` | `**Rationale**:` | `**Where to look next**:`
> To add a new ADR: append a new `### YYYY-MM-DD` section following the format above.

This file stores durable technical and implementation decisions. For governance-level decisions or project standards, see `.specify/memory/constitution.md`.

## Entry Lifecycle

Each decision follows this lifecycle:

```text
Active → Needs Review → Superseded → (pruned)
```

- **Active**: The decision is current and must be honored by all features and AI agents.
- **Needs Review**: Implementation reality or new context suggests this decision may be outdated.
- **Superseded**: A newer decision has replaced this one. Keep for historical context.

---

### 2026-06-08 - Shallow-reference component instances

**Status**: Active

**Why this is durable**: Every canvas feature that creates or renders component instances must respect the shallow-reference model.

**Decision**: ComponentInstance stores only `definitionId` + sparse `overrides` map. At render time, the resolver merges definition elements with instance overrides. No deep cloning.

**Tradeoffs**: O(overrides) merge at render vs O(elements) memory per instance. Works well for <5 overrides per instance (typical case).

**Future mistake prevented**: Deep-cloning element trees per instance (causes memory bloat at 1000+ instances and stale-when-definition-changes bugs).

**Where to look next**: `src/lib/utils/canvas/componentResolver.ts`, `src/lib/types/canvas/components.ts`

---

### 2026-06-08 - Hold-to-drag pattern for clickable draggable elements

**Status**: Active

**Why this is durable**: Any UI element that needs both click and drag behavior will encounter the same browser conflict.

**Decision**: Use a 200ms hold timer before setting `draggable=true`. Clicks fire immediately; drag only activates after sustained pointer-down. Uses `pointerdown`/`pointerup`/`pointerleave` events.

**Tradeoffs**: 200ms delay before drag starts (acceptable for tab reordering, may need tuning for other contexts).

**Future mistake prevented**: Setting `draggable=true` statically, which causes browsers to intercept all mousedown+move as drag initiation and blocks click events.

**Where to look next**: `src/lib/components/sidebar/tabBarDragLogic.ts`, `src/lib/components/sidebar/VerticalTabBar.svelte`

---

### 2026-06-08 - CSS tokens over Tailwind utilities for component styling

**Status**: Active

**Why this is durable**: Constitution VIII mandates this. All new components must follow.

**Decision**: Components use scoped `<style>` with `var(--token)` references. Tailwind utilities only for rapid layout, never for visual properties (colors, spacing values).

**Tradeoffs**: More verbose CSS but fully theme-aware and consistent. Easier dark mode support.

**Future mistake prevented**: Using Tailwind color utilities directly (bypasses theme system, breaks dark mode, creates maintenance burden on theme changes).

**Where to look next**: `src/lib/styles/tokens.css`, `src/app.css` (@theme block)

---

### 2026-06-21 - Flow links stored at CanvasDocument level, not as element properties

**Status**: Active

**Why this is durable**: Any feature adding navigational, event, or interaction links between canvas elements must follow this placement. Storing links on elements causes orphan links when elements are moved between pages or when element properties are reset.

**Decision**: `flowLinks: FlowLink[]` is a top-level field on `CanvasDocument`, not a property on individual frame elements. Each `FlowLink` stores `fromFrameId` and `toFrameId` as string references. This was a deliberate research-first decision documented in `specs/004-canvas-component-system/research.md`.

**Tradeoffs**:
- Gained: Cascade deletion is a single array filter on the document — no element tree walk needed.
- Gained: Links survive element property resets and component instance override changes.
- Made harder: Querying "which links touch this frame" requires a document-level scan. Use `buildFlowGraph()` to pre-index before any query that needs per-frame link access.

**Future mistake prevented**: Adding `outgoingLinks` or `flowConnections` as an `ElementProperties` field, which would require a full tree walk to find all links and lose links when element properties are reset via instance merging.

**Where to look next**: `src/lib/features/canvas/types/document.ts:23`, `src/lib/features/canvas/utils/data/flowGraph.ts` (`buildFlowGraph`), `src/lib/features/canvas/stores/canvasElements.ts` (`removeFlowLinksForElement` cascade)

---

### 2026-06-21 - CodeMirror: batch all compartment reconfigurations in a single dispatch call

**Status**: Active

**Why this is durable**: Every feature that stores CodeMirror configuration in Svelte settings and updates it reactively will encounter this pattern. Separate `$:` blocks each dispatching one compartment is a common first instinct but is incorrect.

**Decision**: When multiple `Compartment` values need reconfiguring on a settings change, batch them in a single `view.dispatch({ effects: [...all effects...] })` call inside one consolidated `$:` block with a `mounted` guard. Do NOT use separate `$:` blocks each dispatching one effect.

**Tradeoffs**:
- Gained: Single CodeMirror state transaction — no intermediate renders between compartment updates.
- Gained: Prevents order-dependent side effects if two compartments interact (e.g. theme + spellcheck both touching content attributes).
- Made harder: All relevant compartments must be declared in the same scope. Requires planning compartment placement at component initialization time.

**Future mistake prevented**: Adding a new setting (e.g., `tabSize`, `wordWrap`) in its own separate `$:` block produces double renders and potential flicker on settings save. The existing consolidated block in `Editor.svelte` is the pattern to follow.

**Reconsider**: If compartments become too numerous to batch cleanly, extract to a `buildEditorEffects(settings): StateEffect[]` helper function.

**Where to look next**: `src/lib/components/editor/Editor.svelte:145-165` (consolidated reactive dispatch block)

---

### 2026-06-21 - Blocked features use a functional stub with inline verification, not a placeholder

**Status**: Active

**Why this is durable**: Any future feature blocked on a platform capability (SharedArrayBuffer for ffmpeg.wasm, native APIs, OS permissions, hardware access) will face the same design choice. The VideoEditor stub in spec 047 established the canonical pattern.

**Decision**: When a feature is blocked on external verification (e.g., COOP/COEP headers for ffmpeg.wasm), implement a stub component that: (1) explains the block clearly to the user, (2) links to verification documentation, (3) includes an actionable inline check button that calls the blocking check function and shows the result, (4) shows a "ready" state when the check passes.

**Tradeoffs**:
- Gained: Developers and users can self-diagnose readiness without opening a terminal.
- Gained: The stub satisfies the tasks.md entry, avoids a broken tab, and documents the unblock path in the UI itself.
- Made harder: Slightly more implementation work than a placeholder div.

**Future mistake prevented**: Creating an empty `<p>Coming soon</p>` placeholder that provides no path forward and silently fails to communicate the block condition to developers on other platforms.

**Where to look next**: `src/lib/features/media/components/VideoEditor.svelte`, `docs/development/coop-coep-verification.md`, `src/lib/features/media/services/videoOps.ts`
