import { writable, get } from 'svelte/store';
import type { LayoutPreset, ViewportMode } from '@/types/layout';
import { layoutStore, LAYOUT_CONSTANTS } from './layout';
import { generateId } from '@/utils/id';
import { log } from '@/utils/logger';

const STORAGE_KEY = 'bismuth-layout-presets';

/** The active viewport mode (note editor, RSS reader, canvas) */
export const viewportMode = writable<ViewportMode>('note');

/** All saved layout presets */
export const layoutPresets = writable<LayoutPreset[]>([]);

/** Currently active preset ID (null = custom/unsaved) */
export const activePresetId = writable<string | null>(null);

/** Default presets shipped with Bismuth */
export const DEFAULT_PRESETS: LayoutPreset[] = [
  {
    id: 'preset-focus',
    name: 'Focus',
    leftSidebarVisible: false,
    rightSidebarVisible: false,
    leftSidebarWidth: LAYOUT_CONSTANTS.SIDEBAR_DEFAULT_WIDTH,
    rightSidebarWidth: LAYOUT_CONSTANTS.SIDEBAR_DEFAULT_WIDTH,
    leftActiveTab: 'files',
    rightActiveTab: 'outline',
    viewportMode: 'note',
    isDefault: true,
  },
  {
    id: 'preset-write',
    name: 'Write',
    leftSidebarVisible: true,
    rightSidebarVisible: false,
    leftSidebarWidth: 250,
    rightSidebarWidth: LAYOUT_CONSTANTS.SIDEBAR_DEFAULT_WIDTH,
    leftActiveTab: 'files',
    rightActiveTab: 'outline',
    viewportMode: 'note',
    isDefault: true,
  },
  {
    id: 'preset-research',
    name: 'Research',
    leftSidebarVisible: true,
    rightSidebarVisible: true,
    leftSidebarWidth: LAYOUT_CONSTANTS.SIDEBAR_DEFAULT_WIDTH,
    rightSidebarWidth: LAYOUT_CONSTANTS.SIDEBAR_DEFAULT_WIDTH,
    leftActiveTab: 'files',
    rightActiveTab: 'backlinks',
    viewportMode: 'note',
    isDefault: true,
  },
  {
    id: 'preset-canvas',
    name: 'Canvas',
    leftSidebarVisible: true,
    rightSidebarVisible: true,
    leftSidebarWidth: 250,
    rightSidebarWidth: 250,
    leftActiveTab: 'files',
    rightActiveTab: 'properties',
    viewportMode: 'canvas',
    isDefault: true,
  },
];

/** Initialize presets from storage, merging with defaults */
export function loadPresets(): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const userPresets: LayoutPreset[] = stored ? JSON.parse(stored) : [];
    layoutPresets.set([...DEFAULT_PRESETS, ...userPresets]);
    log.debug('Layout presets loaded', { count: DEFAULT_PRESETS.length + userPresets.length });
  } catch {
    layoutPresets.set([...DEFAULT_PRESETS]);
  }
}

/** Persist user presets (non-default) to localStorage */
function persistPresets(): void {
  const all = get(layoutPresets);
  const userOnly = all.filter((p) => !p.isDefault);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userOnly));
  } catch {
    log.warn('Failed to persist layout presets');
  }
}

/** Save the current layout state as a named preset */
export function savePreset(name: string): LayoutPreset {
  const state = get(layoutStore);
  const mode = get(viewportMode);
  const preset: LayoutPreset = {
    id: generateId(),
    name,
    leftSidebarVisible: state.leftSidebarVisible,
    rightSidebarVisible: state.rightSidebarVisible,
    leftSidebarWidth: state.leftSidebarWidth,
    rightSidebarWidth: state.rightSidebarWidth,
    leftActiveTab: state.leftActiveTab,
    rightActiveTab: state.rightActiveTab,
    viewportMode: mode,
  };
  layoutPresets.update((presets) => [...presets, preset]);
  activePresetId.set(preset.id);
  persistPresets();
  log.info('Layout preset saved', { name, id: preset.id });
  return preset;
}

/** Apply a preset to the current layout */
export function applyPreset(presetId: string): void {
  const all = get(layoutPresets);
  const preset = all.find((p) => p.id === presetId);
  if (!preset) return;

  layoutStore.update((state) => ({
    ...state,
    leftSidebarVisible: preset.leftSidebarVisible,
    rightSidebarVisible: preset.rightSidebarVisible,
    leftSidebarWidth: preset.leftSidebarWidth,
    rightSidebarWidth: preset.rightSidebarWidth,
    leftActiveTab: preset.leftActiveTab,
    rightActiveTab: preset.rightActiveTab,
  }));
  viewportMode.set(preset.viewportMode);
  activePresetId.set(presetId);
  log.info('Layout preset applied', { name: preset.name });
}

/** Delete a user preset (cannot delete defaults) */
export function deletePreset(presetId: string): boolean {
  const all = get(layoutPresets);
  const preset = all.find((p) => p.id === presetId);
  if (!preset || preset.isDefault) return false;

  layoutPresets.update((presets) => presets.filter((p) => p.id !== presetId));
  if (get(activePresetId) === presetId) {
    activePresetId.set(null);
  }
  persistPresets();
  log.info('Layout preset deleted', { name: preset.name });
  return true;
}

/** Rename a user preset */
export function renamePreset(presetId: string, newName: string): boolean {
  const all = get(layoutPresets);
  const preset = all.find((p) => p.id === presetId);
  if (!preset || preset.isDefault) return false;

  layoutPresets.update((presets) =>
    presets.map((p) => (p.id === presetId ? { ...p, name: newName } : p))
  );
  persistPresets();
  return true;
}

/** Switch viewport mode (note editor, RSS, canvas) */
export function setViewportMode(mode: ViewportMode): void {
  viewportMode.set(mode);
  log.debug('Viewport mode changed', { mode });
}
