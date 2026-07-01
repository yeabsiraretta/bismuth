/**
 * Lazy extension loader — dynamically imports non-core editor extensions
 * to avoid pulling them into the critical startup bundle.
 *
 * Extensions are loaded in parallel and flattened into a single Extension[].
 * The caller should inject them into a Compartment after the editor mounts.
 */

import type { Extension } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import { log } from '@/utils/logger';

interface LazyExtensionContext {
  view: EditorView;
}

/**
 * Dynamically imports all deferrable editor extensions in parallel.
 * Returns a flat Extension[] suitable for a Compartment.reconfigure().
 */
export async function loadDeferredExtensions(_ctx: LazyExtensionContext): Promise<Extension[]> {
  const exts: Extension[] = [];
  const start = performance.now();

  const results = await Promise.allSettled([
    import('@/features/footnotes').then(m => m.footnoteExtension()),
    import('@/features/symbols').then(m => m.symbolPrettifierExtension()),
    import('@/features/dataview/extensions/inlineFieldExtension').then(m => m.inlineFieldExtension()),
    import('@/features/dataview/extensions/dataviewExtension').then(m => m.dataviewExtension()),
    import('@/features/metabind/extensions/metabindExtension').then(m => m.metabindExtension()),
    import('@/features/metabind/extensions/metabindTheme').then(m => m.metabindTheme),
    import('@/features/media/extensions/timestampLinkExtension').then(m => m.timestampLinkExtension()),
    import('@/features/music/services/abcExtension').then(m => m.abcNotationExtension()),
    import('@/features/music/services/chords/chordExtension').then(m => m.chordSheetExtension()),
    import('@/features/music/services/audioPlayer/audioPlayerExtension').then(m => m.audioPlayerExtension()),
    import('@/features/chem').then(m => m.smilesExtension()),
    import('@/features/progressbar').then(m => m.progressBarExtension()),
    import('@/features/flashcards/services/clozeExtension').then(m => m.clozeExtension()),
    import('@/features/code-styler/services/codeStylerTheme').then(m => m.codeStylerTheme),
    import('@/features/flashcards/services/flashcardTheme').then(m => m.flashcardWidgetTheme),
  ]);

  for (const r of results) {
    if (r.status === 'fulfilled') {
      const val = r.value;
      if (Array.isArray(val)) {
        exts.push(...val);
      } else if (val) {
        exts.push(val as Extension);
      }
    } else {
      log.debug('Deferred extension load failed', { reason: String(r.reason) });
    }
  }

  const elapsed = Math.round(performance.now() - start);
  log.info('Editor: deferred extensions loaded', { count: exts.length, durationMs: elapsed });

  return exts;
}
