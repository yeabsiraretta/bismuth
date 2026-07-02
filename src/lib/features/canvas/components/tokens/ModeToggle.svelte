<script lang="ts">
  import { activeMode, availableModes } from '@/features/canvas/stores/design';

  function setMode(modeId: string) {
    activeMode.set(modeId);
  }
</script>

<div class="mode-toggle">
  {#each $availableModes as mode (mode.id)}
    <button
      class="mode-btn"
      class:active={$activeMode === mode.id}
      on:click={() => setMode(mode.id)}
      title={mode.name}
    >
      {mode.name}
    </button>
  {/each}
</div>

<style>
  .mode-toggle {
    display: flex;
    gap: 2px;
    padding: 2px;
    background: var(--color-bg-inset);
    border-radius: 4px;
  }
  .mode-btn {
    padding: 2px 8px;
    font-size: 11px;
    border: none;
    background: transparent;
    color: var(--color-text-secondary);
    border-radius: 3px;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .mode-btn:hover {
    color: var(--color-text);
  }
  .mode-btn.active {
    background: var(--color-bg-elevated);
    color: var(--color-text);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
</style>
