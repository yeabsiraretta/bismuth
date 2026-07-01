import type { Command } from '@/stores/commands/commands';
import { showToast } from '@/stores/toast/toast';

export function buildSmartGraphCommands(): Command[] {
  return [
    {
      id: 'smart-graph:open',
      name: 'Smart Connections: Open Visualizer',
      description: 'Open the Smart Connections graph for the active note',
      category: 'Graph',
      action: async () => {
        showToast('Open Smart Connections from the Graph sidebar panel', 'info');
      },
    },
    {
      id: 'smart-graph:refresh',
      name: 'Smart Connections: Refresh Connections',
      description: 'Re-fetch smart connections for the active note',
      category: 'Graph',
      action: async () => {
        const { get } = await import('svelte/store');
        const { activeNote } = await import('@/stores/vault/vault');
        const note = get(activeNote);
        if (!note?.path) {
          showToast('No active note selected', 'warning');
          return;
        }
        showToast(`Refreshing connections for "${note.title}"...`, 'info');
      },
    },
    {
      id: 'smart-graph:toggle-mode',
      name: 'Smart Connections: Toggle Note/Block Mode',
      description: 'Switch between note-level and block-level connections',
      category: 'Graph',
      action: async () => {
        showToast('Use the Smart Graph settings panel to toggle connection mode', 'info');
      },
    },
    {
      id: 'graph:analyze',
      name: 'Graph Analytics: Run Analysis',
      description: 'Detect topical clusters, gaps, and centrality metrics',
      category: 'Graph',
      action: async () => {
        const { getGraphData, runAnalysis } = await import('@/features/graph');
        try {
          const data = await getGraphData();
          runAnalysis(data.nodes, data.edges);
          showToast('Graph analysis complete', 'info');
        } catch { showToast('Failed to analyze graph', 'error'); }
      },
    },
    {
      id: 'graph:topics',
      name: 'Graph Analytics: Show Topics',
      description: 'View detected topical clusters',
      category: 'Graph',
      action: async () => {
        const { setAnalyticsTab } = await import('@/features/graph');
        setAnalyticsTab('topics');
        showToast('Switched to Topics view', 'info');
      },
    },
    {
      id: 'graph:gaps',
      name: 'Graph Analytics: Show Gaps',
      description: 'View structural gaps between knowledge clusters',
      category: 'Graph',
      action: async () => {
        const { setAnalyticsTab } = await import('@/features/graph');
        setAnalyticsTab('gaps');
        showToast('Switched to Gaps view', 'info');
      },
    },
    {
      id: 'graph:metrics',
      name: 'Graph Analytics: Show Metrics',
      description: 'View betweenness centrality, modularity, and bigram analysis',
      category: 'Graph',
      action: async () => {
        const { setAnalyticsTab } = await import('@/features/graph');
        setAnalyticsTab('metrics');
        showToast('Switched to Metrics view', 'info');
      },
    },
    {
      id: 'graph:analyze-note',
      name: 'Graph Analytics: Analyze Current Note',
      description: 'Build concept graph from current note and run analysis',
      category: 'Graph',
      action: async () => {
        const { get } = await import('svelte/store');
        const { activeNote } = await import('@/stores/vault/vault');
        const note = get(activeNote);
        if (!note?.content) { showToast('No active note', 'warning'); return; }
        const { buildConceptGraph, runAnalysis } = await import('@/features/graph');
        const { nodes, edges } = buildConceptGraph(note.content);
        runAnalysis(nodes, edges);
        showToast(`Analyzed concepts in "${note.title}"`, 'info');
      },
    },

    // ── 3D Graph ──────────────────────────────────────────────────────────
    {
      id: 'graph3d:open',
      name: '3D Graph: Open',
      description: 'Open the immersive 3D force-directed graph view',
      category: 'Graph',
      action: async () => {
        window.dispatchEvent(new CustomEvent('open-graph3d-view'));
      },
    },
    {
      id: 'graph3d:reset-camera',
      name: '3D Graph: Reset Camera',
      description: 'Reset 3D graph camera to default position',
      category: 'Graph',
      action: async () => {
        const { clear3DSession } = await import('@/features/graph');
        clear3DSession();
        showToast('3D graph camera reset', 'info');
      },
    },
  ];
}
