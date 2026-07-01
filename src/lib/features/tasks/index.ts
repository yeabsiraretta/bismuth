/**
 * Tasks feature module — task extraction, filtering, and management.
 * Public API barrel.
 */

// Stores
export {
  tasks,
  taskFilter,
  tasksLoading,
  filteredTasks,
  taskStats,
  taskProjects,
  refreshTasks,
  toggleTask,
} from './stores/tasks';

// Services
export {
  getAllTasks,
  getTasksFiltered,
  getTaskProjects,
  updateTaskStatus,
  executeTaskQuery,
} from './services/tasks';

// Components
export { default as TaskPanel } from './components/TaskPanel.svelte';
export { default as KanbanPanel } from './components/KanbanPanel.svelte';
