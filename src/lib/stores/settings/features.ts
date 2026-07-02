import { writable, derived } from 'svelte/store';
import { log } from '@/utils/logger';
import { FEATURE_REGISTRY, getDefaultFlags, isCoreFeature } from './featureRegistry';

/**
 * Feature flags — keyed by the registry feature ID (which also serves
 * as the sidebar tab ID).  Core features are always forced to `true`
 * regardless of persisted state; only optional features are toggleable.
 *
 * Driven entirely by the FeatureRegistry — no duplicate lists.
 */
export type FeatureFlags = Record<string, boolean>;

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = getDefaultFlags();

const STORAGE_KEY = 'bismuth-feature-flags';

function loadFlags(): FeatureFlags {
  const defaults = getDefaultFlags();
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Record<string, boolean>;
      // Merge saved values but enforce core features as always-on
      const merged = { ...defaults, ...parsed };
      for (const f of FEATURE_REGISTRY) {
        if (f.tier === 'core') merged[f.id] = true;
      }
      return merged;
    }
  } catch (e) {
    log.warn('Failed to load feature flags from localStorage', { error: String(e) });
  }
  return defaults;
}

function persistFlags(flags: FeatureFlags): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
  } catch (e) {
    log.warn('Failed to persist feature flags to localStorage', { error: String(e) });
  }
}

function createFeatureStore() {
  const { subscribe, set, update } = writable<FeatureFlags>(loadFlags());

  return {
    subscribe,
    /** Toggle a single feature flag (no-op for core features).
     *  On enable: triggers on-demand module load with status bar indicator.
     *  On disable: triggers module unload. */
    toggle(key: string): void {
      if (isCoreFeature(key)) return;
      let enabling = false;
      update((current) => {
        enabling = !current[key];
        const next = { ...current, [key]: enabling };
        persistFlags(next);
        return next;
      });
      if (enabling) {
        import('@/features/lazyloader/stores/lazyloaderStore').then((m) =>
          m.loadFeatureOnDemand(key)
        );
      } else {
        import('@/features/lazyloader/stores/lazyloaderStore').then((m) => m.unloadFeature(key));
      }
    },
    /** Set a specific feature flag (no-op for core features) */
    setFlag(key: string, value: boolean): void {
      if (isCoreFeature(key)) return;
      update((current) => {
        const next = { ...current, [key]: value };
        persistFlags(next);
        return next;
      });
    },
    /** Check if a feature is enabled */
    isEnabled(key: string): boolean {
      if (isCoreFeature(key)) return true;
      const flags = loadFlags();
      return flags[key] ?? false;
    },
    /** Reset all flags to defaults */
    reset(): void {
      localStorage.removeItem(STORAGE_KEY);
      set(getDefaultFlags());
    },
  };
}

export const featureFlags = createFeatureStore();

/** Derived store: checks whether a sidebar tab ID is enabled.
 *  Tab IDs now match feature IDs directly — no indirection map needed. */
export const isTabEnabled = derived(featureFlags, ($flags) => {
  return (tabId: string): boolean => {
    if (isCoreFeature(tabId)) return true;
    // Unknown tabs (e.g. action buttons) default to visible
    return $flags[tabId] ?? true;
  };
});
