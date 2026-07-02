import type { Command } from '@/stores/commands/commands';
import { get } from 'svelte/store';
import { showToast } from '@/stores/toast/toast';

export function buildIntegrationFeatureCommands(): Command[] {
  return [
    {
      id: 'metadata-extractor:export-all',
      name: 'Metadata Extractor: Export all',
      description: 'Export tags, metadata, files, and canvas as JSON',
      category: 'Integration',
      action: async () => {
        const { runAllExports } = await import('@/features/metadata-extractor');
        const { scanVault, listFolders } = await import('@/services/vault/vault');
        const { writeNote } = await import('@/services/vault/vault');
        const { get: getStore } = await import('svelte/store');
        const { currentVault } = await import('@/stores/vault/vault');
        const vault = getStore(currentVault);
        if (!vault) {
          showToast('No vault open', 'error');
          return;
        }
        await runAllExports({
          scanNotes: async () => {
            const notes = await scanVault();
            return notes.map((n) => ({
              path: n.path,
              title: n.title,
              content: n.content,
              frontmatter: n.frontmatter,
            }));
          },
          listFolders: () => listFolders(vault.root_path),
          listNonMdFiles: async () => [],
          listCanvasFiles: async () => [],
          writeFile: writeNote,
        });
      },
    },
    {
      id: 'metadata-extractor:export-tags',
      name: 'Metadata Extractor: Export tags',
      description: 'Export tag-to-file mapping as JSON',
      category: 'Integration',
      action: async () => {
        const { runTagExport } = await import('@/features/metadata-extractor');
        const { scanVault } = await import('@/services/vault/vault');
        const { writeNote } = await import('@/services/vault/vault');
        await runTagExport({
          scanNotes: async () => {
            const notes = await scanVault();
            return notes.map((n) => ({
              path: n.path,
              title: n.title,
              content: n.content,
              frontmatter: n.frontmatter,
            }));
          },
          listFolders: async () => [],
          listNonMdFiles: async () => [],
          listCanvasFiles: async () => [],
          writeFile: writeNote,
        });
      },
    },
    {
      id: 'metadata-extractor:export-metadata',
      name: 'Metadata Extractor: Export note metadata',
      description: 'Export full markdown metadata as JSON',
      category: 'Integration',
      action: async () => {
        const { runMetadataExport } = await import('@/features/metadata-extractor');
        const { scanVault } = await import('@/services/vault/vault');
        const { writeNote } = await import('@/services/vault/vault');
        await runMetadataExport({
          scanNotes: async () => {
            const notes = await scanVault();
            return notes.map((n) => ({
              path: n.path,
              title: n.title,
              content: n.content,
              frontmatter: n.frontmatter,
            }));
          },
          listFolders: async () => [],
          listNonMdFiles: async () => [],
          listCanvasFiles: async () => [],
          writeFile: writeNote,
        });
      },
    },
    {
      id: 'metadata-extractor:toggle',
      name: 'Metadata Extractor: Toggle',
      description: 'Enable or disable metadata extraction',
      category: 'Integration',
      action: async () => {
        const { getExtractorConfig, updateExtractorConfig } =
          await import('@/features/metadata-extractor');
        const enabled = !getExtractorConfig().enabled;
        updateExtractorConfig({ enabled });
        showToast(`Metadata Extractor: ${enabled ? 'on' : 'off'}`, 'info');
      },
    },
    {
      id: 'metadata-extractor:reset-config',
      name: 'Metadata Extractor: Reset configuration',
      description: 'Restore default extractor settings',
      category: 'Integration',
      action: async () => {
        const { resetExtractorConfig } = await import('@/features/metadata-extractor');
        resetExtractorConfig();
        showToast('Metadata extractor config reset', 'info');
      },
    },
    {
      id: 'topic-linking:link-topics',
      name: 'Topic Linking: Link Topics',
      description: 'Run LDA topic modeling on vault documents and generate linked topic notes',
      category: 'Knowledge',
      action: async () => {
        const { runLinkTopics } = await import('@/features/topic-linking');
        const { scanVault } = await import('@/services/vault/vault');
        const { writeNote, createFolder, listNotes } = await import('@/services/vault/vault');
        const { get: getStore } = await import('svelte/store');
        const { currentVault } = await import('@/stores/vault/vault');
        const vault = getStore(currentVault);
        if (!vault) {
          showToast('No vault open', 'error');
          return;
        }
        await runLinkTopics({
          scanNotes: async () => {
            const notes = await scanVault();
            return notes.map((n) => ({ path: n.path, content: n.content }));
          },
          scanFolder: async (folder: string) => {
            const notes = await listNotes(vault.root_path, folder);
            return notes.map((n) => ({ path: n.path, content: n.content }));
          },
          writeFile: writeNote,
          createFolder,
        });
      },
    },
    {
      id: 'topic-linking:extract-web-links',
      name: 'Topic Linking: Extract Web Links',
      description: 'Extract web links from bookmark files and generate notes',
      category: 'Knowledge',
      action: async () => {
        const { runExtractWebLinks } = await import('@/features/topic-linking');
        const { writeNote, createFolder, listNotes } = await import('@/services/vault/vault');
        const { get: getStore } = await import('svelte/store');
        const { currentVault } = await import('@/stores/vault/vault');
        const vault = getStore(currentVault);
        if (!vault) {
          showToast('No vault open', 'error');
          return;
        }
        await runExtractWebLinks({
          scanNotes: async () => [],
          scanFolder: async (folder: string) => {
            const notes = await listNotes(vault.root_path, folder);
            return notes.map((n) => ({ path: n.path, content: n.content }));
          },
          writeFile: writeNote,
          createFolder,
        });
      },
    },
    {
      id: 'topic-linking:reset-config',
      name: 'Topic Linking: Reset configuration',
      description: 'Restore default topic linking settings',
      category: 'Knowledge',
      action: async () => {
        const { resetTopicConfig } = await import('@/features/topic-linking');
        resetTopicConfig();
        showToast('Topic linking config reset', 'info');
      },
    },
    // ─── Prisma Calendar commands ────────────────────────────────────────
    {
      id: 'prisma:scan-frontmatter',
      name: 'Prisma Calendar: Scan Frontmatter Events',
      description: 'Scan vault notes for events defined in frontmatter',
      category: 'Calendar',
      action: async () => {
        const { notes } = await import('@/stores/vault/vault');
        const { extractAllFrontmatterEvents, DEFAULT_FM_EVENT_CONFIG } =
          await import('@/features/calendar');
        const { addCalendarEvent } = await import('@/features/calendar');
        const allNotes = get(notes);
        const mapped = allNotes
          .filter((n) => n.frontmatter)
          .map((n) => ({
            path: n.path,
            title: n.title,
            frontmatter: n.frontmatter as Record<string, unknown>,
          }));
        const events = extractAllFrontmatterEvents(mapped, DEFAULT_FM_EVENT_CONFIG);
        for (const e of events) addCalendarEvent(e);
        showToast(`Found ${events.length} frontmatter events`, 'info');
      },
    },
    {
      id: 'prisma:stats',
      name: 'Prisma Calendar: Show Statistics',
      description: 'Display calendar event statistics',
      category: 'Calendar',
      action: async () => {
        const { allCalendarItems, computeCalendarStats } = await import('@/features/calendar');
        const items = get(allCalendarItems);
        const stats = computeCalendarStats(items);
        showToast(
          `${stats.totalEvents} events, ${stats.completedCount} done (${stats.completionRate}%), ` +
            `streak: ${stats.currentStreak}d, avg: ${stats.averageEventsPerDay}/day`,
          'info'
        );
      },
    },
    {
      id: 'prisma:batch-mode',
      name: 'Prisma Calendar: Toggle Batch Selection',
      description: 'Enable multi-select mode for batch operations',
      category: 'Calendar',
      action: async () => {
        const { selectionMode } = await import('@/features/calendar');
        selectionMode.update((v) => !v);
        showToast('Batch selection toggled', 'info');
      },
    },
    {
      id: 'prisma:undo',
      name: 'Prisma Calendar: Undo',
      description: 'Undo last calendar action',
      category: 'Calendar',
      action: async () => {
        const { undo, canUndo } = await import('@/features/calendar');
        if (get(canUndo)) {
          undo();
          showToast('Undone', 'info');
        } else showToast('Nothing to undo', 'warning');
      },
    },
    {
      id: 'prisma:redo',
      name: 'Prisma Calendar: Redo',
      description: 'Redo last undone calendar action',
      category: 'Calendar',
      action: async () => {
        const { redo, canRedo } = await import('@/features/calendar');
        if (get(canRedo)) {
          redo();
          showToast('Redone', 'info');
        } else showToast('Nothing to redo', 'warning');
      },
    },
    {
      id: 'prisma:reset-presets',
      name: 'Prisma Calendar: Reset Event Presets',
      description: 'Restore default event presets',
      category: 'Calendar',
      action: async () => {
        const { resetPresets } = await import('@/features/calendar');
        resetPresets();
        showToast('Event presets reset to defaults', 'info');
      },
    },
    // ─── Graph Banner commands ──────────────────────────────────────────
    {
      id: 'graph-banner:toggle',
      name: 'Graph Banner: Toggle',
      description: 'Show or hide the local graph banner in the note header',
      category: 'Knowledge',
      action: async () => {
        const { toggleGraphBanner } = await import('@/features/graph-banner');
        const enabled = toggleGraphBanner();
        showToast(`Graph banner: ${enabled ? 'on' : 'off'}`, 'info');
      },
    },
    {
      id: 'graph-banner:increase-height',
      name: 'Graph Banner: Increase height',
      description: 'Make the graph banner taller',
      category: 'Knowledge',
      action: async () => {
        const { getGraphBannerConfig, setGraphBannerHeight } =
          await import('@/features/graph-banner');
        const h = getGraphBannerConfig().height + 40;
        setGraphBannerHeight(h);
        showToast(`Banner height: ${Math.min(400, h)}px`, 'info');
      },
    },
    {
      id: 'graph-banner:decrease-height',
      name: 'Graph Banner: Decrease height',
      description: 'Make the graph banner shorter',
      category: 'Knowledge',
      action: async () => {
        const { getGraphBannerConfig, setGraphBannerHeight } =
          await import('@/features/graph-banner');
        const h = getGraphBannerConfig().height - 40;
        setGraphBannerHeight(h);
        showToast(`Banner height: ${Math.max(80, h)}px`, 'info');
      },
    },
    {
      id: 'graph-banner:reset-config',
      name: 'Graph Banner: Reset configuration',
      description: 'Restore default graph banner settings',
      category: 'Knowledge',
      action: async () => {
        const { resetGraphBannerConfig } = await import('@/features/graph-banner');
        resetGraphBannerConfig();
        showToast('Graph banner config reset', 'info');
      },
    },
    // ─── Chem commands ──────────────────────────────────────────────────
    {
      id: 'chem:insert-smiles',
      name: 'Chem: Insert SMILES block',
      description: 'Insert a sample SMILES code block with common molecules',
      category: 'Knowledge',
      action: async () => {
        const { sampleSmilesBlock } = await import('@/features/chem');
        window.dispatchEvent(
          new CustomEvent('editor-insert', { detail: { text: sampleSmilesBlock() } })
        );
      },
    },
    {
      id: 'chem:toggle-inline',
      name: 'Chem: Toggle inline SMILES',
      description: 'Enable or disable inline SMILES rendering ($smiles=...)',
      category: 'Knowledge',
      action: async () => {
        const { toggleInlineSmiles } = await import('@/features/chem');
        const enabled = toggleInlineSmiles();
        showToast(`Inline SMILES: ${enabled ? 'on' : 'off'}`, 'info');
      },
    },
    {
      id: 'chem:reset-config',
      name: 'Chem: Reset configuration',
      description: 'Restore default chemistry rendering settings',
      category: 'Knowledge',
      action: async () => {
        const { resetChemConfig } = await import('@/features/chem');
        resetChemConfig();
        showToast('Chem config reset', 'info');
      },
    },
  ];
}
