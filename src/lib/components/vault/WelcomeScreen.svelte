<script lang="ts">
  import { open } from '@tauri-apps/plugin-dialog';
  import Button from '@/components/ui/Button.svelte';
  import Dropdown from '@/components/ui/Dropdown.svelte';
  import { VaultTemplate } from '@/types/vault';
  import * as vaultService from '@/services/vault/vault';
  import { openVault } from '@/stores/vault/vault';
  import { log } from '@/utils/logger';

  let isCreating = false;
  let selectedTemplate = VaultTemplate.Blank;
  let errorMessage = '';
  let showNameDialog = false;
  let vaultName = '';
  let selectedParentPath = '';
  let pendingTemplate: VaultTemplate | null = null;

  log.info('WelcomeScreen component initialized');

  const templateOptions = [
    { value: VaultTemplate.Blank, label: 'Blank Vault' },
    { value: VaultTemplate.PARA, label: 'PARA (Projects, Areas, Resources, Archive)' },
    { value: VaultTemplate.JohnnyDecimal, label: 'Johnny.Decimal' },
    { value: VaultTemplate.Zettelkasten, label: 'Zettelkasten' },
  ];

  async function handleCreateBlankVault() {
    log.info('User clicked Create Blank Vault button');
    try {
      errorMessage = '';

      log.debug('Opening folder selection dialog');
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
        log.info('Folder selected for blank vault', { path: selectedParentPath });
      } else {
        log.info('User cancelled folder selection');
      }
    } catch (error) {
      errorMessage = `Failed to select folder: ${error}`;
      log.error('Failed to open folder selection dialog', error as Error, {
        action: 'create_blank_vault',
      });
    }
  }

  async function handleCreateTemplateVault() {
    log.info('User clicked Create Template Vault button', {
      template: VaultTemplate[selectedTemplate],
    });
    try {
      errorMessage = '';

      log.debug('Opening folder selection dialog for template vault');
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Parent Folder for New Vault',
      });

      if (selected) {
        selectedParentPath = Array.isArray(selected) ? selected[0] : selected;
        pendingTemplate = selectedTemplate;
        vaultName = 'My Vault';
        showNameDialog = true;
        log.info('Folder selected for template vault', {
          path: selectedParentPath,
          template: VaultTemplate[selectedTemplate],
        });
      } else {
        log.info('User cancelled folder selection for template vault');
      }
    } catch (error) {
      errorMessage = `Failed to select folder: ${error}`;
      log.error('Failed to open folder selection dialog', error as Error, {
        action: 'create_template_vault',
        template: VaultTemplate[selectedTemplate],
      });
    }
  }

  async function confirmVaultCreation() {
    if (!vaultName.trim() || !selectedParentPath || pendingTemplate === null) {
      log.warn('Vault creation attempted with invalid data', {
        hasName: !!vaultName.trim(),
        hasPath: !!selectedParentPath,
        hasTemplate: pendingTemplate !== null,
      });
      return;
    }

    log.info('Creating vault', {
      name: vaultName,
      template: VaultTemplate[pendingTemplate],
      parentPath: selectedParentPath,
    });
    try {
      isCreating = true;
      errorMessage = '';
      showNameDialog = false;

      // Create vault folder path
      const vaultPath = `${selectedParentPath}/${vaultName.trim()}`;

      log.debug('Calling vault service to create vault', { vaultPath });
      await vaultService.createVault(vaultPath, pendingTemplate);
      log.info('Vault created successfully', { vaultPath });

      log.debug('Opening newly created vault');
      await openVault(vaultPath);
      log.info('Vault creation flow completed');
    } catch (error) {
      errorMessage = `Failed to create vault: ${error}`;
      log.error('Vault creation failed', error as Error, {
        name: vaultName,
        template: VaultTemplate[pendingTemplate!],
        parentPath: selectedParentPath,
      });
    } finally {
      isCreating = false;
      pendingTemplate = null;
      selectedParentPath = '';
      vaultName = '';
    }
  }

  function cancelVaultCreation() {
    log.info('User cancelled vault creation');
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

      log.debug('Opening folder selection dialog for existing vault');
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Open Existing Vault',
      });

      if (selected) {
        const path = Array.isArray(selected) ? selected[0] : selected;
        log.info('Opening existing vault', { path });
        await openVault(path);
        log.info('Vault opened successfully', { path });
      } else {
        log.info('User cancelled vault selection');
      }
    } catch (error) {
      errorMessage = `Failed to open vault: ${error}`;
      log.error('Failed to open existing vault', error as Error, { action: 'open_vault' });
    } finally {
      isCreating = false;
    }
  }
</script>

<div class="welcome-screen">
  <div class="welcome-content">
    <h1 class="welcome-title">Welcome to Bismuth</h1>
    <p class="welcome-subtitle">Your personal knowledge management system</p>

    {#if errorMessage}
      <div class="error-message">
        {errorMessage}
      </div>
    {/if}

    <div class="cards-container">
      <!-- Create Blank Vault Card -->
      <div class="card">
        <div class="card-icon">📝</div>
        <h2 class="card-title">Create Blank Vault</h2>
        <p class="card-description">Start with an empty vault and organize your notes your way</p>
        <Button
          variant="primary"
          size="large"
          fullWidth
          loading={isCreating}
          on:click={handleCreateBlankVault}
        >
          Create Blank Vault
        </Button>
      </div>

      <!-- Use Template Card -->
      <div class="card">
        <div class="card-icon">📚</div>
        <h2 class="card-title">Use Template</h2>
        <p class="card-description">Start with a pre-configured organizational system</p>
        <div class="template-selector">
          <Dropdown
            options={templateOptions}
            bind:value={selectedTemplate}
            placeholder="Select a template"
          />
        </div>
        <Button
          variant="primary"
          size="large"
          fullWidth
          loading={isCreating}
          on:click={handleCreateTemplateVault}
        >
          Create from Template
        </Button>
      </div>

      <!-- Open Existing Vault Card -->
      <div class="card">
        <div class="card-icon">📂</div>
        <h2 class="card-title">Open Existing Vault</h2>
        <p class="card-description">Open a folder that already contains your notes</p>
        <Button
          variant="secondary"
          size="large"
          fullWidth
          loading={isCreating}
          on:click={handleOpenExistingVault}
        >
          Open Vault
        </Button>
      </div>
    </div>
  </div>
</div>

<!-- Vault Name Dialog -->
{#if showNameDialog}
  <div class="dialog-overlay" on:click={cancelVaultCreation} role="presentation">
    <div class="dialog" on:click|stopPropagation role="dialog" aria-labelledby="dialog-title">
      <h2 id="dialog-title" class="dialog-title">Name Your Vault</h2>
      <p class="dialog-description">Choose a name for your new vault folder</p>

      <div class="dialog-input-group">
        <label for="vault-name-input" class="dialog-label">Vault Name</label>
        <input
          id="vault-name-input"
          type="text"
          class="dialog-input"
          bind:value={vaultName}
          placeholder="My Vault"
          autofocus
          on:keydown={(e) => e.key === 'Enter' && confirmVaultCreation()}
        />
        <p class="dialog-hint">Location: {selectedParentPath}/{vaultName.trim() || 'vault-name'}</p>
      </div>

      <div class="dialog-actions">
        <Button variant="secondary" on:click={cancelVaultCreation}>Cancel</Button>
        <Button variant="primary" on:click={confirmVaultCreation} disabled={!vaultName.trim()}>
          Create Vault
        </Button>
      </div>
    </div>
  </div>
{/if}

<style>
  .welcome-screen {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100vh;
    background-color: var(--background-primary);
    padding: var(--spacing-xl);
  }

  .welcome-content {
    max-width: 1200px;
    width: 100%;
  }

  .welcome-title {
    font-size: 3rem;
    font-weight: var(--font-bold);
    color: var(--text-normal);
    text-align: center;
    margin: 0 0 var(--spacing-s) 0;
  }

  .welcome-subtitle {
    font-size: var(--font-ui-large);
    color: var(--text-muted);
    text-align: center;
    margin: 0 0 var(--spacing-xxl) 0;
  }

  .error-message {
    background-color: var(--background-modifier-error);
    color: var(--text-error);
    padding: var(--spacing-m);
    border-radius: var(--radius-m);
    margin-bottom: var(--spacing-l);
    text-align: center;
  }

  .cards-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--spacing-l);
    margin-top: var(--spacing-xl);
  }

  .card {
    background-color: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-l);
    padding: var(--spacing-xl);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    transition: all var(--transition-medium);
  }

  .card:hover {
    border-color: var(--interactive-accent);
    transform: translateY(-2px);
    box-shadow: var(--shadow-l);
  }

  .card-icon {
    font-size: 3rem;
    margin-bottom: var(--spacing-m);
  }

  .card-title {
    font-size: var(--font-ui-large);
    font-weight: var(--font-semibold);
    color: var(--text-normal);
    margin: 0 0 var(--spacing-s) 0;
  }

  .card-description {
    font-size: var(--font-ui-medium);
    color: var(--text-muted);
    margin: 0 0 var(--spacing-l) 0;
    flex: 1;
  }

  .template-selector {
    width: 100%;
    margin-bottom: var(--spacing-m);
  }

  /* Dialog Styles */
  .dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
  }

  .dialog {
    background-color: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-l);
    padding: var(--spacing-xl);
    max-width: 500px;
    width: 90%;
    box-shadow: var(--shadow-xl);
  }

  .dialog-title {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    margin: 0 0 var(--spacing-s) 0;
  }

  .dialog-description {
    font-size: var(--font-size-sm);
    color: var(--text-muted);
    margin: 0 0 var(--spacing-l) 0;
  }

  .dialog-input-group {
    margin-bottom: var(--spacing-l);
  }

  .dialog-label {
    display: block;
    font-size: var(--font-size-sm);
    font-weight: var(--font-medium);
    color: var(--text-primary);
    margin-bottom: var(--spacing-xs);
  }

  .dialog-input {
    width: 100%;
    padding: var(--spacing-m);
    font-size: var(--font-size-md);
    background-color: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-m);
    color: var(--text-primary);
    outline: none;
    transition: border-color 0.15s ease;
  }

  .dialog-input:focus {
    border-color: var(--interactive-accent);
  }

  .dialog-hint {
    font-size: var(--font-size-xs);
    color: var(--text-muted);
    margin-top: var(--spacing-xs);
    font-family: var(--font-mono);
  }

  .dialog-actions {
    display: flex;
    gap: var(--spacing-m);
    justify-content: flex-end;
  }
</style>
