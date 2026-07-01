<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';

  export let centerNode: string;
  export let depth: number;
  export let onDepthChange: (d: number) => void;
  export let onShowGlobal: () => void;
</script>

<div class="local-graph-info">
  <span class="local-label">Local: {centerNode}</span>
  <label>
    Depth: {depth}
    <input
      type="range"
      min="1"
      max="5"
      value={depth}
      on:input={(e) => onDepthChange(Number(e.currentTarget.value))}
    />
  </label>
  <button class="nav-btn" on:click={onShowGlobal} title="Show global graph">
    <Icon name="maximize-2" size={12} />
    Global
  </button>
</div>

<style>
  .local-graph-info {
    position: absolute;
    bottom: 12px;
    left: 12px;
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(30, 30, 50, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    padding: 8px 12px;
    font-size: 12px;
    color: rgba(200, 200, 220, 0.8);
    backdrop-filter: blur(8px);
  }

  .local-graph-info label {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .local-graph-info input[type='range'] {
    width: 80px;
  }

  .local-label {
    font-weight: 500;
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
