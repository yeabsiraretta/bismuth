import type { Command } from '@/stores/commands/commands';
import { showToast } from '@/stores/toast/toast';

export function buildAiCommands(): Command[] {
  return [
    {
      id: 'enhanced-copy:copy',
      name: 'Enhanced Copy: Copy selected text',
      description: 'Copy selection while preserving/cleaning Markdown formatting',
      category: 'Editor',
      action: async () => {
        const { enhancedCopy } = await import('@/features/enhanced-copy');
        const ok = await enhancedCopy();
        if (ok) showToast('Copied with formatting', 'info');
        else showToast('No text selected', 'warning');
      },
    },
    {
      id: 'enhanced-copy:copy-reading',
      name: 'Enhanced Copy: Copy (reading view)',
      description: 'Copy selection from reading view with Markdown transforms',
      category: 'Editor',
      action: async () => {
        const { enhancedCopy } = await import('@/features/enhanced-copy');
        const ok = await enhancedCopy('reading');
        if (ok) showToast('Copied with formatting', 'info');
        else showToast('No text selected', 'warning');
      },
    },
    {
      id: 'enhanced-copy:copy-editing',
      name: 'Enhanced Copy: Copy (editing view)',
      description: 'Copy selection from editing view with Markdown transforms',
      category: 'Editor',
      action: async () => {
        const { enhancedCopy } = await import('@/features/enhanced-copy');
        const ok = await enhancedCopy('editing');
        if (ok) showToast('Copied with formatting', 'info');
        else showToast('No text selected', 'warning');
      },
    },
    {
      id: 'enhanced-copy:toggle-override',
      name: 'Enhanced Copy: Toggle default copy override',
      description: 'Enable or disable overriding Ctrl/Cmd+C with enhanced copy',
      category: 'Editor',
      action: async () => {
        const { enhancedCopyConfig, updateEnhancedCopyConfig } =
          await import('@/features/enhanced-copy');
        const { get: getStore } = await import('svelte/store');
        const current = getStore(enhancedCopyConfig);
        updateEnhancedCopyConfig({ overrideDefaultCopy: !current.overrideDefaultCopy });
        showToast(`Default copy override: ${!current.overrideDefaultCopy ? 'on' : 'off'}`, 'info');
      },
    },
    {
      id: 'enhanced-copy:reset',
      name: 'Enhanced Copy: Reset settings',
      description: 'Reset all enhanced copy settings to defaults',
      category: 'Editor',
      action: async () => {
        const { resetEnhancedCopyConfig } = await import('@/features/enhanced-copy');
        resetEnhancedCopyConfig();
        showToast('Enhanced copy settings reset', 'info');
      },
    },
    {
      id: 'rag:open',
      name: 'RAG: Open Chat Panel',
      description: 'Open the graph-based AI chat panel',
      category: 'AI',
      action: async () => {
        const { setActiveTab } = await import('@/stores/layout/layout');
        setActiveTab('right', 'rag');
        showToast('RAG chat opened', 'info');
      },
    },
    {
      id: 'rag:ask',
      name: 'RAG: Ask about vault',
      description: 'Ask a question using graph + vector search over your vault',
      category: 'AI',
      action: async () => {
        const query = prompt('Ask about your vault:');
        if (!query?.trim()) return;
        const { setActiveTab } = await import('@/stores/layout/layout');
        setActiveTab('right', 'rag');
        const { askRag } = await import('@/features/rag');
        await askRag(query.trim());
      },
    },
    {
      id: 'rag:clear',
      name: 'RAG: Clear chat',
      description: 'Clear all RAG conversation messages',
      category: 'AI',
      action: async () => {
        const { clearRagMessages } = await import('@/features/rag');
        clearRagMessages();
        showToast('RAG chat cleared', 'info');
      },
    },
    {
      id: 'rag:toggle-mode',
      name: 'RAG: Cycle search mode',
      description: 'Cycle between hybrid, vector, and graph search modes',
      category: 'AI',
      action: async () => {
        const { ragConfig, updateRagConfig } = await import('@/features/rag');
        const { get: getStore } = await import('svelte/store');
        const modes = ['hybrid', 'vector', 'graph'] as const;
        const current = getStore(ragConfig).searchMode;
        const idx = modes.indexOf(current);
        const next = modes[(idx + 1) % modes.length];
        updateRagConfig({ searchMode: next });
        showToast(`RAG search mode: ${next}`, 'info');
      },
    },
    {
      id: 'insights:open',
      name: 'Atomic Insights: Open View',
      description: 'Open the Atomic Insights sidebar panel',
      category: 'AI',
      action: async () => {
        const { setActiveTab } = await import('@/stores/layout/layout');
        setActiveTab('right', 'insights');
        showToast('Atomic Insights opened', 'info');
      },
    },
    {
      id: 'insights:refresh',
      name: 'Atomic Insights: Refresh',
      description: 'Recompute related notes for the active note',
      category: 'AI',
      action: async () => {
        const { activeNote } = await import('@/stores/vault/vault');
        const { get: getStore } = await import('svelte/store');
        const note = getStore(activeNote);
        if (!note) {
          showToast('No active note', 'warning');
          return;
        }
        const { getRelatedNotes } = await import('@/features/atomic-insights');
        const result = await getRelatedNotes(note.path);
        showToast(`Found ${result.results.length} related notes`, 'info');
      },
    },
    {
      id: 'insights:clear',
      name: 'Atomic Insights: Clear',
      description: 'Clear cached insight results',
      category: 'AI',
      action: async () => {
        const { clearInsights } = await import('@/features/atomic-insights');
        clearInsights();
        showToast('Insights cleared', 'info');
      },
    },
    {
      id: 'pdf:copy-link',
      name: 'PDF++: Copy link to selection',
      description: 'Copy an Obsidian-style link to the selected PDF text with highlight color',
      category: 'Annotator',
      action: async () => {
        showToast('Select text in the PDF viewer, then press Cmd+Shift+C', 'info');
      },
    },
    {
      id: 'pdf:toggle-highlights',
      name: 'PDF++: Toggle backlink highlights',
      description: 'Toggle highlighting of backlinks in the PDF viewer',
      category: 'Annotator',
      action: async () => {
        const { loadPdfPlusConfig, savePdfPlusConfig } = await import('@/features/annotator');
        const cfg = loadPdfPlusConfig();
        cfg.highlightBacklinks = !cfg.highlightBacklinks;
        savePdfPlusConfig(cfg);
        showToast(`Backlink highlights ${cfg.highlightBacklinks ? 'on' : 'off'}`, 'info');
      },
    },
    {
      id: 'pdf:filter-by-page',
      name: 'PDF++: Toggle filter backlinks by page',
      description: 'Filter PDF backlinks to show only those for the current page',
      category: 'Annotator',
      action: async () => {
        const { loadPdfPlusConfig, savePdfPlusConfig } = await import('@/features/annotator');
        const cfg = loadPdfPlusConfig();
        cfg.filterBacklinksByPage = !cfg.filterBacklinksByPage;
        savePdfPlusConfig(cfg);
        showToast(`Filter by page ${cfg.filterBacklinksByPage ? 'on' : 'off'}`, 'info');
      },
    },
  ];
}
