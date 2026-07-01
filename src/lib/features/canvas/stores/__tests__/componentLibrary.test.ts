import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';

// Mock the service layer before importing the store
vi.mock('@/features/canvas/services/components', () => ({
  listComponents: vi.fn().mockResolvedValue([
    { id: 'c1', name: 'Button', category: 'ui', elements: [], exposedProps: [], width: 100, height: 40, tags: ['btn'], created_at: 0, modified_at: 0 },
    { id: 'c2', name: 'Card', category: 'layout', elements: [], exposedProps: [], width: 200, height: 160, tags: [], created_at: 0, modified_at: 0 },
    { id: 'c3', name: 'Input', category: 'ui', elements: [], exposedProps: [], width: 180, height: 36, tags: ['form'], created_at: 0, modified_at: 0 },
  ]),
  saveComponent: vi.fn().mockImplementation((c) => Promise.resolve(c)),
  deleteComponent: vi.fn().mockResolvedValue(undefined),
}));

import {
  components,
  isLoading,
  searchQuery,
  categoryFilter,
  filteredComponents,
  categories,
  loadLibrary,
  saveComponentToLibrary,
  deleteComponentFromLibrary,
  getComponentById,
  createComponentFromSelection,
} from '../library/componentLibrary';
import { deleteComponentWithDetach, enterComponentEditMode, exitComponentEditMode } from '../library/componentEditMode';
import { currentCanvas, selectedElements } from '../elements/canvasStore';
import type { CanvasDocument, CanvasElement } from '@/features/canvas/types';

describe('componentLibrary store', () => {
  beforeEach(async () => {
    components.set([]);
    searchQuery.set('');
    categoryFilter.set(null);
    isLoading.set(false);
  });
  describe('loadLibrary', () => {
    it('loads components from service and sets store', async () => {
      await loadLibrary();
      expect(get(components)).toHaveLength(3);
      expect(get(isLoading)).toBe(false);
    });

    it('sets isLoading during load', async () => {
      const promise = loadLibrary();
      expect(get(isLoading)).toBe(true);
      await promise;
      expect(get(isLoading)).toBe(false);
    });
  });

  describe('filteredComponents', () => {
    beforeEach(async () => {
      await loadLibrary();
    });

    it('returns all when no filter is active', () => {
      expect(get(filteredComponents)).toHaveLength(3);
    });

    it('filters by category', () => {
      categoryFilter.set('ui');
      expect(get(filteredComponents)).toHaveLength(2);
      expect(get(filteredComponents).every((c) => c.category === 'ui')).toBe(true);
    });

    it('filters by search query (name)', () => {
      searchQuery.set('card');
      expect(get(filteredComponents)).toHaveLength(1);
      expect(get(filteredComponents)[0].name).toBe('Card');
    });

    it('filters by tag match', () => {
      searchQuery.set('form');
      expect(get(filteredComponents)).toHaveLength(1);
      expect(get(filteredComponents)[0].name).toBe('Input');
    });

    it('combines category + search', () => {
      categoryFilter.set('ui');
      searchQuery.set('btn');
      expect(get(filteredComponents)).toHaveLength(1);
      expect(get(filteredComponents)[0].name).toBe('Button');
    });
  });

  describe('categories derived', () => {
    it('extracts unique categories sorted', async () => {
      await loadLibrary();
      expect(get(categories)).toEqual(['layout', 'ui']);
    });
  });

  describe('CRUD actions', () => {
    beforeEach(async () => {
      await loadLibrary();
    });

    it('saveComponentToLibrary adds new component', async () => {
      const newComp = { id: 'c4', name: 'Avatar', category: 'ui', elements: [], exposedProps: [], width: 48, height: 48, tags: [], created_at: 0, modified_at: 0 };
      await saveComponentToLibrary(newComp);
      expect(get(components)).toHaveLength(4);
    });

    it('saveComponentToLibrary updates existing component', async () => {
      const updated = { id: 'c1', name: 'ButtonV2', category: 'ui', elements: [], exposedProps: [], width: 100, height: 40, tags: [], created_at: 0, modified_at: 1 };
      await saveComponentToLibrary(updated);
      expect(get(components)).toHaveLength(3);
      expect(getComponentById('c1')?.name).toBe('ButtonV2');
    });

    it('deleteComponentFromLibrary removes from store', async () => {
      await deleteComponentFromLibrary('c2');
      expect(get(components)).toHaveLength(2);
      expect(getComponentById('c2')).toBeUndefined();
    });

    it('getComponentById returns correct definition', () => {
      expect(getComponentById('c3')?.name).toBe('Input');
      expect(getComponentById('nonexistent')).toBeUndefined();
    });
  });
});

// ─── T051: createComponentFromSelection ──────────────────────────────────────

function makeBaseCanvas(elements: CanvasElement[]): CanvasDocument {
  return {
    id: 'cvs1', name: 'Test', vault_id: null, note_id: null,
    grid_size: 16, snap_to_grid: true,
    elements,
    flowLinks: [],
    layers: [{ id: 'default', name: 'Default', z_order: 0, visible: true, locked: false }],
    pages: [], activePageId: '', components: [], styles: [], variables: [],
    viewport: { x: 0, y: 0, scale: 1 }, created_at: 0, modified_at: 0,
  };
}

function makeRect(id: string, x: number, y: number, w = 100, h = 50): CanvasElement {
  return {
    id, element_type: 'rectangle',
    x, y, width: w, height: h, rotation: 0,
    properties: { fill: '#aaa' }, layer_id: 'default', z_index: 0,
    locked: false, visible: true, name: id,
  };
}

describe('createComponentFromSelection (T051)', () => {
  beforeEach(() => {
    components.set([]);
    const canvas = makeBaseCanvas([
      makeRect('r1', 10, 20, 80, 40),
      makeRect('r2', 100, 20, 60, 40),
    ]);
    currentCanvas.set(canvas);
    selectedElements.set(['r1', 'r2']);
  });

  it('creates a component definition from selected elements', async () => {
    const def = await createComponentFromSelection('MyComp');
    expect(def).not.toBeNull();
    expect(def!.name).toBe('MyComp');
    expect(def!.elements).toHaveLength(2);
  });

  it('normalizes element positions to component origin (0,0)', async () => {
    const def = await createComponentFromSelection('MyComp');
    expect(def!.elements[0].x).toBe(0);
    expect(def!.elements[0].y).toBe(0);
  });

  it('replaces selected elements with a single component_instance', async () => {
    await createComponentFromSelection('MyComp');
    const canvas = get(currentCanvas)!;
    const instances = canvas.elements.filter((e) => e.element_type === 'component_instance');
    const originals = canvas.elements.filter((e) => e.id === 'r1' || e.id === 'r2');
    expect(instances).toHaveLength(1);
    expect(originals).toHaveLength(0);
  });

  it('returns null when nothing is selected', async () => {
    selectedElements.set([]);
    const def = await createComponentFromSelection('Empty');
    expect(def).toBeNull();
  });
});

// ─── T057: deleteComponentWithDetach ─────────────────────────────────────────

describe('deleteComponentWithDetach (T057)', () => {
  beforeEach(() => {
    const compDef = {
      id: 'comp_x', name: 'Box', elements: [makeRect('child1', 0, 0)],
      exposedProps: [], width: 100, height: 50, tags: [], created_at: 0, modified_at: 0,
    };
    components.set([compDef]);

    const instance1: CanvasElement = {
      id: 'inst_a', element_type: 'component_instance',
      x: 0, y: 0, width: 100, height: 50, rotation: 0,
      properties: { definitionId: 'comp_x', overrides: {} },
      layer_id: 'default', z_index: 0, locked: false, visible: true, name: 'Box',
    };
    const instance2: CanvasElement = {
      id: 'inst_b', element_type: 'component_instance',
      x: 200, y: 0, width: 100, height: 50, rotation: 0,
      properties: { definitionId: 'comp_x', overrides: {} },
      layer_id: 'default', z_index: 1, locked: false, visible: true, name: 'Box',
    };
    currentCanvas.set(makeBaseCanvas([instance1, instance2]));
  });

  it('detaches all instances of the deleted component to plain groups', async () => {
    await deleteComponentWithDetach('comp_x');
    const canvas = get(currentCanvas)!;
    const instances = canvas.elements.filter((e) => e.element_type === 'component_instance');
    const groups = canvas.elements.filter((e) => e.element_type === 'group');
    expect(instances).toHaveLength(0);
    expect(groups).toHaveLength(2);
  });

  it('removes the component definition from the library', async () => {
    await deleteComponentWithDetach('comp_x');
    expect(get(components).find((c) => c.id === 'comp_x')).toBeUndefined();
  });

  it('detached elements have name suffix indicating detachment', async () => {
    await deleteComponentWithDetach('comp_x');
    const canvas = get(currentCanvas)!;
    expect(canvas.elements[0].name).toContain('detached');
  });
});

// ─── T056: enterComponentEditMode / exitComponentEditMode integration ─────────

describe('component edit mode integration (T056)', () => {
  const masterDef = {
    id: 'def_edit', name: 'Card',
    elements: [makeRect('bg', 0, 0, 200, 100)],
    exposedProps: [], width: 200, height: 100,
    tags: [], created_at: 0, modified_at: 0,
  };

  const inst1: CanvasElement = {
    id: 'inst_1', element_type: 'component_instance',
    x: 10, y: 10, width: 200, height: 100, rotation: 0,
    properties: { definitionId: 'def_edit', overrides: {} },
    layer_id: 'default', z_index: 0, locked: false, visible: true, name: 'Card',
  };
  const inst2: CanvasElement = {
    id: 'inst_2', element_type: 'component_instance',
    x: 250, y: 10, width: 200, height: 100, rotation: 0,
    properties: { definitionId: 'def_edit', overrides: {} },
    layer_id: 'default', z_index: 1, locked: false, visible: true, name: 'Card',
  };

  beforeEach(() => {
    components.set([masterDef]);
    currentCanvas.set(makeBaseCanvas([inst1, inst2]));
  });

  it('enters edit mode: isolates definition elements on canvas', () => {
    enterComponentEditMode('def_edit');
    const canvas = get(currentCanvas)!;
    expect(canvas.elements).toHaveLength(1);
    expect(canvas.elements[0].id).toBe('bg');
  });

  it('exits edit mode: restores original canvas', async () => {
    enterComponentEditMode('def_edit');
    await exitComponentEditMode();
    const canvas = get(currentCanvas)!;
    const ids = canvas.elements.map((e) => e.id);
    expect(ids).toContain('inst_1');
    expect(ids).toContain('inst_2');
  });

  it('exits edit mode: saves updated definition so all instances get new master', async () => {
    enterComponentEditMode('def_edit');
    // Simulate editing: add a new element to the canvas while in edit mode
    currentCanvas.update((c) => {
      if (!c) return c;
      c.elements = [...c.elements, makeRect('new_child', 10, 10, 50, 50)];
      return c;
    });
    await exitComponentEditMode();
    const updatedDef = get(components).find((c) => c.id === 'def_edit');
    expect(updatedDef!.elements).toHaveLength(2);
    expect(updatedDef!.elements.map((e) => e.id)).toContain('new_child');
  });

  it('clears editingComponentId after exit', async () => {
    const { editingComponentId } = await import('../componentLibrary');
    enterComponentEditMode('def_edit');
    expect(get(editingComponentId)).toBe('def_edit');
    await exitComponentEditMode();
    expect(get(editingComponentId)).toBeNull();
  });
});
