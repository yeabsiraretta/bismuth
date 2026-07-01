<script lang="ts">
  import PanelHeader from '@/components/ui/layout/PanelHeader.svelte';
  import ActionButton from '@/components/ui/actions/ActionButton.svelte';
  import ColorSection from './ColorSection.svelte';
  import TypographySection from './TypographySection.svelte';
  import SpacingSection from './SpacingSection.svelte';
  import EffectsSection from './EffectsSection.svelte';
  import { resetAll, exportPreset, importPreset } from '@/stores/style/style';
  import { openConfirm } from '@/stores/confirm';

  let activeSection: 'colors' | 'typography' | 'spacing' | 'effects' = 'colors';
  let importError = '';

  function handleResetAll() {
    openConfirm({
      title: 'Reset Style Overrides',
      message: 'Reset all style overrides to defaults? This cannot be undone.',
      confirmLabel: 'Reset',
      variant: 'danger',
      onConfirm: () => { resetAll(); },
    });
  }

  function handleExport() {
    const json = exportPreset();
    navigator.clipboard.writeText(json);
  }

  function handleImport() {
    const json = prompt('Paste style preset JSON:');
    if (json) {
      const ok = importPreset(json);
      importError = ok ? '' : 'Invalid preset format';
    }
  }
</script>

<div class="style-settings-panel">
  <PanelHeader icon="palette" title="Style Settings">
    <svelte:fragment slot="actions">
      <ActionButton icon="download" title="Export preset" on:click={handleExport} />
      <ActionButton icon="upload" title="Import preset" on:click={handleImport} />
      <ActionButton icon="refresh-cw" title="Reset all" on:click={handleResetAll} />
    </svelte:fragment>
  </PanelHeader>

  {#if importError}
    <p class="error-msg">{importError}</p>
  {/if}

  <div class="section-tabs">
    <button class:active={activeSection === 'colors'} on:click={() => (activeSection = 'colors')}>Colors</button>
    <button class:active={activeSection === 'typography'} on:click={() => (activeSection = 'typography')}>Typography</button>
    <button class:active={activeSection === 'spacing'} on:click={() => (activeSection = 'spacing')}>Spacing</button>
    <button class:active={activeSection === 'effects'} on:click={() => (activeSection = 'effects')}>Effects</button>
  </div>

  <div class="section-content">
    {#if activeSection === 'colors'}
      <ColorSection />
    {:else if activeSection === 'typography'}
      <TypographySection />
    {:else if activeSection === 'spacing'}
      <SpacingSection />
    {:else}
      <EffectsSection />
    {/if}
  </div>
</div>

<style>
  .style-settings-panel {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-m);
  }


  .error-msg {
    font-size: var(--font-ui-small);
    color: var(--text-error);
    margin: 0;
  }

  .section-tabs {
    display: flex;
    gap: 0;
    border-bottom: 1px solid var(--border-color);
  }

  .section-tabs button {
    padding: var(--spacing-xs) var(--spacing-m);
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--text-muted);
    font-size: var(--font-ui-small);
    cursor: pointer;
    transition: all 0.15s;
  }

  .section-tabs button:hover {
    color: var(--text-normal);
  }

  .section-tabs button.active {
    color: var(--interactive-accent);
    border-bottom-color: var(--interactive-accent);
  }

  .section-content {
    padding-top: var(--spacing-m);
  }
</style>
