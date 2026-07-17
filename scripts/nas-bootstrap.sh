#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/_nas-common.sh"

load_nas_env
require_node_22

for cmd in curl bash; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Error: required command not found: $cmd" >&2
    exit 1
  fi
done

RUNNER="$(resolve_runner)"

SKIP_INSTALL_DEPS="${BISMUTH_BOOTSTRAP_SKIP_INSTALL_DEPS:-0}"
SKIP_SERVICE="${BISMUTH_BOOTSTRAP_SKIP_SERVICE:-0}"
SKIP_HEALTHCHECK="${BISMUTH_BOOTSTRAP_SKIP_HEALTHCHECK:-0}"

if [[ "$SKIP_INSTALL_DEPS" != "1" ]]; then
  if [[ "$RUNNER" == "pnpm" ]]; then
    (cd "$PROJECT_ROOT" && pnpm install --frozen-lockfile)
  else
    (cd "$PROJECT_ROOT" && npm ci)
  fi
fi

if [[ "$SKIP_SERVICE" != "1" ]]; then
  if ! command -v systemctl >/dev/null 2>&1; then
    echo "Error: systemctl is required for service bootstrap. Set BISMUTH_BOOTSTRAP_SKIP_SERVICE=1 to skip." >&2
    exit 1
  fi
  bash "${SCRIPT_DIR}/nas-service-install.sh"
else
  bash "${SCRIPT_DIR}/build-nas.sh"
fi

if [[ "$SKIP_HEALTHCHECK" != "1" ]]; then
  bash "${SCRIPT_DIR}/nas-healthcheck.sh"
fi

HOST="${BISMUTH_HOST:-0.0.0.0}"
PORT="${BISMUTH_PORT:-4173}"
DISPLAY_HOST="$HOST"
if [[ "$DISPLAY_HOST" == "0.0.0.0" ]]; then
  DISPLAY_HOST="127.0.0.1"
fi

echo "Bismuth NAS bootstrap complete."
echo "URL: http://${DISPLAY_HOST}:${PORT}"
echo "Status: $(cd "$PROJECT_ROOT" && if [[ "$RUNNER" == "pnpm" ]]; then echo 'pnpm nas:status'; else echo 'npm run nas:status'; fi)"
