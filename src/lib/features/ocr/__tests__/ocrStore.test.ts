/**
 * T25 — OCR store state transition tests.
 *
 * Verifies: initial state, addJob, updateJob, removeJob, clearCompleted.
 * The settings store is mocked so ocrEnabled derivation is predictable.
 * Tauri IPC is not involved — store actions are pure in-memory operations.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/utils/logger', () => ({
  log: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Provide a predictable settings store mock. vi.mock is hoisted, so the factory
// must not reference top-level variables. We inline the writable creation.
vi.mock('@/features/settings', async () => {
  const { writable: w } = await import('svelte/store');
  return { settings: w<Record<string, unknown>>({ ocrEnabled: false }) };
});

import { writable } from 'svelte/store';
import * as settingsMock from '@/features/settings';

// Typed accessor for the mocked settings store
const _settingsStore = settingsMock.settings as unknown as ReturnType<typeof writable<Record<string, unknown>>>;

// ─── Import after mocks ───────────────────────────────────────────────────────

import {
  activeJobs,
  activeJobId,
  ocrEnabled,
  addJob,
  updateJob,
  removeJob,
  clearCompleted,
} from '../stores/ocrStore';
import type { OcrJob } from '../types/ocr';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeJob(id: string, status: OcrJob['status'] = 'queued'): OcrJob {
  return {
    id,
    imagePath: `/vault/.bismuth/ocr-temp/${id}.jpg`,
    language: 'en',
    modelPath: '',
    status,
    createdAt: Date.now(),
  };
}

function resetStores(): void {
  activeJobs.set([]);
  activeJobId.set(null);
  _settingsStore.set({ ocrEnabled: false });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ocrStore — initial state', () => {
  beforeEach(() => {
    resetStores();
    vi.clearAllMocks();
  });

  it('starts with an empty job list', () => {
    expect(get(activeJobs)).toHaveLength(0);
  });

  it('starts with no active job id', () => {
    expect(get(activeJobId)).toBeNull();
  });

  it('ocrEnabled is false when settings.ocrEnabled is false', () => {
    _settingsStore.set({ ocrEnabled: false });
    expect(get(ocrEnabled)).toBe(false);
  });

  it('ocrEnabled is true when settings.ocrEnabled is true', () => {
    _settingsStore.set({ ocrEnabled: true });
    expect(get(ocrEnabled)).toBe(true);
  });
});

describe('ocrStore — addJob', () => {
  beforeEach(() => {
    resetStores();
    vi.clearAllMocks();
  });

  it('appends a job to the jobs list', () => {
    const job = makeJob('j1');
    addJob(job);
    expect(get(activeJobs)).toHaveLength(1);
    expect(get(activeJobs)[0].id).toBe('j1');
  });

  it('appends multiple jobs in order', () => {
    addJob(makeJob('j1'));
    addJob(makeJob('j2'));
    addJob(makeJob('j3'));
    const ids = get(activeJobs).map((j) => j.id);
    expect(ids).toEqual(['j1', 'j2', 'j3']);
  });

  it('stores the job with the correct id and status', () => {
    const job = makeJob('j1');
    addJob(job);
    expect(get(activeJobs)[0].id).toBe('j1');
    expect(get(activeJobs)[0].status).toBe('queued');
  });
});

describe('ocrStore — updateJob', () => {
  beforeEach(() => {
    resetStores();
    vi.clearAllMocks();
  });

  it('patches only the matching job by id', () => {
    addJob(makeJob('j1', 'queued'));
    addJob(makeJob('j2', 'queued'));

    updateJob('j1', { status: 'running' });

    const jobs = get(activeJobs);
    expect(jobs.find((j) => j.id === 'j1')?.status).toBe('running');
    expect(jobs.find((j) => j.id === 'j2')?.status).toBe('queued');
  });

  it('does not change the jobs list length', () => {
    addJob(makeJob('j1'));
    addJob(makeJob('j2'));

    updateJob('j1', { status: 'complete' });

    expect(get(activeJobs)).toHaveLength(2);
  });

  it('merges partial patch without removing unpatched fields', () => {
    const job = makeJob('j1', 'running');
    addJob(job);

    const now = Date.now();
    updateJob('j1', { status: 'complete', completedAt: now });

    const updated = get(activeJobs)[0];
    expect(updated.status).toBe('complete');
    expect(updated.completedAt).toBe(now);
    expect(updated.imagePath).toBe(job.imagePath);
  });

  it('is a no-op when the id does not match any job', () => {
    addJob(makeJob('j1'));
    updateJob('unknown-id', { status: 'error' });
    expect(get(activeJobs)[0].status).toBe('queued');
  });

  it('can attach an error string to a job', () => {
    addJob(makeJob('j1', 'running'));
    updateJob('j1', { status: 'error', error: 'vault locked' });

    const job = get(activeJobs)[0];
    expect(job.status).toBe('error');
    expect(job.error).toBe('vault locked');
  });
});

describe('ocrStore — removeJob', () => {
  beforeEach(() => {
    resetStores();
    vi.clearAllMocks();
  });

  it('removes the job with the matching id', () => {
    addJob(makeJob('j1'));
    addJob(makeJob('j2'));

    removeJob('j1');

    const ids = get(activeJobs).map((j) => j.id);
    expect(ids).not.toContain('j1');
    expect(ids).toContain('j2');
  });

  it('clears activeJobId when the removed job was active', () => {
    addJob(makeJob('j1'));
    activeJobId.set('j1');

    removeJob('j1');

    expect(get(activeJobId)).toBeNull();
  });

  it('does not clear activeJobId when a different job is removed', () => {
    addJob(makeJob('j1'));
    addJob(makeJob('j2'));
    activeJobId.set('j2');

    removeJob('j1');

    expect(get(activeJobId)).toBe('j2');
  });

  it('is safe to call on an id that does not exist', () => {
    addJob(makeJob('j1'));
    removeJob('no-such-id');
    expect(get(activeJobs)).toHaveLength(1);
  });
});

describe('ocrStore — clearCompleted', () => {
  beforeEach(() => {
    resetStores();
    vi.clearAllMocks();
  });

  it('removes jobs with status complete', () => {
    addJob(makeJob('j1', 'queued'));
    addJob(makeJob('j2', 'complete'));
    addJob(makeJob('j3', 'running'));

    clearCompleted();

    const ids = get(activeJobs).map((j) => j.id);
    expect(ids).not.toContain('j2');
    expect(ids).toContain('j1');
    expect(ids).toContain('j3');
  });

  it('removes jobs with status error', () => {
    addJob(makeJob('j1', 'running'));
    addJob(makeJob('j2', 'error'));

    clearCompleted();

    const ids = get(activeJobs).map((j) => j.id);
    expect(ids).not.toContain('j2');
    expect(ids).toContain('j1');
  });

  it('keeps queued and running jobs', () => {
    addJob(makeJob('j1', 'queued'));
    addJob(makeJob('j2', 'running'));
    addJob(makeJob('j3', 'complete'));
    addJob(makeJob('j4', 'error'));

    clearCompleted();

    const jobs = get(activeJobs);
    expect(jobs).toHaveLength(2);
    expect(jobs.map((j) => j.id)).toEqual(['j1', 'j2']);
  });

  it('results in an empty list when all jobs are terminal', () => {
    addJob(makeJob('j1', 'complete'));
    addJob(makeJob('j2', 'error'));

    clearCompleted();

    expect(get(activeJobs)).toHaveLength(0);
  });

  it('is safe on an already-empty list', () => {
    clearCompleted();
    expect(get(activeJobs)).toHaveLength(0);
  });
});
