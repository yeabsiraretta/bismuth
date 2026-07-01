import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../../..');
const CODE_MAP_PATH = resolve(ROOT, 'docs/CODE_MAP.md');

describe('CODE_MAP.md', () => {
  it('exists', () => {
    expect(existsSync(CODE_MAP_PATH)).toBe(true);
  });

  it('references existing directories', () => {
    const content = readFileSync(CODE_MAP_PATH, 'utf-8');

    // Extract directory paths from the code map (src/lib/... patterns)
    const dirPatterns = content.match(/`(src\/lib\/[a-z/_-]+\/?)(?:\*)?`/g) ?? [];
    const dirs = dirPatterns
      .map((p) => p.replace(/`/g, '').replace(/\*$/, ''))
      .filter((p) => !p.includes('.'));

    const missing: string[] = [];
    for (const dir of dirs) {
      const fullPath = resolve(ROOT, dir);
      if (!existsSync(fullPath)) {
        missing.push(dir);
      }
    }

    expect(missing).toEqual([]);
  });

  it('references existing files', () => {
    const content = readFileSync(CODE_MAP_PATH, 'utf-8');

    // Extract file paths (patterns with extensions)
    const filePatterns = content.match(/`(src\/lib\/[a-z/_.-]+\.[a-z]+)`/g) ?? [];
    const files = filePatterns.map((p) => p.replace(/`/g, ''));

    const missing: string[] = [];
    for (const file of files) {
      const fullPath = resolve(ROOT, file);
      if (!existsSync(fullPath)) {
        missing.push(file);
      }
    }

    expect(missing).toEqual([]);
  });

  it('mentions key infrastructure directories', () => {
    const content = readFileSync(CODE_MAP_PATH, 'utf-8');
    const required = ['config', 'types', 'utils', 'services', 'stores', 'components', 'features'];

    for (const dir of required) {
      expect(content).toContain(dir);
    }
  });
});
