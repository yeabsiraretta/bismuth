<script lang="ts">
  import './+page.css';
  import { SvelteMap } from 'svelte/reactivity';
  import { PM_VIEW_KEY, PROJECT_STATUSES_KEY } from '@/constants/storage-keys';
  import { getNotes } from '@/hubs/core/stores/vault-store.svelte';
  import GanttView from '@/hubs/planner/components/GanttView.svelte';
  import KanbanView from '@/hubs/planner/components/KanbanView.svelte';
  import { addTask, getPMTasks, initPMStore } from '@/hubs/planner/stores/pm-task-store.svelte';
  import { openTab } from '@/hubs/editor/stores/editor-tabs.svelte';
  import type { PMViewMode } from '@/hubs/planner/types/pm-types';
  import { pageTitle, SITE_URL } from '@/constants/seo';
  import { MetaTags } from 'svelte-meta-tags';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import type { Snapshot } from './$types';

  let { data } = $props();

  type FilterValue = 'all' | 'active' | 'paused' | 'done';
  const VALID_FILTERS: FilterValue[] = ['all', 'active', 'paused', 'done'];

  function getFilterFromUrl(): FilterValue {
    const param = page.url.searchParams.get('filter');
    return VALID_FILTERS.includes(param as FilterValue) ? (param as FilterValue) : 'all';
  }

  export const snapshot: Snapshot<{ filter: FilterValue }> = {
    capture: () => ({ filter }),
    restore: (snap) => {
      filter = snap.filter;
    },
  };

  type ProjectStatus = 'active' | 'paused' | 'done';
  const STATUS_CYCLE: ProjectStatus[] = ['active', 'paused', 'done'];

  interface Project {
    name: string;
    path: string;
    noteCount: number;
    status: ProjectStatus;
  }

  let filter = $state<FilterValue>(getFilterFromUrl());
  let projects = $state<Project[]>([]);
  let statusMap = $state<Record<string, ProjectStatus>>(loadStatusMap());

  function loadViewMode(): PMViewMode {
    try {
      return (localStorage.getItem(PM_VIEW_KEY) as PMViewMode) ?? 'list';
    } catch {
      return 'list';
    }
  }
  let viewMode = $state<PMViewMode>(loadViewMode());
  let showAddTask = $state(false);
  let newTaskTitle = $state('');
  let newTaskStart = $state('');
  let newTaskDue = $state('');

  initPMStore();
  let pmTasks = $derived(getPMTasks());

  function loadStatusMap(): Record<string, ProjectStatus> {
    try {
      const raw = localStorage.getItem(PROJECT_STATUSES_KEY);
      return raw ? (JSON.parse(raw) as Record<string, ProjectStatus>) : {};
    } catch {
      return {};
    }
  }

  function saveStatusMap() {
    localStorage.setItem(PROJECT_STATUSES_KEY, JSON.stringify(statusMap));
  }

  function cycleStatus(e: Event, project: Project) {
    e.stopPropagation();
    const idx = STATUS_CYCLE.indexOf(project.status);
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    project.status = next;
    statusMap[project.path] = next;
    saveStatusMap();
  }

  $effect(() => {
    const notes = getNotes();
    const folders = new SvelteMap<string, { count: number; path: string }>();

    for (const note of notes) {
      const parts = note.path.split('/');
      if (parts.length > 1) {
        const folder = parts[0];
        const existing = folders.get(folder);
        if (existing) {
          existing.count++;
        } else {
          folders.set(folder, { count: 1, path: folder });
        }
      }
    }

    projects = Array.from(folders.entries()).map(([name, info]) => ({
      name,
      path: info.path,
      noteCount: info.count,
      status: statusMap[info.path] ?? 'active',
    }));
  });

  let filtered = $derived(
    filter === 'all' ? projects : projects.filter((p) => p.status === filter)
  );

  function openProject(path: string) {
    window.dispatchEvent(new CustomEvent('open-note', { detail: { path: `${path}/index.md` } }));
  }

  function handleTaskClick(taskId: string) {
    const task = pmTasks.find((t) => t.id === taskId);
    if (task?.notePath) {
      openTab(task.notePath, task.title);
    }
  }

  function setView(mode: PMViewMode) {
    viewMode = mode;
    localStorage.setItem(PM_VIEW_KEY, mode);
  }

  function handleAddTask() {
    if (!newTaskTitle.trim()) return;
    addTask({
      title: newTaskTitle.trim(),
      startDate: newTaskStart || null,
      dueDate: newTaskDue || null,
    });
    newTaskTitle = '';
    newTaskStart = '';
    newTaskDue = '';
    showAddTask = false;
  }
</script>

<MetaTags
  title={pageTitle(data.title ?? 'Projects')}
  description={data.description ?? 'Manage your projects and workspaces.'}
  canonical="{SITE_URL}/projects"
  openGraph={{
    url: `${SITE_URL}/projects`,
    title: pageTitle(data.title ?? 'Projects'),
    description: data.description ?? '',
  }}
/>

<div class="projects-page">
  <header class="projects-header">
    <h1 class="page-title">Projects</h1>
    <div class="view-switcher">
      <button class="view-btn" class:active={viewMode === 'list'} onclick={() => setView('list')}
        >List</button
      >
      <button
        class="view-btn"
        class:active={viewMode === 'kanban'}
        onclick={() => setView('kanban')}>Kanban</button
      >
      <button class="view-btn" class:active={viewMode === 'gantt'} onclick={() => setView('gantt')}
        >Gantt</button
      >
    </div>
    {#if viewMode === 'list'}
      <div class="filter-tabs">
        {#each ['all', 'active', 'paused', 'done'] as const as tab (tab)}
          <button
            class="filter-tab"
            class:active={filter === tab}
            onclick={() => {
              filter = tab;
              goto(`?filter=${tab}`, { replaceState: true, keepFocus: true, noScroll: true });
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        {/each}
      </div>
    {:else}
      <button
        class="add-task-btn"
        onclick={() => {
          showAddTask = !showAddTask;
        }}>+ Task</button
      >
    {/if}
  </header>

  {#if viewMode === 'kanban'}
    <div class="kanban-wrap">
      <KanbanView tasks={pmTasks} />
    </div>
  {:else if viewMode === 'gantt'}
    {#if showAddTask}
      <div class="add-task-form">
        <input
          class="task-input"
          type="text"
          placeholder="Task title"
          bind:value={newTaskTitle}
          onkeydown={(e) => e.key === 'Enter' && handleAddTask()}
        />
        <input class="task-date" type="date" bind:value={newTaskStart} />
        <input class="task-date" type="date" bind:value={newTaskDue} />
        <button class="task-submit" onclick={handleAddTask} disabled={!newTaskTitle.trim()}
          >Add</button
        >
      </div>
    {/if}
    <div class="gantt-wrap">
      <GanttView tasks={pmTasks} onTaskClick={handleTaskClick} />
    </div>
  {:else if filtered.length === 0}
    <div class="empty-state">
      <p>No projects found</p>
      <span class="empty-hint">Folders in your vault are shown as projects</span>
    </div>
  {:else}
    <div class="projects-list">
      <div class="list-header">
        <span class="col-status">Status</span>
        <span class="col-name">Name</span>
        <span class="col-notes">Notes</span>
      </div>
      {#each filtered as project (project.path)}
        <div
          class="project-row"
          onclick={() => openProject(project.path)}
          onkeydown={(e) => e.key === 'Enter' && openProject(project.path)}
          role="button"
          tabindex="0"
        >
          <span class="col-status">
            <button
              class="status-dot"
              class:active={project.status === 'active'}
              class:paused={project.status === 'paused'}
              class:done={project.status === 'done'}
              onclick={(e) => cycleStatus(e, project)}
              title="{project.status} — click to cycle"
              aria-label="Status: {project.status}"
            ></button>
          </span>
          <span class="col-name">
            <span class="project-name">{project.name}</span>
            <span
              class="project-status-label"
              class:active={project.status === 'active'}
              class:paused={project.status === 'paused'}
              class:done={project.status === 'done'}>{project.status}</span
            >
          </span>
          <span class="col-notes">{project.noteCount}</span>
        </div>
      {/each}
    </div>
  {/if}
</div>
