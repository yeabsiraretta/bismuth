#!/bin/bash
# Validates that no source files exceed 300 lines (constitution limit)
# Usage: ./scripts/validate-file-sizes.sh

MAX_LINES=300
VIOLATIONS=0

echo "=== File Size Validation (max $MAX_LINES lines) ==="
echo ""

echo "--- Frontend (src/) ---"
while IFS= read -r line; do
  lines=$(echo "$line" | awk '{print $1}')
  file=$(echo "$line" | awk '{print $2}')
  if [ "$lines" -gt "$MAX_LINES" ] 2>/dev/null; then
    echo "  VIOLATION: $file ($lines lines)"
    VIOLATIONS=$((VIOLATIONS + 1))
  fi
done < <(find src -name "*.ts" -o -name "*.svelte" | xargs wc -l 2>/dev/null | grep -v "total$")

echo ""
echo "--- Backend (src-tauri/src/) ---"
while IFS= read -r line; do
  lines=$(echo "$line" | awk '{print $1}')
  file=$(echo "$line" | awk '{print $2}')
  if [ "$lines" -gt "$MAX_LINES" ] 2>/dev/null; then
    echo "  VIOLATION: $file ($lines lines)"
    VIOLATIONS=$((VIOLATIONS + 1))
  fi
done < <(find src-tauri/src -name "*.rs" | xargs wc -l 2>/dev/null | grep -v "total$")

echo ""
echo "=== Result: $VIOLATIONS violations ==="

if [ "$VIOLATIONS" -gt 0 ]; then
  exit 1
else
  echo "✓ All files within $MAX_LINES line limit"
  exit 0
fi
