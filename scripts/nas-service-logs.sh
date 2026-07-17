#!/usr/bin/env bash
set -euo pipefail

if ! command -v journalctl >/dev/null 2>&1; then
  echo "Error: journalctl is not installed." >&2
  exit 1
fi

journalctl --user -u bismuth-web.service --no-pager -n 200
