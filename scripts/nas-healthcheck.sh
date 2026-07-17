#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/_nas-common.sh"

load_nas_env

HOST="${BISMUTH_HEALTHCHECK_HOST:-127.0.0.1}"
PORT="${BISMUTH_PORT:-4173}"
URL="http://${HOST}:${PORT}"

curl -fsS --max-time 10 "$URL" >/dev/null
echo "Bismuth NAS healthcheck OK: ${URL}"
