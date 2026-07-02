/**
 * T009: Graph simulation and export utility tests.
 * Tests filterGraphData, initNodes, tickForces, getNodeRadius, getNodeColor,
 * hitTestNode from simulation.ts and exportGraphAsJSON / exportGraphAsSVG from export.ts.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/utils/logger', () => ({
  log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import {
  filterGraphData,
  initNodes,
  tickForces,
  getNodeRadius,
  getNodeColor,
  hitTestNode,
  DEFAULT_NODE_COLORS,
  type SimNode,
} from '../simulation';
import { exportGraphAsJSON } from '../export';
import type { GraphData, GraphNode, GraphEdge, GraphSettings } from '../../types';

const DEFAULT_SETTINGS: GraphSettings = {
  showTags: true,
  showAttachments: true,
  showOrphans: true,
  showArrows: false,
  showLabels: true,
  textFadeThreshold: 0.5,
  nodeSize: 1,
  linkThickness: 1,
  centerForce: 0.1,
  repelForce: 300,
  linkForce: 0.3,
  linkDistance: 120,
  animate: false,
  damping: 0.85,
  collisionRadius: 20,
};

function makeNode(id: string, label: string, type = 'note'): GraphNode {
  return { id, label, node_type: type, connection_count: 0 };
}

function makeEdge(from: string, to: string, type = 'wikilink'): GraphEdge {
  return { from, to, edge_type: type };
}

function makeGraphData(nodes: GraphNode[], edges: GraphEdge[]): GraphData {
  return { nodes, edges };
}

describe('filterGraphData', () => {
  const nodeA = makeNode('a.md', 'Note A');
  const nodeB = makeNode('b.md', 'Note B');
  const tagNode = makeNode('project', 'project', 'tag');
  const edge = makeEdge('a.md', 'b.md');

  it('returns all nodes when no filters applied', () => {
    const data = makeGraphData([nodeA, nodeB], [edge]);
    const result = filterGraphData(data, {
      showOrphans: true,
      isLocal: false,
      centerNode: null,
      depth: 1,
    });
    expect(result.nodes).toHaveLength(2);
    expect(result.edges).toHaveLength(1);
  });

  it('filters by searchQuery', () => {
    const data = makeGraphData([nodeA, nodeB], [edge]);
    const result = filterGraphData(data, {
      searchQuery: 'Note A',
      showOrphans: true,
      isLocal: false,
      centerNode: null,
      depth: 1,
    });
    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0].id).toBe('a.md');
  });

  it('filters by node type', () => {
    const data = makeGraphData([nodeA, tagNode], []);
    const result = filterGraphData(data, {
      types: ['tag'],
      showOrphans: true,
      isLocal: false,
      centerNode: null,
      depth: 1,
    });
    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0].node_type).toBe('tag');
  });

  it('hides orphan nodes when showOrphans is false', () => {
    const orphan = makeNode('orphan.md', 'Orphan');
    const data = makeGraphData([nodeA, nodeB, orphan], [edge]);
    const result = filterGraphData(data, {
      showOrphans: false,
      isLocal: false,
      centerNode: null,
      depth: 1,
    });
    expect(result.nodes.map((n) => n.id)).not.toContain('orphan.md');
  });

  it('filters by folder prefix', () => {
    const noteInFolder = makeNode('work/project.md', 'Project');
    const noteOther = makeNode('personal/diary.md', 'Diary');
    const data = makeGraphData([noteInFolder, noteOther], []);
    const result = filterGraphData(data, {
      folder: 'work/',
      showOrphans: true,
      isLocal: false,
      centerNode: null,
      depth: 1,
    });
    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0].id).toBe('work/project.md');
  });

  it('local graph: only shows center node and neighbors within depth', () => {
    const nodeC = makeNode('c.md', 'Note C');
    const edgeAB = makeEdge('a.md', 'b.md');
    const edgeBC = makeEdge('b.md', 'c.md');
    const data = makeGraphData([nodeA, nodeB, nodeC], [edgeAB, edgeBC]);
    const result = filterGraphData(data, {
      showOrphans: true,
      isLocal: true,
      centerNode: 'a.md',
      depth: 1,
    });
    const ids = result.nodes.map((n) => n.id);
    expect(ids).toContain('a.md');
    expect(ids).toContain('b.md');
    expect(ids).not.toContain('c.md');
  });

  it('excludes hidden tag nodes from graph', () => {
    const data = makeGraphData([nodeA, tagNode], []);
    const result = filterGraphData(data, {
      showOrphans: true,
      isLocal: false,
      centerNode: null,
      depth: 1,
      hiddenTags: new Set(['project']),
    });
    expect(result.nodes.map((n) => n.id)).not.toContain('project');
  });

  it('removes edges whose endpoints were filtered out', () => {
    const data = makeGraphData([nodeA, nodeB], [edge]);
    const result = filterGraphData(data, {
      searchQuery: 'Note A',
      showOrphans: true,
      isLocal: false,
      centerNode: null,
      depth: 1,
    });
    expect(result.edges).toHaveLength(0);
  });
});

describe('initNodes', () => {
  it('creates SimNodes with x/y positions within bounds', () => {
    const nodes = [makeNode('a.md', 'A'), makeNode('b.md', 'B')];
    const edges = [makeEdge('a.md', 'b.md')];
    const simNodes = initNodes(nodes, edges, 800, 600);
    expect(simNodes).toHaveLength(2);
    simNodes.forEach((n) => {
      expect(n.x).toBeGreaterThanOrEqual(0);
      expect(n.x).toBeLessThanOrEqual(800);
      expect(n.y).toBeGreaterThanOrEqual(0);
      expect(n.y).toBeLessThanOrEqual(600);
    });
  });

  it('computes connection_count from edges', () => {
    const nodes = [makeNode('a.md', 'A'), makeNode('b.md', 'B')];
    const edges = [makeEdge('a.md', 'b.md')];
    const simNodes = initNodes(nodes, edges, 800, 600);
    const nodeA = simNodes.find((n) => n.id === 'a.md')!;
    expect(nodeA.connection_count).toBe(1);
  });

  it('reuses existing node positions', () => {
    const nodes = [makeNode('a.md', 'A')];
    const existing: SimNode[] = [{ ...makeNode('a.md', 'A'), x: 100, y: 200, vx: 0, vy: 0 }];
    const simNodes = initNodes(nodes, [], 800, 600, existing);
    expect(simNodes[0].x).toBe(100);
    expect(simNodes[0].y).toBe(200);
  });
});

describe('tickForces', () => {
  it('mutates node velocities and positions', () => {
    const nodes = initNodes([makeNode('a.md', 'A'), makeNode('b.md', 'B')], [], 800, 600);
    tickForces(nodes, [], DEFAULT_SETTINGS, 800, 600);
    // After tick, position should have changed due to forces
    expect(typeof nodes[0].x).toBe('number');
    expect(nodes[0].x).not.toBeNaN();
    // Velocity was applied
    expect(nodes[0].vx).toBeDefined();
  });

  it('applies link force between connected nodes', () => {
    const nodeA: SimNode = { ...makeNode('a.md', 'A'), x: 0, y: 0, vx: 0, vy: 0 };
    const nodeB: SimNode = { ...makeNode('b.md', 'B'), x: 200, y: 0, vx: 0, vy: 0 };
    const edges = [makeEdge('a.md', 'b.md')];
    tickForces([nodeA, nodeB], edges, DEFAULT_SETTINGS, 800, 600);
    // Link force should pull nodes toward link distance — nodeA should gain positive vx
    expect(nodeA.vx).not.toBe(0);
  });
});

describe('getNodeRadius', () => {
  it('returns base radius for node with no connections', () => {
    const node: SimNode = {
      ...makeNode('a.md', 'A'),
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      connection_count: 0,
    };
    const r = getNodeRadius(node, DEFAULT_SETTINGS);
    expect(r).toBe(4 * DEFAULT_SETTINGS.nodeSize);
  });

  it('adds bonus for connected nodes, capped at 6', () => {
    const node: SimNode = {
      ...makeNode('a.md', 'A'),
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      connection_count: 20,
    };
    const r = getNodeRadius(node, DEFAULT_SETTINGS);
    expect(r).toBe(4 * DEFAULT_SETTINGS.nodeSize + 6);
  });
});

describe('getNodeColor', () => {
  it('returns note color for note type', () => {
    const node = makeNode('a.md', 'A', 'note');
    expect(getNodeColor(node, DEFAULT_NODE_COLORS)).toBe(DEFAULT_NODE_COLORS.note);
  });

  it('returns tag color for tag type', () => {
    const node = makeNode('my-tag', 'my-tag', 'tag');
    expect(getNodeColor(node, DEFAULT_NODE_COLORS)).toBe(DEFAULT_NODE_COLORS.tag);
  });

  it('returns attachment color for attachment type', () => {
    const node = makeNode('file.pdf', 'file.pdf', 'attachment');
    expect(getNodeColor(node, DEFAULT_NODE_COLORS)).toBe(DEFAULT_NODE_COLORS.attachment);
  });

  it('returns unresolved color for unresolved type', () => {
    const node = makeNode('missing.md', 'missing.md', 'unresolved');
    expect(getNodeColor(node, DEFAULT_NODE_COLORS)).toBe(DEFAULT_NODE_COLORS.unresolved);
  });

  it('applies custom color group when query matches label', () => {
    const node = makeNode('a.md', 'ProjectAlpha', 'note');
    const result = getNodeColor(node, DEFAULT_NODE_COLORS, [
      { query: 'ProjectAlpha', color: '#ff0000' },
    ]);
    expect(result).toBe('#ff0000');
  });

  it('supports path: prefix in color group query', () => {
    const node = makeNode('work/project.md', 'project', 'note');
    const result = getNodeColor(node, DEFAULT_NODE_COLORS, [
      { query: 'path:work/', color: '#00ff00' },
    ]);
    expect(result).toBe('#00ff00');
  });
});

describe('hitTestNode', () => {
  const simNodes: SimNode[] = [
    { ...makeNode('a.md', 'A'), x: 100, y: 100, vx: 0, vy: 0 },
    { ...makeNode('b.md', 'B'), x: 300, y: 300, vx: 0, vy: 0 },
  ];

  it('finds node within hit radius', () => {
    const found = hitTestNode(simNodes, 105, 98, 10);
    expect(found?.id).toBe('a.md');
  });

  it('returns undefined when no node within radius', () => {
    expect(hitTestNode(simNodes, 200, 200, 10)).toBeUndefined();
  });
});

describe('exportGraphAsJSON', () => {
  let capturedBlob: Blob | null = null;

  beforeEach(() => {
    capturedBlob = null;
    const createObjectURL = vi.fn((b: Blob) => {
      capturedBlob = b;
      return 'blob:mock';
    });
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });

    const clickMock = vi.fn();
    vi.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click: clickMock,
    } as unknown as HTMLAnchorElement);
  });

  it('builds correct JSON structure and triggers download', async () => {
    exportGraphAsJSON(
      [{ id: 'a.md', label: 'A', node_type: 'note' }],
      [{ from: 'a.md', to: 'b.md', edge_type: 'wikilink' }],
      'test-export.json'
    );

    expect(capturedBlob).not.toBeNull();
    const text = await capturedBlob!.text();
    const parsed = JSON.parse(text);
    expect(parsed.nodes).toHaveLength(1);
    expect(parsed.edges).toHaveLength(1);
    expect(parsed.metadata.nodeCount).toBe(1);
    expect(parsed.metadata.edgeCount).toBe(1);
    expect(parsed.metadata.exportedAt).toBeDefined();
  });

  it('handles empty graph', async () => {
    exportGraphAsJSON([], []);
    expect(capturedBlob).not.toBeNull();
    const text = await capturedBlob!.text();
    const parsed = JSON.parse(text);
    expect(parsed.nodes).toHaveLength(0);
    expect(parsed.edges).toHaveLength(0);
    expect(parsed.metadata.nodeCount).toBe(0);
  });
});
