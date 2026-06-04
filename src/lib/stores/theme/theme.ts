import { writable, derived } from 'svelte/store';
import type { Theme } from '@/types/theme';

const THEME_STORAGE_KEY = 'bismuth-theme';

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

function getStoredTheme(): Theme {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'auto') {
      return stored;
    }
  }
  return 'auto';
}

function createThemeStore() {
  const systemPreference = writable<'light' | 'dark'>(getSystemTheme());
  const selectedTheme = writable<Theme>(getStoredTheme());

  const activeTheme = derived(
    [selectedTheme, systemPreference],
    ([$selectedTheme, $systemPreference]) => {
      if ($selectedTheme === 'auto') {
        return $systemPreference;
      }
      return $selectedTheme;
    }
  );

  if (typeof window !== 'undefined' && window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      systemPreference.set(e.matches ? 'dark' : 'light');
    };
    mediaQuery.addEventListener('change', handleChange);
  }

  return {
    subscribe: activeTheme.subscribe,
    selectedTheme: {
      subscribe: selectedTheme.subscribe,
      set: (theme: Theme) => {
        selectedTheme.set(theme);
        if (typeof window !== 'undefined') {
          localStorage.setItem(THEME_STORAGE_KEY, theme);
        }
      },
    },
    systemPreference: {
      subscribe: systemPreference.subscribe,
    },
    setTheme: (theme: Theme) => {
      selectedTheme.set(theme);
      if (typeof window !== 'undefined') {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
      }
    },
    toggleTheme: () => {
      selectedTheme.update((current) => {
        const newTheme = current === 'dark' ? 'light' : 'dark';
        if (typeof window !== 'undefined') {
          localStorage.setItem(THEME_STORAGE_KEY, newTheme);
        }
        return newTheme;
      });
    },
  };
}

export const theme = createThemeStore();
