<script lang="ts">
  import { open } from '@tauri-apps/plugin-dialog';
  import Icon from '@/components/icons/Icon.svelte';
  import ThemeToggle from '@/components/ui/ThemeToggle.svelte';
  import VaultNameDialog from '@/components/vault/welcome/VaultNameDialog.svelte';
  import TemplatePicker from '@/components/vault/welcome/TemplatePicker.svelte';
  import { VaultTemplate } from '@/types/data/vault';
  import * as vaultService from '@/services/vault/vault';
  import { openVault } from '@/stores/vault/vault';
  import { log } from '@/utils/logger';

  type View = 'landing' | 'home' | 'template';

  let view: View = 'landing';
  let isCreating = false;
  let errorMessage = '';
  let showNameDialog = false;
  let vaultName = '';
  let selectedParentPath = '';
  let pendingTemplate: VaultTemplate | null = null;

  log.info('WelcomeScreen component initialized');

  async function handleCreateBlankVault() {
    log.info('User clicked Create Blank Vault button');
    try {
      errorMessage = '';
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Parent Folder for New Vault',
      });
      if (selected) {
        selectedParentPath = Array.isArray(selected) ? selected[0] : selected;
        pendingTemplate = VaultTemplate.Blank;
        vaultName = 'My Vault';
        showNameDialog = true;
      }
    } catch (error) {
      errorMessage = `Failed to select folder: ${error}`;
      log.error('Failed to open folder selection dialog', error as Error);
    }
  }

  function handleTemplateSelect(parentPath: string, template: VaultTemplate) {
    selectedParentPath = parentPath;
    pendingTemplate = template;
    vaultName = 'My Vault';
    showNameDialog = true;
  }

  async function confirmVaultCreation() {
    if (!vaultName.trim() || !selectedParentPath || pendingTemplate === null) return;
    log.info('Creating vault', {
      name: vaultName,
      template: VaultTemplate[pendingTemplate],
      parentPath: selectedParentPath,
    });
    try {
      isCreating = true;
      errorMessage = '';
      showNameDialog = false;
      const vaultPath = `${selectedParentPath}/${vaultName.trim()}`;
      await vaultService.createVault(vaultPath, pendingTemplate);
      await openVault(vaultPath);
      log.info('Vault creation flow completed');
    } catch (error) {
      errorMessage = `Failed to create vault: ${error}`;
      log.error('Vault creation failed', error as Error);
    } finally {
      isCreating = false;
      pendingTemplate = null;
      selectedParentPath = '';
      vaultName = '';
    }
  }

  function cancelVaultCreation() {
    showNameDialog = false;
    pendingTemplate = null;
    selectedParentPath = '';
    vaultName = '';
  }

  async function handleOpenExistingVault() {
    log.info('User clicked Open Existing Vault button');
    try {
      isCreating = true;
      errorMessage = '';
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Open Existing Vault',
      });
      if (selected) {
        const path = Array.isArray(selected) ? selected[0] : selected;
        await openVault(path);
      }
    } catch (error) {
      errorMessage = `Failed to open vault: ${error}`;
      log.error('Failed to open existing vault', error as Error);
    } finally {
      isCreating = false;
    }
  }
</script>

<div class="welcome-screen">
  <div class="theme-toggle-container">
    <ThemeToggle />
  </div>
  <div class="welcome-content">
    {#if view === 'landing'}
      <div class="landing-view">
        <pre class="ascii-title" aria-label="Bismuth">{`
__________.__                       __  .__     
╲______   ╲__│ ______ _____  __ ___╱  │_│  │__  
 │    │  _╱  │╱  ___╱╱     ╲│  │  ╲   __╲  │  ╲ 
 │    │   ╲  │╲___ ╲│  Y Y  ╲  │  ╱│  │ │   Y  ╲
 │______  ╱__╱____  >__│_│  ╱____╱ │__│ │___│  ╱
        ╲╱        ╲╱      ╲╱                 ╲╱ 
`.trim()}</pre>
        <p class="welcome-subtitle">Your personal knowledge management system</p>
        <button class="start-btn" on:click={() => (view = 'home')}>Start</button>
      </div>
    {:else if view === 'home'}
      {#if errorMessage}
        <div class="error-message">{errorMessage}</div>
      {/if}
      <div class="actions-container">
        <button class="action-card" on:click={handleCreateBlankVault} disabled={isCreating}>
          <div class="action-icon"><Icon name="file-plus" size={28} /></div>
          <h2 class="action-title">Create Blank Vault</h2>
          <p class="action-description">
            Start with an empty vault and organize your notes your way
          </p>
        </button>

        <button class="action-card" on:click={() => (view = 'template')} disabled={isCreating}>
          <div class="action-icon"><Icon name="layout" size={28} /></div>
          <h2 class="action-title">Create from Template</h2>
          <p class="action-description">Start with a pre-configured organizational system</p>
        </button>

        <button class="action-card" on:click={handleOpenExistingVault} disabled={isCreating}>
          <div class="action-icon"><Icon name="folder-open" size={28} /></div>
          <h2 class="action-title">Open Existing Vault</h2>
          <p class="action-description">Open a folder that already contains your notes</p>
        </button>
      </div>
    {:else if view === 'template'}
      {#if errorMessage}
        <div class="error-message">{errorMessage}</div>
      {/if}
      <TemplatePicker onBack={() => (view = 'home')} onSelect={handleTemplateSelect} {isCreating} />
    {/if}
  </div>
</div>

{#if showNameDialog}
  <VaultNameDialog
    bind:vaultName
    {selectedParentPath}
    onConfirm={confirmVaultCreation}
    onCancel={cancelVaultCreation}
  />
{/if}

<style>
  .welcome-screen {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background-color: var(--background-primary);
    padding: var(--spacing-xl);
    font-family: var(--font-sans);
    overflow: hidden;
  }

  .theme-toggle-container {
    position: absolute;
    top: 24px;
    right: 24px;
    z-index: 10;
  }

  .welcome-content {
    max-width: 900px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .ascii-title {
    font-family: var(--font-mono);
    font-size: clamp(0.55rem, 1.2vw, 0.85rem);
    line-height: 1.2;
    color: var(--interactive-accent);
    text-align: center;
    margin: 0 0 var(--spacing-l) 0;
    white-space: pre;
    overflow: hidden;
    background: none;
    border: none;
    padding: 0;
  }

  .welcome-subtitle {
    font-family: var(--font-sans);
    font-size: var(--font-ui-large);
    color: var(--text-muted);
    text-align: center;
    margin: 0 0 var(--spacing-xl) 0;
  }

  .landing-view {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .start-btn {
    margin-top: var(--spacing-xl);
    padding: var(--spacing-s) var(--spacing-xxl);
    font-family: var(--font-sans);
    font-size: var(--font-ui-medium);
    font-weight: var(--font-semibold);
    color: var(--text-on-accent);
    background-color: var(--interactive-accent);
    border: none;
    border-radius: var(--radius-m);
    cursor: pointer;
    transition:
      background-color var(--transition-medium),
      transform var(--transition-medium);
  }

  .start-btn:hover {
    background-color: var(--interactive-accent-hover);
    transform: translateY(-1px);
  }

  .start-btn:active {
    transform: translateY(0);
  }

  .error-message {
    background-color: var(--background-modifier-error);
    color: var(--text-error);
    padding: var(--spacing-m);
    border-radius: var(--radius-m);
    margin-bottom: var(--spacing-l);
    text-align: center;
  }

  .actions-container {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-l);
    width: 100%;
    margin-top: var(--spacing-xl);
  }

  .action-card {
    background-color: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-l);
    padding: var(--spacing-xl);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    cursor: pointer;
    transition: all var(--transition-medium);
    position: relative;
  }

  .action-card:hover:not(:disabled) {
    border-color: var(--interactive-accent);
    transform: translateY(-2px);
    box-shadow: var(--shadow-l);
  }

  .action-card:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .action-icon {
    color: var(--interactive-accent);
    margin-bottom: var(--spacing-m);
  }

  .action-title {
    font-family: var(--font-sans);
    font-size: var(--font-ui-large);
    font-weight: var(--font-semibold);
    color: var(--text-normal);
    margin: 0 0 var(--spacing-s) 0;
  }

  .action-description {
    font-size: var(--font-ui-medium);
    color: var(--text-muted);
    margin: 0;
    line-height: 1.5;
  }
</style>
