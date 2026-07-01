import { describe, it, expect } from 'vitest';
import {
  resolveInstance,
  isDetached,
  applyOverride,
  resetOverride,
  getEffectiveProps,
} from '../componentResolver';
import type { CanvasElement, ComponentDefinition } from '@/features/canvas/types';

const baseDef: ComponentDefinition = {
  id: 'comp1',
  name: 'Button',
  elements: [
    {
      id: 'el1',
      element_type: 'rectangle',
      x: 0,
      y: 0,
      width: 120,
      height: 40,
      rotation: 0,
      properties: { fill: '#333' },
      layer_id: 'default',
      z_index: 0,
      locked: false,
      visible: true,
      name: 'bg',
    },
    {
      id: 'el2',
      element_type: 'text',
      x: 10,
      y: 10,
      width: 100,
      height: 20,
      rotation: 0,
      properties: { text: 'Click me' },
      layer_id: 'default',
      z_index: 1,
      locked: false,
      visible: true,
      name: 'label',
    },
  ],
  exposedProps: [
    { key: 'text', label: 'Label', type: 'text' as const, defaultValue: 'Click me' },
    { key: 'fill', label: 'Fill', type: 'color' as const, defaultValue: '#333' },
  ],
  width: 120,
  height: 40,
  tags: [],
  created_at: 0,
  modified_at: 0,
};

function makeInstance(overrides: Record<string, unknown> = {}): CanvasElement {
  return {
    id: 'inst1',
    element_type: 'component_instance',
    x: 200,
    y: 100,
    width: 120,
    height: 40,
    rotation: 0,
    properties: { definitionId: 'comp1', overrides },
    layer_id: 'default',
    z_index: 5,
    locked: false,
    visible: true,
    name: 'Button Instance',
  };
}

describe('componentResolver', () => {
  describe('resolveInstance', () => {
    it('positions definition elements relative to instance origin', () => {
      const instance = makeInstance();
      const resolved = resolveInstance(instance, baseDef);
      expect(resolved).toHaveLength(2);
      expect(resolved[0].x).toBe(200);
      expect(resolved[0].y).toBe(100);
      expect(resolved[1].x).toBe(210);
      expect(resolved[1].y).toBe(110);
    });

    it('creates composite IDs from instance + definition element', () => {
      const instance = makeInstance();
      const resolved = resolveInstance(instance, baseDef);
      expect(resolved[0].id).toBe('inst1::el1');
      expect(resolved[1].id).toBe('inst1::el2');
    });

    it('applies overrides to resolved elements', () => {
      const instance = makeInstance({ text: 'Submit' });
      const resolved = resolveInstance(instance, baseDef);
      const textEl = resolved.find((e) => e.name === 'label');
      expect((textEl!.properties as Record<string, unknown>)['text']).toBe('Submit');
    });

    it('handles missing definition gracefully for unresolvable props', () => {
      const instance = makeInstance({ unknownProp: 'value' });
      const resolved = resolveInstance(instance, baseDef);
      expect(resolved).toHaveLength(2);
    });
  });

  describe('isDetached', () => {
    it('returns false when definition exists', () => {
      const instance = makeInstance();
      expect(isDetached(instance, [baseDef])).toBe(false);
    });

    it('returns true when definition is missing', () => {
      const instance = makeInstance();
      expect(isDetached(instance, [])).toBe(true);
    });

    it('returns true when instance has no definitionId', () => {
      const bad: CanvasElement = {
        ...makeInstance(),
        properties: {},
      };
      expect(isDetached(bad, [baseDef])).toBe(true);
    });
  });

  describe('applyOverride', () => {
    it('adds a new override to instance properties', () => {
      const instance = makeInstance();
      const result = applyOverride(instance, 'text', 'New Label');
      expect((result as { overrides: Record<string, unknown> }).overrides['text']).toBe(
        'New Label'
      );
    });

    it('updates existing override', () => {
      const instance = makeInstance({ text: 'Old' });
      const result = applyOverride(instance, 'text', 'Updated');
      expect((result as { overrides: Record<string, unknown> }).overrides['text']).toBe('Updated');
    });
  });

  describe('resetOverride', () => {
    it('removes a specific override key', () => {
      const instance = makeInstance({ text: 'Custom', fill: '#f00' });
      const result = resetOverride(instance, 'text');
      const overrides = (result as { overrides: Record<string, unknown> }).overrides;
      expect(overrides['text']).toBeUndefined();
      expect(overrides['fill']).toBe('#f00');
    });
  });

  describe('getEffectiveProps', () => {
    it('returns defaults when no overrides set', () => {
      const instance = makeInstance();
      const props = getEffectiveProps(instance, baseDef);
      expect(props['text']).toBe('Click me');
      expect(props['fill']).toBe('#333');
    });

    it('returns overridden values where set', () => {
      const instance = makeInstance({ text: 'Submit' });
      const props = getEffectiveProps(instance, baseDef);
      expect(props['text']).toBe('Submit');
      expect(props['fill']).toBe('#333');
    });
  });
});
