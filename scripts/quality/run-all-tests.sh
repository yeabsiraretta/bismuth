#!/usr/bin/env bash
# Combined Test Suite Runner for Bismuth
# Runs all test types and produces a summary report.
#
# Usage:
#   ./scripts/quality/run-all-tests.sh          # Unit + Architecture tests
#   ./scripts/quality/run-all-tests.sh --full   # All tests including E2E and Rust
#   ./scripts/quality/run-all-tests.sh --rust   # Include Rust tests
#   ./scripts/quality/run-all-tests.sh --e2e    # Include E2E tests

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

INCLUDE_RUST=false
INCLUDE_E2E=false
FAILED=0
RESULTS=()

for arg in "$@"; do
  case "$arg" in
    --full) INCLUDE_RUST=true; INCLUDE_E2E=true ;;
    --rust) INCLUDE_RUST=true ;;
    --e2e)  INCLUDE_E2E=true ;;
  esac
done

echo "================================================"
echo " Bismuth Combined Test Suite"
echo "================================================"
echo ""

# --- 1. Vitest Unit + Integration Tests ---
echo "[1/4] Running Vitest unit + integration tests..."
if npx vitest run --reporter=verbose 2>&1 | tee /tmp/bismuth-unit.log | tail -5; then
  UNIT_RESULT="PASS"
else
  UNIT_RESULT="FAIL"
  FAILED=$((FAILED + 1))
fi
RESULTS+=("Unit/Integration: $UNIT_RESULT")
echo ""

# --- 2. Architecture Compliance Tests ---
echo "[2/4] Running architecture compliance tests..."
if npx vitest run tests/architecture/ --reporter=verbose 2>&1 | tee /tmp/bismuth-arch.log | tail -5; then
  ARCH_RESULT="PASS"
else
  ARCH_RESULT="FAIL"
  FAILED=$((FAILED + 1))
fi
RESULTS+=("Architecture:     $ARCH_RESULT")
echo ""

# --- 3. Rust Tests (optional) ---
if [ "$INCLUDE_RUST" = true ]; then
  echo "[3/4] Running Rust cargo tests..."
  if (cd src-tauri && cargo test 2>&1) | tee /tmp/bismuth-rust.log | tail -10; then
    RUST_RESULT="PASS"
  else
    RUST_RESULT="FAIL"
    FAILED=$((FAILED + 1))
  fi
  RESULTS+=("Rust Backend:     $RUST_RESULT")
else
  RESULTS+=("Rust Backend:     SKIPPED (use --rust or --full)")
fi
echo ""

# --- 4. E2E Tests (optional) ---
if [ "$INCLUDE_E2E" = true ]; then
  echo "[4/4] Running Playwright E2E tests..."
  if npx playwright test 2>&1 | tee /tmp/bismuth-e2e.log | tail -10; then
    E2E_RESULT="PASS"
  else
    E2E_RESULT="FAIL"
    FAILED=$((FAILED + 1))
  fi
  RESULTS+=("E2E (Playwright): $E2E_RESULT")
else
  RESULTS+=("E2E (Playwright): SKIPPED (use --e2e or --full)")
fi
echo ""

# --- Summary ---
echo "================================================"
echo " Test Suite Summary"
echo "================================================"
for r in "${RESULTS[@]}"; do
  echo "  $r"
done
echo ""

if [ $FAILED -gt 0 ]; then
  echo "RESULT: $FAILED suite(s) FAILED"
  exit 1
else
  echo "RESULT: All suites PASSED"
  exit 0
fi
