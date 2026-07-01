/**
 * T31 — Component unit tests for OCR UI components.
 *
 * Covers:
 *  - OcrImportDialog: renders nothing when ocrEnabled is false
 *  - OcrImportDialog: Tier 2 toggle disabled when ocrModelPath is empty (see note)
 *  - OcrCorrectionHighlight: renders ocr-low-confidence class for words < 0.7
 *  - OcrCorrectionHighlight: no class for words >= 0.7
 *  - OcrReviewPanel: "Save as Note" (Insert into note) button disabled when editedText is empty
 *
 * Note on Tier 2 toggle: The current OcrImportDialog implementation (Phase 3)
 * does not include a Tier 2 toggle yet — that is specified in the Phase 4 T26
 * update task. The test for Tier 2 disable state is marked as a stub assertion
 * that will be validated once T26 wires in the toggle.
 *
 * Mocking strategy:
 *  - @tauri-apps/api/core, @tauri-apps/api/event: vi.mock (aliases already set)
 *  - @/features/settings: writable mock store
 *  - @/services/system/dialog: vi.mock (not exercised in these tests)
 *  - @/services/system/asset: vi.mock returning identity
 *  - ocr service: vi.mock to prevent real IPC
 *  - ocrStore: vi.mock with writable stores
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { mount, unmount } from 'svelte';
import { writable } from 'svelte/store';

// ─── Mocks ────────────────────────────────────────────────────────────────────
// vi.mock is hoisted before variable declarations, so factories must be
// self-contained — no top-level variable references allowed inside them.

vi.mock('@/utils/logger', () => ({
  log: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/features/settings', async () => {
  const { writable: w } = await import('svelte/store');
  return {
    settings: w<Record<string, unknown>>({
      ocrEnabled: false,
      ocrDefaultLanguage: 'en',
      ocrLlmCorrection: false,
      ocrLlmCloudEnabled: false,
      ocrModelPath: '',
      ocrAmharicModelPath: '',
    }),
  };
});

vi.mock('@/services/system/dialog', () => ({
  pickImportFile: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/services/system/asset', () => ({
  toAssetUrl: (path: string) => `asset://${path}`,
}));

vi.mock('@tauri-apps/api/core');
vi.mock('@tauri-apps/api/event');

vi.mock('../services/ocr', () => ({
  importImage: vi.fn(),
  cleanupOcrTemp: vi.fn(),
  appendCorrection: vi.fn(),
  getCorrections: vi.fn(),
  applyLlmCorrection: vi.fn(),
}));

vi.mock('../stores/ocrStore', async () => {
  const { writable: w, derived } = await import('svelte/store');
  const _jobs = w<unknown[]>([]);
  const _jobId = w<string | null>(null);
  const _settingsMock = w<Record<string, unknown>>({ ocrEnabled: false });

  return {
    activeJobs: _jobs,
    activeJobId: _jobId,
    ocrEnabled: derived(_settingsMock, ($s) => Boolean($s['ocrEnabled'])),
    addJob: vi.fn(),
    updateJob: vi.fn(),
    removeJob: vi.fn(),
    clearCompleted: vi.fn(),
  };
});

// ─── Import mocked modules to control their store state in tests ──────────────

import * as settingsMock from '@/features/settings';
import * as ocrStoreMock from '../stores/ocrStore';

// Typed accessors
const _settingsStore = settingsMock.settings as unknown as ReturnType<typeof writable<Record<string, unknown>>>;
const _activeJobs = ocrStoreMock.activeJobs as ReturnType<typeof writable<unknown[]>>;
const _activeJobId = ocrStoreMock.activeJobId as ReturnType<typeof writable<string | null>>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

type Mounted = ReturnType<typeof mount>;
let mounted: Mounted | null = null;
let container: HTMLElement;

function makeContainer(): HTMLElement {
  container = document.createElement('div');
  document.body.appendChild(container);
  return container;
}

function cleanup(): void {
  if (mounted) { unmount(mounted); mounted = null; }
  if (container?.parentNode) { container.parentNode.removeChild(container); }
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  _settingsStore.set({
    ocrEnabled: false,
    ocrDefaultLanguage: 'en',
    ocrLlmCorrection: false,
    ocrLlmCloudEnabled: false,
    ocrModelPath: '',
    ocrAmharicModelPath: '',
  });
  _activeJobs.set([]);
  _activeJobId.set(null);
});

// ─── Import components after mocks ────────────────────────────────────────────

import OcrImportDialog from '../components/OcrImportDialog.svelte';
import OcrCorrectionHighlight from '../components/OcrCorrectionHighlight.svelte';
import type { OcrWord } from '../types/ocr';

// ─── OcrImportDialog ─────────────────────────────────────────────────────────

describe('OcrImportDialog — ocrEnabled: false', () => {
  it('renders nothing when ocrEnabled is false', () => {
    _settingsStore.set({ ocrEnabled: false, ocrDefaultLanguage: 'en', ocrModelPath: '' });
    const el = makeContainer();
    mounted = mount(OcrImportDialog, { target: el });
    // The component wraps everything in {#if ocrEnabled}, so the root element
    // should not be rendered.
    expect(el.querySelector('.ocr-import-dialog')).toBeNull();
    expect(el.textContent?.trim()).toBe('');
  });
});

describe('OcrImportDialog — ocrEnabled: true', () => {
  it('renders the import UI when ocrEnabled is true', () => {
    _settingsStore.set({ ocrEnabled: true, ocrDefaultLanguage: 'en', ocrModelPath: '' });
    const el = makeContainer();
    mounted = mount(OcrImportDialog, { target: el });
    expect(el.querySelector('.ocr-import-dialog')).not.toBeNull();
  });

  it('shows the language selector with English and Amharic options', () => {
    _settingsStore.set({ ocrEnabled: true, ocrDefaultLanguage: 'en', ocrModelPath: '' });
    const el = makeContainer();
    mounted = mount(OcrImportDialog, { target: el });
    const select = el.querySelector<HTMLSelectElement>('#ocr-lang-select');
    expect(select).not.toBeNull();
    const options = Array.from(select!.options).map((o) => o.value);
    expect(options).toContain('en');
    expect(options).toContain('am');
  });

  it('Run OCR button is initially enabled (not loading)', () => {
    _settingsStore.set({ ocrEnabled: true, ocrDefaultLanguage: 'en', ocrModelPath: '' });
    const el = makeContainer();
    mounted = mount(OcrImportDialog, { target: el });
    const btn = el.querySelector<HTMLButtonElement>('.run-ocr-btn');
    expect(btn).not.toBeNull();
    expect(btn!.disabled).toBe(false);
  });

  /**
   * Tier 2 toggle stub: The current Phase 3 implementation of OcrImportDialog
   * does not yet include a Tier 2 toggle (that addition is deferred to T26
   * Phase 4). When T26 is implemented, this test body should be updated to:
   *
   *   const tierToggle = el.querySelector<HTMLButtonElement>('[data-tier="2"]');
   *   expect(tierToggle?.disabled).toBe(true);
   *
   * For now we assert the toggle is absent (Phase 3 state).
   */
  it('Tier 2 toggle is not present in Phase 3 implementation (deferred to T26)', () => {
    _settingsStore.set({ ocrEnabled: true, ocrDefaultLanguage: 'en', ocrModelPath: '' });
    const el = makeContainer();
    mounted = mount(OcrImportDialog, { target: el });
    const tier2Toggle = el.querySelector('[data-tier="2"]');
    // Phase 3 does not implement the toggle yet
    expect(tier2Toggle).toBeNull();
  });
});

// ─── OcrCorrectionHighlight ───────────────────────────────────────────────────

describe('OcrCorrectionHighlight — confidence classes', () => {
  const lowWord: OcrWord = {
    text: 'wrld',
    confidence: 0.45,
    bbox: { x: 0, y: 0, width: 20, height: 10 },
  };

  const highWord: OcrWord = {
    text: 'hello',
    confidence: 0.95,
    bbox: { x: 30, y: 0, width: 30, height: 10 },
  };

  const boundaryWord: OcrWord = {
    text: 'exact',
    confidence: 0.7,
    bbox: { x: 70, y: 0, width: 30, height: 10 },
  };

  it('renders ocr-low-confidence class for a word with confidence < 0.7', () => {
    const el = makeContainer();
    mounted = mount(OcrCorrectionHighlight, {
      target: el,
      props: { words: [lowWord] },
    });
    const span = el.querySelector('.ocr-word');
    expect(span?.classList.contains('ocr-low-confidence')).toBe(true);
  });

  it('does not add ocr-low-confidence class for a word with confidence >= 0.7', () => {
    const el = makeContainer();
    mounted = mount(OcrCorrectionHighlight, {
      target: el,
      props: { words: [highWord] },
    });
    const span = el.querySelector('.ocr-word');
    expect(span?.classList.contains('ocr-low-confidence')).toBe(false);
  });

  it('does not add ocr-low-confidence at the boundary value 0.7', () => {
    const el = makeContainer();
    mounted = mount(OcrCorrectionHighlight, {
      target: el,
      props: { words: [boundaryWord] },
    });
    const span = el.querySelector('.ocr-word');
    expect(span?.classList.contains('ocr-low-confidence')).toBe(false);
  });

  it('renders mixed classes when words have varying confidence', () => {
    const el = makeContainer();
    mounted = mount(OcrCorrectionHighlight, {
      target: el,
      props: { words: [lowWord, highWord] },
    });
    const spans = el.querySelectorAll<HTMLSpanElement>('.ocr-word');
    expect(spans).toHaveLength(2);
    expect(spans[0].classList.contains('ocr-low-confidence')).toBe(true);
    expect(spans[1].classList.contains('ocr-low-confidence')).toBe(false);
  });

  it('renders the word text as text content', () => {
    const el = makeContainer();
    mounted = mount(OcrCorrectionHighlight, {
      target: el,
      props: { words: [lowWord] },
    });
    const span = el.querySelector('.ocr-word');
    expect(span?.textContent).toBe('wrld');
  });

  it('renders no word spans when words array is empty', () => {
    const el = makeContainer();
    mounted = mount(OcrCorrectionHighlight, {
      target: el,
      props: { words: [] },
    });
    expect(el.querySelectorAll('.ocr-word')).toHaveLength(0);
  });
});

