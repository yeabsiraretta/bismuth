<script lang="ts">
  import { currentCanvas, selectedFlowLink, clearFlowLinkSelection } from '@/features/canvas/stores';
  import { updateFlowLink } from '@/features/canvas/stores';
  import type { CanvasElement, FlowLink, FlowTransition } from '@/features/canvas/types';
  import Icon from '@/components/icons/Icon.svelte';

  export let linkId: string;

  $: link = ($currentCanvas?.flowLinks ?? []).find((l: FlowLink) => l.id === linkId) ?? null;
  $: frames = ($currentCanvas?.elements ?? []).filter(
    (el: CanvasElement) => el.element_type === 'frame'
  );

  let editLabel = '';
  let editTargetId = '';
  let editTransType: FlowTransition['type'] = 'instant';

  $: if (link) {
    editLabel = link.label ?? '';
    editTargetId = link.toFrameId;
    editTransType = link.transition.type;
  }

  function saveEdits() {
    if (!link) return;
    updateFlowLink(link.id, {
      toFrameId: editTargetId,
      label: editLabel.trim() || undefined,
      transition: { type: editTransType, duration: editTransType === 'instant' ? 0 : 300 },
    });
    clearFlowLinkSelection();
  }

  function dismiss() { clearFlowLinkSelection(); }

  function onEditorKeydown(ev: KeyboardEvent) {
    if (ev.key === 'Enter') saveEdits();
    else if (ev.key === 'Escape') dismiss();
  }
</script>

{#if link && $selectedFlowLink === linkId}
  <div class="bismuth-flow-editor" on:keydown={onEditorKeydown} role="dialog" aria-label="Edit flow link" tabindex="-1">
    <header class="bfe-head">
      <Icon name="git-branch" size={16} />
      <span>Edit Flow Link</span>
    </header>

    <label class="bfe-field">
      <span class="bfe-lbl">Target Frame</span>
      <select bind:value={editTargetId} class="bfe-ctrl">
        {#each frames as f (f.id)}
          <option value={f.id}>{f.name || f.id}</option>
        {/each}
      </select>
    </label>

    <label class="bfe-field">
      <span class="bfe-lbl">Label</span>
      <input class="bfe-ctrl" type="text" bind:value={editLabel} placeholder="Optional..." />
    </label>

    <label class="bfe-field">
      <span class="bfe-lbl">Transition</span>
      <select bind:value={editTransType} class="bfe-ctrl">
        <option value="instant">Instant</option>
        <option value="dissolve">Dissolve</option>
        <option value="slide-left">Slide Left</option>
        <option value="slide-right">Slide Right</option>
        <option value="slide-up">Slide Up</option>
        <option value="slide-down">Slide Down</option>
      </select>
    </label>

    <footer class="bfe-actions">
      <button class="bfe-btn" on:click={dismiss}>Cancel</button>
      <button class="bfe-btn bfe-btn-primary" on:click={saveEdits}>Save</button>
    </footer>
  </div>
{/if}

<style>
  .bismuth-flow-editor {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-m, 8px);
    padding: var(--spacing-m, 16px);
    min-width: 260px;
    box-shadow: var(--shadow-l, 0 8px 24px rgba(0,0,0,0.3));
    z-index: var(--layer-popover, 1000);
    display: flex; flex-direction: column; gap: 12px;
    outline: none;
  }
  .bfe-head {
    display: flex; align-items: center; gap: 8px;
    font-weight: var(--font-semibold, 600);
    font-size: var(--font-ui-small);
    color: var(--text-normal);
  }
  .bfe-field { display: flex; flex-direction: column; gap: 4px; }
  .bfe-lbl {
    font-size: var(--font-smallest, 0.75rem);
    color: var(--text-muted);
    font-weight: var(--font-medium, 500);
  }
  .bfe-ctrl {
    padding: 6px 10px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s, 4px);
    background: var(--color-bg);
    color: var(--text-normal);
    font-size: var(--font-ui-small);
    outline: none; width: 100%;
  }
  .bfe-ctrl:focus { border-color: var(--interactive-accent); }
  .bfe-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px; }
  .bfe-btn {
    padding: 6px 14px; border-radius: var(--radius-s, 4px);
    font-size: var(--font-ui-small); cursor: pointer;
    border: 1px solid var(--color-border);
    background: var(--color-bg); color: var(--text-normal);
  }
  .bfe-btn:hover { background: var(--color-surface-hover); }
  .bfe-btn-primary {
    background: var(--interactive-accent);
    border-color: var(--interactive-accent);
    color: var(--text-on-accent);
  }
  .bfe-btn-primary:hover { opacity: 0.9; }
</style>