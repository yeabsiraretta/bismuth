import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportToSVG, exportToJSON, importFromJSON, downloadFile, downloadSVG } from '../export';
import type { CanvasDocument, CanvasElement, ElementType } from '@/features/canvas/types';

vi.mock('@/utils/logger', () => ({
  log: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

function makeElement(overrides: Partial<CanvasElement> = {}): CanvasElement {
  return {
    id: 'el-1',
    element_type: 'rectangle',
    x: 10,
    y: 20,
    width: 100,
    height: 50,
    rotation: 0,
    properties: { fill: '#ff0000', stroke: '#000000', strokeWidth: 1, opacity: 1 },
    layer_id: 'layer-1',
    z_index: 0,
    locked: false,
    visible: true,
    ...overrides,
  } as CanvasElement;
}

function makeDocument(overrides: Partial<CanvasDocument> = {}): CanvasDocument {
  return {
    id: 'doc-1',
    name: 'Test Canvas',
    vault_id: null,
    note_id: null,
    viewport: { x: 0, y: 0, scale: 1 },
    grid_size: 10,
    snap_to_grid: false,
    elements: [],
    layers: [],
    pages: [],
    activePageId: 'page-1',
    components: [],
    styles: [],
    variables: [],
    created_at: 0,
    modified_at: 0,
    ...overrides,
  } as CanvasDocument;
}

// ---- exportToSVG ----

describe('exportToSVG', () => {
  it('returns valid SVG string', () => {
    const doc = makeDocument({ elements: [makeElement()] });
    const svg = exportToSVG(doc);
    expect(svg).toContain('<?xml version="1.0"');
    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('</svg>');
  });

  it('renders rectangle elements', () => {
    const el = makeElement({
      id: 'r1',
      element_type: 'rectangle',
      x: 0,
      y: 0,
      width: 50,
      height: 50,
    });
    const svg = exportToSVG(makeDocument({ elements: [el] }));
    expect(svg).toContain('<rect');
  });

  it('renders circle elements', () => {
    const el = makeElement({ id: 'c1', element_type: 'circle', x: 0, y: 0, width: 60, height: 60 });
    const svg = exportToSVG(makeDocument({ elements: [el] }));
    expect(svg).toContain('<circle');
  });

  it('renders text elements', () => {
    const el = makeElement({
      id: 't1',
      element_type: 'text',
      x: 0,
      y: 0,
      width: 100,
      height: 30,
      properties: { text: 'Hello', fontSize: 14 },
    });
    const svg = exportToSVG(makeDocument({ elements: [el] }));
    expect(svg).toContain('<text');
    expect(svg).toContain('Hello');
  });

  it('skips invisible elements', () => {
    const hidden = makeElement({
      id: 'hidden',
      element_type: 'rectangle',
      visible: false,
      properties: { fill: '#deadbe', stroke: '#000000', opacity: 1 },
    });
    const svg = exportToSVG(makeDocument({ elements: [hidden] }));
    // The background white rect is always present; the element fill should not appear
    expect(svg).not.toContain('#deadbe');
  });

  it('uses default bounds (800x600) for empty canvas', () => {
    const svg = exportToSVG(makeDocument({ elements: [] }));
    expect(svg).toContain('width="840"'); // 800 + padding*2 (20*2)
    expect(svg).toContain('height="640"'); // 600 + 40
  });

  it('escapes XML special characters in text content', () => {
    const el = makeElement({
      id: 'txt-xml',
      element_type: 'text',
      x: 0,
      y: 0,
      width: 200,
      height: 30,
      properties: { text: '<script>&"\'</script>', fontSize: 14 },
    });
    const svg = exportToSVG(makeDocument({ elements: [el] }));
    expect(svg).toContain('&lt;script&gt;');
    expect(svg).toContain('&amp;');
    expect(svg).toContain('&quot;');
    expect(svg).toContain('&apos;');
  });

  it('applies rotation transform when element has non-zero rotation', () => {
    const el = makeElement({ id: 'rot', rotation: 45, x: 10, y: 10, width: 50, height: 50 });
    const svg = exportToSVG(makeDocument({ elements: [el] }));
    expect(svg).toContain('rotate(45');
  });

  it('does not include rotation transform for zero rotation', () => {
    const el = makeElement({ id: 'no-rot', rotation: 0 });
    const svg = exportToSVG(makeDocument({ elements: [el] }));
    expect(svg).not.toContain('rotate(0');
  });

  it('applies opacity from element properties', () => {
    const el = makeElement({ id: 'semi', properties: { opacity: 0.5 } });
    const svg = exportToSVG(makeDocument({ elements: [el] }));
    expect(svg).toContain('opacity="0.5"');
  });

  it('produces no element markup for unknown element types', () => {
    const el = makeElement({
      id: 'unk',
      element_type: 'unknown' as unknown as ElementType,
      properties: { fill: '#aabbcc' },
    });
    const svg = exportToSVG(makeDocument({ elements: [el] }));
    // Should still be a valid, closed SVG document
    expect(svg).toContain('</svg>');
    // The element fill color should not appear (unknown type emits empty string)
    expect(svg).not.toContain('#aabbcc');
    expect(svg).not.toContain('<circle');
    expect(svg).not.toContain('<text');
  });
});

// ---- exportToJSON / importFromJSON ----

describe('exportToJSON', () => {
  it('serializes canvas document to JSON string', () => {
    const doc = makeDocument({ id: 'test-id', name: 'My Canvas' });
    const json = exportToJSON(doc);
    const parsed = JSON.parse(json);
    expect(parsed.id).toBe('test-id');
    expect(parsed.name).toBe('My Canvas');
  });

  it('produces valid JSON for document with elements', () => {
    const doc = makeDocument({ elements: [makeElement()] });
    const json = exportToJSON(doc);
    const parsed = JSON.parse(json);
    expect(parsed.elements).toHaveLength(1);
  });

  it('round-trips through importFromJSON losslessly', () => {
    const original = makeDocument({
      id: 'round-trip',
      name: 'Round Trip',
      elements: [makeElement({ id: 'el-rt' })],
    });
    const json = exportToJSON(original);
    const restored = importFromJSON(json);
    expect(restored.id).toBe(original.id);
    expect(restored.name).toBe(original.name);
    expect(restored.elements[0].id).toBe('el-rt');
  });
});

describe('importFromJSON', () => {
  it('parses a valid JSON string into a CanvasDocument', () => {
    const doc = makeDocument({ id: 'import-1' });
    const json = JSON.stringify(doc);
    const result = importFromJSON(json);
    expect(result.id).toBe('import-1');
  });

  it('throws on invalid JSON string', () => {
    expect(() => importFromJSON('{not valid json')).toThrow('Invalid canvas JSON');
  });

  it('throws on empty string', () => {
    expect(() => importFromJSON('')).toThrow('Invalid canvas JSON');
  });
});

// ---- downloadFile / downloadSVG ----

describe('downloadFile', () => {
  beforeEach(() => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const mockAnchor = {
      href: '',
      download: '',
      click: vi.fn(),
    };
    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as unknown as HTMLElement);
    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);
  });

  it('creates an anchor and triggers a click', () => {
    const blob = new Blob(['data'], { type: 'text/plain' });
    downloadFile(blob, 'output.txt');
    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });
});

describe('downloadSVG', () => {
  it('creates a Blob with SVG mime type and triggers download', () => {
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:svg-url');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const mockAnchor = { href: '', download: '', click: vi.fn() };
    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as unknown as HTMLElement);
    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);

    downloadSVG('<svg></svg>', 'export.svg');
    expect(createObjectURLSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'image/svg+xml' })
    );
  });
});
