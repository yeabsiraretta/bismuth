#!/usr/bin/env bash
# File size checker for Bismuth Constitution Principle VI
# Warning at >300 lines; blocking failure at >400 lines

set -e

WARN_LINES=300
BLOCK_LINES=400
EXIT_CODE=0

echo "Checking file sizes (warn: $WARN_LINES, block: $BLOCK_LINES)..."
echo ""

count_lines() {
    wc -l < "$1" | tr -d ' '
}

WARN_LIST=()
BLOCK_LIST=()

collect_file() {
    local file="$1"
    local lines
    lines=$(count_lines "$file")
    if [ "$lines" -gt "$BLOCK_LINES" ]; then
        BLOCK_LIST+=("$file ($lines lines)")
        EXIT_CODE=1
    elif [ "$lines" -gt "$WARN_LINES" ]; then
        WARN_LIST+=("$file ($lines lines)")
    fi
}

echo "Checking TypeScript/JavaScript/Svelte files..."
while IFS= read -r file; do
    collect_file "$file"
done < <(find src -type f \( -name "*.ts" -o -name "*.js" -o -name "*.svelte" \) \
    ! -path "*/node_modules/*" \
    ! -path "*/dist/*" \
    ! -path "*/.svelte-kit/*")

echo ""
echo "Checking Rust files..."
while IFS= read -r file; do
    collect_file "$file"
done < <(find src-tauri/src -type f -name "*.rs")

echo ""

if [ ${#WARN_LIST[@]} -gt 0 ]; then
    echo "WARNING: Files approaching limit (${WARN_LINES}–${BLOCK_LINES} lines):"
    for entry in "${WARN_LIST[@]}"; do
        echo "  $entry"
    done
    # Emit GitHub Actions warning annotations if running in CI
    if [ -n "$GITHUB_STEP_SUMMARY" ]; then
        echo "## File Size Warnings" >> "$GITHUB_STEP_SUMMARY"
        echo "Files between ${WARN_LINES}–${BLOCK_LINES} lines (approaching limit):" >> "$GITHUB_STEP_SUMMARY"
        for entry in "${WARN_LIST[@]}"; do
            echo "- $entry" >> "$GITHUB_STEP_SUMMARY"
        done
    fi
    echo ""
fi

if [ ${#BLOCK_LIST[@]} -gt 0 ]; then
    echo "FAIL: Files exceeding hard limit (${BLOCK_LINES} lines):"
    for entry in "${BLOCK_LIST[@]}"; do
        echo "  $entry"
    done
    echo ""
    echo "Constitution Principle VI: no file may exceed 400 lines."
    echo "Refactor into smaller focused modules before committing."
fi

if [ $EXIT_CODE -eq 0 ]; then
    echo "File size check passed (${#WARN_LIST[@]} warnings, 0 blocking violations)"
fi

exit $EXIT_CODE
