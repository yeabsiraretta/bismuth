<script lang="ts">
  import PanelHeader from '@/components/ui/layout/PanelHeader.svelte';
  import ActionButton from '@/components/ui/actions/ActionButton.svelte';
  import Icon from '@/components/icons/Icon.svelte';
  import JournalMiniCalendar from './JournalMiniCalendar.svelte';
  import {
    activeJournalId,
    activeJournalDate,
    activeShelfId,
    journalLoading,
    filteredJournals,
    activeJournal,
    shelves,
    shelvesEnabled,
    openActiveJournalNote,
    openTodaysDailyNote,
    navigateJournal,
    goToJournalToday,
  } from '../stores/journalStore';
  import { formatDate } from '../services/templateVars';

  function formatDisplayDate(date: Date, type: string): string {
    switch (type) {
      case 'daily':
        return formatDate(date, 'ddd, MMM D, YYYY');
      case 'weekly':
        return `Week of ${formatDate(date, 'MMM D')}`;
      case 'monthly':
        return formatDate(date, 'MMMM YYYY');
      case 'quarterly':
        return `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`;
      case 'yearly':
        return String(date.getFullYear());
      default:
        return formatDate(date, 'MMM D, YYYY');
    }
  }

  function handleDayClick(date: string) {
    const [y, m, d] = date.split('-').map(Number);
    activeJournalDate.set(new Date(y, m - 1, d));
  }

  async function handleOpen() {
    await openActiveJournalNote();
  }
</script>

<div class="journal-panel" role="tabpanel" aria-label="Journals">
  <PanelHeader icon="book-open" title="Journals">
    <svelte:fragment slot="actions">
      <ActionButton icon="calendar" title="Go to today" on:click={goToJournalToday} />
    </svelte:fragment>
  </PanelHeader>

  <div class="panel-body">
    {#if $shelvesEnabled && $shelves.length > 0}
      <div class="shelf-bar">
        <button
          class="shelf-btn"
          class:active={$activeShelfId === null}
          on:click={() => activeShelfId.set(null)}>All</button
        >
        {#each $shelves as shelf (shelf.id)}
          <button
            class="shelf-btn"
            class:active={$activeShelfId === shelf.id}
            on:click={() => activeShelfId.set(shelf.id)}>{shelf.name}</button
          >
        {/each}
      </div>
    {/if}

    <div class="journal-switcher">
      {#each $filteredJournals as journal (journal.id)}
        <button
          class="journal-btn"
          class:active={$activeJournalId === journal.id}
          on:click={() => activeJournalId.set(journal.id)}
          title={journal.name}
        >
          {journal.name.length > 12 ? journal.name.slice(0, 10) + '..' : journal.name}
        </button>
      {/each}
    </div>

    {#if $activeJournal}
      <div class="date-navigator">
        <button
          class="nav-btn"
          on:click={() => navigateJournal('prev')}
          title="Previous"
          aria-label="Previous period"
        >
          <Icon name="chevron-left" size={16} />
        </button>
        <span class="date-display">
          {formatDisplayDate($activeJournalDate, $activeJournal.type)}
        </span>
        <button
          class="nav-btn"
          on:click={() => navigateJournal('next')}
          title="Next"
          aria-label="Next period"
        >
          <Icon name="chevron-right" size={16} />
        </button>
      </div>

      <button class="open-note-btn" on:click={handleOpen} disabled={$journalLoading}>
        {#if $journalLoading}
          <Icon name="loader" size={14} />
          Opening...
        {:else}
          <Icon name="file-plus" size={14} />
          Open {$activeJournal.name}
        {/if}
      </button>
    {/if}

    <JournalMiniCalendar date={$activeJournalDate} onDayClick={handleDayClick} />

    <div class="quick-actions">
      <button class="quick-btn" on:click={openTodaysDailyNote} title="Open today's daily note">
        <Icon name="sun" size={14} />
        Today
      </button>
    </div>
  </div>
</div>

<style>
  .journal-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .panel-body {
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow-y: auto;
  }

  .shelf-bar {
    display: flex;
    gap: 2px;
    flex-wrap: wrap;
    padding: 2px;
    background: var(--panel-bg-alt, #181825);
    border-radius: 6px;
  }
  .shelf-btn {
    padding: 4px 8px;
    border: none;
    border-radius: 4px;
    background: none;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 10px;
    font-weight: 500;
  }
  .shelf-btn:hover {
    color: var(--text-primary);
  }
  .shelf-btn.active {
    background: var(--interactive-accent, #6366f1);
    color: white;
  }

  .journal-switcher {
    display: flex;
    gap: 2px;
    flex-wrap: wrap;
    background: var(--panel-bg-alt, #181825);
    border-radius: 6px;
    padding: 2px;
  }
  .journal-btn {
    flex: 1;
    min-width: 60px;
    padding: 6px 4px;
    border: none;
    border-radius: 4px;
    background: none;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 11px;
    font-weight: 500;
    white-space: nowrap;
  }
  .journal-btn:hover {
    color: var(--text-primary);
  }
  .journal-btn.active {
    background: var(--interactive-accent, #6366f1);
    color: white;
  }

  .date-navigator {
    display: flex;
    align-items: center;
    gap: 8px;
    justify-content: center;
  }
  .nav-btn {
    background: none;
    border: none;
    padding: 4px;
    border-radius: 4px;
    cursor: pointer;
    color: var(--text-muted);
    display: flex;
    align-items: center;
  }
  .nav-btn:hover {
    background: var(--hover-bg);
    color: var(--text-primary);
  }
  .date-display {
    font-size: 13px;
    font-weight: 500;
    flex: 1;
    text-align: center;
  }

  .open-note-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 16px;
    border: none;
    border-radius: 6px;
    background: var(--interactive-accent, #6366f1);
    color: white;
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
  }
  .open-note-btn:hover {
    opacity: 0.9;
  }
  .open-note-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .quick-actions {
    display: flex;
    gap: 8px;
  }
  .quick-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background: none;
    color: var(--text-primary);
    cursor: pointer;
    font-size: 11px;
  }
  .quick-btn:hover {
    background: var(--hover-bg);
  }
</style>
