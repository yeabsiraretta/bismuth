#!/usr/bin/env bash
set -euo pipefail

UNIT_PATH="${HOME}/.config/systemd/user/bismuth-web.service"

if command -v systemctl >/dev/null 2>&1; then
  systemctl --user disable --now bismuth-web.service >/dev/null 2>&1 || true
  systemctl --user daemon-reload
fi

rm -f "$UNIT_PATH"
echo "Removed bismuth-web.service user unit."
