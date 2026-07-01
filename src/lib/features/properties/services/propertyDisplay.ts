/**
 * Property display service.
 *
 * Resolves cover images, banners, icons, date formatting,
 * progress bars, property colors, tag colors, property templates,
 * and hidden property management.
 */

import type {
  CoverShape,
  ResolvedIcon,
  RelativeDate,
  ProgressConfig,
  PropertyColorMap,
} from '../types/properties';

// ─── Cover image resolution ─────────────────────────────────────────────────

/** Determine if a cover value is a URL or a local vault path. */
export function resolveCoverSrc(value: string, vaultRoot?: string): string {
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  if (vaultRoot) return `${vaultRoot}/${value.replace(/^\//, '')}`;
  return value;
}

/** Get CSS dimensions for a cover shape. */
export function getCoverDimensions(
  shape: CoverShape,
  widths: Record<CoverShape, number>,
): { width: number; height: number | 'auto'; borderRadius: string } {
  const w = widths[shape] || 120;
  switch (shape) {
    case 'circle':
      return { width: w, height: w, borderRadius: '50%' };
    case 'square':
      return { width: w, height: w, borderRadius: '8px' };
    case 'vertical':
      return { width: w, height: Math.round(w * 1.5), borderRadius: '8px' };
    case 'horizontal':
      return { width: w, height: Math.round(w * 0.6), borderRadius: '8px' };
    case 'initial':
    default:
      return { width: w, height: 'auto', borderRadius: '8px' };
  }
}

// ─── Icon resolution ────────────────────────────────────────────────────────

const LUCIDE_ICON_RE = /^[a-z][a-z0-9-]*$/;
const IMAGE_EXT_RE = /\.(png|jpe?g|gif|svg|webp|ico|bmp)$/i;

/** Resolve an icon value to its type and display value. */
export function resolveIcon(value: string): ResolvedIcon {
  if (!value) return { source: 'emoji', value: '' };
  // External or internal image link
  if (value.startsWith('http') || IMAGE_EXT_RE.test(value)) {
    return { source: 'image', value };
  }
  // Lucide icon name (lowercase kebab-case)
  if (LUCIDE_ICON_RE.test(value)) {
    return { source: 'lucide', value };
  }
  // Fallback: first character as emoji/symbol
  const firstChar = [...value][0] || '';
  return { source: 'emoji', value: firstChar };
}

// ─── Date formatting ────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTH_SHORT = MONTH_NAMES.map((m) => m.slice(0, 3));

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = DAY_NAMES.map((d) => d.slice(0, 3));
const DAY_MIN = DAY_NAMES.map((d) => d.slice(0, 2));

function pad(n: number, len = 2): string {
  return String(n).padStart(len, '0');
}

/**
 * Format a date using a moment.js-compatible format string.
 * Supports common tokens: YYYY, YY, MM, M, DD, D, HH, H, hh, h, mm, m, ss, s, A, a,
 * MMMM, MMM, dddd, ddd, dd, Do.
 */
export function formatDate(date: Date, format: string): string {
  const y = date.getFullYear();
  const mo = date.getMonth();
  const d = date.getDate();
  const dow = date.getDay();
  const h24 = date.getHours();
  const h12 = h24 % 12 || 12;
  const mi = date.getMinutes();
  const s = date.getSeconds();
  const ampm = h24 < 12 ? 'AM' : 'PM';

  // Token map — longest tokens first to avoid partial matches
  const tokens: [RegExp, string][] = [
    [/YYYY/, String(y)],
    [/YY/, String(y).slice(-2)],
    [/MMMM/, MONTH_NAMES[mo]],
    [/MMM/, MONTH_SHORT[mo]],
    [/MM/, pad(mo + 1)],
    [/M/, String(mo + 1)],
    [/Do/, `${d}${ordinal(d)}`],
    [/DD/, pad(d)],
    [/D/, String(d)],
    [/dddd/, DAY_NAMES[dow]],
    [/ddd/, DAY_SHORT[dow]],
    [/dd/, DAY_MIN[dow]],
    [/HH/, pad(h24)],
    [/H/, String(h24)],
    [/hh/, pad(h12)],
    [/h/, String(h12)],
    [/mm/, pad(mi)],
    [/m/, String(mi)],
    [/ss/, pad(s)],
    [/s/, String(s)],
    [/A/, ampm],
    [/a/, ampm.toLowerCase()],
  ];

  // Build a single regex that matches the longest token at each position
  const tokenPattern = new RegExp(
    tokens.map(([re]) => `(${re.source})`).join('|'),
    'g',
  );

  return format.replace(tokenPattern, (match) => {
    for (const [re, val] of tokens) {
      if (new RegExp(`^${re.source}$`).test(match)) return val;
    }
    return match;
  });
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

/** Classify a date as past, present, or future relative to today. */
export function getRelativeDate(date: Date): RelativeDate {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (target.getTime() < today.getTime()) return 'past';
  if (target.getTime() > today.getTime()) return 'future';
  return 'present';
}

// ─── Progress bars ──────────────────────────────────────────────────────────

export interface ProgressBarData {
  value: number;
  max: number;
  percent: number;
  label: string;
}

/** Calculate progress bar data from frontmatter. */
export function calculateProgress(
  frontmatter: Record<string, unknown>,
  config: ProgressConfig,
): ProgressBarData {
  const rawVal = frontmatter[config.property];
  const value = typeof rawVal === 'number' ? rawVal : parseFloat(String(rawVal ?? 0)) || 0;

  let max = config.max || 100;
  if (config.maxProperty) {
    const rawMax = frontmatter[config.maxProperty];
    if (rawMax != null) {
      const parsed = typeof rawMax === 'number' ? rawMax : parseFloat(String(rawMax));
      if (!isNaN(parsed) && parsed > 0) max = parsed;
    }
  }

  const clamped = Math.max(0, Math.min(value, max));
  const percent = max > 0 ? Math.round((clamped / max) * 100) : 0;
  return { value: clamped, max, percent, label: `${clamped}/${max}` };
}

// ─── Property colors ────────────────────────────────────────────────────────

/** Find the color assigned to a specific property value. */
export function getPropertyValueColor(
  colors: PropertyColorMap,
  propertyKey: string,
  value: string,
): string | null {
  const entries = colors[propertyKey];
  if (!entries) return null;
  const match = entries.find((c) => c.value === value);
  return match?.color ?? null;
}

/** Set a color for a property value (immutable update). */
export function setPropertyValueColor(
  colors: PropertyColorMap,
  propertyKey: string,
  value: string,
  color: string | null,
): PropertyColorMap {
  const updated = { ...colors };
  const existing = [...(updated[propertyKey] || [])];
  const idx = existing.findIndex((c) => c.value === value);

  if (color === null) {
    // Remove
    if (idx >= 0) existing.splice(idx, 1);
  } else if (idx >= 0) {
    existing[idx] = { value, color };
  } else {
    existing.push({ value, color });
  }

  updated[propertyKey] = existing;
  return updated;
}

// ─── Tag colors ─────────────────────────────────────────────────────────────

/** Find color for a tag. */
export function getTagColor(tagColors: Array<{ tag: string; color: string }>, tag: string): string | null {
  const clean = tag.startsWith('#') ? tag.slice(1) : tag;
  const match = tagColors.find((t) => t.tag === clean);
  return match?.color ?? null;
}

// ─── Property templates (delegated to templateHelpers.ts) ───────────────────

export { renderPropertyTemplate } from './templateHelpers';

// ─── Hidden properties ──────────────────────────────────────────────────────

/** Check if a property is hidden. */
export function isPropertyHidden(hiddenList: string[], key: string): boolean {
  return hiddenList.includes(key);
}

/** Toggle hidden state for a property (immutable). */
export function togglePropertyHidden(hiddenList: string[], key: string): string[] {
  if (hiddenList.includes(key)) return hiddenList.filter((k) => k !== key);
  return [...hiddenList, key];
}
