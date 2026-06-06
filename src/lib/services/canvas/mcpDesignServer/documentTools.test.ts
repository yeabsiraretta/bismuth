/**
 * Unit tests for MCP document tool handlers.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  handleGetDesignDocument,
  handleListDesignDocuments,
  handlePutDesignDocument,
  handleDiffDesignDocument,
  handleSyncDesignState,
  DOCUMENT_TOOLS,
} from './documentTools';

const validDoc = {
  schema_version: '1.0.0',
  document_type: 'token' as const,
  document_id: 'tok_001',
  name: 'Test',
  canvas_source: { document_id: 'd1', page_id: 'p1', frame_ids: [] },
  created_at: '2026-01-01T00:00:00Z',
  modified_at: '2026-01-01T00:00:00Z',
  version: 1,
  payload: { collections: [] },
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('handleGetDesignDocument', () => {
  it('returns document on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify(validDoc)),
    }));
    const result = await handleGetDesignDocument({ type: 'token', id: 'tok_001' });
    expect(result.success).toBe(true);
    expect(result.document).toBeDefined();
  });

  it('returns error when not found', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    const result = await handleGetDesignDocument({ type: 'token', id: 'missing' });
    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });
});

describe('handleListDesignDocuments', () => {
  it('returns list of documents', async () => {
    const mockMeta = [{ document_type: 'token', document_id: 'tok_001', name: 'T', version: 1, modified_at: '' }];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(mockMeta) }));
    const result = await handleListDesignDocuments({ type: 'token' });
    expect(result.success).toBe(true);
    expect(result.documents).toHaveLength(1);
  });

  it('returns empty list when no documents', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve([]) }));
    const result = await handleListDesignDocuments({});
    expect(result.success).toBe(true);
    expect(result.documents).toHaveLength(0);
  });
});

describe('handlePutDesignDocument', () => {
  it('succeeds with valid document', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
    const result = await handlePutDesignDocument({ document: validDoc });
    expect(result.success).toBe(true);
  });

  it('fails with invalid document', async () => {
    const result = await handlePutDesignDocument({ document: { bad: true } });
    expect(result.success).toBe(false);
    expect(result.error).toContain('Validation failed');
  });
});

describe('handleDiffDesignDocument', () => {
  it('returns diff for existing document', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify(validDoc)),
    }));
    const result = await handleDiffDesignDocument({ type: 'token', id: 'tok_001' });
    expect(result.success).toBe(true);
    expect(result.diff).toBeDefined();
  });

  it('returns error for missing document', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    const result = await handleDiffDesignDocument({ type: 'token', id: 'missing' });
    expect(result.success).toBe(false);
  });
});

describe('handleSyncDesignState', () => {
  it('returns success message for canvas_to_code', async () => {
    const result = await handleSyncDesignState({ direction: 'canvas_to_code' });
    expect(result.success).toBe(true);
    expect(result.message).toContain('canvas_to_code');
  });

  it('returns success message for code_to_canvas', async () => {
    const result = await handleSyncDesignState({ direction: 'code_to_canvas' });
    expect(result.success).toBe(true);
    expect(result.message).toContain('code_to_canvas');
  });
});

describe('DOCUMENT_TOOLS manifest', () => {
  it('defines 5 tools', () => {
    expect(DOCUMENT_TOOLS).toHaveLength(5);
  });

  it('each tool has name, description, and inputSchema', () => {
    for (const tool of DOCUMENT_TOOLS) {
      expect(tool.name).toBeDefined();
      expect(tool.description).toBeDefined();
      expect(tool.inputSchema).toBeDefined();
    }
  });

  it('includes all expected tool names', () => {
    const names = DOCUMENT_TOOLS.map((t) => t.name);
    expect(names).toContain('get_design_document');
    expect(names).toContain('list_design_documents');
    expect(names).toContain('put_design_document');
    expect(names).toContain('diff_design_document');
    expect(names).toContain('sync_design_state');
  });
});
