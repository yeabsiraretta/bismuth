export type Theme = 'light' | 'dark' | 'auto';

export interface ThemeConfig {
  current: Theme;
  systemPreference: 'light' | 'dark';
}
