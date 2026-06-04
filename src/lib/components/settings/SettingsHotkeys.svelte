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
    gap: 8px;
  }

  .hotkey-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: var(--background-secondary);
    border-radius: var(--radius-s);
  }

  .hotkey-action {
    font-size: 14px;
    color: var(--text-normal);
  }

  .hotkey-key {
    font-family: var(--font-monospace);
    font-size: 13px;
    padding: 4px 8px;
    background: var(--background-primary);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    color: var(--text-muted);
  }
</style>
