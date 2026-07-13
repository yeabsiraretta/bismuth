import type { Extension } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';

import { log } from '@/utils/log/logger';

export interface LazyExtensionContext {
  view: EditorView;
}

export type ExtensionLoader = (ctx: LazyExtensionContext) => Promise<Extension | Extension[]>;

const registry: ExtensionLoader[] = [];
let cachedExtensions: Extension[] | null = null;

export function registerDeferredExtension(loader: ExtensionLoader): void {
  if (cachedExtensions) return;
  registry.push(loader);
}

export async function loadDeferredExtensions(ctx: LazyExtensionContext): Promise<Extension[]> {
  if (cachedExtensions) {
    log.info('Editor: deferred extensions loaded', {
      count: cachedExtensions.length,
      durationMs: 0,
    });
    return cachedExtensions;
  }

  if (registry.length === 0) return [];

  const start = performance.now();
  const exts: Extension[] = [];

  const loaders = [...registry];
  registry.length = 0;

  const results = await Promise.allSettled(loaders.map((loader) => loader(ctx)));

  for (const result of results) {
    if (result.status === 'fulfilled') {
      const val = result.value;
      if (Array.isArray(val)) {
        exts.push(...val);
      } else if (val) {
        exts.push(val);
      }
    } else {
      log.debug('Deferred extension load failed', { reason: String(result.reason) });
    }
  }

  cachedExtensions = exts;

  const elapsed = Math.round(performance.now() - start);
  log.info('Editor: deferred extensions loaded', { count: exts.length, durationMs: elapsed });

  return exts;
}
