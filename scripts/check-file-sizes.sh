#!/usr/bin/env bash
# File size checker for Bismuth Constitution Principle VI
# Enforces 300-line limit for all code and test files

set -e

MAX_LINES=300
EXIT_CODE=0

echo "🔍 Checking file sizes (max: $MAX_LINES lines)..."
echo ""

# Function to count lines (excluding blank lines and comments where possible)
count_lines() {
    local file="$1"
    wc -l < "$file" | tr -d ' '
}

# Check TypeScript/JavaScript/Svelte files
echo "📝 Checking TypeScript/JavaScript/Svelte files..."
while IFS= read -r file; do
    lines=$(count_lines "$file")
    if [ "$lines" -gt "$MAX_LINES" ]; then
        echo "❌ FAIL: $file ($lines lines, max: $MAX_LINES)"
        EXIT_CODE=1
    fi
done < <(find src -type f \( -name "*.ts" -o -name "*.js" -o -name "*.svelte" \) \
    ! -path "*/node_modules/*" \
    ! -path "*/dist/*" \
    ! -path "*/.svelte-kit/*")

# Check Rust files
echo ""
echo "🦀 Checking Rust files..."
while IFS= read -r file; do
    lines=$(count_lines "$file")
    if [ "$lines" -gt "$MAX_LINES" ]; then
        echo "❌ FAIL: $file ($lines lines, max: $MAX_LINES)"
        EXIT_CODE=1
    fi
done < <(find src-tauri/src -type f -name "*.rs")

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ All files are within the $MAX_LINES line limit"
else
    echo "❌ Some files exceed the $MAX_LINES line limit"
    echo ""
    echo "Constitution Principle VI requires:"
    echo "  - No code or test file may exceed 300 lines"
    echo "  - Files must be refactored into smaller, focused modules"
    echo ""
    echo "Files currently exceeding limit:"
    echo ""
    
    # Show detailed report
    find src -type f \( -name "*.ts" -o -name "*.js" -o -name "*.svelte" \) \
        ! -path "*/node_modules/*" \
        ! -path "*/dist/*" \
        ! -path "*/.svelte-kit/*" \
        -exec wc -l {} + | sort -rn | awk -v max="$MAX_LINES" '$1 > max {print "  " $1 " lines: " $2}'
    
    find src-tauri/src -type f -name "*.rs" \
        -exec wc -l {} + | sort -rn | awk -v max="$MAX_LINES" '$1 > max {print "  " $1 " lines: " $2}'
fi

exit $EXIT_CODE
