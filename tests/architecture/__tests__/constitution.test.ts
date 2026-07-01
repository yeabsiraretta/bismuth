/**
 * Bismuth Architecture Constitution Compliance Checker
 *
 * Programmatically validates the rules defined in:
 *   .specify/memory/architecture_constitution.md
 *
 * Run:  npx vitest run tests/architecture/__tests__/constitution.test.ts
 * Or:   pnpm check:constitution
 */

import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const repoRoot = resolve(__dirname, '..', '..', '..');
const srcLib = join(repoRoot, 'src', 'lib');

const KNOWN_DENSE_DIRS = [
  'src/lib/features/canvas/components/workspace',
  'src/lib/components/editor/extensions',
  'src/lib/features/calendar/components/views',
  'src/lib/features/flashcards/services',
  'src/lib/stores/commands/builders',
];

// ── Helpers ──────────────────────────────────────────────────────────────────

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

function countImplFiles(dir: string): number {
  if (!existsSync(dir)) return 0;
  try {
    return readdirSync(dir).filter((f) => {
      if (f === 'index.ts' || f === 'mod.rs') return false;
      if (
        f.startsWith('__tests__') ||
        f.endsWith('.test.ts') ||
        f.endsWith('.spec.ts') ||
        f.endsWith('_tests.rs')
      )
        return false;
      return statSync(join(dir, f)).isFile();
    }).length;
  } catch {
    return 0;
  }
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('Architecture Constitution Compliance', () => {
  describe('Layer Boundaries (P0)', () => {
    it('stores must not import from @tauri-apps', () => {
      const raw = run(
        `grep -rn "from '@tauri-apps" src/lib/stores --include="*.ts" | grep -v "__tests__" | grep -v "\\.test\\." | grep -v "\\.spec\\."`
      );
      expect(lines(raw)).toEqual([]);
    });

    it('components must not call invoke() directly', () => {
      const raw = run(
        `grep -rn "invoke(" src/lib/components --include="*.svelte" --include="*.ts" | grep -v "__tests__" | grep -v ".spec." | grep -v ".test."`
      );
      expect(lines(raw)).toEqual([]);
    });

    it('utils must not import stores or services', () => {
      const stores = run(
        `grep -rn "from '@/stores" src/lib/utils --include="*.ts" | grep -v "__tests__"`
      );
      const services = run(
        `grep -rn "from '@/services" src/lib/utils --include="*.ts" | grep -v "__tests__"`
      );
      expect([...lines(stores), ...lines(services)]).toEqual([]);
    });

    it('services must not import stores', () => {
      const raw = run(
        `grep -rn "from '@/stores" src/lib/services --include="*.ts" | grep -v "__tests__"`
      );
      expect(lines(raw)).toEqual([]);
    });
  });

  describe('File Size Limits', () => {
    it('no source file exceeds 400 lines (P0 hard limit)', () => {
      const raw = run(
        `find src/lib -type f \\( -name "*.ts" -o -name "*.svelte" \\) ! -path "*/__tests__/*" ! -path "*.test.ts" ! -path "*.spec.ts" | xargs wc -l | grep -v total | awk '$1 > 400 {print $0}'`
      );
      const violations = lines(raw);
      if (violations.length > 0) {
        console.log('Files >400 lines:', violations);
      }
      expect(violations).toEqual([]);
    });

    it('no Rust source file exceeds 400 lines', () => {
      const raw = run(
        `find src-tauri/src -type f -name "*.rs" | xargs wc -l | grep -v total | awk '$1 > 400 {print $0}'`
      );
      expect(lines(raw)).toEqual([]);
    });
  });

  describe('Folder Density', () => {
    it('no frontend directory exceeds 8 implementation files', () => {
      const dirs = lines(
        run(`find src/lib -type d ! -path "*/__tests__*" ! -path "*/node_modules/*"`)
      );
      const violations: string[] = [];
      for (const dir of dirs) {
        const abs = dir.startsWith('/') ? dir : join(repoRoot, dir);
        const count = countImplFiles(abs);
        if (count > 8 && !KNOWN_DENSE_DIRS.some((k) => dir.endsWith(k))) {
          violations.push(`${dir}: ${count} files`);
        }
      }
      if (violations.length > 0) console.log('Density violations:', violations);
      expect(violations).toEqual([]);
    });

    it('no Rust directory exceeds 12 implementation files', () => {
      const dirs = lines(
        run(`find src-tauri/src -type d ! -path "*/__tests__*" ! -path "*/node_modules/*"`)
      );
      const violations: string[] = [];
      for (const dir of dirs) {
        const abs = dir.startsWith('/') ? dir : join(repoRoot, dir);
        const count = countImplFiles(abs);
        if (count > 12) violations.push(`${dir}: ${count} files`);
      }
      if (violations.length > 0) console.log('Rust density violations:', violations);
      expect(violations).toEqual([]);
    });
  });

  describe('Feature Module Rules', () => {
    it('every feature directory has an index.ts barrel', () => {
      const featuresDir = join(srcLib, 'features');
      if (!existsSync(featuresDir)) return;
      const entries = readdirSync(featuresDir, { withFileTypes: true });
      const missing: string[] = [];
      for (const entry of entries) {
        if (!entry.isDirectory() || entry.name === '__mocks__') continue;
        if (!existsSync(join(featuresDir, entry.name, 'index.ts'))) {
          missing.push(entry.name);
        }
      }
      expect(missing).toEqual([]);
    });

    it('feature barrels use relative imports, not absolute internal paths', () => {
      const featuresDir = join(srcLib, 'features');
      if (!existsSync(featuresDir)) return;
      const violations: string[] = [];
      for (const entry of readdirSync(featuresDir, { withFileTypes: true })) {
        if (!entry.isDirectory() || entry.name === '__mocks__') continue;
        const indexPath = join(featuresDir, entry.name, 'index.ts');
        if (!existsSync(indexPath)) continue;
        const content = readFileSync(indexPath, 'utf8');
        if (/(?:^|\n)\s*(?:import|export)\s.*['"]@\/features\/[^'"]+\//.test(content)) {
          violations.push(entry.name);
        }
      }
      expect(violations).toEqual([]);
    });

    it('no cross-feature internal path imports', () => {
      const raw = run(
        `grep -rn "from '@/features/[^']*/" src/lib ` +
          `--include="*.ts" --include="*.svelte" ` +
          `| grep -v "__tests__" | grep -v "\\.spec\\." | grep -v "\\.test\\."`
      );
      const violations: string[] = [];
      for (const line of lines(raw)) {
        const srcFileMatch = line.match(/^([^:]+):\d+:/);
        const importedFeatMatch = line.match(/@\/features\/([^/'"\s/]+)/);
        if (!srcFileMatch || !importedFeatMatch) continue;
        const srcFile = srcFileMatch[1];
        const importedFeat = importedFeatMatch[1];
        const srcFeatMatch = srcFile.match(/features\/([^/]+)\//);
        const srcFeat = srcFeatMatch ? srcFeatMatch[1] : null;
        if (srcFeat && srcFeat !== importedFeat) {
          violations.push(`${srcFile} → @/features/${importedFeat}/...`);
        }
      }
      if (violations.length > 0) console.log('Cross-feature violations:', violations);
      expect(violations).toEqual([]);
    });
  });

  describe('Naming Conventions', () => {
    it('Svelte components use PascalCase', () => {
      const raw = run(`find src -name "*.svelte" ! -path "*/node_modules/*"`);
      const violations = lines(raw).filter((f) => /\/[a-z][^/]*\.svelte$/.test(f));
      expect(violations).toEqual([]);
    });
  });

  describe('Styling Architecture', () => {
    it('no raw console.log/error/debug in source (use logger)', () => {
      const raw = run(
        `grep -rn "console\\." src/lib --include="*.ts" --include="*.svelte" ` +
          `| grep -v "__tests__" | grep -v "\\.spec\\." | grep -v "\\.test\\." ` +
          `| grep -v "utils/logger/" | grep -v "console\\.warn" ` +
          `| grep -E "console\\.(log|info|error|debug)"`
      );
      const violations = lines(raw);
      if (violations.length > 0) console.log('Raw console usage:', violations.slice(0, 5));
      expect(violations).toEqual([]);
    });
  });
});
