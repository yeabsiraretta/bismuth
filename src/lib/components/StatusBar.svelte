<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';

  // Props
  export let content: string = '';
  export let cursorLine: number = 1;
  export let cursorCol: number = 1;
  export let backlinksCount: number = 0;

  // Computed values
  $: wordCount = content.split(/\s+/).filter(Boolean).length;
  $: charCount = content.length;
</script>

<div class="status-bar">
  <div class="status-left">
    <span class="status-item">
      <Icon name="file-text" size={12} />
      {wordCount} words
    </span>
    <span class="status-item">
      {charCount} characters
    </span>
    <span class="status-item">
      Ln {cursorLine}, Col {cursorCol}
    </span>
  </div>

  <div class="status-right">
    <span class="status-item">
      <Icon name="link" size={12} />
      {backlinksCount} backlinks
    </span>
    <span class="status-item">
      <Icon name="zap" size={12} />
      Smart v2.4.4
    </span>
  </div>
</div>

<style>
  .status-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 16px;
    border-top: 1px solid var(--border-color);
    background-color: var(--background-secondary);
    font-size: 11px;
    color: var(--text-muted);
    height: 24px;
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
  }
</style>
