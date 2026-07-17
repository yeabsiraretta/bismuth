#!/usr/bin/env bash

set -euo pipefail

OS_NAME="$(uname -s)"
if [[ "$OS_NAME" != "Linux" ]]; then
  echo "[tauri:dev] Non-Linux host detected (${OS_NAME}); using direct tauri dev startup." >&2
  exec tauri dev "$@"
fi

configure_software_rendering() {
  export LIBGL_ALWAYS_SOFTWARE="${LIBGL_ALWAYS_SOFTWARE:-1}"
  export MESA_LOADER_DRIVER_OVERRIDE="${MESA_LOADER_DRIVER_OVERRIDE:-llvmpipe}"
  export WEBKIT_DISABLE_DMABUF_RENDERER="${WEBKIT_DISABLE_DMABUF_RENDERER:-1}"
  export WEBKIT_DISABLE_COMPOSITING_MODE="${WEBKIT_DISABLE_COMPOSITING_MODE:-1}"
  export GDK_DEBUG="${GDK_DEBUG:-gl-disable}"
}

has_usable_display() {
  if [[ -n "${WAYLAND_DISPLAY:-}" && -n "${XDG_RUNTIME_DIR:-}" ]]; then
    if [[ -S "${XDG_RUNTIME_DIR}/${WAYLAND_DISPLAY}" ]]; then
      return 0
    fi
  fi

  if [[ -n "${DISPLAY:-}" ]]; then
    if command -v xdpyinfo >/dev/null 2>&1; then
      if xdpyinfo >/dev/null 2>&1; then
        return 0
      fi
    fi

    local display_num="${DISPLAY#localhost:}"
    display_num="${display_num#:}"
    display_num="${display_num%%.*}"
    if [[ "$display_num" =~ ^[0-9]+$ && -S "/tmp/.X11-unix/X${display_num}" ]]; then
      return 0
    fi

    # SSH-forwarded/nonstandard display formats may still be valid.
    if [[ ! "$display_num" =~ ^[0-9]+$ ]]; then
      return 0
    fi
  fi

  return 1
}

dev_server_pid() {
  if ! command -v ss >/dev/null 2>&1; then
    return 1
  fi

  ss -ltnp 2>/dev/null \
  | grep -E '127\.0\.0\.1:5173|0\.0\.0\.0:5173|\[::\]:5173' \
  | sed -n 's/.*pid=\([0-9]\+\).*/\1/p' \
  | head -n 1
}

if pid="$(dev_server_pid)" && [[ -n "$pid" ]]; then
  echo "[tauri:dev] Frontend dev server port 5173 is already in use (pid: $pid)." >&2
  echo "[tauri:dev] Stop the existing dev stack before starting a new one: kill $pid" >&2
  exit 1
fi

if has_usable_display; then
  configure_software_rendering
  exec tauri dev "$@"
fi

if command -v xvfb-run >/dev/null 2>&1; then
  if [[ -n "${DISPLAY:-}" || -n "${WAYLAND_DISPLAY:-}" ]]; then
    echo "[tauri:dev] DISPLAY/WAYLAND_DISPLAY is set but not usable; falling back to xvfb-run." >&2
  else
    echo "[tauri:dev] No DISPLAY/WAYLAND_DISPLAY detected; starting via xvfb-run." >&2
  fi
  configure_software_rendering
  export GDK_BACKEND="${GDK_BACKEND:-x11}"
  exec xvfb-run -a tauri dev "$@"
fi

echo "[tauri:dev] Headless environment detected and xvfb-run is unavailable." >&2
echo "[tauri:dev] Install Xvfb (e.g. apt install xvfb) or run with a graphical display." >&2
exit 1
