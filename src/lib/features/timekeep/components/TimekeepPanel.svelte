<script lang="ts">
  import { onDestroy } from 'svelte';
  import Icon from '@/components/icons/Icon.svelte';
  import type { TimekeepEntry, TimekeepExportFormat } from '../types/timekeep';
  import {
    timekeeps, addTimekeep, removeTimekeep, renameTimekeep,
    addEntry, removeEntry, startEntryTimer, stopEntryTimer,
    editEntryName, toggleEntryCollapsed, addSubEntryAction,
    removeSubEntryAction, startSubEntryTimer, stopSubEntryTimer,
    stopAllTimers, activeTimers,
  } from '../stores/timekeepStore';
  import {
    isRunning, isCompleted, isNotStarted,
    getEntryDurationWithSubs, formatDurationShort, formatTimestamp,
  } from '../services/timekeepService';
  import { exportTimekeep } from '../services/timekeepExport';
  import { showToast } from '@/stores/toast/toast';

  let newTimekeepTitle = '';
  let newEntryNames: Record<string, string> = {};
  let newSubEntryNames: Record<string, string> = {};
  let editingEntry: { tkId: string; idx: number } | null = null;
  let editName = '';
  let selectedTkId: string | null = null;

  // Live tick for running timers
  let tick = 0;
  const interval = setInterval(() => { tick++; }, 1000);
  onDestroy(() => clearInterval(interval));

  function elapsed(entry: TimekeepEntry): string {
    void tick;
    return formatDurationShort(getEntryDurationWithSubs(entry, new Date()));
  }

  function handleAddTimekeep() {
    const title = newTimekeepTitle.trim() || 'Untitled Timekeep';
    const id = addTimekeep(title);
    newTimekeepTitle = '';
    selectedTkId = id;
  }

  function handleAddEntry(tkId: string) {
    const name = (newEntryNames[tkId] ?? '').trim();
    if (!name) return;
    addEntry(tkId, name);
    newEntryNames[tkId] = '';
  }

  function handleAddSubEntry(tkId: string, entryIdx: number) {
    const key = `${tkId}-${entryIdx}`;
    const name = (newSubEntryNames[key] ?? '').trim();
    if (!name) return;
    addSubEntryAction(tkId, entryIdx, name);
    newSubEntryNames[key] = '';
  }

  function handleStartEdit(tkId: string, idx: number, name: string) {
    editingEntry = { tkId, idx };
    editName = name;
  }

  function handleSaveEdit() {
    if (editingEntry) {
      editEntryName(editingEntry.tkId, editingEntry.idx, editName);
      editingEntry = null;
    }
  }

  function handleExport(tkId: string, format: TimekeepExportFormat) {
    const tk = $timekeeps.find(t => t.id === tkId);
    if (!tk) return;
    const output = exportTimekeep(tk.data, { format });
    navigator.clipboard.writeText(output).then(() => {
      showToast(`Exported as ${format.toUpperCase()} to clipboard`, 'info');
    }).catch(() => {
      showToast('Failed to copy to clipboard', 'error');
    });
  }

  $: selectedTimekeep = $timekeeps.find(t => t.id === selectedTkId) ?? null;
  $: if ($timekeeps.length > 0 && !selectedTkId) selectedTkId = $timekeeps[0].id;
</script>

<div class="tk-panel">
  <div class="tk-header">
    <Icon name="clock" size={16} />
    <span class="tk-title">Timekeep</span>
    {#if $activeTimers.length > 0}
      <span class="tk-active-badge">{$activeTimers.length} running</span>
      <button class="tk-stop-all" on:click={stopAllTimers} title="Stop all timers">
        <Icon name="square" size={11} />
      </button>
    {/if}
  </div>

  <div class="tk-tabs">
    {#each $timekeeps as tk (tk.id)}
      <button
        class="tk-tab" class:active={selectedTkId === tk.id}
        on:click={() => (selectedTkId = tk.id)}
        title={tk.title}
      >
        {tk.title.length > 16 ? tk.title.slice(0, 14) + '\u2026' : tk.title}
      </button>
    {/each}
    <div class="tk-new-row">
      <input type="text" bind:value={newTimekeepTitle} placeholder="New timekeep..." class="tk-new-input" on:keydown={(e) => e.key === 'Enter' && handleAddTimekeep()} />
      <button class="tk-add-btn" on:click={handleAddTimekeep} title="Create timekeep"><Icon name="plus" size={12} /></button>
    </div>
  </div>

  {#if selectedTimekeep}
    {@const tk = selectedTimekeep}
    <div class="tk-content">
      <div class="tk-content-header">
        <input type="text" class="tk-rename" value={tk.title} on:blur={(e) => renameTimekeep(tk.id, e.currentTarget.value)} on:keydown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }} />
        <div class="tk-export-btns">
          <button class="tk-sm-btn" on:click={() => handleExport(tk.id, 'markdown')} title="Copy as Markdown"><Icon name="file-text" size={11} /></button>
          <button class="tk-sm-btn" on:click={() => handleExport(tk.id, 'csv')} title="Copy as CSV"><Icon name="grid" size={11} /></button>
          <button class="tk-sm-btn" on:click={() => handleExport(tk.id, 'json')} title="Copy as JSON"><Icon name="code" size={11} /></button>
          <button class="tk-sm-btn tk-danger" on:click={() => { removeTimekeep(tk.id); selectedTkId = null; }} title="Delete timekeep"><Icon name="trash-2" size={11} /></button>
        </div>
      </div>

      <div class="tk-entries">
        {#each tk.data.entries as entry, idx (idx)}
          <div class="tk-entry" class:running={isRunning(entry)} class:completed={isCompleted(entry)}>
            <div class="tk-entry-row">
              {#if entry.subEntries && entry.subEntries.length > 0}
                <button class="tk-collapse" on:click={() => toggleEntryCollapsed(tk.id, idx)} title={entry.collapsed ? 'Expand' : 'Collapse'}>
                  <Icon name={entry.collapsed ? 'chevron-right' : 'chevron-down'} size={12} />
                </button>
              {:else}
                <span class="tk-collapse-spacer"></span>
              {/if}

              {#if editingEntry?.tkId === tk.id && editingEntry?.idx === idx}
                <input type="text" class="tk-edit-input" bind:value={editName} on:blur={handleSaveEdit} on:keydown={(e) => e.key === 'Enter' && handleSaveEdit()} />
              {:else}
                <button class="tk-entry-name-btn" on:dblclick={() => handleStartEdit(tk.id, idx, entry.name)} title="Double-click to edit">{entry.name}</button>
              {/if}

              <span class="tk-duration">{elapsed(entry)}</span>

              <div class="tk-entry-actions">
                {#if isNotStarted(entry)}
                  <button class="tk-play" on:click={() => startEntryTimer(tk.id, idx)} title="Start"><Icon name="play" size={11} /></button>
                {:else if isRunning(entry)}
                  <button class="tk-stop" on:click={() => stopEntryTimer(tk.id, idx)} title="Stop"><Icon name="square" size={11} /></button>
                {:else}
                  <button class="tk-play" on:click={() => startEntryTimer(tk.id, idx)} title="Restart"><Icon name="refresh-cw" size={11} /></button>
                {/if}
                <button class="tk-del" on:click={() => removeEntry(tk.id, idx)} title="Delete"><Icon name="x" size={11} /></button>
              </div>
            </div>

            {#if entry.startTime}
              <div class="tk-entry-times">
                <span>{formatTimestamp(entry.startTime)}</span>
                <span>{entry.endTime ? formatTimestamp(entry.endTime) : 'running...'}</span>
              </div>
            {/if}

            {#if !entry.collapsed && entry.subEntries}
              {#each entry.subEntries as sub, si (si)}
                <div class="tk-sub-entry" class:running={isRunning(sub)}>
                  <span class="tk-sub-indent">\u2514</span>
                  <span class="tk-entry-name">{sub.name}</span>
                  <span class="tk-duration">{elapsed(sub)}</span>
                  <div class="tk-entry-actions">
                    {#if isNotStarted(sub)}
                      <button class="tk-play" on:click={() => startSubEntryTimer(tk.id, idx, si)} title="Start"><Icon name="play" size={10} /></button>
                    {:else if isRunning(sub)}
                      <button class="tk-stop" on:click={() => stopSubEntryTimer(tk.id, idx, si)} title="Stop"><Icon name="square" size={10} /></button>
                    {/if}
                    <button class="tk-del" on:click={() => removeSubEntryAction(tk.id, idx, si)} title="Delete"><Icon name="x" size={10} /></button>
                  </div>
                </div>
              {/each}
            {/if}

            <div class="tk-sub-add">
              <input type="text" placeholder="Add sub-entry..." bind:value={newSubEntryNames[`${tk.id}-${idx}`]} on:keydown={(e) => e.key === 'Enter' && handleAddSubEntry(tk.id, idx)} class="tk-sub-input" />
              <button class="tk-sub-add-btn" on:click={() => handleAddSubEntry(tk.id, idx)} title="Add sub-entry"><Icon name="plus" size={10} /></button>
            </div>
          </div>
        {/each}
      </div>

      <div class="tk-add-entry">
        <input type="text" bind:value={newEntryNames[tk.id]} placeholder="New time block..." class="tk-new-entry-input" on:keydown={(e) => e.key === 'Enter' && handleAddEntry(tk.id)} />
        <button class="tk-add-entry-btn" on:click={() => handleAddEntry(tk.id)} title="Add entry"><Icon name="plus" size={12} /> Add</button>
      </div>

      <div class="tk-total">
        <span>Total:</span>
        <strong>{elapsed({ name: '', startTime: null, endTime: null, subEntries: tk.data.entries })}</strong>
      </div>
    </div>
  {:else}
    <div class="tk-empty">
      <Icon name="clock" size={32} />
      <p>No timekeeps yet. Create one to start tracking time.</p>
    </div>
  {/if}
</div>

<style>
  .tk-panel { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
  .tk-header { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-bottom: 1px solid var(--background-modifier-border, #333); }
  .tk-title { font-weight: 600; font-size: 14px; flex: 1; }
  .tk-active-badge { font-size: 10px; padding: 2px 6px; border-radius: 10px; background: var(--color-warning, #d97706); color: #fff; }
  .tk-stop-all { border: none; background: none; color: var(--text-muted); cursor: pointer; }
  .tk-tabs { display: flex; flex-wrap: wrap; gap: 4px; padding: 8px 10px; border-bottom: 1px solid var(--background-modifier-border, #333); align-items: center; }
  .tk-tab { padding: 4px 10px; border: 1px solid var(--background-modifier-border, #444); border-radius: 4px; background: var(--background-secondary); color: var(--text-muted); cursor: pointer; font-size: 11px; }
  .tk-tab.active { background: var(--interactive-accent, #7c3aed); color: #fff; border-color: transparent; }
  .tk-new-row { display: flex; gap: 4px; flex: 1; min-width: 120px; }
  .tk-new-input { flex: 1; padding: 4px 8px; border: 1px solid var(--background-modifier-border, #444); border-radius: 4px; background: var(--background-primary); color: var(--text-normal); font-size: 11px; }
  .tk-add-btn { border: none; background: none; color: var(--text-muted); cursor: pointer; padding: 4px; }
  .tk-content { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }
  .tk-content-header { display: flex; align-items: center; gap: 6px; padding: 8px 12px; border-bottom: 1px solid var(--background-modifier-border, #333); }
  .tk-rename { flex: 1; border: none; background: transparent; color: var(--text-normal); font-size: 13px; font-weight: 600; outline: none; padding: 2px 4px; border-radius: 3px; }
  .tk-rename:focus { background: var(--background-primary); }
  .tk-export-btns { display: flex; gap: 2px; }
  .tk-sm-btn { border: none; background: none; color: var(--text-muted); cursor: pointer; padding: 3px; border-radius: 3px; }
  .tk-sm-btn:hover { background: var(--background-modifier-hover); color: var(--text-normal); }
  .tk-sm-btn.tk-danger:hover { color: var(--color-error, #e74c3c); }
  .tk-entries { flex: 1; overflow-y: auto; padding: 6px 0; }
  .tk-entry { border-bottom: 1px solid var(--background-modifier-border, #2a2a2a); padding: 6px 12px; }
  .tk-entry.running { border-left: 3px solid var(--color-warning, #d97706); }
  .tk-entry.completed { border-left: 3px solid var(--color-success, #22c55e); }
  .tk-entry-row { display: flex; align-items: center; gap: 6px; }
  .tk-collapse { border: none; background: none; color: var(--text-muted); cursor: pointer; padding: 2px; }
  .tk-collapse-spacer { width: 16px; }
  .tk-edit-input { flex: 1; padding: 2px 6px; border: 1px solid var(--interactive-accent); border-radius: 3px; background: var(--background-primary); color: var(--text-normal); font-size: 12px; }
  .tk-entry-name { flex: 1; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: default; }
  .tk-entry-name-btn { flex: 1; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; border: none; background: none; color: var(--text-normal); text-align: left; padding: 0; cursor: default; }
  .tk-duration { font-size: 11px; color: var(--text-muted); font-variant-numeric: tabular-nums; min-width: 50px; text-align: right; }
  .tk-entry-actions { display: flex; gap: 2px; }
  .tk-play { border: none; background: none; color: var(--color-success, #22c55e); cursor: pointer; padding: 2px; }
  .tk-stop { border: none; background: none; color: var(--color-warning, #d97706); cursor: pointer; padding: 2px; }
  .tk-del { border: none; background: none; color: var(--text-muted); cursor: pointer; padding: 2px; opacity: 0.4; }
  .tk-del:hover { opacity: 1; color: var(--color-error, #e74c3c); }
  .tk-entry-times { display: flex; gap: 12px; padding: 2px 0 0 22px; font-size: 10px; color: var(--text-faint); }
  .tk-sub-entry { display: flex; align-items: center; gap: 4px; padding: 3px 0 3px 22px; }
  .tk-sub-entry.running { background: rgba(217, 119, 6, 0.05); }
  .tk-sub-indent { color: var(--text-faint); font-size: 10px; width: 12px; }
  .tk-sub-add { display: flex; gap: 4px; padding: 3px 0 0 22px; }
  .tk-sub-input { flex: 1; padding: 2px 6px; border: 1px solid var(--background-modifier-border, #444); border-radius: 3px; background: var(--background-primary); color: var(--text-normal); font-size: 10px; }
  .tk-sub-add-btn { border: none; background: none; color: var(--text-muted); cursor: pointer; padding: 2px; }
  .tk-add-entry { display: flex; gap: 6px; padding: 10px 12px; border-top: 1px solid var(--background-modifier-border, #333); }
  .tk-new-entry-input { flex: 1; padding: 6px 10px; border: 1px solid var(--background-modifier-border, #444); border-radius: 4px; background: var(--background-primary); color: var(--text-normal); font-size: 12px; }
  .tk-add-entry-btn { display: flex; align-items: center; gap: 4px; padding: 6px 12px; border: none; border-radius: 4px; background: var(--interactive-accent, #7c3aed); color: #fff; cursor: pointer; font-size: 12px; }
  .tk-total { display: flex; justify-content: space-between; padding: 8px 12px; border-top: 1px solid var(--background-modifier-border, #333); font-size: 13px; }
  .tk-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; gap: 8px; color: var(--text-muted); padding: 40px 20px; text-align: center; }
  .tk-empty p { font-size: 12px; max-width: 200px; }
</style>
