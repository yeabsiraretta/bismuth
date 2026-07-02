<!-- Generic async component loader. Caches modules, retries on failure, records timing.
     Canonical location: components/ui/layout/AsyncLoader.svelte -->
<script lang="ts" module>
  /** Global module cache — shared across all AsyncLoader instances so
   *  switching between features (canvas → graph → canvas) never re-fetches. */
  const moduleCache = new Map<string, unknown>();
</script>

<script lang="ts">
  import Spinner from '@/components/ui/feedback/Spinner.svelte';
  import EmptyState from '@/components/ui/feedback/EmptyState.svelte';
  import { recordFeatureUse } from '@/utils/storage/featurePreload';
  import { log } from '@/utils/logger';

  import type { SvelteComponent } from 'svelte';
  import { getFeature } from '@/stores/settings/featureRegistry';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export let loader: () => Promise<{ default: any }>;
  export let featureId: string;
  export let props: Record<string, unknown> = {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let component: (new (...args: any[]) => SvelteComponent) | null = null;
  $: featureLabel = getFeature(featureId)?.label ?? featureId;
  let error = false;
  let retryCount = 0;
  const RETRY_DELAYS = [0, 500, 2000];

  function emitTiming(durationMs: number, success: boolean, errorMsg?: string): void {
    import('@/features/lazyloader')
      .then((mod) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mod.loadTimings.update((prev: any[]) => [
          ...prev,
          {
            featureId,
            durationMs,
            loadedAt: new Date().toISOString(),
            trigger: 'demand',
            success,
            error: errorMsg,
          },
        ]);
      })
      .catch(() => {});
  }

  function loadFeature(): void {
    if (moduleCache.has(featureId)) {
      component = moduleCache.get(featureId) as typeof component;
      return;
    }
    error = false;
    component = null;
    const start = performance.now();

    loader()
      .then((mod) => {
        const durationMs = Math.round(performance.now() - start);
        moduleCache.set(featureId, mod.default);
        component = mod.default as typeof component;
        retryCount = 0;
        recordFeatureUse(featureId);
        emitTiming(durationMs, true);
        log.interaction('ui', 'feature-load', { featureId, durationMs });
      })
      .catch((e) => {
        const durationMs = Math.round(performance.now() - start);
        log.error(`Failed to load feature: ${featureId}`, e);
        log.interaction('ui', 'feature-load-error', { featureId, durationMs, error: String(e) });
        emitTiming(durationMs, false, String(e));
        error = true;
      });
  }

  function retry(): void {
    if (retryCount >= RETRY_DELAYS.length) return;
    const delay = RETRY_DELAYS[retryCount];
    retryCount++;
    setTimeout(loadFeature, delay);
  }

  $: (loader, loadFeature());
</script>

{#if error}
  <EmptyState
    icon="alert-circle"
    title="Failed to load {featureId}"
    description="An error occurred loading this feature."
    actionLabel={retryCount < RETRY_DELAYS.length ? 'Retry' : 'Max retries reached'}
    on:click={retry}
  />
{:else if component}
  <svelte:component this={component ?? undefined} {...props} />
{:else}
  <div class="loading-feature">
    <Spinner size="sm" label="Loading {featureLabel}..." />
    <span class="loading-label">Loading {featureLabel}...</span>
  </div>
{/if}

<style>
  .loading-feature {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    flex: 1;
    min-height: 80px;
    opacity: 0;
    animation: fade-in 0.3s ease 0.15s forwards;
  }

  .loading-label {
    font-size: var(--font-size-xs, 11px);
    color: var(--text-muted);
  }

  @keyframes fade-in {
    to {
      opacity: 1;
    }
  }
</style>
