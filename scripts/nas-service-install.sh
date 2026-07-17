#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/_nas-common.sh"

if ! command -v systemctl >/dev/null 2>&1; then
  echo "Error: systemctl is required for NAS service installation." >&2
  exit 1
fi

UNIT_DIR="${HOME}/.config/systemd/user"
UNIT_PATH="${UNIT_DIR}/bismuth-web.service"
ENV_DIR="${HOME}/.config/bismuth"
ENV_FILE="${ENV_DIR}/bismuth-web.env"

mkdir -p "$UNIT_DIR" "$ENV_DIR"

if [[ ! -f "$ENV_FILE" ]]; then
  cat >"$ENV_FILE" <<'EOF'
BISMUTH_HOST=0.0.0.0
BISMUTH_PORT=4173
BISMUTH_STRICT_PORT=1
BISMUTH_SKIP_BUILD=0
EOF
fi

cat >"$UNIT_PATH" <<EOF
[Unit]
Description=Bismuth web app service
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=${PROJECT_ROOT}
EnvironmentFile=-${ENV_FILE}
ExecStart=/usr/bin/env bash ${PROJECT_ROOT}/scripts/serve-nas.sh
Restart=on-failure
RestartSec=3

[Install]
WantedBy=default.target
EOF

require_node_22
RUNNER="$(resolve_runner)"
run_script "$RUNNER" build

systemctl --user daemon-reload
systemctl --user enable --now bismuth-web.service

echo "Installed bismuth-web.service (user unit)."
echo "Config file: ${ENV_FILE}"
echo "Status: systemctl --user status bismuth-web.service"
