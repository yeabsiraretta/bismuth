<script lang="ts">
  import './+page.css';
  import { pageTitle, SITE_URL } from '@/constants/seo';
  import { formatNumber } from '@/hubs/creative/services/writing-service';
  import WritingCompileTab from '@/hubs/creative/components/WritingCompileTab.svelte';
  import WritingDraftsTab from '@/hubs/creative/components/WritingDraftsTab.svelte';
  import WritingScenesTab from '@/hubs/creative/components/WritingScenesTab.svelte';
  import WritingStatsTab from '@/hubs/creative/components/WritingStatsTab.svelte';
  import {
    addProject,
    deleteProject,
    getActiveProject,
    getActiveScenes,
    getMonthWords,
    getProjectProgress,
    getProjectTotalWords,
    getProjects,
    getRecentHistory,
    getStatusCounts,
    getStreak,
    getTodayWords,
    getWeekWords,
    setActiveProject,
    updateProject,
  } from '@/hubs/creative/stores/writing-store.svelte';
  import type { SceneStatus } from '@/hubs/creative/types/writing-types';
  import { SCENE_STATUS_LABELS, SCENE_STATUS_ORDER } from '@/hubs/creative/types/writing-types';
  import BIcon from '@/ui/b-icon.svelte';
  import { MetaTags } from 'svelte-meta-tags';

  let { data } = $props();

  let newProjectTitle = $state('');
  let showNewProject = $state(false);
  let activeTab = $state<'scenes' | 'drafts' | 'compile' | 'stats'>('scenes');

  let projects = $derived(getProjects());
  let project = $derived(getActiveProject());
  let scenes = $derived(getActiveScenes());
  let totalWords = $derived(getProjectTotalWords());
  let progress = $derived(getProjectProgress());
  let statusCounts = $derived(getStatusCounts());
  let streak = $derived(getStreak());
  let todayWords = $derived(getTodayWords());
  let weekWords = $derived(getWeekWords());
  let monthWords = $derived(getMonthWords());
  let recentDays = $derived(getRecentHistory());

  function handleAddProject() {
    if (!newProjectTitle.trim()) return;
    addProject(newProjectTitle.trim());
    newProjectTitle = '';
    showNewProject = false;
  }

  function statusColor(status: SceneStatus): string {
    const colors: Record<SceneStatus, string> = {
      idea: 'var(--color-text-subtle)',
      outlined: 'var(--color-purple)',
      draft: 'var(--color-warning)',
      written: 'var(--color-primary)',
      revised: 'var(--color-success)',
      final: 'var(--color-success)',
    };
    return colors[status];
  }
</script>

<MetaTags
  title={pageTitle(data.title ?? 'Writing')}
  description={data.description ?? 'Track your long-form writing projects and goals.'}
  canonical="{SITE_URL}/writing"
  openGraph={{
    url: `${SITE_URL}/writing`,
    title: pageTitle(data.title ?? 'Writing'),
    description: data.description ?? '',
  }}
/>

<div class="wr-page">
  <!-- Header -->
  <header class="wr-header">
    <div class="wr-header-top">
      <h1 class="wr-title">Writing</h1>
      <button
        class="wr-btn wr-btn-primary"
        onclick={() => {
          showNewProject = true;
        }}
      >
        <BIcon name="plus" size={14} /> New Project
      </button>
    </div>
    <div class="wr-stats-bar">
      <div class="wr-stat">
        <span class="wr-sv">{formatNumber(todayWords)}</span><span class="wr-sl">Today</span>
      </div>
      <div class="wr-stat">
        <span class="wr-sv">{formatNumber(weekWords)}</span><span class="wr-sl">This Week</span>
      </div>
      <div class="wr-stat">
        <span class="wr-sv">{formatNumber(monthWords)}</span><span class="wr-sl">This Month</span>
      </div>
      {#if streak > 0}
        <div class="wr-stat wr-accent">
          <span class="wr-sv">{streak}</span><span class="wr-sl">Day Streak</span>
        </div>
      {/if}
    </div>
  </header>

  <!-- New project form -->
  {#if showNewProject}
    <div class="wr-form">
      <input
        type="text"
        bind:value={newProjectTitle}
        placeholder="Project title…"
        class="wr-input"
        onkeydown={(e) => {
          if (e.key === 'Enter') handleAddProject();
          if (e.key === 'Escape') showNewProject = false;
        }}
      />
      <button class="wr-btn wr-btn-sm" onclick={handleAddProject}>Create</button>
      <button
        class="wr-btn wr-btn-ghost"
        onclick={() => {
          showNewProject = false;
        }}>Cancel</button
      >
    </div>
  {/if}

  <!-- Project picker -->
  {#if projects.length > 0}
    <div class="wr-picker">
      <label class="wr-sl" for="wr-proj-sel">Project</label>
      <select
        id="wr-proj-sel"
        class="wr-select"
        value={project?.id ?? ''}
        onchange={(e) => setActiveProject((e.target as HTMLSelectElement).value)}
      >
        {#each projects as p (p.id)}
          <option value={p.id}>{p.title}</option>
        {/each}
      </select>
      {#if project}
        <button
          class="wr-btn wr-btn-danger"
          onclick={() => {
            if (project) deleteProject(project.id);
          }}>Delete</button
        >
      {/if}
    </div>
  {/if}

  {#if project}
    <!-- Project card -->
    <div class="wr-card">
      <div class="wr-card-row">
        <span class="wr-card-title">{project.title}</span>
        <span class="wr-card-words">{formatNumber(totalWords)} words</span>
      </div>
      {#if project.targetWords > 0}
        <div class="wr-bar">
          <div
            class="wr-fill"
            style="width: {Math.min(100, Math.round((totalWords / project.targetWords) * 100))}%"
          ></div>
        </div>
        <span class="wr-meta"
          >{Math.round((totalWords / project.targetWords) * 100)}% of {formatNumber(
            project.targetWords
          )} target</span
        >
      {/if}
      <div class="wr-card-row wr-card-meta">
        <span>Progress: {Math.round(progress * 100)}%</span>
        <label class="wr-target-lbl"
          >Target:
          <input
            type="number"
            class="wr-input wr-input-sm"
            min="0"
            step="1000"
            value={project.targetWords}
            onchange={(e) =>
              updateProject(project.id, {
                targetWords: Number((e.target as HTMLInputElement).value),
              })}
          />
        </label>
      </div>
      <!-- Status breakdown -->
      <div class="wr-status-row">
        {#each SCENE_STATUS_ORDER as st (st)}
          {#if statusCounts[st] > 0}
            <span class="wr-status-badge" style="background: {statusColor(st)}"
              >{SCENE_STATUS_LABELS[st]} {statusCounts[st]}</span
            >
          {/if}
        {/each}
      </div>
    </div>

    <!-- Tabs -->
    <div class="wr-tabs">
      <button
        class="wr-tab"
        class:active={activeTab === 'scenes'}
        onclick={() => (activeTab = 'scenes')}>Scenes</button
      >
      <button
        class="wr-tab"
        class:active={activeTab === 'drafts'}
        onclick={() => (activeTab = 'drafts')}>Drafts</button
      >
      <button
        class="wr-tab"
        class:active={activeTab === 'compile'}
        onclick={() => (activeTab = 'compile')}>Compile</button
      >
      <button
        class="wr-tab"
        class:active={activeTab === 'stats'}
        onclick={() => (activeTab = 'stats')}>Stats</button
      >
    </div>

    <!-- Scenes tab -->
    {#if activeTab === 'scenes'}
      <WritingScenesTab {scenes} {statusColor} />
    {/if}

    <!-- Drafts tab -->
    {#if activeTab === 'drafts'}
      <WritingDraftsTab {project} />
    {/if}

    <!-- Compile tab -->
    {#if activeTab === 'compile'}
      <WritingCompileTab {scenes} />
    {/if}

    <!-- Stats tab -->
    {#if activeTab === 'stats'}
      <WritingStatsTab {recentDays} />
    {/if}
  {:else if projects.length === 0}
    <div class="wr-empty-state">
      <p>No writing projects yet</p>
      <span class="wr-empty-hint">Create a project to start tracking your manuscript.</span>
    </div>
  {/if}
</div>
