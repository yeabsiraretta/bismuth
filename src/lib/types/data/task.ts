/**
 * Task types matching the Rust task_service parser output.
 */

export type TaskPriority = 'lowest' | 'low' | 'none' | 'medium' | 'high' | 'highest' | 'critical';
export type TaskStatus = 'open' | 'done' | 'inprogress' | 'onhold' | 'cancelled';
export type StatusType = 'TODO' | 'DONE' | 'IN_PROGRESS' | 'ON_HOLD' | 'CANCELLED' | 'NON_TASK';

export interface Task {
  text: string;
  status: TaskStatus;
  status_symbol: string;
  status_type: StatusType;
  priority: TaskPriority;
  due_date: string | null;
  created_date: string | null;
  start_date: string | null;
  scheduled_date: string | null;
  done_date: string | null;
  cancelled_date: string | null;
  recurrence: string | null;
  id: string | null;
  depends_on: string[];
  tags: string[];
  line: number;
  source_path: string;
  project: string | null;
  heading: string | null;
  on_completion: string | null;
}

export interface TaskFilter {
  status?: TaskStatus;
  priority?: TaskPriority;
  project?: string;
  tag?: string;
  overdue?: boolean;
  search?: string;
}

export type TaskSort = 'priority' | 'duedate' | 'status' | 'project' | 'alphabetical';

export interface TaskQueryResult {
  groups: TaskGroup[];
  total_count: number;
  display: DisplayOptions;
  explain: string | null;
}

export interface TaskGroup {
  name: string;
  tasks: Task[];
  count: number;
}

export interface DisplayOptions {
  hidden_fields: string[];
  shown_fields: string[];
  short_mode: boolean;
}
