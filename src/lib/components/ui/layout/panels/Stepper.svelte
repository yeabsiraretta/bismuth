<script lang="ts">
  import type { StepItem } from './stepperTypes';

  export let steps: StepItem[] = [];
  export let activeStepId: string | undefined = undefined;
  export let onStepClick: ((id: string) => void) | undefined = undefined;

  function pct(item: StepItem): number {
    if (!item.decisionsTotal || item.decisionsTotal === 0) return 0;
    return Math.round(((item.decisionsComplete ?? 0) / item.decisionsTotal) * 100);
  }

  function handleClick(id: string, disabled: boolean) {
    if (disabled) return;
    onStepClick?.(id);
  }
</script>

<nav class="stepper" aria-label="Form steps">
  <ol class="stepper-list">
    {#each steps as step}
      {@const isActive = step.id === activeStepId}
      {@const isDisabled = step.state === 'disabled'}
      {@const progress = pct(step)}

      <li
        class="stepper-item"
        data-state={step.state ?? 'empty'}
        data-active={isActive}
      >
        <button
          class="stepper-step"
          aria-expanded={isActive}
          aria-disabled={isDisabled}
          disabled={isDisabled}
          on:click={() => handleClick(step.id, isDisabled)}
        >
          <span class="stepper-indicator" aria-hidden="true">
            {#if step.state === 'complete'}
              <span class="indicator-icon">&#10003;</span>
            {:else if step.decisionsTotal && step.decisionsTotal > 0}
              <span
                class="indicator-ring"
                style="background: conic-gradient(var(--interactive-accent) {progress}%, var(--border-color) 0%)"
              ></span>
            {:else}
              <span class="indicator-dot"></span>
            {/if}
          </span>
          <span class="stepper-label bismuth-body-sm">{step.label}</span>
          {#if step.decisionsTotal}
            <span class="stepper-count bismuth-caption" aria-label="{step.decisionsComplete ?? 0} of {step.decisionsTotal} complete">
              {step.decisionsComplete ?? 0}/{step.decisionsTotal}
            </span>
          {/if}
        </button>

        {#if isActive && step.subSteps?.length}
          <ul class="stepper-substeps" role="list">
            {#each step.subSteps as sub}
              <li class="stepper-substep" data-complete={sub.complete}>
                <span class="sub-indicator" aria-hidden="true">{sub.complete ? '&#10003;' : '&#9675;'}</span>
                <span class="bismuth-body-sm">{sub.label}</span>
              </li>
            {/each}
          </ul>
        {/if}
      </li>
    {/each}
  </ol>
</nav>

<style>
  .stepper { width: 100%; }
  .stepper-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 2px; }

  .stepper-item[data-active="true"] > .stepper-step {
    background: color-mix(in srgb, var(--interactive-accent) 8%, var(--background-primary));
    border-radius: var(--radius-s);
  }

  .stepper-step {
    display: flex;
    align-items: center;
    gap: var(--spacing-s, 8px);
    width: 100%;
    padding: 6px 8px;
    border: none;
    background: transparent;
    cursor: pointer;
    text-align: left;
    border-radius: var(--radius-s);
    transition: background var(--transition-fast, 150ms ease);
  }

  .stepper-step:hover:not(:disabled) { background: var(--background-modifier-hover); }
  .stepper-step:focus-visible { outline: 2px solid var(--interactive-accent); outline-offset: 2px; }
  .stepper-step:disabled { cursor: not-allowed; opacity: 0.5; }

  .stepper-indicator {
    width: 16px; height: 16px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }

  .indicator-ring {
    width: 14px; height: 14px; border-radius: 50%;
    display: block;
  }

  .indicator-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--border-color); display: block;
  }

  .indicator-icon { font-size: var(--font-ui-smaller); color: var(--interactive-success, var(--status-added)); }

  .stepper-item[data-state="complete"] .indicator-icon { color: var(--status-added); }
  .stepper-item[data-state="in-progress"] .indicator-dot { background: var(--interactive-accent); }

  .stepper-label { flex: 1; color: var(--text-normal); }
  .stepper-step:disabled .stepper-label { color: var(--text-muted); }

  .stepper-count { color: var(--text-muted); flex-shrink: 0; }

  .stepper-substeps {
    list-style: none; margin: 0; padding: 4px 0 4px 24px; display: flex; flex-direction: column; gap: 2px;
  }

  .stepper-substep {
    display: flex; align-items: center; gap: 6px;
    color: var(--text-muted); padding: 3px 0;
  }

  .stepper-substep[data-complete="true"] { color: var(--text-normal); }
  .sub-indicator { font-size: var(--font-ui-xs); width: 12px; text-align: center; }
</style>
