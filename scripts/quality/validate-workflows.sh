#!/usr/bin/env bash
# Validate workflow/skill files across all three integration layers:
#   1. .windsurf/workflows/*.md       (Windsurf slash-command definitions)
#   2. .claude/skills/*/SKILL.md      (Claude/Windsurf skill definitions)
#   3. .specify/extensions/*/commands/*.md (Extension command definitions)
#
# Validates: YAML frontmatter (description field), non-empty content,
# and cross-skill integration sections in governed workflow files.

set -euo pipefail

repo_root=$(git rev-parse --show-toplevel 2>/dev/null || echo ".")
cd "$repo_root"

errors=()
count=0

# --- Layer 1: Windsurf Workflows ---
windsurf_dir=".windsurf/workflows"
if [ -d "$windsurf_dir" ]; then
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    count=$((count + 1))
    
    if ! head -n 1 "$file" | grep -q "^---$"; then
      errors+=("$file: missing YAML frontmatter (must start with ---)")
      continue
    fi
    
    frontmatter=$(awk '/^---$/{if(++n==2){exit}}n==1' "$file")
    
    if ! echo "$frontmatter" | grep -q "^description:"; then
      errors+=("$file: missing 'description' field in frontmatter")
      continue
    fi
    
    description=$(echo "$frontmatter" | grep "^description:" | sed 's/^description: *//' | tr -d '"' | tr -d "'")
    if [ -z "$description" ]; then
      errors+=("$file: 'description' field is empty")
    fi
  done < <(find "$windsurf_dir" -name "*.md" -type f | sort)
fi

# --- Layer 2: Claude Skills ---
claude_dir=".claude/skills"
if [ -d "$claude_dir" ]; then
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    count=$((count + 1))
    
    if ! head -n 1 "$file" | grep -q "^---$"; then
      errors+=("$file: missing YAML frontmatter (must start with ---)")
      continue
    fi
    
    frontmatter=$(awk '/^---$/{if(++n==2){exit}}n==1' "$file")
    
    if ! echo "$frontmatter" | grep -q "^name:"; then
      errors+=("$file: missing 'name' field in frontmatter")
    fi
    
    if ! echo "$frontmatter" | grep -q "^description:"; then
      errors+=("$file: missing 'description' field in frontmatter")
    fi
  done < <(find "$claude_dir" -name "SKILL.md" -type f | sort)
fi

# --- Layer 3: Extension Commands ---
extensions_dir=".specify/extensions"
if [ -d "$extensions_dir" ]; then
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    count=$((count + 1))
    
    # Extension command files use markdown headings (some start with HTML comments)
    # Validate they have a title heading within the first 10 lines
    if ! head -n 10 "$file" | grep -q "^#"; then
      errors+=("$file: missing markdown heading in first 10 lines")
    fi
    
    # Check file is not empty (> 10 lines of content)
    line_count=$(wc -l < "$file" | tr -d ' ')
    if [ "$line_count" -lt 10 ]; then
      errors+=("$file: suspiciously short ($line_count lines)")
    fi
  done < <(find "$extensions_dir" -path "*/commands/*.md" -type f | sort)
fi

# --- Cross-Skill Integration Check (governed workflows only) ---
# Only check actual workflow/skill/command definitions, not docs
governed_files=""
[ -d "$windsurf_dir" ] && governed_files+=$(find "$windsurf_dir" -name "*governed*" -type f 2>/dev/null)
governed_files+=$'\n'
[ -d "$claude_dir" ] && governed_files+=$(find "$claude_dir" -name "SKILL.md" -path "*governed*" -type f 2>/dev/null)
governed_files+=$'\n'
[ -d "$extensions_dir" ] && governed_files+=$(find "$extensions_dir" -path "*/commands/*governed*" -type f 2>/dev/null)
governed_files=$(echo "$governed_files" | sort | grep -v '^$')

if [ -n "$governed_files" ]; then
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    if ! grep -q "Cross-Skill Integration" "$file"; then
      errors+=("$file: GOVERNED workflow missing 'Cross-Skill Integration' section")
    fi
  done <<< "$governed_files"
fi

# --- Results ---
if [ ${#errors[@]} -gt 0 ]; then
  echo "Workflow validation FAILED (${#errors[@]} error(s) in $count files):"
  for error in "${errors[@]}"; do
    echo "  - $error"
  done
  exit 1
fi

echo "Validated $count file(s) across 3 layers"
exit 0
