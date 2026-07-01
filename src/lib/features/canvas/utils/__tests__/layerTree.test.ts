import { describe, it, expect } from 'vitest';
import { buildLayerTree, flattenTree, elementLabel, elementIcon } from '../layerTree';
import type { CanvasElement, ElementType } from '@/features/canvas/types';

function makeElement(overrides: Partial<CanvasElement> = {}): CanvasElement {
  return {
    id: 'el-1',
    element_type: 'rectangle',
    x: 0, y: 0, width: 100, height: 100,
    rotation: 0,
    properties: {},
    layer_id: 'layer-1',
    z_index: 0,
    locked: false,
    visible: true,
    ...overrides,
  } as CanvasElement;
}

describe('buildLayerTree', () => {
  it('returns empty array for empty input', () => {
    expect(buildLayerTree([])).toEqual([]);
  });

  it('creates root nodes for elements without parentId', () => {
    const elements = [
      makeElement({ id: 'a', z_index: 1 }),
      makeElement({ id: 'b', z_index: 2 }),
    ];
    const tree = buildLayerTree(elements);
    expect(tree).toHaveLength(2);
    expect(tree[0].el.id).toBe('b'); // higher z_index first
    expect(tree[1].el.id).toBe('a');
  });

  it('nests children under their parent', () => {
    const elements = [
      makeElement({ id: 'parent', element_type: 'frame', z_index: 0 }),
      makeElement({ id: 'child1', parentId: 'parent', z_index: 1 }),
      makeElement({ id: 'child2', parentId: 'parent', z_index: 2 }),
    ];
    const tree = buildLayerTree(elements);
    expect(tree).toHaveLength(1);
    expect(tree[0].el.id).toBe('parent');
    expect(tree[0].children).toHaveLength(2);
    expect(tree[0].children[0].el.id).toBe('child2'); // higher z first
  });

  it('sets depth correctly for nested elements', () => {
    const elements = [
      makeElement({ id: 'root', element_type: 'frame', z_index: 0 }),
      makeElement({ id: 'mid', element_type: 'frame', parentId: 'root', z_index: 0 }),
      makeElement({ id: 'leaf', parentId: 'mid', z_index: 0 }),
    ];
    const tree = buildLayerTree(elements);
    expect(tree[0].depth).toBe(0);
    expect(tree[0].children[0].depth).toBe(1);
    expect(tree[0].children[0].children[0].depth).toBe(2);
  });

  it('sorts siblings by z_index descending', () => {
    const elements = [
      makeElement({ id: 'a', z_index: 5 }),
      makeElement({ id: 'b', z_index: 10 }),
      makeElement({ id: 'c', z_index: 1 }),
    ];
    const tree = buildLayerTree(elements);
    expect(tree.map((n) => n.el.id)).toEqual(['b', 'a', 'c']);
  });
});

describe('flattenTree', () => {
  it('returns empty for empty tree', () => {
    expect(flattenTree([], new Set())).toEqual([]);
  });

  it('flattens all nodes when nothing is collapsed', () => {
    const elements = [
      makeElement({ id: 'parent', element_type: 'frame', z_index: 0 }),
      makeElement({ id: 'child', parentId: 'parent', z_index: 0 }),
    ];
    const tree = buildLayerTree(elements);
    const flat = flattenTree(tree, new Set());
    expect(flat).toHaveLength(2);
    expect(flat[0].el.id).toBe('parent');
    expect(flat[1].el.id).toBe('child');
  });

  it('hides children when parent is collapsed', () => {
    const elements = [
      makeElement({ id: 'parent', element_type: 'frame', z_index: 0 }),
      makeElement({ id: 'child', parentId: 'parent', z_index: 0 }),
    ];
    const tree = buildLayerTree(elements);
    const flat = flattenTree(tree, new Set(['parent']));
    expect(flat).toHaveLength(1);
    expect(flat[0].el.id).toBe('parent');
  });
});

describe('elementLabel', () => {
  it('returns name if element has one', () => {
    expect(elementLabel(makeElement({ name: 'My Frame' }))).toBe('My Frame');
  });

  it('returns type + last 4 of ID for unnamed frame', () => {
    const el = makeElement({ id: 'abcd1234', element_type: 'frame', name: undefined });
    expect(elementLabel(el)).toBe('Frame 1234');
  });

  it('returns text content for text elements', () => {
    const el = makeElement({
      id: 'txt-5678',
      element_type: 'text',
      name: undefined,
      properties: { text: 'Hello World' },
    });
    expect(elementLabel(el)).toBe('Hello World');
  });

  it('falls back to "Element" for unknown types', () => {
    const el = makeElement({ id: 'xx-9999', element_type: 'unknown' as unknown as ElementType, name: undefined });
    expect(elementLabel(el)).toBe('Element 9999');
  });
});

describe('elementIcon', () => {
  it('returns correct icon for frame', () => {
    expect(elementIcon('frame')).toBe('\u25A1');
  });

  it('returns correct icon for text', () => {
    expect(elementIcon('text')).toBe('T');
  });

  it('returns bullet for unknown type', () => {
    expect(elementIcon('unknown')).toBe('\u2022');
  });
});
