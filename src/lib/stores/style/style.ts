import { writable, get } from 'svelte/store';
import { log } from '@/utils/logger';

const STORAGE_KEY = 'bismuth-style-overrides';

/** Regex patterns for unsafe CSS values */
const UNSAFE_PATTERNS = [
  /url\s*\(/i,
  /expression\s*\(/i,
  /@import/i,
  /javascript:/i,
];

/** Validates a CSS value is safe (no url(), expression(), etc.) */
function isValidCssValue(value: string): boolean {
  return !UNSAFE_PATTERNS.some(p => p.test(value));
}

/** Validates a color is hex, hsl, or rgb format */
function isValidColor(value: string): boolean {
  const colorPatterns = [
    /^#[0-9a-f]{3,8}$/i,
    /^rgb(a)?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+\s*)?\)$/,
    /^hsl(a)?\(\s*\d+\s*,\s*\d+%?\s*,\s*\d+%?\s*(,\s*[\d.]+\s*)?\)$/,
    /^var\(--[a-zA-Z0-9-]+\)$/,
    /^transparent$/i,
    /^inherit$/i,
  ];
  return colorPatterns.some(p => p.test(value.trim()));
}

export interface StyleOverrides {
  tokens: Record<string, string>;
}

function loadOverrides(): StyleOverrides {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) { log.warn('Failed to load style overrides from localStorage', { error: String(e) }); }
  return { tokens: {} };
}

function persistOverrides(overrides: StyleOverrides): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch (e) { log.warn('Failed to persist style overrides to localStorage', { error: String(e) }); }
}

function applyToDocument(tokens: Record<string, string>): void {
  const root = document.documentElement;
  for (const [name, value] of Object.entries(tokens)) {
    if (isValidCssValue(value)) {
      root.style.setProperty(name, value);
    }
  }
}

function removeFromDocument(names: string[]): void {
  const root = document.documentElement;
  for (const name of names) {
    root.style.removeProperty(name);
  }
}

/** Style overrides store */
export const styleOverrides = writable<StyleOverrides>(loadOverrides());

/** Set a single CSS variable token override */
export function setToken(name: string, value: string): void {
  if (!name.startsWith('--')) {
    name = `--${name}`;
  }
  if (!isValidCssValue(value)) {
    log.warn('Unsafe CSS value rejected', { value });
    return;
  }
  styleOverrides.update(s => {
    s.tokens[name] = value;
    return s;
  });
}

/** Reset a single token to default */
export function resetToken(name: string): void {
  if (!name.startsWith('--')) {
    name = `--${name}`;
  }
  styleOverrides.update(s => {
    delete s.tokens[name];
    return s;
  });
  removeFromDocument([name]);
}

/** Reset all overrides */
export function resetAll(): void {
  const current = get(styleOverrides);
  removeFromDocument(Object.keys(current.tokens));
  styleOverrides.set({ tokens: {} });
}

/** Export current overrides as a JSON preset string */
export function exportPreset(): string {
  const current = get(styleOverrides);
  return JSON.stringify(current, null, 2);
}

/** Import a preset from JSON */
export function importPreset(json: string): boolean {
  try {
    const parsed = JSON.parse(json) as StyleOverrides;
    if (!parsed.tokens || typeof parsed.tokens !== 'object') return false;
    // Validate all values
    for (const value of Object.values(parsed.tokens)) {
      if (!isValidCssValue(value)) return false;
    }
    styleOverrides.set(parsed);
    return true;
  } catch {
    return false;
  }
}

/** Validate a color value */
export { isValidColor, isValidCssValue };

// Persist and apply on every change
styleOverrides.subscribe(overrides => {
  persistOverrides(overrides);
  applyToDocument(overrides.tokens);
});
