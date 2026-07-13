import type { CssSnippetEntry } from '@/hubs/core/types/settings';
import { invokeCommand } from '@/ipc/invoke';
import { log } from '@/utils/log/logger';
import { isTauriAvailable } from '@/utils/platform';

const snippetLog = log.child('css-snippets');

const SNIPPET_DIR = '.bismuth/snippets';
const STYLE_ID_PREFIX = 'bismuth-snippet-';

// ─── Snippet discovery ───────────────────────────────────────────────────────

export async function discoverSnippets(): Promise<string[]> {
  if (!isTauriAvailable()) {
    return [];
  }

  try {
    const files = await invokeCommand<string[]>('list_snippet_files', {
      dir: SNIPPET_DIR,
    });
    return files.filter((f) => f.endsWith('.css')).sort();
  } catch (e) {
    snippetLog.debug('Snippet discovery failed (expected if no snippets dir)', {
      error: String(e),
    });
    return [];
  }
}

async function readSnippetContent(name: string): Promise<string> {
  if (!isTauriAvailable()) return '';

  try {
    const content = await invokeCommand<string>('read_snippet_file', {
      path: `${SNIPPET_DIR}/${name}`,
    });
    return content;
  } catch (e) {
    snippetLog.error('Failed to read snippet', { name, error: String(e) });
    return '';
  }
}

// ─── DOM injection ───────────────────────────────────────────────────────────

function styleId(name: string): string {
  return `${STYLE_ID_PREFIX}${name.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
}

export function injectSnippet(name: string, css: string): void {
  if (typeof document === 'undefined') return;
  const id = styleId(name);
  let el = document.getElementById(id) as HTMLStyleElement | null;
  if (el) {
    el.textContent = css;
    return;
  }
  el = document.createElement('style');
  el.id = id;
  el.setAttribute('data-snippet', name);
  el.textContent = css;
  document.head.appendChild(el);
  snippetLog.debug('Injected snippet', { name });
}

export function removeSnippet(name: string): void {
  if (typeof document === 'undefined') return;
  const id = styleId(name);
  const el = document.getElementById(id);
  if (el) {
    el.remove();
    snippetLog.debug('Removed snippet', { name });
  }
}

export function isSnippetActive(name: string): boolean {
  if (typeof document === 'undefined') return false;
  return !!document.getElementById(styleId(name));
}

// ─── Reconciliation ──────────────────────────────────────────────────────────

export async function syncSnippets(entries: CssSnippetEntry[]): Promise<void> {
  if (typeof document === 'undefined') return;

  // Remove snippets that are disabled or no longer in list
  const enabledNames = new Set(entries.filter((e) => e.enabled).map((e) => e.name));

  document.querySelectorAll(`style[data-snippet]`).forEach((el) => {
    const name = el.getAttribute('data-snippet');
    if (name && !enabledNames.has(name)) {
      el.remove();
      snippetLog.debug('Removed stale snippet', { name });
    }
  });

  // Inject enabled snippets that aren't already loaded
  for (const entry of entries) {
    if (!entry.enabled) continue;
    if (isSnippetActive(entry.name)) continue;

    const css = await readSnippetContent(entry.name);
    if (css) {
      injectSnippet(entry.name, css);
    }
  }
}

// ─── Merge discovered snippets with settings ─────────────────────────────────

export function mergeSnippetList(
  existing: CssSnippetEntry[],
  discovered: string[]
): CssSnippetEntry[] {
  const byName = new Map(existing.map((e) => [e.name, e]));
  const merged: CssSnippetEntry[] = [];

  for (const name of discovered) {
    const found = byName.get(name);
    merged.push(found ?? { name, enabled: false });
  }

  return merged;
}
