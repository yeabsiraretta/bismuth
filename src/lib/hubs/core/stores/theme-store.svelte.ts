import { THEME_KEY } from '@/constants/storage-keys';

export type ThemeMode = 'light' | 'dark' | 'auto';

let selectedTheme = $state<ThemeMode>('auto');
let systemPreference = $state<'light' | 'dark'>('light');

export function getActiveTheme(): 'light' | 'dark' {
  return selectedTheme === 'auto' ? systemPreference : selectedTheme;
}

export function getSelectedTheme(): ThemeMode {
  return selectedTheme;
}

export function setTheme(mode: ThemeMode) {
  selectedTheme = mode;
  applyTheme();
  persistTheme();
}

function toggleTheme() {
  const cycle: ThemeMode[] = ['light', 'auto', 'dark'];
  const idx = cycle.indexOf(selectedTheme);
  setTheme(cycle[(idx + 1) % cycle.length]);
}

function applyTheme() {
  if (typeof document === 'undefined') return;
  const active = getActiveTheme();
  document.documentElement.setAttribute('data-theme', active);
  document.documentElement.classList.toggle('dark', active === 'dark');
}

function persistTheme() {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(THEME_KEY, selectedTheme);
  }
}

let mqCleanup: (() => void) | null = null;

export function initTheme() {
  if (typeof window === 'undefined') return;

  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    systemPreference = mq.matches ? 'dark' : 'light';
    const handler = (e: MediaQueryListEvent) => {
      systemPreference = e.matches ? 'dark' : 'light';
      applyTheme();
    };
    mq.addEventListener('change', handler);
    mqCleanup = () => mq.removeEventListener('change', handler);
  }

  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'auto') {
    selectedTheme = stored;
  }

  applyTheme();
}

export function destroyTheme() {
  mqCleanup?.();
  mqCleanup = null;
}
