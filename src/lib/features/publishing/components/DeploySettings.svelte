<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import type { DeployTarget } from '../types';
  import { siteSettings, updateSiteSettings } from '../stores/publishing';

  type DeployConfig = {
    target: DeployTarget;
    deployToken: string;
    siteId: string;
    projectName: string;
  };

  let config: DeployConfig = {
    target: 'local',
    deployToken: '',
    siteId: '',
    projectName: '',
  };

  const targets: { value: DeployTarget; label: string; icon: string }[] = [
    { value: 'local', label: 'Local Export', icon: 'folder' },
    { value: 'git', label: 'Git Repository', icon: 'git-branch' },
    { value: 'vercel', label: 'Vercel', icon: 'globe' },
    { value: 'netlify', label: 'Netlify', icon: 'globe' },
  ];

  function handleSave() {
    updateSiteSettings({ outputDir: $siteSettings.outputDir });
  }
</script>

<div class="deploy-settings">
  <h4 class="section-title">Deploy Target</h4>

  <div class="target-options">
    {#each targets as t}
      <label class="target-option" class:active={config.target === t.value}>
        <input type="radio" bind:group={config.target} value={t.value} />
        <Icon name={t.icon} size={14} />
        <span>{t.label}</span>
      </label>
    {/each}
  </div>

  {#if config.target === 'git'}
    <div class="field-group">
      <label class="field">
        <span class="field-label">Remote URL</span>
        <input class="field-input" placeholder="https://github.com/user/repo.git" />
      </label>
    </div>
  {/if}

  {#if config.target === 'vercel'}
    <div class="field-group">
      <label class="field">
        <span class="field-label">Deploy Token</span>
        <input
          class="field-input"
          type="password"
          bind:value={config.deployToken}
          placeholder="vercel_..."
        />
      </label>
      <label class="field">
        <span class="field-label">Project Name</span>
        <input
          class="field-input"
          bind:value={config.projectName}
          placeholder="my-digital-garden"
        />
      </label>
    </div>
  {/if}

  {#if config.target === 'netlify'}
    <div class="field-group">
      <label class="field">
        <span class="field-label">Auth Token</span>
        <input
          class="field-input"
          type="password"
          bind:value={config.deployToken}
          placeholder="netlify_..."
        />
      </label>
      <label class="field">
        <span class="field-label">Site ID</span>
        <input class="field-input" bind:value={config.siteId} placeholder="abc123-def456" />
      </label>
    </div>
  {/if}

  <button class="btn-save" on:click={handleSave}>
    <Icon name="save" size={14} />
    Save Configuration
  </button>
</div>

<style>
  .deploy-settings {
    padding: var(--spacing-s);
  }
  .section-title {
    font-size: var(--font-ui-small);
    font-weight: 600;
    margin-bottom: var(--spacing-s);
    color: var(--text-normal);
  }
  .target-options {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    margin-bottom: var(--spacing-m);
  }
  .target-option {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) var(--spacing-s);
    border-radius: var(--radius-s);
    cursor: pointer;
    font-size: var(--font-ui-small);
    color: var(--text-muted);
    border: 1px solid var(--border);
  }
  .target-option.active {
    border-color: var(--interactive-accent);
    color: var(--text-normal);
    background: var(--background-modifier-hover);
  }
  .target-option input[type='radio'] {
    display: none;
  }
  .field-group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    margin-bottom: var(--spacing-m);
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .field-label {
    font-size: var(--font-smallest);
    color: var(--text-muted);
  }
  .field-input {
    padding: var(--spacing-xs);
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
    background: var(--background-primary);
    color: var(--text-normal);
    font-size: var(--font-ui-small);
  }
  .btn-save {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    width: 100%;
    padding: var(--spacing-xs) var(--spacing-s);
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    border: none;
    border-radius: var(--radius-s);
    font-size: var(--font-ui-small);
    cursor: pointer;
    justify-content: center;
    margin-top: var(--spacing-s);
  }
  .btn-save:hover {
    opacity: 0.9;
  }
</style>
