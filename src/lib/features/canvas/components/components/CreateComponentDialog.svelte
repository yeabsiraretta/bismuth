<script lang="ts">
  export let show = false;
  export let onConfirm: ((detail: { name: string; category: string }) => void) | undefined =
    undefined;
  export let onCancel: (() => void) | undefined = undefined;

  let componentName = '';
  let componentCategory = '';

  function handleConfirm() {
    if (!componentName.trim()) return;
    onConfirm?.({ name: componentName.trim(), category: componentCategory.trim() });
    reset();
  }

  function handleCancel() {
    onCancel?.();
    reset();
  }

  function reset() {
    componentName = '';
    componentCategory = '';
    show = false;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') handleConfirm();
    if (e.key === 'Escape') handleCancel();
  }
</script>

{#if show}
  <div
    class="dialog-overlay"
    on:click={handleCancel}
    on:keydown={handleKeydown}
    role="presentation"
  >
    <div
      class="dialog"
      on:click|stopPropagation
      role="dialog"
      aria-labelledby="create-comp-title"
      tabindex="-1"
    >
      <h3 id="create-comp-title" class="dialog-title">Create Component</h3>

      <div class="dialog-body">
        <label class="field">
          <span class="field-label">Name</span>
          <!-- svelte-ignore a11y_autofocus -->
          <input
            type="text"
            bind:value={componentName}
            placeholder="e.g. Button, Card, Header"
            class="field-input"
            autofocus
            on:keydown={handleKeydown}
          />
        </label>

        <label class="field">
          <span class="field-label">Category (optional)</span>
          <input
            type="text"
            bind:value={componentCategory}
            placeholder="e.g. UI, Layout, Navigation"
            class="field-input"
            on:keydown={handleKeydown}
          />
        </label>
      </div>

      <div class="dialog-actions">
        <button class="btn btn-secondary" on:click={handleCancel}>Cancel</button>
        <button class="btn btn-primary" on:click={handleConfirm} disabled={!componentName.trim()}>
          Create
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .dialog-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .dialog {
    background: var(--background-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-l);
    padding: var(--spacing-l);
    width: 320px;
    max-width: calc(90vw / var(--ui-scale, 1));
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  }

  .dialog-title {
    margin: 0 0 var(--spacing-m) 0;
    font-size: 16px;
    font-weight: var(--font-semibold);
    color: var(--text-normal);
  }

  .dialog-body {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-m);
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .field-label {
    font-size: 12px;
    color: var(--text-muted);
    font-weight: 500;
  }

  .field-input {
    padding: 8px 12px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    font-size: 13px;
    background: var(--background-modifier-form-field);
    color: var(--text-normal);
  }

  .field-input:focus {
    outline: none;
    border-color: var(--interactive-accent);
    box-shadow: 0 0 0 2px rgba(var(--interactive-accent-rgb, 99, 102, 241), 0.2);
  }

  .dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-s);
    margin-top: var(--spacing-l);
  }

  .btn {
    padding: 6px 16px;
    border-radius: var(--radius-s);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid transparent;
  }

  .btn-secondary {
    background: var(--background-secondary);
    border-color: var(--border-color);
    color: var(--text-normal);
  }

  .btn-secondary:hover {
    background: var(--background-modifier-hover);
  }

  .btn-primary {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
  }

  .btn-primary:hover {
    opacity: 0.9;
  }

  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
