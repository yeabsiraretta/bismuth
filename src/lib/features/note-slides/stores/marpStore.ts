/**
 * Marp Store — manages presentation state, active slide, theme, and config.
 * Persists configuration to localStorage.
 */
import { writable, derived, get } from 'svelte/store';
import { log } from '@/utils/logger';
import type { MarpPresentation, MarpConfig, MarpExportFormat } from '../types/marp';
import { DEFAULT_MARP_CONFIG } from '../types/marp';
import { parseMarpPresentation } from '../services/marpParser';

// ─── Configuration ───────────────────────────────────────────────────────────

const CONFIG_KEY = 'bismuth:marp-config';

function loadConfig(): MarpConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    return raw ? { ...DEFAULT_MARP_CONFIG, ...JSON.parse(raw) } : { ...DEFAULT_MARP_CONFIG };
  } catch {
    return { ...DEFAULT_MARP_CONFIG };
  }
}

const _config = writable<MarpConfig>(loadConfig());
export const marpConfig = { subscribe: _config.subscribe };

export function updateMarpConfig(patch: Partial<MarpConfig>): void {
  _config.update((c) => {
    const updated = { ...c, ...patch };
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(updated));
    } catch {}
    return updated;
  });
}

// ─── Presentation state ──────────────────────────────────────────────────────

export interface MarpPreviewState {
  presentation: MarpPresentation | null;
  activeSlide: number;
  isPreviewOpen: boolean;
  isPresenting: boolean;
  error: string | null;
}

const INITIAL_STATE: MarpPreviewState = {
  presentation: null,
  activeSlide: 0,
  isPreviewOpen: false,
  isPresenting: false,
  error: null,
};

const _state = writable<MarpPreviewState>({ ...INITIAL_STATE });
export const marpPreviewState = { subscribe: _state.subscribe };

// Derived stores
export const activePresentation = derived(_state, (s) => s.presentation);
export const activeSlideIndex = derived(_state, (s) => s.activeSlide);
export const slideCount = derived(_state, (s) => s.presentation?.slides.length ?? 0);
export const isPreviewOpen = derived(_state, (s) => s.isPreviewOpen);
export const isPresenting = derived(_state, (s) => s.isPresenting);
export const currentSlide = derived(_state, (s) => s.presentation?.slides[s.activeSlide] ?? null);

// ─── Actions ─────────────────────────────────────────────────────────────────

/** Parse markdown and open preview */
export function openMarpPreview(markdown: string, notePath: string): void {
  const pres = parseMarpPresentation(markdown, notePath);
  if (!pres) {
    _state.update((s) => ({
      ...s,
      error: 'Not a valid Marp presentation (missing marp: true in frontmatter)',
    }));
    log.warn('[marpStore] Not a Marp note', { notePath });
    return;
  }

  _state.update((s) => ({
    ...s,
    presentation: pres,
    activeSlide: 0,
    isPreviewOpen: true,
    error: null,
  }));
  log.info('[marpStore] Preview opened', { notePath, slides: pres.slides.length });
}

/** Update preview content (auto-reload) */
export function reloadMarpPreview(markdown: string, notePath: string): void {
  const state = get(_state);
  if (!state.isPreviewOpen) return;

  const pres = parseMarpPresentation(markdown, notePath);
  if (!pres) return;

  _state.update((s) => ({
    ...s,
    presentation: pres,
    activeSlide: Math.min(s.activeSlide, pres.slides.length - 1),
    error: null,
  }));
  log.debug('[marpStore] Preview reloaded', { slides: pres.slides.length });
}

/** Close preview */
export function closeMarpPreview(): void {
  _state.update((s) => ({ ...s, isPreviewOpen: false, isPresenting: false, presentation: null }));
  log.debug('[marpStore] Preview closed');
}

/** Navigate to specific slide */
export function goToMarpSlide(index: number): void {
  _state.update((s) => {
    const max = (s.presentation?.slides.length ?? 1) - 1;
    return { ...s, activeSlide: Math.max(0, Math.min(index, max)) };
  });
}

/** Next slide */
export function nextMarpSlide(): void {
  _state.update((s) => {
    const max = (s.presentation?.slides.length ?? 1) - 1;
    return { ...s, activeSlide: Math.min(s.activeSlide + 1, max) };
  });
}

/** Previous slide */
export function prevMarpSlide(): void {
  _state.update((s) => ({
    ...s,
    activeSlide: Math.max(s.activeSlide - 1, 0),
  }));
}

/** Enter fullscreen presentation mode */
export function startMarpPresentation(): void {
  _state.update((s) => ({ ...s, isPresenting: true, activeSlide: 0 }));
  log.info('[marpStore] Fullscreen presentation started');
}

/** Exit fullscreen presentation mode */
export function stopMarpPresentation(): void {
  _state.update((s) => ({ ...s, isPresenting: false }));
  log.info('[marpStore] Fullscreen presentation stopped');
}

/** Get export format from config */
export function getExportFormat(): MarpExportFormat {
  return get(_config).defaultExportFormat;
}
