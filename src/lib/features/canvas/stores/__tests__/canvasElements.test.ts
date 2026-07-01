import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { currentCanvas, selectedFlowLink, selectedElements } from '../elements/canvasStore';
import {
  addFlowLink,
  deleteElement,
  deleteSelectedElements,
  updateFlowLink,
  removeFlowLink,
  removeFlowLinksForElement,
} from '../elements/canvasElements';
import type { CanvasDocument, CanvasElement, FlowLink } from '@/features/canvas/types';

function makeCanvas(elements: CanvasElement[], flowLinks: FlowLink[]): CanvasDocument {
  return {
    id: 'test-canvas',
    name: 'Test',
    vault_id: null,
    note_id: null,
    grid_size: 16,
    snap_to_grid: true,
    elements,
    flowLinks,
    layers: [{ id: 'default', name: 'Default', z_order: 0, visible: true, locked: false }],
    pages: [],
    activePageId: '',
    components: [],
    styles: [],
    variables: [],
    viewport: { x: 0, y: 0, scale: 1 },
    created_at: 0,
    modified_at: 0,
  };
}

function makeFrame(id: string): CanvasElement {
  return {
    id,
    element_type: 'frame',
    x: 0, y: 0, width: 100, height: 80,
    rotation: 0,
    properties: {},
    layer_id: 'default',
    z_index: 0,
    locked: false,
    visible: true,
    name: id,
  };
}

function makeLink(id: string, from: string, to: string): FlowLink {
  return {
    id,
    fromFrameId: from,
    toFrameId: to,
    transition: { type: 'instant', duration: 0 },
  };
}

describe('canvasElements flow link operations', () => {
  beforeEach(() => {
    const canvas = makeCanvas(
      [makeFrame('frame1'), makeFrame('frame2'), makeFrame('frame3')],
      [makeLink('link1', 'frame1', 'frame2'), makeLink('link2', 'frame2', 'frame3')]
    );
    currentCanvas.set(canvas);
    selectedFlowLink.set(null);
  });

  describe('updateFlowLink', () => {
    it('updates flow link label', () => {
      updateFlowLink('link1', { label: 'Next' });
      const canvas = get(currentCanvas)!;
      expect(canvas.flowLinks![0].label).toBe('Next');
    });

    it('updates flow link target', () => {
      updateFlowLink('link1', { toFrameId: 'frame3' });
      const canvas = get(currentCanvas)!;
      expect(canvas.flowLinks![0].toFrameId).toBe('frame3');
    });

    it('no-ops for nonexistent link ID', () => {
      const before = get(currentCanvas)!.modified_at;
      updateFlowLink('nonexistent', { label: 'Nope' });
      expect(get(currentCanvas)!.modified_at).toBe(before);
    });
  });

  describe('removeFlowLink', () => {
    it('removes a flow link by ID', () => {
      removeFlowLink('link1');
      const canvas = get(currentCanvas)!;
      expect(canvas.flowLinks).toHaveLength(1);
      expect(canvas.flowLinks![0].id).toBe('link2');
    });

    it('clears selectedFlowLink if it was the removed link', () => {
      selectedFlowLink.set('link1');
      removeFlowLink('link1');
      expect(get(selectedFlowLink)).toBeNull();
    });
  });

  describe('removeFlowLinksForElement', () => {
    it('removes all links connected to an element', () => {
      removeFlowLinksForElement('frame2');
      const canvas = get(currentCanvas)!;
      expect(canvas.flowLinks).toHaveLength(0);
    });

    it('preserves unrelated links', () => {
      removeFlowLinksForElement('frame3');
      const canvas = get(currentCanvas)!;
      expect(canvas.flowLinks).toHaveLength(1);
      expect(canvas.flowLinks![0].id).toBe('link1');
    });
  });

  describe('deleteElement cascade', () => {
    it('removes flow links connected to a deleted frame', () => {
      deleteElement('frame1');
      const canvas = get(currentCanvas)!;
      expect(canvas.elements).toHaveLength(2);
      expect(canvas.flowLinks!.find((l) => l.fromFrameId === 'frame1')).toBeUndefined();
    });

    it('removes element from elements array', () => {
      deleteElement('frame2');
      const canvas = get(currentCanvas)!;
      expect(canvas.elements.find((e) => e.id === 'frame2')).toBeUndefined();
      expect(canvas.flowLinks).toHaveLength(0);
    });
  });

  describe('addFlowLink', () => {
    it('appends a new flow link to the document', () => {
      const newLink: FlowLink = { id: 'link3', fromFrameId: 'frame1', toFrameId: 'frame3', transition: { type: 'dissolve', duration: 300 } };
      addFlowLink(newLink);
      const canvas = get(currentCanvas)!;
      expect(canvas.flowLinks).toHaveLength(3);
      expect(canvas.flowLinks![2].id).toBe('link3');
    });

    it('initializes flowLinks array if absent', () => {
      const canvasNoLinks = makeCanvas([makeFrame('f1')], []);
      delete (canvasNoLinks as CanvasDocument & { flowLinks?: FlowLink[] }).flowLinks;
      currentCanvas.set(canvasNoLinks);

      const link: FlowLink = { id: 'lnew', fromFrameId: 'f1', toFrameId: 'f1', transition: { type: 'instant', duration: 0 } };
      addFlowLink(link);
      expect(get(currentCanvas)!.flowLinks).toHaveLength(1);
    });
  });

  describe('deleteSelectedElements cascade (T060)', () => {
    it('removes flow links for all deleted elements', () => {
      selectedElements.set(['frame1', 'frame2']);
      deleteSelectedElements();
      const canvas = get(currentCanvas)!;
      expect(canvas.elements).toHaveLength(1);
      expect(canvas.flowLinks).toHaveLength(0);
    });

    it('preserves flow links not connected to deleted elements', () => {
      selectedElements.set(['frame3']);
      deleteSelectedElements();
      const canvas = get(currentCanvas)!;
      expect(canvas.elements).toHaveLength(2);
      expect(canvas.flowLinks).toHaveLength(1);
      expect(canvas.flowLinks![0].id).toBe('link1');
    });
  });
});
