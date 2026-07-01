/**
 * Creative feature commands — Storyteller Suite.
 */

import type { Command } from '@/stores/commands/commands';
import { showToast } from '@/stores/toast/toast';

export function buildCreativeFeatureCommands(): Command[] {
  return [
    // ── Storyteller: Story Management ───────────────────────────────────────
    {
      id: 'storyteller:open-dashboard',
      name: 'Storyteller: Open Dashboard',
      description: 'Open the Storyteller Suite dashboard',
      category: 'Storyteller',
      action: async () => {
        const { setDashboardView } = await import('@/features/storyteller');
        setDashboardView('stories');
        showToast('Storyteller dashboard opened', 'info');
      },
    },
    {
      id: 'storyteller:new-story',
      name: 'Storyteller: Create New Story',
      description: 'Create a new story project',
      category: 'Storyteller',
      action: async () => {
        const { addStory } = await import('@/features/storyteller');
        const name = prompt('Story name:');
        if (name) {
          addStory(name);
          showToast(`Story "${name}" created`, 'success');
        }
      },
    },

    // ── Storyteller: Entity Management ──────────────────────────────────────
    {
      id: 'storyteller:add-character',
      name: 'Storyteller: Add Character',
      description: 'Create a new character entity',
      category: 'Storyteller',
      action: async () => {
        const { addEntity, setDashboardView } = await import('@/features/storyteller');
        const name = prompt('Character name:');
        if (name) {
          addEntity('character', name);
          setDashboardView('entities');
          showToast(`Character "${name}" added`, 'success');
        }
      },
    },
    {
      id: 'storyteller:add-location',
      name: 'Storyteller: Add Location',
      description: 'Create a new location entity',
      category: 'Storyteller',
      action: async () => {
        const { addEntity, setDashboardView } = await import('@/features/storyteller');
        const name = prompt('Location name:');
        if (name) {
          addEntity('location', name);
          setDashboardView('entities');
          showToast(`Location "${name}" added`, 'success');
        }
      },
    },
    {
      id: 'storyteller:add-event',
      name: 'Storyteller: Add Event',
      description: 'Create a new event entity',
      category: 'Storyteller',
      action: async () => {
        const { addEntity, setDashboardView } = await import('@/features/storyteller');
        const name = prompt('Event name:');
        if (name) {
          addEntity('event', name);
          setDashboardView('entities');
          showToast(`Event "${name}" added`, 'success');
        }
      },
    },
    {
      id: 'storyteller:add-scene',
      name: 'Storyteller: Add Scene',
      description: 'Create a new scene entity',
      category: 'Storyteller',
      action: async () => {
        const { addEntity, setDashboardView } = await import('@/features/storyteller');
        const name = prompt('Scene name:');
        if (name) {
          addEntity('scene', name);
          setDashboardView('entities');
          showToast(`Scene "${name}" added`, 'success');
        }
      },
    },

    // ── Storyteller: Views ──────────────────────────────────────────────────
    {
      id: 'storyteller:open-timeline',
      name: 'Storyteller: Open Timeline',
      description: 'Switch to the timeline view',
      category: 'Storyteller',
      action: async () => {
        const { setDashboardView } = await import('@/features/storyteller');
        setDashboardView('timeline');
      },
    },
    {
      id: 'storyteller:open-storyboard',
      name: 'Storyteller: Open Story Board',
      description: 'Switch to the story board view',
      category: 'Storyteller',
      action: async () => {
        const { setDashboardView } = await import('@/features/storyteller');
        setDashboardView('storyboard');
      },
    },

    // ── Storyteller: Campaign ───────────────────────────────────────────────
    {
      id: 'storyteller:open-campaign',
      name: 'Storyteller: Open Campaign View',
      description: 'Open the campaign play mode',
      category: 'Storyteller',
      action: async () => {
        const { setDashboardView } = await import('@/features/storyteller');
        setDashboardView('campaign');
      },
    },
    {
      id: 'storyteller:new-session',
      name: 'Storyteller: Start New Session',
      description: 'Create a new campaign session note',
      category: 'Storyteller',
      action: async () => {
        const { addSession, setDashboardView } = await import('@/features/storyteller');
        const title = prompt('Session title:');
        if (title) {
          addSession(title, `Sessions/${title}.md`);
          setDashboardView('campaign');
          showToast(`Session "${title}" started`, 'success');
        }
      },
    },
    {
      id: 'storyteller:add-log-entry',
      name: 'Storyteller: Add Session Log Entry',
      description: 'Add a narrative entry to the active session log',
      category: 'Storyteller',
      action: async () => {
        const { addLog } = await import('@/features/storyteller');
        const text = prompt('Log entry:');
        if (text) {
          addLog('narrative', text);
          showToast('Log entry added', 'info');
        }
      },
    },

    // ── Storyteller: Compile ────────────────────────────────────────────────
    {
      id: 'storyteller:open-compile',
      name: 'Storyteller: Open Compile',
      description: 'Open the manuscript compile panel',
      category: 'Storyteller',
      action: async () => {
        const { setDashboardView } = await import('@/features/storyteller');
        setDashboardView('compile');
      },
    },

    // ── Storyteller: Plot Grid ──────────────────────────────────────────────
    {
      id: 'storyteller:open-plotgrid',
      name: 'Storyteller: Open Plot Grid',
      description: 'Scene × plotline spreadsheet grid',
      category: 'Storyteller',
      action: async () => {
        const { setDashboardView } = await import('@/features/storyteller');
        setDashboardView('plotgrid');
      },
    },
    {
      id: 'storyteller:open-plotlines',
      name: 'Storyteller: Open Plotlines (Subway Map)',
      description: 'Transit-style plotline visualization',
      category: 'Storyteller',
      action: async () => {
        const { setDashboardView } = await import('@/features/storyteller');
        setDashboardView('plotlines');
      },
    },
    {
      id: 'storyteller:add-plotline',
      name: 'Storyteller: Add Plotline',
      description: 'Create a new plotline thread',
      category: 'Storyteller',
      action: async () => {
        const { addPlotline, setDashboardView } = await import('@/features/storyteller');
        const name = prompt('Plotline name:');
        if (name) {
          addPlotline(name);
          setDashboardView('plotlines');
          showToast(`Plotline "${name}" created`, 'success');
        }
      },
    },

    // ── Storyteller: Manuscript & Navigator ─────────────────────────────────
    {
      id: 'storyteller:open-manuscript',
      name: 'Storyteller: Open Manuscript View',
      description: 'Scrivenings-style continuous reading/editing',
      category: 'Storyteller',
      action: async () => {
        const { setDashboardView } = await import('@/features/storyteller');
        setDashboardView('manuscript');
      },
    },
    {
      id: 'storyteller:open-navigator',
      name: 'Storyteller: Open Navigator',
      description: 'Compact scene navigator with search and filters',
      category: 'Storyteller',
      action: async () => {
        const { setDashboardView } = await import('@/features/storyteller');
        setDashboardView('navigator');
      },
    },
    {
      id: 'storyteller:open-corkboard',
      name: 'Storyteller: Open Corkboard',
      description: 'Freeform sticky note canvas for brainstorming',
      category: 'Storyteller',
      action: async () => {
        const { setDashboardView } = await import('@/features/storyteller');
        setDashboardView('corkboard');
      },
    },

    // ── Storyteller: Stats & Export ──────────────────────────────────────────
    {
      id: 'storyteller:open-stats',
      name: 'Storyteller: Open Stats Dashboard',
      description: 'Writing goals, sprint, pacing analysis, plot holes',
      category: 'Storyteller',
      action: async () => {
        const { setDashboardView } = await import('@/features/storyteller');
        setDashboardView('stats');
      },
    },
    {
      id: 'storyteller:start-sprint',
      name: 'Storyteller: Start Writing Sprint',
      description: 'Start a timed writing sprint',
      category: 'Storyteller',
      action: async () => {
        const { startSprint, setDashboardView } = await import('@/features/storyteller');
        startSprint(25, 0);
        setDashboardView('stats');
        showToast('25-minute writing sprint started', 'success');
      },
    },
    {
      id: 'storyteller:open-export',
      name: 'Storyteller: Export Project',
      description: 'Export to Markdown, JSON, CSV, or HTML',
      category: 'Storyteller',
      action: async () => {
        const { setDashboardView } = await import('@/features/storyteller');
        setDashboardView('export');
      },
    },
  ];
}
