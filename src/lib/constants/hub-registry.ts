/**
 * Hub and panel definitions for the sidebar.
 * Describes which hubs appear on each side and what panels each hub exposes.
 */

interface PanelDef {
  id: string;
  label: string;
  icon: string;
}

export interface HubDef {
  id: string;
  label: string;
  icon: string;
  panels: PanelDef[];
}

// ── Left sidebar hubs (vault-wide) ──────────────────────────────
export const LEFT_HUBS: HubDef[] = [
  {
    id: 'navigator',
    label: 'Navigator',
    icon: 'navigator',
    panels: [
      { id: 'files', label: 'Files', icon: 'files' },
      { id: 'open-editors', label: 'Open Editors', icon: 'editor' },
      { id: 'search', label: 'Search', icon: 'search' },
      { id: 'recent', label: 'Recent', icon: 'recent' },
      { id: 'bookmarks', label: 'Bookmarks', icon: 'bookmarks' },
      { id: 'templates', label: 'Templates', icon: 'templates' },
      { id: 'capture', label: 'Capture', icon: 'capture' },
    ],
  },
  {
    id: 'knowledge',
    label: 'Knowledge',
    icon: 'knowledge',
    panels: [
      { id: 'tags', label: 'Tags', icon: 'tags' },
      { id: 'vault-stats', label: 'Vault Stats', icon: 'vault-stats' },
      { id: 'citations', label: 'Citations', icon: 'citations' },
      { id: 'connections', label: 'Connections', icon: 'connections' },
      { id: 'portent', label: 'Portent', icon: 'layers' },
      { id: 'topic-links', label: 'Topic Links', icon: 'links' },
    ],
  },
  {
    id: 'planner',
    label: 'Planner',
    icon: 'planner',
    panels: [
      { id: 'calendar', label: 'Calendar', icon: 'calendar' },
      { id: 'tasks', label: 'Tasks', icon: 'tasks' },
      { id: 'daily', label: 'Daily Journal', icon: 'daily' },
      { id: 'periodic', label: 'Periodic Reviews', icon: 'periodic' },
      { id: 'habits', label: 'Habits', icon: 'habits' },
    ],
  },
  {
    id: 'creative',
    label: 'Creative',
    icon: 'creative',
    panels: [
      { id: 'ideas', label: 'Ideas', icon: 'ideas' },
      { id: 'writing', label: 'Writing', icon: 'writing' },
    ],
  },
  {
    id: 'media',
    label: 'Media',
    icon: 'media',
    panels: [
      { id: 'browser', label: 'Media', icon: 'media-browser' },
      { id: 'attachments', label: 'Attachments', icon: 'attachments' },
      { id: 'embeds', label: 'Embeds', icon: 'embed' },
    ],
  },
  {
    id: 'integration',
    label: 'Integration',
    icon: 'integration',
    panels: [
      { id: 'git', label: 'Git', icon: 'git' },
      { id: 'ai', label: 'AI Assistant', icon: 'ai' },
      { id: 'backup', label: 'Backup', icon: 'backup' },
      { id: 'publish', label: 'Publish', icon: 'publish' },
      { id: 'rss', label: 'RSS Feeds', icon: 'rss' },
    ],
  },
];

// ── Right sidebar hubs (note/context-specific) ──────────────────
export const RIGHT_HUBS: HubDef[] = [
  {
    id: 'graph',
    label: 'Graph',
    icon: 'graph',
    panels: [
      { id: 'local-graph', label: 'Local Graph', icon: 'graph' },
      { id: 'graph-config', label: 'Graph Config', icon: 'settings' },
    ],
  },
  {
    id: 'editor',
    label: 'Editor',
    icon: 'editor',
    panels: [
      { id: 'outline', label: 'Outline', icon: 'outline' },
      { id: 'properties', label: 'Properties', icon: 'properties' },
      { id: 'backlinks', label: 'Backlinks', icon: 'backlinks' },
      { id: 'outgoing', label: 'Outgoing Links', icon: 'outgoing' },
      { id: 'versions', label: 'Versions', icon: 'versions' },
      { id: 'wordcount', label: 'Document Stats', icon: 'wordcount' },
      { id: 'footnotes', label: 'Footnotes', icon: 'footnotes' },
      { id: 'symbols', label: 'Symbols', icon: 'symbols' },
      { id: 'lint', label: 'Lint', icon: 'lint' },
      { id: 'speedreader', label: 'Speed Reader', icon: 'speedreader' },
    ],
  },
  {
    id: 'canvas',
    label: 'Canvas',
    icon: 'canvas',
    panels: [
      { id: 'inspector', label: 'Inspector', icon: 'properties' },
      { id: 'layers', label: 'Layers', icon: 'layers' },
      { id: 'elements', label: 'Elements', icon: 'elements' },
    ],
  },
];

// ── Defaults ────────────────────────────────────────────────────
export const DEFAULT_LEFT_HUB = 'navigator';
export const DEFAULT_LEFT_PANEL = 'files';
export const DEFAULT_RIGHT_HUB = 'editor';
export const DEFAULT_RIGHT_PANEL = 'outline';
