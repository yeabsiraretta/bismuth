/**
 * Element type metadata — labels, icons, colors, hierarchy rules.
 */

import type { ElementType, ElementTypeMeta } from './index';

export const ELEMENT_META: Record<ElementType, ElementTypeMeta> = {
  campaign: {
    type: 'campaign',
    label: 'Campaign',
    pluralLabel: 'Campaigns',
    icon: 'shield',
    color: '#8b5cf6',
    allowsChildren: true,
    childTypes: ['adventure', 'session'],
    isGlobal: false,
  },
  adventure: {
    type: 'adventure',
    label: 'Adventure',
    pluralLabel: 'Adventures',
    icon: 'map',
    color: '#3b82f6',
    allowsChildren: true,
    childTypes: ['chapter'],
    isGlobal: false,
  },
  chapter: {
    type: 'chapter',
    label: 'Chapter',
    pluralLabel: 'Chapters',
    icon: 'book-open',
    color: '#06b6d4',
    allowsChildren: false,
    childTypes: [],
    isGlobal: false,
  },
  session: {
    type: 'session',
    label: 'Session',
    pluralLabel: 'Sessions',
    icon: 'calendar',
    color: '#10b981',
    allowsChildren: true,
    childTypes: ['scene'],
    isGlobal: false,
  },
  scene: {
    type: 'scene',
    label: 'Scene',
    pluralLabel: 'Scenes',
    icon: 'film',
    color: '#14b8a6',
    allowsChildren: false,
    childTypes: [],
    isGlobal: false,
  },
  event: {
    type: 'event',
    label: 'Event',
    pluralLabel: 'Events',
    icon: 'zap',
    color: '#f59e0b',
    allowsChildren: false,
    childTypes: [],
    isGlobal: true,
  },
  location: {
    type: 'location',
    label: 'Location',
    pluralLabel: 'Locations',
    icon: 'map-pin',
    color: '#ef4444',
    allowsChildren: false,
    childTypes: [],
    isGlobal: true,
  },
  clue: {
    type: 'clue',
    label: 'Clue',
    pluralLabel: 'Clues',
    icon: 'search',
    color: '#f97316',
    allowsChildren: false,
    childTypes: [],
    isGlobal: true,
  },
  npc: {
    type: 'npc',
    label: 'NPC',
    pluralLabel: 'NPCs',
    icon: 'user',
    color: '#a855f7',
    allowsChildren: false,
    childTypes: [],
    isGlobal: true,
  },
  faction: {
    type: 'faction',
    label: 'Faction',
    pluralLabel: 'Factions',
    icon: 'users',
    color: '#6366f1',
    allowsChildren: false,
    childTypes: [],
    isGlobal: true,
  },
  object: {
    type: 'object',
    label: 'Object',
    pluralLabel: 'Objects',
    icon: 'box',
    color: '#78716c',
    allowsChildren: false,
    childTypes: [],
    isGlobal: true,
  },
  monster: {
    type: 'monster',
    label: 'Monster',
    pluralLabel: 'Monsters',
    icon: 'skull',
    color: '#dc2626',
    allowsChildren: false,
    childTypes: [],
    isGlobal: true,
  },
  subplot: {
    type: 'subplot',
    label: 'Subplot',
    pluralLabel: 'Subplots',
    icon: 'git-branch',
    color: '#ec4899',
    allowsChildren: false,
    childTypes: [],
    isGlobal: true,
  },
  pc: {
    type: 'pc',
    label: 'Player Character',
    pluralLabel: 'Player Characters',
    icon: 'star',
    color: '#eab308',
    allowsChildren: false,
    childTypes: [],
    isGlobal: true,
  },
};

/** Ordered list for UI rendering. */
export const ELEMENT_TYPE_ORDER: ElementType[] = [
  'campaign',
  'adventure',
  'chapter',
  'session',
  'scene',
  'npc',
  'pc',
  'faction',
  'location',
  'event',
  'clue',
  'object',
  'monster',
  'subplot',
];

/** Types that can exist as global assets (not tied to a campaign). */
export const GLOBAL_ASSET_TYPES: ElementType[] = ELEMENT_TYPE_ORDER.filter(
  (t) => ELEMENT_META[t].isGlobal
);

/** Types that form the narrative hierarchy. */
export const NARRATIVE_TYPES: ElementType[] = [
  'campaign',
  'adventure',
  'chapter',
  'session',
  'scene',
];

export function getElementMeta(type: ElementType): ElementTypeMeta {
  return ELEMENT_META[type];
}
