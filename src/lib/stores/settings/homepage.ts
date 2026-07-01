import { createPersistedStore } from '@/utils/storage';

export type HomepageOption = 'last-opened' | 'home' | 'graph' | 'random' | 'specific' | 'daily';

export interface HomepageConfig {
  option: HomepageOption;
  specificNotePath?: string;
}

const DEFAULT_CONFIG: HomepageConfig = {
  option: 'last-opened',
  specificNotePath: undefined,
};

const STORAGE_KEY = 'bismuth-homepage';

const _store = createPersistedStore<HomepageConfig>(STORAGE_KEY, DEFAULT_CONFIG, {
  migrate: (raw) => {
    const r = raw as Partial<HomepageConfig>;
    return { ...DEFAULT_CONFIG, ...r };
  },
});

export const homepageConfig = {
  subscribe: _store.subscribe,
  setOption(option: HomepageOption): void {
    _store.update((current) => ({ ...current, option }));
  },
  setSpecificNote(path: string): void {
    _store.update((current) => ({ ...current, specificNotePath: path }));
  },
  reset(): void {
    _store.set({ ...DEFAULT_CONFIG });
  },
};
