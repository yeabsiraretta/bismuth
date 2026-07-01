<script lang="ts">
  import type { StoryCircleEntry, StoryCircleStage } from '../types';
  import { STORY_CIRCLE_STAGES, getStoryCircleProgress } from '../services/narrativeService';

  export let entries: StoryCircleEntry[] = [];
  export let onUpdate: ((entries: StoryCircleEntry[]) => void) | undefined = undefined;
  export let readonly: boolean = false;

  $: progress = getStoryCircleProgress(entries);

  function handleInput(stage: StoryCircleStage, value: string) {
    const updated = entries.map((e) =>
      e.stage === stage ? { ...e, description: value } : e
    );
    if (onUpdate) onUpdate(updated);
  }

  function getEntry(stage: StoryCircleStage): string {
    return entries.find((e) => e.stage === stage)?.description ?? '';
  }

  const positions = [
    { x: 50, y: 8 },   // you (top)
    { x: 85, y: 22 },  // need (top-right)
    { x: 92, y: 55 },  // go (right)
    { x: 75, y: 85 },  // search (bottom-right)
    { x: 50, y: 92 },  // find (bottom)
    { x: 25, y: 85 },  // take (bottom-left)
    { x: 8, y: 55 },   // return (left)
    { x: 15, y: 22 },  // change (top-left)
  ];
</script>

<div class="story-circle">
  <div class="sc-header">
    <span class="sc-title">Story Circle</span>
    <span class="sc-progress">{progress}%</span>
  </div>

  <div class="sc-wheel">
    <svg viewBox="0 0 100 100" class="sc-svg">
      <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border-color)" stroke-width="0.5" />
      <line x1="50" y1="10" x2="50" y2="90" stroke="var(--border-color)" stroke-width="0.3" />
      <line x1="10" y1="50" x2="90" y2="50" stroke="var(--border-color)" stroke-width="0.3" />
      {#each STORY_CIRCLE_STAGES as stage, i}
        {@const pos = positions[i]}
        {@const filled = getEntry(stage.stage).trim().length > 0}
        <circle
          cx={pos.x} cy={pos.y} r="4"
          fill={filled ? 'var(--interactive-accent)' : 'var(--background-secondary)'}
          stroke={filled ? 'var(--interactive-accent)' : 'var(--text-faint)'}
          stroke-width="0.5"
        />
        <text
          x={pos.x} y={pos.y - 6}
          text-anchor="middle" font-size="3" fill="var(--text-muted)"
        >{stage.label}</text>
      {/each}
    </svg>
  </div>

  <div class="sc-entries">
    {#each STORY_CIRCLE_STAGES as stage, i}
      {@const value = getEntry(stage.stage)}
      <div class="sc-entry">
        <div class="sc-entry-header">
          <span class="sc-stage-num">{i + 1}</span>
          <span class="sc-stage-name">{stage.label}</span>
        </div>
        <p class="sc-prompt">{stage.prompt}</p>
        {#if readonly}
          <p class="sc-entry-text">{value || '-'}</p>
        {:else}
          <textarea
            class="sc-entry-input"
            value={value}
            placeholder={stage.prompt}
            rows={2}
            on:input={(e) => handleInput(stage.stage, e.currentTarget.value)}
          ></textarea>
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  .story-circle { display: flex; flex-direction: column; gap: 8px; }
  .sc-header { display: flex; align-items: center; justify-content: space-between; }
  .sc-title { font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
  .sc-progress { font-size: 0.65rem; color: var(--text-faint); }
  .sc-wheel { max-width: 200px; margin: 0 auto; }
  .sc-svg { width: 100%; height: auto; }
  .sc-entries { display: flex; flex-direction: column; gap: 6px; }
  .sc-entry { padding: 6px 8px; background: var(--background-secondary); border-radius: var(--radius-s); }
  .sc-entry-header { display: flex; align-items: center; gap: 6px; margin-bottom: 2px; }
  .sc-stage-num { font-size: 0.6rem; font-weight: 700; color: var(--interactive-accent); background: var(--background-modifier-hover); width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; border-radius: 50%; }
  .sc-stage-name { font-size: 0.75rem; font-weight: 600; color: var(--text-normal); }
  .sc-prompt { margin: 0 0 4px; font-size: 0.65rem; color: var(--text-faint); font-style: italic; }
  .sc-entry-text { margin: 0; font-size: 0.75rem; color: var(--text-normal); }
  .sc-entry-input { width: 100%; font-size: 0.75rem; padding: 4px 6px; border: 1px solid var(--border-color); border-radius: var(--radius-s); background: var(--background-primary); color: var(--text-normal); resize: vertical; font-family: inherit; }
</style>
