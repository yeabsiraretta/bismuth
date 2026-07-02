<script lang="ts">
  interface Hotkey {
    action: string;
    key: string;
    editable: boolean;
  }

  export let hotkeys: Hotkey[] = [];
</script>

<div class="settings-section">
  <h3>Keyboard Shortcuts</h3>

  <div class="hotkeys-list">
    {#each hotkeys as hotkey}
      <div class="hotkey-item">
        <span class="hotkey-action">{hotkey.action}</span>
        <span class="hotkey-key">{hotkey.key}</span>
      </div>
    {/each}
  </div>
</div>

<style>
  .hotkeys-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-s);
  }

  .hotkey-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-s) var(--spacing-m);
    background: var(--background-secondary);
    border-radius: var(--radius-s);
  }

  .hotkey-action {
    font-size: var(--font-ui-small);
    color: var(--text-normal);
  }

  .hotkey-key {
    font-family: var(--font-monospace);
    font-size: var(--font-smallest);
    padding: var(--spacing-xs) var(--spacing-s);
    background: var(--background-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    color: var(--text-muted);
  }
</style>
