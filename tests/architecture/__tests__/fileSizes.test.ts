import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'fs';
import { join, relative, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../../..');
const SRC = resolve(ROOT, 'src/lib');

const MAX_LINES = 300;
const MAX_LINES_TOLERANCE = 350;
const MAX_FILES_PER_DIR = 8;

// Known pre-existing violations (tracked for remediation, do not add new ones)
const KNOWN_OVERSIZE_FILES = [
  'src/App.svelte',
  'src/lib/features/canvas/components/library/CanvasLibrary.svelte',
  'src/lib/features/canvas/components/workspace/CanvasWorkspaceInteractive.svelte',
  'src/lib/components/sidebar/tabs/VerticalTabBar.svelte',
  'src/lib/components/vault/FileTreeNode.svelte',
  'src/lib/features/canvas/services/mcpDesignServer/mcpDesignServer.ts',
  'src/lib/features/canvas/services/documentGenerator/componentExtractor.ts',
  'src/lib/features/canvas/services/documentGenerator/documentGenerator.ts',
  'src/lib/features/canvas/services/documentGenerator/tokenExtractor.ts',
  'src/lib/stores/commands/commands.ts',
  'src/lib/components/note/NoteEditor.svelte',
  'src/lib/features/calendar/components/views/CalendarView.svelte',
  'src/lib/features/citations/components/CitationPanel.svelte',
  'src/lib/features/llm/components/AgentPanel.svelte',
  'src/lib/stores/commands/builders/featuresMedia.ts',
  'src/lib/stores/commands/builders/featuresIntegration.ts',
  'src/lib/stores/commands/builders/featuresExtended.ts',
  'src/lib/stores/commands/builders/editor.ts',
];

const KNOWN_DENSE_DIRS: string[] = [
  'src/lib/features/canvas/components/workspace',
  'src/lib/components/editor/extensions',
  'src/lib/features/calendar/components/views',
  'src/lib/features/flashcards/services',
  'src/lib/stores/commands/builders',
];

const CODE_EXTENSIONS = ['.ts', '.svelte'];
const EXCLUDE_DIRS = ['node_modules', '.svelte-kit', 'dist', '__tests__', '__mocks__', 'target'];
const EXCLUDE_PATTERNS = ['.d.ts', '.config.', '.test.', '.spec.'];

function walkDir(dir: string): string[] {
  const results: string[] = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (EXCLUDE_DIRS.includes(entry.name)) continue;
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...walkDir(fullPath));
      } else if (entry.isFile()) {
        const ext = extname(entry.name);
        if (CODE_EXTENSIONS.includes(ext)) {
          const skip = EXCLUDE_PATTERNS.some((p) => entry.name.includes(p));
          if (!skip) results.push(fullPath);
        }
      }
    }
  } catch {
    /* skip inaccessible dirs */
  }
  return results;
}

function getDirectoryFileCounts(dir: string): Array<{ path: string; count: number }> {
  const results: Array<{ path: string; count: number }> = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    if (EXCLUDE_DIRS.some((d) => dir.includes(`/${d}/`) || dir.endsWith(`/${d}`))) return results;

    const implFiles = entries.filter((e: { isFile: () => boolean; name: string }) => {
      if (!e.isFile()) return false;
      const ext = extname(e.name);
      if (!CODE_EXTENSIONS.includes(ext)) return false;
      if (EXCLUDE_PATTERNS.some((p) => e.name.includes(p))) return false;
      return true;
    });

    if (implFiles.length > 0) {
      results.push({ path: relative(ROOT, dir), count: implFiles.length });
    }

    for (const entry of entries) {
      if (entry.isDirectory() && !EXCLUDE_DIRS.includes(entry.name)) {
        results.push(...getDirectoryFileCounts(join(dir, entry.name)));
      }
    }
  } catch {
    /* skip */
  }
  return results;
}

describe('Constitution VI: File Size Limits', () => {
  const files = walkDir(SRC);

  it('finds implementation files to check', () => {
    expect(files.length).toBeGreaterThan(50);
  });

  it(`no NEW source file exceeds ${MAX_LINES_TOLERANCE} lines`, () => {
    const violations: string[] = [];
    for (const file of files) {
      const rel = relative(ROOT, file);
      if (KNOWN_OVERSIZE_FILES.includes(rel)) continue;
      const content = readFileSync(file, 'utf-8');
      const lineCount = content.split('\n').length;
      if (lineCount > MAX_LINES_TOLERANCE) {
        violations.push(`${rel}: ${lineCount} lines`);
      }
    }
    expect(violations).toEqual([]);
  });

  it('reports known oversize files for remediation tracking', () => {
    const stillOver: string[] = [];
    for (const known of KNOWN_OVERSIZE_FILES) {
      const fullPath = resolve(ROOT, known);
      try {
        const content = readFileSync(fullPath, 'utf-8');
        const lineCount = content.split('\n').length;
        if (lineCount > MAX_LINES_TOLERANCE) {
          stillOver.push(`${known}: ${lineCount} lines`);
        }
      } catch {
        /* file may have been fixed/removed */
      }
    }
    if (stillOver.length > 0) {
      console.warn(
        `[Arch] Known oversize files (${stillOver.length} pending remediation):\n  ${stillOver.join('\n  ')}`
      );
    }
  });

  it(`warns on files between ${MAX_LINES} and ${MAX_LINES_TOLERANCE} lines`, () => {
    const warnings: string[] = [];
    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      const lineCount = content.split('\n').length;
      if (lineCount > MAX_LINES && lineCount <= MAX_LINES_TOLERANCE) {
        warnings.push(`${relative(ROOT, file)}: ${lineCount} lines (close to limit)`);
      }
    }
    // This is informational - log but don't fail
    if (warnings.length > 0) {
      console.warn(`[Arch] Files approaching limit:\n  ${warnings.join('\n  ')}`);
    }
  });
});

describe('Constitution VI: Folder Density Limits', () => {
  const dirs = getDirectoryFileCounts(SRC);

  it('finds directories to check', () => {
    expect(dirs.length).toBeGreaterThan(10);
  });

  it(`no NEW directory has more than ${MAX_FILES_PER_DIR} implementation files`, () => {
    const violations = dirs.filter((d) => {
      if (d.count <= MAX_FILES_PER_DIR) return false;
      if (KNOWN_DENSE_DIRS.includes(d.path)) return false;
      return true;
    });
    const messages = violations.map((v) => `${v.path}: ${v.count} files`);
    expect(messages).toEqual([]);
  });

  it('reports known dense directories for remediation tracking', () => {
    const stillDense: string[] = [];
    for (const d of dirs) {
      if (KNOWN_DENSE_DIRS.includes(d.path) && d.count > MAX_FILES_PER_DIR) {
        stillDense.push(`${d.path}: ${d.count} files`);
      }
    }
    if (stillDense.length > 0) {
      console.warn(
        `[Arch] Known dense dirs (${stillDense.length} pending subfolder split):\n  ${stillDense.join('\n  ')}`
      );
    }
  });
});
