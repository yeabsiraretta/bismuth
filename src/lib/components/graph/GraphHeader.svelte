<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';

  export let onRefresh: () => void;
</script>

<div class="graph-header">
  <div class="graph-nav">
    <button class="nav-btn" title="Back">
      <Icon name="arrow-left" size={14} />
    </button>
    <button class="nav-btn" title="Forward">
      <Icon name="arrow-right" size={14} />
    </button>
  </div>
  <span class="graph-title">Graph view</span>
  <div class="graph-header-actions">
    <button class="nav-btn" on:click={onRefresh} title="Refresh">
      <Icon name="refresh-cw" size={14} />
    </button>
  </div>
</div>

<style>
  .graph-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: var(--background-secondary, #16213e);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    min-height: 36px;
  }

  .graph-nav {
    display: flex;
    gap: 4px;
  }

  .graph-title {
    font-size: 13px;
    font-weight: 500;
    color: rgba(200, 200, 220, 0.8);
  }

  .graph-header-actions {
    display: flex;
    gap: 4px;
  }

  .nav-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    width: auto;
    min-width: 24px;
    height: 24px;
    padding: 0 6px;
    background: none;
    border: none;
    border-radius: 4px;
    color: rgba(200, 200, 220, 0.6);
    cursor: pointer;
    font-size: 11px;
    transition: all 0.15s ease;
  }

  .nav-btn:hover {
    background: rgba(255, 255, 255, 0.08);
    color: rgba(200, 200, 220, 1);
  }
</style>
