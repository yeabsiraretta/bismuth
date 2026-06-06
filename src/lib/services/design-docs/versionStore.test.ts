/**
 * Unit tests for version store (save/list/get/rollback).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { saveVersion, listVersions, getVersion, rollbackToVersion } from './versionStore';
import type { DesignDocumentAny } from '@/types/design-documents';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));

const mockDoc: DesignDocumentAny = {
  schema_version: '1.0.0',
  document_type: 'token',
  document_id: 'tok_001',
  name: 'Test Tokens',
  canvas_source: { document_id: 'doc_1', page_id: 'page_1', frame_ids: [] },
  created_at: '2026-01-01T00:00:00Z',
  modified_at: '2026-01-01T00:00:00Z',
  version: 1,
  payload: { collections: [{ name: 'colors', tokens: [] }] },
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('saveVersion', () => {
  it('writes version history for new document', async () => {
    vi.mocked(invoke)
      .mockRejectedValueOnce(new Error('Not found')) // no existing history
      .mockResolvedValueOnce(undefined); // write succeeds

    await saveVersion(mockDoc);
    expect(invoke).toHaveBeenCalledTimes(2);
    const writeCall = vi.mocked(invoke).mock.calls[1];
    expect(writeCall[0]).toBe('design_doc_write');
    const { content } = writeCall[1] as { content: string };
    const history = JSON.parse(content);
    expect(history.versions).toHaveLength(1);
    expect(history.versions[0].version).toBe(1);
  });

  it('appends to existing history', async () => {
    const existingHistory = {
      document_type: 'token',
      document_id: 'tok_001',
      versions: [{ version: 1, timestamp: '2026-01-01T00:00:00Z', payload: {} }],
    };
    vi.mocked(invoke)
      .mockResolvedValueOnce(JSON.stringify(existingHistory)) // read succeeds
      .mockResolvedValueOnce(undefined); // write succeeds

    await saveVersion({ ...mockDoc, version: 2 });
    const writeCall = vi.mocked(invoke).mock.calls[1];
    const { content } = writeCall[1] as { content: string };
    const history = JSON.parse(content);
    expect(history.versions).toHaveLength(2);
  });
});

describe('listVersions', () => {
  it('returns versions on success', async () => {
    const history = {
      versions: [
        { version: 1, timestamp: '2026-01-01', payload: {} },
        { version: 2, timestamp: '2026-01-02', payload: {} },
      ],
    };
    vi.mocked(invoke).mockResolvedValue(JSON.stringify(history));
    const result = await listVersions('token', 'tok_001');
    expect(result).toHaveLength(2);
  });

  it('returns empty when not found', async () => {
    vi.mocked(invoke).mockRejectedValue(new Error('Not found'));
    const result = await listVersions('token', 'nonexistent');
    expect(result).toEqual([]);
  });
});

describe('getVersion', () => {
  it('returns payload for specific version', async () => {
    const history = {
      versions: [
        { version: 1, timestamp: '2026-01-01', payload: { data: 'v1' } },
        { version: 2, timestamp: '2026-01-02', payload: { data: 'v2' } },
      ],
    };
    vi.mocked(invoke).mockResolvedValue(JSON.stringify(history));
    const result = await getVersion('token', 'tok_001', 2);
    expect(result).toEqual({ data: 'v2' });
  });

  it('returns null for non-existent version', async () => {
    const history = { versions: [{ version: 1, timestamp: '', payload: {} }] };
    vi.mocked(invoke).mockResolvedValue(JSON.stringify(history));
    const result = await getVersion('token', 'tok_001', 99);
    expect(result).toBeNull();
  });
});

describe('rollbackToVersion', () => {
  it('returns the payload of the requested version', async () => {
    const history = {
      versions: [{ version: 1, timestamp: '', payload: { old: true } }],
    };
    vi.mocked(invoke).mockResolvedValue(JSON.stringify(history));
    const result = await rollbackToVersion('token', 'tok_001', 1);
    expect(result).toEqual({ old: true });
  });
});
