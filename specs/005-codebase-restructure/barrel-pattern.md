# Barrel Re-Export Pattern

## Purpose

When splitting a monolithic file into sub-modules, the original import path must continue to work. A barrel `index.ts` (or `mod.rs`) re-exports everything from the sub-modules.

## TypeScript Example

```text
src/lib/types/canvas.ts (original, 629 lines)
  →
src/lib/types/canvas/
├── index.ts          ← barrel
├── document.ts
├── elements.ts
├── paint.ts
├── interactions.ts
├── components.ts
└── settings.ts
```

**index.ts**:
```typescript
export * from './document';
export * from './elements';
export * from './paint';
export * from './interactions';
export * from './components';
export * from './settings';
```

**Result**: `import { CanvasElement } from '@/types/canvas'` continues to resolve.

## Rust Example

```text
src-tauri/src/db.rs (original, 551 lines)
  →
src-tauri/src/db/
├── mod.rs            ← barrel
├── schema.rs
└── queries.rs
```

**mod.rs**:
```rust
mod schema;
mod queries;

pub use schema::*;
pub use queries::*;

// Database struct stays in mod.rs
pub struct Database { ... }
```

## Rules

1. **Never delete the original file until barrel is verified** — create directory, move content, add barrel, then delete.
2. **Re-export all public items** — no consumer should need to change their import path.
3. **Each sub-module ≤ 300 lines** — if a sub-module exceeds the limit, split again.
4. **No circular dependencies** — sub-modules import from each other only via the barrel (or avoid cross-imports entirely).
