#!/usr/bin/env bash

set -euo pipefail

OS_NAME="$(uname -s)"

if [[ "${1:-}" == "dev" ]]; then
  shift
  if [[ "$OS_NAME" == "Linux" ]]; then
    exec bash ./scripts/tauri-dev.sh "$@"
  fi

  echo "[tauri] Non-Linux host detected (${OS_NAME}); bypassing Linux-specific tauri-dev launcher." >&2
  exec tauri dev "$@"
fi

exec tauri "$@"
