import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'fs';
import { join, extname, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { iconPaths } from '@/assets/icons';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../../..');
const SRC = resolve(ROOT, 'src/lib');


function findSvelteFiles(dir: string): string[] {
  const results: string[] = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (['node_modules', '.svelte-kit', 'dist', 'target'].includes(entry.name)) continue;
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...findSvelteFiles(fullPath));
      } else if (entry.isFile() && extname(entry.name) === '.svelte') {
        results.push(fullPath);
      }
    }
  } catch { /* skip */ }
  return results;
}

function extractIconNames(line: string): string[] {
  const names: string[] = [];
  let match;

  // Match name="literal-icon-name" (must contain a hyphen to be an icon name,
  // or be a known single-word icon). Skip variables like name={icon}
  const pattern = /name=["']([a-z][a-z0-9-]*-[a-z0-9-]+|search|square|circle|type|image|grid|star|box|copy|save|trash|file|edit|home|lock|mail|menu|plus|x|map|tag|list|info|bold|code|link|move|wifi|zap|loader|eye|sun|moon|settings|activity|calendar|monitor|terminal|download|upload|play|layers)["']/g;
  while ((match = pattern.exec(line)) !== null) {
    names.push(match[1]);
  }

  return names;
}

describe('Icon Registry: All referenced icons must exist', () => {
  const svelteFiles = findSvelteFiles(SRC);

  it('finds Svelte files to scan', () => {
    expect(svelteFiles.length).toBeGreaterThan(20);
  });

  it('all <Icon name="..."> references exist in iconPaths', () => {
    const missing: Array<{ file: string; icon: string }> = [];

    for (const file of svelteFiles) {
      const content = readFileSync(file, 'utf-8');
      // Only scan lines that contain '<Icon' to avoid false positives from slots
      const lines = content.split('\n');
      for (const line of lines) {
        if (!line.includes('<Icon') && !line.includes('Icon name=')) continue;
        const icons = extractIconNames(line);
        for (const icon of icons) {
          if (!iconPaths[icon]) {
            missing.push({ file: relative(ROOT, file), icon });
          }
        }
      }
    }

    if (missing.length > 0) {
      const msg = missing.map((m) => `  ${m.file}: "${m.icon}"`).join('\n');
      expect.fail(`Missing icon paths:\n${msg}`);
    }
  });

  it('iconPaths registry has at least 50 entries', () => {
    expect(Object.keys(iconPaths).length).toBeGreaterThanOrEqual(50);
  });
});
