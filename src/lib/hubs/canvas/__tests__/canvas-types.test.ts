import { describe, expect, it } from 'vitest';

import {
  type CanvasElement,
  createCard,
  createEllipse,
  createGroup,
  createImage,
  createLine,
  createNote,
  createRect,
  createText,
  DEFAULT_FILL,
  DEFAULT_STROKE,
} from '@/hubs/canvas/types/canvas-types';

// ── Factory functions ─────────────────────────────────────────────

describe('createCard', () => {
  it('creates a card with defaults', () => {
    const c = createCard();
    expect(c.kind).toBe('card');
    expect(c.title).toBe('Card');
    expect(c.content).toBe('');
    expect(c.color).toBe('#4a90d9');
    expect(c.rotation).toBe(0);
    expect(c.opacity).toBe(1);
    expect(c.locked).toBe(false);
    expect(c.layerId).toBe('default');
    expect(typeof c.id).toBe('string');
    expect(c.id.length).toBeGreaterThan(0);
  });

  it('accepts overrides', () => {
    const c = createCard({ title: 'My Card', x: 50, y: 75, color: '#ff0000' });
    expect(c.title).toBe('My Card');
    expect(c.x).toBe(50);
    expect(c.y).toBe(75);
    expect(c.color).toBe('#ff0000');
  });
});

describe('createRect', () => {
  it('creates a rect with defaults', () => {
    const r = createRect();
    expect(r.kind).toBe('rect');
    expect(r.fill.color).toBe(DEFAULT_FILL.color);
    expect(r.stroke.color).toBe(DEFAULT_STROKE.color);
    expect(r.cornerRadius).toBe(0);
    expect(r.width).toBe(200);
    expect(r.height).toBe(150);
  });

  it('accepts fill/stroke overrides', () => {
    const r = createRect({
      fill: { color: '#f00', opacity: 0.5 },
      cornerRadius: 12,
    });
    expect(r.fill.color).toBe('#f00');
    expect(r.fill.opacity).toBe(0.5);
    expect(r.cornerRadius).toBe(12);
  });
});

describe('createEllipse', () => {
  it('creates an ellipse with defaults', () => {
    const e = createEllipse();
    expect(e.kind).toBe('ellipse');
    expect(e.fill.color).toBe(DEFAULT_FILL.color);
    expect(e.stroke.width).toBe(DEFAULT_STROKE.width);
  });
});

describe('createText', () => {
  it('creates text with defaults', () => {
    const t = createText();
    expect(t.kind).toBe('text');
    expect(t.text).toBe('Text');
    expect(t.fontSize).toBe(16);
    expect(t.fontWeight).toBe(400);
    expect(t.textAlign).toBe('left');
    expect(t.lineHeight).toBe(1.4);
  });

  it('accepts text overrides', () => {
    const t = createText({ text: 'Hello', fontSize: 24, fontWeight: 700 });
    expect(t.text).toBe('Hello');
    expect(t.fontSize).toBe(24);
    expect(t.fontWeight).toBe(700);
  });
});

describe('createLine', () => {
  it('creates a line with defaults', () => {
    const l = createLine();
    expect(l.kind).toBe('line');
    expect(l.x2).toBe(200);
    expect(l.y2).toBe(0);
    expect(l.startMarker).toBe('none');
    expect(l.endMarker).toBe('none');
  });

  it('accepts endpoint overrides', () => {
    const l = createLine({ x: 10, y: 20, x2: 300, y2: 400, endMarker: 'arrow' });
    expect(l.x).toBe(10);
    expect(l.y).toBe(20);
    expect(l.x2).toBe(300);
    expect(l.y2).toBe(400);
    expect(l.endMarker).toBe('arrow');
  });
});

describe('createImage', () => {
  it('creates an image with defaults', () => {
    const i = createImage();
    expect(i.kind).toBe('image');
    expect(i.src).toBe('');
    expect(i.fit).toBe('cover');
  });
});

describe('createNote', () => {
  it('creates a note with defaults', () => {
    const n = createNote();
    expect(n.kind).toBe('note');
    expect(n.notePath).toBe('');
    expect(n.title).toBe('Note');
    expect(n.color).toBe('#10b981');
  });
});

describe('createGroup', () => {
  it('creates a group with defaults', () => {
    const g = createGroup();
    expect(g.kind).toBe('group');
    expect(g.childIds).toEqual([]);
  });

  it('accepts childIds', () => {
    const g = createGroup({ childIds: ['a', 'b'] });
    expect(g.childIds).toEqual(['a', 'b']);
  });
});

// ── All factories produce unique IDs ──────────────────────────────

describe('factory IDs', () => {
  it('generates unique IDs for each element', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 20; i++) {
      ids.add(createCard().id);
      ids.add(createRect().id);
      ids.add(createEllipse().id);
    }
    expect(ids.size).toBe(60);
  });
});

// ── All factories set correct base properties ─────────────────────

describe('base properties', () => {
  const factories = [
    createCard,
    createRect,
    createEllipse,
    createText,
    createLine,
    createImage,
    createNote,
    createGroup,
  ];
  it.each(factories)('factory %# sets base defaults', (factory) => {
    const el = factory() as CanvasElement;
    expect(el.rotation).toBe(0);
    expect(el.opacity).toBe(1);
    expect(el.locked).toBe(false);
    expect(el.layerId).toBe('default');
    expect(typeof el.zIndex).toBe('number');
  });
});
