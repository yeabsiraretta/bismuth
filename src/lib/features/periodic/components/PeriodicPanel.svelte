<script lang="ts">
  import PanelHeader from '@/components/ui/layout/PanelHeader.svelte';
  import ActionButton from '@/components/ui/actions/ActionButton.svelte';
  import Icon from '@/components/icons/Icon.svelte';
  import {
    activePeriodType,
    activeDate,
    periodicLoading,
    navigatePrevious,
    navigateNext,
    navigateToday,
    openCurrentPeriodNote,
    openDailyNote,
  } from '../stores/periodic';
  import type { PeriodType } from '../types';

  const periodTypes: PeriodType[] = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'];

  function formatDisplayDate(date: string, type: PeriodType): string {
    const d = new Date(date);
    switch (type) {
      case 'daily': return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      case 'weekly': return `Week of ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
      case 'monthly': return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
      case 'quarterly': return `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`;
      case 'yearly': return d.getFullYear().toString();
    }
  }

  async function handleOpen() {
    await openCurrentPeriodNote();
  }

  function switchPeriod(type: PeriodType) {
    $activePeriodType = type;
  }
</script>

<div class="periodic-panel" role="tabpanel" aria-label="Periodic Notes">
  <PanelHeader icon="calendar-plus" title="Periodic Notes">
    <svelte:fragment slot="actions">
      <ActionButton icon="calendar" title="Go to today" on:click={navigateToday} />
    </svelte:fragment>
  </PanelHeader>

  <div class="panel-body">
    <div class="period-switcher">
      {#each periodTypes as type}
        <button
          class="period-btn"
          class:active={$activePeriodType === type}
          on:click={() => switchPeriod(type)}
        >
          {type.charAt(0).toUpperCase() + type.slice(1, 3)}
        </button>
      {/each}
    </div>

    <div class="date-navigator">
      <button class="nav-btn" on:click={navigatePrevious} title="Previous">
        <Icon name="chevron-left" size={16} />
      </button>
      <span class="date-display">
        {formatDisplayDate($activeDate, $activePeriodType)}
      </span>
      <button class="nav-btn" on:click={navigateNext} title="Next">
        <Icon name="chevron-right" size={16} />
      </button>
    </div>

    <button class="open-note-btn" on:click={handleOpen} disabled={$periodicLoading}>
      {#if $periodicLoading}
        <Icon name="loader" size={14} />
        Opening...
      {:else}
        <Icon name="file-plus" size={14} />
        Open {$activePeriodType} note
      {/if}
    </button>

    <div class="quick-actions">
      <button class="quick-btn" on:click={openDailyNote} title="Open today's daily note">
        <Icon name="sun" size={14} />
        Today
      </button>
    </div>
  </div>
</div>

<style>
  .periodic-panel { display: flex; flex-direction: column; height: 100%; }
  .panel-body { padding: 12px; display: flex; flex-direction: column; gap: 12px; }
  .period-switcher {
    display: flex; gap: 2px; background: var(--panel-bg-alt, #181825);
    border-radius: 6px; padding: 2px;
  }
  .period-btn {
    flex: 1; padding: 6px 4px; border: none; border-radius: 4px;
    background: none; color: var(--text-muted); cursor: pointer;
    font-size: 11px; font-weight: 500; text-transform: capitalize;
  }
  .period-btn:hover { color: var(--text-primary); }
  .period-btn.active {
    background: var(--accent-color, #6366f1); color: white;
  }
  .date-navigator {
    display: flex; align-items: center; gap: 8px; justify-content: center;
  }
  .nav-btn {
    background: none; border: none; padding: 4px; border-radius: 4px;
    cursor: pointer; color: var(--text-muted);
  }
  .nav-btn:hover { background: var(--hover-bg); color: var(--text-primary); }
  .date-display { font-size: 13px; font-weight: 500; flex: 1; text-align: center; }
  .open-note-btn {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 10px 16px; border: none; border-radius: 6px;
    background: var(--accent-color, #6366f1); color: white;
    cursor: pointer; font-size: 12px; font-weight: 500;
  }
  .open-note-btn:hover { opacity: 0.9; }
  .open-note-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .quick-actions { display: flex; gap: 8px; }
  .quick-btn {
    flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
    padding: 8px; border: 1px solid var(--border-color); border-radius: 6px;
    background: none; color: var(--text-primary); cursor: pointer; font-size: 11px;
  }
  .quick-btn:hover { background: var(--hover-bg); }
</style>
