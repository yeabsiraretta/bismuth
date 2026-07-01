#!/usr/bin/env bash
# check-bundle-size.sh — Fail CI if the main JS bundle exceeds the threshold.
# Run after `pnpm build`. Threshold: 1 MB (was 2.93 MB before lazy loading).

set -euo pipefail

DIST_DIR="${1:-dist/assets}"
THRESHOLD_BYTES=1048576  # 1 MB

if [ ! -d "$DIST_DIR" ]; then
  echo "ERROR: dist/assets not found. Run pnpm build first." >&2
  exit 1
fi

MAIN_JS=$(ls "$DIST_DIR"/index-*.js 2>/dev/null | head -1)

if [ -z "$MAIN_JS" ]; then
  echo "ERROR: No index-*.js chunk found in $DIST_DIR" >&2
  exit 1
fi

MAIN_SIZE=$(wc -c < "$MAIN_JS")
MAIN_KB=$(echo "scale=1; $MAIN_SIZE / 1024" | bc)

echo "Main bundle: ${MAIN_KB} KB ($MAIN_JS)"

if [ "$MAIN_SIZE" -gt "$THRESHOLD_BYTES" ]; then
  echo "ERROR: Main bundle (${MAIN_KB} KB) exceeds 1 MB threshold." >&2
  echo "       A static import of an optional feature likely landed in the main chunk." >&2
  echo "       Check for static 'import { X } from @/features/...' in App.svelte, appInit.ts, or sidebar components." >&2
  exit 1
fi

echo "OK: Main bundle is within the 1 MB threshold."

# Report all chunks for visibility
echo ""
echo "All JS chunks:"
ls -la "$DIST_DIR"/*.js 2>/dev/null | awk '{printf "  %s KB  %s\n", int($5/1024), $9}'
