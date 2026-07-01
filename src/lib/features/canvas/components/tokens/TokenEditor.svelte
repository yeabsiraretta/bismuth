<script lang="ts">
  import type { DesignToken, TokenType, TokenMode } from '@/features/canvas/types/design';
  import { updateToken } from '@/features/canvas/stores/design';
  import TokenSwatch from './TokenSwatch.svelte';

  export let token: DesignToken;
  export let modes: TokenMode[] = [];
  export let onClose: (() => void) | undefined = undefined;

  let editName = token.name;
  let editDescription = token.description ?? '';
  let editType: TokenType = token.type;
  let editValues: Record<string, string> = {};

  $: {
    editValues = {};
    for (const mode of modes) {
      const val = token.values[mode.id];
      editValues[mode.id] = val !== undefined ? String(val) : '';
    }
  }

  const TOKEN_TYPES: TokenType[] = ['color', 'spacing', 'typography', 'shadow', 'radius', 'opacity'];

  function handleSave() {
    const values: Record<string, string | number> = {};
    for (const [modeId, val] of Object.entries(editValues)) {
      if (editType === 'spacing' || editType === 'radius' || editType === 'opacity') {
        values[modeId] = parseFloat(val) || 0;
      } else {
        values[modeId] = val;
      }
    }

    updateToken(token.collectionId, {
      ...token,
      name: editName,
      description: editDescription || undefined,
      type: editType,
      values,
    });
    onClose?.();
  }

  function handleCancel() {
    onClose?.();
  }
</script>

<div class="token-editor">
  <div class="field">
    <label for="token-name">Name</label>
    <input id="token-name" type="text" bind:value={editName} />
  </div>

  <div class="field">
    <label for="token-type">Type</label>
    <select id="token-type" bind:value={editType}>
      {#each TOKEN_TYPES as t}
        <option value={t}>{t}</option>
      {/each}
    </select>
  </div>

  <div class="field">
    <label for="token-desc">Description</label>
    <input id="token-desc" type="text" bind:value={editDescription} placeholder="Optional" />
  </div>

  <div class="modes-section">
    <span class="modes-label">Values per mode</span>
    {#each modes as mode (mode.id)}
      <div class="mode-value">
        <span class="mode-name">{mode.name}</span>
        <div class="mode-input-row">
          <TokenSwatch type={editType} value={editValues[mode.id] ?? null} />
          <input type="text" bind:value={editValues[mode.id]} placeholder="Value" />
        </div>
      </div>
    {/each}
  </div>

  <div class="actions">
    <button class="btn-cancel" on:click={handleCancel}>Cancel</button>
    <button class="btn-save" on:click={handleSave}>Save</button>
  </div>
</div>

<style>
  .token-editor { display: flex; flex-direction: column; gap: 12px; padding: 12px; }
  .field { display: flex; flex-direction: column; gap: 4px; }
  .field label { font-size: 11px; font-weight: 500; color: var(--color-text-secondary); }
  .field input, .field select {
    padding: 4px 8px;
    font-size: 12px;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    background: var(--color-bg);
    color: var(--color-text);
  }
  .modes-section { display: flex; flex-direction: column; gap: 6px; }
  .modes-label { font-size: 11px; font-weight: 500; color: var(--color-text-secondary); }
  .mode-value { display: flex; flex-direction: column; gap: 2px; }
  .mode-name { font-size: 10px; color: var(--color-text-muted); }
  .mode-input-row { display: flex; align-items: center; gap: 6px; }
  .mode-input-row input {
    flex: 1;
    padding: 3px 6px;
    font-size: 11px;
    border: 1px solid var(--color-border);
    border-radius: 3px;
    background: var(--color-bg);
    color: var(--color-text);
  }
  .actions { display: flex; justify-content: flex-end; gap: 8px; padding-top: 8px; border-top: 1px solid var(--color-border); }
  .btn-cancel {
    padding: 4px 12px; font-size: 11px; border: 1px solid var(--color-border);
    border-radius: 4px; background: transparent; color: var(--color-text-secondary); cursor: pointer;
  }
  .btn-save {
    padding: 4px 12px; font-size: 11px; border: none;
    border-radius: 4px; background: var(--color-accent); color: white; cursor: pointer;
  }
</style>
