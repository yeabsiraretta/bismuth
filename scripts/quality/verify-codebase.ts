#!/usr/bin/env tsx
/**
 * Bismuth Codebase Verifier (TypeScript / tsx edition)
 * Runs the same six rule checks as verify-codebase.sh with richer output.
 *
 * Run: tsx scripts/quality/verify-codebase.ts
 * Or:  pnpm verify:codebase
 */

import { execSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDir, '..', '..');

// ── helpers ──────────────────────────────────────────────────────────────────

function run(cmd: string): string {
  try {
    return execSync(cmd, { cwd: repoRoot, encoding: 'utf8' });
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'stdout' in err) {
      return (err as { stdout: string }).stdout ?? '';
    }
    return '';
  }
}

function lines(output: string): string[] {
  return output
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

interface CheckResult {
  name: string;
  violations: string[];
}

function printResult(result: CheckResult): boolean {
  if (result.violations.length === 0) {
    console.log(`[PASS] ${result.name}: 0 violations`);
    return true;
  }
  const count = result.violations.length;
  console.log(`[FAIL] ${result.name}: ${count} violation${count === 1 ? '' : 's'}`);
  for (const v of result.violations) {
    console.log(`  - ${v}`);
  }
  return false;
}

// ── Check 1: Component naming ─────────────────────────────────────────────
function checkComponentNaming(): CheckResult {
  const raw = run(`find src -name "*.svelte" ! -path "*/node_modules/*" ! -path "*/dist/*"`);
  const violations = lines(raw).filter((f) => /\/[a-z][^/]*\.svelte$/.test(f));
  return { name: 'Component naming (PascalCase .svelte)', violations };
}

// ── Check 2: Barrel rule ──────────────────────────────────────────────────
function checkBarrelRule(): CheckResult {
  const featuresDir = join(repoRoot, 'src', 'lib', 'features');
  if (!existsSync(featuresDir)) {
    return { name: 'Barrel rule (index.ts per feature)', violations: [] };
  }
  const entries = readdirSync(featuresDir, { withFileTypes: true });
  const violations: string[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const indexPath = join(featuresDir, entry.name, 'index.ts');
    if (!existsSync(indexPath)) {
      violations.push(`src/lib/features/${entry.name}/index.ts (missing)`);
    }
  }
  return { name: 'Barrel rule (index.ts per feature)', violations };
}

// ── Check 3: File size ────────────────────────────────────────────────────
const SIZE_LIMIT = 300;
const SIZE_TOLERANCE = 350;

function checkFileSizes(): CheckResult {
  const raw = run(
    `find src -type f \\( -name "*.ts" -o -name "*.svelte" \\) ` +
      `! -path "*/node_modules/*" ! -path "*/dist/*" ! -path "*/.svelte-kit/*"`
  );
  const violations: string[] = [];
  for (const filePath of lines(raw)) {
    const abs = join(repoRoot, filePath);
    const countRaw = run(`wc -l < "${abs}"`).trim();
    const count = parseInt(countRaw, 10);
    if (!Number.isNaN(count) && count > SIZE_TOLERANCE) {
      violations.push(
        `${filePath}: ${count} lines (limit ${SIZE_LIMIT}, tolerance ${SIZE_TOLERANCE})`
      );
    }
  }
  return { name: `File size (>${SIZE_TOLERANCE}-line violations)`, violations };
}

// ── Check 4: Logger rule ──────────────────────────────────────────────────
// Exception: the unified logger implementation (utils/logger/) may use console.log.
function checkLoggerRule(): CheckResult {
  const raw = run(
    `grep -rn "console\\.log" src/lib ` +
      `--include="*.ts" --include="*.svelte" ` +
      `| grep -v "__tests__" | grep -v "\\.spec\\." | grep -v "\\.test\\." ` +
      `| grep -v "utils/logger/"`
  );
  const violations = lines(raw);
  return { name: 'Logger rule (no console.log in source)', violations };
}

// ── Check 5: No Tauri imports in components ───────────────────────────────
function checkTauriInComponents(): CheckResult {
  const raw = run(`grep -rn "from '@tauri-apps" src/lib/components ` + `--include="*.svelte"`);
  const violations = lines(raw);
  return { name: 'No direct @tauri-apps imports in components/', violations };
}

// ── Check 6: Cross-feature internal import violations ─────────────────────
// A file inside feature X must not import internal sub-paths from feature Y.
// Intra-feature deep imports (X importing from its own internals) are allowed.
function checkCrossFeatureImports(): CheckResult {
  const raw = run(
    `grep -rn "from '@/features/[^']*/" src/lib ` +
      `--include="*.ts" --include="*.svelte" ` +
      `| grep -v "__tests__" | grep -v "\\.spec\\." | grep -v "\\.test\\."`
  );
  const violations: string[] = [];
  for (const line of lines(raw)) {
    // Extract source file (everything before :line_number:)
    const srcFileMatch = line.match(/^([^:]+):\d+:/);
    const importedFeatMatch = line.match(/@\/features\/([^/'"\s/]+)/);
    if (!srcFileMatch || !importedFeatMatch) continue;

    const srcFile = srcFileMatch[1];
    const importedFeat = importedFeatMatch[1];

    // Determine the feature the source file belongs to
    const srcFeatMatch = srcFile.match(/features\/([^/]+)\//);
    const srcFeat = srcFeatMatch ? srcFeatMatch[1] : null;

    // Only flag if source is in a *different* feature than the imported path
    if (srcFeat && srcFeat !== importedFeat) {
      violations.push(line);
    }
  }
  return { name: 'Cross-feature import violations', violations };
}

// ── Main ──────────────────────────────────────────────────────────────────

console.log('=== Bismuth Codebase Verifier ===');
console.log(`Repository: ${relative(process.cwd(), repoRoot) || '.'}`);
console.log('');

const checks: CheckResult[] = [
  checkComponentNaming(),
  checkBarrelRule(),
  checkFileSizes(),
  checkLoggerRule(),
  checkTauriInComponents(),
  checkCrossFeatureImports(),
];

let allPassed = true;
for (const check of checks) {
  const passed = printResult(check);
  if (!passed) allPassed = false;
}

console.log('');
if (allPassed) {
  console.log('EXIT: 0 (all checks passed)');
  process.exit(0);
} else {
  console.log('EXIT: 1 (violations found — fix before merging)');
  process.exit(1);
}
