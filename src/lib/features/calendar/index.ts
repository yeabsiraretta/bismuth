/**
 * Calendar feature module — events, time blocks, ICS feeds, time clocks,
 * planner entries, week/month/year/day views, and timeline.
 * Public API barrel.
 */

// Types
export type {
  CalendarCategory, CalendarEvent, CalendarViewMode, CalendarItemType,
  RecurrenceRule, IcsFeedConfig, IcsEvent, ClockRecord, ClockStatus,
  PlannerEntry, PlannerSettings,
} from './types';
export { DEFAULT_CALENDAR_CATEGORIES, DEFAULT_PLANNER_SETTINGS } from './types';

// Prisma types
export type {
  FrontmatterEventConfig, FrontmatterEvent, EventPreset,
  BatchAction, BatchOperation, UndoEntry, UndoActionType,
  DayCapacity, CategoryStat, CalendarStats, StatsTimeRange,
  GanttTask, GanttGroup, SmartCategoryRule, PrismaSettings,
} from './types/prisma';
export { DEFAULT_FM_EVENT_CONFIG, DEFAULT_PRISMA_SETTINGS } from './types/prisma';

// Stores
export {
  calendarEvents,
  calendarViewMode,
  calendarFocusDate,
  allCalendarItems,
  weekColumns,
  plannerSettings,
  plannerEvents,
  addCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  toggleCalendarEventComplete,
  createTimeBlock,
  navigateCalendar,
  goToToday,
} from './stores/calendarStore';

// Services — ICS feeds
export {
  icsFeeds,
  allIcsEvents,
  addIcsFeed,
  removeIcsFeed,
  updateIcsFeed,
  fetchIcsFeed,
  fetchAllIcsFeeds,
  parseIcsText,
  startIcsSync,
  stopIcsSync,
} from './services/icsFeed';

// Services — Time clock
export {
  clockRecords,
  activeClocks,
  completedClocks,
  clockEvents,
  startClock,
  stopClock,
  cancelClock,
  deleteClock,
  formatDuration,
  getElapsedMinutes,
  getTodayTrackedMinutes,
} from './services/timeClock';

// Services — Planner parser
export {
  parsePlannerEntries,
  plannerEntriesToEvents,
  parseScheduledTasks,
} from './services/plannerParser';

// Services — Planner loader
export {
  loadPlannerEvents,
  startPlannerSync,
  stopPlannerSync,
} from './services/plannerLoader';

// Services — Frontmatter events
export {
  parseFrontmatterDate, computeDuration,
  extractFrontmatterEvent, extractAllFrontmatterEvents,
  applySmartCategories,
} from './services/frontmatterEvents';
export type { NoteWithFrontmatter } from './services/frontmatterEvents';

// Services — Event presets
export {
  eventPresets,
  createEventFromPreset, presetToFrontmatter,
  addPreset, removePreset, updatePreset, resetPresets, getPreset,
} from './services/eventPresets';

// Services — Calendar stats
export {
  filterEventsByRange, computeCategoryBreakdown,
  computeStreaks, findBusiestDay, computeCalendarStats,
} from './services/calendarStats';

// Stores — Batch ops & undo
export {
  selectedEventIds, selectionMode, selectedCount,
  toggleEventSelection, selectEvent, deselectEvent, clearSelection, selectAll,
  undoStack, redoStack, canUndo, canRedo, undo, redo,
  batchDelete, batchComplete, batchDuplicate, batchShift, batchMove,
  trackedAdd, trackedDelete, trackedUpdate,
} from './stores/batchOps';

// Stores — Capacity
export {
  todayCapacity, weekCapacity, weekTotals,
  formatCapacityTime, utilizationColor,
} from './stores/capacityStore';

// Stores — Heatmap
export {
  heatmapConfig,
  heatmapEntries,
  eventHeatmapEntries,
  timeHeatmapEntries,
  COLOR_SCHEMES,
  intensityLevel,
  getIntensityRange,
  buildYearHeatmapGrid,
} from './stores/heatmapData';
export type {
  HeatmapEntry,
  HeatmapColorScheme,
  HeatmapConfig,
  HeatmapDataSource,
} from './stores/heatmapData';

// Components — views
export { default as CalendarView } from './components/views/CalendarView.svelte';
export { default as CalendarPanel } from './components/views/CalendarPanel.svelte';
export { default as WeekView } from './components/views/WeekView.svelte';
export { default as MonthView } from './components/views/MonthView.svelte';
export { default as YearView } from './components/views/YearView.svelte';
export { default as HeatmapCalendar } from './components/views/HeatmapCalendar.svelte';
export { default as CalendarDayView } from './components/views/CalendarDayView.svelte';
export { default as TimelineView } from './components/views/TimelineView.svelte';
export { default as ListView } from './components/views/ListView.svelte';
export { default as GanttView } from './components/views/GanttView.svelte';

// Components — atoms
export { default as EventChip } from './components/atoms/EventChip.svelte';
export { default as EventTypeEditor } from './components/atoms/EventTypeEditor.svelte';
export { default as ActiveClocks } from './components/atoms/ActiveClocks.svelte';

// Components — dialogs
export { default as EventDialog } from './components/dialogs/EventDialog.svelte';
export { default as RecurrenceEditor } from './components/dialogs/RecurrenceEditor.svelte';
export { default as EventFormFields } from './components/dialogs/EventFormFields.svelte';
export { default as EventLinkManager } from './components/dialogs/EventLinkManager.svelte';
export { default as IcsSettingsPanel } from './components/dialogs/IcsSettings.svelte';
