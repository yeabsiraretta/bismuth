import { writable, derived } from 'svelte/store';
import type { Theme } from '@/types/layout';
import { createPersistedStore } from '@/utils/storage';

const THEME_STORAGE_KEY = 'bismuth-theme';

function isValidTheme(v: unknown): v is Theme {
  return v === 'light' || v === 'dark' || v === 'auto';
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

function createThemeStore() {
  const systemPreference = writable<'light' | 'dark'>(getSystemTheme());

  const selectedTheme = createPersistedStore<Theme>(THEME_STORAGE_KEY, 'auto', {
    serialize: (v) => v,
    deserialize: (raw) => (isValidTheme(raw) ? raw : 'auto'),
  });

  const activeTheme = derived(
    [selectedTheme, systemPreference],
    ([$selectedTheme, $systemPreference]) =>
      $selectedTheme === 'auto' ? $systemPreference : $selectedTheme
  );

  if (typeof window !== 'undefined' && window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e: MediaQueryListEvent) => {
      systemPreference.set(e.matches ? 'dark' : 'light');
    });
  }

  return {
    subscribe: activeTheme.subscribe,
    selectedTheme: {
      subscribe: selectedTheme.subscribe,
      set: (t: Theme) => selectedTheme.set(t),
    },
    systemPreference: { subscribe: systemPreference.subscribe },
    setTheme: (t: Theme) => selectedTheme.set(t),
    toggleTheme: () => {
      selectedTheme.update((current) => {
        const cycle: Theme[] = ['light', 'auto', 'dark'];
        const idx = cycle.indexOf(current);
        return cycle[(idx + 1) % cycle.length];
      });
    },
  };
}

export const theme = createThemeStore();
