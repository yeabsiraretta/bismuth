/**
 * Pretty Properties store.
 *
 * Manages persistent config, per-property colors, tag colors,
 * hidden properties, cover/banner/icon state, and progress bars.
 */

import { writable, derived, get } from 'svelte/store';
import { log } from '@/utils/logger';
import type {
  PrettyPropertiesConfig,
  CoverShape,
  ProgressConfig,
} from '../types/properties';
import { DEFAULT_PRETTY_PROPERTIES_CONFIG } from '../types/properties';
import {
  setPropertyValueColor,
  togglePropertyHidden,
} from '../services/propertyDisplay';

const STORAGE_KEY = 'bismuth-pretty-properties';

// ─── Config persistence ─────────────────────────────────────────────────────

function loadConfig(): PrettyPropertiesConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { ...DEFAULT_PRETTY_PROPERTIES_CONFIG };
    return { ...DEFAULT_PRETTY_PROPERTIES_CONFIG, ...JSON.parse(stored) };
  } catch {
    return { ...DEFAULT_PRETTY_PROPERTIES_CONFIG };
  }
}

function persistConfig(config: PrettyPropertiesConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    log.warn('Failed to persist Pretty Properties config');
  }
}

// ─── Stores ─────────────────────────────────────────────────────────────────

export const prettyPropertiesConfig = writable<PrettyPropertiesConfig>(loadConfig());

/** Whether hidden properties are currently revealed. */
export const revealHidden = writable(false);

// ─── Derived stores ─────────────────────────────────────────────────────────

export const isEnabled = derived(prettyPropertiesConfig, ($c) => $c.enabled);
export const hiddenProperties = derived(prettyPropertiesConfig, ($c) => $c.hiddenProperties);
export const propertyColors = derived(prettyPropertiesConfig, ($c) => $c.propertyColors);
export const tagColors = derived(prettyPropertiesConfig, ($c) => $c.tagColors);
export const progressBars = derived(prettyPropertiesConfig, ($c) => $c.progressBars);
export const templates = derived(prettyPropertiesConfig, ($c) => $c.templates);
export const coverConfig = derived(prettyPropertiesConfig, ($c) => $c.cover);
export const bannerConfig = derived(prettyPropertiesConfig, ($c) => $c.banner);
export const iconConfig = derived(prettyPropertiesConfig, ($c) => $c.icon);
export const dateFormatConfig = derived(prettyPropertiesConfig, ($c) => $c.dateFormat);
export const dateColorConfig = derived(prettyPropertiesConfig, ($c) => $c.dateColors);

// ─── Actions ────────────────────────────────────────────────────────────────

function update(fn: (c: PrettyPropertiesConfig) => PrettyPropertiesConfig): void {
  prettyPropertiesConfig.update((c) => {
    const next = fn(c);
    persistConfig(next);
    return next;
  });
}

/** Toggle the entire feature on/off. */
export function toggleEnabled(): void {
  update((c) => ({ ...c, enabled: !c.enabled }));
}

/** Update a partial config. */
export function updateConfig(partial: Partial<PrettyPropertiesConfig>): void {
  update((c) => ({ ...c, ...partial }));
}

// ── Cover ────────────────────────────────────────────────────────────────

export function setCoverShape(shape: CoverShape): void {
  update((c) => ({ ...c, cover: { ...c.cover, defaultShape: shape } }));
}

export function setCoverWidth(shape: CoverShape, width: number): void {
  update((c) => ({
    ...c,
    cover: { ...c.cover, shapeWidths: { ...c.cover.shapeWidths, [shape]: width } },
  }));
}

export function setCoverProperty(propertyName: string): void {
  update((c) => ({ ...c, cover: { ...c.cover, propertyName } }));
}

export function setCoverFolder(folder: string): void {
  update((c) => ({ ...c, cover: { ...c.cover, imageFolder: folder } }));
}

// ── Banner ───────────────────────────────────────────────────────────────

export function setBannerHeight(height: number): void {
  update((c) => ({ ...c, banner: { ...c.banner, height } }));
}

export function setBannerFolder(folder: string): void {
  update((c) => ({ ...c, banner: { ...c.banner, imageFolder: folder } }));
}

// ── Icon ─────────────────────────────────────────────────────────────────

export function setIconFolder(folder: string): void {
  update((c) => ({ ...c, icon: { ...c.icon, imageFolder: folder } }));
}

// ── Hidden properties ────────────────────────────────────────────────────

export function toggleHideProperty(key: string): void {
  update((c) => ({
    ...c,
    hiddenProperties: togglePropertyHidden(c.hiddenProperties, key),
  }));
}

export function toggleRevealAll(): void {
  revealHidden.update((v) => !v);
}

// ── Property colors ──────────────────────────────────────────────────────

export function setPropertyColor(
  propertyKey: string,
  value: string,
  color: string | null,
): void {
  update((c) => ({
    ...c,
    propertyColors: setPropertyValueColor(c.propertyColors, propertyKey, value, color),
  }));
}

// ── Tag colors ───────────────────────────────────────────────────────────

export function setTagColor(tag: string, color: string | null): void {
  update((c) => {
    const clean = tag.startsWith('#') ? tag.slice(1) : tag;
    let updated = c.tagColors.filter((t) => t.tag !== clean);
    if (color !== null) updated = [...updated, { tag: clean, color }];
    return { ...c, tagColors: updated };
  });
}

export function toggleColoredTagsInBody(): void {
  update((c) => ({ ...c, coloredTagsInBody: !c.coloredTagsInBody }));
}

export function toggleTextColorButton(): void {
  update((c) => ({ ...c, showTextColorButton: !c.showTextColorButton }));
}

// ── Date formatting ──────────────────────────────────────────────────────

export function setDateFormat(dateFormat: string): void {
  update((c) => ({ ...c, dateFormat: { ...c.dateFormat, dateFormat } }));
}

export function setDatetimeFormat(datetimeFormat: string): void {
  update((c) => ({ ...c, dateFormat: { ...c.dateFormat, datetimeFormat } }));
}

export function setDateColor(
  relative: 'past' | 'present' | 'future',
  color: string,
): void {
  update((c) => ({ ...c, dateColors: { ...c.dateColors, [relative]: color } }));
}

// ── Progress bars ────────────────────────────────────────────────────────

export function addProgressBar(config: ProgressConfig): void {
  update((c) => ({
    ...c,
    progressBars: [...c.progressBars.filter((p) => p.property !== config.property), config],
  }));
}

export function removeProgressBar(property: string): void {
  update((c) => ({
    ...c,
    progressBars: c.progressBars.filter((p) => p.property !== property),
  }));
}

// ── Property templates ───────────────────────────────────────────────────

export function setPropertyTemplate(property: string, template: string): void {
  update((c) => ({
    ...c,
    templates: [
      ...c.templates.filter((t) => t.property !== property),
      { property, template },
    ],
  }));
}

export function removePropertyTemplate(property: string): void {
  update((c) => ({
    ...c,
    templates: c.templates.filter((t) => t.property !== property),
  }));
}

/** Get the template for a specific property (if any). */
export function getTemplate(property: string): string | null {
  const config = get(prettyPropertiesConfig);
  const t = config.templates.find((tpl) => tpl.property === property);
  return t?.template ?? null;
}
