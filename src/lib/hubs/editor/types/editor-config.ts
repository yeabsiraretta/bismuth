import type { EditorSettings, TypewriterSettings, VimSettings } from '@/hubs/core/types/settings';
import { DEFAULT_SETTINGS } from '@/hubs/core/types/settings';

interface EditorThemeSettings {
  fontSize: number;
  lineHeight: number;
  fontFamily: string;
  showLineNumbers: boolean;
}

export interface EditorConfig extends EditorSettings {
  fontFamily: string;
  typewriter: TypewriterSettings;
  vim: VimSettings;
  darkMode: boolean;
}

export const DEFAULT_EDITOR_CONFIG: EditorConfig = {
  ...DEFAULT_SETTINGS.editor,
  fontFamily: DEFAULT_SETTINGS.appearance.fontText,
  typewriter: DEFAULT_SETTINGS.typewriter,
  vim: DEFAULT_SETTINGS.vim,
  darkMode: true,
};
