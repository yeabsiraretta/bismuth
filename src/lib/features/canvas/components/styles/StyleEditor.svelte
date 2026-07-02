<script lang="ts">
  import {
    selectedStyle,
    updateStyle,
    deleteStyle,
  } from '@/features/canvas/stores/design/styleLibrary';
  import { openConfirm } from '@/stores/confirm';
  import StyleSwatch from './StyleSwatch.svelte';

  let editName = '';
  let editColor = '#000000';
  let editWidth = 1;
  let editOpacity = 1;

  $: if ($selectedStyle) {
    editName = $selectedStyle.name;
    editColor = ($selectedStyle.properties.color as string) ?? '#000000';
    editWidth = ($selectedStyle.properties.width as number) ?? 1;
    editOpacity = ($selectedStyle.properties.opacity as number) ?? 1;
  }

  function handleSave() {
    if (!$selectedStyle) return;
    const props: Record<string, unknown> = { ...$selectedStyle.properties };
    props.color = editColor;
    if ($selectedStyle.type === 'stroke') props.width = editWidth;
    props.opacity = editOpacity;
    updateStyle($selectedStyle.id, props);
  }

  function handleDelete() {
    if (!$selectedStyle) return;
    openConfirm({
      title: 'Delete Style',
      message: `Delete style "${$selectedStyle.name}"?`,
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: () => {
        deleteStyle($selectedStyle!.id);
      },
    });
  }
</script>

<div class="style-editor">
  {#if $selectedStyle}
    <div class="editor-header">
      <StyleSwatch style={$selectedStyle} />
      <input type="text" bind:value={editName} class="name-input" />
    </div>

    <div class="editor-fields">
      <label class="field">
        <span>Color</span>
        <input type="color" bind:value={editColor} />
      </label>

      {#if $selectedStyle.type === 'stroke'}
        <label class="field">
          <span>Width</span>
          <input type="number" min="0.5" max="20" step="0.5" bind:value={editWidth} />
        </label>
      {/if}

      <label class="field">
        <span>Opacity</span>
        <input type="range" min="0" max="1" step="0.01" bind:value={editOpacity} />
        <span class="value">{Math.round(editOpacity * 100)}%</span>
      </label>
    </div>

    <div class="editor-info">
      <span class="linked">{$selectedStyle.linkedElements.length} elements linked</span>
    </div>

    <div class="editor-actions">
      <button class="save-btn" on:click={handleSave}>Save Changes</button>
      <button class="delete-btn" on:click={handleDelete}>Delete</button>
    </div>
  {:else}
    <div class="empty">Select a style to edit</div>
  {/if}
</div>

<style>
  .style-editor {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm);
  }
  .editor-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }
  .name-input {
    flex: 1;
    padding: var(--spacing-xs);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-weight: 500;
  }
  .editor-fields {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }
  .field {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: var(--font-size-sm);
  }
  .field span:first-child {
    min-width: 60px;
    color: var(--text-muted);
  }
  .field input[type='color'] {
    width: 32px;
    height: 24px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 0;
    cursor: pointer;
  }
  .field input[type='number'] {
    width: 60px;
    padding: 2px 6px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
  }
  .field input[type='range'] {
    flex: 1;
  }
  .value {
    font-size: var(--font-size-xs);
    min-width: 32px;
    text-align: right;
  }
  .editor-info {
    font-size: var(--font-size-sm);
    color: var(--text-muted);
  }
  .editor-actions {
    display: flex;
    gap: var(--spacing-xs);
  }
  .save-btn {
    flex: 1;
    padding: var(--spacing-xs);
    background: var(--accent);
    color: var(--text-on-accent);
    border: none;
    border-radius: var(--radius-sm);
    cursor: pointer;
  }
  .delete-btn {
    padding: var(--spacing-xs) var(--spacing-sm);
    background: none;
    border: 1px solid var(--text-error);
    color: var(--text-error);
    border-radius: var(--radius-sm);
    cursor: pointer;
  }
  .empty {
    color: var(--text-muted);
    text-align: center;
    padding: var(--spacing-lg);
  }
</style>
