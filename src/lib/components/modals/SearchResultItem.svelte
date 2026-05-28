<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';

  export let title: string;
  export let path: string;
  export let snippet: string;
  export let score: number;
  export let selected = false;
  export let index: number;
  export let onSelect: () => void;
</script>

<button
  class="result-item"
  class:selected
  data-index={index}
  on:click={onSelect}
>
  <div class="result-header">
    <Icon name="file-text" size={14} />
    <span class="result-title">{title}</span>
    <span class="result-score">{Math.round(score * 100)}%</span>
  </div>
  <div class="result-path">{path}</div>
  <div class="result-snippet">{snippet}</div>
</button>

<style>
  .result-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 12px;
    background: none;
    border: 1px solid transparent;
    border-radius: var(--radius-s);
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: left;
    width: 100%;
    margin-bottom: 4px;
  }

  .result-item:hover {
    background-color: var(--interactive-hover);
    border-color: var(--border-color);
  }

  .result-item.selected {
    background-color: var(--interactive-accent);
    border-color: var(--interactive-accent);
  }

  .result-item.selected .result-title,
  .result-item.selected .result-path,
  .result-item.selected .result-snippet,
  .result-item.selected .result-score {
    color: var(--text-on-accent);
  }

  .result-header {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .result-title {
    flex: 1;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-normal);
  }

  .result-score {
    font-size: 11px;
    color: var(--text-faint);
    font-weight: 600;
  }

  .result-path {
    font-size: 11px;
    color: var(--text-muted);
    font-family: var(--font-monospace);
  }

  .result-snippet {
    font-size: 12px;
    color: var(--text-muted);
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    line-clamp: 2;
    overflow: hidden;
  }
</style>
