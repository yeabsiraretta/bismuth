# Worklog

Use concise high-value entries only.
This is not a changelog. Do not record routine releases, version bumps, or implementation summaries.

---

### 2026-06-08 - Editor button unresponsiveness traced to reactive loop

- **Why durable**: Any future feature that updates a store from a component's change handler risks creating the same infinite loop pattern
- **Future mistake prevented**: Next time a component needs both read and write access to a store-backed value, the implementer will know to guard reactive reads with a reference identity check
- **Evidence**: NoteEditor reactive `$: if ($activeNote)` was resetting content on every save; fixed with `lastNotePath` guard
- **Where to look**: `docs/memory/BUGS.md`, `src/lib/components/note/NoteEditor.svelte`
