import type { Command } from '@/stores/commands/commands';
import { showToast } from '@/stores/toast/toast';

export function buildBacklinkCacheCommands(): Command[] {
  return [
    {
      id: 'backlink-cache:build',
      name: 'Backlink Cache: Build Cache',
      description: 'Build the backlink cache from all vault notes',
      category: 'Backlinks',
      action: async () => {
        const { get } = await import('svelte/store');
        const { notes } = await import('@/stores/vault/vault');
        const { buildCache } = await import('@/features/backlinks');
        const allNotes = get(notes);
        const inputs = allNotes.map((n) => ({
          path: n.path,
          title: n.title,
          content: n.content || '',
          frontmatter: n.frontmatter,
        }));
        buildCache(inputs);
        showToast(`Backlink cache built for ${inputs.length} files`, 'info');
      },
    },
    {
      id: 'backlink-cache:clear',
      name: 'Backlink Cache: Clear Cache',
      description: 'Clear the backlink cache',
      category: 'Backlinks',
      action: async () => {
        const { clearCache } = await import('@/features/backlinks');
        clearCache();
        showToast('Backlink cache cleared', 'info');
      },
    },
    {
      id: 'backlink-cache:stats',
      name: 'Backlink Cache: Show Statistics',
      description: 'Display cache statistics',
      category: 'Backlinks',
      action: async () => {
        const { get } = await import('svelte/store');
        const { cacheStats } = await import('@/features/backlinks');
        const stats = get(cacheStats);
        showToast(
          `Cache: ${stats.totalFiles} files, ${stats.totalLinks} links, ` +
            `${stats.canvasFiles} canvas, built in ${stats.buildTime}ms`,
          'info'
        );
      },
    },
    {
      id: 'backlink-cache:safe-lookup',
      name: 'Backlink Cache: Safe Lookup (Current Note)',
      description: 'Rebuild cache and show accurate backlinks for active note',
      category: 'Backlinks',
      action: async () => {
        const { get } = await import('svelte/store');
        const { activeNote } = await import('@/stores/vault/vault');
        const note = get(activeNote);
        if (!note?.path) {
          showToast('No active note', 'warning');
          return;
        }
        const { getCachedBacklinksSafe } = await import('@/features/backlinks');
        const backlinks = await getCachedBacklinksSafe(note.path);
        showToast(`Safe lookup: ${backlinks.length} backlinks for "${note.title}"`, 'info');
      },
    },
  ];
}
