<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import SettingsGeneral from '@/components/settings/panel/SettingsGeneral.svelte';
  import SettingsEditor from '@/components/settings/panel/SettingsEditor.svelte';
  import SettingsAppearance from '@/components/settings/panel/SettingsAppearance.svelte';
  import SettingsVault from '@/components/settings/panel/SettingsVault.svelte';
  import SettingsChangelog from '@/components/settings/SettingsChangelog.svelte';
  import SettingsVersioning from '@/components/settings/panel/SettingsVersioning.svelte';
  import SettingsEmbeddings from '@/components/settings/SettingsEmbeddings.svelte';
  import SettingsHotkeys from '@/components/settings/SettingsHotkeys.svelte';
  import SettingsAbout from '@/components/settings/SettingsAbout.svelte';
  import SettingsHelp from '@/components/settings/system/SettingsHelp.svelte';
  import SettingsSecurity from '@/components/settings/system/SettingsSecurity.svelte';
  import ObservabilityDashboard from '@/components/settings/system/ObservabilityDashboard.svelte';
  import FeatureToggles from '@/components/settings/features/FeatureToggles.svelte';
  import SettingsLlm from '@/components/settings/panel/SettingsLlm.svelte';
  import SettingsVoice from '@/components/settings/panel/SettingsVoice.svelte';
  import SettingsSidebar from '@/components/overlays/settings/SettingsSidebar.svelte';
  import type { SettingsTab } from '@/components/overlays/settings/SettingsSidebar.svelte';
  import SettingsSearchResults from '@/components/overlays/settings/SettingsSearchResults.svelte';
  import { currentVault } from '@/stores/vault/vault';
  import { onDestroy } from 'svelte';
  import { createFocusTrap, type FocusTrapInstance } from '@/utils/accessibility/focusTrap';
  import { loadFields, saveFields, resetFields, HOTKEYS, type SettingsFields } from './settingsState';
  import { openVaultFolder } from './settingsActions';
  import { openConfirm } from '@/stores/confirm';

  export let isOpen = false;
  export let onClose: () => void;
  export let initialTab: SettingsTab | undefined = undefined;

  let activeTab: SettingsTab = 'general';
  let fields: SettingsFields = loadFields();
  let searchQuery = '';

  $: if (isOpen && initialTab) { activeTab = initialTab; }
  $: if (isOpen) { fields = loadFields(); }
  $: isSearching = searchQuery.trim().length > 0;

  function handleSearchNavigate(tab: SettingsTab) {
    activeTab = tab;
    searchQuery = '';
  }

  $: vaultPath = $currentVault?.root_path || '';
  $: vaultName = $currentVault?.name || '';

  function saveSettings() { saveFields(fields); onClose(); }
  function handleReset() {
    openConfirm({
      title: 'Reset All Settings',
      message: 'Reset all settings to defaults? This cannot be undone.',
      confirmLabel: 'Reset',
      variant: 'danger',
      onConfirm: () => { fields = resetFields(); },
    });
  }

  let modalEl: HTMLElement;
  let trap: FocusTrapInstance | null = null;

  $: if (isOpen && modalEl) {
    trap = createFocusTrap(modalEl, { onEscape: onClose, returnFocus: true });
    trap.activate();
  }
  $: if (!isOpen && trap) { trap.deactivate(); trap = null; }
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
        <SettingsSidebar {activeTab} onTabChange={(tab) => (activeTab = tab)} bind:searchQuery />

        <div class="settings-content col-span-9">
          {#if isSearching}
            <SettingsSearchResults query={searchQuery} onNavigate={handleSearchNavigate} />
          {:else if activeTab === 'general'}
            <SettingsGeneral
              bind:autoSave={fields.autoSave}
              bind:autoSaveDelay={fields.autoSaveDelay}
              bind:confirmBeforeDelete={fields.confirmBeforeDelete}
              bind:defaultNoteLocation={fields.defaultNoteLocation}
              bind:dateFormat={fields.dateFormat}
              bind:timeFormat={fields.timeFormat}
              bind:newFileNameTemplate={fields.newFileNameTemplate}
              bind:language={fields.language}
              bind:autoCheckUpdates={fields.autoCheckUpdates}
              bind:updateChannel={fields.updateChannel}
              bind:startupThresholdMs={fields.startupThresholdMs}
            />
          {:else if activeTab === 'editor'}
            <SettingsEditor
              bind:fontSize={fields.fontSize}
              bind:lineHeight={fields.lineHeight}
              bind:showLineNumbers={fields.showLineNumbers}
              bind:wordWrap={fields.wordWrap}
              bind:hardLineBreaks={fields.hardLineBreaks}
              bind:spellCheck={fields.spellCheck}
              bind:tabSize={fields.tabSize}
              bind:insertSpaces={fields.insertSpaces}
              bind:trimTrailingWhitespace={fields.trimTrailingWhitespace}
              bind:livePreview={fields.livePreview}
              bind:livePreviewMode={fields.livePreviewMode}
              bind:closeBrackets={fields.closeBrackets}
              bind:typewriterEnabled={fields.typewriterEnabled}
              bind:typewriterOffset={fields.typewriterOffset}
              bind:typewriterOnlyKeyboard={fields.typewriterOnlyKeyboard}
              bind:zenModeEnabled={fields.zenModeEnabled}
              bind:zenModeVisibleLines={fields.zenModeVisibleLines}
              bind:zenModeDimOpacity={fields.zenModeDimOpacity}
              bind:vimMode={fields.vimMode}
              bind:vimrcPath={fields.vimrcPath}
              bind:vimShowMode={fields.vimShowMode}
            />
          {:else if activeTab === 'appearance'}
            <SettingsAppearance
              bind:accentColor={fields.accentColor}
              bind:showStatusBar={fields.showStatusBar}
              bind:compactMode={fields.compactMode}
              bind:nativeFrame={fields.nativeFrame}
              bind:fontInterface={fields.fontInterface}
              bind:fontText={fields.fontText}
              bind:fontMono={fields.fontMono}
              bind:activeThemePath={fields.activeThemePath}
            />
          {:else if activeTab === 'features'}
            <FeatureToggles />
          {:else if activeTab === 'llm'}
            <SettingsLlm
              bind:llmEnabled={fields.llmEnabled}
              bind:llmNoteContext={fields.llmNoteContext}
              bind:llmMaxHistory={fields.llmMaxHistory}
            />
          {:else if activeTab === 'vault'}
            <SettingsVault
              {vaultName}
              {vaultPath}
              bind:enableGit={fields.enableGit}
              bind:autoCommit={fields.autoCommit}
              bind:syncOnStartup={fields.syncOnStartup}
              bind:commitMessageTemplate={fields.commitMessageTemplate}
              onOpenFolder={() => openVaultFolder(vaultPath)}
            />
            <SettingsVersioning
              bind:versioningEnabled={fields.versioningEnabled}
              bind:versionRetentionCount={fields.versionRetentionCount}
              bind:versioningLlmClassify={fields.versioningLlmClassify}
            />
          {:else if activeTab === 'embeddings'}
            <SettingsEmbeddings />
          {:else if activeTab === 'changelog'}
            <SettingsChangelog
              bind:changelogAutoUpdate={fields.changelogAutoUpdate}
              bind:changelogPath={fields.changelogPath}
              bind:changelogDatetimeFormat={fields.changelogDatetimeFormat}
              bind:changelogMaxFiles={fields.changelogMaxFiles}
              bind:changelogUseWikilinks={fields.changelogUseWikilinks}
              bind:changelogHeading={fields.changelogHeading}
              bind:changelogExcludedFolders={fields.changelogExcludedFolders}
            />
          {:else if activeTab === 'hotkeys'}
            <SettingsHotkeys hotkeys={HOTKEYS} />
          {:else if activeTab === 'help'}
            <SettingsHelp />
          {:else if activeTab === 'security'}
            <SettingsSecurity />
          {:else if activeTab === 'about'}
            <SettingsAbout />
          {:else if activeTab === 'voice'}
            <SettingsVoice
              bind:voiceFormat={fields.voiceFormat}
              bind:voiceQuality={fields.voiceQuality}
            />
          {:else if activeTab === 'monitoring'}
            <ObservabilityDashboard />
          {/if}
        </div>
      </div>

      <div class="modal-footer">
        <button class="cancel-btn" on:click={handleReset}>Reset to Defaults</button>
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
    height: calc(80vh / var(--ui-scale, 1));
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
    font-weight: var(--font-semibold);
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
    font-weight: var(--font-medium);
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
