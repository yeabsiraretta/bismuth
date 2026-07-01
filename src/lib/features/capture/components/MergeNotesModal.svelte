<script lang="ts">
  import Modal from '@/components/ui/layout/Modal.svelte';
  import Spinner from '@/components/ui/feedback/Spinner.svelte';
  import EmptyState from '@/components/ui/feedback/EmptyState.svelte';
  import { mergeNotesCmd } from '@/features/capture';
  import { showToast } from '@/stores/toast/toast';
  import { log } from '@/utils/logger';

  export let isOpen: boolean = false;
  export let sources: string[] = [];
  export let onClose: () => void;
  export let onMerged: ((detail: { targetPath: string }) => void) | undefined = undefined;

  let targetPath = '';
  let isMerging = false;
  let error = '';

  $: isValid = sources.length >= 2 && targetPath.trim().length > 0;

  function getFileName(path: string): string {
    return path.split('/').pop() ?? path;
  }

  async function handleMerge() {
    if (!isValid) return;
    error = '';
    isMerging = true;
    try {
      await mergeNotesCmd(sources, targetPath.trim());
      showToast(`Merged ${sources.length} notes into ${getFileName(targetPath)}`, 'success');
      onMerged?.({ targetPath: targetPath.trim() });
      onClose();
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
      log.error('Merge failed', e, { sources, targetPath });
    } finally {
      isMerging = false;
    }
  }
</script>

<Modal title="Merge Notes" {isOpen} {onClose}>
  <div class="merge-content">
    {#if sources.length < 2}
      <EmptyState icon="git-merge" title="Select notes to merge" description="Select 2 or more notes from the capture dashboard." />
    {:else}
      <div class="merge-body">
        <div class="sources-section">
          <p class="label">Merging {sources.length} notes (in order):</p>
          <ol class="source-list">
            {#each sources as src}
              <li class="source-item" title={src}>{getFileName(src)}</li>
            {/each}
          </ol>
        </div>

        <div class="target-section">
          <label for="merge-target" class="label">Target file path</label>
          <input
            id="merge-target"
            class="target-input"
            type="text"
            bind:value={targetPath}
            placeholder="notes/merged-note.md"
          />
          <p class="hint">The merged note will be created or overwritten at this path.</p>
        </div>

        {#if error}
          <p class="error">{error}</p>
        {/if}
      </div>
    {/if}
  </div>

  <svelte:fragment slot="footer">
    <button class="btn btn-secondary" on:click={onClose} disabled={isMerging}>Cancel</button>
    <button class="btn btn-primary" on:click={handleMerge} disabled={!isValid || isMerging}>
      {#if isMerging}<Spinner size="sm" />{/if}
      Merge {sources.length} Notes
    </button>
  </svelte:fragment>
</Modal>

<style>
  .merge-content { min-width: 380px; }
  .merge-body { display: flex; flex-direction: column; gap: var(--spacing-m); }
  .label { font-size: var(--font-ui-small); font-weight: 600; color: var(--text-normal); margin: 0 0 var(--spacing-xs); }
  .source-list { margin: 0; padding-left: var(--spacing-l); display: flex; flex-direction: column; gap: var(--spacing-xxs, 2px); }
  .source-item { font-size: var(--font-ui-small); color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .target-input { width: 100%; padding: var(--spacing-s) var(--spacing-m); background: var(--background-modifier-form-field); border: 1px solid var(--border-color); border-radius: var(--radius-s); font-size: var(--font-ui-small); color: var(--text-normal); box-sizing: border-box; }
  .target-input:focus { outline: none; border-color: var(--interactive-accent); }
  .hint { font-size: var(--font-smallest); color: var(--text-faint); margin: var(--spacing-xs) 0 0; }
  .error { font-size: var(--font-ui-small); color: var(--color-danger); margin: 0; }
  .btn { display: inline-flex; align-items: center; gap: var(--spacing-xs); padding: var(--spacing-xs) var(--spacing-m); border-radius: var(--radius-s); font-size: var(--font-ui-small); font-weight: 500; cursor: pointer; border: none; transition: all 0.15s; }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-primary { background: var(--interactive-accent); color: var(--text-on-accent); }
  .btn-primary:hover:not(:disabled) { opacity: 0.9; }
  .btn-secondary { background: var(--color-surface); color: var(--color-text); border: 1px solid var(--color-border); }
  .btn-secondary:hover:not(:disabled) { background: var(--color-border); }
</style>
