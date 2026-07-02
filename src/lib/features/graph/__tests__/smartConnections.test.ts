import { describe, it, expect } from 'vitest';
import {
  getRelevanceThickness,
  getRelevanceDistance,
  truncateLabel,
  buildSmartGraph,
} from '../services/smartConnections';
import type { SmartConnection, SmartGraphSettings } from '../types';

const baseSettings: SmartGraphSettings = {
  minRelevance: 0.3,
  connectionMode: 'note',
  minLinkThickness: 1,
  maxLinkThickness: 6,
  nodeLabelSize: 11,
  linkLabelSize: 9,
  maxLabelChars: 30,
  showLinkLabels: true,
  showPreviewOnHover: true,
  centerNodeScale: 2.0,
};

describe('getRelevanceThickness', () => {
  it('returns minThickness at relevance 0', () => {
    expect(getRelevanceThickness(0, 1, 6)).toBe(1);
  });

  it('returns maxThickness at relevance 1', () => {
    expect(getRelevanceThickness(1, 1, 6)).toBe(6);
  });

  it('interpolates linearly', () => {
    expect(getRelevanceThickness(0.5, 1, 6)).toBe(3.5);
  });

  it('clamps values above 1', () => {
    expect(getRelevanceThickness(1.5, 1, 6)).toBe(6);
  });

  it('clamps values below 0', () => {
    expect(getRelevanceThickness(-0.5, 1, 6)).toBe(1);
  });
});

describe('getRelevanceDistance', () => {
  it('returns shorter distance for higher relevance', () => {
    const highRel = getRelevanceDistance(0.9, 140);
    const lowRel = getRelevanceDistance(0.3, 140);
    expect(highRel).toBeLessThan(lowRel);
  });

  it('returns positive distance', () => {
    expect(getRelevanceDistance(1.0, 140)).toBeGreaterThan(0);
  });
});

describe('truncateLabel', () => {
  it('returns short labels unchanged', () => {
    expect(truncateLabel('Hello', 30)).toBe('Hello');
  });

  it('truncates long labels with ellipsis', () => {
    const long = 'A'.repeat(40);
    const result = truncateLabel(long, 30);
    expect(result.length).toBe(30);
    expect(result.endsWith('\u2026')).toBe(true);
  });

  it('handles exact length', () => {
    const exact = 'A'.repeat(30);
    expect(truncateLabel(exact, 30)).toBe(exact);
  });
});

describe('buildSmartGraph', () => {
  const connections: SmartConnection[] = [
    { path: 'note1.md', score: 0.8, isBlock: false, label: 'Note 1' },
    { path: 'note2.md', score: 0.5, isBlock: false, label: 'Note 2' },
    { path: 'note3.md', score: 0.2, isBlock: false, label: 'Note 3' },
  ];

  it('creates center node + connected nodes', () => {
    const { nodes, edges } = buildSmartGraph('center.md', 'Center', connections, baseSettings);
    expect(nodes[0].id).toBe('center.md');
    expect(nodes).toHaveLength(3); // center + 2 (note3 filtered by minRelevance 0.3)
    expect(edges).toHaveLength(2);
  });

  it('filters connections below minRelevance', () => {
    const { nodes } = buildSmartGraph('c.md', 'C', connections, {
      ...baseSettings,
      minRelevance: 0.6,
    });
    expect(nodes).toHaveLength(2); // center + note1 only
  });

  it('sets relevance on edges', () => {
    const { edges } = buildSmartGraph('c.md', 'C', connections, baseSettings);
    expect(edges[0].relevance).toBe(0.8);
    expect(edges[1].relevance).toBe(0.5);
  });

  it('sets edge_type to smart', () => {
    const { edges } = buildSmartGraph('c.md', 'C', connections, baseSettings);
    expect(edges.every((e) => e.edge_type === 'smart')).toBe(true);
  });

  it('deduplicates block connections to note-level in note mode', () => {
    const blockConns: SmartConnection[] = [
      { path: 'doc.md#heading1', score: 0.7, isBlock: true, label: 'Doc > H1' },
      { path: 'doc.md#heading2', score: 0.9, isBlock: true, label: 'Doc > H2' },
      { path: 'other.md', score: 0.5, isBlock: false, label: 'Other' },
    ];
    const { nodes, edges } = buildSmartGraph('c.md', 'C', blockConns, {
      ...baseSettings,
      connectionMode: 'note',
    });
    // doc.md should appear once with highest score (0.9)
    expect(nodes).toHaveLength(3); // center + doc.md + other.md
    const docEdge = edges.find((e) => e.to === 'doc.md');
    expect(docEdge?.relevance).toBe(0.9);
  });

  it('keeps block connections separate in block mode', () => {
    const blockConns: SmartConnection[] = [
      { path: 'doc.md#h1', score: 0.7, isBlock: true, label: 'Doc > H1' },
      { path: 'doc.md#h2', score: 0.9, isBlock: true, label: 'Doc > H2' },
    ];
    const { nodes } = buildSmartGraph('c.md', 'C', blockConns, {
      ...baseSettings,
      connectionMode: 'block',
    });
    expect(nodes).toHaveLength(3); // center + 2 blocks
  });
});
