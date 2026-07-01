/**
 * Unit tests for design document store CRUD operations.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { readDocument, writeDocument, listDocuments, deleteDocument } from '../store';
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
  payload: { collections: [] },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('readDocument', () => {
  it('returns parsed document on success', async () => {
    vi.mocked(invoke).mockResolvedValue(JSON.stringify(mockDoc));
    const result = await readDocument('token', 'tok_001');
    expect(result).toEqual(mockDoc);
    expect(invoke).toHaveBeenCalledWith('design_doc_read', {
      path: '.bismuth/design-docs/tokens.json',
    });
  });

  it('returns null when invoke rejects', async () => {
    vi.mocked(invoke).mockRejectedValue(new Error('Not found'));
    const result = await readDocument('token', 'nonexistent');
    expect(result).toBeNull();
  });

  it('builds correct path for component type', async () => {
    vi.mocked(invoke).mockRejectedValue(new Error('Not found'));
    await readDocument('component', 'btn_001');
    expect(invoke).toHaveBeenCalledWith('design_doc_read', {
      path: '.bismuth/design-docs/components/btn_001.json',
    });
  });
});

describe('writeDocument', () => {
  it('returns true on successful write', async () => {
    vi.mocked(invoke).mockResolvedValue(undefined);
    const result = await writeDocument(mockDoc);
    expect(result).toBe(true);
  });

  it('invokes design_doc_write with path and content', async () => {
    vi.mocked(invoke).mockResolvedValue(undefined);
    await writeDocument(mockDoc);
    expect(invoke).toHaveBeenCalledWith(
      'design_doc_write',
      expect.objectContaining({
        path: '.bismuth/design-docs/tokens.json',
        content: expect.stringContaining('"tok_001"'),
      })
    );
  });

  it('increments version number', async () => {
    vi.mocked(invoke).mockResolvedValue(undefined);
    await writeDocument(mockDoc);
    const call = vi.mocked(invoke).mock.calls[0];
    const content = JSON.parse((call[1] as { content: string }).content);
    expect(content.version).toBe(2);
  });

  it('returns false on error', async () => {
    vi.mocked(invoke).mockRejectedValue(new Error('fail'));
    const result = await writeDocument(mockDoc);
    expect(result).toBe(false);
  });
});

describe('listDocuments', () => {
  it('returns document list on success', async () => {
    const mockMeta = [
      { document_type: 'token', document_id: 'tok_001', name: 'Test', version: 1, modified_at: '' },
    ];
    vi.mocked(invoke).mockResolvedValue(mockMeta);
    const result = await listDocuments('token');
    expect(result).toEqual(mockMeta);
    expect(invoke).toHaveBeenCalledWith('design_doc_list', {
      basePath: '.bismuth/design-docs',
      docType: 'token',
    });
  });

  it('passes null docType when no filter', async () => {
    vi.mocked(invoke).mockResolvedValue([]);
    await listDocuments();
    expect(invoke).toHaveBeenCalledWith('design_doc_list', {
      basePath: '.bismuth/design-docs',
      docType: null,
    });
  });

  it('returns empty array on error', async () => {
    vi.mocked(invoke).mockRejectedValue(new Error('fail'));
    const result = await listDocuments();
    expect(result).toEqual([]);
  });
});

describe('deleteDocument', () => {
  it('returns true on successful delete', async () => {
    vi.mocked(invoke).mockResolvedValue(undefined);
    const result = await deleteDocument('component', 'comp_1');
    expect(result).toBe(true);
  });

  it('returns false on error', async () => {
    vi.mocked(invoke).mockRejectedValue(new Error('fail'));
    const result = await deleteDocument('component', 'comp_1');
    expect(result).toBe(false);
  });

  it('uses correct path for component type', async () => {
    vi.mocked(invoke).mockResolvedValue(undefined);
    await deleteDocument('component', 'comp_1');
    expect(invoke).toHaveBeenCalledWith('design_doc_delete', {
      path: '.bismuth/design-docs/components/comp_1.json',
    });
  });
});
