#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEFAULT_ENV_FILE="${HOME}/.config/bismuth/bismuth-web.env"

load_nas_env() {
  local env_file="${BISMUTH_ENV_FILE:-$DEFAULT_ENV_FILE}"
  if [[ -f "$env_file" ]]; then
    set -a
    # shellcheck disable=SC1090
    source "$env_file"
    set +a
  fi
}

require_node_22() {
  if ! command -v node >/dev/null 2>&1; then
    echo "Error: node is not installed." >&2
    exit 1
  fi
  local major
  major="$(node -p "process.versions.node.split('.')[0]")"
  if [[ "$major" -lt 18 ]]; then
    echo "Error: Node.js 18+ is required (found $(node -v))." >&2
    exit 1
  fi
  if [[ "$major" -lt 22 ]]; then
    echo "Warning: Node.js 22+ is recommended for full compatibility (found $(node -v))." >&2
  fi
}

resolve_runner() {
  if command -v pnpm >/dev/null 2>&1; then
    if pnpm -v >/dev/null 2>&1; then
      echo "pnpm"
      return
    fi
  fi
  if command -v npm >/dev/null 2>&1; then
    echo "npm"
    return
  fi
  echo "Error: neither pnpm nor npm is installed." >&2
  exit 1
}

run_script() {
  local runner="$1"
  shift
  local script_name="$1"
  shift
  if [[ "$runner" == "pnpm" ]]; then
    (cd "$PROJECT_ROOT" && pnpm run "$script_name" "$@")
    return
  fi
  (cd "$PROJECT_ROOT" && npm run "$script_name" "$@")
}
