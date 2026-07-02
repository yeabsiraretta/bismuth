/**
 * T24 — OCR service wrapper unit tests.
 *
 * Mocks @tauri-apps/api/core invoke to verify each service function calls the
 * correct command string and passes the expected argument shape.
 *
 * No real Tauri IPC is invoked — the vite.config.ts alias maps the package to
 * src/__mocks__/@tauri-apps/api/core.ts which exports a vi.fn().
 *
 * Coverage targets (per T24): importImage, cleanupOcrTemp, appendCorrection,
 * getCorrections — 90%+ line coverage for ocr.ts.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock logger first so no output noise
vi.mock('@/utils/logger', () => ({
  log: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// The vite.config alias already resolves @tauri-apps/api/core to the mock file,
// but we also call vi.mock so clearAllMocks() resets call state between tests.
vi.mock('@tauri-apps/api/core');

import { invoke } from '@tauri-apps/api/core';
import { importImage, cleanupOcrTemp, appendCorrection, getCorrections } from '../services/ocr';
import type { CorrectionEntry } from '../types/ocr';

const mockEntry: CorrectionEntry = {
  imageHash: 'abc123',
  language: 'en',
  rawOcr: 'hello wrld',
  corrected: 'hello world',
  timestamp: 1718000000,
  source: 'user',
};

describe('ocr.service — importImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('invokes import_image with the correct command string', async () => {
    vi.mocked(invoke).mockResolvedValueOnce({
      jobId: 'ocr-1',
      stagedPath: '/vault/.bismuth/ocr-temp/abc.jpg',
      language: 'en',
    });

    await importImage('/home/user/photo.jpg', 'en', '/vault');

    expect(invoke).toHaveBeenCalledWith('import_image', {
      sourcePath: '/home/user/photo.jpg',
      language: 'en',
      vaultRoot: '/vault',
    });
  });

  it('returns the job payload from invoke', async () => {
    const payload = {
      jobId: 'ocr-2',
      stagedPath: '/vault/.bismuth/ocr-temp/x.png',
      language: 'am',
    };
    vi.mocked(invoke).mockResolvedValueOnce(payload);

    const result = await importImage('/img.png', 'am', '/vault');

    expect(result).toEqual(payload);
  });

  it('propagates rejection from invoke', async () => {
    vi.mocked(invoke).mockRejectedValueOnce(new Error('vault locked'));

    await expect(importImage('/img.png', 'en', '/vault')).rejects.toThrow('vault locked');
  });
});

describe('ocr.service — cleanupOcrTemp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('invokes cleanup_ocr_temp with stagedPath and vaultRoot', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(undefined);

    await cleanupOcrTemp('/vault/.bismuth/ocr-temp/abc.jpg', '/vault');

    expect(invoke).toHaveBeenCalledWith('cleanup_ocr_temp', {
      stagedPath: '/vault/.bismuth/ocr-temp/abc.jpg',
      vaultRoot: '/vault',
    });
  });

  it('resolves to undefined on success', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(undefined);

    const result = await cleanupOcrTemp('/vault/.bismuth/ocr-temp/abc.jpg', '/vault');

    expect(result).toBeUndefined();
  });

  it('propagates rejection from invoke', async () => {
    vi.mocked(invoke).mockRejectedValueOnce(new Error('path outside vault'));

    await expect(cleanupOcrTemp('/tmp/external.jpg', '/vault')).rejects.toThrow(
      'path outside vault'
    );
  });
});

describe('ocr.service — appendCorrection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('invokes append_ocr_correction with correct args', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(undefined);

    await appendCorrection('/vault', 'en', mockEntry);

    expect(invoke).toHaveBeenCalledWith('append_ocr_correction', {
      vaultRoot: '/vault',
      language: 'en',
      entry: mockEntry,
    });
  });

  it('forwards Amharic language code unchanged', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(undefined);

    const amEntry: CorrectionEntry = { ...mockEntry, language: 'am' };
    await appendCorrection('/vault', 'am', amEntry);

    expect(invoke).toHaveBeenCalledWith('append_ocr_correction', {
      vaultRoot: '/vault',
      language: 'am',
      entry: amEntry,
    });
  });

  it('propagates rejection from invoke', async () => {
    vi.mocked(invoke).mockRejectedValueOnce(new Error('write error'));

    await expect(appendCorrection('/vault', 'en', mockEntry)).rejects.toThrow('write error');
  });
});

describe('ocr.service — getCorrections', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('invokes get_ocr_corrections with vaultRoot, language, and n', async () => {
    vi.mocked(invoke).mockResolvedValueOnce([mockEntry]);

    await getCorrections('/vault', 'en', 10);

    expect(invoke).toHaveBeenCalledWith('get_ocr_corrections', {
      vaultRoot: '/vault',
      language: 'en',
      n: 10,
    });
  });

  it('returns the corrections array from invoke', async () => {
    const entries: CorrectionEntry[] = [mockEntry, { ...mockEntry, imageHash: 'def456' }];
    vi.mocked(invoke).mockResolvedValueOnce(entries);

    const result = await getCorrections('/vault', 'en', 20);

    expect(result).toHaveLength(2);
    expect(result[0].imageHash).toBe('abc123');
    expect(result[1].imageHash).toBe('def456');
  });

  it('returns an empty array when invoke resolves with []', async () => {
    vi.mocked(invoke).mockResolvedValueOnce([]);

    const result = await getCorrections('/vault', 'en', 5);

    expect(result).toEqual([]);
  });

  it('propagates rejection from invoke', async () => {
    vi.mocked(invoke).mockRejectedValueOnce(new Error('read error'));

    await expect(getCorrections('/vault', 'en', 5)).rejects.toThrow('read error');
  });

  it('respects the n cap — passes the given limit to invoke unchanged', async () => {
    vi.mocked(invoke).mockResolvedValueOnce([]);

    await getCorrections('/vault', 'am', 3);

    expect(invoke).toHaveBeenCalledWith('get_ocr_corrections', expect.objectContaining({ n: 3 }));
  });
});
