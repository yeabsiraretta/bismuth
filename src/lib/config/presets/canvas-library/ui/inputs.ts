import type { ComponentDefinition } from '@/features/canvas/types';

const now = 0;

export const INPUT_COMPONENTS: ComponentDefinition[] = [
  {
    id: 'builtin-input-text', name: 'Text Input', category: 'Inputs', icon: 'edit-2',
    width: 240, height: 40, tags: ['input', 'form', 'text'], isBuiltin: true,
    exposedProps: [{ key: 'placeholder', label: 'Placeholder', type: 'text', defaultValue: 'Enter text...' }],
    elements: [
      { id: 'border', element_type: 'rectangle', x: 0, y: 0, width: 240, height: 40, rotation: 0, properties: { fill: 'var(--background-modifier-form-field)', stroke: 'var(--border-color)', strokeWidth: 1, radius: 6 }, layer_id: 'default', z_index: 0, locked: false, visible: true, name: 'Border' },
      { id: 'text', element_type: 'text', x: 12, y: 10, width: 216, height: 20, rotation: 0, properties: { text: 'Enter text...', fontSize: 14, fill: 'var(--text-muted)', textAlign: 'left' }, layer_id: 'default', z_index: 1, locked: false, visible: true, name: 'Placeholder' },
    ],
    created_at: now, modified_at: now,
  },
  {
    id: 'builtin-input-search', name: 'Search Bar', category: 'Inputs', icon: 'search',
    width: 240, height: 40, tags: ['input', 'form', 'search'], isBuiltin: true,
    exposedProps: [{ key: 'placeholder', label: 'Placeholder', type: 'text', defaultValue: 'Search...' }],
    elements: [
      { id: 'border', element_type: 'rectangle', x: 0, y: 0, width: 240, height: 40, rotation: 0, properties: { fill: 'var(--background-modifier-form-field)', stroke: 'var(--border-color)', strokeWidth: 1, radius: 20 }, layer_id: 'default', z_index: 0, locked: false, visible: true, name: 'Border' },
      { id: 'icon', element_type: 'text', x: 12, y: 10, width: 20, height: 20, rotation: 0, properties: { text: '[search]', fontSize: 14, fill: 'var(--text-muted)' }, layer_id: 'default', z_index: 1, locked: false, visible: true, name: 'Search Icon' },
      { id: 'text', element_type: 'text', x: 36, y: 10, width: 192, height: 20, rotation: 0, properties: { text: 'Search...', fontSize: 14, fill: 'var(--text-muted)', textAlign: 'left' }, layer_id: 'default', z_index: 2, locked: false, visible: true, name: 'Placeholder' },
    ],
    created_at: now, modified_at: now,
  },
  {
    id: 'builtin-input-textarea', name: 'Textarea', category: 'Inputs', icon: 'edit',
    width: 240, height: 100, tags: ['input', 'form', 'textarea'], isBuiltin: true,
    exposedProps: [{ key: 'placeholder', label: 'Placeholder', type: 'text', defaultValue: 'Write something...' }],
    elements: [
      { id: 'border', element_type: 'rectangle', x: 0, y: 0, width: 240, height: 100, rotation: 0, properties: { fill: 'var(--background-modifier-form-field)', stroke: 'var(--border-color)', strokeWidth: 1, radius: 6 }, layer_id: 'default', z_index: 0, locked: false, visible: true, name: 'Border' },
      { id: 'text', element_type: 'text', x: 12, y: 10, width: 216, height: 80, rotation: 0, properties: { text: 'Write something...', fontSize: 14, fill: 'var(--text-muted)', textAlign: 'left', verticalAlign: 'top' }, layer_id: 'default', z_index: 1, locked: false, visible: true, name: 'Placeholder' },
    ],
    created_at: now, modified_at: now,
  },
  {
    id: 'builtin-input-checkbox', name: 'Checkbox', category: 'Inputs', icon: 'check-square',
    width: 140, height: 24, tags: ['input', 'form', 'checkbox'], isBuiltin: true,
    exposedProps: [{ key: 'label', label: 'Label', type: 'text', defaultValue: 'Option' }],
    elements: [
      { id: 'box', element_type: 'rectangle', x: 0, y: 2, width: 20, height: 20, rotation: 0, properties: { fill: 'var(--background-primary)', stroke: 'var(--border-color)', strokeWidth: 1, radius: 4 }, layer_id: 'default', z_index: 0, locked: false, visible: true, name: 'Checkbox' },
      { id: 'label', element_type: 'text', x: 28, y: 3, width: 112, height: 18, rotation: 0, properties: { text: 'Option', fontSize: 14, fill: 'var(--text-normal)', textAlign: 'left' }, layer_id: 'default', z_index: 1, locked: false, visible: true, name: 'Label' },
    ],
    created_at: now, modified_at: now,
  },
  {
    id: 'builtin-input-toggle', name: 'Toggle Switch', category: 'Inputs', icon: 'toggle-left',
    width: 44, height: 24, tags: ['input', 'form', 'toggle', 'switch'], isBuiltin: true,
    exposedProps: [{ key: 'active', label: 'Active', type: 'boolean', defaultValue: false }],
    elements: [
      { id: 'track', element_type: 'rectangle', x: 0, y: 0, width: 44, height: 24, rotation: 0, properties: { fill: 'var(--background-modifier-border)', radius: 12 }, layer_id: 'default', z_index: 0, locked: false, visible: true, name: 'Track' },
      { id: 'thumb', element_type: 'circle', x: 2, y: 2, width: 20, height: 20, rotation: 0, properties: { fill: '#ffffff' }, layer_id: 'default', z_index: 1, locked: false, visible: true, name: 'Thumb' },
    ],
    created_at: now, modified_at: now,
  },
  {
    id: 'builtin-select-input', name: 'Select', category: 'Inputs', icon: 'chevron-down',
    width: 200, height: 36, tags: ['input', 'form', 'select', 'dropdown'], isBuiltin: true,
    exposedProps: [{ key: 'label', label: 'Label', type: 'text', defaultValue: 'Select option' }],
    elements: [
      { id: 'border', element_type: 'rectangle', x: 0, y: 0, width: 200, height: 36, rotation: 0, properties: { fill: 'var(--background-modifier-form-field)', stroke: 'var(--border-color)', strokeWidth: 1, radius: 6 }, layer_id: 'default', z_index: 0, locked: false, visible: true, name: 'Border' },
      { id: 'label', element_type: 'text', x: 12, y: 9, width: 152, height: 18, rotation: 0, properties: { text: 'Select option', fontSize: 14, fill: 'var(--text-muted)', textAlign: 'left' }, layer_id: 'default', z_index: 1, locked: false, visible: true, name: 'Label' },
      { id: 'chevron', element_type: 'text', x: 172, y: 9, width: 16, height: 18, rotation: 0, properties: { text: '›', fontSize: 14, fill: 'var(--text-muted)', textAlign: 'center' }, layer_id: 'default', z_index: 2, locked: false, visible: true, name: 'Chevron' },
    ],
    created_at: now, modified_at: now,
  },
];
