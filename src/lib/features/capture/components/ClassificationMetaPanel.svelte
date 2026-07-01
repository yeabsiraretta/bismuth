<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import type { LifecycleState } from '@/types/data/entity';
  import { getPortentIcon, getPortentColor } from '@/types/data/entity';

  export let selectedType: string;
  export let selectedLifecycle: LifecycleState;
  export let editedTags: string;
  export let portentTypes: string[];
  export let lifecycleStates: LifecycleState[];
</script>

<aside class="cv-meta-panel">
  <h3 class="cv-meta-heading">Classification</h3>

  <div class="cv-field">
    <label class="cv-label" for="cv-type">Type</label>
    <div class="cv-type-grid">
      {#each portentTypes as t}
        <button
          class="cv-type-chip"
          class:active={selectedType === t}
          on:click={() => selectedType = selectedType === t ? '' : t}
          style="--chip-color: {getPortentColor(t)}"
        >
          <Icon name={getPortentIcon(t)} size={14} />
          <span>{t}</span>
        </button>
      {/each}
    </div>
  </div>

  <div class="cv-field">
    <label class="cv-label" for="cv-lifecycle">Status</label>
    <div class="cv-lifecycle-row">
      {#each lifecycleStates as state}
        <button
          class="cv-state-btn"
          class:active={selectedLifecycle === state}
          on:click={() => selectedLifecycle = state}
        >
          <Icon name={state === 'captured' ? 'inbox' : state === 'organized' ? 'folder-check' : 'archive'} size={14} />
          <span>{state}</span>
        </button>
      {/each}
    </div>
  </div>

  <div class="cv-field">
    <label class="cv-label" for="cv-tags">Tags</label>
    <input
      id="cv-tags"
      class="cv-tags-input"
      bind:value={editedTags}
      placeholder="tag1, tag2, ..."
      aria-label="Tags (comma-separated)"
    />
  </div>

  <div class="cv-field">
    <span class="cv-label">Preview</span>
    <div class="cv-preview-card">
      {#if selectedType}
        <span class="cv-preview-type" style="color: {getPortentColor(selectedType)}">
          <Icon name={getPortentIcon(selectedType)} size={12} />
          {selectedType}
        </span>
      {/if}
      <span class="cv-preview-lifecycle">{selectedLifecycle}</span>
    </div>
  </div>
</aside>

<style>
  .cv-meta-panel {
    width: 220px;
    flex-shrink: 0;
    border-left: 1px solid var(--border-color);
    padding: var(--spacing-m);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-m);
  }

  .cv-meta-heading {
    margin: 0;
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--text-normal);
  }

  .cv-field {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .cv-label {
    font-size: var(--font-size-xs);
    font-weight: 500;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .cv-type-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .cv-type-chip {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    background: var(--background-primary);
    font-size: var(--font-size-2xs);
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.12s;
  }

  .cv-type-chip:hover {
    border-color: var(--chip-color);
    color: var(--chip-color);
  }

  .cv-type-chip.active {
    background: color-mix(in srgb, var(--chip-color) 12%, transparent);
    border-color: var(--chip-color);
    color: var(--chip-color);
    font-weight: 600;
  }

  .cv-lifecycle-row {
    display: flex;
    gap: 4px;
  }

  .cv-state-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    flex: 1;
    padding: 6px 8px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    background: var(--background-primary);
    font-size: var(--font-size-2xs);
    color: var(--text-muted);
    cursor: pointer;
    text-transform: capitalize;
    justify-content: center;
  }

  .cv-state-btn:hover {
    background: var(--background-modifier-hover);
  }

  .cv-state-btn.active {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    border-color: var(--interactive-accent);
  }

  .cv-tags-input {
    width: 100%;
    padding: 6px 8px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    background: var(--background-modifier-form-field);
    font-size: var(--font-size-xs);
    color: var(--text-normal);
    outline: none;
  }

  .cv-tags-input:focus {
    border-color: var(--interactive-accent);
  }

  .cv-preview-card {
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
    padding: var(--spacing-s);
    background: var(--background-secondary);
    border-radius: var(--radius-s);
  }

  .cv-preview-type {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: var(--font-size-xs);
    font-weight: 600;
  }

  .cv-preview-lifecycle {
    font-size: var(--font-size-2xs);
    color: var(--text-faint);
    text-transform: capitalize;
  }
</style>
