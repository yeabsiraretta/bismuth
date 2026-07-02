import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'fs';
import { join, extname, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../../..');
const SRC = resolve(ROOT, 'src/lib');

const EXCLUDE_DIRS = ['node_modules', '.svelte-kit', 'dist', '__tests__', '__mocks__', 'target'];

function walkDir(dir: string, extensions: string[]): string[] {
  const results: string[] = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (EXCLUDE_DIRS.includes(entry.name)) continue;
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...walkDir(fullPath, extensions));
      } else if (entry.isFile() && extensions.includes(extname(entry.name))) {
        results.push(fullPath);
      }
    }
  } catch {
    /* skip */
  }
  return results;
}

function extractImports(content: string): string[] {
  const imports: string[] = [];
  const pattern = /from\s+['"](@\/[^'"]+)['"]/g;
  let match;
  while ((match = pattern.exec(content)) !== null) {
    imports.push(match[1]);
  }
  return imports;
}

function getLayer(importPath: string): string | null {
  if (importPath.startsWith('@/stores/')) return 'stores';
  if (importPath.startsWith('@/services/')) return 'services';
  if (importPath.startsWith('@/components/')) return 'components';
  if (importPath.startsWith('@/utils/')) return 'utils';
  if (importPath.startsWith('@/types/')) return 'types';
  if (importPath.startsWith('@/config/')) return 'config';
  if (importPath.startsWith('@/constants/')) return 'config';
  if (importPath.startsWith('@/assets/')) return 'assets';
  if (importPath.startsWith('@/features/')) return 'features';
  return null;
}

// Layer dependency rules: key MUST NOT import from values
const FORBIDDEN_IMPORTS: Record<string, string[]> = {
  utils: ['stores', 'services', 'components'],
  stores: ['components'],
  services: ['components'],
  types: ['stores', 'services', 'components', 'utils'],
  config: ['stores', 'services', 'components'],
};

// Known pre-existing violations (tracked for remediation, do not add new ones)
const KNOWN_VIOLATIONS: Record<string, string[]> = {
  services: ['src/lib/services/design-docs/reflectors/componentReflector.ts'],
  types: [],
};

describe('Constitution VI: Layer Separation', () => {
  it('utils/ files do not import from stores, services, or components', () => {
    const violations = checkLayer('utils');
    expect(violations).toEqual([]);
  });

  it('stores/ files do not import from components', () => {
    const violations = checkLayer('stores');
    expect(violations).toEqual([]);
  });

  it('no NEW services/ files import from components', () => {
    const violations = checkLayer('services');
    expect(violations).toEqual([]);
  });

  it('no NEW types/ files import runtime layers', () => {
    const violations = checkLayer('types');
    expect(violations).toEqual([]);
  });

  it('config/ files do not import from stores, services, or components', () => {
    const violations = checkLayer('config');
    expect(violations).toEqual([]);
  });
});

function checkLayer(layer: string): string[] {
  const dir = resolve(SRC, layer);
  const files = walkDir(dir, ['.ts']);
  const forbidden = FORBIDDEN_IMPORTS[layer] || [];
  const known = KNOWN_VIOLATIONS[layer] || [];
  const violations: string[] = [];

  for (const file of files) {
    const rel = relative(ROOT, file);
    if (known.includes(rel)) continue;
    const content = readFileSync(file, 'utf-8');
    const imports = extractImports(content);
    for (const imp of imports) {
      const targetLayer = getLayer(imp);
      if (targetLayer && forbidden.includes(targetLayer)) {
        violations.push(`${rel}: imports "${imp}" (${layer} -> ${targetLayer})`);
      }
    }
  }

  return violations;
}

// --- Feature Module Architecture Tests ---

function getFeatureModules(): string[] {
  const featuresDir = resolve(SRC, 'features');
  try {
    const entries = readdirSync(featuresDir, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    return [];
  }
}

function isBarrelImport(importPath: string, featureName: string): boolean {
  return (
    importPath === `@/features/${featureName}` || importPath === `@/features/${featureName}/index`
  );
}

describe('Feature Module Rules', () => {
  it('cross-feature imports use barrel only (not internal paths)', () => {
    const modules = getFeatureModules();
    if (modules.length === 0) return; // no features yet
    const violations: string[] = [];

    for (const mod of modules) {
      const modDir = resolve(SRC, 'features', mod);
      const files = walkDir(modDir, ['.ts', '.svelte']);

      for (const file of files) {
        const content = readFileSync(file, 'utf-8');
        const imports = extractImports(content);

        for (const imp of imports) {
          if (!imp.startsWith('@/features/')) continue;
          // Importing from own module internals is fine
          if (imp.startsWith(`@/features/${mod}/`) || imp === `@/features/${mod}`) continue;
          // Importing another feature — must be barrel only
          const otherFeature = imp.replace('@/features/', '').split('/')[0];
          if (!isBarrelImport(imp, otherFeature)) {
            violations.push(
              `${relative(ROOT, file)}: imports "${imp}" (must use @/features/${otherFeature} barrel)`
            );
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('feature stores/ do not import from feature components/', () => {
    const modules = getFeatureModules();
    if (modules.length === 0) return;
    const violations: string[] = [];

    for (const mod of modules) {
      const storesDir = resolve(SRC, 'features', mod, 'stores');
      const files = walkDir(storesDir, ['.ts']);

      for (const file of files) {
        const content = readFileSync(file, 'utf-8');
        const imports = extractImports(content);

        for (const imp of imports) {
          if (imp.startsWith(`@/features/${mod}/components`) || imp.startsWith('@/components/')) {
            violations.push(`${relative(ROOT, file)}: store imports component "${imp}"`);
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
