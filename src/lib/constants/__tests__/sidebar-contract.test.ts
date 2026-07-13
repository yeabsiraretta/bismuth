import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { ICON_COMPONENTS } from '@/assets/icon-registry';
import { type HubDef, LEFT_HUBS, RIGHT_HUBS } from '@/constants/hub-registry';

// ── Fixtures ─────────────────────────────────────────────────────

/**
 * Mirrors the PANEL_MAP keys from +layout.svelte.
 * Each key is `{hubId}:{panelId}` → the import path (relative to src/lib).
 * This allows us to verify that every registered panel has a component file.
 */
const PANEL_MAP_PATHS: Record<string, string> = {
  'navigator:files': 'hubs/navigator/components/FileTreePanel.svelte',
  'navigator:open-editors': 'hubs/navigator/components/OpenEditorsPanel.svelte',
  'navigator:search': 'hubs/navigator/components/SearchPanel.svelte',
  'navigator:recent': 'hubs/navigator/components/RecentPanel.svelte',
  'navigator:bookmarks': 'hubs/navigator/components/BookmarksPanel.svelte',
  'navigator:templates': 'hubs/navigator/components/TemplatePanel.svelte',
  'navigator:capture': 'hubs/navigator/components/CapturePanel.svelte',
  'planner:calendar': 'hubs/planner/components/CalendarPanel.svelte',
  'planner:tasks': 'hubs/planner/components/TasksPanel.svelte',
  'planner:daily': 'hubs/planner/components/DailyNotePanel.svelte',
  'planner:periodic': 'hubs/planner/components/PeriodicPanel.svelte',
  'planner:habits': 'hubs/planner/components/HabitsPanel.svelte',
  'knowledge:tags': 'hubs/knowledge/components/TagsPanel.svelte',
  'knowledge:vault-stats': 'hubs/knowledge/components/VaultStatsPanel.svelte',
  'knowledge:citations': 'hubs/knowledge/components/CitationsPanel.svelte',
  'knowledge:connections': 'hubs/knowledge/components/ConnectionsPanel.svelte',
  'knowledge:portent': 'hubs/knowledge/components/PortentPanel.svelte',
  'knowledge:topic-links': 'hubs/knowledge/components/TopicLinkPanel.svelte',
  'editor:outline': 'hubs/editor/components/OutlinePanel.svelte',
  'editor:properties': 'hubs/editor/components/PropertiesPanel.svelte',
  'editor:backlinks': 'hubs/editor/components/BacklinksPanel.svelte',
  'editor:outgoing': 'hubs/editor/components/OutgoingLinksPanel.svelte',
  'editor:versions': 'hubs/integration/components/VersionHistoryPanel.svelte',
  'editor:wordcount': 'hubs/editor/components/WordCountPanel.svelte',
  'editor:footnotes': 'hubs/editor/components/FootnotesPanel.svelte',
  'editor:symbols': 'hubs/editor/components/SymbolsPanel.svelte',
  'creative:ideas': 'hubs/creative/components/IdeasPanel.svelte',
  'creative:writing': 'hubs/creative/components/WritingPanel.svelte',
  'media:browser': 'hubs/media/components/MediaBrowserPanel.svelte',
  'media:attachments': 'hubs/media/components/AttachmentsPanel.svelte',
  'media:embeds': 'hubs/media/components/EmbedPanel.svelte',
  'canvas:inspector': 'hubs/canvas/components/CanvasInspector.svelte',
  'canvas:layers': 'hubs/canvas/components/LayersPanel.svelte',
  'canvas:elements': 'hubs/canvas/components/ElementsPanel.svelte',
  'integration:git': 'hubs/integration/components/GitPanel.svelte',
  'integration:ai': 'hubs/integration/components/AiPanel.svelte',
  'integration:backup': 'hubs/integration/components/BackupPanel.svelte',
  'integration:publish': 'hubs/integration/components/PublishPanel.svelte',
  'integration:rss': 'hubs/integration/components/RssPanel.svelte',
  'editor:lint': 'hubs/editor/components/LintPanel.svelte',
  'editor:speedreader': 'hubs/editor/components/SpeedReaderPanel.svelte',
  'graph:local-graph': 'hubs/knowledge/components/GraphPanel.svelte',
  'graph:graph-config': 'hubs/knowledge/components/GraphConfigPanel.svelte',
};

const LIB_ROOT = resolve(__dirname, '../..');

function panelKey(hubId: string, panelId: string): string {
  return `${hubId}:${panelId}`;
}

function allPanelKeys(hubs: HubDef[]): string[] {
  return hubs.flatMap((h) => h.panels.map((p) => panelKey(h.id, p.id)));
}

// ── Tests ────────────────────────────────────────────────────────

describe('Sidebar Design Contract', () => {
  describe('PANEL_MAP completeness', () => {
    it('every registered panel in LEFT_HUBS should have a PANEL_MAP entry', () => {
      for (const key of allPanelKeys(LEFT_HUBS)) {
        expect(PANEL_MAP_PATHS, `missing PANEL_MAP entry for: ${key}`).toHaveProperty(key);
      }
    });

    it('every registered panel in RIGHT_HUBS should have a PANEL_MAP entry', () => {
      for (const key of allPanelKeys(RIGHT_HUBS)) {
        expect(PANEL_MAP_PATHS, `missing PANEL_MAP entry for: ${key}`).toHaveProperty(key);
      }
    });

    it('PANEL_MAP should not contain stale entries for panels that no longer exist in the registry', () => {
      const allKeys = new Set([...allPanelKeys(LEFT_HUBS), ...allPanelKeys(RIGHT_HUBS)]);
      for (const mapKey of Object.keys(PANEL_MAP_PATHS)) {
        expect(allKeys.has(mapKey), `stale PANEL_MAP entry: ${mapKey}`).toBe(true);
      }
    });
  });

  describe('Component file existence', () => {
    it('every PANEL_MAP path should point to an existing .svelte file', () => {
      for (const [key, relPath] of Object.entries(PANEL_MAP_PATHS)) {
        const absPath = resolve(LIB_ROOT, relPath);
        expect(existsSync(absPath), `missing file for ${key}: ${absPath}`).toBe(true);
      }
    });
  });

  describe('Hub-to-file alignment', () => {
    it('left-sidebar panels should import from left-sidebar hub folders', () => {
      const leftHubIds = new Set(LEFT_HUBS.map((h) => h.id));
      for (const key of allPanelKeys(LEFT_HUBS)) {
        const path = PANEL_MAP_PATHS[key];
        expect(path, `no path for ${key}`).toBeDefined();
        const hubFolder = path.split('/')[1];
        expect(
          leftHubIds.has(hubFolder),
          `left panel ${key} imports from non-left hub folder: ${hubFolder}`
        ).toBe(true);
      }
    });

    it('right-sidebar editor panels should import from editor hub folder (except versions)', () => {
      const editorHub = RIGHT_HUBS.find((h) => h.id === 'editor');
      expect(editorHub).toBeDefined();
      for (const panel of editorHub!.panels) {
        const key = panelKey('editor', panel.id);
        const path = PANEL_MAP_PATHS[key];
        expect(path, `no path for ${key}`).toBeDefined();
        if (panel.id === 'versions') {
          expect(path).toContain('hubs/integration/');
        } else {
          expect(path, `${key} should be in editor hub folder`).toContain('hubs/editor/');
        }
      }
    });
  });

  describe('Icon coverage', () => {
    it('every hub icon should exist in ICON_COMPONENTS', () => {
      const allHubs = [...LEFT_HUBS, ...RIGHT_HUBS];
      for (const hub of allHubs) {
        expect(
          ICON_COMPONENTS[hub.icon],
          `missing ICON_COMPONENTS entry for hub icon: ${hub.icon}`
        ).toBeDefined();
      }
    });

    it('every panel icon should exist in ICON_COMPONENTS', () => {
      const allHubs = [...LEFT_HUBS, ...RIGHT_HUBS];
      for (const hub of allHubs) {
        for (const panel of hub.panels) {
          expect(
            ICON_COMPONENTS[panel.icon],
            `missing ICON_COMPONENTS entry for panel icon: ${panel.icon} (panel: ${hub.id}:${panel.id})`
          ).toBeDefined();
        }
      }
    });
  });
});
