<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import ClassificationMetaPanel from './ClassificationMetaPanel.svelte';
  import type { PortentType, LifecycleState } from '@/types/data/entity';

  export let title: string;
  export let content: string;
  export let path: string;
  export let type: PortentType | string | undefined = undefined;
  export let lifecycle: LifecycleState = 'captured';
  export let portentTypes: string[] = [];
  export let lifecycleStates: LifecycleState[] = [];
  export let tags: string[] = [];
  export let onBack: () => void;
  export let onSave: (data: { title: string; content: string; type: string; lifecycle: string; tags: string[] }) => void;
  export let onDelete: () => void;

  let editedTitle = title;
  let editedContent = content;
  let selectedType = type || '';
  let selectedLifecycle: LifecycleState = lifecycle;
  let editedTags = tags.join(', ');
  let hasChanges = false;

  $: hasChanges =
    editedTitle !== title ||
    editedContent !== content ||
    selectedType !== (type || '') ||
    selectedLifecycle !== lifecycle ||
    editedTags !== tags.join(', ');

  function handleSave() {
    const parsedTags = editedTags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);
    onSave({
      title: editedTitle,
      content: editedContent,
      type: selectedType,
      lifecycle: selectedLifecycle,
      tags: parsedTags,
    });
  }
</script>

<div class="classification-view">
  <div class="cv-header">
    <button class="cv-back" on:click={onBack} title="Back to Inbox" aria-label="Back to inbox">
      <Icon name="arrow-left" size={16} />
    </button>
    <span class="cv-path">{path.split('/').pop()}</span>
    <div class="cv-header-actions">
      {#if hasChanges}
        <button class="cv-save-btn" on:click={handleSave}>
          <Icon name="check" size={14} />
          Save
        </button>
      {/if}
      <button class="cv-delete-btn" on:click={onDelete} title="Delete note" aria-label="Delete">
        <Icon name="trash-2" size={14} />
      </button>
    </div>
  </div>

  <div class="cv-body">
    <div class="cv-editor-section">
      <input
        class="cv-title-input"
        bind:value={editedTitle}
        placeholder="Note title..."
        aria-label="Note title"
      />
      <textarea
        class="cv-content-input"
        bind:value={editedContent}
        placeholder="Write your note..."
        aria-label="Note content"
      ></textarea>
    </div>

    <ClassificationMetaPanel
      bind:selectedType
      bind:selectedLifecycle
      bind:editedTags
      {portentTypes}
      {lifecycleStates}
    />
  </div>
</div>

<style>
  .classification-view {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--background-primary);
  }

  .cv-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
    padding: var(--spacing-s) var(--spacing-m);
    border-bottom: 1px solid var(--border-color);
    flex-shrink: 0;
  }

  .cv-back {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: none;
    border: none;
    border-radius: var(--radius-s);
    color: var(--text-muted);
    cursor: pointer;
  }

  .cv-back:hover {
    background: var(--background-modifier-hover);
    color: var(--text-normal);
  }

  .cv-path {
    font-size: var(--font-size-xs);
    color: var(--text-faint);
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .cv-header-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .cv-save-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    border: none;
    border-radius: var(--radius-s);
    font-size: var(--font-size-xs);
    font-weight: 600;
    cursor: pointer;
  }

  .cv-save-btn:hover {
    opacity: 0.9;
  }

  .cv-delete-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: none;
    border: none;
    border-radius: var(--radius-s);
    color: var(--text-muted);
    cursor: pointer;
  }

  .cv-delete-btn:hover {
    background: var(--background-modifier-error);
    color: var(--text-on-accent);
  }

  .cv-body {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  .cv-editor-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: var(--spacing-m);
    overflow-y: auto;
    gap: var(--spacing-s);
  }

  .cv-title-input {
    width: 100%;
    padding: var(--spacing-s);
    border: none;
    border-bottom: 1px solid var(--border-color);
    background: transparent;
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--text-normal);
    outline: none;
  }

  .cv-title-input:focus {
    border-bottom-color: var(--interactive-accent);
  }

  .cv-content-input {
    flex: 1;
    width: 100%;
    padding: var(--spacing-s);
    border: none;
    background: transparent;
    font-family: var(--font-mono);
    font-size: var(--font-size-sm);
    color: var(--text-normal);
    line-height: 1.6;
    resize: none;
    outline: none;
    min-height: 200px;
  }

</style>
