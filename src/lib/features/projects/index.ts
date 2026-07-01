/**
 * Project Manager feature module — full project management in your vault.
 * Public API barrel.
 */

// Types
export type {
  Project,
  PMTask,
  PMStatus,
  PMPriority,
  PMTaskType,
  PMViewMode,
  PMSettings,
  PMTaskFilter,
  PMTaskSort,
  SavedView,
  CustomFieldDef,
  CustomFieldType,
  StatusConfig,
  PriorityConfig,
  TeamMember,
  TimeLog,
  Recurrence,
  RecurrenceInterval,
  GanttGranularity,
} from './types';

export { DEFAULT_PM_SETTINGS, DEFAULT_STATUSES, DEFAULT_PRIORITIES } from './types';

// Services
export {
  generateId,
  parseTask,
  parseProject,
  readTaskFile,
  readProjectFile,
  writeTaskFile,
  writeProjectFile,
  deleteTaskFile,
  deleteProjectFile,
} from './services/projectIO';

export {
  hasCycle,
  wouldCreateCycle,
  topologicalSort,
  autoSchedule,
  nextOccurrence,
  isMilestone,
  buildDepGraph,
  diffDays,
  taskDuration,
} from './services/scheduling';

export {
  totalLoggedHours,
  logTime,
  timeBasedProgress,
  setProgress,
  isOverdue,
  isDueSoon,
  daysUntilDue,
  subtaskProgress,
  subtaskCounts,
  formatHours,
  formatDate,
  formatDateShort,
} from './services/timeTracking';

// Stores
export {
  projects,
  activeProjectId,
  activeProject,
  projectCount,
  projectsLoading,
  activeView,
  pmSettings,
  savedViews,
  loadProjects,
  createProject,
  updateProject,
  removeProject,
  openProject,
  closeProject,
  addSavedView,
  removeSavedView,
} from './stores/projectStore';

export {
  pmTasks,
  pmTaskFilter,
  pmTaskSort,
  pmTasksLoading,
  selectedTaskIds,
  filteredPMTasks,
  pmTaskStats,
  rootTasks,
  loadProjectTasks,
  createPMTask,
  updatePMTask,
  deletePMTask,
  addDependency,
  removeDependency,
  bulkSetStatus,
  bulkSetPriority,
  bulkArchive,
  bulkDelete,
} from './stores/pmTaskStore';

// Components
export { default as ProjectDashboard } from './components/ProjectDashboard.svelte';
export { default as TableView } from './components/views/TableView.svelte';
export { default as GanttView } from './components/views/GanttView.svelte';
export { default as KanbanView } from './components/views/KanbanView.svelte';
