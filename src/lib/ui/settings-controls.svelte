<script lang="ts" module>
  /** Props for a single settings row (label + hint + control slot). */
  export interface SettingRowProps {
    label: string;
    hint?: string;
    id: string;
  }
</script>

<script lang="ts">
  /**
   * A label + control row for use inside settings panels. Provides
   * global styles for checkbox toggles, selects, inputs, sliders,
   * and colour pickers so individual settings pages stay markup-only.
   * @component
   */
  import type { Snippet } from 'svelte';

  let { label, hint = undefined, id, children }: SettingRowProps & { children: Snippet } = $props();
</script>

<div class="setting-row">
  <div class="setting-info">
    <label for={id} class="setting-label">{label}</label>
    {#if hint}
      <span class="setting-hint">{hint}</span>
    {/if}
  </div>
  <div class="setting-control">
    {@render children()}
  </div>
</div>

<style>
  .setting-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 10px 0;
    border-bottom: 1px solid oklch(from var(--color-border) l c h / 0.3);
  }
  .setting-row:last-child {
    border-bottom: none;
  }
  .setting-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }
  .setting-label {
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--color-text);
    cursor: pointer;
  }
  .setting-hint {
    font-size: 0.72rem;
    color: var(--color-text-subtle);
    line-height: 1.3;
  }
  .setting-control {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  /* ─── Toggle switch (checkbox) ─── */
  .setting-control :global(input[type='checkbox']) {
    appearance: none;
    -webkit-appearance: none;
    width: 36px;
    height: 20px;
    background: var(--color-surface-hover);
    border-radius: var(--radius-full);
    position: relative;
    cursor: pointer;
    transition: background var(--transition-fast);
    border: 1px solid var(--color-border);
    flex-shrink: 0;
    padding: 0;
    margin: 0;
  }
  .setting-control :global(input[type='checkbox'])::before {
    content: '';
    position: absolute;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--color-text-muted);
    top: 2px;
    left: 2px;
    transition:
      transform var(--transition-fast),
      background var(--transition-fast);
  }
  .setting-control :global(input[type='checkbox']:checked) {
    background: var(--color-accent);
    border-color: var(--color-accent);
  }
  .setting-control :global(input[type='checkbox']:checked)::before {
    transform: translateX(16px);
    background: var(--color-background);
  }
  .setting-control :global(input[type='checkbox']:focus-visible) {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }

  /* ─── Select dropdown ─── */
  .setting-control :global(select) {
    appearance: none;
    -webkit-appearance: none;
    padding: 6px 30px 6px 10px;
    font-size: 0.75rem;
    font-family: inherit;
    background: var(--color-surface);
    color: var(--color-text);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    cursor: pointer;
    transition: border-color var(--transition-fast);
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a6adc8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 8px center;
    min-width: 100px;
  }
  .setting-control :global(select:hover) {
    border-color: var(--color-accent);
  }
  .setting-control :global(select:focus) {
    border-color: var(--color-accent);
    outline: none;
  }
  .setting-control :global(select option) {
    background: var(--color-surface);
    color: var(--color-text);
  }

  /* ─── Text / number inputs ─── */
  .setting-control :global(input[type='text']),
  .setting-control :global(input[type='number']) {
    padding: 6px 10px;
    font-size: 0.75rem;
    font-family: inherit;
    background: var(--color-surface);
    color: var(--color-text);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    transition: border-color var(--transition-fast);
    outline: none;
  }
  .setting-control :global(input[type='text']:hover),
  .setting-control :global(input[type='number']:hover) {
    border-color: var(--color-text-subtle);
  }
  .setting-control :global(input[type='text']:focus),
  .setting-control :global(input[type='number']:focus) {
    border-color: var(--color-accent);
  }
  .setting-control :global(input[type='number']) {
    width: 72px;
    appearance: textfield;
    -moz-appearance: textfield;
  }
  .setting-control :global(input[type='number']::-webkit-inner-spin-button),
  .setting-control :global(input[type='number']::-webkit-outer-spin-button) {
    opacity: 1;
  }

  /* ─── Range slider ─── */
  .setting-control :global(input[type='range']) {
    appearance: none;
    -webkit-appearance: none;
    width: 100px;
    height: 4px;
    background: var(--color-surface-hover);
    border-radius: var(--radius-s);
    outline: none;
    cursor: pointer;
    border: none;
    padding: 0;
    margin: 0;
  }
  .setting-control :global(input[type='range']::-webkit-slider-thumb) {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    background: var(--color-accent);
    border-radius: 50%;
    cursor: pointer;
    border: 2px solid var(--color-background);
    box-shadow: 0 1px 3px oklch(0 0 0 / 0.3);
    transition: transform var(--transition-fast);
  }
  .setting-control :global(input[type='range']::-webkit-slider-thumb:hover) {
    transform: scale(1.2);
  }
  .setting-control :global(input[type='range']::-moz-range-thumb) {
    width: 14px;
    height: 14px;
    background: var(--color-accent);
    border-radius: 50%;
    cursor: pointer;
    border: 2px solid var(--color-background);
    box-shadow: 0 1px 3px oklch(0 0 0 / 0.3);
  }
  .setting-control :global(input[type='range']::-moz-range-track) {
    background: var(--color-surface-hover);
    border-radius: var(--radius-s);
    height: 4px;
  }

  /* ─── Color picker ─── */
  .setting-control :global(input[type='color']) {
    appearance: none;
    -webkit-appearance: none;
    width: 32px;
    height: 32px;
    padding: 2px;
    border: 2px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-surface);
    cursor: pointer;
    transition: border-color var(--transition-fast);
  }
  .setting-control :global(input[type='color']:hover) {
    border-color: var(--color-accent);
  }
  .setting-control :global(input[type='color']::-webkit-color-swatch-wrapper) {
    padding: 0;
  }
  .setting-control :global(input[type='color']::-webkit-color-swatch) {
    border: none;
    border-radius: var(--radius-s);
  }

  /* ─── Range + value label layout ─── */
  .setting-control :global(.flex) {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  /* ─── Value labels ─── */
  .setting-control :global(span) {
    font-size: 0.7rem;
    color: var(--color-text-muted);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    min-width: 2.5em;
    text-align: right;
  }
</style>
