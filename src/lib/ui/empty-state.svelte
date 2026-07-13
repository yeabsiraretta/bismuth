<script lang="ts">
  /** Centred placeholder shown when a list or panel has no content. @component */
  import BIcon from '@/ui/b-icon.svelte';

  let {
    icon = 'inbox',
    title = 'Nothing here',
    description = '',
    actionLabel = '',
    onclick = undefined,
  }: {
    icon?: string;
    title?: string;
    description?: string;
    actionLabel?: string;
    onclick?: () => void;
  } = $props();
</script>

<div class="empty-state">
  <BIcon name={icon} size={32} class="empty-icon" />
  <p class="empty-title">{title}</p>
  {#if description}
    <p class="empty-desc">{description}</p>
  {/if}
  {#if actionLabel}
    <button class="empty-action" {onclick}>{actionLabel}</button>
  {/if}
</div>

<style>
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px 16px;
    text-align: center;
    gap: 8px;
  }
  .empty-state :global(.empty-icon) {
    width: 32px;
    height: 32px;
    color: var(--color-text-subtle);
    opacity: 0.6;
  }
  .empty-title {
    margin: 0;
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--color-text-muted);
  }
  .empty-desc {
    margin: 0;
    font-size: 0.7rem;
    color: var(--color-text-subtle);
    max-width: 200px;
  }
  .empty-action {
    margin-top: 4px;
    padding: 4px 10px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--color-accent);
    font-size: 0.7rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color var(--transition-base);
  }
  .empty-action:hover {
    background: var(--color-surface-hover);
  }
</style>
