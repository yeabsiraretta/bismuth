import { writable } from 'svelte/store';

export type ThemeMode = 'light' | 'dark' | 'auto';

export interface Theme {
  name: string;
  mode: ThemeMode;
  cssVariables: Record<string, string>;
}

export interface ThemeState {
  currentTheme: string;
  mode: ThemeMode;
  availableThemes: Theme[];
}

const defaultLightTheme: Theme = {
  name: 'default-light',
  mode: 'light',
  cssVariables: {
    '--background-primary': '#ffffff',
    '--background-secondary': '#f5f5f5',
    '--background-modifier-border': '#e0e0e0',
    '--background-modifier-form-field': '#fafafa',
    '--background-modifier-form-field-highlighted': '#f0f0f0',
    '--background-modifier-error': '#ffe0e0',
    '--background-modifier-cover': 'rgba(0, 0, 0, 0.4)',
    '--text-normal': '#1a1a1a',
    '--text-muted': '#666666',
    '--text-faint': '#999999',
    '--text-on-accent': '#ffffff',
    '--text-error': '#d32f2f',
    '--interactive-accent': '#6366f1',
    '--interactive-accent-hover': '#4f46e5',
    '--interactive-hover': '#e8e8e8',
    '--border-color': '#d0d0d0',
    '--shadow-s': '0 1px 2px rgba(0, 0, 0, 0.05)',
    '--shadow-m': '0 2px 8px rgba(0, 0, 0, 0.1)',
    '--shadow-l': '0 4px 12px rgba(0, 0, 0, 0.15)',
    '--shadow-xl': '0 8px 24px rgba(0, 0, 0, 0.2)',
  },
};

const defaultDarkTheme: Theme = {
  name: 'default-dark',
  mode: 'dark',
  cssVariables: {
    '--background-primary': '#1e1e1e',
    '--background-secondary': '#252525',
    '--background-modifier-border': '#3a3a3a',
    '--background-modifier-form-field': '#2a2a2a',
    '--background-modifier-form-field-highlighted': '#333333',
    '--background-modifier-error': '#4a2020',
    '--background-modifier-cover': 'rgba(0, 0, 0, 0.6)',
    '--text-normal': '#e0e0e0',
    '--text-muted': '#a0a0a0',
    '--text-faint': '#707070',
    '--text-on-accent': '#ffffff',
    '--text-error': '#f44336',
    '--interactive-accent': '#6366f1',
    '--interactive-accent-hover': '#7c3aed',
    '--interactive-hover': '#2f2f2f',
    '--border-color': '#3a3a3a',
    '--shadow-s': '0 1px 2px rgba(0, 0, 0, 0.3)',
    '--shadow-m': '0 2px 8px rgba(0, 0, 0, 0.4)',
    '--shadow-l': '0 4px 12px rgba(0, 0, 0, 0.5)',
    '--shadow-xl': '0 8px 24px rgba(0, 0, 0, 0.6)',
  },
};

const initialState: ThemeState = {
  currentTheme: 'default-dark',
  mode: 'dark',
  availableThemes: [defaultLightTheme, defaultDarkTheme],
};

function createThemeStore() {
  const { subscribe, update } = writable<ThemeState>(initialState);

  return {
    subscribe,

    setTheme: (themeName: string) => {
      update(state => {
        const theme = state.availableThemes.find(t => t.name === themeName);
        if (theme) {
          applyTheme(theme);
          return {
            ...state,
            currentTheme: themeName,
            mode: theme.mode,
          };
        }
        return state;
      });
    },

    setMode: (mode: ThemeMode) => {
      update(state => {
        if (mode === 'auto') {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          const autoMode = prefersDark ? 'dark' : 'light';
          const theme = state.availableThemes.find(t => t.mode === autoMode);
          if (theme) {
            applyTheme(theme);
            return {
              ...state,
              currentTheme: theme.name,
              mode: 'auto',
            };
          }
        } else {
          const theme = state.availableThemes.find(t => t.mode === mode);
          if (theme) {
            applyTheme(theme);
            return {
              ...state,
              currentTheme: theme.name,
              mode,
            };
          }
        }
        return state;
      });
    },

    addTheme: (theme: Theme) => {
      update(state => ({
        ...state,
        availableThemes: [...state.availableThemes, theme],
      }));
    },

    removeTheme: (themeName: string) => {
      update(state => ({
        ...state,
        availableThemes: state.availableThemes.filter(t => t.name !== themeName),
      }));
    },

    loadFromLocalStorage: () => {
      const saved = localStorage.getItem('bismuth-theme-service');
      if (saved) {
        try {
          const { themeName, mode } = JSON.parse(saved);
          update(state => {
            const theme = state.availableThemes.find(t => t.name === themeName);
            if (theme) {
              applyTheme(theme);
              return {
                ...state,
                currentTheme: themeName,
                mode,
              };
            }
            return state;
          });
        } catch (e) {
          console.error('Failed to load theme from localStorage:', e);
        }
      }
    },

    saveToLocalStorage: () => {
      update(state => {
        localStorage.setItem('bismuth-theme', JSON.stringify({
          themeName: state.currentTheme,
          mode: state.mode,
        }));
        return state;
      });
    },
  };
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;

  // Apply all CSS variables
  Object.entries(theme.cssVariables).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  // Set data attribute for mode-specific styling
  root.setAttribute('data-theme', theme.mode);
}

export const themeStore = createThemeStore();

// Initialize theme on load
if (typeof window !== 'undefined') {
  themeStore.loadFromLocalStorage();

  // Listen for system theme changes — only re-apply when in auto mode
  let currentState: ThemeState = initialState;
  themeStore.subscribe(state => {
    currentState = state;
    localStorage.setItem('bismuth-theme-service', JSON.stringify({
      themeName: state.currentTheme,
      mode: state.mode,
    }));
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (currentState.mode === 'auto') {
      themeStore.setMode('auto');
    }
  });
}
