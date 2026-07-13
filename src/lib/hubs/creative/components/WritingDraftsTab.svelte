<script lang="ts">
  import {
    addDraft,
    deleteDraft,
    setActiveDraft,
  } from '@/hubs/creative/stores/writing-store.svelte';
  import type { WritingProject } from '@/hubs/creative/types/writing-types';
  import BIcon from '@/ui/b-icon.svelte';

  interface Props {
    project: WritingProject;
  }

  let { project }: Props = $props();

  let newDraftTitle = $state('');
  let showNewDraft = $state(false);

  function handleAddDraft() {
    if (!newDraftTitle.trim()) return;
    addDraft(newDraftTitle.trim());
    newDraftTitle = '';
    showNewDraft = false;
  }
</script>

<div class="wr-section">
  <div class="wr-section-header">
    <h2 class="wr-section-title">Drafts ({project.drafts.length})</h2>
    <button
      class="wr-btn wr-btn-sm"
      onclick={() => {
        showNewDraft = true;
      }}>+ Draft</button
    >
  </div>

  {#if showNewDraft}
    <div class="wr-form">
      <input
        type="text"
        bind:value={newDraftTitle}
        placeholder="Draft title…"
        class="wr-input"
        onkeydown={(e) => {
          if (e.key === 'Enter') handleAddDraft();
          if (e.key === 'Escape') showNewDraft = false;
        }}
      />
      <button class="wr-btn wr-btn-sm" onclick={handleAddDraft}>Create</button>
      <button
        class="wr-btn wr-btn-ghost"
        onclick={() => {
          showNewDraft = false;
        }}>Cancel</button
      >
    </div>
  {/if}

  <div class="wr-draft-list">
    {#each project.drafts as d (d.id)}
      <div class="wr-draft-row" class:active={d.id === project.activeDraftId}>
        <button class="wr-draft-btn" onclick={() => setActiveDraft(d.id)}>
          <span class="wr-draft-title">{d.title}</span>
          <span class="wr-draft-meta">{d.scenes.length} scenes · {d.createdAt.slice(0, 10)}</span>
        </button>
        {#if project.drafts.length > 1}
          <button
            class="wr-btn-icon wr-btn-danger-icon"
            title="Delete draft"
            onclick={() => deleteDraft(d.id)}
          >
            <BIcon name="x" size={12} />
          </button>
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  .wr-section {
    margin-bottom: 24px;
  }
  .wr-section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }
  .wr-section-title {
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--color-text);
    margin: 0;
  }
  .wr-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-surface);
    color: var(--color-text);
    font-size: 0.72rem;
    cursor: pointer;
    transition: all var(--transition-base);
  }
  .wr-btn:hover {
    border-color: var(--color-accent);
  }
  .wr-btn-sm {
    padding: 4px 8px;
    font-size: 0.68rem;
  }
  .wr-btn-ghost {
    background: transparent;
    border-color: transparent;
    color: var(--color-text-muted);
  }
  .wr-btn-ghost:hover {
    color: var(--color-text);
  }
  .wr-btn-icon {
    background: none;
    border: none;
    color: var(--color-text-muted);
    cursor: pointer;
    padding: 2px;
    border-radius: var(--radius-s);
  }
  .wr-btn-icon:hover {
    color: var(--color-text);
    background: var(--color-surface);
  }
  .wr-btn-danger-icon:hover {
    color: var(--color-error);
  }
  .wr-form {
    display: flex;
    gap: 6px;
    align-items: center;
    margin: 8px 0;
    padding: 8px;
    background: var(--color-surface);
    border-radius: var(--radius-s);
  }
  .wr-input {
    flex: 1;
    padding: 5px 8px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-background);
    color: var(--color-text);
    font-size: 0.72rem;
    font-family: inherit;
  }
  .wr-draft-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .wr-draft-row {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .wr-draft-row.active {
    border-color: var(--color-accent);
  }
  .wr-draft-btn {
    flex: 1;
    display: flex;
    justify-content: space-between;
    padding: 10px 14px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-surface);
    cursor: pointer;
    text-align: left;
    transition: all var(--transition-base);
  }
  .wr-draft-row.active .wr-draft-btn {
    border-color: var(--color-accent);
  }
  .wr-draft-btn:hover {
    border-color: var(--color-accent);
  }
  .wr-draft-title {
    font-size: 0.78rem;
    color: var(--color-text);
    font-weight: 500;
  }
  .wr-draft-meta {
    font-size: 0.65rem;
    color: var(--color-text-muted);
  }
</style>
