/**
 * Bismuth-specific UI pattern components.
 * These reproduce the actual shells, panels, and chrome used in Bismuth itself —
 * so the canvas can be used to design new Bismuth screens with accurate dimensions.
 */
import type { ComponentDefinition } from '@/features/canvas/types';

const now = 0;

export const BISMUTH_COMPONENTS: ComponentDefinition[] = [
  // ── App shell frames ───────────────────────────────────────────────────────
  {
    id: 'bui-app-shell', name: 'App Shell (1280×800)', category: 'Bismuth', icon: 'layout',
    elements: [
      // Title bar / menu bar area
      { id: 'titlebar', element_type: 'rectangle', x: 0, y: 0, width: 1280, height: 28, rotation: 0,
        properties: { fill: 'var(--background-secondary)', stroke: 'var(--border-color)', strokeWidth: 1 },
        layer_id: 'default', z_index: 0, locked: false, visible: true, name: 'Titlebar' },
      // Left sidebar
      { id: 'left-sidebar', element_type: 'rectangle', x: 0, y: 28, width: 48, height: 772, rotation: 0,
        properties: { fill: 'var(--background-secondary)', stroke: 'var(--border-color)', strokeWidth: 1 },
        layer_id: 'default', z_index: 1, locked: false, visible: true, name: 'Left Sidebar' },
      // Content area
      { id: 'content', element_type: 'rectangle', x: 48, y: 28, width: 1232, height: 756, rotation: 0,
        properties: { fill: 'var(--background-primary)' },
        layer_id: 'default', z_index: 2, locked: false, visible: true, name: 'Content Area' },
      // Status bar
      { id: 'statusbar', element_type: 'rectangle', x: 48, y: 776, width: 1232, height: 24, rotation: 0,
        properties: { fill: 'var(--background-secondary)', stroke: 'var(--border-color)', strokeWidth: 1 },
        layer_id: 'default', z_index: 3, locked: false, visible: true, name: 'Status Bar' },
    ],
    exposedProps: [],
    width: 1280, height: 800,
    tags: ['bismuth', 'shell', 'app', 'frame'],
    isBuiltin: true, created_at: now, modified_at: now,
  },

  // ── Sidebar vertical tab bar ───────────────────────────────────────────────
  {
    id: 'bui-vertical-tabbar', name: 'Vertical Tab Bar', category: 'Bismuth', icon: 'sidebar',
    elements: [
      { id: 'bg', element_type: 'rectangle', x: 0, y: 0, width: 48, height: 320, rotation: 0,
        properties: { fill: 'var(--background-secondary)', stroke: 'var(--border-color)', strokeWidth: 1 },
        layer_id: 'default', z_index: 0, locked: false, visible: true, name: 'Background' },
      // 5 tab stubs at 48px height each
      ...([0, 1, 2, 3, 4].map((i) => ({
        id: `tab-${i}`, element_type: 'rectangle' as const,
        x: 8, y: 8 + i * 52, width: 32, height: 32, rotation: 0,
        properties: { fill: i === 0 ? 'var(--background-modifier-hover)' : 'transparent', radius: 6 },
        layer_id: 'default', z_index: 1, locked: false, visible: true, name: `Tab ${i + 1}`,
      }))),
    ],
    exposedProps: [],
    width: 48, height: 320,
    tags: ['bismuth', 'sidebar', 'navigation', 'tabs'],
    isBuiltin: true, created_at: now, modified_at: now,
  },

  // ── Panel header ──────────────────────────────────────────────────────────
  {
    id: 'bui-panel-header', name: 'Panel Header', category: 'Bismuth', icon: 'panel-right',
    elements: [
      { id: 'bg', element_type: 'rectangle', x: 0, y: 0, width: 280, height: 36, rotation: 0,
        properties: { fill: 'var(--background-secondary)', stroke: 'var(--border-color)', strokeWidth: 1 },
        layer_id: 'default', z_index: 0, locked: false, visible: true, name: 'Background' },
      { id: 'icon', element_type: 'rectangle', x: 12, y: 9, width: 18, height: 18, rotation: 0,
        properties: { fill: 'var(--text-muted)', radius: 2 },
        layer_id: 'default', z_index: 1, locked: false, visible: true, name: 'Icon Slot' },
      { id: 'title', element_type: 'text', x: 36, y: 10, width: 160, height: 16, rotation: 0,
        properties: { text: 'Panel Title', fontSize: 12, fontWeight: 600, fill: 'var(--text-normal)', textAlign: 'left' },
        layer_id: 'default', z_index: 2, locked: false, visible: true, name: 'Title' },
      { id: 'action', element_type: 'rectangle', x: 244, y: 8, width: 24, height: 20, rotation: 0,
        properties: { fill: 'var(--background-primary)', stroke: 'var(--border-color)', strokeWidth: 1, radius: 4 },
        layer_id: 'default', z_index: 3, locked: false, visible: true, name: 'Action Slot' },
    ],
    exposedProps: [
      { key: 'title', label: 'Title', type: 'text', defaultValue: 'Panel Title' },
    ],
    width: 280, height: 36,
    tags: ['bismuth', 'panel', 'header', 'chrome'],
    isBuiltin: true, created_at: now, modified_at: now,
  },

  // ── Note editor toolbar ────────────────────────────────────────────────────
  {
    id: 'bui-note-toolbar', name: 'Note Toolbar', category: 'Bismuth', icon: 'edit-3',
    elements: [
      { id: 'bg', element_type: 'rectangle', x: 0, y: 0, width: 640, height: 40, rotation: 0,
        properties: { fill: 'var(--background-primary)', stroke: 'var(--border-color)', strokeWidth: 1 },
        layer_id: 'default', z_index: 0, locked: false, visible: true, name: 'Background' },
      // Mode chips: Source / Live / Reading
      ...[['Source', 0], ['Live', 68], ['Reading', 136]].map(([label, xOff]) => ({
        id: `mode-${label}`, element_type: 'rectangle' as const,
        x: 8 + (xOff as number), y: 8, width: 60, height: 24, rotation: 0,
        properties: { fill: label === 'Source' ? 'var(--background-modifier-hover)' : 'transparent', radius: 4,
                      stroke: label === 'Source' ? 'var(--border-color)' : 'transparent', strokeWidth: 1 },
        layer_id: 'default', z_index: 1, locked: false, visible: true, name: `Mode ${label}`,
      })),
      // Format buttons group
      ...[0, 1, 2, 3, 4].map((i) => ({
        id: `fmt-${i}`, element_type: 'rectangle' as const,
        x: 220 + i * 34, y: 4, width: 28, height: 32, rotation: 0,
        properties: { fill: 'transparent', radius: 4 },
        layer_id: 'default', z_index: 1, locked: false, visible: true, name: `Format ${i + 1}`,
      })),
    ],
    exposedProps: [],
    width: 640, height: 40,
    tags: ['bismuth', 'toolbar', 'editor', 'note'],
    isBuiltin: true, created_at: now, modified_at: now,
  },

  // ── Canvas toolbar ─────────────────────────────────────────────────────────
  {
    id: 'bui-canvas-toolbar', name: 'Canvas Toolbar', category: 'Bismuth', icon: 'pen-tool',
    elements: [
      { id: 'bg', element_type: 'rectangle', x: 0, y: 0, width: 480, height: 44, rotation: 0,
        properties: { fill: 'var(--background-primary)', stroke: 'var(--border-color)', strokeWidth: 1 },
        layer_id: 'default', z_index: 0, locked: false, visible: true, name: 'Background' },
      // Tool buttons
      ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => ({
        id: `tool-${i}`, element_type: 'rectangle' as const,
        x: 8 + i * 36, y: 6, width: 32, height: 32, rotation: 0,
        properties: { fill: i === 0 ? 'var(--background-modifier-hover)' : 'transparent', radius: 4 },
        layer_id: 'default', z_index: 1, locked: false, visible: true, name: `Tool ${i + 1}`,
      })),
    ],
    exposedProps: [],
    width: 480, height: 44,
    tags: ['bismuth', 'toolbar', 'canvas', 'tools'],
    isBuiltin: true, created_at: now, modified_at: now,
  },

  // ── Status bar ─────────────────────────────────────────────────────────────
  {
    id: 'bui-status-bar', name: 'Status Bar', category: 'Bismuth', icon: 'layout-list',
    elements: [
      { id: 'bg', element_type: 'rectangle', x: 0, y: 0, width: 960, height: 24, rotation: 0,
        properties: { fill: 'var(--background-secondary)', stroke: 'var(--border-color)', strokeWidth: 1 },
        layer_id: 'default', z_index: 0, locked: false, visible: true, name: 'Background' },
      { id: 'left', element_type: 'text', x: 12, y: 5, width: 200, height: 14, rotation: 0,
        properties: { text: 'Vault Name  •  2 files', fontSize: 11, fill: 'var(--text-muted)', textAlign: 'left' },
        layer_id: 'default', z_index: 1, locked: false, visible: true, name: 'Left Items' },
      { id: 'right', element_type: 'text', x: 700, y: 5, width: 248, height: 14, rotation: 0,
        properties: { text: '1,234 words  •  6 lines  •  Saved', fontSize: 11, fill: 'var(--text-muted)', textAlign: 'right' },
        layer_id: 'default', z_index: 2, locked: false, visible: true, name: 'Right Items' },
    ],
    exposedProps: [],
    width: 960, height: 24,
    tags: ['bismuth', 'status', 'bar', 'chrome'],
    isBuiltin: true, created_at: now, modified_at: now,
  },

  // ── Settings modal shell ───────────────────────────────────────────────────
  {
    id: 'bui-settings-modal', name: 'Settings Modal', category: 'Bismuth', icon: 'settings',
    elements: [
      // Overlay
      { id: 'overlay', element_type: 'rectangle', x: 0, y: 0, width: 900, height: 600, rotation: 0,
        properties: { fill: 'rgba(0,0,0,0.45)', radius: 0 },
        layer_id: 'default', z_index: 0, locked: false, visible: true, name: 'Overlay' },
      // Modal box
      { id: 'modal', element_type: 'rectangle', x: 80, y: 60, width: 740, height: 480, rotation: 0,
        properties: { fill: 'var(--background-primary)', radius: 10, stroke: 'var(--border-color)', strokeWidth: 1 },
        layer_id: 'default', z_index: 1, locked: false, visible: true, name: 'Modal' },
      // Header
      { id: 'modal-header', element_type: 'rectangle', x: 80, y: 60, width: 740, height: 48, rotation: 0,
        properties: { fill: 'transparent', stroke: 'var(--border-color)', strokeWidth: 1 },
        layer_id: 'default', z_index: 2, locked: false, visible: true, name: 'Header' },
      { id: 'modal-title', element_type: 'text', x: 100, y: 74, width: 120, height: 20, rotation: 0,
        properties: { text: 'Settings', fontSize: 15, fontWeight: 600, fill: 'var(--text-normal)', textAlign: 'left' },
        layer_id: 'default', z_index: 3, locked: false, visible: true, name: 'Title' },
      // Sidebar strip
      { id: 'modal-nav', element_type: 'rectangle', x: 80, y: 108, width: 160, height: 432, rotation: 0,
        properties: { fill: 'var(--background-secondary)' },
        layer_id: 'default', z_index: 2, locked: false, visible: true, name: 'Nav Strip' },
      // Content area
      { id: 'modal-content', element_type: 'rectangle', x: 240, y: 108, width: 580, height: 432, rotation: 0,
        properties: { fill: 'var(--background-primary)' },
        layer_id: 'default', z_index: 2, locked: false, visible: true, name: 'Content' },
    ],
    exposedProps: [],
    width: 900, height: 600,
    tags: ['bismuth', 'modal', 'settings', 'dialog'],
    isBuiltin: true, created_at: now, modified_at: now,
  },

  // ── Command palette ────────────────────────────────────────────────────────
  {
    id: 'bui-command-palette', name: 'Command Palette', category: 'Bismuth', icon: 'command',
    elements: [
      { id: 'overlay', element_type: 'rectangle', x: 0, y: 0, width: 640, height: 420, rotation: 0,
        properties: { fill: 'rgba(0,0,0,0.4)', radius: 0 },
        layer_id: 'default', z_index: 0, locked: false, visible: true, name: 'Overlay' },
      { id: 'panel', element_type: 'rectangle', x: 80, y: 60, width: 480, height: 300, rotation: 0,
        properties: { fill: 'var(--background-primary)', radius: 8, stroke: 'var(--border-color)', strokeWidth: 1 },
        layer_id: 'default', z_index: 1, locked: false, visible: true, name: 'Panel' },
      { id: 'search', element_type: 'rectangle', x: 80, y: 60, width: 480, height: 44, rotation: 0,
        properties: { fill: 'transparent', stroke: 'var(--border-color)', strokeWidth: 1 },
        layer_id: 'default', z_index: 2, locked: false, visible: true, name: 'Search Bar' },
      { id: 'search-text', element_type: 'text', x: 100, y: 73, width: 340, height: 18, rotation: 0,
        properties: { text: 'Type a command or search...', fontSize: 13, fill: 'var(--text-faint)', textAlign: 'left' },
        layer_id: 'default', z_index: 3, locked: false, visible: true, name: 'Placeholder' },
      { id: 'results', element_type: 'rectangle', x: 80, y: 104, width: 480, height: 256, rotation: 0,
        properties: { fill: 'transparent' },
        layer_id: 'default', z_index: 2, locked: false, visible: true, name: 'Results' },
    ],
    exposedProps: [],
    width: 640, height: 420,
    tags: ['bismuth', 'command', 'palette', 'search', 'overlay'],
    isBuiltin: true, created_at: now, modified_at: now,
  },

  // ── File tree item ─────────────────────────────────────────────────────────
  {
    id: 'bui-file-tree-item', name: 'File Tree Item', category: 'Bismuth', icon: 'file-text',
    elements: [
      { id: 'bg', element_type: 'rectangle', x: 0, y: 0, width: 240, height: 28, rotation: 0,
        properties: { fill: 'transparent', radius: 4 },
        layer_id: 'default', z_index: 0, locked: false, visible: true, name: 'Background' },
      { id: 'icon', element_type: 'rectangle', x: 12, y: 6, width: 16, height: 16, rotation: 0,
        properties: { fill: 'var(--text-muted)', radius: 2 },
        layer_id: 'default', z_index: 1, locked: false, visible: true, name: 'File Icon' },
      { id: 'label', element_type: 'text', x: 34, y: 7, width: 196, height: 14, rotation: 0,
        properties: { text: 'filename.md', fontSize: 13, fill: 'var(--text-normal)', textAlign: 'left' },
        layer_id: 'default', z_index: 2, locked: false, visible: true, name: 'Filename' },
    ],
    exposedProps: [{ key: 'label', label: 'Filename', type: 'text', defaultValue: 'filename.md' }],
    width: 240, height: 28,
    tags: ['bismuth', 'file', 'tree', 'navigation'],
    isBuiltin: true, created_at: now, modified_at: now,
  },

  // ── Toast notification ─────────────────────────────────────────────────────
  {
    id: 'bui-toast', name: 'Toast Notification', category: 'Bismuth', icon: 'info',
    elements: [
      { id: 'bg', element_type: 'rectangle', x: 0, y: 0, width: 320, height: 52, rotation: 0,
        properties: { fill: 'var(--background-primary)', stroke: 'var(--border-color)', strokeWidth: 1, radius: 8 },
        layer_id: 'default', z_index: 0, locked: false, visible: true, name: 'Background' },
      { id: 'accent', element_type: 'rectangle', x: 0, y: 0, width: 4, height: 52, rotation: 0,
        properties: { fill: 'var(--interactive-accent)', radius: 8 },
        layer_id: 'default', z_index: 1, locked: false, visible: true, name: 'Accent Bar' },
      { id: 'message', element_type: 'text', x: 16, y: 10, width: 268, height: 32, rotation: 0,
        properties: { text: 'Toast message text goes here', fontSize: 13, fill: 'var(--text-normal)', textAlign: 'left', lineHeight: 1.4 },
        layer_id: 'default', z_index: 2, locked: false, visible: true, name: 'Message' },
      { id: 'close', element_type: 'rectangle', x: 290, y: 16, width: 20, height: 20, rotation: 0,
        properties: { fill: 'transparent', radius: 4 },
        layer_id: 'default', z_index: 3, locked: false, visible: true, name: 'Close Button' },
    ],
    exposedProps: [{ key: 'message', label: 'Message', type: 'text', defaultValue: 'Toast message text' }],
    width: 320, height: 52,
    tags: ['bismuth', 'toast', 'notification', 'feedback'],
    isBuiltin: true, created_at: now, modified_at: now,
  },
];
