import type { Command } from '@/stores/commands/commands';
import { showToast } from '@/stores/toast/toast';

export function buildProductivityFeatureCommands(): Command[] {
  return [
    {
      id: 'timekeep:new',
      name: 'Timekeep: New Tracker',
      description: 'Create a new timekeep time tracker',
      category: 'Timekeep',
      action: async () => {
        const { addTimekeep } = await import('@/features/timekeep');
        addTimekeep('Untitled Timekeep');
        showToast('New timekeep created', 'info');
      },
    },
    {
      id: 'timekeep:stop-all',
      name: 'Timekeep: Stop All Timers',
      description: 'Stop all running timekeep timers',
      category: 'Timekeep',
      action: async () => {
        const { stopAllTimers } = await import('@/features/timekeep');
        stopAllTimers();
        showToast('All timers stopped', 'info');
      },
    },
    {
      id: 'timekeep:export-md',
      name: 'Timekeep: Export as Markdown',
      description: 'Copy the active timekeep as a Markdown table',
      category: 'Timekeep',
      action: async () => {
        const { timekeeps, exportTimekeep } = await import('@/features/timekeep');
        const { get } = await import('svelte/store');
        const tks = get(timekeeps);
        if (tks.length === 0) { showToast('No timekeeps to export', 'warning'); return; }
        const output = exportTimekeep(tks[0].data, { format: 'markdown' });
        await navigator.clipboard.writeText(output);
        showToast('Markdown table copied to clipboard', 'info');
      },
    },
    {
      id: 'timekeep:export-csv',
      name: 'Timekeep: Export as CSV',
      description: 'Copy the active timekeep as CSV',
      category: 'Timekeep',
      action: async () => {
        const { timekeeps, exportTimekeep } = await import('@/features/timekeep');
        const { get } = await import('svelte/store');
        const tks = get(timekeeps);
        if (tks.length === 0) { showToast('No timekeeps to export', 'warning'); return; }
        const output = exportTimekeep(tks[0].data, { format: 'csv' });
        await navigator.clipboard.writeText(output);
        showToast('CSV copied to clipboard', 'info');
      },
    },
    {
      id: 'timekeep:export-json',
      name: 'Timekeep: Export as JSON',
      description: 'Copy the active timekeep as JSON',
      category: 'Timekeep',
      action: async () => {
        const { timekeeps, exportTimekeep } = await import('@/features/timekeep');
        const { get } = await import('svelte/store');
        const tks = get(timekeeps);
        if (tks.length === 0) { showToast('No timekeeps to export', 'warning'); return; }
        const output = exportTimekeep(tks[0].data, { format: 'json' });
        await navigator.clipboard.writeText(output);
        showToast('JSON copied to clipboard', 'info');
      },
    },
  ];
}
