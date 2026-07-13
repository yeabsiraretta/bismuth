/**
 * Project Manager types — Tasks, statuses, priorities, settings.
 * Ported from v1 features/projects-hub/projects/types/index.ts.
 */

// ─── Status & Priority ──────────────────────────────────────────

export type PMStatus = 'todo' | 'in-progress' | 'blocked' | 'in-review' | 'done' | 'cancelled';
export type PMPriority = 'critical' | 'high' | 'medium' | 'low';
type PMTaskType = 'task' | 'subtask' | 'milestone';
export type PMViewMode = 'list' | 'gantt' | 'kanban';
export type GanttGranularity = 'day' | 'week' | 'month' | 'quarter';

export interface StatusConfig {
  id: PMStatus;
  label: string;
  color: string;
}

export interface PriorityConfig {
  id: PMPriority;
  label: string;
  color: string;
}

// ─── Task ────────────────────────────────────────────────────────

export interface PMTask {
  id: string;
  taskNumber: number;
  title: string;
  description: string;
  status: PMStatus;
  priority: PMPriority;
  type: PMTaskType;
  project: string;
  notePath: string | null;
  startDate: string | null;
  dueDate: string | null;
  scheduledDate: string | null;
  doneDate: string | null;
  recurrence: PMRecurrence | null;
  progress: number;
  parentId: string | null;
  subtaskIds: string[];
  dependencies: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── Recurrence ─────────────────────────────────────────────────

export type PMRecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface PMRecurrence {
  frequency: PMRecurrenceFrequency;
  interval: number;
  daysOfWeek?: number[];
  endDate?: string | null;
}

// ─── Query / Sort ───────────────────────────────────────────────

export type TaskSortField =
  'title' | 'dueDate' | 'doneDate' | 'priority' | 'status' | 'createdAt' | 'updatedAt';
type TaskSortDirection = 'asc' | 'desc';

export interface TaskQuery {
  status?: PMStatus[];
  priority?: PMPriority[];
  project?: string;
  tags?: string[];
  search?: string;
  dueBefore?: string;
  dueAfter?: string;
  doneBefore?: string;
  doneAfter?: string;
  hideDone?: boolean;
  notePath?: string;
  sortBy?: TaskSortField;
  sortDir?: TaskSortDirection;
}

// ─── Settings ────────────────────────────────────────────────────

export interface PMSettings {
  defaultView: PMViewMode;
  ganttGranularity: GanttGranularity;
  hideDoneInGantt: boolean;
  kanbanColumns: PMStatus[];
  taskSortField: TaskSortField;
  taskSortDir: TaskSortDirection;
}

// ─── Defaults ────────────────────────────────────────────────────

export const DEFAULT_PM_SETTINGS: PMSettings = {
  defaultView: 'list',
  ganttGranularity: 'week',
  hideDoneInGantt: false,
  kanbanColumns: ['todo', 'in-progress', 'in-review', 'done'],
  taskSortField: 'dueDate',
  taskSortDir: 'asc',
};

export const DEFAULT_STATUSES: StatusConfig[] = [
  { id: 'todo', label: 'To Do', color: '#6b7280' },
  { id: 'in-progress', label: 'In Progress', color: '#3b82f6' },
  { id: 'blocked', label: 'Blocked', color: '#ef4444' },
  { id: 'in-review', label: 'In Review', color: '#f59e0b' },
  { id: 'done', label: 'Done', color: '#10b981' },
  { id: 'cancelled', label: 'Cancelled', color: '#9ca3af' },
];

export const DEFAULT_PRIORITIES: PriorityConfig[] = [
  { id: 'critical', label: 'Critical', color: '#ef4444' },
  { id: 'high', label: 'High', color: '#f97316' },
  { id: 'medium', label: 'Medium', color: '#eab308' },
  { id: 'low', label: 'Low', color: '#6b7280' },
];
