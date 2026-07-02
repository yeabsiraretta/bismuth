import type { Task } from '@/types/data/task';

export type KanbanGroupBy = 'status' | 'priority' | 'project';

export interface KanbanColumn {
  id: string;
  title: string;
  cards: Task[];
}

export function groupByStatus(tasks: Task[]): KanbanColumn[] {
  const open = tasks.filter((t) => t.status === 'open');
  const done = tasks.filter((t) => t.status === 'done');
  const cancelled = tasks.filter((t) => t.status === 'cancelled');
  return [
    { id: 'open', title: 'To Do', cards: open },
    { id: 'done', title: 'Done', cards: done },
    { id: 'cancelled', title: 'Cancelled', cards: cancelled },
  ];
}

export function groupByPriority(tasks: Task[]): KanbanColumn[] {
  const critical = tasks.filter((t) => t.priority === 'critical');
  const high = tasks.filter((t) => t.priority === 'high');
  const medium = tasks.filter((t) => t.priority === 'medium');
  const low = tasks.filter((t) => t.priority === 'low' || t.priority === 'none');
  return [
    { id: 'critical', title: 'Critical', cards: critical },
    { id: 'high', title: 'High', cards: high },
    { id: 'medium', title: 'Medium', cards: medium },
    { id: 'low', title: 'Low / None', cards: low },
  ];
}

export function groupByProject(tasks: Task[]): KanbanColumn[] {
  const projects = new Map<string, Task[]>();
  for (const task of tasks) {
    const project = task.project || 'Unassigned';
    if (!projects.has(project)) projects.set(project, []);
    projects.get(project)!.push(task);
  }
  return Array.from(projects.entries()).map(([name, cards]) => ({
    id: name,
    title: name,
    cards,
  }));
}

export function getColumns(tasks: Task[], groupBy: KanbanGroupBy): KanbanColumn[] {
  switch (groupBy) {
    case 'status':
      return groupByStatus(tasks);
    case 'priority':
      return groupByPriority(tasks);
    case 'project':
      return groupByProject(tasks);
  }
}
