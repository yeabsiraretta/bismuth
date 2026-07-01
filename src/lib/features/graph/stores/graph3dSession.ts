/**
 * 3D Graph session persistence — saves/restores camera, settings, and search state.
 */

import type { Camera3D, Graph3DSettings, Graph3DColorGroup } from '../types/graph3d';
import { DEFAULT_CAMERA, DEFAULT_3D_SETTINGS } from '../types/graph3d';
import { log } from '@/utils/logger';

const STORAGE_KEY = 'bismuth-graph3d-session';

export interface Graph3DSession {
  camera: Camera3D;
  settings: Graph3DSettings;
  searchQuery: string;
  focusedNodeId: string | null;
}

export function getDefault3DSession(): Graph3DSession {
  return {
    camera: { ...DEFAULT_CAMERA },
    settings: { ...DEFAULT_3D_SETTINGS },
    searchQuery: '',
    focusedNodeId: null,
  };
}

export function load3DSession(): Graph3DSession {
  const defaults = getDefault3DSession();
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return defaults;
    const parsed = JSON.parse(saved) as Partial<Graph3DSession>;
    return {
      ...defaults,
      ...parsed,
      camera: { ...defaults.camera, ...(parsed.camera ?? {}) },
      settings: {
        ...defaults.settings,
        ...(parsed.settings ?? {}),
        noteAppearance: {
          ...defaults.settings.noteAppearance,
          ...(parsed.settings?.noteAppearance ?? {}),
        },
        attachmentAppearance: {
          ...defaults.settings.attachmentAppearance,
          ...(parsed.settings?.attachmentAppearance ?? {}),
        },
        tagAppearance: {
          ...defaults.settings.tagAppearance,
          ...(parsed.settings?.tagAppearance ?? {}),
        },
        colorGroups: parsed.settings?.colorGroups ?? defaults.settings.colorGroups,
      },
    };
  } catch (e) {
    log.warn('Failed to load 3D graph session', { error: String(e) });
    return defaults;
  }
}

export function save3DSession(state: Partial<Graph3DSession>): void {
  try {
    const current = load3DSession();
    const merged = { ...current, ...state };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch (e) {
    log.warn('Failed to save 3D graph session', { error: String(e) });
  }
}

export function clear3DSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}
