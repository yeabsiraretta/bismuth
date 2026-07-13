import { describe, expect, it } from 'vitest';

import {
  DEFAULT_LEFT_HUB,
  DEFAULT_LEFT_PANEL,
  DEFAULT_RIGHT_HUB,
  DEFAULT_RIGHT_PANEL,
  type HubDef,
  LEFT_HUBS,
  RIGHT_HUBS,
} from '@/constants/hub-registry';

// ── Fixtures ─────────────────────────────────────────────────────

/** Panels that MUST live on the right (note-specific) sidebar. */
const REQUIRED_RIGHT_PANELS = [
  'outline',
  'properties',
  'backlinks',
  'outgoing',
  'versions',
  'wordcount',
  'footnotes',
  'symbols',
] as const;

/** Hubs that MUST live on the left (vault-wide) sidebar. */
const REQUIRED_LEFT_HUBS = ['navigator', 'knowledge', 'planner', 'integration'] as const;

/** Hubs that MUST live on the right sidebar. */
const REQUIRED_RIGHT_HUBS = ['editor', 'canvas'] as const;

// ── Helpers ──────────────────────────────────────────────────────

function allPanelIds(hubs: HubDef[]): string[] {
  return hubs.flatMap((h) => h.panels.map((p) => p.id));
}

function allHubIds(hubs: HubDef[]): string[] {
  return hubs.map((h) => h.id);
}

// ── Tests ────────────────────────────────────────────────────────

describe('Hub Registry — Design Rules', () => {
  describe('Left sidebar (vault-wide)', () => {
    it('should contain all required vault-wide hubs', () => {
      const ids = allHubIds(LEFT_HUBS);
      for (const hub of REQUIRED_LEFT_HUBS) {
        expect(ids, `missing left hub: ${hub}`).toContain(hub);
      }
    });

    it('should NOT contain any note-specific hubs', () => {
      const ids = allHubIds(LEFT_HUBS);
      for (const hub of REQUIRED_RIGHT_HUBS) {
        expect(ids, `${hub} should not be on the left`).not.toContain(hub);
      }
    });

    it('should NOT contain any note-specific panels', () => {
      const panelIds = allPanelIds(LEFT_HUBS);
      for (const panel of REQUIRED_RIGHT_PANELS) {
        expect(panelIds, `${panel} should not be on the left`).not.toContain(panel);
      }
    });
  });

  describe('Right sidebar (note-specific)', () => {
    it('should contain all required note-specific hubs', () => {
      const ids = allHubIds(RIGHT_HUBS);
      for (const hub of REQUIRED_RIGHT_HUBS) {
        expect(ids, `missing right hub: ${hub}`).toContain(hub);
      }
    });

    it('should NOT contain vault-wide hubs', () => {
      const ids = allHubIds(RIGHT_HUBS);
      for (const hub of REQUIRED_LEFT_HUBS) {
        expect(ids, `${hub} should not be on the right`).not.toContain(hub);
      }
    });

    it('should contain all required note-specific panels in the editor hub', () => {
      const editorHub = RIGHT_HUBS.find((h) => h.id === 'editor');
      expect(editorHub).toBeDefined();
      const panelIds = editorHub!.panels.map((p) => p.id);
      for (const panel of REQUIRED_RIGHT_PANELS) {
        expect(panelIds, `editor hub missing panel: ${panel}`).toContain(panel);
      }
    });
  });

  describe('Structural integrity', () => {
    it('should have no duplicate hub IDs across both sidebars', () => {
      const leftIds = allHubIds(LEFT_HUBS);
      const rightIds = allHubIds(RIGHT_HUBS);
      const overlap = leftIds.filter((id) => rightIds.includes(id));
      expect(overlap, 'hubs appear on both sidebars').toEqual([]);
    });

    it('should have no duplicate panel IDs within a single hub', () => {
      const allHubs = [...LEFT_HUBS, ...RIGHT_HUBS];
      for (const hub of allHubs) {
        const ids = hub.panels.map((p) => p.id);
        const unique = new Set(ids);
        expect(ids.length, `duplicate panels in hub: ${hub.id}`).toBe(unique.size);
      }
    });

    it('every hub should have at least one panel', () => {
      const allHubs = [...LEFT_HUBS, ...RIGHT_HUBS];
      for (const hub of allHubs) {
        expect(hub.panels.length, `hub ${hub.id} has no panels`).toBeGreaterThan(0);
      }
    });

    it('every hub and panel should have a non-empty label and icon', () => {
      const allHubs = [...LEFT_HUBS, ...RIGHT_HUBS];
      for (const hub of allHubs) {
        expect(hub.label.trim(), `hub ${hub.id} has empty label`).not.toBe('');
        expect(hub.icon.trim(), `hub ${hub.id} has empty icon`).not.toBe('');
        for (const panel of hub.panels) {
          expect(panel.label.trim(), `panel ${panel.id} has empty label`).not.toBe('');
          expect(panel.icon.trim(), `panel ${panel.id} has empty icon`).not.toBe('');
        }
      }
    });
  });

  describe('Defaults', () => {
    it('DEFAULT_LEFT_HUB should reference an existing left hub', () => {
      expect(allHubIds(LEFT_HUBS)).toContain(DEFAULT_LEFT_HUB);
    });

    it('DEFAULT_LEFT_PANEL should be a panel within the default left hub', () => {
      const hub = LEFT_HUBS.find((h) => h.id === DEFAULT_LEFT_HUB);
      expect(hub).toBeDefined();
      expect(hub!.panels.map((p) => p.id)).toContain(DEFAULT_LEFT_PANEL);
    });

    it('DEFAULT_RIGHT_HUB should reference an existing right hub', () => {
      expect(allHubIds(RIGHT_HUBS)).toContain(DEFAULT_RIGHT_HUB);
    });

    it('DEFAULT_RIGHT_PANEL should be a panel within the default right hub', () => {
      const hub = RIGHT_HUBS.find((h) => h.id === DEFAULT_RIGHT_HUB);
      expect(hub).toBeDefined();
      expect(hub!.panels.map((p) => p.id)).toContain(DEFAULT_RIGHT_PANEL);
    });
  });
});
