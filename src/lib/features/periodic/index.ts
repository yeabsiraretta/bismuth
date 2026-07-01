/**
 * Periodic notes & journal feature module.
 * Public API barrel.
 */

// ─── Types ────────────────────────────────────────────────────────────────

export type {
  PeriodType,
  IntervalUnit,
  IndexResetMode,
  JournalConfig,
  EndCondition,
  IndexConfig,
  FrontmatterConfig,
  JournalShelf,
  JournalDecoration,
  DecorationCondition,
  DecorationStyle,
  TemplateContext,
  CalendarJournalSettings,
  PeriodicNoteConfig,
  PeriodicNote,
  PeriodicSettings,
} from './types';

// ─── Defaults ─────────────────────────────────────────────────────────────

export {
  DEFAULT_PERIODIC_SETTINGS,
  DEFAULT_DAILY_JOURNAL,
  DEFAULT_WEEKLY_JOURNAL,
  DEFAULT_MONTHLY_JOURNAL,
  DEFAULT_CALENDAR_SETTINGS,
} from './types/defaults';

// ─── Legacy Stores (backward compat) ─────────────────────────────────────

export {
  periodicSettings,
  activePeriodType,
  activeDate,
  periodicNotesInRange,
  periodicLoading,
  todayString,
  navigatePrevious,
  navigateNext,
  navigateToday,
  openCurrentPeriodNote,
  openDailyNote,
  fetchNotesForMonth,
} from './stores/periodic';

// ─── Journal Stores ───────────────────────────────────────────────────────

export {
  journalSettings,
  activeJournalId,
  activeJournalDate,
  activeShelfId,
  journalLoading,
  journals,
  shelves,
  shelvesEnabled,
  activeJournal,
  filteredJournals,
  journalsByType,
  addJournal,
  updateJournal,
  deleteJournal,
  addShelf,
  updateShelf,
  deleteShelf,
  openActiveJournalNote,
  openTodaysDailyNote,
  navigateJournal,
  goToJournalToday,
  getJournalNotePath,
} from './stores/journalStore';

// ─── Services ─────────────────────────────────────────────────────────────

export {
  openOrCreatePeriodicNote,
  getPeriodicNotesForRange,
  getPeriodicNotePath,
} from './services/periodic';

export {
  getPeriodBounds,
  computeIndex,
  resolveNotePath,
  buildFrontmatter,
  createJournalNote,
  navigatePeriod,
} from './services/journalService';

export {
  formatDate,
  applyDateOffset,
  resolveTemplateVars,
} from './services/templateVars';

// ─── Components ───────────────────────────────────────────────────────────

export { default as PeriodicPanel } from './components/PeriodicPanel.svelte';
export { default as JournalPanel } from './components/JournalPanel.svelte';
