# Research: Service Layer Bugfixes

**Date**: 2026-06-05 | **Spec**: 006

## Phase 0: Research Findings

### R1: SQLite Transaction Patterns in rusqlite

**Decision**: Use `conn.transaction()` which returns a `Transaction` object with auto-rollback on drop.

**Rationale**: rusqlite's `Transaction` type provides RAII-based safety — if the function returns early (panic/error), the transaction is automatically rolled back. This is safer than manual `BEGIN`/`COMMIT`.

**Alternatives considered**:
- Manual `execute("BEGIN")` / `execute("COMMIT")` — error-prone, no auto-rollback
- `execute_batch` — doesn't support parameterized queries
- Savepoints — unnecessary for single-operation atomicity

**Pattern**:

```rust
let tx = conn.transaction()?;
tx.execute(...)?;
tx.execute(...)?;
tx.commit()?;
```

### R2: Static Regex Compilation in Rust

**Decision**: Use `std::sync::LazyLock` (stable since Rust 1.80) or `once_cell::sync::Lazy`.

**Rationale**: `LazyLock` is now in std and doesn't require external crates. Since Bismuth targets stable Rust and Rust 1.80+ is reasonable, prefer std. Fallback to `once_cell` which is already a transitive dependency.

**Alternatives considered**:
- `lazy_static!` — deprecated in favor of `LazyLock`
- Compile regex in struct constructor — requires passing regex through all call chains
- Thread-local regex — unnecessary complexity for read-only patterns

**Pattern**:

```rust
use std::sync::LazyLock;
use regex::Regex;

static WIKILINK_RE: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"\[\[([^\]]+)\]\]").unwrap()
});
```

### R3: UTF-8 Percent-Decoding

**Decision**: Collect consecutive `%XX` bytes into a buffer, then decode as UTF-8.

**Rationale**: RFC 3986 specifies percent-encoding operates on UTF-8 byte sequences. Each byte is encoded as `%HH`. Multi-byte characters produce multiple percent-encoded triplets that must be decoded together.

**Alternatives considered**:
- Use `percent-encoding` crate — adds a dependency for a ~20 line function
- Use `urlencoding` crate — same concern
- Inline implementation — sufficient for the limited URL parsing needs of the search server

**Pattern**:

```rust
fn urldecode(s: &str) -> String {
    let mut bytes: Vec<u8> = Vec::with_capacity(s.len());
    let mut chars = s.bytes().peekable();
    while let Some(b) = chars.next() {
        match b {
            b'+' => bytes.push(b' '),
            b'%' => {
                let hi = chars.next().unwrap_or(b'0');
                let lo = chars.next().unwrap_or(b'0');
                let hex = [hi, lo];
                if let Ok(byte) = u8::from_str_radix(
                    std::str::from_utf8(&hex).unwrap_or("00"), 16
                ) {
                    bytes.push(byte);
                } else {
                    bytes.push(b'%');
                    bytes.push(hi);
                    bytes.push(lo);
                }
            }
            _ => bytes.push(b),
        }
    }
    String::from_utf8(bytes).unwrap_or_else(|_| s.to_string())
}
```

### R4: HashMap vs BTreeMap for Frontmatter (BUG-015)

**Decision**: Defer — use `IndexMap` from the `indexmap` crate to preserve insertion order.

**Rationale**: Changing to `BTreeMap` would alphabetize YAML keys on re-serialization, which may surprise users who carefully ordered their frontmatter. `IndexMap` preserves the original YAML key order (insertion order from parsing), producing minimal diffs. However, this requires adding `indexmap` as a dependency and changing the return type across 8+ callers.

**Alternatives considered**:
- `BTreeMap` — deterministic but loses original ordering
- `HashMap` with separate key-order vector — manual tracking, error-prone
- Leave as-is — accept non-deterministic ordering (current behavior)

**Risk assessment**: Medium effort, low urgency. Recommend deferring to Phase 4 or a separate PR.

### R5: Atomic Lifecycle Transitions (BUG-005)

**Decision**: Create a single backend command `set_lifecycle_state` that atomically reads-modifies-writes all relevant fields.

**Rationale**: The frontend currently makes 2 sequential IPC calls. If one fails, the note is in an inconsistent state. A single backend command reads the file once, modifies both `organized` and `archived` fields, and writes once.

**Alternatives considered**:
- Frontend retry logic — complex, doesn't prevent intermediate state visibility
- Backend batch frontmatter update — more general but over-engineered for this case
- Accept the race — unacceptable for data integrity

### R6: Filename Collision Handling (BUG-002)

**Decision**: Increment suffix until unique: `"note copy.md"` → `"note copy 2.md"` → `"note copy 3.md"`.

**Rationale**: Matches user expectations from macOS Finder and Windows Explorer behavior.

**Pattern**:

```rust
let mut new_path = parent.join(format!("{} copy.md", stem));
let mut counter = 2;
while new_path.exists() {
    new_path = parent.join(format!("{} copy {}.md", stem, counter));
    counter += 1;
}
```

### R7: Watcher Mutex Redesign (BUG-014)

**Decision**: Clone the event after receiving, drop the lock, then sleep for debounce.

**Rationale**: The mutex only needs to be held during `try_recv()`. The debounce sleep and subsequent drain can happen with the lock released between attempts.

**Pattern**:

```rust
pub fn next_event(&self) -> Option<Event> {
    let event = {
        let rx = self.event_rx.lock().unwrap();
        rx.try_recv().ok()
    }?;
    
    // Debounce outside the lock
    std::thread::sleep(Duration::from_millis(DEBOUNCE_MS));
    
    // Re-acquire to drain
    let rx = self.event_rx.lock().unwrap();
    let mut last_event = event;
    while let Ok(new_event) = rx.try_recv() {
        last_event = new_event;
    }
    Some(last_event)
}
```
