<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { performInlineEdit } from '../services/inlineEdit';
  import type { InlineEditRequest, InlineEditResult, DiffHunk } from '../types/llm';

  export let notePath: string;
  export let selectedText: string;
  export let fullContent: string;
  export let selectionStart: number;
  export let selectionEnd: number;
  export let onApply: ((detail: { replacement: string }) => void) | undefined = undefined;
  export let onCancel: (() => void) | undefined = undefined;

  let instruction = '';
  let isLoading = false;
  let result: InlineEditResult | null = null;
  let error: string | null = null;

  async function handleSubmit() {
    if (!instruction.trim() || isLoading) return;
    isLoading = true;
    error = null;
    result = null;

    try {
      const req: InlineEditRequest = {
        notePath,
        selectedText,
        instruction: instruction.trim(),
        fullContent,
        selectionStart,
        selectionEnd,
      };
      result = await performInlineEdit(req);
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    } finally {
      isLoading = false;
    }
  }

  function handleApply() {
    if (result) onApply?.({ replacement: result.replacement });
  }

  function handleCancel() {
    onCancel?.();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (result) handleApply();
      else void handleSubmit();
    }
    if (e.key === 'Escape') handleCancel();
  }

  function renderHunkClass(hunk: DiffHunk): string {
    if (hunk.type === 'insert') return 'hunk-insert';
    if (hunk.type === 'delete') return 'hunk-delete';
    return 'hunk-equal';
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class="inline-edit-overlay" on:keydown={handleKeydown} role="dialog" aria-label="Inline edit" tabindex="-1">
  <div class="inline-edit-modal">
    <div class="modal-header">
      <Icon name="edit-2" size={16} />
      <span class="modal-title">Inline Edit</span>
      <button class="close-btn" on:click={handleCancel} aria-label="Cancel">
        <Icon name="x" size={16} />
      </button>
    </div>

    {#if !result}
      <div class="selected-preview">
        <span class="preview-label">Selection:</span>
        <pre class="preview-text">{selectedText.length > 200 ? selectedText.slice(0, 200) + '...' : selectedText}</pre>
      </div>

      <div class="input-row">
        <input
          class="edit-input"
          type="text"
          bind:value={instruction}
          placeholder="How should this text be changed?"
          disabled={isLoading}
          aria-label="Edit instruction"
        />
        <button
          class="submit-btn"
          on:click={handleSubmit}
          disabled={isLoading || !instruction.trim()}
          aria-label="Generate edit"
        >
          {#if isLoading}
            <Icon name="loader" size={14} />
          {:else}
            <Icon name="sparkles" size={14} />
          {/if}
        </button>
      </div>
    {:else}
      <div class="diff-preview">
        <span class="preview-label">Preview:</span>
        <div class="diff-content">
          {#each result.diffHunks as hunk}
            <span class={renderHunkClass(hunk)}>{hunk.text}</span>
          {/each}
        </div>
      </div>

      <div class="action-row">
        <button class="action-btn action-btn--apply" on:click={handleApply} aria-label="Apply edit">
          <Icon name="check" size={14} />
          Apply
        </button>
        <button class="action-btn action-btn--retry" on:click={() => { result = null; }} aria-label="Try again">
          <Icon name="refresh-cw" size={14} />
          Retry
        </button>
        <button class="action-btn action-btn--cancel" on:click={handleCancel} aria-label="Cancel">
          Cancel
        </button>
      </div>
    {/if}

    {#if error}
      <div class="edit-error" role="alert">{error}</div>
    {/if}
  </div>
</div>

<style>
  .inline-edit-overlay {
    position: fixed;
    inset: 0;
    z-index: var(--layer-modal, 100);
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(2px);
  }

  .inline-edit-modal {
    width: min(480px, 90vw);
    max-height: 60vh;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-m);
    padding: var(--spacing-m);
    background: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-l, 12px);
    box-shadow: var(--shadow-l, 0 8px 32px rgba(0,0,0,0.2));
    overflow: hidden;
  }

  .modal-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
  }
  .modal-title {
    font-size: var(--font-ui-medium, 14px);
    font-weight: var(--font-semibold, 600);
    color: var(--text-normal);
    flex: 1;
  }
  .close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px; height: 24px;
    padding: 0; border: none;
    background: transparent;
    border-radius: var(--radius-s);
    color: var(--text-muted);
    cursor: pointer;
  }
  .close-btn:hover { background: var(--background-modifier-hover); }

  .selected-preview, .diff-preview {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .preview-label {
    font-size: var(--font-ui-smaller, 12px);
    font-weight: var(--font-medium, 500);
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.4px;
  }
  .preview-text {
    margin: 0;
    padding: var(--spacing-s);
    background: var(--background-secondary);
    border-radius: var(--radius-s);
    font-size: var(--font-ui-small, 13px);
    color: var(--text-normal);
    white-space: pre-wrap;
    word-break: break-word;
    max-height: 100px;
    overflow-y: auto;
    font-family: var(--font-monospace, monospace);
  }

  .diff-content {
    padding: var(--spacing-s);
    background: var(--background-secondary);
    border-radius: var(--radius-s);
    font-size: var(--font-ui-small, 13px);
    white-space: pre-wrap;
    word-break: break-word;
    max-height: 200px;
    overflow-y: auto;
    font-family: var(--font-monospace, monospace);
    line-height: 1.5;
  }
  .hunk-equal { color: var(--text-normal); }
  .hunk-insert { background: rgba(0, 200, 100, 0.15); color: var(--text-success, #065f46); text-decoration: none; }
  .hunk-delete { background: rgba(255, 60, 60, 0.15); color: var(--text-error, #991b1b); text-decoration: line-through; }

  .input-row {
    display: flex;
    gap: var(--spacing-xs);
  }
  .edit-input {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-s);
    background: var(--background-primary);
    color: var(--text-normal);
    font-size: var(--font-ui-small, 13px);
  }
  .edit-input:focus { border-color: var(--interactive-accent); outline: none; }
  .submit-btn {
    display: flex; align-items: center; justify-content: center;
    width: 36px; height: 36px;
    padding: 0; border: none;
    border-radius: var(--radius-s);
    background: var(--interactive-accent);
    color: var(--text-on-accent, #fff);
    cursor: pointer;
  }
  .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .action-row {
    display: flex;
    gap: var(--spacing-s);
  }
  .action-btn {
    display: flex; align-items: center; gap: 4px;
    padding: 6px 12px; border: none;
    border-radius: var(--radius-s);
    font-size: var(--font-ui-small, 13px);
    font-weight: var(--font-medium, 500);
    cursor: pointer;
  }
  .action-btn--apply { background: var(--interactive-accent); color: var(--text-on-accent, #fff); }
  .action-btn--retry { background: var(--background-modifier-border); color: var(--text-normal); }
  .action-btn--cancel { background: transparent; color: var(--text-muted); }

  .edit-error {
    font-size: var(--font-ui-smaller, 12px);
    color: var(--text-error);
    padding: var(--spacing-xs);
    background: var(--background-modifier-error);
    border-radius: var(--radius-s);
  }
</style>
