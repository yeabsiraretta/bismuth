# Quickstart: Codebase Restructure Validation

## Prerequisites

```bash
cd /Users/nqv886/bismuth
pnpm install
```

## Validation Steps

### 1. Frontend Type Check

```bash
pnpm check
# Expected: No new errors (pre-existing svelte/store resolution is IDE-only)
```

### 2. Backend Compilation

```bash
cd src-tauri && cargo build 2>&1 | tail -5
# Expected: Compiling bismuth ... Finished
```

### 3. Clippy Lint

```bash
cd src-tauri && cargo clippy -- -W clippy::all 2>&1 | grep -c "warning"
# Expected: 0 new warnings from restructured code
```

### 4. File Size Validation

```bash
# Frontend — should return 0 files
find src -name "*.ts" -o -name "*.svelte" | xargs wc -l | awk '$1 > 300 && !/total/ {print}' | wc -l

# Backend — should return 0 files  
find src-tauri/src -name "*.rs" | xargs wc -l | awk '$1 > 300 && !/total/ {print}' | wc -l
```

### 5. Import Resolution

```bash
# Verify barrel re-exports work
grep -r "from '@/types/canvas'" src/lib --include="*.ts" --include="*.svelte" | head -5
# All should still resolve (barrel index.ts provides same exports)
```

### 6. Application Smoke Test

```bash
pnpm tauri dev
# Verify:
# - Welcome screen displays
# - Can open/create a vault  
# - Canvas view loads without console errors
# - Settings modal opens, theme switch works
# - Cmd+K opens command palette
```

### 7. Dark Mode Verification

```bash
# In running app:
# 1. Open Settings → Appearance
# 2. Toggle dark mode
# 3. Navigate to Canvas view
# 4. Verify: no white flashes, all canvas UI respects dark theme
```

## Quick Fix Commands

```bash
# If type errors after split:
pnpm check 2>&1 | grep "error" | head -20

# If Rust doesn't compile:
cd src-tauri && cargo build 2>&1 | grep "error\[" | head -20

# Reset node_modules if stale:
rm -rf node_modules && pnpm install
```
