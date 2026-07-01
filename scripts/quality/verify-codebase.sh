#!/usr/bin/env bash
# Bismuth Codebase Verifier
# Checks naming, barrel exports, file size, logger, Tauri usage, and cross-feature imports.

set -euo pipefail

EXIT_CODE=0

pass() { echo "[PASS] $1: 0 violations"; }

fail() {
  local label="$1"
  local count="$2"
  local details="$3"
  echo "[FAIL] $label: $count violation$([ "$count" -eq 1 ] || echo 's')"
  echo "$details"
  EXIT_CODE=1
}

echo "=== Bismuth Codebase Verifier ==="
echo ""

# ── 1. Component naming: .svelte files must use PascalCase ─────────────────
NAMING_VIOLATIONS=$(find src -name "*.svelte" 2>/dev/null \
  | grep -E "/[a-z][^/]*\.svelte$" \
  | grep -v "node_modules" || true)
if [ -z "$NAMING_VIOLATIONS" ]; then
  pass "Component naming"
else
  COUNT=$(echo "$NAMING_VIOLATIONS" | wc -l | tr -d ' ')
  DETAILS=$(echo "$NAMING_VIOLATIONS" | sed 's/^/  - /')
  fail "Component naming" "$COUNT" "$DETAILS"
fi

# ── 2. Barrel rule: every src/lib/features/*/ must have index.ts ───────────
BARREL_VIOLATIONS=""
for dir in src/lib/features/*/; do
  [ -d "$dir" ] || continue
  if [ ! -f "${dir}index.ts" ]; then
    BARREL_VIOLATIONS="${BARREL_VIOLATIONS}  - ${dir}index.ts (missing)\n"
  fi
done
if [ -z "$BARREL_VIOLATIONS" ]; then
  pass "Barrel rule"
else
  COUNT=$(echo -e "$BARREL_VIOLATIONS" | grep -c "missing" || true)
  fail "Barrel rule" "$COUNT" "$(echo -e "$BARREL_VIOLATIONS")"
fi

# ── 3. File size: > 350 lines is a violation (300 limit, 350 tolerance) ────
SIZE_VIOLATIONS=$(
  find src -type f \( -name "*.ts" -o -name "*.svelte" \) \
    ! -path "*/node_modules/*" ! -path "*/dist/*" ! -path "*/.svelte-kit/*" \
    2>/dev/null \
  | while read -r f; do
      lines=$(wc -l < "$f" 2>/dev/null | tr -d ' ')
      [ -n "$lines" ] && [ "$lines" -gt 350 ] && echo "  - $f: $lines lines"
    done 2>/dev/null || true
)
if [ -z "$SIZE_VIOLATIONS" ]; then
  pass "File size (300-line limit)"
else
  COUNT=$(echo "$SIZE_VIOLATIONS" | grep -c "\-" || true)
  fail "File size (300-line limit)" "$COUNT" "$SIZE_VIOLATIONS"
fi

# ── 4. Logger rule: no console.log in non-test source files ────────────────
# Exception: the unified logger implementation itself is allowed to use console.log.
LOGGER_VIOLATIONS=$(
  grep -rn "console\.log" src/lib \
    --include="*.ts" --include="*.svelte" 2>/dev/null \
  | grep -v "__tests__" | grep -v "\.spec\." | grep -v "\.test\." \
  | grep -v "node_modules" \
  | grep -v "utils/logger/" \
  | sed 's/^/  - /' || true
)
if [ -z "$LOGGER_VIOLATIONS" ]; then
  pass "Logger rule (no console.log)"
else
  COUNT=$(echo "$LOGGER_VIOLATIONS" | grep -c "\-" || true)
  fail "Logger rule (no console.log)" "$COUNT" "$LOGGER_VIOLATIONS"
fi

# ── 5. No direct Tauri invoke in components ────────────────────────────────
TAURI_VIOLATIONS=$(
  grep -rn "from '@tauri-apps" src/lib/components \
    --include="*.svelte" 2>/dev/null \
  | sed 's/^/  - /' || true
)
if [ -z "$TAURI_VIOLATIONS" ]; then
  pass "No direct Tauri imports in components"
else
  COUNT=$(echo "$TAURI_VIOLATIONS" | grep -c "\-" || true)
  fail "No direct Tauri imports in components" "$COUNT" "$TAURI_VIOLATIONS"
fi

# ── 6. Cross-feature import violations ────────────────────────────────────
# A file in src/lib/features/<X>/... must not import internal sub-paths
# of a *different* feature (<Y>). Intra-feature deep imports are allowed.
CROSSFEAT_VIOLATIONS=$(
  grep -rn "from '@/features/[^']\+/[^']\+/[^']\+" \
    src/lib --include="*.ts" --include="*.svelte" 2>/dev/null \
  | grep -v "__tests__" | grep -v "\.spec\." | grep -v "\.test\." \
  | grep -v "node_modules" \
  | while IFS= read -r line; do
      src_file=$(echo "$line" | sed 's/:\([0-9]\+\):.*//')
      imported_feat=$(echo "$line" | grep -o "@/features/[^/'\"]*" | sed "s|@/features/||")
      src_feat=$(echo "$src_file" | grep -o "features/[^/]*" | head -1 | sed "s|features/||")
      if [ -n "$imported_feat" ] && [ -n "$src_feat" ] && [ "$src_feat" != "$imported_feat" ]; then
        echo "  - $line"
      fi
    done || true
)
if [ -z "$CROSSFEAT_VIOLATIONS" ]; then
  pass "Cross-feature import paths"
else
  COUNT=$(echo "$CROSSFEAT_VIOLATIONS" | grep -c "\-" || true)
  fail "Cross-feature import paths" "$COUNT" "$CROSSFEAT_VIOLATIONS"
fi

# ── Summary ───────────────────────────────────────────────────────────────
echo ""
if [ $EXIT_CODE -eq 0 ]; then
  echo "EXIT: 0 (all checks passed)"
else
  echo "EXIT: 1 (violations found — fix before merging)"
fi

exit $EXIT_CODE
