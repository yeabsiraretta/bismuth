/**
 * Unit tests for component extractor.
 */

import { describe, it, expect } from 'vitest';
import { extractComponent } from './componentExtractor';
import type { ComponentDefinition } from '@/types/canvas/components';
import type { CanvasElement } from '@/types/canvas';

const mockDef: ComponentDefinition = {
  id: 'btn_001',
  name: 'Button',
  description: 'Primary button',
  elements: [],
  exposedProps: [
    { key: 'label', label: 'Label', type: 'text', defaultValue: 'Click me' },
    { key: 'disabled', label: 'Disabled', type: 'boolean', defaultValue: false },
    { key: 'size', label: 'Size', type: 'number', defaultValue: 16 },
  ],
  width: 200,
  height: 48,
  created_at: 0,
  modified_at: 0,
};

const mockFrames: CanvasElement[] = [
  {
    id: 'frame_1',
    element_type: 'frame',
    name: '[design:variant:Button] Primary',
    x: 0, y: 0, width: 200, height: 48, rotation: 0,
    properties: { fill: 'var(--color-primary)' },
    layer_id: 'l1', z_index: 0, locked: false, visible: true,
  },
  {
    id: 'frame_2',
    element_type: 'frame',
    name: '[design:variant:Button] Secondary',
    x: 220, y: 0, width: 200, height: 48, rotation: 0,
    properties: { fill: 'var(--color-secondary)' },
    layer_id: 'l1', z_index: 1, locked: false, visible: true,
  },
  {
    id: 'frame_3',
    element_type: 'frame',
    name: 'Unrelated Frame',
    x: 0, y: 100, width: 300, height: 200, rotation: 0,
    properties: {},
    layer_id: 'l1', z_index: 2, locked: false, visible: true,
  },
] as CanvasElement[];

describe('extractComponent', () => {
  it('extracts component name from definition', () => {
    const result = extractComponent(mockDef, mockFrames);
    expect(result.component_name).toBe('Button');
  });

  it('maps exposed props to component props', () => {
    const result = extractComponent(mockDef, mockFrames);
    expect(result.props).toHaveLength(3);
    expect(result.props[0].name).toBe('label');
    expect(result.props[0].type).toBe('string');
    expect(result.props[1].name).toBe('disabled');
    expect(result.props[1].type).toBe('boolean');
    expect(result.props[2].name).toBe('size');
    expect(result.props[2].type).toBe('number');
  });

  it('extracts variants from tagged frames', () => {
    const result = extractComponent(mockDef, mockFrames);
    expect(result.variants).toHaveLength(2);
    expect(result.variants[0].name).toContain('Primary');
    expect(result.variants[1].name).toContain('Secondary');
  });

  it('ignores unrelated frames', () => {
    const result = extractComponent(mockDef, mockFrames);
    const variantNames = result.variants.map((v) => v.name);
    expect(variantNames).not.toContain('Unrelated Frame');
  });

  it('generates code_connect with import and usage', () => {
    const result = extractComponent(mockDef, mockFrames);
    expect(result.code_connect.import).toContain('Button');
    expect(result.code_connect.usage).toContain('<Button');
  });

  it('includes default slot', () => {
    const result = extractComponent(mockDef, mockFrames);
    expect(result.slots[0].name).toBe('default');
  });

  it('includes standard interaction states', () => {
    const result = extractComponent(mockDef, mockFrames);
    expect(result.states).toContain('hover');
    expect(result.states).toContain('disabled');
  });

  it('extracts token overrides from variant fill', () => {
    const result = extractComponent(mockDef, mockFrames);
    const primary = result.variants.find((v) => v.name.includes('Primary'));
    expect(primary?.overrides['background']).toBe('var(--color-primary)');
  });

  it('sets file_path based on component name', () => {
    const result = extractComponent(mockDef, mockFrames);
    expect(result.file_path).toContain('Button.svelte');
  });
});
