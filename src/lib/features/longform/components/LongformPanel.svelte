<script lang="ts">
  import PanelHeader from '@/components/ui/layout/PanelHeader.svelte';
  import ActionButton from '@/components/ui/actions/ActionButton.svelte';
  import { longformProjects, activeProject, activeScene, projectLoading, refreshProjects, selectProject, selectScene, totalWordCount } from '../stores/longform';
  import { compileManuscript } from '../services/longform';
  import SceneList from './SceneList.svelte';
  import WordCounter from './WordCounter.svelte';

  let compiling = false;

  async function handleCompile() {
    const project = $activeProject;
    if (!project) return;
    compiling = true;
    try {
      await compileManuscript(project.root_path, {
        strip_frontmatter: true,
        scene_separator: '\n\n---\n\n',
        include_scene_titles: true,
        output_path: '',
      });
    } finally {
      compiling = false;
    }
  }

  refreshProjects();
</script>

<div class="longform-panel">
  <PanelHeader icon="book-open" title="Longform" count={$longformProjects.length || undefined}>
    <svelte:fragment slot="actions">
      <ActionButton icon="refresh-cw" title="Refresh" on:click={refreshProjects} disabled={$projectLoading} />
    </svelte:fragment>
  </PanelHeader>

  {#if $projectLoading}
    <div class="loading">Loading projects...</div>
  {:else if $longformProjects.length === 0}
    <div class="empty">
      <p>No longform projects found.</p>
      <p class="hint">Add <code>longform: true</code> to a note's frontmatter to create a project.</p>
    </div>
  {:else}
    <div class="project-list">
      {#each $longformProjects as project}
        <button
          class="project-item"
          class:active={$activeProject?.root_path === project.root_path}
          on:click={() => selectProject(project)}
        >
          <span class="project-title">{project.title}</span>
          <span class="project-words">{project.total_words.toLocaleString()} words</span>
        </button>
      {/each}
    </div>

    {#if $activeProject}
      <div class="project-detail">
        <WordCounter count={$totalWordCount} />
        <SceneList scenes={$activeProject.scenes} activeScene={$activeScene} onSelect={selectScene} />
        <button class="compile-btn" on:click={handleCompile} disabled={compiling}>
          {compiling ? 'Compiling...' : 'Compile Manuscript'}
        </button>
      </div>
    {/if}
  {/if}
</div>

<style>
  .longform-panel { display: flex; flex-direction: column; height: 100%; }
  .loading, .empty { color: var(--text-muted); text-align: center; padding: var(--spacing-lg); }
  .hint { font-size: var(--font-size-sm); }
  .project-list { display: flex; flex-direction: column; gap: 2px; margin-bottom: var(--spacing-md); }
  .project-item { display: flex; justify-content: space-between; padding: var(--spacing-xs) var(--spacing-sm); border: none; background: none; cursor: pointer; border-radius: var(--radius-sm); text-align: left; }
  .project-item:hover { background: var(--bg-hover); }
  .project-item.active { background: var(--bg-active); }
  .project-title { font-weight: 500; }
  .project-words { font-size: var(--font-size-sm); color: var(--text-muted); }
  .project-detail { flex: 1; overflow-y: auto; }
  .compile-btn { width: 100%; padding: var(--spacing-sm); margin-top: var(--spacing-md); background: var(--accent); color: var(--text-on-accent); border: none; border-radius: var(--radius-sm); cursor: pointer; }
  .compile-btn:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
