/**
 * URI action handlers — executes parsed Advanced URI actions.
 *
 * Each handler is a pure async function that takes a ParsedUri and performs
 * the corresponding app action (open file, edit content, run command, etc.).
 */

import type { ParsedUri, UriActionResult } from './types';
import { log } from '@/utils/logger';

// ─── Open ───────────────────────────────────────────────────────────────────

async function handleOpen(uri: ParsedUri): Promise<UriActionResult> {
  if (!uri.filepath) return { success: false, error: 'Missing filepath parameter' };
  try {
    const { openNote } = await import('@/appNavigation');
    await openNote(uri.filepath);

    if (uri.heading || uri.block || uri.line) {
      log.debug('URI: scroll target requested', {
        heading: uri.heading,
        block: uri.block,
        line: uri.line,
      });
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: `Failed to open: ${e}` };
  }
}

// ─── Edit ───────────────────────────────────────────────────────────────────

async function handleEdit(uri: ParsedUri): Promise<UriActionResult> {
  if (!uri.filepath) return { success: false, error: 'Missing filepath parameter' };
  try {
    const { getNote, writeNote, createNote } = await import('@/services/vault/vault');

    let content: string;
    try {
      const note = await getNote(uri.filepath);
      content = note.content;
    } catch {
      if (uri.ifnotexists) {
        await createNote(uri.filepath, '');
        content = '';
      } else {
        return { success: false, error: `File not found: ${uri.filepath}` };
      }
    }

    const data = uri.clipboard ? await readClipboard() : (uri.data ?? '');
    const newContent = applyWriteMode(content, data, uri.mode ?? 'append');
    await writeNote(uri.filepath, newContent);

    const { openNote } = await import('@/appNavigation');
    await openNote(uri.filepath);
    return { success: true };
  } catch (e) {
    return { success: false, error: `Failed to edit: ${e}` };
  }
}

// ─── Create ─────────────────────────────────────────────────────────────────

async function handleCreate(uri: ParsedUri): Promise<UriActionResult> {
  if (!uri.filepath) return { success: false, error: 'Missing filepath parameter' };
  try {
    const { createNote } = await import('@/services/vault/vault');
    const data = uri.clipboard ? await readClipboard() : (uri.data ?? '');
    await createNote(uri.filepath, data);

    const { openNote } = await import('@/appNavigation');
    await openNote(uri.filepath);
    return { success: true };
  } catch (e) {
    return { success: false, error: `Failed to create: ${e}` };
  }
}

// ─── Daily ──────────────────────────────────────────────────────────────────

async function handleDaily(uri: ParsedUri): Promise<UriActionResult> {
  try {
    const { openDailyNote } = await import('@/features/periodic');
    const path = await openDailyNote();

    if (uri.data || uri.clipboard) {
      const { getNote, writeNote } = await import('@/services/vault/vault');
      const data = uri.clipboard ? await readClipboard() : (uri.data ?? '');

      try {
        const note = await getNote(path);
        const newContent = applyWriteMode(note.content, data, uri.mode ?? 'append');
        await writeNote(path, newContent);
      } catch {
        log.warn('URI: daily note content append failed — note may not be saved yet');
      }
    }

    return { success: true };
  } catch (e) {
    return { success: false, error: `Failed to open daily note: ${e}` };
  }
}

// ─── Command ────────────────────────────────────────────────────────────────

async function handleCommand(uri: ParsedUri): Promise<UriActionResult> {
  if (!uri.commandid) return { success: false, error: 'Missing commandid parameter' };
  try {
    if (uri.filepath) {
      const { openNote } = await import('@/appNavigation');
      await openNote(uri.filepath);
    }

    const { executeCommand } = await import('@/stores/commands/commands');
    await executeCommand(uri.commandid);
    return { success: true };
  } catch (e) {
    return { success: false, error: `Failed to execute command: ${e}` };
  }
}

// ─── Search ─────────────────────────────────────────────────────────────────

async function handleSearch(uri: ParsedUri): Promise<UriActionResult> {
  if (!uri.query) return { success: false, error: 'Missing query parameter' };
  try {
    const { changeTab } = await import('@/appNavigation');
    changeTab('left', 'search');

    log.info('URI: search action triggered', { query: uri.query });
    return { success: true, data: { query: uri.query } };
  } catch (e) {
    return { success: false, error: `Failed to search: ${e}` };
  }
}

// ─── Search & Replace ───────────────────────────────────────────────────────

async function handleSearchReplace(uri: ParsedUri): Promise<UriActionResult> {
  if (!uri.filepath) return { success: false, error: 'Missing filepath parameter' };
  if (!uri.search) return { success: false, error: 'Missing search parameter' };
  try {
    const { getNote, writeNote } = await import('@/services/vault/vault');
    const note = await getNote(uri.filepath);

    let newContent: string;
    if (uri.regex) {
      const re = new RegExp(uri.search, 'g');
      newContent = note.content.replace(re, uri.replace ?? '');
    } else {
      newContent = note.content.split(uri.search).join(uri.replace ?? '');
    }

    await writeNote(uri.filepath, newContent);

    const { openNote } = await import('@/appNavigation');
    await openNote(uri.filepath);
    return { success: true };
  } catch (e) {
    return { success: false, error: `Failed to search/replace: ${e}` };
  }
}

// ─── Frontmatter ────────────────────────────────────────────────────────────

async function handleFrontmatter(uri: ParsedUri): Promise<UriActionResult> {
  if (!uri.filepath) return { success: false, error: 'Missing filepath parameter' };
  if (!uri.frontmatterkey) return { success: false, error: 'Missing frontmatterkey parameter' };
  try {
    const { getNote } = await import('@/services/vault/vault');
    const note = await getNote(uri.filepath);

    if (uri.data !== undefined) {
      // Write mode: set frontmatter value
      const { updateFrontmatterField } = await import('@/services/frontmatter');
      let value: unknown = uri.data;
      try {
        value = JSON.parse(uri.data);
      } catch {
        /* keep as string */
      }
      await updateFrontmatterField(uri.filepath, uri.frontmatterkey, value);
      return { success: true };
    } else {
      // Read mode: return frontmatter value
      const fm = note.frontmatter ?? {};
      return { success: true, data: fm[uri.frontmatterkey] };
    }
  } catch (e) {
    return { success: false, error: `Failed to handle frontmatter: ${e}` };
  }
}

// ─── Canvas ─────────────────────────────────────────────────────────────────

async function handleCanvas(uri: ParsedUri): Promise<UriActionResult> {
  if (!uri.canvasid) return { success: false, error: 'Missing canvasid parameter' };
  try {
    const { setViewportMode } = await import('@/stores/layout/presets');
    setViewportMode('canvas');

    const { loadCanvas, viewport } = await import('@/features/canvas/stores');
    await loadCanvas(uri.canvasid);

    if (uri.x !== undefined || uri.y !== undefined || uri.zoom !== undefined) {
      viewport.update((v) => ({
        x: uri.x ?? v.x,
        y: uri.y ?? v.y,
        scale: uri.zoom ?? v.scale,
      }));
    }

    return { success: true };
  } catch (e) {
    return { success: false, error: `Failed to open canvas: ${e}` };
  }
}

// ─── Workspace ──────────────────────────────────────────────────────────────

async function handleWorkspace(uri: ParsedUri): Promise<UriActionResult> {
  if (!uri.workspace) return { success: false, error: 'Missing workspace parameter' };
  try {
    const { applyPreset } = await import('@/stores/layout/presets');
    applyPreset(uri.workspace);
    return { success: true };
  } catch (e) {
    return { success: false, error: `Failed to load workspace: ${e}` };
  }
}

// ─── Bookmark ───────────────────────────────────────────────────────────────

async function handleBookmark(uri: ParsedUri): Promise<UriActionResult> {
  if (!uri.bookmark) return { success: false, error: 'Missing bookmark parameter' };
  try {
    log.info('URI: bookmark action triggered', { bookmark: uri.bookmark });
    return { success: true, data: { bookmark: uri.bookmark } };
  } catch (e) {
    return { success: false, error: `Failed to open bookmark: ${e}` };
  }
}

// ─── Annotate ───────────────────────────────────────────────────────────────

async function handleAnnotate(uri: ParsedUri): Promise<UriActionResult> {
  if (!uri.filepath) return { success: false, error: 'Missing filepath parameter' };
  try {
    const { openAnnotationNote, createAnnotationNote } = await import('@/features/annotator');

    // If filepath is a PDF/EPUB, create or find annotation note
    const ext = uri.filepath.split('.').pop()?.toLowerCase();
    if (ext === 'pdf' || ext === 'epub') {
      await createAnnotationNote(uri.filepath, ext);
    } else {
      // Assume filepath is the annotation note itself
      await openAnnotationNote(uri.filepath);
    }

    return { success: true };
  } catch (e) {
    return { success: false, error: `Failed to open annotator: ${e}` };
  }
}

// ─── Dispatcher ─────────────────────────────────────────────────────────────

const HANDLER_MAP: Record<string, (uri: ParsedUri) => Promise<UriActionResult>> = {
  open: handleOpen,
  edit: handleEdit,
  create: handleCreate,
  daily: handleDaily,
  command: handleCommand,
  search: handleSearch,
  searchreplace: handleSearchReplace,
  frontmatter: handleFrontmatter,
  canvas: handleCanvas,
  workspace: handleWorkspace,
  bookmark: handleBookmark,
  annotate: handleAnnotate,
};

/**
 * Dispatches a parsed URI to the appropriate handler.
 */
export async function dispatchUri(uri: ParsedUri): Promise<UriActionResult> {
  const handler = HANDLER_MAP[uri.action];
  if (!handler) {
    return { success: false, error: `Unknown action: ${uri.action}` };
  }

  log.info('URI: dispatching action', { action: uri.action, filepath: uri.filepath });
  const result = await handler(uri);

  if (!result.success) {
    log.warn('URI: action failed', { action: uri.action, error: result.error });
  }
  return result;
}

// ─── Utilities ──────────────────────────────────────────────────────────────

/** Applies write mode to combine existing content with new data. */
export function applyWriteMode(existing: string, data: string, mode: string): string {
  switch (mode) {
    case 'overwrite':
      return data;
    case 'prepend':
      return data + '\n' + existing;
    case 'append':
      return existing + (existing.endsWith('\n') ? '' : '\n') + data;
    default:
      return data;
  }
}

/** Reads text from the system clipboard. */
async function readClipboard(): Promise<string> {
  try {
    return await navigator.clipboard.readText();
  } catch {
    log.warn('URI: clipboard read failed');
    return '';
  }
}
