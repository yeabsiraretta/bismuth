/**
 * Icon components for the canvas component library.
 * Each component is a named icon from the Bismuth icon registry,
 * rendered as a draggable canvas element with a label below.
 *
 * Icons are grouped by semantic category for easier browsing.
 */
import type { ComponentDefinition } from '@/features/canvas/types';

const now = 0;

function ic(id: string, name: string, iconKey: string, tags: string[]): ComponentDefinition {
  return {
    id, name, category: 'Icons', icon: iconKey,
    elements: [
      {
        id: 'bg', element_type: 'rectangle', x: 0, y: 0, width: 48, height: 56, rotation: 0,
        properties: { fill: 'var(--background-primary-alt)', radius: 6 },
        layer_id: 'default', z_index: 0, locked: false, visible: true, name: 'Background',
      },
      {
        id: 'icon', element_type: 'text', x: 12, y: 10, width: 24, height: 24, rotation: 0,
        properties: { text: iconKey, fontSize: 11, fontWeight: 400, fill: 'var(--text-normal)', textAlign: 'center' },
        layer_id: 'default', z_index: 1, locked: false, visible: true, name: 'Icon',
      },
      {
        id: 'label', element_type: 'text', x: 0, y: 38, width: 48, height: 12, rotation: 0,
        properties: { text: name, fontSize: 9, fill: 'var(--text-faint)', textAlign: 'center' },
        layer_id: 'default', z_index: 2, locked: false, visible: true, name: 'Label',
      },
    ],
    exposedProps: [
      { key: 'icon', label: 'Icon', type: 'text', defaultValue: iconKey },
      { key: 'color', label: 'Color', type: 'color', defaultValue: 'var(--text-normal)' },
    ],
    width: 48, height: 56,
    tags: ['icon', ...tags],
    isBuiltin: true, created_at: now, modified_at: now,
  };
}

export const ICON_COMPONENTS: ComponentDefinition[] = [
  // Actions
  ic('icon-plus',         'Plus',         'plus',         ['add', 'create', 'new']),
  ic('icon-minus',        'Minus',        'minus',        ['remove', 'delete', 'subtract']),
  ic('icon-check',        'Check',        'check',        ['done', 'confirm', 'success']),
  ic('icon-x',            'Close',        'x',            ['close', 'dismiss', 'cancel']),
  ic('icon-edit',         'Edit',         'edit-2',       ['edit', 'write', 'modify']),
  ic('icon-trash',        'Trash',        'trash-2',      ['delete', 'remove']),
  ic('icon-copy',         'Copy',         'copy',         ['duplicate', 'clone']),
  ic('icon-save',         'Save',         'save',         ['save', 'persist']),
  ic('icon-refresh',      'Refresh',      'refresh-cw',   ['reload', 'sync', 'update']),
  ic('icon-upload',       'Upload',       'upload',       ['upload', 'import']),
  ic('icon-download',     'Download',     'download',     ['download', 'export']),
  ic('icon-share',        'Share',        'share-2',      ['share', 'distribute']),
  ic('icon-external',     'External',     'external-link', ['link', 'open', 'external']),
  ic('icon-filter',       'Filter',       'filter',       ['filter', 'sort', 'search']),
  ic('icon-search',       'Search',       'search',       ['find', 'lookup']),
  ic('icon-settings',     'Settings',     'settings',     ['config', 'preferences']),

  // Navigation
  ic('icon-arrow-left',   'Arrow Left',   'arrow-left',   ['back', 'previous']),
  ic('icon-arrow-right',  'Arrow Right',  'arrow-right',  ['forward', 'next']),
  ic('icon-arrow-up',     'Arrow Up',     'arrow-up',     ['up', 'ascend']),
  ic('icon-arrow-down',   'Arrow Down',   'arrow-down',   ['down', 'descend']),
  ic('icon-chevron-left', 'Chevron Left', 'chevron-left', ['back', 'collapse']),
  ic('icon-chevron-right','Chevron Right','chevron-right', ['forward', 'expand']),
  ic('icon-chevron-down', 'Chevron Down', 'chevron-down', ['expand', 'dropdown']),
  ic('icon-home',         'Home',         'home',         ['home', 'root', 'start']),

  // Files & Data
  ic('icon-file',         'File',         'file-text',    ['document', 'note']),
  ic('icon-file-plus',    'File Plus',    'file-plus',    ['new file', 'create']),
  ic('icon-folder',       'Folder',       'folder-open',  ['directory', 'collection']),
  ic('icon-folder-plus',  'Folder Plus',  'folder-plus',  ['new folder', 'create']),
  ic('icon-database',     'Database',     'database',     ['storage', 'data']),
  ic('icon-hard-drive',   'Hard Drive',   'hard-drive',   ['storage', 'disk']),
  ic('icon-archive',      'Archive',      'archive',      ['storage', 'compress']),

  // Communication
  ic('icon-link',         'Link',         'link-2',       ['url', 'href', 'connect']),
  ic('icon-send',         'Send',         'send',         ['submit', 'email', 'message']),
  ic('icon-inbox',        'Inbox',        'inbox',        ['mail', 'receive', 'tray']),
  ic('icon-rss',          'RSS',          'rss',          ['feed', 'subscribe']),

  // Status & Info
  ic('icon-info',         'Info',         'info',         ['information', 'help']),
  ic('icon-help',         'Help',         'help-circle',  ['question', 'support']),
  ic('icon-alert',        'Alert',        'alert-circle', ['warning', 'error']),
  ic('icon-warning',      'Warning',      'alert-triangle',['caution', 'danger']),
  ic('icon-check-circle', 'Check Circle', 'check-circle', ['success', 'done', 'valid']),
  ic('icon-x-circle',     'X Circle',     'x-circle',     ['error', 'invalid', 'fail']),
  ic('icon-zap',          'Zap',          'zap',          ['fast', 'power', 'lightning']),
  ic('icon-star',         'Star',         'star',         ['favorite', 'bookmark', 'rate']),
  ic('icon-activity',     'Activity',     'activity',     ['stats', 'pulse', 'monitor']),
  ic('icon-shield',       'Shield',       'shield',       ['security', 'protect']),

  // Layout & Panels
  ic('icon-layout',       'Layout',       'layout',       ['grid', 'arrange', 'compose']),
  ic('icon-columns',      'Columns',      'columns',      ['grid', 'split']),
  ic('icon-sidebar',      'Sidebar',      'sidebar',      ['panel', 'navigation']),
  ic('icon-panel-right',  'Panel Right',  'panel-right',  ['sidebar', 'panel']),
  ic('icon-maximize',     'Maximize',     'maximize',     ['expand', 'fullscreen']),
  ic('icon-minimize',     'Minimize',     'minimize',     ['collapse', 'reduce']),
  ic('icon-layers',       'Layers',       'layers',       ['stack', 'depth', 'z-order']),
  ic('icon-grid',         'Grid',         'grid',         ['tiles', 'mosaic']),

  // Content
  ic('icon-tag',          'Tag',          'tag',          ['label', 'category', 'metadata']),
  ic('icon-bookmark',     'Bookmark',     'bookmark',     ['save', 'favorite']),
  ic('icon-calendar',     'Calendar',     'calendar',     ['date', 'schedule', 'time']),
  ic('icon-clock',        'Clock',        'clock',        ['time', 'schedule']),
  ic('icon-book',         'Book',         'book-open',    ['docs', 'notes', 'manual']),
  ic('icon-box',          'Box',          'box',          ['component', 'container', 'package']),
  ic('icon-code',         'Code',         'code',         ['programming', 'source']),
  ic('icon-terminal',     'Terminal',     'terminal',     ['cli', 'command', 'shell']),
  ic('icon-braces',       'Braces',       'braces',       ['json', 'object', 'code']),
  ic('icon-list',         'List',         'list',         ['items', 'ordered']),
  ic('icon-table',        'Table',        'table',        ['grid', 'data', 'spreadsheet']),

  // Media & App
  ic('icon-image',        'Image',        'image',        ['photo', 'picture', 'media']),
  ic('icon-play',         'Play',         'play',         ['start', 'run', 'media']),
  ic('icon-pause',        'Pause',        'pause',        ['stop', 'hold', 'media']),
  ic('icon-music',        'Music',        'music',        ['audio', 'sound', 'track']),
  ic('icon-mic',          'Mic',          'mic',          ['audio', 'voice', 'record']),
  ic('icon-film',         'Film',         'film',         ['video', 'movie', 'media']),
  ic('icon-camera',       'Camera',       'image',        ['photo', 'capture', 'selfie']),

  // Formatting
  ic('icon-bold',         'Bold',         'bold',         ['text', 'format', 'strong']),
  ic('icon-italic',       'Italic',       'italic',       ['text', 'format', 'emphasis']),
  ic('icon-heading',      'Heading',      'heading',      ['text', 'title', 'h1']),
  ic('icon-align-left',   'Align Left',   'align-left',   ['text', 'alignment']),
  ic('icon-align-center', 'Align Center', 'align-center', ['text', 'alignment']),
  ic('icon-quote',        'Quote',        'quote',        ['text', 'blockquote']),

  // Git & Dev
  ic('icon-git-branch',   'Git Branch',   'git-branch',   ['git', 'version', 'branch']),
  ic('icon-git-commit',   'Git Commit',   'git-commit',   ['git', 'version', 'commit']),
  ic('icon-git-merge',    'Git Merge',    'git-merge',    ['git', 'combine', 'merge']),

  // Misc
  ic('icon-palette',      'Palette',      'palette',      ['color', 'theme', 'design']),
  ic('icon-sun',          'Sun',          'sun',          ['light', 'theme', 'bright']),
  ic('icon-moon',         'Moon',         'moon',         ['dark', 'theme', 'night']),
  ic('icon-globe',        'Globe',        'globe',        ['world', 'internet', 'language']),
  ic('icon-cpu',          'CPU',          'cpu',          ['hardware', 'processor', 'compute']),
  ic('icon-map',          'Map',          'map',          ['location', 'navigate', 'directions']),
  ic('icon-sparkles',     'Sparkles',     'sparkles',     ['ai', 'magic', 'special']),
  ic('icon-lightbulb',    'Lightbulb',    'lightbulb',    ['idea', 'insight', 'ai']),
  ic('icon-command',      'Command',      'command',      ['keyboard', 'shortcut', 'meta']),
  ic('icon-sliders',      'Sliders',      'sliders',      ['controls', 'adjust', 'tune']),
  ic('icon-scan',         'Scan',         'scan',         ['qr', 'barcode', 'detect']),
  ic('icon-dumbbell',     'Dumbbell',     'dumbbell',     ['fitness', 'gym', 'exercise']),
];
