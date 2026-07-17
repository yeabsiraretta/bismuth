#!/usr/bin/env bash
set -euo pipefail

if ! command -v systemctl >/dev/null 2>&1; then
  echo "Error: systemctl is not installed." >&2
  exit 1
fi

systemctl --user restart bismuth-web.service
systemctl --user status bismuth-web.service --no-pager
