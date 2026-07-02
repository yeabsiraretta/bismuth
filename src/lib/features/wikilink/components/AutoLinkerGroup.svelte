<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import type { LinkSuggestion } from './autoLinkerLogic';

  export let suggestion: LinkSuggestion;
  export let expanded: boolean;
  export let isMatchSelected: (noteTitle: string, i: number) => boolean;
  export let onToggleExpand: (title: string) => void;
  export let onToggleMatch: (noteTitle: string, i: number) => void;
  export let onSelectAll: (noteTitle: string) => void;
  export let onDeselectAll: (noteTitle: string) => void;
</script>

<div class="suggestion-group">
  <div
    class="group-header"
    role="button"
    tabindex="0"
    on:click={() => onToggleExpand(suggestion.note_title)}
    on:keydown={(e) => e.key === 'Enter' && onToggleExpand(suggestion.note_title)}
  >
    <Icon name={expanded ? 'chevron-down' : 'chevron-right'} size={14} />
    <span class="note-title">{suggestion.note_title}</span>
    <span class="match-count"
      >{suggestion.matches.length} match{suggestion.matches.length !== 1 ? 'es' : ''}</span
    >
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
    <div class="group-actions" on:click|stopPropagation>
      <button
        class="action-btn"
        on:click={() => onSelectAll(suggestion.note_title)}
        title="Select all">All</button
      >
      <button
        class="action-btn"
        on:click={() => onDeselectAll(suggestion.note_title)}
        title="Deselect all">None</button
      >
    </div>
  </div>

  {#if expanded}
    <div class="match-list">
      {#each suggestion.matches as match, i}
        <label class="match-item" class:selected={isMatchSelected(suggestion.note_title, i)}>
          <input
            type="checkbox"
            checked={isMatchSelected(suggestion.note_title, i)}
            on:change={() => onToggleMatch(suggestion.note_title, i)}
          />
          <span class="match-context">
            …{match.context.slice(0, match.start > 50 ? 50 : match.start)}<mark>{match.text}</mark
            >{match.context.slice((match.start > 50 ? 50 : match.start) + match.text.length)}…
          </span>
        </label>
      {/each}
    </div>
  {/if}
</div>

<style>
  .suggestion-group {
    border: 1px solid var(--background-modifier-border, #3a3a3a);
    border-radius: 6px;
    overflow: hidden;
  }

  .group-header {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 10px 12px;
    border: none;
    background: var(--background-secondary, #252525);
    color: var(--text-normal, #e0e0e0);
    cursor: pointer;
    font-size: 13px;
    text-align: left;
  }

  .group-header:hover {
    background: var(--interactive-hover, #2f2f2f);
  }

  .note-title {
    font-weight: 500;
    flex: 1;
  }

  .match-count {
    font-size: 11px;
    color: var(--text-muted, #a0a0a0);
    padding: 2px 6px;
    background: var(--background-primary, #1e1e1e);
    border-radius: 10px;
  }

  .group-actions {
    display: flex;
    gap: 4px;
  }

  .action-btn {
    padding: 2px 8px;
    border: 1px solid var(--background-modifier-border, #3a3a3a);
    border-radius: 4px;
    background: transparent;
    color: var(--text-muted, #a0a0a0);
    font-size: 11px;
    cursor: pointer;
  }

  .action-btn:hover {
    background: var(--interactive-hover, #2f2f2f);
    color: var(--text-normal, #e0e0e0);
  }

  .match-list {
    display: flex;
    flex-direction: column;
  }

  .match-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 8px 12px 8px 32px;
    cursor: pointer;
    font-size: 12px;
    color: var(--text-normal, #e0e0e0);
    border-top: 1px solid var(--background-modifier-border, #3a3a3a);
  }

  .match-item:hover {
    background: var(--interactive-hover, #2f2f2f);
  }

  .match-item.selected {
    background: rgba(99, 102, 241, 0.08);
  }

  .match-item input[type='checkbox'] {
    margin-top: 2px;
    flex-shrink: 0;
  }

  .match-context {
    line-height: 1.5;
    word-break: break-word;
  }

  .match-context mark {
    background: rgba(99, 102, 241, 0.3);
    color: var(--text-normal, #e0e0e0);
    padding: 1px 2px;
    border-radius: 2px;
  }
</style>
