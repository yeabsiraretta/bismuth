import { loadLayout, enableAutoSave } from '@/stores/layout/layout';
import { loadPresets } from '@/stores/layout/presets';
import { initializeVault } from '@/stores/vault/vault';
import { createNote } from '@/services/vault/vault';
import { restoreZoom } from '@/services/app/zoom';
import { openNote, doRefresh } from '@/appNavigation';
import { currentVault, activeNote } from '@/stores/vault/vault';
import { get } from 'svelte/store';
import { log } from '@/utils/logger';
import { preloadPreviouslyUsedFeatures } from '@/utils/storage/featurePreload';
import { recordStartupDuration } from '@/services/startup/startupMetrics';
import { settings } from '@/features/settings';
import type { BismuthSettings } from '@/features/settings';
import { listLocalThemes } from '@/services/system/themes';
import { applyThemeTokens } from '@/utils/settings/themeApplier';
import { setAppLocale } from '@/services/system/updates';
import { showToast } from '@/stores/toast/toast';
import { registerStatusItem } from '@/stores/status/status';
import { startPerformanceObservers, stopPerformanceObservers } from '@/services/observability';
import { registerAppCommands } from './appCommands';
import type { AppCallbacks } from './AppCallbacks';
import { BISMUTH_DESIGN_CANVAS } from '@/config/presets/bismuth-design-canvas';
import type { Vault } from '@/types/data/vault';

let changelogCleanup: (() => void) | null = null;

export async function initializeApp(callbacks: AppCallbacks): Promise<void> {
  log.info('App initializing');

  // Phase 1 — Synchronous, cheap: restore layout from localStorage (no IPC)
  loadLayout();
  loadPresets();
  enableAutoSave();

  // Phase 2 — Parallel async: vault init + zoom restore are independent IPC calls
  await Promise.all([
    restoreZoom().catch((e) => log.warn('restoreZoom failed', e)),
    initializeVault().catch((e) => log.warn('initializeVault failed — no vault open', e)),
  ]);
  log.info('Vault initialization complete');

  // Phase 3 — Post-vault: theme + locale + commands can run concurrently
  const currentSettings = get(settings);
  const vaultAfterInit = get(currentVault);

  registerAppCommands(callbacks, handleNewNote, handlePublish);

  await Promise.all([
    applyStartupTheme(currentSettings, vaultAfterInit),
    setAppLocale(currentSettings.language).catch(() => {}),
  ]);

  // Record startup metric before deferring non-critical work
  const _win =
    typeof window !== 'undefined'
      ? (window as Window & { __bismuth_init_start?: number })
      : undefined;
  if (_win && typeof _win.__bismuth_init_start === 'number') {
    const duration = Math.round(performance.now() - _win.__bismuth_init_start);
    delete _win.__bismuth_init_start; // Clear so re-init (HMR / vault switch) won't accumulate
    recordStartupDuration(duration);
    const fmt = formatDuration(duration);
    registerStatusItem({
      id: 'load-time',
      position: 'right',
      icon: 'clock',
      label: fmt,
      tooltip: `App loaded in ${fmt} (${duration}ms)`,
      priority: 999,
    });
    const threshold = currentSettings.startupThresholdMs;
    if (duration > threshold) {
      showToast(`Startup took ${fmt} — check Performance in Settings`, 'info', 6000);
      log.warn('Slow startup detected', { durationMs: duration, thresholdMs: threshold });
    }
  }

  // Phase 4 — Deferred: non-critical work runs after the UI is interactive
  const deferWork =
    typeof requestIdleCallback === 'function'
      ? requestIdleCallback
      : (cb: () => void) => setTimeout(cb, 50);

  deferWork(() => {
    seedDesignCanvasIfAbsent().catch((e) => log.debug('Design canvas seeding skipped', e));

    if (vaultAfterInit?.root_path) {
      import('@/features/nas')
        .then(({ loadNasConfig }) => {
          loadNasConfig(vaultAfterInit.root_path).catch(() => {});
        })
        .catch((e) => log.debug('NAS feature not loaded', e));
    }

    import('@/features/changelog')
      .then((m) => {
        m.setupChangelogAutoUpdate();
        changelogCleanup = m.cleanupChangelogListeners;
      })
      .catch((e) => log.warn('Failed to initialize changelog auto-update', e));

    import('@/features/lazyloader')
      .then(({ runLazyLoader }) => {
        runLazyLoader().catch((e) => log.debug('Lazy loader run skipped', e));
      })
      .catch(() => {
        // Fallback: if lazy loader module fails, use the old preload path
        preloadPreviouslyUsedFeatures();
      });
    startPerformanceObservers();

    import('@/features/uri')
      .then(({ startUriListener }) => {
        startUriListener().catch((e) => log.debug('URI listener setup skipped', e));
      })
      .catch((e) => log.debug('URI feature not loaded', e));

    import('@/features/backup')
      .then(({ runStartupBackup }) => {
        runStartupBackup().catch((e) => log.debug('Startup backup skipped', e));
      })
      .catch((e) => log.debug('Backup feature not loaded', e));

    applyStartupAction().catch(() => {});
  });
}

/** Apply the saved theme if one is configured. Separated for parallel execution. */
async function applyStartupTheme(
  currentSettings: BismuthSettings,
  vault: Vault | null
): Promise<void> {
  if (!currentSettings.activeThemePath || !vault?.root_path) return;
  try {
    const themes = await listLocalThemes(vault.root_path);
    const active = themes.find((t) => t.name === currentSettings.activeThemePath);
    if (active) {
      applyThemeTokens(active.tokens);
      log.info('Startup: applied saved theme', { name: active.name });
    }
  } catch (e) {
    log.warn('Startup: failed to apply saved theme', { error: String(e) });
  }
}

export function cleanupApp(): void {
  changelogCleanup?.();
  stopPerformanceObservers();
  import('@/features/uri').then(({ stopUriListener }) => stopUriListener()).catch(() => {});
  import('@/features/backup')
    .then(({ runQuitBackup, stopInterval }) => {
      runQuitBackup().catch(() => {});
      stopInterval();
    })
    .catch(() => {});
}

export async function handleNewNote(): Promise<void> {
  const vault = get(currentVault);
  if (!vault) return;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const path = `${vault.root_path}/Untitled ${timestamp}.md`;
  await createNote(path, '');
  await openNote(path);
}

export async function handlePublish(): Promise<void> {
  const { triggerPublish } = await import('@/features/publishing');
  await triggerPublish({
    output_dir: '.bismuth/publish',
    base_url: '/',
    theme: 'default',
    target: 'local',
  });
}

export async function handleDailyNote(): Promise<void> {
  const { openDailyNote } = await import('@/features/periodic');
  await openDailyNote();
}

export async function handlePublishMark(): Promise<void> {
  const note = get(activeNote);
  if (!note?.path) return;
  const { togglePublishFlag } = await import('@/features/publishing');
  await togglePublishFlag(note.path);
}

/** Seeds the Bismuth Living Design Canvas on first vault open if not already present. */
async function seedDesignCanvasIfAbsent(): Promise<void> {
  const vault = get(currentVault);
  if (!vault?.root_path) return;
  const {
    refreshCanvasList,
    canvasList,
    createNewCanvas,
    saveCurrentCanvas,
    currentCanvas,
    setCurrentCanvas,
  } = await import('@/features/canvas/stores');
  await refreshCanvasList().catch(() => {});
  const canvases = get(canvasList);
  const alreadySeeded = canvases.some(
    (c) => c.id === BISMUTH_DESIGN_CANVAS.id || c.name === BISMUTH_DESIGN_CANVAS.name
  );
  if (alreadySeeded) return;
  await createNewCanvas(BISMUTH_DESIGN_CANVAS.name);
  const created = get(currentCanvas);
  if (created) {
    setCurrentCanvas({ ...created, ...BISMUTH_DESIGN_CANVAS, id: created.id });
    await saveCurrentCanvas();
  }
  log.info('Bismuth design canvas seeded', { name: BISMUTH_DESIGN_CANVAS.name });
}

/** Formats a duration in ms to the most relevant human-readable unit. */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const secs = ms / 1000;
  if (secs < 60) return `${secs.toFixed(1)}s`;
  const mins = Math.floor(secs / 60);
  const remSecs = Math.round(secs % 60);
  return remSecs > 0 ? `${mins}m ${remSecs}s` : `${mins}m`;
}

/** Apply the user's chosen startup action from homepage settings. */
async function applyStartupAction(): Promise<void> {
  const { homepageConfig } = await import('@/stores/settings/homepage');
  const { setViewportMode } = await import('@/stores/layout/presets');
  const { get: svelteGet } = await import('svelte/store');
  const cfg = svelteGet(homepageConfig);

  // Start tracking recent file opens for home tab
  import('@/features/hometab')
    .then(({ setupRecentTracking }) => setupRecentTracking())
    .catch(() => {});

  switch (cfg.option) {
    case 'home':
      setViewportMode('home');
      break;
    case 'graph':
      setViewportMode('graph');
      break;
    case 'daily':
      handleDailyNote().catch(() => {});
      break;
    case 'random': {
      const { notes: notesStore } = await import('@/stores/vault/vault');
      const allNotes = svelteGet(notesStore).filter((n) => n.path.endsWith('.md'));
      if (allNotes.length > 0) {
        const pick = allNotes[Math.floor(Math.random() * allNotes.length)];
        openNote(pick.path);
      }
      break;
    }
    case 'specific':
      if (cfg.specificNotePath) openNote(cfg.specificNotePath);
      break;
    case 'last-opened':
    default:
      break;
  }
}

export { doRefresh };
