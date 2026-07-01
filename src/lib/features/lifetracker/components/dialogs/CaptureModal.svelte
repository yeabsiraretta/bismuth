<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { propertyDefs, captureState, closeCapture, captureProgress } from '../../stores/trackerStore';
  import { validateValue, coerceValue, savePropertyValue } from '../../services/capture';
  import type { PropertyDefinition } from '../../types';

  $: defs = $propertyDefs;
  $: state = $captureState;
  $: currentDef = defs[state.currentIndex] as PropertyDefinition | undefined;
  $: isBatch = state.batchPaths.length > 1;
  $: currentPath = isBatch ? state.batchPaths[state.batchIndex] : state.notePath;
  $: currentFileName = currentPath?.split('/').pop()?.replace('.md', '') ?? '';

  let inputValue: string = '';
  let error: string | null = null;
  let saving = false;

  $: if (currentDef) {
    const existing = state.values[currentDef.name];
    inputValue = existing !== undefined ? String(existing) : String(currentDef.defaultValue ?? '');
    error = null;
  }

  async function handleSave() {
    if (!currentDef || !currentPath) return;
    const coerced = coerceValue(inputValue, currentDef.type);
    const validation = validateValue(coerced, currentDef.type, currentDef.constraints);
    if (!validation.valid) { error = validation.error ?? 'Invalid'; return; }

    saving = true;
    if (coerced !== undefined) {
      await savePropertyValue(currentPath, currentDef.name, coerced);
    }
    captureState.update(s => ({ ...s, values: { ...s.values, [currentDef!.name]: coerced } }));
    saving = false;
    next();
  }

  function next() {
    captureState.update(s => {
      if (s.currentIndex < defs.length - 1) return { ...s, currentIndex: s.currentIndex + 1 };
      if (isBatch && s.batchIndex < s.batchPaths.length - 1) {
        return { ...s, currentIndex: 0, batchIndex: s.batchIndex + 1, notePath: s.batchPaths[s.batchIndex + 1], values: {} };
      }
      return { ...s, active: false };
    });
  }

  function prev() {
    captureState.update(s => {
      if (s.currentIndex > 0) return { ...s, currentIndex: s.currentIndex - 1 };
      if (isBatch && s.batchIndex > 0) {
        return { ...s, currentIndex: defs.length - 1, batchIndex: s.batchIndex - 1, notePath: s.batchPaths[s.batchIndex - 1], values: {} };
      }
      return s;
    });
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') closeCapture();
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave(); }
  }
</script>

{#if state.active && currentDef}
  <div class="capture-overlay" on:click|self={closeCapture} on:keydown={handleKeydown} role="dialog" aria-modal="true" tabindex="-1">
    <div class="capture-modal">
      <div class="capture-header">
        <h3 class="capture-title">
          {#if isBatch}
            <span class="batch-badge">Note {state.batchIndex + 1}/{state.batchPaths.length}</span>
          {/if}
          {currentFileName}
        </h3>
        <button class="close-btn" on:click={closeCapture}>
          <Icon name="x" size={16} />
        </button>
      </div>

      <div class="progress-bar">
        <div class="progress-fill" style="width:{$captureProgress}%"></div>
      </div>

      <div class="capture-body">
        <div class="prop-counter">{state.currentIndex + 1} / {defs.length}</div>
        <label class="prop-label">{currentDef.name}</label>

        {#if currentDef.type === 'checkbox'}
          <label class="checkbox-row">
            <input type="checkbox" bind:checked={inputValue} />
            <span>{currentDef.name}</span>
          </label>
        {:else if currentDef.type === 'number'}
          <input type="number" class="capture-input" bind:value={inputValue}
            min={currentDef.constraints?.min} max={currentDef.constraints?.max}
            placeholder="Enter number..." />
        {:else if currentDef.type === 'date'}
          <input type="date" class="capture-input" bind:value={inputValue} />
        {:else if currentDef.constraints?.allowedValues?.length}
          <select class="capture-input" bind:value={inputValue}>
            <option value="">Select...</option>
            {#each currentDef.constraints.allowedValues as opt}
              <option value={opt}>{opt}</option>
            {/each}
          </select>
        {:else}
          <input type="text" class="capture-input" bind:value={inputValue} placeholder="Enter value..." />
        {/if}

        {#if currentDef.valueMappings?.length}
          <div class="mappings-hint">
            {#each currentDef.valueMappings as m}
              <span class="mapping">{m.display} = {m.numeric}</span>
            {/each}
          </div>
        {/if}

        {#if error}
          <p class="error-msg">{error}</p>
        {/if}
      </div>

      <div class="capture-footer">
        <button class="nav-btn" on:click={prev} disabled={state.currentIndex === 0 && state.batchIndex === 0}>
          <Icon name="chevron-left" size={14} /> Prev
        </button>
        <button class="save-btn" on:click={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save & Next'}
        </button>
        <button class="nav-btn" on:click={next}>
          Skip <Icon name="chevron-right" size={14} />
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .capture-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
  .capture-modal { width: 400px; max-width: 90vw; background: var(--background-primary); border-radius: var(--radius-m); box-shadow: 0 8px 32px rgba(0,0,0,0.3); overflow: hidden; }
  .capture-header { display: flex; align-items: center; padding: var(--spacing-m); border-bottom: 1px solid var(--border-color); }
  .capture-title { font-size: var(--font-ui-small); font-weight: 600; margin: 0; flex: 1; display: flex; align-items: center; gap: var(--spacing-xs); }
  .batch-badge { font-size: 10px; padding: 1px 6px; background: var(--interactive-accent); color: var(--text-on-accent); border-radius: var(--radius-full, 9999px); }
  .close-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 4px; border-radius: var(--radius-s); }
  .close-btn:hover { color: var(--text-normal); }
  .progress-bar { height: 3px; background: var(--background-secondary); }
  .progress-fill { height: 100%; background: var(--interactive-accent); transition: width 0.3s; }
  .capture-body { padding: var(--spacing-l) var(--spacing-m); display: flex; flex-direction: column; gap: var(--spacing-s); }
  .prop-counter { font-size: 10px; color: var(--text-muted); text-align: center; }
  .prop-label { font-size: var(--font-ui-medium, 14px); font-weight: 600; color: var(--text-normal); text-align: center; text-transform: capitalize; }
  .capture-input { width: 100%; padding: var(--spacing-s); border: 1px solid var(--border-color); border-radius: var(--radius-s); background: var(--background-primary); color: var(--text-normal); font-size: var(--font-ui-small); text-align: center; }
  .capture-input:focus { border-color: var(--interactive-accent); outline: none; }
  .checkbox-row { display: flex; align-items: center; gap: var(--spacing-s); justify-content: center; font-size: var(--font-ui-small); }
  .mappings-hint { display: flex; gap: var(--spacing-xs); flex-wrap: wrap; justify-content: center; }
  .mapping { font-size: 10px; background: var(--background-secondary); padding: 1px 6px; border-radius: 3px; color: var(--text-muted); }
  .error-msg { color: #ef4444; font-size: 11px; text-align: center; margin: 0; }
  .capture-footer { display: flex; justify-content: space-between; padding: var(--spacing-m); border-top: 1px solid var(--border-color); }
  .nav-btn { display: flex; align-items: center; gap: 4px; padding: var(--spacing-xs) var(--spacing-s); background: none; border: 1px solid var(--border-color); border-radius: var(--radius-s); color: var(--text-muted); font-size: var(--font-ui-small); cursor: pointer; }
  .nav-btn:hover { color: var(--text-normal); }
  .nav-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .save-btn { padding: var(--spacing-xs) var(--spacing-m); background: var(--interactive-accent); color: var(--text-on-accent); border: none; border-radius: var(--radius-s); font-size: var(--font-ui-small); font-weight: 600; cursor: pointer; }
  .save-btn:disabled { opacity: 0.6; }
</style>
