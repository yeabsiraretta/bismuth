/**
 * Tracker store — property definitions, tracked data, capture state, settings.
 * Persists definitions and settings to localStorage; data is read-only from vault.
 */
import { writable, derived, get } from 'svelte/store';
import { log } from '@/utils/logger';
import type {
  PropertyDefinition, DataPoint, TrackerSettings, CardConfig,
  OverlayConfig, VisualizationPreset, CaptureState, TimeFrame,
} from '../types';
import { DEFAULT_TRACKER_SETTINGS, DEFAULT_CARD_CONFIG } from '../types';
import { loadNoteMeta, extractAllProperties } from '../services/dataExtractor';

// ─── Storage ─────────────────────────────────────────────────────────────────

const DEFS_KEY = 'bismuth-lt-definitions';
const SETTINGS_KEY = 'bismuth-lt-settings';
const CARDS_KEY = 'bismuth-lt-cards';
const OVERLAYS_KEY = 'bismuth-lt-overlays';
const PRESETS_KEY = 'bismuth-lt-presets';

function loadJson<T>(key: string, fallback: T): T {
  try {
    const s = localStorage.getItem(key);
    return s ? JSON.parse(s) : fallback;
  } catch { return fallback; }
}

// ─── Stores ──────────────────────────────────────────────────────────────────

export const propertyDefs = writable<PropertyDefinition[]>(loadJson(DEFS_KEY, []));
export const trackerSettings = writable<TrackerSettings>(loadJson(SETTINGS_KEY, DEFAULT_TRACKER_SETTINGS));
export const cardConfigs = writable<CardConfig[]>(loadJson(CARDS_KEY, []));
export const overlayConfigs = writable<OverlayConfig[]>(loadJson(OVERLAYS_KEY, []));
export const vizPresets = writable<VisualizationPreset[]>(loadJson(PRESETS_KEY, []));

export const trackerData = writable<Map<string, DataPoint[]>>(new Map());
export const trackerLoading = writable(false);

export const captureState = writable<CaptureState>({
  active: false, currentIndex: 0, notePath: null,
  batchPaths: [], batchIndex: 0, values: {}, filterMissing: false,
});

// Persist on change
propertyDefs.subscribe(v => localStorage.setItem(DEFS_KEY, JSON.stringify(v)));
trackerSettings.subscribe(v => localStorage.setItem(SETTINGS_KEY, JSON.stringify(v)));
cardConfigs.subscribe(v => localStorage.setItem(CARDS_KEY, JSON.stringify(v)));
overlayConfigs.subscribe(v => localStorage.setItem(OVERLAYS_KEY, JSON.stringify(v)));
vizPresets.subscribe(v => localStorage.setItem(PRESETS_KEY, JSON.stringify(v)));

// ─── Derived ─────────────────────────────────────────────────────────────────

export const definedPropertyNames = derived(propertyDefs, ($d) => $d.map(d => d.name));

export const visibleCards = derived(cardConfigs, ($c) =>
  $c.filter(c => !c.hidden).sort((a, b) => a.order - b.order),
);

export const captureProgress = derived(
  [captureState, propertyDefs],
  ([$s, $d]) => $d.length > 0 ? Math.round(($s.currentIndex / $d.length) * 100) : 0,
);

// ─── Data loading ────────────────────────────────────────────────────────────

export async function refreshTrackerData(): Promise<void> {
  trackerLoading.set(true);
  try {
    const defs = get(propertyDefs);
    const settings = get(trackerSettings);
    const notes = await loadNoteMeta();
    const data = extractAllProperties(notes, defs, settings.dateProperty, settings.timeFrame);
    trackerData.set(data);
    log.info('Refreshed tracker data', { properties: defs.length, notes: notes.length });
  } catch (error) {
    log.error('Failed to refresh tracker data', error as Error);
  } finally {
    trackerLoading.set(false);
  }
}

// ─── Property definition CRUD ────────────────────────────────────────────────

let nextOrder = 0;

export function addPropertyDef(def: Omit<PropertyDefinition, 'id' | 'order'>): void {
  const id = `prop-${Date.now().toString(36)}`;
  const defs = get(propertyDefs);
  nextOrder = defs.length > 0 ? Math.max(...defs.map(d => d.order)) + 1 : 0;
  propertyDefs.update(list => [...list, { ...def, id, order: nextOrder }]);
  ensureCardForProperty(def.name);
}

export function updatePropertyDef(id: string, updates: Partial<PropertyDefinition>): void {
  propertyDefs.update(list => list.map(d => d.id === id ? { ...d, ...updates } : d));
}

export function removePropertyDef(id: string): void {
  const def = get(propertyDefs).find(d => d.id === id);
  propertyDefs.update(list => list.filter(d => d.id !== id));
  if (def) cardConfigs.update(c => c.filter(card => card.propertyName !== def.name));
}

export function reorderPropertyDefs(ids: string[]): void {
  propertyDefs.update(list => {
    const byId = new Map(list.map(d => [d.id, d]));
    return ids.map((id, i) => ({ ...byId.get(id)!, order: i }));
  });
}

// ─── Card config CRUD ────────────────────────────────────────────────────────

function ensureCardForProperty(propertyName: string): void {
  const cards = get(cardConfigs);
  if (cards.some(c => c.propertyName === propertyName)) return;
  const presets = get(vizPresets);
  const preset = presets.find(p => propertyName.includes(p.namePattern));
  const id = `card-${Date.now().toString(36)}`;
  const order = cards.length;
  const config: CardConfig = {
    id, propertyName, order,
    ...DEFAULT_CARD_CONFIG,
    ...(preset && {
      visualization: preset.visualization,
      ...(preset.scale && { scale: preset.scale }),
      ...(preset.colorScheme && { colorScheme: preset.colorScheme }),
    }),
  };
  cardConfigs.update(list => [...list, config]);
}

export function updateCardConfig(id: string, updates: Partial<CardConfig>): void {
  cardConfigs.update(list => list.map(c => c.id === id ? { ...c, ...updates } : c));
}

export function removeCard(id: string): void {
  cardConfigs.update(list => list.filter(c => c.id !== id));
}

export function reorderCards(ids: string[]): void {
  cardConfigs.update(list => {
    const byId = new Map(list.map(c => [c.id, c]));
    return ids.map((id, i) => {
      const card = byId.get(id);
      return card ? { ...card, order: i } : card!;
    }).filter(Boolean);
  });
}

// ─── Overlay CRUD ────────────────────────────────────────────────────────────

export function addOverlay(name: string, propertyNames: string[]): void {
  const id = `overlay-${Date.now().toString(36)}`;
  const overlays = get(overlayConfigs);
  overlayConfigs.update(list => [...list, {
    id, name, propertyNames, visualization: 'line',
    colorScheme: 'blue', hideIndividual: false, order: overlays.length,
  }]);
}

export function updateOverlay(id: string, updates: Partial<OverlayConfig>): void {
  overlayConfigs.update(list => list.map(o => o.id === id ? { ...o, ...updates } : o));
}

export function removeOverlay(id: string): void {
  overlayConfigs.update(list => list.filter(o => o.id !== id));
}

// ─── Capture actions ─────────────────────────────────────────────────────────

export function startCapture(notePath: string): void {
  captureState.set({
    active: true, currentIndex: 0, notePath,
    batchPaths: [], batchIndex: 0, values: {}, filterMissing: false,
  });
}

export function startBatchCapture(paths: string[]): void {
  captureState.set({
    active: true, currentIndex: 0, notePath: paths[0] ?? null,
    batchPaths: paths, batchIndex: 0, values: {}, filterMissing: false,
  });
}

export function closeCapture(): void {
  captureState.update(s => ({ ...s, active: false }));
}

export function setTimeFrame(tf: TimeFrame): void {
  trackerSettings.update(s => ({ ...s, timeFrame: tf }));
}
