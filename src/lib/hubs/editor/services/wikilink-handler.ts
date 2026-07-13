import { getNotes } from '@/hubs/core/stores/vault-store.svelte';
import { createNewNote } from '@/hubs/editor/services/file-ops';
import { openNote } from '@/ui/panel-actions';
import { log } from '@/utils/log/logger';
import { resolveWikilink } from '@/utils/wikilink';

function handleWikilinkClick(targetTitle: string): boolean {
  const notes = getNotes();
  const allPaths = notes.map((n) => n.path);
  const resolved = resolveWikilink(targetTitle, allPaths);

  if (resolved) {
    openNote(resolved);
    return true;
  }

  createNewNote(targetTitle)
    .then((path) => {
      log.info('Created note from wikilink', { title: targetTitle, path });
    })
    .catch((err) => {
      log.warn('Failed to create note from wikilink', { title: targetTitle, error: String(err) });
    });

  return true;
}

export function initWikilinkListener(): () => void {
  function handler(e: Event) {
    const detail = (e as CustomEvent<{ target: string }>).detail;
    if (detail?.target) {
      handleWikilinkClick(detail.target);
    }
  }

  // Delegate clicks on rendered wikilink anchors (reading mode, embed widgets, etc.)
  function clickDelegate(e: MouseEvent) {
    const el = (e.target as HTMLElement).closest('a.wikilink[data-wikilink]') as HTMLElement | null;
    if (!el) return;
    e.preventDefault();
    e.stopPropagation();
    const target = el.dataset['wikilink'];
    if (target) {
      handleWikilinkClick(target);
    }
  }

  window.addEventListener('wikilink-click', handler);
  document.addEventListener('click', clickDelegate, true);
  return () => {
    window.removeEventListener('wikilink-click', handler);
    document.removeEventListener('click', clickDelegate, true);
  };
}
