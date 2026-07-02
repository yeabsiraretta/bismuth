import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
  viewMode,
  viewport,
  selectedFlowLink,
  selectFlowLink,
  clearFlowLinkSelection,
  selectedElements,
} from '../elements/canvasStore';

describe('canvasStore viewMode', () => {
  beforeEach(() => {
    viewMode.set('detail');
    viewport.set({ x: 0, y: 0, scale: 1 });
  });

  it('defaults to detail mode', () => {
    expect(get(viewMode)).toBe('detail');
  });

  it('can toggle to overview mode', () => {
    viewMode.set('overview');
    expect(get(viewMode)).toBe('overview');
  });

  it('can toggle back to detail mode', () => {
    viewMode.set('overview');
    viewMode.set('detail');
    expect(get(viewMode)).toBe('detail');
  });
});

describe('canvasStore flow link selection', () => {
  beforeEach(() => {
    selectedFlowLink.set(null);
    selectedElements.set([]);
  });

  it('defaults to null', () => {
    expect(get(selectedFlowLink)).toBeNull();
  });

  it('selectFlowLink sets the ID and clears element selection', () => {
    selectedElements.set(['el1', 'el2']);
    selectFlowLink('link-abc');
    expect(get(selectedFlowLink)).toBe('link-abc');
    expect(get(selectedElements)).toEqual([]);
  });

  it('clearFlowLinkSelection resets to null', () => {
    selectFlowLink('link-123');
    clearFlowLinkSelection();
    expect(get(selectedFlowLink)).toBeNull();
  });
});

describe('canvasStore viewport', () => {
  beforeEach(() => {
    viewport.set({ x: 0, y: 0, scale: 1 });
  });

  it('supports pan by updating x and y', () => {
    viewport.update((v) => ({ ...v, x: -100, y: -50 }));
    const vp = get(viewport);
    expect(vp.x).toBe(-100);
    expect(vp.y).toBe(-50);
  });

  it('supports zoom by updating scale', () => {
    viewport.update((v) => ({ ...v, scale: 2 }));
    expect(get(viewport).scale).toBe(2);
  });
});
