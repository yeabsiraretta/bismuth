<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';

  export let icon: string = 'inbox';
  export let title: string = 'Nothing here';
  export let description: string = '';
  export let actionLabel: string = '';
</script>

<div class="empty-state">
  <div class="empty-state-icon">
    <Icon name={icon} size={32} />
  </div>
  <p class="empty-state-title">{title}</p>
  {#if description}
    <p class="empty-state-desc">{description}</p>
  {/if}
  {#if actionLabel}
    <button class="empty-state-action" on:click>{actionLabel}</button>
  {/if}
</div>

<style>
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-xl) var(--spacing-m);
    text-align: center;
    gap: var(--spacing-s);
  }

  .empty-state-icon {
    color: var(--text-faint);
    opacity: 0.6;
  }

  .empty-state-title {
    margin: 0;
    font-size: var(--font-ui-small);
    font-weight: var(--font-medium);
    color: var(--text-muted);
  }

  .empty-state-desc {
    margin: 0;
    font-size: var(--font-smallest);
    color: var(--text-faint);
    max-width: 200px;
  }

  .empty-state-action {
    margin-top: var(--spacing-xs);
    padding: var(--spacing-xs) var(--spacing-s);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--text-accent);
    font-size: var(--font-smallest);
    font-weight: var(--font-medium);
    cursor: pointer;
    transition: background-color var(--transition-fast);
  }

  .empty-state-action:hover {
    background: var(--background-modifier-hover);
  }
</style>
