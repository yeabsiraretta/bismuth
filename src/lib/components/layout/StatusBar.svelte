<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { activeNote, currentVault, notes } from '@/stores/vault/vault';

  $: note = $activeNote;
  $: vault = $currentVault;
  $: noteCount = $notes.length;

  // Word and line count from active note
  $: wordCount = note?.content
    ? note.content.split(/\s+/).filter((w) => w.length > 0).length
    : 0;
  $: lineCount = note?.content ? note.content.split('\n').length : 0;
  $: charCount = note?.content?.length ?? 0;
</script>

<footer class="status-bar">
  <div class="status-left">
    {#if vault}
      <span class="status-item">
        <Icon name="hard-drive" size={12} />
        {vault.name}
      </span>
      <span class="status-item">
        <Icon name="file-text" size={12} />
        {noteCount} notes
      </span>
    {/if}
  </div>

  <div class="status-right">
    {#if note}
      <span class="status-item">
        <Icon name="type" size={12} />
        {wordCount} words
      </span>
      <span class="status-item">{lineCount} lines</span>
      <span class="status-item">{charCount} chars</span>
    {/if}
  </div>
</footer>

<style>
  .status-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 24px;
    padding: 0 12px;
    background-color: var(--background-secondary);
    border-top: 1px solid var(--border-color);
    font-size: 11px;
    color: var(--text-muted);
    flex-shrink: 0;
    user-select: none;
  }

  .status-left,
  .status-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .status-item {
    display: flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
  }
</style>
