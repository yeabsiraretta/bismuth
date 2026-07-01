import { log } from '@/utils/logger';
import { isValidCssValue } from '@/stores/style/style';
import { formatColor } from '@/utils/style/colorFormat';
import type { ColorFormat } from '@/utils/style/colorFormat';
import type { StyleSetting, CSSSettingsState } from '@/types/style-settings';
import { cssSettingsState } from './cssSettings';

export function safeSetProperty(root: HTMLElement, name: string, value: string): void {
  if (!isValidCssValue(value)) {
    log.warn('CSS settings: unsafe value rejected', { name, value });
    return;
  }
  root.style.setProperty(name, value);
}

export function applySetting(setting: StyleSetting, value: string | number | boolean): void {
  const root = document.documentElement;
  switch (setting.type) {
    case 'class-toggle': {
      if (value) document.body.classList.add(setting.id);
      else document.body.classList.remove(setting.id);
      cssSettingsState.update(s => { s.classToggles[setting.id] = !!value; return s; });
      break;
    }
    case 'class-select': {
      for (const opt of setting.options) document.body.classList.remove(opt.value);
      if (value && value !== 'none') document.body.classList.add(String(value));
      cssSettingsState.update(s => { s.classSelects[setting.id] = String(value); return s; });
      break;
    }
    case 'variable-text': {
      safeSetProperty(root, `--${setting.id}`, setting.quotes ? `'${value}'` : String(value));
      break;
    }
    case 'variable-number':
    case 'variable-number-slider': {
      safeSetProperty(root, `--${setting.id}`, `${value}${setting.format || ''}`);
      break;
    }
    case 'variable-select': {
      safeSetProperty(root, `--${setting.id}`, String(value));
      break;
    }
    case 'variable-color': {
      const fmt = (setting.format || 'hex') as ColorFormat;
      const vars = formatColor(String(value), fmt, setting.id, setting.opacity ? 1 : undefined);
      for (const [name, val] of Object.entries(vars)) safeSetProperty(root, name, val);
      if (setting['alt-format']) {
        for (const alt of setting['alt-format']) {
          const altVars = formatColor(String(value), alt.format as ColorFormat, alt.id, setting.opacity ? 1 : undefined);
          for (const [name, val] of Object.entries(altVars)) safeSetProperty(root, name, val);
        }
      }
      break;
    }
    case 'variable-themed-color': {
      const currentTheme = root.getAttribute('data-theme') || 'light';
      const fmt = (setting.format || 'hex') as ColorFormat;
      const vars = formatColor(String(value), fmt, setting.id, setting.opacity ? 1 : undefined);
      for (const [name, val] of Object.entries(vars)) safeSetProperty(root, name, val);
      cssSettingsState.update(s => {
        if (!s.themedColors[setting.id]) {
          s.themedColors[setting.id] = { [setting.id]: { light: setting['default-light'], dark: setting['default-dark'] } };
        }
        const entry = s.themedColors[setting.id][setting.id];
        if (entry) entry[currentTheme as 'light' | 'dark'] = String(value);
        return s;
      });
      break;
    }
  }
}

export function removeSetting(setting: StyleSetting): void {
  const root = document.documentElement;
  switch (setting.type) {
    case 'class-toggle':
      document.body.classList.remove(setting.id);
      break;
    case 'class-select':
      for (const opt of setting.options) document.body.classList.remove(opt.value);
      break;
    case 'variable-text':
    case 'variable-number':
    case 'variable-number-slider':
    case 'variable-select':
      root.style.removeProperty(`--${setting.id}`);
      break;
    case 'variable-color':
    case 'variable-themed-color': {
      root.style.removeProperty(`--${setting.id}`);
      const fmt = setting.format || 'hex';
      const splits = fmt === 'rgb-split'
        ? ['-r', '-g', '-b', '-a']
        : (fmt === 'hsl-split' || fmt === 'hsl-split-decimal') ? ['-h', '-s', '-l', '-a'] : [];
      for (const s of splits) root.style.removeProperty(`--${setting.id}${s}`);
      if (setting.type === 'variable-color' && setting['alt-format']) {
        for (const alt of setting['alt-format']) {
          root.style.removeProperty(`--${alt.id}`);
          if (alt.format.includes('split')) {
            const suffixes = alt.format.startsWith('rgb') ? ['-r', '-g', '-b', '-a'] : ['-h', '-s', '-l', '-a'];
            for (const s of suffixes) root.style.removeProperty(`--${alt.id}${s}`);
          }
        }
      }
      break;
    }
  }
}

export function removeAllApplied(state: CSSSettingsState): void {
  const root = document.documentElement;
  for (const [id, active] of Object.entries(state.classToggles)) {
    if (active) document.body.classList.remove(id);
  }
  for (const value of Object.values(state.classSelects)) {
    if (value && value !== 'none') document.body.classList.remove(value);
  }
  for (const blockValues of Object.values(state.values)) {
    for (const id of Object.keys(blockValues)) root.style.removeProperty(`--${id}`);
  }
}

export function getDefaultValue(setting: StyleSetting): string | number | boolean {
  switch (setting.type) {
    case 'class-toggle': return setting.default;
    case 'class-select': return setting.default || '';
    case 'variable-themed-color': return setting['default-light'];
    default: return (setting as { default: string | number | boolean }).default ?? '';
  }
}

export function applyAllSettings(
  blocks: import('@/types/style-settings').SettingsBlock[],
  getValue: (blockId: string, setting: StyleSetting) => string | number | boolean
): void {
  for (const block of blocks) {
    for (const setting of block.settings) {
      applySetting(setting, getValue(block.id, setting));
    }
  }
}
