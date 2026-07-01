<script lang="ts">
  import { afterUpdate } from 'svelte';
  import Popover from '@/components/ui/overlays/Popover.svelte';
  import type { SelectOptions, SelectOption } from './multiSelectTypes';
  import { isGrouped } from './multiSelectTypes';

  export let options: SelectOptions = [];
  export let value: string[] = [];
  export let onChange: (values: string[]) => void;
  export let label: string;
  export let placeholder: string = 'Select options';
  export let helperText: string | undefined = undefined;
  export let error: string | undefined = undefined;
  export let disabled: boolean = false;
  export let size: 'medium' | 'small' = 'medium';

  let open = false;
  let triggerEl: HTMLElement;
  let overflowCount = 0;
  const pillId = `ms-${Math.random().toString(36).slice(2)}`;

  $: selectedLabels = value.map(v => {
    const all = isGrouped(options)
      ? options.flatMap(g => g.options)
      : (options as SelectOption[]);
    return all.find(o => o.value === v)?.label ?? v;
  });

  function toggle(v: string) {
    const next = value.includes(v) ? value.filter(x => x !== v) : [...value, v];
    onChange(next);
  }

  function removeOne(v: string) {
    onChange(value.filter(x => x !== v));
  }

  function clearAll() {
    onChange([]);
  }

  afterUpdate(() => {
    if (!triggerEl) return;
    const pills = triggerEl.querySelectorAll<HTMLElement>('.ms-pill');
    const containerW = triggerEl.getBoundingClientRect().width - 80;
    let used = 0;
    let hidden = 0;
    pills.forEach(p => {
      const w = p.getBoundingClientRect().width;
      if (used + w > containerW) { hidden++; } else { used += w; }
    });
    overflowCount = hidden;
  });
</script>

<div class="multi-select" class:ms-disabled={disabled}>
  <div class="ms-label-row">
    <label class="ms-label" for={pillId}>{label}</label>
    {#if value.length > 0}
      <button class="ms-clear" on:click={clearAll} aria-label="Clear all selections">Clear</button>
    {/if}
  </div>

  <div
    id={pillId}
    class="ms-trigger ms-{size}"
    class:ms-error={!!error}
    role="button"
    tabindex={disabled ? -1 : 0}
    aria-haspopup="listbox"
    aria-expanded={open}
    aria-label="{label}, {value.length} selected"
    bind:this={triggerEl}
    on:click={() => { if (!disabled) open = !open; }}
    on:keydown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!disabled) open = !open; } }}
  >
    {#if value.length === 0}
      <span class="ms-placeholder">{placeholder}</span>
    {:else}
      {#each selectedLabels.slice(0, selectedLabels.length - overflowCount) as lbl, i}
        <span class="ms-pill">
          {lbl}
          <button
            class="ms-pill-remove"
            on:click|stopPropagation={() => removeOne(value[i])}
            aria-label="Remove {lbl}"
          >&times;</button>
        </span>
      {/each}
      {#if overflowCount > 0}
        <span class="ms-overflow">+{overflowCount} more</span>
      {/if}
    {/if}
    <span class="ms-chevron" aria-hidden="true">&#8964;</span>
  </div>

  {#if open}
    <div class="ms-popover-wrapper">
      <Popover onDismiss={() => { open = false; }}>
        <ul class="ms-list" role="listbox" aria-multiselectable="true" aria-label={label}>
          {#if isGrouped(options)}
            {#each options as group}
              <li role="group" aria-label={group.label}>
                <span class="ms-group-label">{group.label}</span>
                <ul>
                  {#each group.options as opt}
                    <li
                      class="ms-option"
                      role="option"
                      aria-selected={value.includes(opt.value)}
                      on:click={() => toggle(opt.value)}
                      on:keydown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(opt.value); } }}
                      tabindex="0"
                    >
                      <span class="ms-check" aria-hidden="true">{value.includes(opt.value) ? '&#10003;' : ''}</span>
                      {opt.label}
                    </li>
                  {/each}
                </ul>
              </li>
            {/each}
          {:else}
            {#each (options as SelectOption[]) as opt}
              <li
                class="ms-option"
                role="option"
                aria-selected={value.includes(opt.value)}
                on:click={() => toggle(opt.value)}
                on:keydown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(opt.value); } }}
                tabindex="0"
              >
                <span class="ms-check" aria-hidden="true">{value.includes(opt.value) ? '&#10003;' : ''}</span>
                {opt.label}
              </li>
            {/each}
          {/if}
        </ul>
      </Popover>
    </div>
  {/if}

  {#if error}
    <p class="ms-error-msg" role="alert">{error}</p>
  {:else if helperText}
    <p class="ms-helper">{helperText}</p>
  {/if}
</div>

<style>
  .multi-select { display: flex; flex-direction: column; gap: 4px; }
  .ms-disabled { opacity: 0.5; pointer-events: none; }

  .ms-label-row { display: flex; justify-content: space-between; align-items: center; }
  .ms-label { font-size: var(--font-ui-small); font-weight: var(--font-medium); color: var(--text-normal); }
  .ms-clear { background: none; border: none; color: var(--interactive-accent); font-size: var(--font-ui-small); cursor: pointer; padding: 0; }

  .ms-trigger {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px;
    padding: 6px 10px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    background: var(--background-primary);
    cursor: pointer;
    min-height: var(--ms-height);
    position: relative;
    overflow: hidden;
  }

  .ms-medium { --ms-height: 48px; }
  .ms-small  { --ms-height: 36px; }

  .ms-trigger:focus-visible { outline: 2px solid var(--interactive-accent); outline-offset: 2px; }
  .ms-trigger.ms-error { border-color: var(--text-error); }

  .ms-placeholder { color: var(--text-muted); font-size: var(--font-ui-small); }
  .ms-chevron { margin-left: auto; color: var(--text-muted); flex-shrink: 0; }

  .ms-pill {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 2px 8px;
    background: var(--background-modifier-hover);
    border-radius: var(--radius-full, 9999px);
    font-size: var(--font-ui-smaller);
    white-space: nowrap;
  }

  .ms-pill-remove {
    background: none; border: none; cursor: pointer;
    color: var(--text-muted); padding: 0; font-size: var(--font-ui-smaller); line-height: 1;
    min-width: 16px; min-height: 16px;
    display: inline-flex; align-items: center; justify-content: center;
  }

  .ms-overflow {
    font-size: var(--font-ui-smaller);
    color: var(--text-muted);
    white-space: nowrap;
  }

  .ms-popover-wrapper { position: relative; }

  .ms-list, .ms-list ul { list-style: none; margin: 0; padding: 4px 0; }
  .ms-group-label { display: block; padding: 4px 12px 2px; font-size: var(--font-ui-badge); font-weight: var(--font-semibold); color: var(--text-muted); text-transform: uppercase; }
  .ms-option {
    display: flex; align-items: center; gap: 8px;
    padding: 6px 12px; cursor: pointer; font-size: var(--font-ui-small);
    color: var(--text-normal);
  }
  .ms-option:hover, .ms-option:focus { background: var(--background-modifier-hover); outline: none; }
  .ms-option[aria-selected="true"] { color: var(--interactive-accent); }
  .ms-check { width: 14px; text-align: center; font-size: var(--font-ui-smaller); }

  .ms-error-msg { color: var(--text-error); font-size: var(--font-ui-small); margin: 0; }
  .ms-helper { color: var(--text-muted); font-size: var(--font-ui-small); margin: 0; }
</style>
