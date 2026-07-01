import type { Command } from '@/stores/commands/commands';
import { showToast } from '@/stores/toast/toast';

export function buildLifeTrackerCommands(): Command[] {
  return [
    {
      id: 'lt:open',
      name: 'Life Tracker: Open dashboard',
      description: 'Open the Life Tracker visualization dashboard',
      category: 'Life Tracker',
      action: async () => {
        showToast('Open Life Tracker from the sidebar', 'info');
      },
    },
    {
      id: 'lt:capture',
      name: 'Life Tracker: Capture properties',
      description: 'Open the property capture dialog for the active note',
      category: 'Life Tracker',
      action: async () => {
        const { get } = await import('svelte/store');
        const { activeNote } = await import('@/stores/vault/vault');
        const note = get(activeNote);
        if (!note?.path) {
          showToast('No active note — open a note first', 'warning');
          return;
        }
        const { startCapture } = await import('@/features/lifetracker');
        startCapture(note.path);
        showToast('Capture started', 'info');
      },
    },
    {
      id: 'lt:capture-today',
      name: 'Life Tracker: Capture today',
      description: 'Jump to today\'s daily note and start property capture',
      category: 'Life Tracker',
      action: async () => {
        const today = new Date().toISOString().slice(0, 10);
        const { startCapture } = await import('@/features/lifetracker');
        startCapture(`${today}.md`);
        showToast(`Capturing for ${today}`, 'info');
      },
    },
    {
      id: 'lt:refresh',
      name: 'Life Tracker: Refresh data',
      description: 'Rescan vault and refresh all visualizations',
      category: 'Life Tracker',
      action: async () => {
        const { refreshTrackerData } = await import('@/features/lifetracker');
        await refreshTrackerData();
        showToast('Tracker data refreshed', 'info');
      },
    },
  ];
}
