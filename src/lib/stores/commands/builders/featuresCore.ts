import type { Command } from '@/stores/commands/commands';
import type { DefaultCommandActions } from '@/stores/commands/defaultCommands';
import { get } from 'svelte/store';
import { showToast } from '@/stores/toast/toast';
import { activeNote } from '@/stores/vault/vault';

export function buildCoreFeatureCommands(actions: DefaultCommandActions): Command[] {
  return [
    {
      id: 'publish:site',
      name: 'Publish Site',
      description: 'Publish all notes marked with publish: true',
      category: 'Publishing',
      action: actions.publishSite ?? (() => {}),
    },
    {
      id: 'publish:toggle-flag',
      name: 'Publish: Toggle Publish Flag',
      description: 'Mark or unmark the active note for publishing',
      category: 'Publishing',
      action: async () => {
        const { togglePublishFlag } = await import('@/features/publishing');
        const note = get(activeNote);
        if (note?.path) {
          await togglePublishFlag(note.path);
          showToast('Publish flag toggled', 'info');
        }
      },
    },
    {
      id: 'changelog:update',
      name: 'Vault Changelog: Update',
      description: 'Manually refresh and write the vault changelog file',
      category: 'Vault',
      action: async () => {
        const { refreshChangelog, writeChangelogFile } = await import('@/features/changelog');
        await refreshChangelog();
        await writeChangelogFile();
      },
    },
    {
      id: 'template:insert',
      name: 'Insert Template',
      description: 'Create a new note from a template',
      category: 'Templates',
      shortcut: 'Cmd+Shift+T',
      action: actions.insertTemplate ?? (() => {}),
    },
    {
      id: 'template:new',
      name: 'New Template',
      description: 'Create a new template',
      category: 'Templates',
      action: actions.newTemplate ?? (() => {}),
    },
    // ─── Smart Templates commands ─────────────────────────────────────────
    {
      id: 'smart-template:open',
      name: 'Smart Templates: Open',
      description: 'Open the Smart Templates prompt builder from the active note',
      category: 'Templates',
      action: async () => {
        window.dispatchEvent(new CustomEvent('smart-template:open'));
      },
    },
    {
      id: 'smart-template:open-selection',
      name: 'Smart Templates: From Selection',
      description: 'Open Smart Templates using the current text selection as context',
      category: 'Templates',
      action: async () => {
        window.dispatchEvent(new CustomEvent('smart-template:open', { detail: { useSelection: true } }));
      },
    },
    {
      id: 'smart-template:clear-recent',
      name: 'Smart Templates: Clear Recent',
      description: 'Clear the list of recently built prompts',
      category: 'Templates',
      action: async () => {
        const { clearRecentPrompts } = await import('@/features/template');
        clearRecentPrompts();
        showToast('Recent prompts cleared', 'info');
      },
    },
    {
      id: 'smart-template:reset-config',
      name: 'Smart Templates: Reset Config',
      description: 'Restore default Smart Templates settings',
      category: 'Templates',
      action: async () => {
        const { resetSmartTemplateConfig } = await import('@/features/template');
        resetSmartTemplateConfig();
        showToast('Smart Templates config reset', 'info');
      },
    },
    {
      id: 'quest:open',
      name: 'Open Quest Panel',
      description: 'Open the XP and progress panel',
      category: 'Quest',
      action: actions.openQuest ?? (() => {}),
    },
    {
      id: 'quest:summary',
      name: 'Quest: XP Summary',
      description: "Show your current level, XP, and today's progress",
      category: 'Quest',
      action: async () => {
        const { getXpSummary } = await import('@/features/gamify');
        const s = getXpSummary();
        showToast(`Lv ${s.level} · ${s.totalXp.toLocaleString()} XP · +${s.todayXp} today · ${s.streak}d streak`, 'info');
      },
    },
    {
      id: 'manuscript:new-draft',
      name: 'New Draft Snapshot',
      description: 'Snapshot the active scene as a new versioned draft',
      category: 'Manuscript',
      action: async () => {
        const { createNewDraft } = await import('@/features/longform');
        await createNewDraft();
      },
    },
    {
      id: 'manuscript:status',
      name: 'Set Scene Status',
      description: "Change the active scene's workflow status",
      category: 'Manuscript',
      action: async () => {
        showToast('Use the Manuscript panel sidebar to change scene status', 'info');
      },
    },
    {
      id: 'arbor:new-root',
      name: 'Arbor: New Root Block',
      description: 'Create a new root block in the branching editor',
      category: 'Arbor',
      action: async () => {
        const { createRootBlock } = await import('@/features/arbor');
        createRootBlock();
      },
    },
    {
      id: 'arbor:new-child',
      name: 'Arbor: Create Child Block',
      description: 'Create a child block to the right of the selected block',
      category: 'Arbor',
      action: async () => {
        const { arborSelection, createChildBlock } = await import('@/features/arbor');
        const sel = get(arborSelection);
        if (sel.blockId) createChildBlock(sel.blockId);
      },
    },
    {
      id: 'arbor:undo',
      name: 'Arbor: Undo',
      description: 'Undo the last Arbor structural change',
      category: 'Arbor',
      action: async () => {
        const { arborUndo } = await import('@/features/arbor');
        arborUndo();
      },
    },
    {
      id: 'speedreader:start',
      name: 'Speed Reader: Start',
      description: 'Start speed reading the current note',
      category: 'Speed Reader',
      action: async () => {
        const { startSpeedReader } = await import('@/features/speedreader');
        const note = get(activeNote);
        if (note?.content) startSpeedReader(note.content);
        else showToast('No note content to read', 'warning');
      },
    },
    {
      id: 'speedreader:close',
      name: 'Speed Reader: Close',
      description: 'Close the speed reader',
      category: 'Speed Reader',
      action: async () => {
        const { stopSpeedReader } = await import('@/features/speedreader');
        stopSpeedReader();
      },
    },
    {
      id: 'gamify:add-task',
      name: 'Gamified Tasks: Add Task',
      description: 'Add a new gamified task',
      category: 'Gamified Tasks',
      action: async () => {
        showToast('Use the Gamify panel (sidebar) to add tasks', 'info');
      },
    },
    {
      id: 'gamify:purchase-reward',
      name: 'Gamified Tasks: Rewards',
      description: 'View and purchase rewards with earned coins',
      category: 'Gamified Tasks',
      action: async () => {
        showToast('Use the Gamify panel (sidebar) → Rewards tab', 'info');
      },
    },
    {
      id: 'periodic:open-daily',
      name: 'Open Daily Note',
      description: "Open or create today's daily note",
      category: 'Periodic Notes',
      shortcut: 'Cmd+Shift+D',
      action: async () => {
        const { openTodaysDailyNote } = await import('@/features/periodic');
        await openTodaysDailyNote();
      },
    },
    {
      id: 'journal:open-active',
      name: 'Journal: Open Current Note',
      description: 'Open or create note for active journal period',
      category: 'Journals',
      shortcut: 'Cmd+Shift+J',
      action: async () => {
        const { openActiveJournalNote } = await import('@/features/periodic');
        await openActiveJournalNote();
      },
    },
    {
      id: 'journal:nav-next',
      name: 'Journal: Next Period',
      description: 'Navigate to the next period in the active journal',
      category: 'Journals',
      action: async () => {
        const { navigateJournal } = await import('@/features/periodic');
        navigateJournal('next');
      },
    },
    {
      id: 'journal:nav-prev',
      name: 'Journal: Previous Period',
      description: 'Navigate to the previous period in the active journal',
      category: 'Journals',
      action: async () => {
        const { navigateJournal } = await import('@/features/periodic');
        navigateJournal('prev');
      },
    },
    {
      id: 'journal:go-today',
      name: 'Journal: Go to Today',
      description: 'Jump to the current date in the active journal',
      category: 'Journals',
      action: async () => {
        const { goToJournalToday } = await import('@/features/periodic');
        goToJournalToday();
      },
    },
    {
      id: 'voice:toggle-record',
      name: 'Voice: Toggle Recording',
      description: 'Start or stop voice recording',
      category: 'Voice',
      action: async () => {
        const { recordingState, startRecording, stopRecording } = await import('@/features/voice');
        if (get(recordingState) === 'idle') await startRecording();
        else await stopRecording();
      },
    },
    {
      id: 'rewarder:toggle',
      name: 'Rewarder: Toggle',
      description: 'Enable or disable task completion rewards',
      category: 'Gamify',
      action: async () => {
        const { getRewarderConfig, updateRewarderConfig } = await import('@/features/gamify');
        const enabled = !getRewarderConfig().enabled;
        updateRewarderConfig({ enabled });
        showToast(`Rewarder: ${enabled ? 'on' : 'off'}`, 'info');
      },
    },
    {
      id: 'rewarder:create-sample',
      name: 'Rewarder: Create sample rewards note',
      description: 'Create a Rewards.md file with example rewards',
      category: 'Gamify',
      action: async () => {
        const { generateSampleRewards, getRewarderConfig } = await import('@/features/gamify');
        const { writeNote } = await import('@/services/vault/vault');
        const config = getRewarderConfig();
        try {
          await writeNote(config.rewardsFile, generateSampleRewards());
          showToast(`Created ${config.rewardsFile}`, 'success');
        } catch {
          showToast('Failed to create rewards file', 'error');
        }
      },
    },
    {
      id: 'rewarder:clear-history',
      name: 'Rewarder: Clear award history',
      description: 'Remove all awarded reward records',
      category: 'Gamify',
      action: async () => {
        const { clearAwardHistory } = await import('@/features/gamify');
        clearAwardHistory();
        showToast('Award history cleared', 'info');
      },
    },
    {
      id: 'rewarder:reset-config',
      name: 'Rewarder: Reset configuration',
      description: 'Restore default rewarder settings',
      category: 'Gamify',
      action: async () => {
        const { resetRewarderConfig } = await import('@/features/gamify');
        resetRewarderConfig();
        showToast('Rewarder config reset to defaults', 'info');
      },
    },
  ];
}
