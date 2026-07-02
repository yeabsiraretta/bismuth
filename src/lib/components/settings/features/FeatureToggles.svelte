<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import Spinner from '@/components/ui/feedback/Spinner.svelte';
  import { featureFlags } from '@/stores/settings/features';
  import { OPTIONAL_FEATURES, FEATURE_CATEGORIES } from '@/stores/settings/featureRegistry';
  import type { FeatureDefinition } from '@/stores/settings/featureRegistry';
  import { featureLoadStates } from '@/stores/status/featureLoadStatus';
  import type { FeatureLoadState } from '@/stores/status/featureLoadStatus';
  import { recordFeatureUse } from '@/utils/storage/featurePreload';

  function getByCategory(cat: string): FeatureDefinition[] {
    return OPTIONAL_FEATURES.filter((f) => f.category === cat);
  }

  function getLoadState(id: string): FeatureLoadState {
    return $featureLoadStates[id]?.state ?? 'idle';
  }

  function handleToggle(id: string): void {
    const wasOff = !$featureFlags[id];
    featureFlags.toggle(id);
    if (wasOff) recordFeatureUse(id);
  }

  function handleDelete(id: string): void {
    if ($featureFlags[id]) featureFlags.toggle(id);
    import('@/features/lazyloader/stores/lazyloaderStore').then((m) => m.unloadFeature(id));
  }

  function resetAll(): void {
    featureFlags.reset();
  }
</script>

<div class="settings-section stack stack-md">
  <div class="section-header">
    <h3>Feature Toggles</h3>
    <p class="setting-hint">
      Enable or disable optional features and sidebar panels. Core features (File Tree, Search,
      Recent, Outline, Properties) are always enabled.
    </p>
  </div>

  {#each FEATURE_CATEGORIES as category}
    {@const items = getByCategory(category.id)}
    {#if items.length > 0}
      <div class="setting-group">
        <h4>{category.label}</h4>
        <div class="feature-list">
          {#each items as feature (feature.id)}
            {@const loadState = getLoadState(feature.id)}
            <div
              class="feature-item"
              class:feature-loading={loadState === 'loading'}
              class:feature-error={loadState === 'error'}
            >
              <div class="feature-info">
                <span class="feature-icon"><Icon name={feature.icon} size={16} /></span>
                <div class="feature-text">
                  <span class="feature-label">{feature.label}</span>
                  <span class="feature-description">{feature.description}</span>
                </div>
              </div>
              <div class="feature-actions">
                {#if loadState === 'loading'}
                  <span class="feature-badge loading"><Spinner size="sm" /></span>
                {:else if loadState === 'loaded'}
                  <button
                    class="feature-delete"
                    title="Unload module"
                    on:click={() => handleDelete(feature.id)}
                  >
                    <Icon name="trash-2" size={12} />
                  </button>
                {:else if loadState === 'error'}
                  <span class="feature-badge error" title={$featureLoadStates[feature.id]?.error}>
                    <Icon name="alert-circle" size={12} />
                  </span>
                {/if}
                <label class="toggle-switch">
                  <input
                    type="checkbox"
                    checked={$featureFlags[feature.id]}
                    disabled={loadState === 'loading'}
                    on:change={() => handleToggle(feature.id)}
                  />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  {/each}

  <div class="setting-group">
    <button class="btn btn-secondary" on:click={resetAll}> Reset to Defaults </button>
  </div>
</div>

<style>
  .section-header {
    margin-bottom: var(--spacing-sm);
  }

  .feature-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .feature-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--radius-sm);
    transition:
      background-color 0.15s ease,
      border-color 0.15s ease;
    border: 1px solid transparent;
  }

  .feature-item:hover {
    background-color: var(--background-modifier-hover);
  }

  .feature-item.feature-loading {
    border-color: var(--interactive-accent, #6366f1);
    background-color: color-mix(in srgb, var(--interactive-accent, #6366f1) 5%, transparent);
  }

  .feature-item.feature-error {
    border-color: var(--text-error, #dc2626);
    background-color: color-mix(in srgb, var(--text-error, #dc2626) 5%, transparent);
  }

  .feature-info {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    min-width: 0;
    flex: 1;
  }

  .feature-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--text-muted, #6b7280) 10%, transparent);
    flex-shrink: 0;
    color: var(--text-muted);
  }

  .feature-item:hover .feature-icon {
    color: var(--interactive-accent, #6366f1);
    background: color-mix(in srgb, var(--interactive-accent, #6366f1) 12%, transparent);
  }

  .feature-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .feature-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
  }

  .feature-badge.error {
    color: var(--text-error, #dc2626);
  }

  .feature-delete {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    padding: 0;
    background: none;
    border: none;
    border-radius: var(--radius-sm);
    color: var(--text-muted);
    cursor: pointer;
    opacity: 0;
    transition:
      opacity 0.15s ease,
      color 0.15s ease,
      background-color 0.15s ease;
  }

  .feature-item:hover .feature-delete {
    opacity: 1;
  }

  .feature-delete:hover {
    color: var(--text-error, #dc2626);
    background-color: color-mix(in srgb, var(--text-error, #dc2626) 10%, transparent);
  }

  .feature-text {
    display: flex;
    flex-direction: column;
  }

  .feature-label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-medium);
    color: var(--text-primary);
  }

  .feature-description {
    font-size: var(--font-size-xs);
    color: var(--text-muted);
  }

  .toggle-switch {
    position: relative;
    display: inline-block;
    width: 36px;
    height: 20px;
    cursor: pointer;
  }

  .toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .toggle-slider {
    position: absolute;
    inset: 0;
    background-color: var(--border-color, #4b5563);
    border-radius: 10px;
    transition: background-color 0.2s ease;
  }

  .toggle-slider::before {
    content: '';
    position: absolute;
    height: 16px;
    width: 16px;
    left: 2px;
    bottom: 2px;
    background-color: var(--background-primary, #fff);
    border-radius: 50%;
    transition:
      transform 0.2s ease,
      background-color 0.2s ease;
  }

  .toggle-switch input:checked + .toggle-slider {
    background-color: var(--interactive-accent, #dc2626);
  }

  .toggle-switch input:checked + .toggle-slider::before {
    transform: translateX(16px);
    background-color: var(--text-on-accent, #fff);
  }

  .toggle-switch input:disabled + .toggle-slider {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .toggle-switch:has(input:disabled) {
    cursor: not-allowed;
  }
</style>
