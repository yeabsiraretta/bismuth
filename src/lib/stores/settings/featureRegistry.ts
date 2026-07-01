/**
 * Feature Registry — single source of truth for all feature metadata.
 *
 * Every sidebar panel, toggleable capability, and lazy-loaded module
 * is declared here. The registry drives:
 *   - Feature flag defaults and persistence
 *   - Sidebar tab definitions (icons, labels, tooltips)
 *   - Feature toggle UI (Settings > Features)
 *   - Lazy-load / preload mapping
 *
 * ## Tiers
 *
 *   - **core**     — Always enabled, no user toggle. Essential PKM functionality
 *                    (file tree, search, outline, properties, recent files, editor tabs).
 *   - **optional** — Off by default, user can toggle in Settings > Features.
 *                    Everything else (graph, canvas, git, music, etc.).
 */

import type { SidebarTab } from '@/types/layout';

// ─── Types ──────────────────────────────────────────────────────────────────

export type FeatureTier = 'core' | 'optional';

export type FeatureCategory =
  | 'navigation'
  | 'knowledge'
  | 'productivity'
  | 'project-management'
  | 'creative'
  | 'integration'
  | 'experimental';

export type FeatureSidebar = 'left' | 'right' | 'bottom' | 'none';

export interface FeatureDefinition {
  /** Unique identifier — used as the flag key AND the sidebar tab ID */
  id: string;
  /** Human-readable name */
  label: string;
  /** Short description for the toggle UI */
  description: string;
  /** Icon name from the icon system */
  icon: string;
  /** Tooltip for the sidebar tab */
  tooltip: string;
  /** core = always on, optional = user-toggleable */
  tier: FeatureTier;
  /** UI grouping in the feature toggles panel */
  category: FeatureCategory;
  /** Which sidebar this tab appears in (none = no sidebar panel) */
  sidebar: FeatureSidebar;
  /** Whether enabled by default (only meaningful for 'optional' tier) */
  defaultEnabled: boolean;
  /** Dynamic import path for lazy loading (null = eagerly loaded or non-UI) */
  preloadKey?: string;
  /** Whether tab is pinned (cannot be reordered/removed from sidebar) */
  pinned?: boolean;
}

// ─── Registry ───────────────────────────────────────────────────────────────

export const FEATURE_REGISTRY: readonly FeatureDefinition[] = [
  // ── Core: always enabled, no toggle ───────────────────────────────────────
  {
    id: 'files',
    label: 'File Tree',
    description: 'Browse vault files and folders',
    icon: 'folder',
    tooltip: 'File Explorer',
    tier: 'core',
    category: 'navigation',
    sidebar: 'left',
    defaultEnabled: true,
    pinned: true,
  },
  {
    id: 'search',
    label: 'Search',
    description: 'Full-text search across vault',
    icon: 'search',
    tooltip: 'Search in vault',
    tier: 'core',
    category: 'navigation',
    sidebar: 'left',
    defaultEnabled: true,
  },
  {
    id: 'recent',
    label: 'Recent Files',
    description: 'Recently opened files list',
    icon: 'clock',
    tooltip: 'Recently opened files',
    tier: 'core',
    category: 'navigation',
    sidebar: 'left',
    defaultEnabled: true,
  },
  {
    id: 'outline',
    label: 'Outline',
    description: 'Document heading outline',
    icon: 'list',
    tooltip: 'Document outline',
    tier: 'core',
    category: 'navigation',
    sidebar: 'right',
    defaultEnabled: true,
  },
  {
    id: 'properties',
    label: 'Properties',
    description: 'Note properties panel',
    icon: 'sliders',
    tooltip: 'Note properties',
    tier: 'core',
    category: 'navigation',
    sidebar: 'right',
    defaultEnabled: true,
  },
  {
    id: 'open-tabs',
    label: 'Open Tabs',
    description: 'Toggle editor tabs orientation',
    icon: 'layout-list',
    tooltip: 'Toggle editor tabs orientation',
    tier: 'core',
    category: 'navigation',
    sidebar: 'none',
    defaultEnabled: true,
  },

  {
    id: 'breadcrumbs',
    label: 'Breadcrumbs',
    description: 'Folder trail and hierarchy navigation',
    icon: 'git-branch',
    tooltip: 'Breadcrumb trail',
    tier: 'core',
    category: 'navigation',
    sidebar: 'none',
    defaultEnabled: true,
  },

  // ── Optional: navigation ──────────────────────────────────────────────────
  {
    id: 'graph',
    label: 'Graph View',
    description: 'Visual note connection graph',
    icon: 'graph',
    tooltip: 'Graph view',
    tier: 'optional',
    category: 'navigation',
    sidebar: 'none',
    defaultEnabled: false,
    preloadKey: 'graph',
  },
  {
    id: 'tags',
    label: 'Tags',
    description: 'Tag browser and management',
    icon: 'tag',
    tooltip: 'Tag management',
    tier: 'optional',
    category: 'navigation',
    sidebar: 'left',
    defaultEnabled: false,
    preloadKey: 'tag',
  },
  {
    id: 'entities',
    label: 'Entities',
    description: 'Entity browser panel',
    icon: 'layers',
    tooltip: 'Entity browser',
    tier: 'optional',
    category: 'navigation',
    sidebar: 'left',
    defaultEnabled: false,
    preloadKey: 'entity',
  },
  {
    id: 'entity',
    label: 'Entity Detail',
    description: 'Entity info sidebar',
    icon: 'box',
    tooltip: 'Entity info',
    tier: 'optional',
    category: 'navigation',
    sidebar: 'right',
    defaultEnabled: false,
    preloadKey: 'entity',
  },
  {
    id: 'navigator',
    label: 'Navigator',
    description: 'Multi-pane file navigator',
    icon: 'folder-open',
    tooltip: 'Multi-pane navigator',
    tier: 'optional',
    category: 'navigation',
    sidebar: 'left',
    defaultEnabled: false,
    preloadKey: 'navigator',
  },

  // ── Optional: knowledge ───────────────────────────────────────────────────
  {
    id: 'backlinks',
    label: 'Backlinks',
    description: 'Notes linking to current note',
    icon: 'link-2',
    tooltip: 'Backlinks',
    tier: 'optional',
    category: 'knowledge',
    sidebar: 'right',
    defaultEnabled: false,
    preloadKey: 'backlinks',
  },
  {
    id: 'outgoing',
    label: 'Outgoing Links',
    description: 'Links from current note',
    icon: 'external-link',
    tooltip: 'Outgoing links',
    tier: 'optional',
    category: 'knowledge',
    sidebar: 'right',
    defaultEnabled: false,
    preloadKey: 'backlinks',
  },
  {
    id: 'connections',
    label: 'Connections',
    description: 'Semantic similarity panel',
    icon: 'share-2',
    tooltip: 'Semantic connections',
    tier: 'optional',
    category: 'knowledge',
    sidebar: 'right',
    defaultEnabled: false,
    preloadKey: 'connections',
  },
  {
    id: 'vault-flashcards',
    label: 'Study',
    description: 'Vault-wide flashcard review',
    icon: 'book-open',
    tooltip: 'Vault-wide flashcard review',
    tier: 'optional',
    category: 'knowledge',
    sidebar: 'left',
    defaultEnabled: false,
    preloadKey: 'flashcards',
  },
  {
    id: 'flashcards',
    label: 'Flashcards',
    description: 'Note flashcard review',
    icon: 'layers',
    tooltip: 'Note flashcard review',
    tier: 'optional',
    category: 'knowledge',
    sidebar: 'right',
    defaultEnabled: false,
    preloadKey: 'flashcards',
  },
  {
    id: 'wikilink',
    label: 'Auto-Linker',
    description: 'Unlinked mention suggestions',
    icon: 'link',
    tooltip: 'Auto-link suggestions',
    tier: 'optional',
    category: 'knowledge',
    sidebar: 'right',
    defaultEnabled: false,
    preloadKey: 'wikilink',
  },
  {
    id: 'versioning',
    label: 'Versioning',
    description: 'Note version history & diffs',
    icon: 'git-commit',
    tooltip: 'Note version timeline',
    tier: 'optional',
    category: 'knowledge',
    sidebar: 'right',
    defaultEnabled: false,
    preloadKey: 'versioning',
  },
  {
    id: 'dataview',
    label: 'Dataview',
    description: 'Query vault as a database (DQL)',
    icon: 'database',
    tooltip: 'Dataview queries',
    tier: 'optional',
    category: 'knowledge',
    sidebar: 'right',
    defaultEnabled: false,
    preloadKey: 'dataview',
  },

  // ── Optional: productivity ────────────────────────────────────────────────
  {
    id: 'inbox',
    label: 'Capture Inbox',
    description: 'Quick capture dashboard',
    icon: 'inbox',
    tooltip: 'Capture Dashboard',
    tier: 'optional',
    category: 'productivity',
    sidebar: 'left',
    defaultEnabled: false,
    preloadKey: 'capture',
  },
  {
    id: 'tasks',
    label: 'Tasks',
    description: 'Vault-wide task tracker',
    icon: 'check-square',
    tooltip: 'Task tracker',
    tier: 'optional',
    category: 'productivity',
    sidebar: 'left',
    defaultEnabled: false,
    preloadKey: 'tasks',
  },
  {
    id: 'kanban',
    label: 'Kanban Board',
    description: 'Visual task board view',
    icon: 'columns',
    tooltip: 'Kanban board view',
    tier: 'optional',
    category: 'productivity',
    sidebar: 'left',
    defaultEnabled: false,
    preloadKey: 'tasks',
  },
  {
    id: 'gamify',
    label: 'Gamify',
    description: 'Gamified task tracking & quests',
    icon: 'star',
    tooltip: 'Gamified task tracking',
    tier: 'optional',
    category: 'productivity',
    sidebar: 'left',
    defaultEnabled: false,
    preloadKey: 'gamify',
  },
  {
    id: 'templates',
    label: 'Templates',
    description: 'Quick note from template',
    icon: 'file-text',
    tooltip: 'Quick note from template',
    tier: 'optional',
    category: 'productivity',
    sidebar: 'left',
    defaultEnabled: false,
    preloadKey: 'template',
  },
  {
    id: 'changelog',
    label: 'Changelog',
    description: 'Vault change history',
    icon: 'activity',
    tooltip: 'Vault changelog',
    tier: 'optional',
    category: 'productivity',
    sidebar: 'left',
    defaultEnabled: false,
    preloadKey: 'changelog',
  },
  {
    id: 'writing',
    label: 'Writing Lint',
    description: 'Writing style & lint panel',
    icon: 'edit-2',
    tooltip: 'Writing lint & style',
    tier: 'optional',
    category: 'productivity',
    sidebar: 'right',
    defaultEnabled: false,
    preloadKey: 'linting',
  },
  {
    id: 'calendar',
    label: 'Calendar',
    description: 'Daily notes calendar view',
    icon: 'calendar',
    tooltip: 'Daily notes calendar',
    tier: 'optional',
    category: 'productivity',
    sidebar: 'right',
    defaultEnabled: false,
    preloadKey: 'calendar',
  },
  {
    id: 'daily-note',
    label: 'Daily Note',
    description: "Open today's daily note",
    icon: 'calendar-plus',
    tooltip: "Open today's daily note",
    tier: 'optional',
    category: 'productivity',
    sidebar: 'bottom',
    defaultEnabled: true,
    preloadKey: 'periodic',
  },
  {
    id: 'journals',
    label: 'Journals',
    description: 'Multi-journal system with shelves',
    icon: 'book-open',
    tooltip: 'Journal management panel',
    tier: 'optional',
    category: 'productivity',
    sidebar: 'right',
    defaultEnabled: false,
    preloadKey: 'journals',
  },
  {
    id: 'speed-reader',
    label: 'Speed Reader',
    description: 'RSVP speed reading mode',
    icon: 'play',
    tooltip: 'RSVP speed reading mode',
    tier: 'optional',
    category: 'productivity',
    sidebar: 'right',
    defaultEnabled: false,
    preloadKey: 'speedreader',
  },
  {
    id: 'timekeep',
    label: 'Timekeep',
    description: 'Track time on tasks with export',
    icon: 'clock',
    tooltip: 'Time tracking & export',
    tier: 'optional',
    category: 'productivity',
    sidebar: 'left',
    defaultEnabled: false,
    preloadKey: 'timekeep',
  },

  // ── Optional: project management ─────────────────────────────────────────
  {
    id: 'projects',
    label: 'Projects',
    description: 'Project tracker with goals, milestones & deliverables',
    icon: 'briefcase',
    tooltip: 'Project management',
    tier: 'optional',
    category: 'project-management',
    sidebar: 'left',
    defaultEnabled: false,
    preloadKey: 'projects',
  },
  {
    id: 'para',
    label: 'PARA',
    description: 'Projects / Areas / Resources / Archive organizer',
    icon: 'archive',
    tooltip: 'PARA method organizer',
    tier: 'optional',
    category: 'project-management',
    sidebar: 'left',
    defaultEnabled: false,
    preloadKey: 'para',
  },
  {
    id: 'rpg-manager',
    label: 'RPG Manager',
    description: 'TTRPG campaign management',
    icon: 'shield',
    tooltip: 'RPG campaign manager',
    tier: 'optional',
    category: 'project-management',
    sidebar: 'left',
    defaultEnabled: false,
    preloadKey: 'rpg-manager',
  },

  // ── Optional: creative ────────────────────────────────────────────────────
  {
    id: 'canvas',
    label: 'Canvas',
    description: 'Visual canvas workspace',
    icon: 'layout',
    tooltip: 'Open canvas workspace',
    tier: 'optional',
    category: 'creative',
    sidebar: 'left',
    defaultEnabled: false,
    preloadKey: 'canvas',
  },
  {
    id: 'music',
    label: 'Music Studio',
    description: 'DAW & music production tools',
    icon: 'music',
    tooltip: 'Music production & DAW',
    tier: 'optional',
    category: 'creative',
    sidebar: 'left',
    defaultEnabled: false,
  },
  {
    id: 'media',
    label: 'Media Editor',
    description: 'Photo & video editing tools',
    icon: 'film',
    tooltip: 'Photo & video editor',
    tier: 'optional',
    category: 'creative',
    sidebar: 'left',
    defaultEnabled: false,
  },
  {
    id: 'spreadsheet',
    label: 'Spreadsheet',
    description: 'CSV/JSON tabular data editor',
    icon: 'grid',
    tooltip: 'Tabular data & charts',
    tier: 'optional',
    category: 'creative',
    sidebar: 'left',
    defaultEnabled: false,
  },
  {
    id: 'longform',
    label: 'Longform',
    description: 'Manuscript projects & scenes',
    icon: 'book',
    tooltip: 'Longform writing',
    tier: 'optional',
    category: 'creative',
    sidebar: 'left',
    defaultEnabled: false,
    preloadKey: 'longform',
  },
  {
    id: 'storyteller',
    label: 'Storyteller',
    description: 'Story planning, worldbuilding, campaigns & timelines',
    icon: 'book-open',
    tooltip: 'Storyteller Suite',
    tier: 'optional',
    category: 'creative',
    sidebar: 'left',
    defaultEnabled: false,
    preloadKey: 'storyteller',
  },
  {
    id: 'arbor',
    label: 'Arbor Editor',
    description: 'Branching note editor',
    icon: 'git-branch',
    tooltip: 'Branching note editor',
    tier: 'optional',
    category: 'creative',
    sidebar: 'left',
    defaultEnabled: false,
    preloadKey: 'arbor',
  },

  // ── Optional: integration ─────────────────────────────────────────────────
  {
    id: 'git',
    label: 'Git',
    description: 'Version control integration',
    icon: 'git-branch',
    tooltip: 'Git changes',
    tier: 'optional',
    category: 'integration',
    sidebar: 'right',
    defaultEnabled: false,
    preloadKey: 'git',
  },
  {
    id: 'publishing',
    label: 'Publishing',
    description: 'Publish notes as static site',
    icon: 'globe',
    tooltip: 'Publication center',
    tier: 'optional',
    category: 'integration',
    sidebar: 'left',
    defaultEnabled: false,
    preloadKey: 'publishing',
  },
  {
    id: 'rss',
    label: 'RSS Reader',
    description: 'RSS/Atom feed reader',
    icon: 'rss',
    tooltip: 'RSS feed reader',
    tier: 'optional',
    category: 'integration',
    sidebar: 'left',
    defaultEnabled: false,
    preloadKey: 'rss',
  },
  {
    id: 'voice',
    label: 'Voice Recorder',
    description: 'Voice notes & transcription',
    icon: 'mic',
    tooltip: 'Voice recorder',
    tier: 'optional',
    category: 'integration',
    sidebar: 'right',
    defaultEnabled: false,
    preloadKey: 'voice',
  },
  {
    id: 'nas',
    label: 'NAS Access',
    description: 'WebDAV network storage sync',
    icon: 'server',
    tooltip: 'Network storage sync',
    tier: 'optional',
    category: 'integration',
    sidebar: 'left',
    defaultEnabled: false,
  },
  {
    id: 'ocr',
    label: 'OCR Import',
    description: 'Import handwritten notes via OCR',
    icon: 'scan',
    tooltip: 'Import handwritten notes',
    tier: 'optional',
    category: 'integration',
    sidebar: 'left',
    defaultEnabled: false,
  },
  {
    id: 'importer',
    label: 'Importer',
    description: 'Import notes from other apps',
    icon: 'download',
    tooltip: 'Import from other apps',
    tier: 'optional',
    category: 'integration',
    sidebar: 'left',
    defaultEnabled: false,
    preloadKey: 'importer',
  },
  {
    id: 'annotator',
    label: 'Annotator',
    description: 'PDF/EPUB annotation & highlights',
    icon: 'highlighter',
    tooltip: 'Document annotator',
    tier: 'optional',
    category: 'integration',
    sidebar: 'left',
    defaultEnabled: false,
    preloadKey: 'annotator',
  },
  {
    id: 'clipper',
    label: 'Web Clipper',
    description: 'Save web content as notes',
    icon: 'clipboard',
    tooltip: 'ReadItLater web clipper',
    tier: 'optional',
    category: 'integration',
    sidebar: 'left',
    defaultEnabled: false,
    preloadKey: 'clipper',
  },
  {
    id: 'code-editor',
    label: 'Code Editor',
    description: 'VSCode-like code file editing',
    icon: 'code',
    tooltip: 'Code file editor',
    tier: 'optional',
    category: 'integration',
    sidebar: 'left',
    defaultEnabled: false,
    preloadKey: 'code-editor',
  },
  {
    id: 'llm',
    label: 'AI Agent',
    description: 'Local & cloud LLM agent chat',
    icon: 'cpu',
    tooltip: 'AI agent chat and change review',
    tier: 'optional',
    category: 'integration',
    sidebar: 'left',
    defaultEnabled: false,
  },
  {
    id: 'metadata-extractor',
    label: 'Metadata Extractor',
    description: 'Export vault metadata as JSON for third-party apps',
    icon: 'database',
    tooltip: 'Export vault metadata to JSON',
    tier: 'optional',
    category: 'integration',
    sidebar: 'none',
    defaultEnabled: false,
  },
  {
    id: 'topic-linking',
    label: 'Topic Linking',
    description: 'LDA topic modeling and document linking',
    icon: 'network',
    tooltip: 'Discover topics across documents',
    tier: 'optional',
    category: 'knowledge',
    sidebar: 'none',
    defaultEnabled: false,
  },
  {
    id: 'graph-banner',
    label: 'Graph Banner',
    description: 'Local graph view in note header',
    icon: 'git-branch',
    tooltip: 'Show local graph banner',
    tier: 'optional',
    category: 'knowledge',
    sidebar: 'none',
    defaultEnabled: false,
  },
  {
    id: 'chem',
    label: 'Chem',
    description: 'Render SMILES chemical structures in code blocks',
    icon: 'flask-conical',
    tooltip: 'Chemistry structure renderer',
    tier: 'optional',
    category: 'knowledge',
    sidebar: 'none',
    defaultEnabled: false,
  },
  {
    id: 'note-slides',
    label: 'Note Slides',
    description: 'Marp-compatible markdown slide presentations',
    icon: 'presentation',
    tooltip: 'Markdown slide presentations',
    tier: 'optional',
    category: 'creative',
    sidebar: 'none',
    defaultEnabled: false,
  },
  {
    id: 'journal-review',
    label: 'Journal Review',
    description: 'On This Day — review notes on their anniversaries',
    icon: 'history',
    tooltip: 'Anniversary note review',
    tier: 'optional',
    category: 'productivity',
    sidebar: 'right',
    defaultEnabled: true,
  },
  {
    id: 'progressbar',
    label: 'Progress Bar',
    description: 'Render progress bars from code blocks (time-based or manual)',
    icon: 'bar-chart-2',
    tooltip: 'Progress bar code blocks',
    tier: 'optional',
    category: 'productivity',
    sidebar: 'none',
    defaultEnabled: true,
  },

  // ── Optional: experimental ────────────────────────────────────────────────
  {
    id: 'gym',
    label: 'Gym Tracker',
    description: 'Workout & nutrition logging',
    icon: 'dumbbell',
    tooltip: 'Workout & health tracker',
    tier: 'optional',
    category: 'experimental',
    sidebar: 'left',
    defaultEnabled: false,
  },
  {
    id: 'pokemon',
    label: 'Pokemon Tools',
    description: 'Damage calculator & team builder',
    icon: 'zap',
    tooltip: 'Damage calculator & team builder',
    tier: 'optional',
    category: 'experimental',
    sidebar: 'left',
    defaultEnabled: false,
  },
  {
    id: 'recipe',
    label: 'Recipe View',
    description: 'Interactive recipe cards from notes',
    icon: 'coffee',
    tooltip: 'Recipe view & cooking mode',
    tier: 'optional',
    category: 'creative',
    sidebar: 'right',
    defaultEnabled: false,
    preloadKey: 'recipe',
  },
  {
    id: 'symbols',
    label: 'Symbol Prettifier',
    description: 'Auto-replace ASCII sequences with Unicode symbols',
    icon: 'type',
    tooltip: 'Symbol prettifier',
    tier: 'optional',
    category: 'productivity',
    sidebar: 'none',
    defaultEnabled: true,
  },
  {
    id: 'lifetracker',
    label: 'Life Tracker',
    description: 'Track & visualize life data from frontmatter',
    icon: 'activity',
    tooltip: 'Life data tracker & charts',
    tier: 'optional',
    category: 'productivity',
    sidebar: 'left',
    defaultEnabled: false,
    preloadKey: 'lifetracker',
  },
  {
    id: 'marginalia',
    label: 'Marginalia',
    description: 'Cornell-style margin notes & active recall',
    icon: 'quote',
    tooltip: 'Cornell margin notes',
    tier: 'optional',
    category: 'knowledge',
    sidebar: 'right',
    defaultEnabled: false,
    preloadKey: 'marginalia',
  },
] as const;

// ─── Lookup helpers ─────────────────────────────────────────────────────────

const _byId = new Map<string, FeatureDefinition>(FEATURE_REGISTRY.map((f) => [f.id, f]));

/** Look up a feature definition by ID */
export function getFeature(id: string): FeatureDefinition | undefined {
  return _byId.get(id);
}

/** All core features (always enabled) */
export const CORE_FEATURES = FEATURE_REGISTRY.filter((f) => f.tier === 'core');

/** All optional features (user-toggleable) */
export const OPTIONAL_FEATURES = FEATURE_REGISTRY.filter((f) => f.tier === 'optional');

/** All unique category values in display order */
export const FEATURE_CATEGORIES: { id: FeatureCategory; label: string }[] = [
  { id: 'navigation', label: 'Navigation' },
  { id: 'knowledge', label: 'Knowledge' },
  { id: 'productivity', label: 'Productivity' },
  { id: 'project-management', label: 'Project Management' },
  { id: 'creative', label: 'Creative' },
  { id: 'integration', label: 'Integration' },
  { id: 'experimental', label: 'Experimental' },
];

/** Build SidebarTab[] for a given sidebar position from the registry */
export function getDefaultTabs(sidebar: FeatureSidebar): SidebarTab[] {
  return FEATURE_REGISTRY.filter((f) => f.sidebar === sidebar).map((f) => ({
    id: f.id,
    icon: f.icon,
    label: f.label,
    tooltip: f.tooltip,
    pinned: f.pinned,
  }));
}

/** Build the default feature flags object from the registry */
export function getDefaultFlags(): Record<string, boolean> {
  const flags: Record<string, boolean> = {};
  for (const f of FEATURE_REGISTRY) {
    if (f.tier === 'core') {
      flags[f.id] = true; // Core features are always on
    } else {
      flags[f.id] = f.defaultEnabled;
    }
  }
  return flags;
}

/** Get all optional feature IDs (the ones that have toggles) */
export function getOptionalFeatureIds(): string[] {
  return OPTIONAL_FEATURES.map((f) => f.id);
}

/** Check whether a feature ID is a core (always-on) feature */
export function isCoreFeature(id: string): boolean {
  return _byId.get(id)?.tier === 'core';
}
