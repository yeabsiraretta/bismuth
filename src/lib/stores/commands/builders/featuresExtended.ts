import type { Command } from '@/stores/commands/commands';
import { get } from 'svelte/store';
import { showToast } from '@/stores/toast/toast';
import { activeNote } from '@/stores/vault/vault';

export function buildExtendedFeatureCommands(): Command[] {
  return [
    {
      id: 'symbols:toggle',
      name: 'Symbol Prettifier: Toggle',
      description: 'Enable or disable live symbol replacement',
      category: 'Symbols',
      action: async () => {
        const { toggleSymbols, isEnabled } = await import('@/features/symbols');
        toggleSymbols();
        showToast(`Symbol prettifier: ${isEnabled() ? 'on' : 'off'}`, 'info');
      },
    },
    {
      id: 'symbols:prettify-doc',
      name: 'Symbol Prettifier: Prettify Document',
      description: 'Replace all ASCII symbol sequences in current note',
      category: 'Symbols',
      action: async () => {
        const note = get(activeNote);
        if (!note) {
          showToast('No note open', 'warning');
          return;
        }
        const { prettifyText, getRules } = await import('@/features/symbols');
        const result = prettifyText(note.content, getRules());
        if (result !== note.content) {
          window.dispatchEvent(new CustomEvent('editor-insert-text', { detail: { text: result } }));
          showToast('Document prettified', 'info');
        } else {
          showToast('No symbols to replace', 'info');
        }
      },
    },
    {
      id: 'symbols:reset-rules',
      name: 'Symbol Prettifier: Reset Rules',
      description: 'Restore default symbol replacement rules',
      category: 'Symbols',
      action: async () => {
        const { resetRules } = await import('@/features/symbols');
        resetRules();
        showToast('Symbol rules reset to defaults', 'info');
      },
    },
    {
      id: 'abc:insert-sample',
      name: 'ABC Music: Insert sample notation',
      description: 'Insert a sample ABC music notation code block at cursor',
      category: 'Music',
      action: async () => {
        const { sampleAbcBlock } = await import('@/features/music');
        const text = sampleAbcBlock();
        window.dispatchEvent(new CustomEvent('editor-insert-text', { detail: { text } }));
        showToast('ABC notation block inserted', 'info');
      },
    },
    {
      id: 'chords:insert-sample',
      name: 'Chord Sheets: Insert sample chord sheet',
      description: 'Insert a sample chord sheet code block at cursor',
      category: 'Music',
      action: async () => {
        const { sampleChordSheet } = await import('@/features/music');
        const text = sampleChordSheet();
        window.dispatchEvent(new CustomEvent('editor-insert-text', { detail: { text } }));
        showToast('Chord sheet block inserted', 'info');
      },
    },
    {
      id: 'chords:transpose-up',
      name: 'Chord Sheets: Transpose up',
      description: 'Transpose all chord blocks up by one semitone',
      category: 'Music',
      action: async () => {
        showToast('Use the transpose controls in the chord sheet toolbar', 'info');
      },
    },
    {
      id: 'chords:transpose-down',
      name: 'Chord Sheets: Transpose down',
      description: 'Transpose all chord blocks down by one semitone',
      category: 'Music',
      action: async () => {
        showToast('Use the transpose controls in the chord sheet toolbar', 'info');
      },
    },
    {
      id: 'audio-player:insert-sample',
      name: 'Audio Player: Insert sample block',
      description: 'Insert a sample audio-player code block at cursor',
      category: 'Music',
      action: async () => {
        const { sampleAudioPlayerBlock } = await import('@/features/music');
        const text = sampleAudioPlayerBlock();
        window.dispatchEvent(new CustomEvent('editor-insert-text', { detail: { text } }));
        showToast('Audio player block inserted', 'info');
      },
    },
    {
      id: 'audio-player:pause',
      name: 'Audio Player: Pause',
      description: 'Pause the currently playing audio',
      category: 'Music',
      action: async () => {
        const { pauseAudio, playerStatus } = await import('@/features/music');
        const status = get(playerStatus);
        if (status === 'playing') {
          pauseAudio();
          showToast('Audio paused', 'info');
        } else {
          showToast('No audio playing', 'warning');
        }
      },
    },
    {
      id: 'audio-player:resume',
      name: 'Audio Player: Resume',
      description: 'Resume the paused audio',
      category: 'Music',
      action: async () => {
        const { playAudio, playerStatus } = await import('@/features/music');
        const status = get(playerStatus);
        if (status === 'paused') {
          playAudio();
          showToast('Audio resumed', 'info');
        } else {
          showToast('No paused audio to resume', 'warning');
        }
      },
    },
    {
      id: 'audio-player:stop',
      name: 'Audio Player: Stop',
      description: 'Stop playback and reset position',
      category: 'Music',
      action: async () => {
        const { stopAudio } = await import('@/features/music');
        stopAudio();
        showToast('Audio stopped', 'info');
      },
    },
    {
      id: 'marp:open-preview',
      name: 'Marp: Open Preview',
      description: 'Open a slide preview for the current Marp note',
      category: 'Note Slides',
      action: async () => {
        window.dispatchEvent(new CustomEvent('marp-open-preview'));
        showToast('Opening Marp preview...', 'info');
      },
    },
    {
      id: 'marp:pause-audio',
      name: 'Marp: Pause Audio',
      description: 'Pause whatever audio is playing',
      category: 'Note Slides',
      action: async () => {
        const { stopMarpPresentation, isPresenting } = await import('@/features/note-slides');
        const presenting = get(isPresenting);
        if (presenting) {
          stopMarpPresentation();
          showToast('Presentation stopped', 'info');
        } else {
          showToast('No active presentation', 'warning');
        }
      },
    },
    {
      id: 'marp:resume-audio',
      name: 'Marp: Resume Audio',
      description: 'Resume the paused audio',
      category: 'Note Slides',
      action: async () => {
        showToast('Use the Marp preview controls to navigate slides', 'info');
      },
    },
    {
      id: 'marp:export',
      name: 'Marp: Export Slides',
      description: 'Export the current presentation as HTML',
      category: 'Note Slides',
      action: async () => {
        const { activePresentation, exportAsHtml } = await import('@/features/note-slides');
        const pres = get(activePresentation);
        if (!pres) {
          showToast('No active Marp presentation to export', 'warning');
          return;
        }
        const html = exportAsHtml(pres);
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${pres.notePath.replace(/\.md$/, '') || 'slides'}.html`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Slides exported as HTML', 'info');
      },
    },
    {
      id: 'journal-review:open',
      name: 'Journal Review: Open "On This Day"',
      description: 'Open the On This Day review panel',
      category: 'Journal Review',
      action: async () => {
        window.dispatchEvent(new CustomEvent('journal-review-open'));
        showToast('Opening Journal Review...', 'info');
      },
    },
    {
      id: 'journal-review:refresh',
      name: 'Journal Review: Refresh',
      description: 'Refresh the On This Day review',
      category: 'Journal Review',
      action: async () => {
        window.dispatchEvent(new CustomEvent('journal-review-refresh'));
        showToast('Refreshing review...', 'info');
      },
    },
    {
      id: 'journal-review:random',
      name: 'Journal Review: Random Note',
      description: 'Show a random note from the vault',
      category: 'Journal Review',
      action: async () => {
        window.dispatchEvent(new CustomEvent('journal-review-random'));
        showToast('Shuffling random note...', 'info');
      },
    },
    {
      id: 'journal-review:ensure-frontmatter',
      name: 'Journal Review: Add Creation Date to Note',
      description: 'Ensure the current note has a creation date in frontmatter',
      category: 'Journal Review',
      action: async () => {
        window.dispatchEvent(new CustomEvent('journal-review-ensure-frontmatter'));
        showToast('Adding creation date to frontmatter...', 'info');
      },
    },
    {
      id: 'progressbar:insert-sample',
      name: 'Progress Bar: Insert sample',
      description: 'Insert sample progressbar code blocks at cursor',
      category: 'Progress Bar',
      action: async () => {
        const { sampleProgressBarBlock } = await import('@/features/progressbar');
        const text = sampleProgressBarBlock();
        window.dispatchEvent(new CustomEvent('editor-insert-text', { detail: { text } }));
        showToast('Progress bar blocks inserted', 'info');
      },
    },
    // ─── Keyshots commands ────────────────────────────────────────────────
    {
      id: 'keyshots:change-preset',
      name: 'Keyshots: Change Preset',
      description:
        'Cycle through IDE hotkey presets (Clear, Keyshots, VS Code, JetBrains, Visual Studio)',
      category: 'Editor',
      action: async () => {
        const { cyclePreset } = await import('@/features/keyshots');
        const label = cyclePreset();
        showToast(`Keyshots preset: ${label}`, 'info');
      },
    },
    {
      id: 'keyshots:set-vscode',
      name: 'Keyshots: VS Code Preset',
      description: 'Switch to Visual Studio Code hotkey mappings',
      category: 'Editor',
      action: async () => {
        const { setPreset } = await import('@/features/keyshots');
        setPreset('vscode');
        showToast('Keyshots: VS Code preset active', 'info');
      },
    },
    {
      id: 'keyshots:set-jetbrains',
      name: 'Keyshots: JetBrains Preset',
      description: 'Switch to JetBrains IDEs hotkey mappings',
      category: 'Editor',
      action: async () => {
        const { setPreset } = await import('@/features/keyshots');
        setPreset('jetbrains');
        showToast('Keyshots: JetBrains preset active', 'info');
      },
    },
    {
      id: 'keyshots:set-visual-studio',
      name: 'Keyshots: Visual Studio Preset',
      description: 'Switch to Microsoft Visual Studio hotkey mappings',
      category: 'Editor',
      action: async () => {
        const { setPreset } = await import('@/features/keyshots');
        setPreset('visual-studio');
        showToast('Keyshots: Visual Studio preset active', 'info');
      },
    },
    {
      id: 'keyshots:set-clear',
      name: 'Keyshots: Clear Preset',
      description: 'Remove all Keyshots hotkeys (blank slate)',
      category: 'Editor',
      action: async () => {
        const { setPreset } = await import('@/features/keyshots');
        setPreset('clear');
        showToast('Keyshots: all hotkeys cleared', 'info');
      },
    },
    {
      id: 'keyshots:toggle-case-sensitive',
      name: 'Keyshots: Toggle Case Sensitivity',
      description: 'Toggle case-sensitive sorting for sort commands',
      category: 'Editor',
      action: async () => {
        const { toggleCaseSensitiveSorting } = await import('@/features/keyshots');
        const enabled = toggleCaseSensitiveSorting();
        showToast(`Case-sensitive sorting: ${enabled ? 'on' : 'off'}`, 'info');
      },
    },
    {
      id: 'keyshots:reset-config',
      name: 'Keyshots: Reset Configuration',
      description: 'Restore default Keyshots settings',
      category: 'Editor',
      action: async () => {
        const { resetKeyshotsConfig } = await import('@/features/keyshots');
        resetKeyshotsConfig();
        showToast('Keyshots config reset', 'info');
      },
    },
  ];
}
