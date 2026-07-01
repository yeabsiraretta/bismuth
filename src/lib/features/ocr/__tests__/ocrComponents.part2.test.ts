/**
 * T31 — Component unit tests for OCR UI components — part 2.
 *
 * Covers:
 *  - OcrReviewPanel: renders empty state when no job is active
 *  - OcrReviewPanel: "Save as Note" button disabled when editedText is empty
 *  - OcrReviewPanel: "Save as Note" button enabled when editedText is non-empty
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { mount, unmount } from 'svelte';
import { writable } from 'svelte/store';

// ─── Mocks ────────────────────────────────────────────────────────────────────

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

import * as ocrStoreMock from '../stores/ocrStore';

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
  _activeJobs.set([]);
  _activeJobId.set(null);
});

// ─── Import components after mocks ────────────────────────────────────────────

import OcrReviewPanel from '../components/OcrReviewPanel.svelte';

// ─── OcrReviewPanel ───────────────────────────────────────────────────────────

describe('OcrReviewPanel — no active job', () => {
  it('renders the empty state when no job is active', () => {
    _activeJobs.set([]);
    _activeJobId.set(null);
    const el = makeContainer();
    mounted = mount(OcrReviewPanel, { target: el });
    expect(el.textContent).toContain('Select an OCR job to review');
  });
});

describe('OcrReviewPanel — Save as Note button disabled state', () => {
  it('"Save as Note" button is disabled when editedText is empty', async () => {
    const job = {
      id: 'j-test',
      imagePath: '/vault/.bismuth/ocr-temp/test.jpg',
      language: 'en',
      modelPath: '',
      status: 'complete',
      createdAt: Date.now(),
      result: {
        rawText: '',
        words: [],
        language: 'en',
        modelVersion: 'tesseract-5',
        pageCount: 1,
        durationMs: 100,
      },
    };

    _activeJobs.set([job]);
    _activeJobId.set('j-test');

    const el = makeContainer();
    mounted = mount(OcrReviewPanel, { target: el });

    await Promise.resolve();

    const saveBtn = el.querySelector<HTMLButtonElement>('.btn--primary');
    expect(saveBtn).not.toBeNull();
    expect(saveBtn!.disabled).toBe(true);
  });

  it('"Save as Note" button is enabled when editedText is non-empty', async () => {
    const job = {
      id: 'j-test2',
      imagePath: '/vault/.bismuth/ocr-temp/test2.jpg',
      language: 'en',
      modelPath: '',
      status: 'complete',
      createdAt: Date.now(),
      result: {
        rawText: 'Some recognized text',
        words: [],
        language: 'en',
        modelVersion: 'tesseract-5',
        pageCount: 1,
        durationMs: 150,
      },
    };

    _activeJobs.set([job]);
    _activeJobId.set('j-test2');

    const el = makeContainer();
    mounted = mount(OcrReviewPanel, { target: el });

    await Promise.resolve();

    const saveBtn = el.querySelector<HTMLButtonElement>('.btn--primary');
    expect(saveBtn).not.toBeNull();
    expect(saveBtn!.disabled).toBe(false);
  });
});
