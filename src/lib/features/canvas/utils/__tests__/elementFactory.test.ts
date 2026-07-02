import { describe, it, expect, vi } from 'vitest';

vi.mock('@/utils/id', () => ({
  generateId: vi.fn(() => 'mock-uuid-1234'),
}));

import {
  createRectangle,
  createCircle,
  createText,
  createFrame,
  createLine,
  createArrow,
  createPenPath,
  createScreen,
} from '../factories/elementFactory';

const LAYER = 'layer-1';

describe('createRectangle', () => {
  it('creates a rectangle with correct position and size', () => {
    const el = createRectangle(10, 20, 100, 50, LAYER);
    expect(el.element_type).toBe('rectangle');
    expect(el.x).toBe(10);
    expect(el.y).toBe(20);
    expect(el.width).toBe(100);
    expect(el.height).toBe(50);
    expect(el.layer_id).toBe(LAYER);
  });

  it('has blue fill by default', () => {
    const el = createRectangle(0, 0, 10, 10, LAYER);
    expect(el.properties.fill).toBe('#3b82f6');
  });

  it('is unlocked and visible', () => {
    const el = createRectangle(0, 0, 10, 10, LAYER);
    expect(el.locked).toBe(false);
    expect(el.visible).toBe(true);
  });
});

describe('createCircle', () => {
  it('calculates bounding box from center and radius', () => {
    const el = createCircle(50, 50, 25, LAYER);
    expect(el.element_type).toBe('circle');
    expect(el.x).toBe(25); // 50 - 25
    expect(el.y).toBe(25); // 50 - 25
    expect(el.width).toBe(50); // 25 * 2
    expect(el.height).toBe(50);
  });

  it('stores radius in properties', () => {
    const el = createCircle(0, 0, 30, LAYER);
    expect(el.properties.radius).toBe(30);
  });
});

describe('createText', () => {
  it('creates a text element with content', () => {
    const el = createText(10, 20, 'Hello', LAYER);
    expect(el.element_type).toBe('text');
    expect(el.properties.text).toBe('Hello');
    expect(el.properties.fontSize).toBe(16);
    expect(el.properties.fontFamily).toContain('Inter');
  });

  it('uses default dimensions', () => {
    const el = createText(0, 0, '', LAYER);
    expect(el.width).toBe(100);
    expect(el.height).toBe(24);
  });
});

describe('createFrame', () => {
  it('creates a frame container with given dimensions', () => {
    const el = createFrame(0, 0, 200, 300, LAYER);
    expect(el.element_type).toBe('frame');
    expect(el.width).toBe(200);
    expect(el.height).toBe(300);
    expect(el.properties.clipContent).toBe(true);
  });

  it('uses "Frame" as default name', () => {
    const el = createFrame(0, 0, 100, 100, LAYER);
    expect(el.name).toBe('Frame');
  });

  it('accepts a custom name', () => {
    const el = createFrame(0, 0, 100, 100, LAYER, 'Header');
    expect(el.name).toBe('Header');
  });
});

describe('createLine', () => {
  it('creates a line between two points', () => {
    const el = createLine(10, 20, 100, 80, LAYER);
    expect(el.element_type).toBe('line');
    expect(el.x).toBe(10); // min x
    expect(el.y).toBe(20); // min y
    expect(el.width).toBe(90); // |100-10|
    expect(el.height).toBe(60); // |80-20|
  });

  it('normalizes points relative to bounding box', () => {
    const el = createLine(10, 20, 100, 80, LAYER);
    const points = el.properties.points as Array<{ x: number; y: number }>;
    expect(points[0]).toEqual({ x: 0, y: 0 });
    expect(points[1]).toEqual({ x: 90, y: 60 });
  });

  it('handles vertical line (width becomes 1)', () => {
    const el = createLine(50, 10, 50, 100, LAYER);
    expect(el.width).toBe(1);
    expect(el.height).toBe(90);
  });
});

describe('createArrow', () => {
  it('creates an arrow with endArrow property', () => {
    const el = createArrow(0, 0, 100, 50, LAYER);
    expect(el.element_type).toBe('arrow');
    expect(el.properties.endArrow).toBe(true);
    expect(el.properties.startArrow).toBe(false);
  });
});

describe('createPenPath', () => {
  it('returns a degenerate pen element for empty points', () => {
    const el = createPenPath([], LAYER);
    // Degenerate pen path returns a 'pen' type placeholder at origin
    expect(el.element_type).toBe('pen');
    expect(el.width).toBe(1);
    expect(el.height).toBe(1);
  });

  it('creates a pen path from points', () => {
    const points = [
      { x: 10, y: 10 },
      { x: 50, y: 20 },
      { x: 30, y: 60 },
    ];
    const el = createPenPath(points, LAYER);
    expect(el.element_type).toBe('pen');
    expect(el.x).toBe(10); // min x
    expect(el.y).toBe(10); // min y
    expect(el.width).toBe(40); // 50-10
    expect(el.height).toBe(50); // 60-10
  });

  it('generates SVG path data', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 10, y: 10 },
    ];
    const el = createPenPath(points, LAYER);
    expect(el.properties.pathData).toContain('M 0 0');
    expect(el.properties.pathData).toContain('L 10 10');
  });
});

describe('createScreen', () => {
  it('creates a screen with device preset dimensions', () => {
    const el = createScreen(100, 200, 'iphone-15', LAYER);
    expect(el.element_type).toBe('screen');
    expect(el.x).toBe(100);
    expect(el.y).toBe(200);
    expect(el.properties.deviceType).toBe('iphone-15');
    expect(el.properties.clipContent).toBe(true);
    expect(el.properties.borderRadius).toBeDefined();
  });

  it('uses correct dimensions for ipad preset', () => {
    const el = createScreen(0, 0, 'ipad', LAYER);
    expect(el.width).toBe(1024);
    expect(el.height).toBe(1366);
  });
});
