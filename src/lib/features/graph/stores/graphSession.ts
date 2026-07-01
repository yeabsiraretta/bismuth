/**
 * Graph session persistence — saves/restores graph view state across app refreshes.
 * Uses localStorage to preserve zoom, pan, settings, filters, and view mode.
 */

import type { GraphSettings } from '../types';
import { log } from '@/utils/logger';

const STORAGE_KEY = 'bismuth-graph-session';

export interface GraphSessionState {
  /** Camera state */
  offsetX: number;
  offsetY: number;
  scale: number;
  /** Selected/hovered node */
  selectedNode: string | null;
  /** View mode */
  isLocal: boolean;
  centerNode: string | null;
  depth: number;
  /** Filter state */
  searchQuery: string;
  filterTags: string[];
  filterTypes: string[];
  filterFolder: string;
  filterDepth: number;
  /** Graph settings */
  settings: GraphSettings;
  /** Color groups */
  colorGroups: Array<{ query: string; color: string }>;
}

const DEFAULT_SETTINGS: GraphSettings = {
  showTags: true,
  showAttachments: true,
  showOrphans: true,
  showArrows: false,
  showLabels: true,
  textFadeThreshold: 0.3,
  nodeSize: 1.0,
  linkThickness: 0.5,
  centerForce: 0.1,
  repelForce: 300,
  linkForce: 0.3,
  linkDistance: 120,
  animate: true,
  damping: 0.85,
  collisionRadius: 20,
};

export function getDefaultSession(): GraphSessionState {
  return {
    offsetX: 0,
    offsetY: 0,
    scale: 1,
    selectedNode: null,
    isLocal: false,
    centerNode: null,
    depth: 2,
    searchQuery: '',
    filterTags: [],
    filterTypes: [],
    filterFolder: '',
    filterDepth: 3,
    settings: { ...DEFAULT_SETTINGS },
    colorGroups: [],
  };
}

export function loadGraphSession(): GraphSessionState {
  const defaults = getDefaultSession();
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return defaults;
    const parsed = JSON.parse(saved) as Partial<GraphSessionState>;
    return {
      ...defaults,
      ...parsed,
      settings: { ...defaults.settings, ...(parsed.settings ?? {}) },
    };
  } catch (e) {
    log.warn('Failed to load graph session', { error: String(e) });
    return defaults;
  }
}

export function saveGraphSession(state: Partial<GraphSessionState>): void {
  try {
    const current = loadGraphSession();
    const merged = { ...current, ...state };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch (e) {
    log.warn('Failed to save graph session', { error: String(e) });
  }
}

export function clearGraphSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}
