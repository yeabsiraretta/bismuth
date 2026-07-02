<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import {
    filteredEvents,
    groupedEvents,
    timelineConflicts,
    allTracks,
    timelineEras,
    timelineMode,
    addTimelineEvent,
    removeTimelineEvent,
    editTimelineEvent,
    updateFilter,
    resetFilter,
    setTimelineMode,
    addEra,
    removeEra,
    timelineFilter,
  } from '../stores/timelineStore';
  import type { TimelineMode } from '../types/timeline';

  let newLabel = '';
  let newDate = '';
  let showAddEvent = false;
  let showAddEra = false;
  let eraName = '';
  let eraStart = '';
  let eraEnd = '';
  let eraColor = '#7c3aed';

  function handleAddEvent() {
    if (!newLabel.trim() || !newDate) return;
    addTimelineEvent('', newLabel.trim(), newDate);
    newLabel = '';
    newDate = '';
    showAddEvent = false;
  }

  function handleAddEra() {
    if (!eraName.trim() || !eraStart || !eraEnd) return;
    addEra(eraName.trim(), eraStart, eraEnd, eraColor);
    eraName = '';
    eraStart = '';
    eraEnd = '';
    showAddEra = false;
  }
</script>

<div class="tl-panel">
  <div class="tl-header">
    <h3>Timeline</h3>
    <div class="tl-header-actions">
      <div class="tl-mode-toggle">
        <button
          class="tl-mode-btn"
          class:active={$timelineMode === 'standard'}
          on:click={() => setTimelineMode('standard')}>Timeline</button
        >
        <button
          class="tl-mode-btn"
          class:active={$timelineMode === 'gantt'}
          on:click={() => setTimelineMode('gantt')}>Gantt</button
        >
      </div>
      <button
        class="tl-btn-icon"
        on:click={() => {
          showAddEvent = !showAddEvent;
        }}
        title="Add event"
      >
        <Icon name="plus" size={14} />
      </button>
    </div>
  </div>

  <div class="tl-toolbar">
    <input
      class="tl-search"
      placeholder="Search events…"
      value={$timelineFilter.search}
      on:input={(e) => updateFilter({ search: e.currentTarget.value })}
    />
    <label class="tl-checkbox">
      <input
        type="checkbox"
        checked={$timelineFilter.milestonesOnly}
        on:change={(e) => updateFilter({ milestonesOnly: e.currentTarget.checked })}
      />
      Milestones
    </label>
    <select
      class="tl-select"
      value={$timelineFilter.groupBy}
      on:change={(e) => updateFilter({ groupBy: e.currentTarget.value })}
    >
      <option value="none">No grouping</option>
      <option value="track">By Track</option>
      <option value="era">By Era</option>
    </select>
    <button class="tl-btn-ghost" on:click={resetFilter} title="Clear filters">
      <Icon name="x" size={12} />
    </button>
  </div>

  {#if $timelineConflicts.length > 0}
    <div class="tl-conflicts">
      <Icon name="alert-triangle" size={13} />
      <span
        >{$timelineConflicts.length} conflict{$timelineConflicts.length > 1 ? 's' : ''} detected</span
      >
    </div>
  {/if}

  {#if showAddEvent}
    <div class="tl-add-form">
      <input class="tl-input" bind:value={newLabel} placeholder="Event name…" />
      <input class="tl-input" type="date" bind:value={newDate} />
      <button class="tl-btn-primary" on:click={handleAddEvent}>Add</button>
    </div>
  {/if}

  <div class="tl-content">
    {#if $timelineFilter.groupBy !== 'none'}
      {#each [...$groupedEvents.entries()] as [groupName, events] (groupName)}
        <div class="tl-group">
          <div class="tl-group-header">
            {groupName} <span class="tl-group-count">({events.length})</span>
          </div>
          {#each events as event (event.id)}
            <div class="tl-event" class:milestone={event.isMilestone}>
              <div class="tl-event-date">{event.date}</div>
              <div
                class="tl-event-dot"
                style="background: {event.color ?? 'var(--interactive-accent)'}"
              ></div>
              <div class="tl-event-body">
                <div class="tl-event-label">{event.label}</div>
                {#if event.progress != null}
                  <div class="tl-progress">
                    <div class="tl-progress-fill" style="width: {event.progress}%"></div>
                  </div>
                {/if}
                {#if event.tags.length > 0}
                  <div class="tl-event-tags">{event.tags.join(', ')}</div>
                {/if}
              </div>
              <button
                class="tl-event-delete"
                on:click={() => removeTimelineEvent(event.id)}
                title="Remove"
              >
                <Icon name="x" size={12} />
              </button>
            </div>
          {/each}
        </div>
      {/each}
    {:else}
      {#each $filteredEvents as event (event.id)}
        <div class="tl-event" class:milestone={event.isMilestone}>
          <div class="tl-event-date">{event.date}</div>
          <div
            class="tl-event-dot"
            style="background: {event.color ?? 'var(--interactive-accent)'}"
          ></div>
          <div class="tl-event-body">
            <div class="tl-event-label">{event.label}</div>
            {#if event.progress != null}
              <div class="tl-progress">
                <div class="tl-progress-fill" style="width: {event.progress}%"></div>
              </div>
            {/if}
          </div>
          <button
            class="tl-event-delete"
            on:click={() => removeTimelineEvent(event.id)}
            title="Remove"
          >
            <Icon name="x" size={12} />
          </button>
        </div>
      {/each}
    {/if}

    {#if $filteredEvents.length === 0}
      <div class="tl-empty">No events. Add your first timeline event above.</div>
    {/if}
  </div>

  <div class="tl-footer">
    <button
      class="tl-btn-ghost"
      on:click={() => {
        showAddEra = !showAddEra;
      }}
    >
      <Icon name="calendar" size={12} /> Eras ({$timelineEras.length})
    </button>
    <span class="tl-track-count">{$allTracks.length} tracks</span>
  </div>

  {#if showAddEra}
    <div class="tl-add-form">
      <input class="tl-input" bind:value={eraName} placeholder="Era name…" />
      <input class="tl-input" type="date" bind:value={eraStart} />
      <input class="tl-input" type="date" bind:value={eraEnd} />
      <input type="color" bind:value={eraColor} class="tl-color" />
      <button class="tl-btn-primary" on:click={handleAddEra}>Add</button>
    </div>
  {/if}
</div>

<style>
  .tl-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .tl-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    border-bottom: 1px solid var(--background-modifier-border, #333);
  }
  .tl-header h3 {
    margin: 0;
    font-size: 14px;
  }
  .tl-header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .tl-mode-toggle {
    display: flex;
    border: 1px solid var(--background-modifier-border, #444);
    border-radius: 4px;
    overflow: hidden;
  }
  .tl-mode-btn {
    padding: 3px 8px;
    border: none;
    background: none;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 11px;
  }
  .tl-mode-btn.active {
    background: var(--interactive-accent, #7c3aed);
    color: #fff;
  }
  .tl-toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    border-bottom: 1px solid var(--background-modifier-border, #333);
    flex-wrap: wrap;
  }
  .tl-search {
    flex: 1;
    min-width: 100px;
    padding: 4px 8px;
    border: 1px solid var(--background-modifier-border, #444);
    border-radius: 4px;
    background: var(--background-primary);
    color: var(--text-normal);
    font-size: 12px;
  }
  .tl-select {
    padding: 4px 6px;
    border: 1px solid var(--background-modifier-border, #444);
    border-radius: 4px;
    background: var(--background-primary);
    color: var(--text-normal);
    font-size: 11px;
  }
  .tl-checkbox {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    cursor: pointer;
  }
  .tl-conflicts {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    background: rgba(234, 179, 8, 0.1);
    color: #eab308;
    font-size: 12px;
  }
  .tl-add-form {
    display: flex;
    gap: 6px;
    padding: 8px 14px;
    border-bottom: 1px solid var(--background-modifier-border, #333);
  }
  .tl-input {
    padding: 4px 8px;
    border: 1px solid var(--background-modifier-border, #444);
    border-radius: 4px;
    background: var(--background-primary);
    color: var(--text-normal);
    font-size: 12px;
    flex: 1;
  }
  .tl-color {
    width: 28px;
    height: 28px;
    border: none;
    cursor: pointer;
  }
  .tl-btn-primary {
    padding: 4px 10px;
    border: none;
    border-radius: 4px;
    background: var(--interactive-accent, #7c3aed);
    color: #fff;
    cursor: pointer;
    font-size: 12px;
  }
  .tl-btn-icon {
    border: none;
    background: none;
    color: var(--text-normal);
    cursor: pointer;
    padding: 4px;
  }
  .tl-btn-ghost {
    display: flex;
    align-items: center;
    gap: 4px;
    border: none;
    background: none;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 11px;
    padding: 4px;
  }
  .tl-btn-ghost:hover {
    color: var(--text-normal);
  }
  .tl-content {
    flex: 1;
    overflow-y: auto;
    padding: 8px 14px;
  }
  .tl-group {
    margin-bottom: 12px;
  }
  .tl-group-header {
    font-weight: 600;
    font-size: 12px;
    margin-bottom: 6px;
    padding-bottom: 4px;
    border-bottom: 1px solid var(--background-modifier-border, #333);
  }
  .tl-group-count {
    opacity: 0.5;
    font-weight: 400;
  }
  .tl-event {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 6px 0;
    border-bottom: 1px solid var(--background-modifier-border, #2a2a2a);
    position: relative;
  }
  .tl-event.milestone {
    border-left: 3px solid var(--interactive-accent, #7c3aed);
    padding-left: 8px;
  }
  .tl-event-date {
    font-size: 10px;
    color: var(--text-muted);
    min-width: 70px;
    padding-top: 2px;
  }
  .tl-event-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-top: 4px;
    flex-shrink: 0;
  }
  .tl-event-body {
    flex: 1;
  }
  .tl-event-label {
    font-size: 13px;
  }
  .tl-event-tags {
    font-size: 10px;
    color: var(--text-muted);
    margin-top: 2px;
  }
  .tl-progress {
    height: 3px;
    background: var(--background-modifier-border, #444);
    border-radius: 2px;
    margin-top: 4px;
  }
  .tl-progress-fill {
    height: 100%;
    background: var(--interactive-accent, #7c3aed);
    border-radius: 2px;
  }
  .tl-event-delete {
    position: absolute;
    right: 0;
    top: 6px;
    border: none;
    background: none;
    color: var(--text-muted);
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.15s;
  }
  .tl-event:hover .tl-event-delete {
    opacity: 1;
  }
  .tl-empty {
    text-align: center;
    padding: 24px;
    opacity: 0.5;
    font-size: 12px;
  }
  .tl-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 14px;
    border-top: 1px solid var(--background-modifier-border, #333);
  }
  .tl-track-count {
    font-size: 11px;
    opacity: 0.5;
  }
</style>
