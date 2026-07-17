#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/_nas-common.sh"

load_nas_env
require_node_22
RUNNER="$(resolve_runner)"
run_script "$RUNNER" build
