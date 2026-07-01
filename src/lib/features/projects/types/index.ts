/**
 * Project Manager types — Projects, tasks, custom fields, settings.
 * Data format: plain Markdown files with YAML frontmatter.
 */

// ─── Status & Priority ──────────────────────────────────────────────────────

export type PMStatus = 'todo' | 'in-progress' | 'blocked' | 'in-review' | 'done' | 'cancelled';
export type PMPriority = 'critical' | 'high' | 'medium' | 'low';
export type PMTaskType = 'task' | 'subtask' | 'milestone';
export type PMViewMode = 'table' | 'gantt' | 'kanban';
export type GanttGranularity = 'day' | 'week' | 'month' | 'quarter';
export type RecurrenceInterval = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface StatusConfig {
  id: PMStatus;
  label: string;
  color: string;
  icon: string;
}

export interface PriorityConfig {
  id: PMPriority;
  label: string;
  color: string;
  icon: string;
}

// ─── Custom Fields ───────────────────────────────────────────────────────────

export type CustomFieldType =
  'text' | 'number' | 'date' | 'select' | 'multi-select' | 'person' | 'checkbox' | 'url';

export interface CustomFieldDef {
  id: string;
  name: string;
  type: CustomFieldType;
  options?: string[];
  defaultValue?: unknown;
}

// ─── Time Tracking ───────────────────────────────────────────────────────────

export interface TimeLog {
  date: string;
  hours: number;
  note?: string;
}

export interface Recurrence {
  interval: RecurrenceInterval;
  endDate?: string;
}

// ─── Team ────────────────────────────────────────────────────────────────────

export interface TeamMember {
  id: string;
  name: string;
  color?: string;
}

// ─── Task ────────────────────────────────────────────────────────────────────

export interface PMTask {
  id: string;
  path: string;
  title: string;
  description: string;
  type: PMTaskType;
  status: PMStatus;
  priority: PMPriority;
  startDate: string | null;
  dueDate: string | null;
  progress: number;
  timeEstimate: number | null;
  timeLogs: TimeLog[];
  assignees: string[];
  tags: string[];
  parentId: string | null;
  subtaskIds: string[];
  dependencies: string[];
  recurrence: Recurrence | null;
  customFields: Record<string, unknown>;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Project ─────────────────────────────────────────────────────────────────

export interface Project {
  id: string;
  path: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  folder: string;
  defaultView: PMViewMode;
  customFields: CustomFieldDef[];
  customStatuses: StatusConfig[];
  customPriorities: PriorityConfig[];
  teamMembers: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── Saved Views ─────────────────────────────────────────────────────────────

export interface SavedView {
  id: string;
  name: string;
  filters: PMTaskFilter;
  sort: PMTaskSort;
}

export interface PMTaskFilter {
  status?: PMStatus[];
  priority?: PMPriority[];
  assignee?: string[];
  tag?: string[];
  search?: string;
  showArchived?: boolean;
  type?: PMTaskType[];
}

export interface PMTaskSort {
  field: 'title' | 'status' | 'priority' | 'dueDate' | 'progress' | 'assignee';
  direction: 'asc' | 'desc';
}

// ─── Settings ────────────────────────────────────────────────────────────────

export interface PMSettings {
  projectsFolder: string;
  defaultView: PMViewMode;
  ganttGranularity: GanttGranularity;
  ganttWeekLabels: 'number' | 'range' | 'both';
  dueDateNotifications: boolean;
  notificationLeadDays: number;
  autoSchedule: boolean;
  hideDoneInGantt: boolean;
  showSubtasksInKanban: boolean;
  teamMembers: TeamMember[];
}

// ─── Defaults ────────────────────────────────────────────────────────────────

export const DEFAULT_PM_SETTINGS: PMSettings = {
  projectsFolder: 'Projects',
  defaultView: 'table',
  ganttGranularity: 'week',
  ganttWeekLabels: 'range',
  dueDateNotifications: true,
  notificationLeadDays: 3,
  autoSchedule: true,
  hideDoneInGantt: false,
  showSubtasksInKanban: false,
  teamMembers: [],
};

export const DEFAULT_STATUSES: StatusConfig[] = [
  { id: 'todo', label: 'To Do', color: '#6b7280', icon: 'circle' },
  { id: 'in-progress', label: 'In Progress', color: '#3b82f6', icon: 'play' },
  { id: 'blocked', label: 'Blocked', color: '#ef4444', icon: 'alert-circle' },
  { id: 'in-review', label: 'In Review', color: '#f59e0b', icon: 'eye' },
  { id: 'done', label: 'Done', color: '#10b981', icon: 'check-circle' },
  { id: 'cancelled', label: 'Cancelled', color: '#9ca3af', icon: 'x-circle' },
];

export const DEFAULT_PRIORITIES: PriorityConfig[] = [
  { id: 'critical', label: 'Critical', color: '#ef4444', icon: 'alert-circle' },
  { id: 'high', label: 'High', color: '#f97316', icon: 'arrow-up' },
  { id: 'medium', label: 'Medium', color: '#eab308', icon: 'minus' },
  { id: 'low', label: 'Low', color: '#6b7280', icon: 'arrow-down' },
];
