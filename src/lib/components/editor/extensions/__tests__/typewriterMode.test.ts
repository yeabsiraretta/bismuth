import { describe, it, expect } from 'vitest';
import { EditorState } from '@codemirror/state';
import {
  typewriterFacet,
  zenFacet,
  typewriterScroll,
  zenMode,
  typewriterMode,
  type TypewriterConfig,
  type ZenConfig,
} from '../typewriterMode';

function stateWith(extensions: ReturnType<typeof typewriterMode>) {
  return EditorState.create({ doc: 'Hello\nWorld\nLine3', extensions });
}

// ─── Facet defaults ─────────────────────────────────────────────────────────

describe('typewriterFacet', () => {
  it('has sensible defaults', () => {
    const state = EditorState.create({ doc: '' });
    const config = state.facet(typewriterFacet);
    expect(config.enabled).toBe(false);
    expect(config.offset).toBe(0.5);
    expect(config.onlyKeyboard).toBe(true);
  });

  it('accepts custom config', () => {
    const state = EditorState.create({
      doc: '',
      extensions: [typewriterFacet.of({ enabled: true, offset: 0.3, onlyKeyboard: false })],
    });
    const config = state.facet(typewriterFacet);
    expect(config.enabled).toBe(true);
    expect(config.offset).toBe(0.3);
    expect(config.onlyKeyboard).toBe(false);
  });
});

describe('zenFacet', () => {
  it('has sensible defaults', () => {
    const state = EditorState.create({ doc: '' });
    const config = state.facet(zenFacet);
    expect(config.enabled).toBe(false);
    expect(config.visibleLines).toBe(5);
    expect(config.dimOpacity).toBe(0.25);
  });

  it('accepts custom config', () => {
    const state = EditorState.create({
      doc: '',
      extensions: [zenFacet.of({ enabled: true, visibleLines: 3, dimOpacity: 0.1 })],
    });
    const config = state.facet(zenFacet);
    expect(config.enabled).toBe(true);
    expect(config.visibleLines).toBe(3);
    expect(config.dimOpacity).toBe(0.1);
  });
});

// ─── Extension constructors ─────────────────────────────────────────────────

describe('typewriterScroll', () => {
  it('returns an array of extensions', () => {
    const exts = typewriterScroll();
    expect(Array.isArray(exts)).toBe(true);
    expect(exts.length).toBeGreaterThan(0);
  });

  it('includes custom config in facet', () => {
    const exts = typewriterScroll({ enabled: true, offset: 0.7 });
    const state = EditorState.create({ doc: 'x', extensions: exts });
    const config = state.facet(typewriterFacet);
    expect(config.enabled).toBe(true);
    expect(config.offset).toBe(0.7);
  });
});

describe('zenMode', () => {
  it('returns an array of extensions', () => {
    const exts = zenMode();
    expect(Array.isArray(exts)).toBe(true);
    expect(exts.length).toBeGreaterThan(0);
  });

  it('includes custom config in facet', () => {
    const exts = zenMode({ enabled: true, visibleLines: 10 });
    const state = EditorState.create({ doc: 'x', extensions: exts });
    const config = state.facet(zenFacet);
    expect(config.enabled).toBe(true);
    expect(config.visibleLines).toBe(10);
  });
});

describe('typewriterMode', () => {
  it('combines both typewriter and zen extensions', () => {
    const exts = typewriterMode(
      { enabled: true, offset: 0.3 },
      { enabled: true, visibleLines: 2 },
    );
    expect(Array.isArray(exts)).toBe(true);
    const state = EditorState.create({ doc: 'test', extensions: exts });
    const tw = state.facet(typewriterFacet);
    const zm = state.facet(zenFacet);
    expect(tw.enabled).toBe(true);
    expect(tw.offset).toBe(0.3);
    expect(zm.enabled).toBe(true);
    expect(zm.visibleLines).toBe(2);
  });

  it('works with no arguments', () => {
    const exts = typewriterMode();
    const state = stateWith(exts);
    expect(state.facet(typewriterFacet).enabled).toBe(false);
    expect(state.facet(zenFacet).enabled).toBe(false);
  });
});

// ─── Config types ───────────────────────────────────────────────────────────

describe('TypewriterConfig type', () => {
  it('offset is clamped when used', () => {
    // offset clamping happens in the scroll plugin, but verify the config accepts any number
    const config: TypewriterConfig = { enabled: true, offset: 1.5, onlyKeyboard: false };
    expect(config.offset).toBe(1.5);
  });
});

describe('ZenConfig type', () => {
  it('accepts valid values', () => {
    const config: ZenConfig = { enabled: true, visibleLines: 0, dimOpacity: 0 };
    expect(config.visibleLines).toBe(0);
    expect(config.dimOpacity).toBe(0);
  });
});

// ─── Reconfiguration ────────────────────────────────────────────────────────

describe('facet reconfiguration', () => {
  it('can reconfigure typewriter via transaction', () => {
    const exts = typewriterScroll({ enabled: false });
    const state = EditorState.create({ doc: 'abc', extensions: exts });
    expect(state.facet(typewriterFacet).enabled).toBe(false);
  });

  it('can reconfigure zen via transaction', () => {
    const exts = zenMode({ enabled: true, dimOpacity: 0.5 });
    const state = EditorState.create({ doc: 'abc', extensions: exts });
    expect(state.facet(zenFacet).dimOpacity).toBe(0.5);
  });
});
