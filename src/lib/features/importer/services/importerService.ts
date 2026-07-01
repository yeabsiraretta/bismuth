/**
 * Importer service — orchestrates file selection, conversion, and vault writing.
 * Connects the dialog service, converters, and vault service.
 */

import { get } from 'svelte/store';
import { currentVault } from '@/stores/vault/vault';
import { refreshNotes } from '@/stores/vault/vault';
import { writeNote, createFolder } from '@/services/vault/vault';
import { readFileText } from '@/services/vault/vault';
import { pickFile } from '@/services/system/dialog';
import { log } from '@/utils/logger';
import type {
  ImportSource,
  ImportOptions,
  ImportResult,
  ImportProgress,
  ConvertedNote,
} from '../types/importer';
import { IMPORT_SOURCES } from '../types/importer';
import { convertHtmlFile } from './converters/htmlToMd';
import { convertCsvToNotes } from './converters/csvToMd';
import { convertJsonNotes, convertEvernoteEnex } from './converters/jsonToMd';

type ProgressCallback = (progress: ImportProgress) => void;

/**
 * Run a full import: pick files → convert → write to vault.
 * Returns an ImportResult with success/failure counts.
 */
export async function runImport(
  options: ImportOptions,
  onProgress?: ProgressCallback,
): Promise<ImportResult> {
  const start = performance.now();
  const vault = get(currentVault);
  if (!vault) throw new Error('No vault open');

  const sourceInfo = IMPORT_SOURCES.find(s => s.id === options.source);
  if (!sourceInfo) throw new Error(`Unknown import source: ${options.source}`);

  // 1. Pick files
  onProgress?.({ current: 0, total: 0, currentTitle: 'Selecting files…', phase: 'reading' });

  const selected = await pickFile({
    title: `Import from ${sourceInfo.label}`,
    filters: [{ name: sourceInfo.label, extensions: sourceInfo.extensions }],
    multiple: sourceInfo.multiFile,
  });

  if (!selected) {
    return { totalFound: 0, imported: 0, failed: 0, skipped: 0, errors: [], durationMs: 0 };
  }

  const filePaths = Array.isArray(selected) ? selected : [selected];
  log.info('Importer: files selected', { count: filePaths.length, source: options.source });

  // 2. Read & convert
  const allNotes: ConvertedNote[] = [];
  const errors: Array<{ title: string; error: string }> = [];

  for (let i = 0; i < filePaths.length; i++) {
    const filePath = filePaths[i];
    const fileName = filePath.split('/').pop() ?? filePath;

    onProgress?.({
      current: i + 1,
      total: filePaths.length,
      currentTitle: fileName,
      phase: 'converting',
    });

    try {
      const content = await readFileText(filePath);
      const converted = convertFile(content, fileName, filePath, options.source);
      allNotes.push(...converted);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push({ title: fileName, error: msg });
      log.warn('Importer: failed to convert file', { file: fileName, error: msg });
    }
  }

  if (allNotes.length === 0) {
    return {
      totalFound: filePaths.length,
      imported: 0,
      failed: errors.length,
      skipped: 0,
      errors,
      durationMs: Math.round(performance.now() - start),
    };
  }

  // 3. Write to vault
  const destBase = buildDestinationPath(vault.root_path, options);

  // Ensure destination folder exists
  try {
    await createFolder(destBase);
  } catch {
    // Folder may already exist — that's fine
  }

  let imported = 0;
  let skipped = 0;

  for (let i = 0; i < allNotes.length; i++) {
    const note = allNotes[i];

    onProgress?.({
      current: i + 1,
      total: allNotes.length,
      currentTitle: note.title,
      phase: 'writing',
    });

    const folder = note.folder ? `${destBase}/${note.folder}` : destBase;
    const notePath = `${folder}/${note.title}.md`;

    // Add import frontmatter if requested
    let finalContent = note.content;
    if (options.addFrontmatter && !note.content.startsWith('---')) {
      const fm = buildImportFrontmatter(options, note);
      finalContent = `${fm}\n${note.content}`;
    } else if (options.addFrontmatter && options.importTag) {
      // Inject tag into existing frontmatter
      finalContent = injectTag(note.content, options.importTag);
    }

    try {
      // Ensure subfolder exists
      if (note.folder) {
        try { await createFolder(folder); } catch { /* exists */ }
      }

      await writeNote(notePath, finalContent);
      imported++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push({ title: note.title, error: msg });
      log.warn('Importer: failed to write note', { title: note.title, error: msg });
    }
  }

  // 4. Refresh vault notes list
  await refreshNotes();

  const result: ImportResult = {
    totalFound: allNotes.length,
    imported,
    failed: errors.length,
    skipped,
    errors,
    durationMs: Math.round(performance.now() - start),
  };

  log.info('Importer: import complete', { imported: result.imported, failed: result.failed, durationMs: result.durationMs });
  return result;
}

// ─── Internal helpers ──────────────────────────────────────────────────────────

function convertFile(
  content: string,
  fileName: string,
  filePath: string,
  source: ImportSource,
): ConvertedNote[] {
  switch (source) {
    case 'markdown':
    case 'text': {
      const title = fileName.replace(/\.(md|markdown|txt|text)$/i, '');
      return [{ title, content: source === 'text' ? `# ${title}\n\n${content}` : content, sourcePath: filePath }];
    }

    case 'html':
    case 'apple-notes':
    case 'onenote':
      return [convertHtmlFile(content, fileName, filePath)];

    case 'csv':
      return convertCsvToNotes(content);

    case 'evernote':
      return convertEvernoteEnex(content);

    case 'bear':
    case 'google-keep':
    case 'roam':
    case 'notion':
      // Try JSON first; if it fails, treat as markdown
      try {
        return convertJsonNotes(content, source);
      } catch {
        return [{ title: fileName.replace(/\.json$/i, ''), content, sourcePath: filePath }];
      }

    default:
      return [{ title: fileName, content, sourcePath: filePath }];
  }
}

function buildDestinationPath(vaultRoot: string, options: ImportOptions): string {
  let dest = vaultRoot;
  if (options.destinationFolder) {
    dest += `/${options.destinationFolder}`;
  }
  if (options.createSubfolder) {
    const sourceInfo = IMPORT_SOURCES.find(s => s.id === options.source);
    const label = sourceInfo?.label ?? options.source;
    dest += `/${label} Import`;
  }
  return dest.replace(/\/+/g, '/');
}

function buildImportFrontmatter(options: ImportOptions, note: ConvertedNote): string {
  const fields: string[] = [];
  fields.push(`imported_at: "${new Date().toISOString()}"`);
  fields.push(`import_source: "${options.source}"`);
  if (note.sourcePath) fields.push(`source_file: "${note.sourcePath.split('/').pop() ?? ''}"`);
  if (options.importTag) fields.push(`tags: ["${options.importTag}"]`);
  return `---\n${fields.join('\n')}\n---\n`;
}

function injectTag(content: string, tag: string): string {
  // Find existing tags field in frontmatter and append
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return content;

  const fm = fmMatch[1];
  if (fm.includes('tags:')) {
    // Append to existing tags array
    const updated = fm.replace(
      /tags:\s*\[(.*?)\]/,
      (_m, existing) => `tags: [${existing}${existing.trim() ? ', ' : ''}"${tag}"]`,
    );
    return content.replace(fmMatch[1], updated);
  }

  // Add tags field
  const newFm = `${fm}\ntags: ["${tag}"]`;
  return content.replace(fmMatch[1], newFm);
}
