/**
 * T035 — Integration test: generate doc from canvas → retrieve via MCP → validate round-trip.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateDocuments } from '@/features/canvas/services/documentGenerator';
import {
  handleGetDesignDocument,
  handlePutDesignDocument,
  handleListDesignDocuments,
} from './documentTools';
import type { CanvasDocument, CanvasVariable, Page } from '@/features/canvas/types';
import type { DesignDocumentAny } from '@/types/design-documents';

// Mock the design-docs store used by MCP handlers
const mockStore: Map<string, DesignDocumentAny> = new Map();

vi.mock('@/services/design-docs', () => ({
  readDocument: vi.fn((_type: string, id: string) => {
    return Promise.resolve(mockStore.get(id) || null);
  }),
  writeDocument: vi.fn((doc: DesignDocumentAny) => {
    mockStore.set(doc.document_id, doc);
    return Promise.resolve(true);
  }),
  listDocuments: vi.fn((type?: string) => {
    const docs = Array.from(mockStore.values());
    const filtered = type ? docs.filter((d) => d.document_type === type) : docs;
    return Promise.resolve(
      filtered.map((d) => ({
        document_type: d.document_type,
        document_id: d.document_id,
        name: d.name,
        version: d.version,
        modified_at: d.modified_at || '',
      }))
    );
  }),
}));

vi.mock('@/services/design-docs/validation', () => ({
  validateDocument: vi.fn(() => ({ valid: true, errors: [] })),
}));

function mockCanvasDoc(): CanvasDocument {
  const pages: Page[] = [
    { id: 'page_tokens', name: 'Tokens', order: 0, elements: [] },
    { id: 'page_components', name: 'Components', order: 1, elements: [] },
    { id: 'page_layouts', name: 'Layouts', order: 2, elements: [] },
    { id: 'page_flows', name: 'Flows', order: 3, elements: [] },
    { id: 'page_pages', name: 'Pages', order: 4, elements: [] },
    { id: 'page_sandbox', name: 'Sandbox', order: 5, elements: [] },
  ];

  const variables: CanvasVariable[] = [
    {
      id: 'v1',
      name: 'primary',
      type: 'color',
      collection: 'Colors',
      values: { Light: '#3b82f6', Dark: '#60a5fa' },
      scopes: ['fill'],
    },
    {
      id: 'v2',
      name: 'spacing-m',
      type: 'number',
      collection: 'Spacing',
      values: { default: 16 },
      scopes: ['spacing'],
    },
  ];

  return {
    id: 'canvas_roundtrip_001',
    name: 'Roundtrip Test',
    vault_id: null,
    note_id: null,
    viewport: { x: 0, y: 0, scale: 1 },
    grid_size: 8,
    snap_to_grid: true,
    elements: [],
    layers: [{ id: 'layer_1', name: 'Default', z_order: 0, visible: true, locked: false }],
    pages,
    activePageId: 'page_tokens',
    components: [],
    flowLinks: [],
    styles: [],
    variables,
    created_at: 1000,
    modified_at: 2000,
  };
}

describe('MCP round-trip integration', () => {
  beforeEach(() => {
    mockStore.clear();
    vi.clearAllMocks();
  });

  it('generates docs from canvas and retrieves them via MCP get', async () => {
    // Step 1: Generate design documents from canvas
    const canvas = mockCanvasDoc();
    const docs = generateDocuments(canvas);
    expect(docs.length).toBeGreaterThan(0);

    // Step 2: Write docs via MCP put_design_document
    for (const doc of docs) {
      const putResult = await handlePutDesignDocument({ document: doc });
      expect(putResult.success).toBe(true);
    }

    // Step 3: Retrieve via MCP get_design_document
    const tokenDoc = docs.find((d) => d.document_type === 'token')!;
    const getResult = await handleGetDesignDocument({
      type: tokenDoc.document_type,
      id: tokenDoc.document_id,
    });
    expect(getResult.success).toBe(true);
    expect(getResult.document).toBeDefined();

    // Step 4: Verify the retrieved document matches what was generated
    const retrieved = getResult.document as DesignDocumentAny;
    expect(retrieved.document_type).toBe(tokenDoc.document_type);
    expect(retrieved.document_id).toBe(tokenDoc.document_id);
    expect(retrieved.payload).toEqual(tokenDoc.payload);
    expect(retrieved.canvas_source.document_id).toBe('canvas_roundtrip_001');
  });

  it('lists generated documents via MCP list_design_documents', async () => {
    const canvas = mockCanvasDoc();
    const docs = generateDocuments(canvas);

    // Store all docs
    for (const doc of docs) {
      await handlePutDesignDocument({ document: doc });
    }

    // List all
    const listResult = await handleListDesignDocuments({});
    expect(listResult.success).toBe(true);
    expect(listResult.documents.length).toBe(docs.length);

    // List filtered by type
    const tokenList = await handleListDesignDocuments({ type: 'token' });
    expect(tokenList.documents.every((d) => d.document_type === 'token')).toBe(true);
  });

  it('preserves canvas_source through the round-trip', async () => {
    const canvas = mockCanvasDoc();
    const docs = generateDocuments(canvas);
    const tokenDoc = docs.find((d) => d.document_type === 'token')!;

    await handlePutDesignDocument({ document: tokenDoc });
    const getResult = await handleGetDesignDocument({ type: 'token', id: tokenDoc.document_id });

    const retrieved = getResult.document as DesignDocumentAny;
    expect(retrieved.canvas_source).toEqual({
      document_id: 'canvas_roundtrip_001',
      page_id: 'page_tokens',
      frame_ids: [],
    });
  });

  it('handles get for non-existent document gracefully', async () => {
    const result = await handleGetDesignDocument({ type: 'token', id: 'nonexistent' });
    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });
});
