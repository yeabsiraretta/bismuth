<script lang="ts">
  import type { CanvasElement } from '@/features/canvas/types/elements';
  import type { FeatureCardData } from '@/features/canvas/types/elements';
  import { log } from '@/utils/logger';

  export let element: CanvasElement;
  export let onSelect: ((detail: { id: string }) => void) | undefined = undefined;
  export let onViewSpec: ((detail: { specPath: string }) => void) | undefined = undefined;

  $: data = element.properties.featureCardData as FeatureCardData | undefined;
  $: title = data?.title ?? 'Untitled';
  $: status = data?.status ?? 'idea';
  $: priority = data?.priority ?? 3;
  $: owner = data?.owner ?? '';
  $: milestone = data?.milestone ?? '';
  $: specPath = data?.specPath ?? '';

  const STATUS_LABELS: Record<string, string> = {
    idea: 'Idea',
    planned: 'Planned',
    'in-progress': 'In Progress',
    done: 'Done',
    deferred: 'Deferred',
  };

  const STATUS_CLASS: Record<string, string> = {
    idea: 'status--idea',
    planned: 'status--planned',
    'in-progress': 'status--in-progress',
    done: 'status--done',
    deferred: 'status--deferred',
  };

  function handleClick() {
    onSelect?.({ id: element.id });
    log.debug('FeatureCard selected', { id: element.id, title });
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }

  function handleViewSpec() {
    if (!specPath) return;
    log.info('FeatureCard: view spec requested', { specPath });
    onViewSpec?.({ specPath });
  }

  $: priorityDots = Array.from({ length: 5 }, (_, i) => i < priority);
</script>

<div
  class="feature-card"
  style="
    left: {element.x}px;
    top: {element.y}px;
    width: {element.width}px;
    min-height: {Math.max(element.height, 40)}px;
  "
  role="button"
  tabindex="0"
  aria-label="Feature card: {title}"
  on:click={handleClick}
  on:keydown={handleKeyDown}
>
  <div class="card-header">
    <span class="card-title">{title}</span>
    <span class="status-badge {STATUS_CLASS[status] ?? 'status--idea'}">
      {STATUS_LABELS[status] ?? status}
    </span>
  </div>

  <div class="card-meta">
    <div class="priority-row" aria-label="Priority {priority} of 5">
      {#each priorityDots as filled, i (i)}
        <span class="priority-dot {filled ? 'priority-dot--filled' : ''}"></span>
      {/each}
    </div>

    {#if owner}
      <span class="owner-chip" title="Owner: {owner}">
        {owner.slice(0, 2).toUpperCase()}
      </span>
    {/if}
  </div>

  {#if milestone}
    <div class="milestone-label">{milestone}</div>
  {/if}

  {#if specPath}
    <button
      class="view-spec-btn"
      on:click|stopPropagation={handleViewSpec}
      aria-label="View spec for {title}"
    >
      View Spec
    </button>
  {/if}
</div>

<style>
  .feature-card {
    position: absolute;
    background: var(--background-primary, #fff);
    border: 2px solid var(--border-color, #e4e4e7);
    border-radius: 8px;
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    cursor: pointer;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.07);
    transition: box-shadow 0.15s ease;
    box-sizing: border-box;
    user-select: none;
  }

  .feature-card:hover {
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.12);
  }

  .feature-card:focus-visible {
    outline: 2px solid var(--interactive-accent, #dc2626);
    outline-offset: 2px;
  }

  .card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
  }

  .card-title {
    font-size: var(--font-ui-small, 12px);
    font-weight: 600;
    color: var(--text-primary, #18181b);
    line-height: 1.3;
    flex: 1;
    word-break: break-word;
  }

  .status-badge {
    font-size: 10px;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 4px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .status--idea {
    color: var(--text-muted, #71717a);
    background: var(--background-secondary, #f4f4f5);
  }
  .status--planned {
    color: var(--color-info, #3b82f6);
    background: rgba(59, 130, 246, 0.1);
  }
  .status--in-progress {
    color: var(--interactive-accent, #dc2626);
    background: rgba(220, 38, 38, 0.1);
  }
  .status--done {
    color: var(--color-success, #16a34a);
    background: rgba(22, 163, 74, 0.1);
  }
  .status--deferred {
    color: var(--color-warning, #d97706);
    background: rgba(217, 119, 6, 0.1);
  }

  .card-meta {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .priority-row {
    display: flex;
    align-items: center;
    gap: 3px;
  }

  .priority-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--background-secondary, #f4f4f5);
    border: 1px solid var(--border-color, #e4e4e7);
  }

  .priority-dot--filled {
    background: var(--interactive-accent, #dc2626);
    border-color: var(--interactive-accent, #dc2626);
  }

  .owner-chip {
    font-size: 9px;
    font-weight: 700;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--interactive-accent, #dc2626);
    color: #fff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .milestone-label {
    font-size: 10px;
    color: var(--text-muted, #71717a);
    border-left: 2px solid var(--border-color, #e4e4e7);
    padding-left: 6px;
  }

  .view-spec-btn {
    font-size: 10px;
    padding: 3px 8px;
    border-radius: 4px;
    border: 1px solid var(--interactive-accent, #dc2626);
    background: none;
    color: var(--interactive-accent, #dc2626);
    cursor: pointer;
    align-self: flex-start;
    line-height: 1.4;
  }

  .view-spec-btn:hover {
    background: var(--interactive-accent, #dc2626);
    color: #fff;
  }
</style>
