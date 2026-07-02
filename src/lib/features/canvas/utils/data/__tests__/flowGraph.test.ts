import { describe, it, expect } from 'vitest';
import {
  buildFlowGraph,
  resolveFlowTarget,
  getReachableFrames,
  findEntryFrame,
  createFlowLink,
} from '../flowGraph';
import type { CanvasElement, FlowLink } from '@/features/canvas/types';

function makeFrame(id: string, x = 0, y = 0): CanvasElement {
  return {
    id,
    element_type: 'frame',
    x,
    y,
    width: 100,
    height: 80,
    rotation: 0,
    properties: {},
    layer_id: 'default',
    z_index: 0,
    locked: false,
    visible: true,
    name: id,
  };
}

function makeLink(
  from: string,
  to: string,
  opts?: { hotspotElementId?: string; label?: string }
): FlowLink {
  return {
    id: `link_${from}_${to}`,
    fromFrameId: from,
    toFrameId: to,
    hotspotElementId: opts?.hotspotElementId,
    transition: { type: 'instant', duration: 0 },
    label: opts?.label,
  };
}

describe('flowGraph', () => {
  const frames = [makeFrame('A'), makeFrame('B'), makeFrame('C'), makeFrame('D')];
  const links: FlowLink[] = [
    makeLink('A', 'B'),
    makeLink('B', 'C'),
    makeLink('A', 'D', { hotspotElementId: 'btn1' }),
  ];

  describe('buildFlowGraph', () => {
    it('creates nodes for all frames', () => {
      const graph = buildFlowGraph(links, frames);
      expect(graph.nodes.size).toBe(4);
      expect(graph.nodes.has('A')).toBe(true);
      expect(graph.nodes.has('D')).toBe(true);
    });

    it('populates outgoing and incoming edges correctly', () => {
      const graph = buildFlowGraph(links, frames);
      const nodeA = graph.nodes.get('A')!;
      expect(nodeA.outgoing).toHaveLength(2);
      expect(nodeA.incoming).toHaveLength(0);

      const nodeB = graph.nodes.get('B')!;
      expect(nodeB.outgoing).toHaveLength(1);
      expect(nodeB.incoming).toHaveLength(1);

      const nodeC = graph.nodes.get('C')!;
      expect(nodeC.outgoing).toHaveLength(0);
      expect(nodeC.incoming).toHaveLength(1);
    });

    it('stores links array', () => {
      const graph = buildFlowGraph(links, frames);
      expect(graph.links).toBe(links);
    });
  });

  describe('resolveFlowTarget', () => {
    const graph = buildFlowGraph(links, frames);

    it('resolves hotspot link when clickedElementId matches', () => {
      const result = resolveFlowTarget(graph, 'A', 'btn1');
      expect(result).not.toBeNull();
      expect(result!.toFrameId).toBe('D');
    });

    it('falls back to default outgoing link without hotspot', () => {
      const result = resolveFlowTarget(graph, 'A');
      expect(result).not.toBeNull();
      expect(result!.toFrameId).toBe('B');
    });

    it('returns null for a node with no outgoing links', () => {
      const result = resolveFlowTarget(graph, 'C');
      expect(result).toBeNull();
    });

    it('returns null for unknown frame', () => {
      const result = resolveFlowTarget(graph, 'unknown');
      expect(result).toBeNull();
    });
  });

  describe('getReachableFrames', () => {
    const graph = buildFlowGraph(links, frames);

    it('returns all reachable frames from A', () => {
      const reachable = getReachableFrames(graph, 'A');
      expect(reachable).toContain('A');
      expect(reachable).toContain('B');
      expect(reachable).toContain('C');
      expect(reachable).toContain('D');
      expect(reachable).toHaveLength(4);
    });

    it('returns subset from C (no outgoing)', () => {
      const reachable = getReachableFrames(graph, 'C');
      expect(reachable).toEqual(['C']);
    });
  });

  describe('findEntryFrame', () => {
    it('picks the frame with no incoming links and at least one outgoing', () => {
      const graph = buildFlowGraph(links, frames);
      const entry = findEntryFrame(graph, frames);
      expect(entry).toBe('A');
    });

    it('falls back to first frame when all have incoming', () => {
      const cyclicLinks = [makeLink('A', 'B'), makeLink('B', 'A')];
      const twoFrames = [makeFrame('A'), makeFrame('B')];
      const graph = buildFlowGraph(cyclicLinks, twoFrames);
      const entry = findEntryFrame(graph, twoFrames);
      expect(entry).toBe('A');
    });

    it('returns null for empty frames', () => {
      const graph = buildFlowGraph([], []);
      expect(findEntryFrame(graph, [])).toBeNull();
    });
  });

  describe('createFlowLink', () => {
    it('creates a link with default transition', () => {
      const link = createFlowLink('X', 'Y');
      expect(link.fromFrameId).toBe('X');
      expect(link.toFrameId).toBe('Y');
      expect(link.transition.type).toBe('instant');
      expect(link.id).toMatch(/^flow_/);
    });

    it('accepts custom options', () => {
      const link = createFlowLink('X', 'Y', {
        label: 'Next',
        hotspotElementId: 'h1',
        transition: { type: 'dissolve', duration: 500 },
      });
      expect(link.label).toBe('Next');
      expect(link.hotspotElementId).toBe('h1');
      expect(link.transition.type).toBe('dissolve');
    });
  });
});
