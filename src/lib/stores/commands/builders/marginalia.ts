import type { Command } from '@/stores/commands/commands';
import { showToast } from '@/stores/toast/toast';

export function buildMarginaliaCommands(): Command[] {
  return [
    {
      id: 'marginalia:open',
      name: 'Marginalia: Open explorer',
      description: 'Open the Marginalia Explorer sidebar',
      category: 'Marginalia',
      action: async () => {
        showToast('Open Marginalia from the sidebar', 'info');
      },
    },
    {
      id: 'marginalia:insert',
      name: 'Marginalia: Insert margin note',
      description: 'Insert %%> %% syntax at cursor or wrap selection',
      category: 'Marginalia',
      action: async () => {
        showToast('Place cursor in editor, then use %%> note text %%', 'info');
      },
    },
    {
      id: 'marginalia:insert-block',
      name: 'Marginalia: Insert cornell block',
      description: 'Wrap selected text in a cornell fenced block',
      category: 'Marginalia',
      action: async () => {
        showToast('Select text, then use this command to wrap in ```cornell block', 'info');
      },
    },
    {
      id: 'marginalia:toggle-recall',
      name: 'Marginalia: Toggle Active Recall',
      description: 'Toggle blur mode for study/active recall',
      category: 'Marginalia',
      action: async () => {
        const { toggleActiveRecall } = await import('@/features/marginalia');
        toggleActiveRecall();
        showToast('Active Recall toggled', 'info');
      },
    },
    {
      id: 'marginalia:flashcards',
      name: 'Marginalia: Generate flashcards',
      description: 'Generate flashcards from blur-tagged margin notes',
      category: 'Marginalia',
      action: async () => {
        const { get } = await import('svelte/store');
        const { activeNote } = await import('@/stores/vault/vault');
        const note = get(activeNote);
        if (!note?.content) {
          showToast('No active note', 'warning');
          return;
        }
        const { injectFlashcards } = await import('@/features/marginalia');
        const { writeNote } = await import('@/services/vault/vault');
        const updated = injectFlashcards(note.content, note.path);
        await writeNote(note.path, updated);
        showToast('Flashcards generated!', 'info');
      },
    },
    {
      id: 'marginalia:capture',
      name: 'Marginalia: Quick capture (Omni-Capture)',
      description: 'Open the quick margin note capture modal',
      category: 'Marginalia',
      action: async () => {
        showToast('Use Alt+C to open Omni-Capture from anywhere', 'info');
      },
    },
    {
      id: 'marginalia:scan-vault',
      name: 'Marginalia: Scan vault',
      description: 'Rescan all vault files for margin notes',
      category: 'Marginalia',
      action: async () => {
        const { scanVaultNotes } = await import('@/features/marginalia');
        await scanVaultNotes();
        showToast('Vault scanned for marginalia', 'info');
      },
    },
    {
      id: 'marginalia:toggle-reading',
      name: 'Marginalia: Toggle reading view',
      description: 'Show or hide marginalia in reading mode',
      category: 'Marginalia',
      action: async () => {
        const { toggleReadingView } = await import('@/features/marginalia');
        toggleReadingView();
        showToast('Reading view toggled', 'info');
      },
    },
  ];
}
