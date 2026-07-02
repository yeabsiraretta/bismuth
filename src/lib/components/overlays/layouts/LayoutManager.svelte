<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import {
    layoutPresets,
    activePresetId,
    savePreset,
    applyPreset,
    deletePreset,
    renamePreset,
    loadPresets,
  } from '@/stores/layout/presets';
  import { onMount } from 'svelte';

  export let visible = false;
  export let onClose: () => void = () => {};

  let newPresetName = '';
  let editingId: string | null = null;
  let editName = '';

  onMount(() => {
    loadPresets();
  });

  function handleSave() {
    if (!newPresetName.trim()) return;
    savePreset(newPresetName.trim());
    newPresetName = '';
  }

  function handleApply(id: string) {
    applyPreset(id);
    onClose();
  }

  function handleDelete(id: string) {
    deletePreset(id);
  }

  function startRename(id: string, name: string) {
    editingId = id;
    editName = name;
  }

  function finishRename() {
    if (editingId && editName.trim()) {
      renamePreset(editingId, editName.trim());
    }
    editingId = null;
    editName = '';
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') onClose();
  }
</script>

{#if visible}
  <div
    class="layout-manager-backdrop"
    on:click={onClose}
    on:keydown={handleKeydown}
    role="presentation"
  >
    <div
      class="layout-manager"
      on:click|stopPropagation
      on:keydown|stopPropagation
      role="dialog"
      aria-label="Layout Manager"
      tabindex="-1"
    >
      <div class="lm-header">
        <Icon name="layout" size={16} />
        <h3>Layouts</h3>
        <button class="lm-close" on:click={onClose} title="Close">
          <Icon name="x" size={14} />
        </button>
      </div>

      <div class="lm-body">
        <div class="lm-section">
          <span class="lm-section-label">Default Layouts</span>
          {#each $layoutPresets.filter((p) => p.isDefault) as preset}
            <button
              class="lm-preset"
              class:active={$activePresetId === preset.id}
              on:click={() => handleApply(preset.id)}
            >
              <Icon name="layout" size={14} />
              <span class="lm-preset-name">{preset.name}</span>
              {#if $activePresetId === preset.id}
                <span class="lm-active-badge">Active</span>
              {/if}
            </button>
          {/each}
        </div>

        {#if $layoutPresets.filter((p) => !p.isDefault).length > 0}
          <div class="lm-section">
            <span class="lm-section-label">Custom Layouts</span>
            {#each $layoutPresets.filter((p) => !p.isDefault) as preset}
              <div class="lm-preset-row">
                {#if editingId === preset.id}
                  <input
                    class="lm-rename-input"
                    bind:value={editName}
                    on:blur={finishRename}
                    on:keydown={(e) => e.key === 'Enter' && finishRename()}
                  />
                {:else}
                  <button
                    class="lm-preset"
                    class:active={$activePresetId === preset.id}
                    on:click={() => handleApply(preset.id)}
                  >
                    <Icon name="layout" size={14} />
                    <span class="lm-preset-name">{preset.name}</span>
                  </button>
                {/if}
                <div class="lm-preset-actions">
                  <button
                    class="lm-icon-btn"
                    title="Rename"
                    on:click={() => startRename(preset.id, preset.name)}
                  >
                    <Icon name="edit" size={12} />
                  </button>
                  <button
                    class="lm-icon-btn danger"
                    title="Delete"
                    on:click={() => handleDelete(preset.id)}
                  >
                    <Icon name="trash" size={12} />
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {/if}

        <div class="lm-save-section">
          <input
            class="lm-save-input"
            bind:value={newPresetName}
            placeholder="Save current layout as..."
            on:keydown={(e) => e.key === 'Enter' && handleSave()}
          />
          <button class="lm-save-btn" on:click={handleSave} disabled={!newPresetName.trim()}>
            <Icon name="save" size={14} />
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .layout-manager-backdrop {
    position: fixed;
    inset: 0;
    background: var(--overlay-backdrop, rgba(0, 0, 0, 0.3));
    z-index: 1000;
    display: flex;
    align-items: flex-end;
    justify-content: flex-start;
    padding: 0 0 48px 8px;
  }
  .layout-manager {
    background: var(--panel-bg, #1e1e2e);
    border: 1px solid var(--border-color, #313244);
    border-radius: 8px;
    width: 280px;
    max-height: 400px;
    display: flex;
    flex-direction: column;
    box-shadow: var(--shadow-lg, 0 8px 24px rgba(0, 0, 0, 0.3));
  }
  .lm-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 12px 8px;
    border-bottom: 1px solid var(--border-color, #313244);
  }
  .lm-header h3 {
    margin: 0;
    font-size: var(--font-ui-menu);
    font-weight: var(--font-semibold);
    flex: 1;
  }
  .lm-close {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-muted);
    padding: 4px;
    border-radius: var(--radius-s);
  }
  .lm-close:hover {
    background: var(--hover-bg);
  }
  .lm-body {
    padding: var(--spacing-s);
    overflow-y: auto;
    flex: 1;
  }
  .lm-section {
    margin-bottom: 12px;
  }
  .lm-section-label {
    font-size: var(--font-ui-badge);
    font-weight: var(--font-semibold);
    text-transform: uppercase;
    color: var(--text-muted);
    padding: var(--spacing-xs) var(--spacing-s);
    display: block;
  }
  .lm-preset {
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
    width: 100%;
    padding: var(--spacing-s) var(--menu-item-padding-x);
    background: none;
    border: none;
    border-radius: var(--radius-s);
    color: var(--text-primary);
    cursor: pointer;
    font-size: var(--font-ui-smaller);
    text-align: left;
  }
  .lm-preset:hover {
    background: var(--hover-bg);
  }
  .lm-preset.active {
    background: var(--accent-bg, rgba(99, 102, 241, 0.1));
  }
  .lm-preset-name {
    flex: 1;
  }
  .lm-active-badge {
    font-size: var(--font-ui-xs);
    padding: var(--spacing-xxs) var(--spacing-xs);
    border-radius: var(--badge-border-radius);
    background: var(--accent-color, #6366f1);
    color: white;
  }
  .lm-preset-row {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .lm-preset-row .lm-preset {
    flex: 1;
  }
  .lm-preset-actions {
    display: flex;
    gap: 2px;
  }
  .lm-icon-btn {
    background: none;
    border: none;
    padding: var(--spacing-xs);
    border-radius: var(--radius-s);
    cursor: pointer;
    color: var(--text-muted);
  }
  .lm-icon-btn:hover {
    background: var(--hover-bg);
  }
  .lm-icon-btn.danger:hover {
    color: var(--error-color, #f87171);
  }
  .lm-rename-input {
    flex: 1;
    padding: 6px 8px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    background: var(--input-bg);
    color: var(--text-primary);
    font-size: var(--font-ui-smaller);
  }
  .lm-save-section {
    display: flex;
    gap: 4px;
    padding-top: 8px;
    border-top: 1px solid var(--border-color);
  }
  .lm-save-input {
    flex: 1;
    padding: 6px 8px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    background: var(--input-bg);
    color: var(--text-primary);
    font-size: var(--font-ui-smaller);
  }
  .lm-save-btn {
    padding: var(--menu-item-padding-y) var(--menu-item-padding-x);
    border: none;
    border-radius: var(--radius-s);
    background: var(--accent-color, #6366f1);
    color: white;
    cursor: pointer;
  }
  .lm-save-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
