<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { loadWorkflows, persistCustomWorkflows, createWorkflow, executeWorkflow } from '../services/compileService';
  import type { CompileWorkflow, CompileResult, CompileStep } from '../types/compile';
  import { allEntities } from '../stores/entityStore';
  import { activeStoryId } from '../stores/storyStore';
  import type { SceneEntity, ChapterEntity } from '../types/entity';

  let workflows = loadWorkflows();
  let selectedWorkflowId: string | null = workflows[0]?.id ?? null;
  let result: CompileResult | null = null;
  let showEditor = false;

  $: selectedWorkflow = workflows.find(w => w.id === selectedWorkflowId) ?? null;

  function handleCompile() {
    if (!selectedWorkflow || !$activeStoryId) return;
    const scenes = $allEntities.filter(e => e.storyId === $activeStoryId && e.type === 'scene') as unknown as SceneEntity[];
    const chapters = $allEntities.filter(e => e.storyId === $activeStoryId && e.type === 'chapter') as unknown as ChapterEntity[];
    result = executeWorkflow(selectedWorkflow, scenes, chapters);
  }

  function addCustomWorkflow() {
    const wf = createWorkflow('Custom Workflow');
    workflows = [...workflows, wf];
    persistCustomWorkflows(workflows);
    selectedWorkflowId = wf.id;
    showEditor = true;
  }

  function toggleStep(stepId: string) {
    if (!selectedWorkflow || selectedWorkflow.isBuiltIn) return;
    const updated: CompileWorkflow = {
      ...selectedWorkflow,
      steps: selectedWorkflow.steps.map(s => s.id === stepId ? { ...s, enabled: !s.enabled } : s),
    };
    workflows = workflows.map(w => w.id === updated.id ? updated : w);
    persistCustomWorkflows(workflows);
  }

  function deleteWorkflow(id: string) {
    workflows = workflows.filter(w => w.id !== id);
    persistCustomWorkflows(workflows);
    if (selectedWorkflowId === id) selectedWorkflowId = workflows[0]?.id ?? null;
  }
</script>

<div class="cm-panel">
  <div class="cm-header">
    <h3>Compile</h3>
    <button class="cm-btn-icon" on:click={addCustomWorkflow} title="New custom workflow">
      <Icon name="plus" size={14} />
    </button>
  </div>

  <div class="cm-workflows">
    {#each workflows as wf (wf.id)}
      <div class="cm-wf" class:selected={selectedWorkflowId === wf.id}>
        <button class="cm-wf-btn" on:click={() => { selectedWorkflowId = wf.id; showEditor = false; result = null; }}>
          <Icon name={wf.isBuiltIn ? 'file-text' : 'edit-2'} size={13} />
          <div class="cm-wf-info">
            <div class="cm-wf-name">{wf.name}</div>
            <div class="cm-wf-desc">{wf.description}</div>
          </div>
          <span class="cm-wf-format">{wf.outputFormat}</span>
        </button>
        {#if !wf.isBuiltIn}
          <button class="cm-wf-delete" on:click|stopPropagation={() => deleteWorkflow(wf.id)} title="Delete">
            <Icon name="x" size={12} />
          </button>
        {/if}
      </div>
    {/each}
  </div>

  {#if selectedWorkflow}
    <div class="cm-detail">
      <div class="cm-detail-header">
        <h4>{selectedWorkflow.name}</h4>
        {#if !selectedWorkflow.isBuiltIn}
          <button class="cm-btn-ghost" on:click={() => { showEditor = !showEditor; }}>
            <Icon name="settings" size={13} /> Edit Steps
          </button>
        {/if}
      </div>

      {#if showEditor}
        <div class="cm-steps">
          {#each selectedWorkflow.steps as step (step.id)}
            <div class="cm-step" class:disabled={!step.enabled}>
              <label class="cm-step-toggle">
                <input type="checkbox" checked={step.enabled} on:change={() => toggleStep(step.id)} disabled={selectedWorkflow.isBuiltIn} />
                <span>{step.label}</span>
              </label>
              <span class="cm-step-type">{step.type}</span>
            </div>
          {/each}
          {#if selectedWorkflow.steps.length === 0}
            <div class="cm-empty">No steps configured. Add steps to build your workflow.</div>
          {/if}
        </div>
      {/if}

      <button class="cm-compile-btn" on:click={handleCompile}>
        <Icon name="play" size={14} /> Compile Manuscript
      </button>
    </div>
  {/if}

  {#if result}
    <div class="cm-result">
      <div class="cm-result-stats">
        <span><strong>{result.wordCount.toLocaleString()}</strong> words</span>
        <span><strong>{result.sceneCount}</strong> scenes</span>
        <span><strong>{result.chapterCount}</strong> chapters</span>
      </div>
      {#if result.warnings.length > 0}
        <div class="cm-warnings">
          {#each result.warnings as w}
            <div class="cm-warning"><Icon name="alert-triangle" size={12} /> {w}</div>
          {/each}
        </div>
      {/if}
      <div class="cm-output">
        <textarea class="cm-output-text" readonly value={result.content} />
      </div>
    </div>
  {/if}
</div>

<style>
  .cm-panel { display: flex; flex-direction: column; height: 100%; }
  .cm-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border-bottom: 1px solid var(--background-modifier-border, #333); }
  .cm-header h3 { margin: 0; font-size: 14px; }
  .cm-btn-icon { border: none; background: none; color: var(--text-normal); cursor: pointer; padding: 4px; }
  .cm-workflows { border-bottom: 1px solid var(--background-modifier-border, #333); max-height: 200px; overflow-y: auto; }
  .cm-wf { display: flex; align-items: center; position: relative; }
  .cm-wf.selected { background: var(--background-secondary-alt, #333); }
  .cm-wf-btn { flex: 1; display: flex; align-items: center; gap: 8px; padding: 8px 14px; border: none; background: none; color: var(--text-normal); cursor: pointer; text-align: left; }
  .cm-wf:hover { background: var(--background-modifier-hover, #2a2a2a); }
  .cm-wf-info { flex: 1; }
  .cm-wf-name { font-size: 13px; font-weight: 500; }
  .cm-wf-desc { font-size: 10px; opacity: 0.5; }
  .cm-wf-format { font-size: 10px; padding: 2px 6px; border-radius: 8px; background: var(--background-modifier-border, #444); }
  .cm-wf-delete { position: absolute; right: 8px; border: none; background: none; color: var(--text-muted); cursor: pointer; opacity: 0; }
  .cm-wf:hover .cm-wf-delete { opacity: 1; }
  .cm-detail { padding: 12px 14px; }
  .cm-detail-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
  .cm-detail-header h4 { margin: 0; font-size: 13px; }
  .cm-btn-ghost { display: flex; align-items: center; gap: 4px; border: none; background: none; color: var(--text-muted); cursor: pointer; font-size: 11px; }
  .cm-steps { margin-bottom: 12px; }
  .cm-step { display: flex; align-items: center; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid var(--background-modifier-border, #2a2a2a); }
  .cm-step.disabled { opacity: 0.4; }
  .cm-step-toggle { display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer; }
  .cm-step-type { font-size: 10px; opacity: 0.4; }
  .cm-compile-btn { width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px; border: none; border-radius: 4px; background: var(--interactive-accent, #7c3aed); color: #fff; cursor: pointer; font-size: 13px; }
  .cm-compile-btn:hover { opacity: 0.9; }
  .cm-result { padding: 12px 14px; border-top: 1px solid var(--background-modifier-border, #333); }
  .cm-result-stats { display: flex; gap: 12px; font-size: 12px; margin-bottom: 8px; }
  .cm-warnings { margin-bottom: 8px; }
  .cm-warning { display: flex; align-items: center; gap: 4px; font-size: 11px; color: #eab308; padding: 2px 0; }
  .cm-output-text { width: 100%; height: 200px; padding: 8px; border: 1px solid var(--background-modifier-border, #444); border-radius: 4px; background: var(--background-primary); color: var(--text-normal); font-family: monospace; font-size: 11px; resize: vertical; }
  .cm-empty { text-align: center; padding: 12px; opacity: 0.5; font-size: 11px; }
</style>
