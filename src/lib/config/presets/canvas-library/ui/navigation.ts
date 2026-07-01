import type { ComponentDefinition } from '@/features/canvas/types';

const now = 0;

export const NAVIGATION_COMPONENTS: ComponentDefinition[] = [
  {
    id: 'builtin-nav-tabs', name: 'Tab Bar', category: 'Navigation', icon: 'layout',
    width: 320, height: 40, tags: ['navigation', 'tabs', 'bar'], isBuiltin: true,
    exposedProps: [{ key: 'activeTab', label: 'Active Tab', type: 'text', defaultValue: 'Tab 1' }],
    elements: [
      { id: 'bg', element_type: 'rectangle', x: 0, y: 0, width: 320, height: 40, rotation: 0, properties: { fill: 'var(--background-secondary)' }, layer_id: 'default', z_index: 0, locked: false, visible: true, name: 'Background' },
      { id: 'tab1', element_type: 'text', x: 16, y: 10, width: 60, height: 20, rotation: 0, properties: { text: 'Tab 1', fontSize: 13, fontWeight: 600, fill: 'var(--interactive-accent)', textAlign: 'center' }, layer_id: 'default', z_index: 1, locked: false, visible: true, name: 'Tab 1' },
      { id: 'tab2', element_type: 'text', x: 92, y: 10, width: 60, height: 20, rotation: 0, properties: { text: 'Tab 2', fontSize: 13, fontWeight: 400, fill: 'var(--text-muted)', textAlign: 'center' }, layer_id: 'default', z_index: 2, locked: false, visible: true, name: 'Tab 2' },
      { id: 'tab3', element_type: 'text', x: 168, y: 10, width: 60, height: 20, rotation: 0, properties: { text: 'Tab 3', fontSize: 13, fontWeight: 400, fill: 'var(--text-muted)', textAlign: 'center' }, layer_id: 'default', z_index: 3, locked: false, visible: true, name: 'Tab 3' },
      { id: 'indicator', element_type: 'rectangle', x: 16, y: 36, width: 60, height: 3, rotation: 0, properties: { fill: 'var(--interactive-accent)', radius: 2 }, layer_id: 'default', z_index: 4, locked: false, visible: true, name: 'Indicator' },
    ],
    created_at: now, modified_at: now,
  },
  {
    id: 'builtin-nav-breadcrumb', name: 'Breadcrumb', category: 'Navigation', icon: 'chevron-right',
    width: 280, height: 28, tags: ['navigation', 'breadcrumb', 'path'], isBuiltin: true,
    exposedProps: [],
    elements: [
      { id: 'item1', element_type: 'text', x: 0, y: 4, width: 50, height: 20, rotation: 0, properties: { text: 'Home', fontSize: 13, fill: 'var(--interactive-accent)', textAlign: 'left' }, layer_id: 'default', z_index: 0, locked: false, visible: true, name: 'Home' },
      { id: 'sep1', element_type: 'text', x: 54, y: 4, width: 16, height: 20, rotation: 0, properties: { text: '/', fontSize: 13, fill: 'var(--text-faint)', textAlign: 'center' }, layer_id: 'default', z_index: 1, locked: false, visible: true, name: 'Separator 1' },
      { id: 'item2', element_type: 'text', x: 74, y: 4, width: 60, height: 20, rotation: 0, properties: { text: 'Section', fontSize: 13, fill: 'var(--interactive-accent)', textAlign: 'left' }, layer_id: 'default', z_index: 2, locked: false, visible: true, name: 'Section' },
      { id: 'sep2', element_type: 'text', x: 138, y: 4, width: 16, height: 20, rotation: 0, properties: { text: '/', fontSize: 13, fill: 'var(--text-faint)', textAlign: 'center' }, layer_id: 'default', z_index: 3, locked: false, visible: true, name: 'Separator 2' },
      { id: 'item3', element_type: 'text', x: 158, y: 4, width: 80, height: 20, rotation: 0, properties: { text: 'Current', fontSize: 13, fontWeight: 500, fill: 'var(--text-normal)', textAlign: 'left' }, layer_id: 'default', z_index: 4, locked: false, visible: true, name: 'Current' },
    ],
    created_at: now, modified_at: now,
  },
  {
    id: 'builtin-nav-sidebar-item', name: 'Sidebar Nav Item', category: 'Navigation', icon: 'sidebar',
    width: 220, height: 36, tags: ['navigation', 'sidebar', 'menu'], isBuiltin: true,
    exposedProps: [{ key: 'label', label: 'Label', type: 'text', defaultValue: 'Menu Item' }],
    elements: [
      { id: 'bg', element_type: 'rectangle', x: 0, y: 0, width: 220, height: 36, rotation: 0, properties: { fill: 'var(--background-modifier-hover)', radius: 6 }, layer_id: 'default', z_index: 0, locked: false, visible: true, name: 'Background' },
      { id: 'icon', element_type: 'rectangle', x: 10, y: 8, width: 20, height: 20, rotation: 0, properties: { fill: 'var(--text-muted)', radius: 4 }, layer_id: 'default', z_index: 1, locked: false, visible: true, name: 'Icon Area' },
      { id: 'label', element_type: 'text', x: 38, y: 8, width: 160, height: 20, rotation: 0, properties: { text: 'Menu Item', fontSize: 14, fontWeight: 500, fill: 'var(--text-normal)', textAlign: 'left' }, layer_id: 'default', z_index: 2, locked: false, visible: true, name: 'Label' },
    ],
    created_at: now, modified_at: now,
  },
  {
    id: 'builtin-nav-pagination', name: 'Pagination', category: 'Navigation', icon: 'more-horizontal',
    width: 240, height: 36, tags: ['navigation', 'pagination', 'pages'], isBuiltin: true,
    exposedProps: [],
    elements: [
      { id: 'prev', element_type: 'rectangle', x: 0, y: 0, width: 36, height: 36, rotation: 0, properties: { fill: 'var(--background-primary)', stroke: 'var(--border-color)', strokeWidth: 1, radius: 6 }, layer_id: 'default', z_index: 0, locked: false, visible: true, name: 'Prev' },
      { id: 'prev-icon', element_type: 'text', x: 10, y: 8, width: 16, height: 20, rotation: 0, properties: { text: '<', fontSize: 14, fill: 'var(--text-muted)', textAlign: 'center' }, layer_id: 'default', z_index: 1, locked: false, visible: true, name: 'Prev Icon' },
      { id: 'p1', element_type: 'rectangle', x: 44, y: 0, width: 36, height: 36, rotation: 0, properties: { fill: 'var(--interactive-accent)', radius: 6 }, layer_id: 'default', z_index: 2, locked: false, visible: true, name: 'Page 1' },
      { id: 'p1-text', element_type: 'text', x: 44, y: 8, width: 36, height: 20, rotation: 0, properties: { text: '1', fontSize: 14, fontWeight: 500, fill: 'var(--text-on-accent)', textAlign: 'center' }, layer_id: 'default', z_index: 3, locked: false, visible: true, name: 'Page 1 Text' },
      { id: 'p2', element_type: 'rectangle', x: 88, y: 0, width: 36, height: 36, rotation: 0, properties: { fill: 'var(--background-primary)', stroke: 'var(--border-color)', strokeWidth: 1, radius: 6 }, layer_id: 'default', z_index: 4, locked: false, visible: true, name: 'Page 2' },
      { id: 'p2-text', element_type: 'text', x: 88, y: 8, width: 36, height: 20, rotation: 0, properties: { text: '2', fontSize: 14, fill: 'var(--text-normal)', textAlign: 'center' }, layer_id: 'default', z_index: 5, locked: false, visible: true, name: 'Page 2 Text' },
      { id: 'next', element_type: 'rectangle', x: 204, y: 0, width: 36, height: 36, rotation: 0, properties: { fill: 'var(--background-primary)', stroke: 'var(--border-color)', strokeWidth: 1, radius: 6 }, layer_id: 'default', z_index: 6, locked: false, visible: true, name: 'Next' },
      { id: 'next-icon', element_type: 'text', x: 214, y: 8, width: 16, height: 20, rotation: 0, properties: { text: '>', fontSize: 14, fill: 'var(--text-muted)', textAlign: 'center' }, layer_id: 'default', z_index: 7, locked: false, visible: true, name: 'Next Icon' },
    ],
    created_at: now, modified_at: now,
  },
];
