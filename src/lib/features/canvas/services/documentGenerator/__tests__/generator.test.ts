/**
 * Integration test for generateDocuments — validates full pipeline from mock canvas to output docs.
 */

import { describe, it, expect } from 'vitest';
import { generateDocuments } from '../index';
import type { CanvasDocument, CanvasVariable, Page } from '@/features/canvas/types';
import type { ComponentDefinition, FlowLink } from '@/features/canvas/types/components';
import type { CanvasElement } from '@/features/canvas/types/elements';

function mockCanvasDoc(overrides: Partial<CanvasDocument> = {}): CanvasDocument {
  const pages: Page[] = [
    { id: 'page_tokens', name: 'Tokens', order: 0, elements: [] },
    { id: 'page_components', name: 'Components', order: 1, elements: [] },
    { id: 'page_layouts', name: 'Layouts', order: 2, elements: [] },
    { id: 'page_flows', name: 'Flows', order: 3, elements: [] },
    { id: 'page_pages', name: 'Pages', order: 4, elements: [] },
    { id: 'page_sandbox', name: 'Sandbox', order: 5, elements: [] },
  ];

  return {
    id: 'canvas_test_001',
    name: 'Test Design System',
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
    variables: [],
    created_at: 1000,
    modified_at: 2000,
    ...overrides,
  };
}

const sampleVariables: CanvasVariable[] = [
  { id: 'v1', name: 'primary', type: 'color', collection: 'Colors', values: { Light: '#3b82f6', Dark: '#60a5fa' }, scopes: ['fill'] },
  { id: 'v2', name: 'background', type: 'color', collection: 'Colors', values: { Light: '#ffffff', Dark: '#1f2937' }, scopes: ['fill'] },
  { id: 'v3', name: 'base', type: 'number', collection: 'Spacing', values: { default: 16 }, scopes: ['spacing'] },
];

const sampleComponent: ComponentDefinition = {
  id: 'btn_1',
  name: 'Button',
  description: 'Primary action button',
  elements: [] as unknown as CanvasElement[],
  exposedProps: [{ key: 'label', label: 'Label', type: 'text', defaultValue: 'Click' }],
  width: 120,
  height: 40,
  created_at: 1000,
  modified_at: 2000,
};

const sampleFlowLinks: FlowLink[] = [
  {
    id: 'fl_1',
    fromFrameId: 'frame_a',
    toFrameId: 'frame_b',
    transition: { type: 'dissolve', duration: 300 },
    label: 'Submit',
  },
];

describe('generateDocuments (integration)', () => {
  it('returns empty array for empty canvas', () => {
    const canvas = mockCanvasDoc();
    const docs = generateDocuments(canvas);
    expect(docs).toEqual([]);
  });

  it('generates a token document when variables are present', () => {
    const canvas = mockCanvasDoc({ variables: sampleVariables });
    const docs = generateDocuments(canvas);
    const tokenDoc = docs.find((d) => d.document_type === 'token');
    expect(tokenDoc).toBeDefined();
    expect(tokenDoc!.document_id).toBe('tok_001');
    expect(tokenDoc!.name).toContain('Tokens');
    expect(tokenDoc!.canvas_source.document_id).toBe('canvas_test_001');
  });

  it('generates a theme document when multi-mode variables exist', () => {
    const canvas = mockCanvasDoc({ variables: sampleVariables });
    const docs = generateDocuments(canvas);
    const themeDocs = docs.filter((d) => d.document_type === 'theme');
    expect(themeDocs.length).toBeGreaterThanOrEqual(1);
    const darkTheme = themeDocs.find((d) => d.document_id === 'theme_dark');
    expect(darkTheme).toBeDefined();
  });

  it('generates component documents for each definition', () => {
    const canvas = mockCanvasDoc({ components: [sampleComponent] });
    const docs = generateDocuments(canvas);
    const compDocs = docs.filter((d) => d.document_type === 'component');
    expect(compDocs).toHaveLength(1);
    expect(compDocs[0].document_id).toBe('comp_btn_1');
    expect(compDocs[0].name).toBe('Button');
  });

  it('generates flow document when flowLinks are present', () => {
    const canvas = mockCanvasDoc({ flowLinks: sampleFlowLinks });
    const docs = generateDocuments(canvas);
    const flowDocs = docs.filter((d) => d.document_type === 'flow');
    expect(flowDocs).toHaveLength(1);
    expect(flowDocs[0].name).toContain('Flow');
  });

  it('produces documents with valid envelope structure', () => {
    const canvas = mockCanvasDoc({ variables: sampleVariables, components: [sampleComponent] });
    const docs = generateDocuments(canvas);
    for (const doc of docs) {
      expect(doc).toHaveProperty('schema_version');
      expect(doc).toHaveProperty('document_type');
      expect(doc).toHaveProperty('document_id');
      expect(doc).toHaveProperty('canvas_source');
      expect(doc).toHaveProperty('version');
      expect(doc).toHaveProperty('payload');
      expect(doc.canvas_source).toHaveProperty('document_id');
      expect(doc.canvas_source).toHaveProperty('page_id');
    }
  });

  it('sets correct page_id references in canvas_source', () => {
    const canvas = mockCanvasDoc({ variables: sampleVariables, components: [sampleComponent] });
    const docs = generateDocuments(canvas);
    const tokenDoc = docs.find((d) => d.document_type === 'token')!;
    expect(tokenDoc.canvas_source.page_id).toBe('page_tokens');
    const compDoc = docs.find((d) => d.document_type === 'component')!;
    expect(compDoc.canvas_source.page_id).toBe('page_components');
  });

  it('handles a fully populated canvas with all document types', () => {
    const canvas = mockCanvasDoc({
      variables: sampleVariables,
      components: [sampleComponent],
      flowLinks: sampleFlowLinks,
    });
    const docs = generateDocuments(canvas);
    const types = new Set(docs.map((d) => d.document_type));
    expect(types.has('token')).toBe(true);
    expect(types.has('component')).toBe(true);
    expect(types.has('flow')).toBe(true);
    expect(types.has('theme')).toBe(true);
  });
});
