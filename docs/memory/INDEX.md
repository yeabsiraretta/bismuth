# Memory Index

This is a compact routing map for durable project memory (`docs/memory/`). Keep it short.

> [!NOTE]
> High-level project governance, constitution, and standards are stored in the **Governance Layer** at `.specify/memory/` and should be reviewed before technical planning.

## Architecture

- Svelte 4 + Tauri 2 desktop app: `ARCHITECTURE.md`
- Layer boundaries (Entry/App/Domain/Data/External): `ARCHITECTURE.md#boundaries`
- Design token system (tokens.css single source): `ARCHITECTURE.md#styling`
- [A1] Rust IPC: validate user-controlled IDs before using as filesystem path segments — `ARCHITECTURE.md`
- [A2] Feature components must not call ipcCall() directly — use service wrapper — `ARCHITECTURE.md`

## Bugs

- Svelte reactive loops from store ↔ component feedback: `BUGS.md`
- CodeMirror RangeSetBuilder ordering requirement: `BUGS.md`
- [B1] Circular store re-export between split modules causes latent init-order bugs — `BUGS.md`
- [B2] Bulk-delete must mirror all cascade side effects of single-element path — `BUGS.md`
- [B3] Rust path confinement: canonicalize then starts_with is the only safe pattern — `BUGS.md`

## Decisions

- Shallow-reference component instances (not deep clone): `DECISIONS.md`
- CSS tokens over Tailwind utilities: `DECISIONS.md`
- Hold-to-drag pattern for clickable+draggable elements: `DECISIONS.md`
- [D4] Flow links stored at CanvasDocument level, not as element properties — `DECISIONS.md`
- [D5] CodeMirror: batch all compartment reconfigurations in a single dispatch call — `DECISIONS.md`
- [D6] Blocked features use a functional stub with inline verification, not a placeholder — `DECISIONS.md`

## Workflow

- Spec Kit lifecycle mandatory for all non-trivial features
- Memory-first context loading before planning
