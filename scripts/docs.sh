#!/usr/bin/env bash
set -euo pipefail
# Generate Rust API documentation
cargo doc --manifest-path src-tauri/Cargo.toml --no-deps
echo "Rust docs generated: target/doc/bismuth_lib/index.html"
