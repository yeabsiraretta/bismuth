<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import SettingsGeneral from '@/components/settings/SettingsGeneral.svelte';
  import SettingsEditor from '@/components/settings/SettingsEditor.svelte';
  import SettingsAppearance from '@/components/settings/SettingsAppearance.svelte';
  import SettingsVault from '@/components/settings/SettingsVault.svelte';
  import SettingsHotkeys from '@/components/settings/SettingsHotkeys.svelte';
  import SettingsAbout from '@/components/settings/SettingsAbout.svelte';
  import { currentVault } from '@/stores/vault/vault';
  import { invoke } from '@tauri-apps/api/core';
  import { onMount, onDestroy } from 'svelte';
  import { log } from '@/utils/logger';
  import { createFocusTrap, type FocusTrapInstance } from '@/utils/accessibility/focusTrap';

  export let isOpen = false;
  export let onClose: () => void;

  type SettingsTab = 'general' | 'editor' | 'appearance' | 'vault' | 'hotkeys' | 'about';
  let activeTab: SettingsTab = 'general';

  // General settings
  let autoSave = true;
  let autoSaveDelay = 500;
  let confirmBeforeDelete = true;
  let defaultNoteLocation = '';
  let dateFormat = 'YYYY-MM-DD';
  let timeFormat = '24h';

  // Editor settings
  let fontSize = 16;
  let lineHeight = 1.6;
  let fontFamily = 'Inter';
  let showLineNumbers = false;
  let wordWrap = true;
  let spellCheck = true;
  let tabSize = 2;
  let insertSpaces = true;
  let trimTrailingWhitespace = true;

  // Appearance settings
  let accentColor = '#6366f1';
  let showStatusBar = true;
  let compactMode = false;

  // Vault settings
  let vaultPath = $currentVault?.root_path || '';
  let vaultName = $currentVault?.name || '';
  let enableGit = false;
  let autoCommit = false;
  let syncOnStartup = false;

  const hotkeys = [
    { action: 'New Note', key: '⌘N', editable: false },
    { action: 'Search', key: '⌘P', editable: false },
    { action: 'Toggle Sidebar', key: '⌘B', editable: false },
    { action: 'Delete Note', key: '⌘⌫', editable: false },
    { action: 'Save', key: '⌘S', editable: false },
    { action: 'Settings', key: '⌘,', editable: false },
  ];

  onMount(() => loadSettings());

  function loadSettings() {
    try {
      const saved = localStorage.getItem('bismuth-settings');
      if (!saved) return;
      const s = JSON.parse(saved);
      autoSave = s.autoSave ?? autoSave;
      autoSaveDelay = s.autoSaveDelay ?? autoSaveDelay;
      confirmBeforeDelete = s.confirmBeforeDelete ?? confirmBeforeDelete;
      defaultNoteLocation = s.defaultNoteLocation ?? defaultNoteLocation;
      dateFormat = s.dateFormat ?? dateFormat;
      timeFormat = s.timeFormat ?? timeFormat;
      fontSize = s.fontSize ?? fontSize;
      lineHeight = s.lineHeight ?? lineHeight;
      fontFamily = s.fontFamily ?? fontFamily;
      showLineNumbers = s.showLineNumbers ?? showLineNumbers;
      wordWrap = s.wordWrap ?? wordWrap;
      spellCheck = s.spellCheck ?? spellCheck;
      tabSize = s.tabSize ?? tabSize;
      insertSpaces = s.insertSpaces ?? insertSpaces;
      trimTrailingWhitespace = s.trimTrailingWhitespace ?? trimTrailingWhitespace;
      accentColor = s.accentColor ?? accentColor;
      showStatusBar = s.showStatusBar ?? showStatusBar;
      compactMode = s.compactMode ?? compactMode;
      enableGit = s.enableGit ?? enableGit;
      autoCommit = s.autoCommit ?? autoCommit;
      syncOnStartup = s.syncOnStartup ?? syncOnStartup;
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem(
        'bismuth-settings',
        JSON.stringify({
          autoSave,
          autoSaveDelay,
          confirmBeforeDelete,
          defaultNoteLocation,
          dateFormat,
          timeFormat,
          fontSize,
          lineHeight,
          fontFamily,
          showLineNumbers,
          wordWrap,
          spellCheck,
          tabSize,
          insertSpaces,
          trimTrailingWhitespace,
          accentColor,
          showStatusBar,
          compactMode,
          enableGit,
          autoCommit,
          syncOnStartup,
        })
      );
      document.documentElement.style.setProperty('--editor-font-size', `${fontSize}px`);
      document.documentElement.style.setProperty('--editor-line-height', `${lineHeight}`);
      document.documentElement.style.setProperty('--editor-font-family', fontFamily);
      onClose();
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }

  function resetToDefaults() {
    if (confirm('Reset all settings to defaults? This cannot be undone.')) {
      localStorage.removeItem('bismuth-settings');
      // Reset all local variables to their defaults
      autoSave = true;
      autoSaveDelay = 500;
      confirmBeforeDelete = true;
      defaultNoteLocation = '';
      dateFormat = 'YYYY-MM-DD';
      timeFormat = '24h';
      fontSize = 16;
      lineHeight = 1.6;
      fontFamily = 'Inter';
      showLineNumbers = false;
      wordWrap = true;
      spellCheck = true;
      tabSize = 2;
      insertSpaces = true;
      trimTrailingWhitespace = true;
      accentColor = '#6366f1';
      showStatusBar = true;
      compactMode = false;
      enableGit = false;
      autoCommit = false;
      syncOnStartup = false;
    }
  }

  async function openVaultFolder() {
    if (!vaultPath) return;
    try {
      await invoke('open_in_file_manager', { path: vaultPath });
      log.info('Opened vault folder', { path: vaultPath });
    } catch (error) {
      log.error('Failed to open vault folder', error as Error, { path: vaultPath });
    }
  }

  let modalEl: HTMLElement;
  let trap: FocusTrapInstance | null = null;

  $: if (isOpen && modalEl) {
    trap = createFocusTrap(modalEl, { onEscape: onClose, returnFocus: true });
    trap.activate();
  }

  $: if (!isOpen && trap) {
    trap.deactivate();
    trap = null;
  }

  onDestroy(() => trap?.deactivate());

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') onClose();
  }
</script>

{#if isOpen}
  <div class="settings-overlay" on:click={onClose} on:keydown={handleKeydown} role="presentation">
    <div
      class="settings-modal"
      bind:this={modalEl}
      on:click|stopPropagation
      on:keydown|stopPropagation
      role="dialog"
      aria-label="Settings"
      aria-modal="true"
      tabindex="-1"
    >
      <div class="modal-header">
        <h2>Settings</h2>
        <button class="close-btn" on:click={onClose} title="Close" aria-label="Close settings">
          <Icon name="x" size={20} />
        </button>
      </div>

      <div class="modal-body grid grid-cols-12 gap-md">
        <div class="settings-sidebar col-span-3">
          <button
            class="tab-btn"
            class:active={activeTab === 'general'}
            on:click={() => (activeTab = 'general')}
          >
            <Icon name="settings" size={16} />
            General
          </button>
          <button
            class="tab-btn"
            class:active={activeTab === 'editor'}
            on:click={() => (activeTab = 'editor')}
          >
            <Icon name="edit-3" size={16} />
            Editor
          </button>
          <button
            class="tab-btn"
            class:active={activeTab === 'appearance'}
            on:click={() => (activeTab = 'appearance')}
          >
            <Icon name="palette" size={16} />
            Appearance
          </button>
          <button
            class="tab-btn"
            class:active={activeTab === 'vault'}
            on:click={() => (activeTab = 'vault')}
          >
            <Icon name="folder" size={16} />
            Vault
          </button>
          <button
            class="tab-btn"
            class:active={activeTab === 'hotkeys'}
            on:click={() => (activeTab = 'hotkeys')}
          >
            <Icon name="command" size={16} />
            Hotkeys
          </button>
          <button
            class="tab-btn"
            class:active={activeTab === 'about'}
            on:click={() => (activeTab = 'about')}
          >
            <Icon name="info" size={16} />
            About
          </button>
        </div>

        <div class="settings-content col-span-9">
          {#if activeTab === 'general'}
            <SettingsGeneral
              bind:autoSave
              bind:autoSaveDelay
              bind:confirmBeforeDelete
              bind:defaultNoteLocation
              bind:dateFormat
              bind:timeFormat
            />
          {:else if activeTab === 'editor'}
            <SettingsEditor
              bind:fontSize
              bind:lineHeight
              bind:fontFamily
              bind:showLineNumbers
              bind:wordWrap
              bind:spellCheck
              bind:tabSize
              bind:insertSpaces
              bind:trimTrailingWhitespace
            />
          {:else if activeTab === 'appearance'}
            <SettingsAppearance bind:accentColor bind:showStatusBar bind:compactMode />
          {:else if activeTab === 'vault'}
            <SettingsVault
              {vaultName}
              {vaultPath}
              bind:enableGit
              bind:autoCommit
              bind:syncOnStartup
              onOpenFolder={openVaultFolder}
            />
          {:else if activeTab === 'hotkeys'}
            <SettingsHotkeys {hotkeys} />
          {:else if activeTab === 'about'}
            <SettingsAbout />
          {/if}
        </div>
      </div>

      <div class="modal-footer">
        <button class="cancel-btn" on:click={resetToDefaults}>Reset to Defaults</button>
        <div class="spacer"></div>
        <button class="cancel-btn" on:click={onClose}>Cancel</button>
        <button class="save-btn" on:click={saveSettings}>Save Settings</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .settings-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .settings-modal {
    width: 90%;
    max-width: 900px;
    height: 80vh;
    background-color: var(--background-primary);
    border-radius: var(--radius-l);
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.25);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-m) var(--spacing-l);
    border-bottom: 1px solid var(--border-color);
  }

  .modal-header h2 {
    font-size: var(--font-ui-large);
    font-weight: 600;
    color: var(--text-normal);
    margin: 0;
  }

  .close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: none;
    border: none;
    border-radius: var(--radius-s);
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .close-btn:hover {
    background-color: var(--background-modifier-hover);
    color: var(--text-normal);
  }

  .close-btn:focus-visible {
    outline: 2px solid var(--interactive-accent);
    outline-offset: 2px;
  }

  .modal-body {
    flex: 1;
    overflow: hidden;
  }

  .settings-sidebar {
    background-color: var(--background-secondary);
    border-right: 1px solid var(--border-color);
    padding: var(--spacing-s) var(--spacing-xs);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xxs, 2px);
  }

  .tab-btn {
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
    width: 100%;
    padding: var(--spacing-xs) var(--spacing-s);
    background: none;
    border: none;
    border-radius: var(--radius-s);
    color: var(--text-muted);
    font-size: var(--font-ui-small);
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: left;
  }

  .tab-btn:hover {
    background-color: var(--background-modifier-hover);
    color: var(--text-normal);
  }

  .tab-btn:focus-visible {
    outline: 2px solid var(--interactive-accent);
    outline-offset: -2px;
  }

  .tab-btn.active {
    background-color: var(--interactive-accent);
    color: var(--text-on-accent);
  }

  .settings-content {
    flex: 1;
    padding: var(--spacing-l);
    overflow-y: auto;
  }

  .modal-footer {
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
    padding: var(--spacing-m) var(--spacing-l);
    border-top: 1px solid var(--border-color);
  }

  .modal-footer .spacer {
    flex: 1;
  }

  .cancel-btn,
  .save-btn {
    padding: var(--spacing-xs) var(--spacing-m);
    border-radius: var(--radius-s);
    font-size: var(--font-ui-small);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .cancel-btn {
    background: none;
    border: 1px solid var(--border-color);
    color: var(--text-normal);
  }

  .cancel-btn:hover {
    background-color: var(--background-modifier-hover);
  }

  .cancel-btn:focus-visible,
  .save-btn:focus-visible {
    outline: 2px solid var(--interactive-accent);
    outline-offset: 2px;
  }

  .save-btn {
    background-color: var(--interactive-accent);
    color: var(--text-on-accent);
    border: none;
  }

  .save-btn:hover {
    opacity: 0.9;
  }
</style>
