<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { activeEntityRelationships } from '@/stores/entity/entity';
  import { activeNote } from '@/stores/vault/vault';
  import { getPortentIcon } from '@/types/entity';

  export let onOpenNote: ((path: string) => void) | undefined = undefined;

  $: entity = $activeEntityRelationships;
  $: note = $activeNote;

  function handleOpenNote(path: string) {
    onOpenNote?.(path);
  }

  // Lifecycle badge color
  function lifecycleColor(state: string): string {
    switch (state) {
      case 'captured':
        return 'var(--text-error, #ef4444)';
      case 'organized':
        return 'var(--interactive-accent, #6366f1)';
      case 'archived':
        return 'var(--text-faint, #6b7280)';
      default:
        return 'var(--text-muted)';
    }
  }
</script>

<div class="inspector-panel">
  <div class="inspector-panel-header">
    <h3 class="inspector-panel-title">
      <Icon name="box" size={14} />
      Entity Info
    </h3>
  </div>

  <div class="inspector-content">
  {#if !note}
    <div class="inspector-empty">
      <p class="inspector-empty-title">No note selected</p>
    </div>
  {:else if entity}
    <div class="entity-content">
      <div class="entity-field">
        <span class="field-label">Type</span>
        <div class="field-value">
          <Icon name={entity.type ? getPortentIcon(entity.type) : 'file'} size={14} />
          <span>{entity.type || 'Untyped'}</span>
        </div>
      </div>

      <div class="entity-field">
        <span class="field-label">Lifecycle</span>
        <div class="field-value">
          <span class="lifecycle-dot" style="background-color: {lifecycleColor(entity.lifecycle)}"
          ></span>
          <span>{entity.lifecycle}</span>
        </div>
      </div>

      <div class="entity-field">
        <span class="field-label">Belongs To</span>
        {#if entity.belongsTo.length === 0}
          <div class="empty-hint">No parent entities</div>
        {:else}
          <div class="entity-list">
            {#each entity.belongsTo as ref}
              <button class="entity-link" on:click={() => handleOpenNote(ref.path)}>
                <Icon name="link" size={12} />
                {ref.title}
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <div class="entity-field">
        <span class="field-label">Related To</span>
        {#if entity.relatedTo.length === 0}
          <div class="empty-hint">No related entities</div>
        {:else}
          <div class="entity-list">
            {#each entity.relatedTo as ref}
              <button class="entity-link" on:click={() => handleOpenNote(ref.path)}>
                <Icon name="link" size={12} />
                {ref.title}
              </button>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  {/if}
  </div>
</div>

<style>
  .entity-content {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-m);
  }

  .entity-field .field-label {
    display: block;
    font-size: var(--font-smallest);
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: var(--spacing-xs);
  }

  .field-value {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) var(--spacing-s);
    background-color: var(--background-secondary);
    border-radius: var(--radius-s);
    font-size: var(--font-ui-small);
    color: var(--text-normal);
  }

  .entity-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .entity-link {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) var(--spacing-s);
    background: none;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    font-size: var(--font-smallest);
    color: var(--interactive-accent);
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: left;
  }

  .entity-link:hover {
    background-color: var(--background-modifier-hover);
    border-color: var(--interactive-accent);
  }

  .lifecycle-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
</style>
