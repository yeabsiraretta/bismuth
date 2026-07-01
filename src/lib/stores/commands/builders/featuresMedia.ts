import type { Command } from '@/stores/commands/commands';
import { get } from 'svelte/store';
import { showToast } from '@/stores/toast/toast';
import { activeNote } from '@/stores/vault/vault';

export function buildMediaFeatureCommands(): Command[] {
  return [
    {
      id: 'flashcards:open-study-vault',
      name: 'Open Study Vault',
      description: 'Open courses, exam tracking, and flashcard study session',
      category: 'Flashcards',
      action: async () => {
        const { setActiveTab } = await import('@/stores/layout/layout');
        setActiveTab('right', 'flashcards');
      },
    },
    {
      id: 'flashcards:sync-to-anki',
      name: 'Flashcards: Sync to Anki',
      description: 'Sync scanned flashcards from the active note to Anki',
      category: 'Flashcards',
      action: async () => {
        const { syncToAnki, connectionStatus } = await import('@/features/flashcards');
        const { get: getStore } = await import('svelte/store');
        if (getStore(connectionStatus) !== 'connected') {
          showToast('Anki is not running. Open Anki with AnkiConnect installed.', 'warning');
          return;
        }
        const result = await syncToAnki();
        if (result) {
          showToast(`Synced to Anki: ${result.created} created, ${result.updated} updated`, 'info');
        }
      },
    },
    // ─── Cloze commands ─────────────────────────────────────────────────
    {
      id: 'cloze:toggle-all',
      name: 'Cloze: Toggle All',
      description: 'Show or hide all cloze deletions in the current note',
      category: 'Flashcards',
      action: async () => {
        const { toggleAllClozes } = await import('@/features/flashcards');
        const revealed = toggleAllClozes();
        showToast(`Clozes: ${revealed ? 'revealed' : 'hidden'}`, 'info');
      },
    },
    {
      id: 'cloze:toggle-enabled',
      name: 'Cloze: Toggle Feature',
      description: 'Enable or disable cloze rendering',
      category: 'Flashcards',
      action: async () => {
        const { toggleClozeEnabled } = await import('@/features/flashcards');
        const enabled = toggleClozeEnabled();
        showToast(`Cloze rendering: ${enabled ? 'on' : 'off'}`, 'info');
      },
    },
    {
      id: 'cloze:create',
      name: 'Cloze: Create from Selection',
      description: 'Wrap the selected text in a cloze span',
      category: 'Flashcards',
      action: async () => {
        const { wrapCloze } = await import('@/features/flashcards');
        window.dispatchEvent(new CustomEvent('editor-wrap-selection', {
          detail: { wrapper: (text: string) => wrapCloze(text) },
        }));
      },
    },
    {
      id: 'cloze:create-with-hint',
      name: 'Cloze: Create with Hint',
      description: 'Wrap the selected text in a cloze span with a custom hint',
      category: 'Flashcards',
      action: async () => {
        const { wrapCloze } = await import('@/features/flashcards');
        const hint = prompt('Enter cloze hint:');
        if (hint !== null) {
          window.dispatchEvent(new CustomEvent('editor-wrap-selection', {
            detail: { wrapper: (text: string) => wrapCloze(text, hint) },
          }));
        }
      },
    },
    {
      id: 'cloze:remove',
      name: 'Cloze: Remove from Selection',
      description: 'Remove cloze spans from the selected text',
      category: 'Flashcards',
      action: async () => {
        const { unwrapClozes } = await import('@/features/flashcards');
        window.dispatchEvent(new CustomEvent('editor-wrap-selection', {
          detail: { wrapper: (text: string) => unwrapClozes(text) },
        }));
      },
    },
    {
      id: 'cloze:toggle-hover',
      name: 'Cloze: Toggle Hover Reveal',
      description: 'Enable or disable revealing clozes on mouse hover',
      category: 'Flashcards',
      action: async () => {
        const { toggleHoverReveal } = await import('@/features/flashcards');
        const enabled = toggleHoverReveal();
        showToast(`Hover reveal: ${enabled ? 'on' : 'off'}`, 'info');
      },
    },
    {
      id: 'cloze:toggle-fixed-width',
      name: 'Cloze: Toggle Fixed Width',
      description: 'Enable or disable fixed-width cloze blanks',
      category: 'Flashcards',
      action: async () => {
        const { toggleFixedWidth } = await import('@/features/flashcards');
        const enabled = toggleFixedWidth();
        showToast(`Fixed-width cloze: ${enabled ? 'on' : 'off'}`, 'info');
      },
    },
    {
      id: 'cloze:reset-config',
      name: 'Cloze: Reset Configuration',
      description: 'Restore default cloze settings',
      category: 'Flashcards',
      action: async () => {
        const { resetClozeConfig } = await import('@/features/flashcards');
        resetClozeConfig();
        showToast('Cloze config reset', 'info');
      },
    },
    {
      id: 'annotator:open',
      name: 'Annotator: Open',
      description: 'Open the PDF/EPUB annotator for the active note',
      category: 'Annotator',
      action: async () => {
        const note = get(activeNote);
        if (!note?.frontmatter?.['annotation-target']) {
          showToast('No annotation-target in frontmatter', 'warning');
          return;
        }
        const { openAnnotationNote } = await import('@/features/annotator');
        await openAnnotationNote(note.path);
      },
    },
    {
      id: 'annotator:toggle-dark-mode',
      name: 'Annotator: Toggle Dark Mode',
      description: 'Toggle dark mode in the document reader',
      category: 'Annotator',
      action: async () => {
        const { toggleDarkMode } = await import('@/features/annotator');
        toggleDarkMode();
      },
    },
    {
      id: 'annotator:close',
      name: 'Annotator: Close',
      description: 'Close the annotator panel',
      category: 'Annotator',
      action: async () => {
        const { closeAnnotator } = await import('@/features/annotator');
        closeAnnotator();
      },
    },
    {
      id: 'annotator:toggle-sidebar',
      name: 'Annotator: Toggle Sidebar',
      description: 'Show or hide the annotation sidebar',
      category: 'Annotator',
      action: async () => {
        const { toggleSidebar } = await import('@/features/annotator');
        toggleSidebar();
      },
    },
    {
      id: 'backup:now',
      name: 'Backup: Create Backup Now',
      description: 'Create a zip backup of the current vault',
      category: 'Vault',
      action: async () => {
        const { triggerBackup } = await import('@/features/backup');
        await triggerBackup();
      },
    },
    {
      id: 'backup:named',
      name: 'Backup: Create Named Backup',
      description: 'Create a named backup that is exempt from auto-cleanup',
      category: 'Vault',
      action: async () => {
        const name = prompt('Enter a name for this backup:');
        if (!name) return;
        const { triggerBackup } = await import('@/features/backup');
        await triggerBackup(name);
      },
    },
    {
      id: 'home:open',
      name: 'Home Tab: Open Home Tab',
      description: 'Switch to the home tab view',
      category: 'Navigation',
      action: async () => {
        const { setViewportMode } = await import('@/stores/layout/presets');
        setViewportMode('home');
      },
    },
    {
      id: 'home:random-note',
      name: 'Home Tab: Open Random Note',
      description: 'Open a random note from the vault',
      category: 'Navigation',
      action: async () => {
        const { notes: notesStore } = await import('@/stores/vault/vault');
        const { get } = await import('svelte/store');
        const { openNote } = await import('@/appNavigation');
        const all = get(notesStore).filter(n => n.path.endsWith('.md'));
        if (all.length > 0) {
          const pick = all[Math.floor(Math.random() * all.length)];
          openNote(pick.path);
        }
      },
    },
    {
      id: 'home:bookmark-current',
      name: 'Home Tab: Bookmark Current Note',
      description: 'Add or remove the current note from home tab bookmarks',
      category: 'Navigation',
      action: async () => {
        const { activeNote } = await import('@/stores/vault/vault');
        const { get } = await import('svelte/store');
        const note = get(activeNote);
        if (!note?.path) return;
        const { isBookmarked, addBookmark, removeBookmark } = await import('@/features/hometab');
        if (isBookmarked(note.path)) {
          removeBookmark(note.path);
          showToast('Bookmark removed', 'info');
        } else {
          addBookmark(note.path, note.title);
          showToast('Bookmarked', 'success');
        }
      },
    },
    {
      id: 'code-editor:toggle-word-wrap',
      name: 'Code Editor: Toggle Word Wrap',
      description: 'Toggle word wrapping in the code editor',
      category: 'Code Editor',
      shortcut: 'Alt+Z',
      action: async () => {
        const { updateCodeEditorConfig, codeEditorConfig } = await import('@/features/code-editor');
        const { get: getStore } = await import('svelte/store');
        const cfg = getStore(codeEditorConfig);
        updateCodeEditorConfig({ wordWrap: !cfg.wordWrap });
        showToast(`Word wrap: ${!cfg.wordWrap ? 'on' : 'off'}`, 'info');
      },
    },
    {
      id: 'code-editor:toggle-minimap',
      name: 'Code Editor: Toggle Minimap',
      description: 'Show or hide the code minimap',
      category: 'Code Editor',
      action: async () => {
        const { updateCodeEditorConfig, codeEditorConfig } = await import('@/features/code-editor');
        const { get: getStore } = await import('svelte/store');
        const cfg = getStore(codeEditorConfig);
        updateCodeEditorConfig({ minimap: !cfg.minimap });
        showToast(`Minimap: ${!cfg.minimap ? 'on' : 'off'}`, 'info');
      },
    },
    {
      id: 'code-editor:toggle-line-numbers',
      name: 'Code Editor: Toggle Line Numbers',
      description: 'Show or hide line numbers in the code editor',
      category: 'Code Editor',
      action: async () => {
        const { updateCodeEditorConfig, codeEditorConfig } = await import('@/features/code-editor');
        const { get: getStore } = await import('svelte/store');
        const cfg = getStore(codeEditorConfig);
        updateCodeEditorConfig({ lineNumbers: !cfg.lineNumbers });
        showToast(`Line numbers: ${!cfg.lineNumbers ? 'on' : 'off'}`, 'info');
      },
    },
    {
      id: 'recipe:view',
      name: 'Recipe: Open Recipe View',
      description: 'Load current note as interactive recipe card',
      category: 'Recipe',
      action: async () => {
        const note = get(activeNote);
        if (!note) { showToast('No note open', 'warning'); return; }
        const { loadRecipe } = await import('@/features/recipe');
        loadRecipe(note.content, note.title);
        showToast('Recipe loaded', 'info');
      },
    },
    {
      id: 'recipe:scale-half',
      name: 'Recipe: Scale to Half',
      description: 'Scale recipe ingredients to 0.5x',
      category: 'Recipe',
      action: async () => {
        const { setScale } = await import('@/features/recipe');
        setScale(0.5);
      },
    },
    {
      id: 'recipe:scale-double',
      name: 'Recipe: Scale to Double',
      description: 'Scale recipe ingredients to 2x',
      category: 'Recipe',
      action: async () => {
        const { setScale } = await import('@/features/recipe');
        setScale(2);
      },
    },
    {
      id: 'recipe:next-step',
      name: 'Recipe: Next Step',
      description: 'Advance to next cooking step',
      category: 'Recipe',
      action: async () => {
        const { nextStep } = await import('@/features/recipe');
        nextStep();
      },
    },
    {
      id: 'recipe:prev-step',
      name: 'Recipe: Previous Step',
      description: 'Go back to previous cooking step',
      category: 'Recipe',
      action: async () => {
        const { prevStep } = await import('@/features/recipe');
        prevStep();
      },
    },
    {
      id: 'recipe:grab',
      name: 'Recipe: Grab from URL',
      description: 'Fetch a recipe from a URL and create a new note',
      category: 'Recipe',
      action: async () => {
        const url = prompt('Paste recipe URL:');
        if (!url?.trim()) return;
        try {
          const { grabRecipeAsNote } = await import('@/features/recipe');
          const path = await grabRecipeAsNote(url.trim());
          const { openNote } = await import('@/appNavigation');
          await openNote(path);
          showToast('Recipe grabbed!', 'info');
        } catch (e) {
          showToast(`Grab failed: ${e instanceof Error ? e.message : e}`, 'error');
        }
      },
    },
    {
      id: 'recipe:reset-template',
      name: 'Recipe: Reset Grabber Template',
      description: 'Reset the recipe grabber template to default',
      category: 'Recipe',
      action: async () => {
        const { resetTemplate } = await import('@/features/recipe');
        resetTemplate();
        showToast('Template reset to default', 'info');
      },
    },
  ];
}
