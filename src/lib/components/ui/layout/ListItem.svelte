<script lang="ts">
  export let active: boolean = false;
  export let disabled: boolean = false;
</script>

<button class="list-item" class:active {disabled} on:click role="option" aria-selected={active}>
  {#if $$slots.leading}
    <span class="list-item-leading"><slot name="leading" /></span>
  {/if}
  <span class="list-item-content">
    <span class="list-item-title"><slot /></span>
    {#if $$slots.subtitle}
      <span class="list-item-subtitle"><slot name="subtitle" /></span>
    {/if}
  </span>
  {#if $$slots.trailing}
    <span class="list-item-trailing"><slot name="trailing" /></span>
  {/if}
</button>

<style>
  .list-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
    width: 100%;
    min-height: 40px;
    padding: var(--spacing-s) var(--spacing-m);
    border: none;
    background: transparent;
    color: var(--text-normal);
    font-size: var(--font-ui-small);
    text-align: left;
    border-radius: var(--radius-s);
    cursor: pointer;
    transition: background-color 0.1s ease;
  }

  .list-item:hover:not(:disabled) { background: var(--background-modifier-hover); }
  .list-item.active { background: var(--background-secondary-alt); }
  .list-item:disabled { opacity: var(--opacity-disabled, 0.5); cursor: not-allowed; }

  .list-item-leading { flex-shrink: 0; color: var(--text-muted); }

  .list-item-content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xxs, 2px);
  }

  .list-item-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  .list-item-subtitle {
    font-size: var(--font-smallest);
    color: var(--text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .list-item-trailing { flex-shrink: 0; color: var(--text-faint); }
</style>
