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

<div class="entity-panel">
  <div class="panel-header">
    <Icon name="box" size={16} />
    <h3>Entity Info</h3>
  </div>

  {#if !note}
    <div class="empty-hint" style="padding: 16px;">No note selected</div>
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

<style>
  .entity-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 12px;
  }

  .panel-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
  }

  .panel-header h3 {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-normal);
    margin: 0;
  }

  .entity-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .entity-field .field-label {
    display: block;
    font-size: 11px;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    margin-bottom: 6px;
  }

  .field-value {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    background-color: var(--background-secondary);
    border-radius: var(--radius-s);
    font-size: 13px;
    color: var(--text-normal);
  }

  .empty-hint {
    font-size: 12px;
    color: var(--text-faint);
    font-style: italic;
  }

  .entity-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .entity-link {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    background: none;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    font-size: 12px;
    color: var(--interactive-accent);
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: left;
  }

  .entity-link:hover {
    background-color: var(--interactive-hover);
    border-color: var(--interactive-accent);
  }

  .lifecycle-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
</style>
