<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { gaps, selectedGapIdx, selectGap } from '../../stores/analyticsStore';
</script>

<div class="gaps-panel">
  <h4 class="section-title">Structural Gaps</h4>
  <p class="section-desc">
    Clusters that could be better connected — potential areas for new ideas.
  </p>

  {#if $gaps.length === 0}
    <div class="empty">
      <Icon name="check" size={16} />
      <span>No significant gaps found. Your knowledge graph is well-connected!</span>
    </div>
  {:else}
    <div class="gap-list">
      {#each $gaps as gap, idx (idx)}
        <button
          class="gap-item"
          class:selected={$selectedGapIdx === idx}
          on:click={() => selectGap($selectedGapIdx === idx ? null : idx)}
        >
          <div class="gap-header">
            <span class="gap-icon">⚡</span>
            <span class="gap-label">{gap.labelA}</span>
            <span class="gap-arrow">↔</span>
            <span class="gap-label">{gap.labelB}</span>
            <span class="gap-score">{(gap.disconnection * 100).toFixed(0)}%</span>
          </div>
        </button>

        {#if $selectedGapIdx === idx}
          <div class="gap-detail">
            <div class="bridge-section">
              <span class="bridge-label">Bridge concepts from "{gap.labelA}":</span>
              <div class="bridge-pills">
                {#each gap.bridgeConcepts.fromA as concept}
                  <span class="bridge-pill a">{concept}</span>
                {/each}
              </div>
            </div>
            <div class="bridge-section">
              <span class="bridge-label">Bridge concepts from "{gap.labelB}":</span>
              <div class="bridge-pills">
                {#each gap.bridgeConcepts.fromB as concept}
                  <span class="bridge-pill b">{concept}</span>
                {/each}
              </div>
            </div>
            <div class="gap-suggestion">
              <Icon name="lightbulb" size={12} />
              <span
                >Try connecting <strong>{gap.bridgeConcepts.fromA[0]}</strong> with
                <strong>{gap.bridgeConcepts.fromB[0]}</strong> to bridge this gap.</span
              >
            </div>
          </div>
        {/if}
      {/each}
    </div>
  {/if}
</div>

<style>
  .gaps-panel {
    padding: var(--spacing-s);
  }
  .section-title {
    font-size: 12px;
    font-weight: 600;
    margin: 0 0 2px;
    color: var(--text-normal);
  }
  .section-desc {
    font-size: 10px;
    color: var(--text-muted);
    margin: 0 0 var(--spacing-s);
  }
  .empty {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: 11px;
    color: var(--text-muted);
    padding: var(--spacing-m);
  }
  .gap-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .gap-item {
    width: 100%;
    padding: 6px 8px;
    border: none;
    background: none;
    border-radius: var(--radius-s);
    cursor: pointer;
    text-align: left;
  }
  .gap-item:hover {
    background: var(--background-modifier-hover);
  }
  .gap-item.selected {
    background: var(--background-modifier-hover);
  }
  .gap-header {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: var(--text-normal);
  }
  .gap-icon {
    font-size: 10px;
  }
  .gap-label {
    font-weight: 500;
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .gap-arrow {
    color: var(--text-faint);
    font-size: 10px;
  }
  .gap-score {
    margin-left: auto;
    font-size: 10px;
    color: var(--text-muted);
    font-family: var(--font-monospace);
  }
  .gap-detail {
    padding: 6px 8px 6px 24px;
  }
  .bridge-section {
    margin-bottom: 6px;
  }
  .bridge-label {
    font-size: 9px;
    color: var(--text-muted);
  }
  .bridge-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 3px;
    margin-top: 2px;
  }
  .bridge-pill {
    font-size: 10px;
    padding: 1px 6px;
    border-radius: 10px;
  }
  .bridge-pill.a {
    background: rgba(74, 158, 255, 0.15);
    color: #4a9eff;
  }
  .bridge-pill.b {
    background: rgba(255, 107, 107, 0.15);
    color: #ff6b6b;
  }
  .gap-suggestion {
    display: flex;
    align-items: flex-start;
    gap: 4px;
    font-size: 10px;
    color: var(--text-muted);
    padding: 6px 8px;
    background: var(--background-secondary);
    border-radius: var(--radius-s);
    margin-top: 4px;
  }
</style>
