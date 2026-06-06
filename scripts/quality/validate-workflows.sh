#!/usr/bin/env bash
# Validate Windsurf workflow files in .specify/workflows/
# Adapted from steipete/agent-scripts validate-skills

set -euo pipefail

repo_root=$(git rev-parse --show-toplevel 2>/dev/null || echo ".")
cd "$repo_root"

workflows_dir=".specify/workflows"

if [ ! -d "$workflows_dir" ]; then
  echo "No $workflows_dir directory found."
  exit 0
fi

workflow_files=$(find "$workflows_dir" -name "*.md" -type f | sort)

if [ -z "$workflow_files" ]; then
  echo "No workflow files found in $workflows_dir"
  exit 0
fi

errors=()
count=0

while IFS= read -r file; do
  count=$((count + 1))
  
  # Check if file has YAML frontmatter
  if ! head -n 1 "$file" | grep -q "^---$"; then
    errors+=("$file: missing YAML frontmatter (must start with ---)")
    continue
  fi
  
  # Extract frontmatter
  frontmatter=$(awk '/^---$/{if(++n==2){exit}}n==1' "$file")
  
  # Check for required 'description' field
  if ! echo "$frontmatter" | grep -q "^description:"; then
    errors+=("$file: missing 'description' field in frontmatter")
    continue
  fi
  
  # Check description is not empty
  description=$(echo "$frontmatter" | grep "^description:" | sed 's/^description: *//' | tr -d '"' | tr -d "'")
  if [ -z "$description" ]; then
    errors+=("$file: 'description' field is empty")
  fi
done <<< "$workflow_files"

if [ ${#errors[@]} -gt 0 ]; then
  echo "Workflow validation failed:"
  for error in "${errors[@]}"; do
    echo "  - $error"
  done
  exit 1
fi

echo "✓ Validated $count workflow(s)"
exit 0
