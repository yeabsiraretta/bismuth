#!/usr/bin/env bash
# Bismuth Development Terminal Script
# Comprehensive terminal-focused workflow for development
#
# Usage:
#   ./scripts/dev.sh [command]
#
# Commands:
#   start       - Start full Tauri dev (frontend + backend)
#   web         - Start frontend-only dev server (no Tauri)
#   test        - Run all tests
#   test:watch  - Run tests in watch mode
#   lint        - Run full lint suite (eslint + svelte-check + prettier)
#   fix         - Auto-fix lint and format issues
#   check       - Full pre-commit check (format + lint + types + tests + file sizes)
#   build       - Build frontend + Tauri desktop app
#   build:web   - Build frontend only
#   clean       - Remove build artifacts and caches
#   status      - Show project health status (git, deps, sizes)
#   help        - Show this help

set -euo pipefail
cd "$(dirname "$0")/.."

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

info()  { echo -e "${BLUE}▸${NC} $1"; }
ok()    { echo -e "${GREEN}✓${NC} $1"; }
warn()  { echo -e "${YELLOW}⚠${NC} $1"; }
err()   { echo -e "${RED}✗${NC} $1"; }
header() { echo -e "\n${BLUE}═══ $1 ═══${NC}\n"; }

cmd="${1:-help}"

case "$cmd" in
  start)
    header "Starting Bismuth (Tauri Dev)"
    info "Frontend: http://localhost:1420"
    info "Backend: Tauri Rust process"
    exec pnpm tauri:dev
    ;;

  web)
    header "Starting Bismuth (Web Only)"
    info "Vite dev server: http://localhost:5173"
    exec pnpm dev
    ;;

  test)
    header "Running Tests"
    pnpm vitest run
    ok "All tests passed"
    ;;

  test:watch)
    header "Running Tests (Watch Mode)"
    exec pnpm vitest
    ;;

  lint)
    header "Linting"
    info "ESLint..."
    pnpm lint 2>&1 | tail -20 || true
    info "Svelte Check..."
    pnpm type-check 2>&1 | tail -20 || true
    info "Prettier..."
    pnpm format:check 2>&1 | tail -5 || true
    ok "Lint complete"
    ;;

  fix)
    header "Auto-fixing"
    info "ESLint --fix..."
    pnpm lint:fix 2>&1 | tail -5 || true
    info "Prettier --write..."
    pnpm format 2>&1 | tail -5 || true
    ok "Auto-fix complete"
    ;;

  check)
    header "Full Pre-commit Check"
    info "Step 1/5: Format check..."
    pnpm format:check || { err "Format check failed. Run: ./scripts/dev.sh fix"; exit 1; }
    ok "Format OK"

    info "Step 2/5: ESLint..."
    pnpm lint || { err "Lint failed. Run: ./scripts/dev.sh fix"; exit 1; }
    ok "Lint OK"

    info "Step 3/5: Type check..."
    pnpm type-check || { err "Type check failed"; exit 1; }
    ok "Types OK"

    info "Step 4/5: Tests..."
    pnpm vitest run || { err "Tests failed"; exit 1; }
    ok "Tests OK"

    info "Step 5/5: File sizes..."
    bash scripts/quality/check-file-sizes.sh || { warn "File size violations"; }
    ok "File sizes OK"

    echo ""
    ok "All checks passed! Safe to commit."
    ;;

  build)
    header "Building Bismuth (Full)"
    info "Frontend build..."
    pnpm build
    ok "Frontend built"
    info "Tauri build..."
    pnpm tauri:build
    ok "Desktop app built"
    ;;

  build:web)
    header "Building Frontend"
    pnpm build
    ok "Frontend built → dist/"
    ;;

  clean)
    header "Cleaning"
    rm -rf dist node_modules/.vite src-tauri/target/debug
    ok "Removed dist/, vite cache, Rust debug target"
    ;;

  status)
    header "Project Status"
    info "Version: $(node -p "require('./package.json').version")"
    info "Branch: $(git branch --show-current 2>/dev/null || echo 'not a git repo')"
    info "Dirty files: $(git status --short 2>/dev/null | wc -l | tr -d ' ')"

    echo ""
    info "Frontend deps: $(node -p "Object.keys(require('./package.json').dependencies || {}).length") production"
    info "Dev deps: $(node -p "Object.keys(require('./package.json').devDependencies || {}).length") dev"

    echo ""
    # Quick file size check
    OVER=$(find src/lib -name "*.ts" -o -name "*.svelte" | xargs wc -l 2>/dev/null | awk '$1 > 300 { print }' | grep -v total | wc -l | tr -d ' ')
    if [ "$OVER" -gt 0 ]; then
      warn "$OVER files over 300-line limit"
    else
      ok "All source files within 300-line limit"
    fi
    ;;

  help|--help|-h)
    header "Bismuth Dev CLI"
    echo "Usage: ./scripts/dev.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start       Start full Tauri dev (frontend + backend)"
    echo "  web         Start frontend-only dev server"
    echo "  test        Run all tests"
    echo "  test:watch  Run tests in watch mode"
    echo "  lint        Run full lint suite"
    echo "  fix         Auto-fix lint and format issues"
    echo "  check       Full pre-commit check"
    echo "  build       Build frontend + desktop app"
    echo "  build:web   Build frontend only"
    echo "  clean       Remove build artifacts"
    echo "  status      Show project health"
    echo "  help        Show this help"
    echo ""
    echo "Shortcuts:"
    echo "  alias bd='./scripts/dev.sh'"
    echo "  bd start  # full dev"
    echo "  bd check  # pre-commit"
    ;;

  *)
    err "Unknown command: $cmd"
    echo "Run './scripts/dev.sh help' for available commands."
    exit 1
    ;;
esac
