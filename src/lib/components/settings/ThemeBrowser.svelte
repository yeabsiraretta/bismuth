<script lang="ts">
  import { onMount } from 'svelte';
  import { pickImportFile } from '@/services/system/dialog';
  import { currentVault } from '@/stores/vault/vault';
  import { listLocalThemes, importThemeFolder } from '@/services/system/themes';
  import { applyThemeTokens } from '@/utils/settings/themeApplier';
  import type { ThemeManifest } from '@/utils/settings/themeValidator';
  import { log } from '@/utils/logger';

  export let activeThemePath: string = '';
  export let onThemeChange: (path: string) => void = () => {};

  let themes: ThemeManifest[] = [];
  let loading = false;
  let importError = '';

  $: vaultRoot = $currentVault?.root_path ?? '';

  onMount(async () => {
    if (vaultRoot) await loadThemes();
  });

  async function loadThemes() {
    loading = true;
    themes = await listLocalThemes(vaultRoot);
    loading = false;
  }

  function applyTheme(manifest: ThemeManifest) {
    applyThemeTokens(manifest.tokens);
    activeThemePath = manifest.name;
    onThemeChange(manifest.name);
  }

  async function handleImport() {
    importError = '';
    try {
      const selected = await pickImportFile({ directory: true, title: 'Select Theme Folder' });
      if (!selected || Array.isArray(selected)) return;
      await importThemeFolder(selected, vaultRoot);
      await loadThemes();
    } catch (error) {
      importError = 'Failed to import theme. Make sure the folder contains a valid theme.json.';
      log.error('Theme import failed', error as Error);
    }
  }

  function getSwatchColors(manifest: ThemeManifest): string[] {
    const colorKeys = [
      '--color-bg',
      '--background-primary',
      '--interactive-accent',
      '--text-normal',
    ];
    return colorKeys
      .map((k) => manifest.tokens[k])
      .filter(Boolean)
      .slice(0, 3);
  }
</script>

<div class="theme-browser">
  {#if loading}
    <p class="hint">Loading themes...</p>
  {:else if themes.length === 0}
    <p class="hint">No local themes installed. Use "Load from folder" to add one.</p>
  {:else}
    <div class="theme-grid" role="listbox" aria-label="Available themes">
      {#each themes as manifest (manifest.name)}
        <button
          class="theme-card"
          class:active={activeThemePath === manifest.name}
          on:click={() => applyTheme(manifest)}
          role="option"
          aria-selected={activeThemePath === manifest.name}
          aria-label="Apply theme {manifest.name}"
        >
          <div class="swatches">
            {#each getSwatchColors(manifest) as color}
              <span class="swatch" style="background: {color};" aria-hidden="true"></span>
            {/each}
          </div>
          <span class="theme-name">{manifest.name}</span>
          <span class="theme-author">{manifest.author}</span>
        </button>
      {/each}
    </div>
  {/if}

  <div class="theme-actions">
    <button class="action-btn" on:click={handleImport} aria-label="Load theme from folder">
      Load from folder
    </button>
    <button class="action-btn" disabled title="Coming soon — online theme store is planned">
      Browse Theme Store
    </button>
  </div>

  {#if importError}
    <p class="error-msg" role="alert">{importError}</p>
  {/if}
</div>

<style>
  .hint {
    font-size: var(--font-ui-small);
    color: var(--text-muted);
    margin: 0 0 var(--spacing-s) 0;
  }

  .theme-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: var(--spacing-s);
    margin-bottom: var(--spacing-m);
  }

  .theme-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: var(--spacing-s);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-m);
    background: var(--background-secondary);
    cursor: pointer;
    min-height: 80px;
  }

  .theme-card:hover {
    border-color: var(--interactive-accent);
  }
  .theme-card.active {
    border-color: var(--interactive-accent);
    background: var(--background-modifier-hover);
  }
  .theme-card:focus-visible {
    outline: 2px solid var(--interactive-accent);
    outline-offset: 2px;
  }

  .swatches {
    display: flex;
    gap: 3px;
  }

  .swatch {
    width: 20px;
    height: 20px;
    border-radius: var(--radius-s);
    border: 1px solid var(--border-color);
  }

  .theme-name {
    font-size: var(--font-ui-small);
    font-weight: var(--font-medium);
    color: var(--text-normal);
  }
  .theme-author {
    font-size: var(--font-smallest);
    color: var(--text-muted);
  }

  .theme-actions {
    display: flex;
    gap: var(--spacing-s);
    flex-wrap: wrap;
  }

  .action-btn {
    padding: var(--spacing-xs) var(--spacing-m);
    border-radius: var(--radius-s);
    border: 1px solid var(--border-color);
    background: none;
    font-size: var(--font-ui-small);
    cursor: pointer;
    color: var(--text-normal);
    min-height: 32px;
  }

  .action-btn:hover:not(:disabled) {
    background: var(--background-modifier-hover);
  }
  .action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .error-msg {
    color: var(--color-danger, #dc2626);
    font-size: var(--font-ui-small);
    margin: var(--spacing-xs) 0 0 0;
  }
</style>
