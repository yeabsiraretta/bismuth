#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/_nas-common.sh"

load_nas_env
require_node_22

HOST="${BISMUTH_HOST:-0.0.0.0}"
PORT="${BISMUTH_PORT:-4173}"
STRICT_PORT="${BISMUTH_STRICT_PORT:-1}"
SKIP_BUILD="${BISMUTH_SKIP_BUILD:-0}"

RUNNER="$(resolve_runner)"

if [[ "$SKIP_BUILD" != "1" ]]; then
  run_script "$RUNNER" build
fi

if [[ "$STRICT_PORT" == "1" ]]; then
  run_script "$RUNNER" preview -- --host "$HOST" --port "$PORT" --strictPort
  exit 0
fi

run_script "$RUNNER" preview -- --host "$HOST" --port "$PORT"
