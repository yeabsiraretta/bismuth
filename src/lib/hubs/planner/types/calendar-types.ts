import { DEFAULT_CATEGORY_COLORS } from '@/constants/colors';

export type CalendarViewMode = 'day' | 'week' | 'month' | 'year' | 'list';

export type CalendarItemType = 'event' | 'task' | 'time-block';

export interface CalendarCategory {
  id: string;
  name: string;
  color: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  type: CalendarItemType;
  date: string;
  startMinute: number | null;
  durationMinutes: number | null;
  color?: string;
  categoryId?: string;
  completed: boolean;
  description?: string;
  project?: string;
  recurring?: RecurrenceRule;
  linkedNotePaths?: string[];
  location?: string;
  readonly?: boolean;
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  daysOfWeek?: number[];
  endDate?: string | null;
}

export interface DayColumn {
  date: string;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
  events: CalendarEvent[];
}

export interface DayCell {
  day: number | null;
  date: string | null;
}

export const DEFAULT_CALENDAR_CATEGORIES: CalendarCategory[] = [
  { id: 'work', name: 'Work', color: DEFAULT_CATEGORY_COLORS.work },
  { id: 'personal', name: 'Personal', color: DEFAULT_CATEGORY_COLORS.personal },
  { id: 'health', name: 'Health', color: DEFAULT_CATEGORY_COLORS.health },
  { id: 'study', name: 'Study', color: DEFAULT_CATEGORY_COLORS.study },
  { id: 'other', name: 'Other', color: DEFAULT_CATEGORY_COLORS.other },
];
