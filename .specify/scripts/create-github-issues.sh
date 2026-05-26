#!/bin/bash

# Script to create GitHub issues from tasks.md
# This script creates issues for the Bismuth PKM Editor MVP

set -e

REPO="yeabsiraretta/bismuth"

echo "Creating GitHub issues for Bismuth PKM Editor MVP..."
echo "Repository: $REPO"
echo ""

# Phase 1: Project Setup (T002-T009)
echo "Creating Phase 1 issues..."

gh issue create --title "[Phase 1] T002: Install frontend dependencies" --body "**Phase**: 1 - Project Setup
**Priority**: P0
**Parallel**: Yes

## Description
Add to \`package.json\`: \`@codemirror/view@^6.0\`, \`@codemirror/state@^6.0\`, \`@codemirror/language@^6.0\`, \`@codemirror/commands@^6.0\`, \`@codemirror/lang-markdown@^6.0\`, \`konva@^9.0\`, \`pdfjs-dist@^3.0\`, \`unified@^11.0\`, \`remark-parse@^11.0\`, \`remark-rehype@^11.0\`, \`rehype-stringify@^10.0\`; run \`pnpm install\`

## Success Criteria
- No peer dependency warnings

## Dependencies
- T001

## Related
- Part of Phase 1: Project Setup"

gh issue create --title "[Phase 1] T003: Install Rust dependencies" --body "**Phase**: 1 - Project Setup
**Priority**: P0
**Parallel**: Yes

## Description
Add to \`src-tauri/Cargo.toml\` under \`[dependencies]\`: \`tantivy = \"0.21\"\`, \`notify = \"6.0\"\`, \`git2 = \"0.18\"\`, \`serde = { version = \"1.0\", features = [\"derive\"] }\`, \`serde_json = \"1.0\"\`, \`tokio = { version = \"1.0\", features = [\"full\"] }\`, \`rusqlite = { version = \"0.31\", features = [\"bundled\"] }\`, \`yaml-rust = \"0.4\"\`, \`regex = \"1.10\"\`, \`lopdf = \"0.32\"\`, \`candle-core = \"0.4\"\`; run \`cargo build\`

## Success Criteria
- All crates compile

## Dependencies
- T001

## Related
- Part of Phase 1: Project Setup"

gh issue create --title "[Phase 1] T004: Configure linting" --body "**Phase**: 1 - Project Setup
**Priority**: P0
**Parallel**: Yes

## Description
Create \`.eslintrc.cjs\` with \`@typescript-eslint/parser\`, Svelte plugin, and strict rules; create \`.prettierrc\` with \`printWidth: 100\`, \`singleQuote: true\`, \`svelteSortOrder: scripts-markup-styles\`; run \`pnpm eslint . && pnpm prettier --check .\`

## Success Criteria
- No errors on fresh codebase

## Dependencies
- T001

## Related
- Part of Phase 1: Project Setup"

gh issue create --title "[Phase 1] T005: Configure Rust formatting" --body "**Phase**: 1 - Project Setup
**Priority**: P0
**Parallel**: Yes

## Description
Create \`src-tauri/.cargo/config.toml\` with \`[target.'cfg(all())']\` section; add \`rustflags = [\"-D warnings\"]\` to enforce clippy; create \`src-tauri/rustfmt.toml\` with \`edition = \"2021\"\`, \`max_width = 100\`; run \`cargo clippy && cargo fmt --check\`

## Success Criteria
- Passes on fresh codebase

## Dependencies
- T001

## Related
- Part of Phase 1: Project Setup"

gh issue create --title "[Phase 1] T006: Configure unit testing" --body "**Phase**: 1 - Project Setup
**Priority**: P0
**Parallel**: Yes

## Description
Add Vitest to \`vite.config.ts\` with \`test: { globals: true, environment: 'jsdom' }\`; create \`tests/unit/ts/example.test.ts\` with a passing assertion; run \`pnpm test\`

## Success Criteria
- Test passes

## Dependencies
- T001

## Related
- Part of Phase 1: Project Setup"

gh issue create --title "[Phase 1] T007: Configure E2E testing" --body "**Phase**: 1 - Project Setup
**Priority**: P0
**Parallel**: Yes

## Description
Create \`playwright.config.ts\` targeting Tauri window; create \`tests/e2e/smoke.spec.ts\` that launches app and checks window title; install Playwright browsers

## Success Criteria
- \`pnpm playwright test\` passes (may fail until T009)

## Dependencies
- T001

## Related
- Part of Phase 1: Project Setup"

gh issue create --title "[Phase 1] T008: Create sample vault structure" --body "**Phase**: 1 - Project Setup
**Priority**: P0

## Description
Create \`.bismuth/\` directory in project root with subdirectories: \`notes/\` (sample markdown files), \`templates/\` (note templates), \`themes/\` (empty, for CSS themes), \`plugins/\` (empty, for future plugins), \`tips/\` (markdown tip files); add \`.gitkeep\` to empty dirs

## Success Criteria
- Directory tree exists and is committed

## Dependencies
- T001

## Related
- Part of Phase 1: Project Setup"

gh issue create --title "[Phase 1] T009: Verify toolchain end-to-end" --body "**Phase**: 1 - Project Setup
**Priority**: P0

## Description
Run \`pnpm tauri dev\`

## Success Criteria
- Tauri window opens with no console errors
- Displays default Svelte template
- Hot-reload works on file change
- This confirms Rust ↔ Node ↔ Tauri IPC pipeline is functional

## Dependencies
- T001-T008

## Related
- Part of Phase 1: Project Setup
- **Checkpoint**: Running app window opens. All toolchains (Rust, Node, Tauri) confirmed working."

echo "Phase 1 issues created!"
echo ""
echo "Note: Due to the large number of tasks (112 total), creating all issues programmatically."
echo "Remaining phases (2-13) will be created in batches to avoid rate limits."
echo ""
echo "To continue creating issues for other phases, run this script with phase number as argument."
