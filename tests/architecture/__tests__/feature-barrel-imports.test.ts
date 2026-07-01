import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname, relative } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../../..');

function extractImports(content: string): string[] {
  const imports: string[] = [];
  const pattern = /from\s+['"](@\/[^'"]+)['"]/g;
  let match;
  while ((match = pattern.exec(content)) !== null) {
    imports.push(match[1]);
  }
  return imports;
}

function isInternalFeaturePath(imp: string): boolean {
  // @/features/<name>/stores/*, @/features/<name>/services/*, etc.
  const match = imp.match(/^@\/features\/([^/]+)\/(?:stores|services|components|types)\/.+/);
  return match !== null;
}

function getFeatureName(imp: string): string | null {
  const match = imp.match(/^@\/features\/([^/]+)/);
  return match ? match[1] : null;
}

function isBarrel(imp: string, featureName: string): boolean {
  return imp === `@/features/${featureName}` || imp === `@/features/${featureName}/index`;
}

/**
 * PICT model: feature barrel import compliance
 * Parameters:
 *   importer: cross-feature | same-feature | core
 *   path:     barrel | internal-store | internal-component
 * Constraint: violation only when importer=cross-feature AND path=internal-*
 *
 * Pairwise test cases:
 *   1. cross-feature + barrel         → PASS
 *   2. cross-feature + internal-store → FAIL
 *   3. same-feature  + internal-store → PASS
 *   4. core          + barrel         → PASS
 */

describe('T-04: Feature Barrel Import Rule (PICT)', () => {
  it('cross-feature barrel import is allowed', () => {
    const imp = '@/features/canvas';
    const importer = 'settings'; // different feature
    const featureName = getFeatureName(imp);
    expect(featureName).not.toBeNull();
    expect(isBarrel(imp, featureName!)).toBe(true);
    expect(isInternalFeaturePath(imp)).toBe(false);
  });

  it('cross-feature internal-store import is a violation', () => {
    const imp = '@/features/canvas/stores/canvasStore';
    expect(isInternalFeaturePath(imp)).toBe(true);
    const featureName = getFeatureName(imp);
    expect(featureName).toBe('canvas');
    expect(isBarrel(imp, 'canvas')).toBe(false);
  });

  it('same-feature internal import is allowed', () => {
    const imp = '@/features/canvas/stores/canvasStore';
    const consumerFeature = 'canvas'; // same feature
    const targetFeature = getFeatureName(imp);
    // Rule: if consumer and target are the same feature, no violation
    expect(targetFeature).toBe(consumerFeature);
  });

  it('core layer barrel import is allowed', () => {
    const imp = '@/features/settings';
    // core layer (e.g., @/stores/layout) consuming a feature barrel
    expect(isInternalFeaturePath(imp)).toBe(false);
    expect(isBarrel(imp, 'settings')).toBe(true);
  });

  it('no cross-feature internal imports exist in non-feature source files', () => {
    const SRC = resolve(ROOT, 'src/lib');
    const nonFeatureDirs = ['stores', 'services', 'components', 'utils', 'types', 'config'];
    const violations: string[] = [];

    for (const dir of nonFeatureDirs) {
      const dirPath = resolve(SRC, dir);
      if (!existsSync(dirPath)) continue;
      scanDir(dirPath, violations, ROOT, null);
    }

    expect(violations, `Cross-feature internal imports found:\n${violations.join('\n')}`).toEqual([]);
  });
});

function scanDir(dir: string, violations: string[], root: string, selfFeature: string | null): void {
  let entries: ReturnType<typeof readdirSync>;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch { return; }

  for (const entry of entries) {
    if (['node_modules', '__tests__', '__mocks__'].includes((entry as any).name)) continue;
    const fullPath = resolve(dir, (entry as any).name);
    if ((entry as any).isDirectory()) {
      scanDir(fullPath, violations, root, selfFeature);
    } else if ((entry as any).isFile() && /\.(ts|svelte)$/.test((entry as any).name)) {
      const content = readFileSync(fullPath, 'utf-8');
      const imports = extractImports(content);
      for (const imp of imports) {
        if (!isInternalFeaturePath(imp)) continue;
        const targetFeature = getFeatureName(imp);
        if (targetFeature === selfFeature) continue; // same-feature OK
        violations.push(`${relative(root, fullPath)}: imports "${imp}" (use barrel: @/features/${targetFeature})`);
      }
    }
  }
}
