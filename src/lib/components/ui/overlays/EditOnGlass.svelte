<script lang="ts">
  import { tick } from 'svelte';
  import Button from '@/components/ui/actions/Button.svelte';

  export let isEditable: boolean = true;
  export let isEditing: boolean = false;
  export let editLabel: string = 'Edit';
  export let saveLabel: string = 'Save';
  export let onEditStart: () => void = () => {};
  export let onSave: () => void = () => {};
  export let onCancel: () => void = () => {};

  let slotWrapper: HTMLElement;

  async function handleEdit() {
    onEditStart();
    await tick();
    const focusable = slotWrapper?.querySelector<HTMLElement>(
      'input, textarea, select, [contenteditable], [tabindex]:not([tabindex="-1"])'
    );
    focusable?.focus();
  }
</script>

<div
  class="edit-on-glass"
  class:is-editing={isEditing}
  class:is-disabled={!isEditable}
  data-editing={isEditing}
  data-editable={isEditable}
>
  <div bind:this={slotWrapper} class="eog-content">
    <slot />
  </div>

  {#if !isEditing}
    <div class="eog-hover-overlay" aria-hidden="true">
      {#if isEditable}
        <Button variant="secondary" size="xs" ariaLabel={editLabel} on:click={handleEdit}>
          {editLabel}
        </Button>
      {:else}
        <span class="eog-lock-icon" title="This field is locked">&#128274;</span>
      {/if}
    </div>
  {:else}
    <div class="eog-edit-actions">
      <Button variant="primary" size="xs" on:click={onSave}>{saveLabel}</Button>
      <Button variant="secondary" size="xs" on:click={onCancel}>Cancel</Button>
    </div>
  {/if}
</div>

<style>
  .edit-on-glass {
    position: relative;
    border-radius: var(--radius-s);
    transition: border-color var(--transition-fast, 150ms ease);
  }

  .edit-on-glass:hover:not(.is-editing):not(.is-disabled) {
    outline: 1px solid var(--border-hover);
  }

  .eog-content {
    width: 100%;
  }

  .eog-hover-overlay {
    position: absolute;
    top: var(--spacing-xs, 4px);
    right: var(--spacing-xs, 4px);
    display: flex;
    gap: var(--spacing-xs, 4px);
    opacity: 0;
    transition: opacity var(--transition-fast, 150ms ease);
    pointer-events: none;
  }

  .edit-on-glass:hover:not(.is-editing) .eog-hover-overlay {
    opacity: 1;
    pointer-events: auto;
  }

  .eog-lock-icon {
    font-size: var(--font-ui-small);
    color: var(--text-muted);
  }

  .eog-edit-actions {
    display: flex;
    gap: var(--spacing-s, 8px);
    margin-top: var(--spacing-s, 8px);
    justify-content: flex-end;
  }
</style>
