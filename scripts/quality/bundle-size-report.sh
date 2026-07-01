#!/usr/bin/env bash
# bundle-size-report.sh — Generate bundle size report with baseline comparison.
# Run after `pnpm build`.
#
# Usage:
#   ./scripts/quality/bundle-size-report.sh              # Report + compare with baseline
#   ./scripts/quality/bundle-size-report.sh --update      # Update baseline after build
#   ./scripts/quality/bundle-size-report.sh --ci          # CI mode: fail on regression > 10%

set -euo pipefail

DIST_DIR="dist/assets"
BASELINE_FILE=".bundle-baseline.json"
CI_MODE=false
UPDATE_MODE=false

for arg in "$@"; do
  case "$arg" in
    --ci) CI_MODE=true ;;
    --update) UPDATE_MODE=true ;;
  esac
done

if [ ! -d "$DIST_DIR" ]; then
  echo "ERROR: dist/assets not found. Run pnpm build first." >&2
  exit 1
fi

# Collect current sizes
TOTAL_JS=0
TOTAL_CSS=0
declare -A CHUNKS

for f in "$DIST_DIR"/*.js; do
  [ -f "$f" ] || continue
  SIZE=$(wc -c < "$f")
  NAME=$(basename "$f" | sed 's/-[a-f0-9]*\.js$//')
  CHUNKS["$NAME"]=$SIZE
  TOTAL_JS=$((TOTAL_JS + SIZE))
done

for f in "$DIST_DIR"/*.css; do
  [ -f "$f" ] || continue
  SIZE=$(wc -c < "$f")
  TOTAL_CSS=$((TOTAL_CSS + SIZE))
done

TOTAL=$((TOTAL_JS + TOTAL_CSS))

# Format helpers
fmt_kb() { echo "scale=1; $1 / 1024" | bc; }

echo "═══════════════════════════════════════════════"
echo " Bundle Size Report"
echo "═══════════════════════════════════════════════"
echo ""
echo "JS chunks:"
for NAME in $(echo "${!CHUNKS[@]}" | tr ' ' '\n' | sort); do
  SIZE=${CHUNKS[$NAME]}
  echo "  $(printf '%-25s' "$NAME") $(fmt_kb $SIZE) KB"
done
echo ""
echo "Total JS:  $(fmt_kb $TOTAL_JS) KB"
echo "Total CSS: $(fmt_kb $TOTAL_CSS) KB"
echo "Total:     $(fmt_kb $TOTAL) KB"
echo ""

# Compare with baseline if it exists
if [ -f "$BASELINE_FILE" ] && [ "$UPDATE_MODE" = false ]; then
  BASELINE_TOTAL=$(python3 -c "import json; print(json.load(open('$BASELINE_FILE'))['total'])" 2>/dev/null || echo "0")
  if [ "$BASELINE_TOTAL" -gt 0 ]; then
    DELTA=$((TOTAL - BASELINE_TOTAL))
    if [ "$DELTA" -gt 0 ]; then
      PCT=$(echo "scale=1; $DELTA * 100 / $BASELINE_TOTAL" | bc)
      echo "⚠ Delta: +$(fmt_kb $DELTA) KB (+${PCT}% vs baseline)"
    else
      ABS_DELTA=$(( -DELTA ))
      PCT=$(echo "scale=1; $ABS_DELTA * 100 / $BASELINE_TOTAL" | bc)
      echo "✓ Delta: -$(fmt_kb $ABS_DELTA) KB (-${PCT}% vs baseline)"
    fi

    # CI fail on >10% regression
    if [ "$CI_MODE" = true ] && [ "$DELTA" -gt 0 ]; then
      THRESHOLD=$((BASELINE_TOTAL / 10))  # 10%
      if [ "$DELTA" -gt "$THRESHOLD" ]; then
        echo ""
        echo "ERROR: Bundle size increased by more than 10% (${PCT}%)" >&2
        exit 1
      fi
    fi
  fi
fi

# Update baseline
if [ "$UPDATE_MODE" = true ]; then
  echo "{\"total\": $TOTAL, \"js\": $TOTAL_JS, \"css\": $TOTAL_CSS, \"date\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" > "$BASELINE_FILE"
  echo "✓ Baseline updated: $(fmt_kb $TOTAL) KB"
fi
