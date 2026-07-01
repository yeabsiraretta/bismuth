/**
 * Design token swatch components — color, spacing, shadow, and radius.
 * Drag these onto the canvas to reference specific design tokens visually.
 */
import type { ComponentDefinition } from '@/features/canvas/types';

const now = 0;

function colorSwatch(id: string, name: string, token: string, textColor = '#ffffff'): ComponentDefinition {
  return {
    id, name, category: 'Tokens', icon: 'droplet',
    elements: [
      { id: 'swatch', element_type: 'rectangle', x: 0, y: 0, width: 80, height: 48, rotation: 0,
        properties: { fill: token, radius: 6 },
        layer_id: 'default', z_index: 0, locked: false, visible: true, name: 'Swatch' },
      { id: 'token', element_type: 'text', x: 4, y: 30, width: 72, height: 14, rotation: 0,
        properties: { text: token, fontSize: 9, fill: textColor, textAlign: 'center', opacity: 0.7 },
        layer_id: 'default', z_index: 1, locked: false, visible: true, name: 'Token' },
    ],
    exposedProps: [{ key: 'token', label: 'Token', type: 'text', defaultValue: token }],
    width: 80, height: 68,
    tags: ['token', 'color', 'swatch', 'design'],
    isBuiltin: true, created_at: now, modified_at: now,
  };
}

function spacingSwatch(id: string, name: string, token: string, px: number): ComponentDefinition {
  return {
    id, name, category: 'Tokens', icon: 'maximize',
    elements: [
      { id: 'outer', element_type: 'rectangle', x: 0, y: 0, width: 80, height: 80, rotation: 0,
        properties: { fill: 'transparent', stroke: 'var(--border-color)', strokeWidth: 1 },
        layer_id: 'default', z_index: 0, locked: false, visible: true, name: 'Outer' },
      { id: 'inner', element_type: 'rectangle', x: px, y: px, width: 80 - px * 2, height: 80 - px * 2, rotation: 0,
        properties: { fill: 'var(--interactive-accent)', opacity: 0.15 },
        layer_id: 'default', z_index: 1, locked: false, visible: true, name: 'Inner' },
      { id: 'label', element_type: 'text', x: 0, y: 84, width: 80, height: 14, rotation: 0,
        properties: { text: `${token} · ${px}px`, fontSize: 9, fill: 'var(--text-muted)', textAlign: 'center' },
        layer_id: 'default', z_index: 2, locked: false, visible: true, name: 'Label' },
    ],
    exposedProps: [],
    width: 80, height: 100,
    tags: ['token', 'spacing', 'padding', 'margin', 'design'],
    isBuiltin: true, created_at: now, modified_at: now,
  };
}

function radiusSwatch(id: string, name: string, token: string, r: number): ComponentDefinition {
  return {
    id, name, category: 'Tokens', icon: 'square',
    elements: [
      { id: 'shape', element_type: 'rectangle', x: 8, y: 8, width: 64, height: 48, rotation: 0,
        properties: { fill: 'var(--background-secondary)', stroke: 'var(--interactive-accent)', strokeWidth: 2, radius: r },
        layer_id: 'default', z_index: 0, locked: false, visible: true, name: 'Shape' },
      { id: 'label', element_type: 'text', x: 0, y: 62, width: 80, height: 14, rotation: 0,
        properties: { text: `${token} · ${r}px`, fontSize: 9, fill: 'var(--text-muted)', textAlign: 'center' },
        layer_id: 'default', z_index: 1, locked: false, visible: true, name: 'Label' },
    ],
    exposedProps: [],
    width: 80, height: 80,
    tags: ['token', 'radius', 'corner', 'design'],
    isBuiltin: true, created_at: now, modified_at: now,
  };
}

export const TOKEN_COMPONENTS: ComponentDefinition[] = [
  // ── Color tokens ────────────────────────────────────────────────────────────
  colorSwatch('tok-accent',       'Accent',           'var(--interactive-accent)'),
  colorSwatch('tok-accent-hover', 'Accent Hover',     'var(--interactive-accent-hover)'),
  colorSwatch('tok-bg-primary',   'BG Primary',       'var(--background-primary)',     'var(--text-normal)'),
  colorSwatch('tok-bg-secondary', 'BG Secondary',     'var(--background-secondary)',   'var(--text-normal)'),
  colorSwatch('tok-bg-alt',       'BG Alt',           'var(--background-primary-alt)', 'var(--text-normal)'),
  colorSwatch('tok-bg-hover',     'BG Hover',         'var(--background-modifier-hover)', 'var(--text-normal)'),
  colorSwatch('tok-text-normal',  'Text Normal',      'var(--text-normal)',             '#ffffff'),
  colorSwatch('tok-text-muted',   'Text Muted',       'var(--text-muted)',              '#ffffff'),
  colorSwatch('tok-text-faint',   'Text Faint',       'var(--text-faint)',              '#ffffff'),
  colorSwatch('tok-text-on-acc',  'Text On Accent',   'var(--text-on-accent)'),
  colorSwatch('tok-border',       'Border',           'var(--border-color)',            'var(--text-normal)'),
  colorSwatch('tok-danger',       'Danger',           'var(--color-danger, #dc2626)'),
  colorSwatch('tok-success',      'Success',          'var(--color-success, #16a34a)'),
  colorSwatch('tok-warning',      'Warning',          'var(--color-warning, #d97706)'),
  colorSwatch('tok-info',         'Info',             'var(--color-info, #2563eb)'),

  // ── Spacing tokens ──────────────────────────────────────────────────────────
  spacingSwatch('spc-xxs',  'Spacing XXS',  '--spacing-xxs', 2),
  spacingSwatch('spc-xs',   'Spacing XS',   '--spacing-xs',  4),
  spacingSwatch('spc-s',    'Spacing S',    '--spacing-s',   8),
  spacingSwatch('spc-m',    'Spacing M',    '--spacing-m',   12),
  spacingSwatch('spc-l',    'Spacing L',    '--spacing-l',   16),
  spacingSwatch('spc-xl',   'Spacing XL',   '--spacing-xl',  24),
  spacingSwatch('spc-xxl',  'Spacing XXL',  '--spacing-xxl', 32),

  // ── Radius tokens ───────────────────────────────────────────────────────────
  radiusSwatch('rad-none', 'Radius None', '--radius-none', 0),
  radiusSwatch('rad-s',    'Radius S',    '--radius-s',    4),
  radiusSwatch('rad-m',    'Radius M',    '--radius-m',    8),
  radiusSwatch('rad-l',    'Radius L',    '--radius-l',    12),
  radiusSwatch('rad-xl',   'Radius XL',   '--radius-xl',   16),
  radiusSwatch('rad-full', 'Radius Full', '--radius-full', 999),

  // ── Typography tokens ───────────────────────────────────────────────────────
  {
    id: 'tok-typo-h1', name: 'Font Size H1', category: 'Tokens', icon: 'type',
    elements: [
      { id: 'text', element_type: 'text', x: 0, y: 0, width: 180, height: 40, rotation: 0,
        properties: { text: 'Aa — 28px / 700', fontSize: 22, fontWeight: 700, fill: 'var(--text-normal)', textAlign: 'left' },
        layer_id: 'default', z_index: 0, locked: false, visible: true, name: 'Sample' },
      { id: 'label', element_type: 'text', x: 0, y: 44, width: 180, height: 12, rotation: 0,
        properties: { text: 'H1 · --font-size-h1 · 28px', fontSize: 9, fill: 'var(--text-muted)', textAlign: 'left' },
        layer_id: 'default', z_index: 1, locked: false, visible: true, name: 'Label' },
    ],
    exposedProps: [], width: 180, height: 60,
    tags: ['token', 'typography', 'font', 'size', 'heading'],
    isBuiltin: true, created_at: now, modified_at: now,
  },
  {
    id: 'tok-typo-body', name: 'Font Size Body', category: 'Tokens', icon: 'type',
    elements: [
      { id: 'text', element_type: 'text', x: 0, y: 0, width: 180, height: 28, rotation: 0,
        properties: { text: 'Body text — 14px / 400', fontSize: 14, fontWeight: 400, fill: 'var(--text-normal)', textAlign: 'left' },
        layer_id: 'default', z_index: 0, locked: false, visible: true, name: 'Sample' },
      { id: 'label', element_type: 'text', x: 0, y: 32, width: 180, height: 12, rotation: 0,
        properties: { text: '--font-text-size · 14px · 1.6 leading', fontSize: 9, fill: 'var(--text-muted)', textAlign: 'left' },
        layer_id: 'default', z_index: 1, locked: false, visible: true, name: 'Label' },
    ],
    exposedProps: [], width: 180, height: 48,
    tags: ['token', 'typography', 'font', 'body', 'text'],
    isBuiltin: true, created_at: now, modified_at: now,
  },
  {
    id: 'tok-typo-small', name: 'Font Size Small', category: 'Tokens', icon: 'type',
    elements: [
      { id: 'text', element_type: 'text', x: 0, y: 0, width: 180, height: 20, rotation: 0,
        properties: { text: 'Small UI text — 11px / 400', fontSize: 11, fontWeight: 400, fill: 'var(--text-muted)', textAlign: 'left' },
        layer_id: 'default', z_index: 0, locked: false, visible: true, name: 'Sample' },
      { id: 'label', element_type: 'text', x: 0, y: 24, width: 180, height: 12, rotation: 0,
        properties: { text: '--font-ui-small · 11px', fontSize: 9, fill: 'var(--text-faint)', textAlign: 'left' },
        layer_id: 'default', z_index: 1, locked: false, visible: true, name: 'Label' },
    ],
    exposedProps: [], width: 180, height: 40,
    tags: ['token', 'typography', 'font', 'small', 'ui'],
    isBuiltin: true, created_at: now, modified_at: now,
  },
];
