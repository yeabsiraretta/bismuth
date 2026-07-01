<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import PanelHeader from '@/components/ui/layout/PanelHeader.svelte';
  import {
    projects,
    activeProjectId,
    projectsLoading,
    pmSettings,
    createProject,
    openProject,
    loadProjects,
    closeProject,
    activeView,
    activeProject,
  } from '../stores/projectStore';
  import { loadProjectTasks, pmTaskStats } from '../stores/pmTaskStore';
  import { onMount } from 'svelte';
  import type { PMViewMode } from '../types';
  import TableView from './views/TableView.svelte';
  import GanttView from './views/GanttView.svelte';
  import KanbanView from './views/KanbanView.svelte';

  let newProjectName = '';
  let newProjectColor = '#3b82f6';
  let showCreate = false;

  onMount(() => {
    loadProjects($pmSettings.projectsFolder);
  });

  async function handleCreate() {
    if (!newProjectName.trim()) return;
    await createProject(newProjectName.trim(), newProjectColor, 'briefcase');
    newProjectName = '';
    showCreate = false;
    if ($activeProject) await loadProjectTasks($activeProject.folder);
  }

  async function handleOpen(id: string) {
    openProject(id);
    const proj = $projects.find((p) => p.id === id);
    if (proj) await loadProjectTasks(proj.folder);
  }

  function handleViewChange(view: PMViewMode) {
    $activeView = view;
  }

  const VIEW_TABS: { id: PMViewMode; label: string; icon: string }[] = [
    { id: 'table', label: 'Table', icon: 'list' },
    { id: 'gantt', label: 'Gantt', icon: 'bar-chart-2' },
    { id: 'kanban', label: 'Kanban', icon: 'columns' },
  ];
</script>

<div class="pm-dashboard" role="tabpanel" aria-label="Project Manager">
  {#if !$activeProjectId}
    <PanelHeader icon="briefcase" title="Projects" count={$projects.length || undefined}>
      <svelte:fragment slot="actions">
        <button
          class="icon-btn"
          on:click={() => loadProjects($pmSettings.projectsFolder)}
          title="Refresh"
        >
          <Icon name="refresh-cw" size={14} />
        </button>
        <button class="icon-btn" on:click={() => (showCreate = !showCreate)} title="New Project">
          <Icon name="plus" size={14} />
        </button>
      </svelte:fragment>
    </PanelHeader>

    {#if showCreate}
      <div class="create-form">
        <input
          bind:value={newProjectName}
          placeholder="Project name..."
          class="input-field"
          on:keydown={(e) => e.key === 'Enter' && handleCreate()}
        />
        <input
          type="color"
          bind:value={newProjectColor}
          class="color-picker"
          title="Project color"
        />
        <button class="btn-primary" on:click={handleCreate} disabled={!newProjectName.trim()}
          >Create</button
        >
      </div>
    {/if}

    {#if $projectsLoading}
      <div class="empty-state"><p>Loading projects...</p></div>
    {:else if $projects.length === 0}
      <div class="empty-state">
        <Icon name="briefcase" size={32} />
        <p>No projects yet</p>
        <button class="btn-primary" on:click={() => (showCreate = true)}
          >Create your first project</button
        >
      </div>
    {:else}
      <div class="project-list">
        {#each $projects as project (project.id)}
          <button class="project-card" on:click={() => handleOpen(project.id)}>
            <span class="project-dot" style="background:{project.color}"></span>
            <div class="project-info">
              <span class="project-name">{project.name}</span>
              {#if project.description}
                <span class="project-desc">{project.description}</span>
              {/if}
            </div>
            <Icon name="chevron-right" size={14} />
          </button>
        {/each}
      </div>
    {/if}
  {:else}
    <div class="project-header">
      <button class="back-btn" on:click={closeProject} title="Back to projects">
        <Icon name="arrow-left" size={14} />
      </button>
      {#if $activeProject}
        <span class="project-dot" style="background:{$activeProject.color}"></span>
        <h3 class="project-title">{$activeProject.name}</h3>
      {/if}
      <div class="stat-pills">
        <span class="pill">{$pmTaskStats.total} tasks</span>
        <span class="pill done">{$pmTaskStats.done} done</span>
      </div>
    </div>

    <div class="view-tabs">
      {#each VIEW_TABS as tab (tab.id)}
        <button
          class="view-tab"
          class:active={$activeView === tab.id}
          on:click={() => handleViewChange(tab.id)}
        >
          <Icon name={tab.icon} size={14} />
          {tab.label}
        </button>
      {/each}
    </div>

    <div class="view-content">
      {#if $activeView === 'table'}
        <TableView />
      {:else if $activeView === 'gantt'}
        <GanttView />
      {:else if $activeView === 'kanban'}
        <KanbanView />
      {/if}
    </div>
  {/if}
</div>

<style>
  .pm-dashboard {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }
  .create-form {
    display: flex;
    gap: var(--spacing-xs);
    padding: var(--spacing-s);
  }
  .input-field {
    flex: 1;
    padding: var(--spacing-xs) var(--spacing-s);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    background: var(--background-primary);
    color: var(--text-normal);
    font-size: var(--font-ui-small);
  }
  .color-picker {
    width: 28px;
    height: 28px;
    border: none;
    border-radius: var(--radius-s);
    cursor: pointer;
    padding: 0;
  }
  .btn-primary {
    padding: var(--spacing-xs) var(--spacing-s);
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    border: none;
    border-radius: var(--radius-s);
    font-size: var(--font-ui-small);
    cursor: pointer;
  }
  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-s);
    padding: var(--spacing-xl);
    color: var(--text-muted);
    text-align: center;
  }
  .project-list {
    display: flex;
    flex-direction: column;
    gap: 1px;
    overflow-y: auto;
    flex: 1;
  }
  .project-card {
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
    padding: var(--spacing-s) var(--spacing-m);
    background: none;
    border: none;
    text-align: left;
    cursor: pointer;
    color: var(--text-normal);
    transition: background 0.15s;
    width: 100%;
  }
  .project-card:hover {
    background: var(--background-modifier-hover);
  }
  .project-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .project-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .project-name {
    font-size: var(--font-ui-small);
    font-weight: var(--font-medium);
  }
  .project-desc {
    font-size: 11px;
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .project-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-s) var(--spacing-m);
    border-bottom: 1px solid var(--border-color);
  }
  .back-btn {
    display: flex;
    align-items: center;
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 2px;
    border-radius: var(--radius-s);
  }
  .back-btn:hover {
    color: var(--text-normal);
  }
  .project-title {
    font-size: var(--font-ui-small);
    font-weight: var(--font-semibold);
    margin: 0;
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .stat-pills {
    display: flex;
    gap: var(--spacing-xs);
  }
  .pill {
    font-size: 10px;
    padding: 1px 6px;
    border-radius: var(--radius-full, 9999px);
    background: var(--background-secondary);
    color: var(--text-muted);
  }
  .pill.done {
    background: #10b98122;
    color: #10b981;
  }
  .view-tabs {
    display: flex;
    border-bottom: 1px solid var(--border-color);
  }
  .view-tab {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) var(--spacing-m);
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--text-muted);
    font-size: var(--font-ui-small);
    cursor: pointer;
    transition: all 0.15s;
  }
  .view-tab:hover {
    color: var(--text-normal);
  }
  .view-tab.active {
    color: var(--interactive-accent);
    border-bottom-color: var(--interactive-accent);
  }
  .view-content {
    flex: 1;
    overflow: auto;
  }
</style>
