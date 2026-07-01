import { setToken, resetToken, resetAll, styleOverrides, isValidColor } from '@/stores/style/style';
import { get } from 'svelte/store';

export interface TokenDef {
  key: string;
  label: string;
  category: 'background' | 'text' | 'accent' | 'border' | 'typography' | 'spacing' | 'effects';
  type: 'color' | 'size' | 'font' | 'number';
  defaultValue?: string;
}

export const COLOR_TOKENS: TokenDef[] = [
  {
    key: '--background-primary',
    label: 'Background Primary',
    category: 'background',
    type: 'color',
  },
  {
    key: '--background-secondary',
    label: 'Background Secondary',
    category: 'background',
    type: 'color',
  },
  {
    key: '--background-modifier-hover',
    label: 'Hover Background',
    category: 'background',
    type: 'color',
  },
  { key: '--text-normal', label: 'Text Normal', category: 'text', type: 'color' },
  { key: '--text-muted', label: 'Text Muted', category: 'text', type: 'color' },
  { key: '--text-faint', label: 'Text Faint', category: 'text', type: 'color' },
  { key: '--text-on-accent', label: 'Text on Accent', category: 'text', type: 'color' },
  { key: '--interactive-accent', label: 'Accent', category: 'accent', type: 'color' },
  { key: '--interactive-accent-hover', label: 'Accent Hover', category: 'accent', type: 'color' },
  { key: '--border-color', label: 'Border', category: 'border', type: 'color' },
];

export const TYPOGRAPHY_TOKENS: TokenDef[] = [
  {
    key: '--font-text',
    label: 'Text Font',
    category: 'typography',
    type: 'font',
    defaultValue: 'Inter',
  },
  {
    key: '--font-mono',
    label: 'Monospace Font',
    category: 'typography',
    type: 'font',
    defaultValue: 'JetBrains Mono',
  },
  {
    key: '--font-ui-small',
    label: 'UI Small',
    category: 'typography',
    type: 'size',
    defaultValue: '12px',
  },
  {
    key: '--font-ui-medium',
    label: 'UI Medium',
    category: 'typography',
    type: 'size',
    defaultValue: '14px',
  },
  {
    key: '--font-ui-large',
    label: 'UI Large',
    category: 'typography',
    type: 'size',
    defaultValue: '16px',
  },
];

export const SPACING_TOKENS: TokenDef[] = [
  {
    key: '--spacing-xs',
    label: 'Extra Small',
    category: 'spacing',
    type: 'size',
    defaultValue: '4px',
  },
  { key: '--spacing-s', label: 'Small', category: 'spacing', type: 'size', defaultValue: '8px' },
  { key: '--spacing-m', label: 'Medium', category: 'spacing', type: 'size', defaultValue: '12px' },
  { key: '--spacing-l', label: 'Large', category: 'spacing', type: 'size', defaultValue: '16px' },
  {
    key: '--spacing-xl',
    label: 'Extra Large',
    category: 'spacing',
    type: 'size',
    defaultValue: '24px',
  },
  {
    key: '--radius-s',
    label: 'Radius Small',
    category: 'spacing',
    type: 'size',
    defaultValue: '4px',
  },
  {
    key: '--radius-m',
    label: 'Radius Medium',
    category: 'spacing',
    type: 'size',
    defaultValue: '8px',
  },
];

/** Get the current computed value of a CSS variable from :root */
export function getComputedToken(key: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(key).trim();
}

/** Get the override value if set, else the computed default */
export function getTokenValue(key: string): string {
  const overrides = get(styleOverrides);
  return overrides.tokens[key] || getComputedToken(key);
}

/** Check if a token is currently overridden */
export function isOverridden(key: string): boolean {
  const overrides = get(styleOverrides);
  return key in overrides.tokens;
}

export { setToken, resetToken, resetAll, isValidColor };
