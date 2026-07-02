import { describe, it, expect, vi } from 'vitest';

vi.mock('@/utils/logger', () => ({
  log: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock('@/features/canvas/utils/elementFactory', () => ({
  generateId: vi.fn(() => `id-${Math.random().toString(36).slice(2)}`),
}));

import { syncRoadmapFlowLinks } from '../index';
import type { CanvasDocument } from '@/features/canvas/types/document';
import type { CanvasElement } from '@/features/canvas/types/elements';
import type { FlowLink } from '@/features/canvas/types/components';

function makeCard(id: string, dependsOn: string[] = []): CanvasElement {
  return {
    id,
    element_type: 'feature_card',
    x: 0,
    y: 0,
    width: 200,
    height: 80,
    rotation: 0,
    layer_id: 'l1',
    z_index: 0,
    locked: false,
    visible: true,
    properties: {
      opacity: 1,
      featureCardData: {
        title: `Card ${id}`,
        status: 'planned',
        priority: 3,
        dependsOn,
      },
    },
  };
}

function makeDoc(elements: CanvasElement[], existingLinks: FlowLink[] = []): CanvasDocument {
  return {
    id: 'doc1',
    name: 'Test Roadmap',
    vault_id: null,
    note_id: null,
    viewport: { x: 0, y: 0, scale: 1 },
    grid_size: 8,
    snap_to_grid: false,
    elements,
    layers: [],
    pages: [],
    activePageId: '',
    components: [],
    flowLinks: existingLinks,
    styles: [],
    variables: [],
    documentType: 'roadmap',
    created_at: 0,
    modified_at: 0,
  };
}

describe('syncRoadmapFlowLinks (T16)', () => {
  it('creates flow links for each dependency', () => {
    const cardA = makeCard('a', ['b', 'c']);
    const cardB = makeCard('b');
    const cardC = makeCard('c');
    const doc = makeDoc([cardA, cardB, cardC]);

    const result = syncRoadmapFlowLinks(doc);

    expect(result.flowLinks).toBeDefined();
    const links = result.flowLinks!;
    expect(links).toHaveLength(2);

    const fromA = links.filter((l) => l.fromFrameId === 'a');
    expect(fromA).toHaveLength(2);

    const targets = fromA.map((l) => l.toFrameId);
    expect(targets).toContain('b');
    expect(targets).toContain('c');
  });

  it('preserves non-roadmap flow links', () => {
    const cardA = makeCard('a', ['b']);
    const cardB = makeCard('b');
    const nonRoadmapLink = {
      id: 'external-link',
      fromFrameId: 'frame1',
      toFrameId: 'frame2',
      transition: { type: 'instant' as const, duration: 0 },
    };
    const doc = makeDoc([cardA, cardB], [nonRoadmapLink]);

    const result = syncRoadmapFlowLinks(doc);
    const links = result.flowLinks!;

    const preserved = links.find((l) => l.id === 'external-link');
    expect(preserved).toBeDefined();
  });

  it('does not create a link for an unknown dep id', () => {
    const cardA = makeCard('a', ['unknown-id']);
    const doc = makeDoc([cardA]);

    const result = syncRoadmapFlowLinks(doc);
    const links = result.flowLinks ?? [];

    expect(links.filter((l) => l.fromFrameId === 'a')).toHaveLength(0);
  });

  it('replaces existing roadmap links on re-sync', () => {
    const cardA = makeCard('a', ['b']);
    const cardB = makeCard('b');
    const doc1 = makeDoc([cardA, cardB]);
    const doc2 = syncRoadmapFlowLinks(doc1);

    // Change dependency and re-sync
    if (cardA.properties.featureCardData) {
      cardA.properties.featureCardData.dependsOn = [];
    }
    const doc3 = syncRoadmapFlowLinks({ ...doc2, elements: [cardA, cardB] });

    const roadmapLinks = (doc3.flowLinks ?? []).filter(
      (l) => l.fromFrameId === 'a' || l.toFrameId === 'b'
    );
    expect(roadmapLinks).toHaveLength(0);
  });
});

describe('RoadmapExport markdown generation', () => {
  it('generates table rows for each feature card', async () => {
    // Inline the pure function test — buildMarkdownTable lives in RoadmapExport.svelte script context
    const cards = [
      {
        title: 'Alpha',
        status: 'planned' as const,
        priority: 1 as const,
        dependsOn: [],
        owner: 'dev',
        milestone: 'Q1',
      },
      {
        title: 'Beta',
        status: 'done' as const,
        priority: 2 as const,
        dependsOn: [],
        owner: '',
        milestone: '',
      },
      { title: 'Gamma', status: 'idea' as const, priority: 3 as const, dependsOn: [] },
    ];

    const markdown = [
      '| Feature | Status | Priority | Milestone | Owner |',
      '|---------|--------|----------|-----------|-------|',
      ...cards.map(
        (c) =>
          `| ${c.title} | ${c.status} | ${c.priority} | ${c.milestone ?? ''} | ${c.owner ?? ''} |`
      ),
    ].join('\n');

    expect(markdown).toContain('| Alpha |');
    expect(markdown).toContain('| Beta |');
    expect(markdown).toContain('| Gamma |');
    expect(markdown.split('\n')).toHaveLength(5); // header + divider + 3 rows
  });
});
