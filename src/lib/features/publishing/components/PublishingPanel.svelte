<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import PanelHeader from '@/components/ui/layout/PanelHeader.svelte';
  import { publishableNotes, publishLoading, lastPublishResult, refreshPublishableNotes, triggerPublish } from '../stores/publishing';
  import { onMount } from 'svelte';

  onMount(() => {
    refreshPublishableNotes();
  });

  async function handlePublish() {
    await triggerPublish({ output_dir: '.bismuth/publish', base_url: '/', theme: 'default', target: 'local' });
  }
</script>

<div class="publishing-panel">
  <PanelHeader icon="globe" title="Publishing" count={$publishableNotes.length || undefined}>
    <svelte:fragment slot="actions">
      <button class="icon-btn" on:click={() => refreshPublishableNotes()} title="Refresh">
        <Icon name="refresh-cw" size={14} />
      </button>
    </svelte:fragment>
  </PanelHeader>

  <div class="panel-body">
    {#if $publishLoading}
      <div class="loading">Publishing...</div>
    {:else if $publishableNotes.length === 0}
      <div class="empty-state">
        <Icon name="globe" size={28} />
        <p>No publishable notes</p>
        <p class="hint">Add <code>publish: true</code> to frontmatter</p>
      </div>
    {:else}
      <div class="note-count">{$publishableNotes.length} notes ready</div>
      <button class="publish-btn" on:click={handlePublish}>
        <Icon name="upload" size={14} />
        Publish
      </button>
      {#if $lastPublishResult}
        <div class="result">Published {$lastPublishResult.pages_published} pages</div>
      {/if}
    {/if}
  </div>
</div>

<style>
  .publishing-panel { display: flex; flex-direction: column; height: 100%; }
  .panel-body { padding: 12px; display: flex; flex-direction: column; gap: 12px; align-items: center; }
  .loading, .empty-state { text-align: center; padding: 24px; color: var(--text-muted); }
  .empty-state p { margin: 4px 0; font-size: 12px; }
  .hint { font-size: 11px; opacity: 0.7; }
  .note-count { font-size: 12px; color: var(--text-muted); }
  .publish-btn {
    display: flex; align-items: center; gap: 6px; padding: 8px 16px;
    background: var(--accent-color, #6366f1); color: white; border: none;
    border-radius: 6px; cursor: pointer; font-size: 12px;
  }
  .publish-btn:hover { opacity: 0.9; }
  .result { font-size: 11px; color: var(--text-success, #22c55e); }
  .icon-btn { display: flex; align-items: center; background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 2px; border-radius: 4px; }
  .icon-btn:hover { background: var(--hover-bg); color: var(--text-primary); }
</style>
