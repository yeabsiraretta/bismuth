import { log } from '@/utils/logger';

const PRELOAD_KEY = 'bismuth-preloaded-features';
const PRUNE_KEY = 'bismuth-preload-pruned';
const HINT_MAX = 10;
const STALENESS_DAYS = 30;
const PRUNE_INTERVAL_DAYS = 7;
const PRELOAD_STAGGER_MS = 100;

interface PreloadEntry {
  id: string;
  usedAt: string;
}

export function recordFeatureUse(featureId: string): void {
  try {
    const entries = loadEntries();
    const filtered = entries.filter(e => e.id !== featureId);
    const updated = [...filtered, { id: featureId, usedAt: new Date().toISOString() }].slice(-HINT_MAX);
    localStorage.setItem(PRELOAD_KEY, JSON.stringify(updated));
  } catch (e) { log.warn('Failed to persist feature preload hint', { error: String(e) }); }
}

export function getPreloadHints(): string[] {
  try {
    const entries = loadEntries();
    const cutoff = Date.now() - STALENESS_DAYS * 86_400_000;
    return entries
      .filter(e => new Date(e.usedAt).getTime() > cutoff)
      .map(e => e.id);
  } catch (e) { log.warn('Failed to get preload hints', { error: String(e) }); return []; }
}

export function clearStalePreloadHints(): void {
  try {
    const lastPruned = localStorage.getItem(PRUNE_KEY);
    const pruneInterval = PRUNE_INTERVAL_DAYS * 86_400_000;
    if (lastPruned && Date.now() - new Date(lastPruned).getTime() < pruneInterval) return;

    const entries = loadEntries();
    const cutoff = Date.now() - STALENESS_DAYS * 86_400_000;
    const pruned = entries.filter(e => new Date(e.usedAt).getTime() > cutoff);
    localStorage.setItem(PRELOAD_KEY, JSON.stringify(pruned));
    localStorage.setItem(PRUNE_KEY, new Date().toISOString());
  } catch (e) { log.warn('Failed to prune stale preload hints', { error: String(e) }); }
}

function loadEntries(): PreloadEntry[] {
  try {
    const stored = localStorage.getItem(PRELOAD_KEY);
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is PreloadEntry =>
        typeof e === 'object' &&
        e !== null &&
        typeof (e as PreloadEntry).id === 'string' &&
        (e as PreloadEntry).id.length < 50 &&
        typeof (e as PreloadEntry).usedAt === 'string'
    );
  } catch (e) { log.warn('Failed to parse preload entries from localStorage', { error: String(e) }); return []; }
}

/** Lazy-load map keyed by feature ID. Only features with `preloadKey`
 *  in the registry are eligible for background preloading. */
const PRELOADABLE: Record<string, () => Promise<unknown>> = {
  graph: () => import('@/features/graph'),
  tag: () => import('@/features/tag'),
  entity: () => import('@/features/entity'),
  backlinks: () => import('@/features/backlinks'),
  flashcards: () => import('@/features/flashcards'),
  inbox: () => import('@/features/capture'),
  tasks: () => import('@/features/tasks'),
  kanban: () => import('@/features/tasks'),
  gamify: () => import('@/features/gamify'),
  templates: () => import('@/features/template'),
  changelog: () => import('@/features/changelog'),
  writing: () => import('@/features/linting'),
  calendar: () => import('@/features/calendar'),
  'speed-reader': () => import('@/features/speedreader'),
  canvas: () => import('@/features/canvas'),
  git: () => import('@/features/git'),
  publishing: () => import('@/features/publishing'),
  rss: () => import('@/features/rss'),
  voice: () => import('@/features/voice'),
  llm: () => import('@/features/llm'),
};

/** Background-preload previously-used features after vault is ready.
 * Staggered by 100ms per feature to avoid saturating the asset server at startup. */
export function preloadPreviouslyUsedFeatures(): void {
  clearStalePreloadHints();
  const hints = getPreloadHints();
  hints.forEach((featureId, i) => {
    const loader = PRELOADABLE[featureId];
    if (loader) {
      setTimeout(() => { loader().catch(() => {}); }, i * PRELOAD_STAGGER_MS);
    }
  });
}
