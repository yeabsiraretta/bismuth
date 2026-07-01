<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { stories, activeStory, dashboardView, selectStory, addStory, removeStory, setDashboardView } from '../stores/storyStore';
  import { entityCountsByType } from '../stores/entityStore';
  import type { DashboardView } from '../types/story';
  import EntityPanel from './EntityPanel.svelte';
  import TimelinePanel from './TimelinePanel.svelte';
  import CampaignPanel from './CampaignPanel.svelte';
  import CompilePanel from './CompilePanel.svelte';
  import StoryBoard from './StoryBoard.svelte';
  import PlotgridView from './views/PlotgridView.svelte';
  import PlotlineMapView from './views/PlotlineMapView.svelte';
  import ManuscriptView from './views/ManuscriptView.svelte';
  import StatsView from './views/StatsView.svelte';
  import NavigatorPanel from './views/NavigatorPanel.svelte';
  import ExportPanel from './views/ExportPanel.svelte';
  import CorkboardView from './views/CorkboardView.svelte';

  let newStoryName = '';
  let showNewStory = false;

  function handleCreate() {
    if (!newStoryName.trim()) return;
    addStory(newStoryName.trim());
    newStoryName = '';
    showNewStory = false;
  }

  const NAV_ITEMS: { view: DashboardView; icon: string; label: string }[] = [
    { view: 'entities', icon: 'layers', label: 'Entities' },
    { view: 'storyboard', icon: 'layout', label: 'Story Board' },
    { view: 'corkboard', icon: 'grid', label: 'Corkboard' },
    { view: 'plotgrid', icon: 'grid', label: 'Plot Grid' },
    { view: 'plotlines', icon: 'git-branch', label: 'Plotlines' },
    { view: 'timeline', icon: 'activity', label: 'Timeline' },
    { view: 'manuscript', icon: 'file-text', label: 'Manuscript' },
    { view: 'navigator', icon: 'search', label: 'Navigator' },
    { view: 'campaign', icon: 'shield', label: 'Campaign' },
    { view: 'stats', icon: 'bar-chart-2', label: 'Stats' },
    { view: 'compile', icon: 'file-text', label: 'Compile' },
    { view: 'export', icon: 'download', label: 'Export' },
  ];
</script>

<div class="st-dashboard">
  <div class="st-sidebar">
    <div class="st-sidebar-header">
      <Icon name="book-open" size={16} />
      <span class="st-sidebar-title">Storyteller</span>
    </div>

    {#if $activeStory}
      <div class="st-story-badge">
        <span class="st-story-name">{$activeStory.name}</span>
        <button class="st-btn-ghost" on:click={() => { setDashboardView('stories'); }} title="Switch story">
          <Icon name="chevron-down" size={14} />
        </button>
      </div>
      <nav class="st-nav">
        {#each NAV_ITEMS as item}
          <button class="st-nav-item" class:active={$dashboardView === item.view} on:click={() => setDashboardView(item.view)}>
            <Icon name={item.icon} size={15} />
            <span>{item.label}</span>
            {#if item.view === 'entities'}
              <span class="st-nav-count">{Object.values($entityCountsByType).reduce((a, b) => a + b, 0)}</span>
            {/if}
          </button>
        {/each}
      </nav>
    {/if}
  </div>

  <div class="st-content">
    {#if $dashboardView === 'stories' || !$activeStory}
      <div class="st-stories-view">
        <div class="st-stories-header">
          <h2>Your Stories</h2>
          <button class="st-btn-primary" on:click={() => { showNewStory = true; }}>
            <Icon name="plus" size={14} /> New Story
          </button>
        </div>
        {#if showNewStory}
          <div class="st-new-story">
            <input bind:value={newStoryName} placeholder="Story name…" on:keydown={(e) => e.key === 'Enter' && handleCreate()} />
            <button class="st-btn-primary" on:click={handleCreate}>Create</button>
            <button class="st-btn-ghost" on:click={() => { showNewStory = false; }}>Cancel</button>
          </div>
        {/if}
        <div class="st-story-grid">
          {#each $stories as story (story.id)}
            <div class="st-story-card" on:click={() => selectStory(story.id)} on:keydown={(e) => e.key === 'Enter' && selectStory(story.id)} role="button" tabindex="0">
              <div class="st-story-card-title">{story.name}</div>
              <div class="st-story-card-meta">
                <span>{story.wordCount.toLocaleString()} words</span>
                <span>Created {new Date(story.createdAt).toLocaleDateString()}</span>
              </div>
              <button class="st-story-delete" on:click|stopPropagation={() => removeStory(story.id)} title="Delete story">
                <Icon name="trash-2" size={13} />
              </button>
            </div>
          {/each}
          {#if $stories.length === 0 && !showNewStory}
            <div class="st-empty">
              <Icon name="book-open" size={32} />
              <p>No stories yet. Create your first one to get started.</p>
            </div>
          {/if}
        </div>
      </div>
    {:else if $dashboardView === 'entities'}
      <EntityPanel />
    {:else if $dashboardView === 'timeline'}
      <TimelinePanel />
    {:else if $dashboardView === 'storyboard'}
      <StoryBoard />
    {:else if $dashboardView === 'campaign'}
      <CampaignPanel />
    {:else if $dashboardView === 'compile'}
      <CompilePanel />
    {:else if $dashboardView === 'plotgrid'}
      <PlotgridView />
    {:else if $dashboardView === 'plotlines'}
      <PlotlineMapView />
    {:else if $dashboardView === 'manuscript'}
      <ManuscriptView />
    {:else if $dashboardView === 'stats'}
      <StatsView />
    {:else if $dashboardView === 'navigator'}
      <NavigatorPanel />
    {:else if $dashboardView === 'export'}
      <ExportPanel />
    {:else if $dashboardView === 'corkboard'}
      <CorkboardView />
    {/if}
  </div>
</div>

<style>
  .st-dashboard { display: flex; height: 100%; font-size: 13px; color: var(--text-normal, #ddd); background: var(--background-primary, #1e1e1e); }
  .st-sidebar { width: 200px; min-width: 200px; border-right: 1px solid var(--background-modifier-border, #333); display: flex; flex-direction: column; background: var(--background-secondary, #252525); }
  .st-sidebar-header { display: flex; align-items: center; gap: 8px; padding: 10px 12px; font-weight: 600; font-size: 14px; border-bottom: 1px solid var(--background-modifier-border, #333); }
  .st-sidebar-title { flex: 1; }
  .st-story-badge { display: flex; align-items: center; gap: 6px; padding: 8px 12px; border-bottom: 1px solid var(--background-modifier-border, #333); }
  .st-story-name { flex: 1; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .st-nav { flex: 1; display: flex; flex-direction: column; gap: 1px; padding: 6px; }
  .st-nav-item { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border: none; background: none; color: var(--text-normal, #ddd); cursor: pointer; border-radius: 4px; text-align: left; font-size: 13px; width: 100%; }
  .st-nav-item:hover { background: var(--background-modifier-hover, #333); }
  .st-nav-item.active { background: var(--interactive-accent, #7c3aed); color: #fff; }
  .st-nav-count { margin-left: auto; font-size: 11px; opacity: 0.7; }
  .st-content { flex: 1; overflow-y: auto; }
  .st-stories-view { padding: 16px; }
  .st-stories-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
  .st-stories-header h2 { margin: 0; font-size: 16px; }
  .st-new-story { display: flex; gap: 8px; margin-bottom: 16px; }
  .st-new-story input { flex: 1; padding: 6px 10px; border: 1px solid var(--background-modifier-border, #444); border-radius: 4px; background: var(--background-primary, #1e1e1e); color: var(--text-normal, #ddd); font-size: 13px; }
  .st-story-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
  .st-story-card { position: relative; padding: 16px; border: 1px solid var(--background-modifier-border, #333); border-radius: 8px; background: var(--background-secondary, #252525); cursor: pointer; text-align: left; color: var(--text-normal, #ddd); transition: border-color 0.2s; }
  .st-story-card:hover { border-color: var(--interactive-accent, #7c3aed); }
  .st-story-card-title { font-weight: 600; font-size: 14px; margin-bottom: 8px; }
  .st-story-card-meta { display: flex; flex-direction: column; gap: 2px; font-size: 11px; opacity: 0.6; }
  .st-story-delete { position: absolute; top: 8px; right: 8px; border: none; background: none; color: var(--text-muted); cursor: pointer; opacity: 0; transition: opacity 0.2s; padding: 4px; }
  .st-story-card:hover .st-story-delete { opacity: 1; }
  .st-story-delete:hover { color: var(--text-error, #f87171); }
  .st-btn-primary { display: flex; align-items: center; gap: 6px; padding: 6px 12px; border: none; border-radius: 4px; background: var(--interactive-accent, #7c3aed); color: #fff; cursor: pointer; font-size: 12px; }
  .st-btn-primary:hover { opacity: 0.9; }
  .st-btn-ghost { border: none; background: none; color: var(--text-muted); cursor: pointer; padding: 4px; }
  .st-btn-ghost:hover { color: var(--text-normal); }
  .st-empty { grid-column: 1 / -1; text-align: center; padding: 40px; opacity: 0.5; }
  .st-empty p { margin-top: 8px; }
</style>
