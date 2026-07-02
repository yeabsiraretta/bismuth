/**
 * Style Settings types — matches Rust StyleSetting enum from theme_service.
 * Defines all configurable CSS setting types for the Obsidian-compatible
 * style settings plugin.
 */

export interface SelectOption {
  label: string;
  value: string;
}

export interface HeadingSetting {
  type: 'heading';
  id: string;
  title: string;
  description?: string;
  level: number;
  collapsed?: boolean;
}

export interface InfoTextSetting {
  type: 'info-text';
  id: string;
  title: string;
  description?: string;
  markdown?: boolean;
}

export interface ClassToggleSetting {
  type: 'class-toggle';
  id: string;
  title: string;
  description?: string;
  default: boolean;
}

export interface ClassSelectSetting {
  type: 'class-select';
  id: string;
  title: string;
  description?: string;
  default?: string;
  allow_empty: boolean;
  options: SelectOption[];
}

export interface VariableTextSetting {
  type: 'variable-text';
  id: string;
  title: string;
  description?: string;
  default: string;
  quotes: boolean;
}

export interface VariableNumberSetting {
  type: 'variable-number';
  id: string;
  title: string;
  description?: string;
  default: number;
  format?: string;
}

export interface VariableNumberSliderSetting {
  type: 'variable-number-slider';
  id: string;
  title: string;
  description?: string;
  default: number;
  min: number;
  max: number;
  step: number;
  format?: string;
}

export interface VariableSelectSetting {
  type: 'variable-select';
  id: string;
  title: string;
  description?: string;
  default: string;
  options: SelectOption[];
}

export interface AltFormatEntry {
  id: string;
  format: string;
}

export interface VariableColorSetting {
  type: 'variable-color';
  id: string;
  title: string;
  description?: string;
  default: string;
  format?: string;
  opacity: boolean;
  'alt-format'?: AltFormatEntry[];
}

export interface VariableThemedColorSetting {
  type: 'variable-themed-color';
  id: string;
  title: string;
  description?: string;
  'default-light': string;
  'default-dark': string;
  format?: string;
  opacity: boolean;
}

export interface ColorGradientSetting {
  type: 'color-gradient';
  id: string;
  title?: string;
  from: string;
  to: string;
  step: number;
  format: string;
  pad?: number;
}

export type StyleSetting =
  | HeadingSetting
  | InfoTextSetting
  | ClassToggleSetting
  | ClassSelectSetting
  | VariableTextSetting
  | VariableNumberSetting
  | VariableNumberSliderSetting
  | VariableSelectSetting
  | VariableColorSetting
  | VariableThemedColorSetting
  | ColorGradientSetting;

export interface SettingsBlock {
  name: string;
  id: string;
  source: string;
  settings: StyleSetting[];
}

/** Current value state for a single setting */
export interface SettingValue {
  blockId: string;
  settingId: string;
  value: string | number | boolean;
}

/** Themed color value pair (light and dark) */
export interface ThemedColorValue {
  light: string;
  dark: string;
}

/** Persisted state for all CSS settings overrides */
export interface CSSSettingsState {
  values: Record<string, Record<string, string | number | boolean>>;
  classToggles: Record<string, boolean>;
  classSelects: Record<string, string>;
  themedColors: Record<string, Record<string, ThemedColorValue>>;
}
