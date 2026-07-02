/**
 * Default configurations for journal system.
 */
import type {
  JournalConfig,
  PeriodicSettings,
  FrontmatterConfig,
  CalendarJournalSettings,
  PeriodType,
  PeriodicNoteConfig,
} from './index';

const DEFAULT_FRONTMATTER: FrontmatterConfig = {
  journalField: 'journal',
  dateField: 'date',
  addStartEndDates: false,
  indexField: null,
};

/** Built-in daily journal shipped by default. */
export const DEFAULT_DAILY_JOURNAL: JournalConfig = {
  id: 'daily',
  name: 'Daily Notes',
  type: 'daily',
  shelfId: null,
  folder: 'journal/daily',
  nameTemplate: '{{date}}',
  dateFormat: 'YYYY-MM-DD',
  templatePath: null,
  autoCreate: false,
  confirmCreation: false,
  startDate: null,
  endCondition: { mode: 'never' },
  indexConfig: null,
  frontmatter: { ...DEFAULT_FRONTMATTER },
  decorations: [
    {
      id: 'default-dot',
      condition: { type: 'has-note' },
      style: { dotColor: 'var(--interactive-accent)' },
    },
  ],
};

/** Built-in weekly journal. */
export const DEFAULT_WEEKLY_JOURNAL: JournalConfig = {
  id: 'weekly',
  name: 'Weekly Notes',
  type: 'weekly',
  shelfId: null,
  folder: 'journal/weekly',
  nameTemplate: '{{date}}',
  dateFormat: 'YYYY-[W]WW',
  templatePath: null,
  autoCreate: false,
  confirmCreation: false,
  startDate: null,
  endCondition: { mode: 'never' },
  indexConfig: null,
  frontmatter: { ...DEFAULT_FRONTMATTER },
  decorations: [],
};

/** Built-in monthly journal. */
export const DEFAULT_MONTHLY_JOURNAL: JournalConfig = {
  id: 'monthly',
  name: 'Monthly Notes',
  type: 'monthly',
  shelfId: null,
  folder: 'journal/monthly',
  nameTemplate: '{{date}}',
  dateFormat: 'YYYY-MM',
  templatePath: null,
  autoCreate: false,
  confirmCreation: false,
  startDate: null,
  endCondition: { mode: 'never' },
  indexConfig: null,
  frontmatter: { ...DEFAULT_FRONTMATTER },
  decorations: [],
};

export const DEFAULT_CALENDAR_SETTINGS: CalendarJournalSettings = {
  weekStart: 0,
  showWeekNumbers: false,
  todayMode: 'create',
};

const defaultLegacyConfigs: Record<PeriodType, PeriodicNoteConfig> = {
  daily: {
    periodType: 'daily',
    folder: 'journal/daily',
    dateFormat: 'YYYY-MM-DD',
    templatePath: null,
  },
  weekly: {
    periodType: 'weekly',
    folder: 'journal/weekly',
    dateFormat: 'YYYY-[W]MM-DD',
    templatePath: null,
  },
  monthly: {
    periodType: 'monthly',
    folder: 'journal/monthly',
    dateFormat: 'YYYY-MM',
    templatePath: null,
  },
  quarterly: {
    periodType: 'quarterly',
    folder: 'journal/quarterly',
    dateFormat: 'YYYY-[Q]MM',
    templatePath: null,
  },
  yearly: {
    periodType: 'yearly',
    folder: 'journal/yearly',
    dateFormat: 'YYYY',
    templatePath: null,
  },
};

export const DEFAULT_PERIODIC_SETTINGS: PeriodicSettings = {
  configs: defaultLegacyConfigs,
  defaultPeriod: 'daily',
  journals: [DEFAULT_DAILY_JOURNAL, DEFAULT_WEEKLY_JOURNAL, DEFAULT_MONTHLY_JOURNAL],
  shelves: [],
  shelvesEnabled: false,
  openOnStartup: null,
  calendar: DEFAULT_CALENDAR_SETTINGS,
};
