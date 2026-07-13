<script lang="ts">
  import {
    addCustomHotkey,
    findConflict,
    getCustomHotkeys,
    getHotkeys,
    getOverrides,
    rebindHotkey,
    removeCustomHotkey,
    resetAllBindings,
    resetHotkeyBinding,
    type CustomHotkey,
  } from '@/hubs/core/stores/hotkey-store.svelte';
  import { getCommands } from '@/hubs/core/stores/command-store.svelte';

  let hotkeys = $derived(getHotkeys());
  let overrides = $derived(getOverrides());
  let customs = $derived(getCustomHotkeys());
  let commands = $derived(getCommands());
  let filter = $state('');

  let recordingId: string | null = $state(null);
  let conflictWarning = $state('');

  let showAddForm = $state(false);
  let newName = $state('');
  let newKeys = $state('');
  let newCommandId = $state('');
  let recordingNew = $state(false);

  const matchFilter = (h: { name: string; keys: string }) =>
    !filter ||
    h.name.toLowerCase().includes(filter.toLowerCase()) ||
    h.keys.toLowerCase().includes(filter.toLowerCase());
  let filtered = $derived(hotkeys.filter(matchFilter));
  let filteredCustoms = $derived(customs.filter(matchFilter));

  function normalizeEvent(e: KeyboardEvent): string {
    const parts: string[] = [];
    if (e.metaKey || e.ctrlKey) parts.push('Cmd');
    if (e.shiftKey) parts.push('Shift');
    if (e.altKey) parts.push('Alt');
    const key = e.key;
    if (!['Meta', 'Control', 'Shift', 'Alt'].includes(key)) {
      parts.push(key.length === 1 ? key.toUpperCase() : key);
    }
    return parts.join('+');
  }

  function startRecording(id: string) {
    recordingId = id;
  }

  function handleRecordKeydown(e: KeyboardEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.key === 'Escape') {
      cancelRecording();
      return;
    }
    const combo = normalizeEvent(e);
    if (!combo || combo === 'Cmd' || combo === 'Shift' || combo === 'Alt') return;
    const excludeId = recordingId ?? undefined;
    const conflict = findConflict(combo, excludeId);
    conflictWarning = conflict ? `"${combo}" conflicts with "${conflict.name}"` : '';
    if (conflict)
      setTimeout(() => {
        conflictWarning = '';
      }, 3000);
    if (recordingId) {
      rebindHotkey(recordingId, combo);
      recordingId = null;
    } else if (recordingNew) {
      newKeys = combo;
      recordingNew = false;
    }
  }

  function cancelRecording() {
    recordingId = null;
    recordingNew = false;
    conflictWarning = '';
  }
  function handleResetAll() {
    resetAllBindings();
    conflictWarning = '';
  }

  function handleAddCustom() {
    if (!newName.trim() || !newKeys.trim() || !newCommandId) return;
    const custom: CustomHotkey = {
      id: `custom-${Date.now()}`,
      name: newName.trim(),
      description: `Custom: ${newName.trim()}`,
      keys: newKeys.trim(),
      commandId: newCommandId,
    };
    addCustomHotkey(custom);
    newName = '';
    newKeys = '';
    newCommandId = '';
    showAddForm = false;
  }

  function getCommandName(cmdId: string): string {
    return commands.find((c) => c.id === cmdId)?.name ?? cmdId;
  }
</script>

<svelte:window onkeydown={recordingId || recordingNew ? handleRecordKeydown : undefined} />

<div class="hotkeys-panel">
  <div class="hotkeys-header">
    <input type="text" class="hotkeys-filter" placeholder="Filter hotkeys..." bind:value={filter} />
    <button
      class="hk-add-btn"
      type="button"
      onclick={() => {
        showAddForm = !showAddForm;
      }}
    >
      {showAddForm ? 'Cancel' : '+ Add Hotkey'}
    </button>
    {#if Object.keys(overrides).length > 0}
      <button class="hk-reset-all-btn" type="button" onclick={handleResetAll}> Reset All </button>
    {/if}
  </div>

  {#if showAddForm}
    <div class="hk-add-form">
      <div class="hk-add-row">
        <label class="hk-add-label"
          >Name
          <input type="text" class="hk-add-input" placeholder="My shortcut" bind:value={newName} />
        </label>
      </div>
      <div class="hk-add-row">
        <label class="hk-add-label"
          >Command
          <select class="hk-add-select" bind:value={newCommandId}>
            <option value="">Select a command…</option>
            {#each commands as cmd (cmd.id)}
              <option value={cmd.id}>{cmd.name}</option>
            {/each}
          </select>
        </label>
      </div>
      <div class="hk-add-row">
        <span class="hk-add-label">Keys</span>
        <button
          class="hk-record-btn"
          class:recording={recordingNew}
          type="button"
          onclick={() => {
            recordingNew = !recordingNew;
          }}
        >
          {#if recordingNew}
            Press keys…
          {:else if newKeys}
            <kbd>{newKeys}</kbd>
          {:else}
            Click to record
          {/if}
        </button>
      </div>
      <div class="hk-add-actions">
        <button
          class="hk-save-btn"
          type="button"
          onclick={handleAddCustom}
          disabled={!newName.trim() || !newKeys.trim() || !newCommandId}
        >
          Add Hotkey
        </button>
      </div>
    </div>
  {/if}

  {#if conflictWarning}
    <div class="hk-conflict-warning">{conflictWarning}</div>
  {/if}

  {#if recordingId}
    <div
      class="hk-recording-overlay"
      onclick={cancelRecording}
      onkeydown={cancelRecording}
      role="button"
      tabindex="-1"
    >
      <div class="hk-recording-box">
        <p class="hk-recording-text">Press a key combination…</p>
        <p class="hk-recording-hint">Press Escape to cancel</p>
      </div>
    </div>
  {/if}

  <div class="hotkeys-body">
    {#if filtered.length === 0 && filteredCustoms.length === 0}
      <p class="hotkeys-empty">
        {filter ? 'No matching hotkeys' : 'No hotkeys registered'}
      </p>
    {:else}
      <table class="hotkeys-table">
        <thead>
          <tr>
            <th>Action</th>
            <th>Shortcut</th>
            <th class="hk-actions-th"></th>
          </tr>
        </thead>
        <tbody>
          {#each filtered as hotkey (hotkey.id)}
            {@const isOverridden = hotkey.id in overrides}
            <tr class:hk-overridden={isOverridden}>
              <td class="hotkey-label">
                {hotkey.name}
                <span class="hotkey-desc">{hotkey.description}</span>
              </td>
              <td class="hotkey-keys">
                <button
                  class="hk-key-btn"
                  type="button"
                  title="Click to rebind"
                  onclick={() => startRecording(hotkey.id)}
                >
                  <kbd>{overrides[hotkey.id] ?? hotkey.keys}</kbd>
                </button>
              </td>
              <td class="hk-actions-cell">
                {#if isOverridden}
                  <button
                    class="hk-reset-btn"
                    type="button"
                    title="Reset to default"
                    onclick={() => resetHotkeyBinding(hotkey.id)}
                  >
                    Reset
                  </button>
                {/if}
              </td>
            </tr>
          {/each}
          {#if filteredCustoms.length > 0}
            <tr class="hk-custom-divider"><td colspan="3"><span>Custom Hotkeys</span></td></tr>
            {#each filteredCustoms as ch (ch.id)}
              <tr class="hk-custom-row">
                <td class="hotkey-label">
                  {ch.name}
                  <span class="hotkey-desc">{getCommandName(ch.commandId)}</span>
                </td>
                <td class="hotkey-keys">
                  <button
                    class="hk-key-btn"
                    type="button"
                    title="Click to rebind"
                    onclick={() => startRecording(ch.id)}
                  >
                    <kbd>{overrides[ch.id] ?? ch.keys}</kbd>
                  </button>
                </td>
                <td class="hk-actions-cell">
                  <button
                    class="hk-delete-btn"
                    type="button"
                    title="Remove"
                    onclick={() => removeCustomHotkey(ch.id)}
                  >
                    ×
                  </button>
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    {/if}
  </div>
</div>

<style>
  .hotkeys-panel {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .hotkeys-header {
    display: flex;
    gap: 8px;
  }
  .hotkeys-filter {
    flex: 1;
    padding: 6px 10px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-m);
    background: var(--color-surface);
    color: var(--color-text);
    font-size: 0.8rem;
    font-family: inherit;
    outline: none;
  }
  .hotkeys-filter:focus {
    border-color: var(--color-accent);
  }
  .hk-add-btn,
  .hk-reset-all-btn {
    padding: 5px 12px;
    font-size: 0.75rem;
    background: transparent;
    border-radius: var(--radius-m);
    cursor: pointer;
    font-family: inherit;
    white-space: nowrap;
    transition: background 0.12s;
  }
  .hk-add-btn {
    border: 1px solid var(--color-accent);
    color: var(--color-accent);
  }
  .hk-add-btn:hover {
    background: oklch(from var(--color-accent) l c h / 0.1);
  }
  .hk-reset-all-btn {
    border: 1px solid var(--color-warning);
    color: var(--color-warning);
  }
  .hk-reset-all-btn:hover {
    background: oklch(from var(--color-warning) l c h / 0.1);
  }
  .hk-conflict-warning {
    padding: 8px 12px;
    font-size: 0.75rem;
    background: oklch(from var(--color-warning) l c h / 0.1);
    border: 1px solid var(--color-warning);
    border-radius: var(--radius-m);
    color: var(--color-warning);
    font-weight: 500;
  }
  .hk-add-form {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-m);
  }
  .hk-add-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .hk-add-label {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    min-width: 64px;
  }
  .hk-add-input,
  .hk-add-select {
    flex: 1;
    padding: 5px 8px;
    font-size: 0.8rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-background);
    color: var(--color-text);
    font-family: inherit;
    outline: none;
  }
  .hk-add-input:focus,
  .hk-add-select:focus {
    border-color: var(--color-accent);
  }
  .hk-add-actions {
    display: flex;
    justify-content: flex-end;
  }
  .hk-save-btn {
    padding: 5px 14px;
    font-size: 0.75rem;
    background: var(--color-accent);
    color: var(--color-background);
    border: none;
    border-radius: var(--radius-m);
    cursor: pointer;
    font-family: inherit;
    font-weight: 500;
  }
  .hk-save-btn:disabled {
    opacity: 0.4;
    pointer-events: none;
  }
  .hk-record-btn {
    padding: 4px 10px;
    font-size: 0.8rem;
    border: 1px dashed var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-background);
    color: var(--color-text-muted);
    cursor: pointer;
    font-family: inherit;
    min-width: 120px;
    text-align: center;
    transition: border-color 0.12s;
  }
  .hk-record-btn.recording {
    border-color: var(--color-accent);
    color: var(--color-accent);
    animation: pulse 1s infinite;
  }
  .hk-record-btn kbd {
    font-family: var(--font-mono);
    font-size: 0.7rem;
  }
  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
  .hk-recording-overlay {
    position: fixed;
    inset: 0;
    z-index: var(--z-modal);
    display: flex;
    align-items: center;
    justify-content: center;
    background: oklch(0 0 0 / 0.45);
    backdrop-filter: blur(2px);
  }
  .hk-recording-box {
    background: var(--color-surface);
    border: 2px solid var(--color-accent);
    border-radius: var(--radius-l);
    padding: 24px 32px;
    text-align: center;
  }
  .hk-recording-text {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--color-text);
    margin: 0 0 4px;
  }
  .hk-recording-hint {
    font-size: 0.7rem;
    color: var(--color-text-subtle);
    margin: 0;
  }
  .hotkeys-empty {
    text-align: center;
    color: var(--color-text-muted);
    font-size: 0.8rem;
    padding: 16px;
  }
  .hotkeys-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.8rem;
  }
  .hotkeys-table th {
    text-align: left;
    padding: 6px 8px;
    border-bottom: 1px solid var(--color-border);
    color: var(--color-text-muted);
    font-weight: 500;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .hotkeys-table td {
    padding: 6px 8px;
    border-bottom: 1px solid var(--color-border);
  }
  .hotkeys-table tr:hover td {
    background: var(--color-surface-hover);
  }
  .hk-overridden td {
    background: oklch(from var(--color-accent) l c h / 0.04);
  }
  .hotkey-label {
    color: var(--color-text);
  }
  .hotkey-desc {
    display: block;
    font-size: 0.65rem;
    color: var(--color-text-subtle);
    margin-top: 1px;
  }
  .hk-key-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
  }
  .hk-key-btn kbd {
    display: inline-block;
    padding: 2px 6px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    font-size: 0.7rem;
    font-family: var(--font-mono);
    color: var(--color-text-muted);
    cursor: pointer;
    transition:
      border-color 0.12s,
      color 0.12s;
  }
  .hk-key-btn:hover kbd {
    border-color: var(--color-accent);
    color: var(--color-accent);
  }
  .hk-actions-th,
  .hk-actions-cell {
    width: 60px;
  }
  .hk-actions-cell {
    text-align: right;
  }
  .hk-reset-btn {
    padding: 2px 8px;
    font-size: 0.65rem;
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text-muted);
    border-radius: var(--radius-s);
    cursor: pointer;
    font-family: inherit;
  }
  .hk-reset-btn:hover {
    border-color: var(--color-warning);
    color: var(--color-warning);
  }
  .hk-delete-btn {
    width: 22px;
    height: 22px;
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    font-size: 1rem;
    line-height: 1;
    border-radius: var(--radius-s);
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .hk-delete-btn:hover {
    color: var(--color-error);
    background: oklch(from var(--color-error) l c h / 0.1);
  }
  .hk-custom-divider td {
    padding: 12px 8px 4px;
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-text-subtle);
    border-bottom: 1px solid var(--color-border);
  }
  .hk-custom-row td {
    background: oklch(from var(--color-success) l c h / 0.03);
  }
</style>
