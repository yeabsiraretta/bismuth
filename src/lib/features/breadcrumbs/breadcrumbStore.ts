/**
 * Breadcrumb store — reactive breadcrumb context derived from active note.
 */

import { derived } from 'svelte/store';
import { activeNote, currentVault, notes } from '@/stores/vault/vault';
import type { BreadcrumbContext } from './types';
import { buildContext, resolveSiblings } from './breadcrumbService';

/** Reactive breadcrumb context for the currently active note. */
export const breadcrumbContext = derived(
  [activeNote, currentVault, notes],
  ([$note, $vault, $notes]): BreadcrumbContext => {
    if (!$note || !$vault) {
      return { trail: [], prev: null, next: null, parent: null };
    }

    const ctx = buildContext($note.path, $vault.root_path, $note.frontmatter ?? {});

    // Resolve prev/next from siblings if not set by frontmatter
    if (!ctx.prev || !ctx.next) {
      const dir = $note.path.substring(0, $note.path.lastIndexOf('/'));
      const siblings = $notes
        .filter((n) => {
          const nDir = n.path.substring(0, n.path.lastIndexOf('/'));
          return nDir === dir;
        })
        .map((n) => n.path)
        .sort();

      const resolved = resolveSiblings($note.path, siblings);
      if (!ctx.prev) ctx.prev = resolved.prev;
      if (!ctx.next) ctx.next = resolved.next;
    }

    return ctx;
  }
);
