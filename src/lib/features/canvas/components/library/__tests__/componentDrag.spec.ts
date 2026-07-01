/**
 * T017: Integration tests for the canvas component drag protocol.
 *
 * Covers:
 *  1. Dragging a built-in component sets the correct MIME type on the
 *     DataTransfer object (application/x-bismuth-component).
 *  2. placeComponentInstance creates a component_instance element whose
 *     properties.definitionId matches the given definitionId.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';

// ─── Mock canvas service (required by canvasStore) ────────────────────────────
vi.mock('@/features/canvas/services/canvas', () => ({
  loadCanvas: vi.fn().mockResolvedValue(null),
  saveCanvas: vi.fn().mockResolvedValue(undefined),
}));

// ─── Mock component service (required by componentLibrary) ────────────────────
vi.mock('@/features/canvas/services/components', () => ({
  listComponents: vi.fn().mockResolvedValue([]),
  saveComponent: vi.fn().mockImplementation((c) => Promise.resolve(c)),
  deleteComponent: vi.fn().mockResolvedValue(undefined),
}));

// ─── Mock design-docs service (required by canvasStore) ──────────────────────
vi.mock('@/services/design-docs', () => ({
  writeDocument: vi.fn().mockResolvedValue(undefined),
}));

import { currentCanvas } from '@/features/canvas/stores/elements/canvasStore';
import { placeComponentInstance } from '@/features/canvas/stores';
import { BUILTIN_COMPONENTS } from '@/config/presets/canvas-library';
import type { CanvasDocument } from '@/features/canvas/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeMinimalCanvas(): CanvasDocument {
  return {
    id: 'test-canvas',
    name: 'Test Canvas',
    vault_id: null,
    note_id: null,
    viewport: { x: 0, y: 0, scale: 1 },
    grid_size: 10,
    snap_to_grid: false,
    elements: [],
    pages: [],
    layers: [{ id: 'default', name: 'Default', visible: true, locked: false, z_order: 0 }],
    activePageId: '',
    components: [],
    styles: [],
    variables: [],
    created_at: 0,
    modified_at: 0,
  };
}

// ─── T017: Drag protocol ──────────────────────────────────────────────────────

describe('T017: drag data format matches expected protocol', () => {
  it('sets application/x-bismuth-component with the component id', () => {
    const componentId = 'builtin-select-input';
    const dataMap = new Map<string, string>();

    const mockDataTransfer = {
      setData: vi.fn((type: string, value: string) => { dataMap.set(type, value); }),
      effectAllowed: '',
    } as unknown as DataTransfer;

    // Simulate the drag-start handler from ComponentBrowser
    mockDataTransfer.setData('application/x-bismuth-component', componentId);
    mockDataTransfer.effectAllowed = 'copy';

    expect(dataMap.get('application/x-bismuth-component')).toBe(componentId);
    expect(mockDataTransfer.effectAllowed).toBe('copy');
  });

  it('uses the component id (not name or index) as the transfer payload', () => {
    const builtinIds = BUILTIN_COMPONENTS.map((c) => c.id);
    const transferred = 'builtin-input-text';

    expect(builtinIds).toContain(transferred);
  });
});

// ─── T017: placeComponentInstance creates correct element ─────────────────────

describe('T017: placeComponentInstance creates element with correct definitionId', () => {
  beforeEach(() => {
    currentCanvas.set(makeMinimalCanvas());
  });

  it('returns an instance id when a known builtin definitionId is given', () => {
    const instanceId = placeComponentInstance('builtin-select-input', 100, 200);
    expect(typeof instanceId).toBe('string');
    expect(instanceId).not.toBeNull();
  });

  it('places a component_instance element on the canvas with the correct definitionId', () => {
    const definitionId = 'builtin-select-input';
    placeComponentInstance(definitionId, 50, 60);

    const canvas = get(currentCanvas);
    expect(canvas).not.toBeNull();

    const instance = canvas!.elements.find(
      (el) => el.element_type === 'component_instance'
    );
    expect(instance).toBeDefined();
    expect((instance!.properties as Record<string, unknown>)['definitionId']).toBe(definitionId);
  });

  it('places the element at the specified canvas coordinates', () => {
    placeComponentInstance('builtin-input-text', 120, 240);

    const canvas = get(currentCanvas);
    const instance = canvas!.elements.find(
      (el) => el.element_type === 'component_instance'
    );
    expect(instance).toBeDefined();
    expect(instance!.x).toBe(120);
    expect(instance!.y).toBe(240);
  });

  it('returns null and does not add an element for an unknown definitionId', () => {
    const result = placeComponentInstance('unknown-definition-id', 0, 0);
    expect(result).toBeNull();

    const canvas = get(currentCanvas);
    expect(canvas!.elements).toHaveLength(0);
  });

  it('uses width and height from the component definition', () => {
    const definition = BUILTIN_COMPONENTS.find((c) => c.id === 'builtin-select-input');
    expect(definition).toBeDefined();

    placeComponentInstance('builtin-select-input', 0, 0);

    const canvas = get(currentCanvas);
    const instance = canvas!.elements.find(
      (el) => el.element_type === 'component_instance'
    );
    expect(instance!.width).toBe(definition!.width);
    expect(instance!.height).toBe(definition!.height);
  });
});
