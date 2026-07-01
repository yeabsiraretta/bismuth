/**
 * Storyteller Suite — Entity system types.
 * Characters, locations, events, items, groups, and all worldbuilding objects.
 */

export type EntityType =
  | 'character'
  | 'location'
  | 'event'
  | 'item'
  | 'group'
  | 'reference'
  | 'chapter'
  | 'scene'
  | 'book'
  | 'culture'
  | 'economy'
  | 'magic-system'
  | 'compendium'
  | 'map';

export type RelationshipKind =
  | 'ally'
  | 'enemy'
  | 'family'
  | 'friend'
  | 'rival'
  | 'member'
  | 'leader'
  | 'owner'
  | 'located-in'
  | 'parent-of'
  | 'child-of'
  | 'custom';

export interface StorytellerEntity {
  id: string;
  type: EntityType;
  name: string;
  storyId: string;
  notePath: string | null;
  description: string;
  tags: string[];
  customFields: Record<string, CustomFieldValue>;
  images: string[];
  sortOrder: number;
  createdAt: string;
  modifiedAt: string;
}

export type CustomFieldValue = string | number | boolean | string[] | null;

export interface CustomFieldDefinition {
  id: string;
  name: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'multiselect' | 'date' | 'link';
  options?: string[];
  appliesTo: EntityType[];
  defaultValue?: CustomFieldValue;
}

export interface EntityRelationship {
  id: string;
  sourceId: string;
  targetId: string;
  kind: RelationshipKind;
  label: string;
  bidirectional: boolean;
}

// ─── Character-specific ─────────────────────────────────────────────────────

export interface CharacterEntity extends StorytellerEntity {
  type: 'character';
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor' | 'extra';
  occupation?: string;
  motivation?: string;
  arc?: string;
  backstory?: string;
}

// ─── Location-specific ──────────────────────────────────────────────────────

export interface LocationEntity extends StorytellerEntity {
  type: 'location';
  locationType?:
    'world' | 'continent' | 'region' | 'city' | 'district' | 'building' | 'room' | 'wilderness';
  parentLocationId?: string;
  mapCoordinates?: { x: number; y: number; mapId: string };
}

// ─── Event-specific ─────────────────────────────────────────────────────────

export interface EventEntity extends StorytellerEntity {
  type: 'event';
  date?: string;
  endDate?: string;
  era?: string;
  participants: string[];
  locationId?: string;
  timelineTrack?: string;
}

// ─── Scene/Chapter/Book ─────────────────────────────────────────────────────

export type SceneStatus = 'outline' | 'draft' | 'revision' | 'final' | 'cut';

export interface SceneEntity extends StorytellerEntity {
  type: 'scene';
  chapterId?: string;
  status: SceneStatus;
  wordCount: number;
  pov?: string;
  locationId?: string;
  synopsis?: string;
  branches?: SceneBranch[];
}

export interface SceneBranch {
  id: string;
  label: string;
  targetSceneId: string;
  condition?: string;
}

export interface ChapterEntity extends StorytellerEntity {
  type: 'chapter';
  bookId?: string;
  sceneIds: string[];
  sortOrder: number;
}

export interface BookEntity extends StorytellerEntity {
  type: 'book';
  chapterIds: string[];
  wordCountGoal?: number;
}

// ─── Group-specific ─────────────────────────────────────────────────────────

export interface GroupEntity extends StorytellerEntity {
  type: 'group';
  groupType?: 'faction' | 'organization' | 'family' | 'species' | 'custom';
  memberIds: string[];
  philosophy?: string;
  structure?: string;
}

// ─── Entity type metadata ───────────────────────────────────────────────────

export interface EntityTypeMeta {
  type: EntityType;
  label: string;
  pluralLabel: string;
  icon: string;
  color: string;
  folderName: string;
}

export const ENTITY_TYPE_META: EntityTypeMeta[] = [
  {
    type: 'character',
    label: 'Character',
    pluralLabel: 'Characters',
    icon: 'user',
    color: '#7c3aed',
    folderName: 'Characters',
  },
  {
    type: 'location',
    label: 'Location',
    pluralLabel: 'Locations',
    icon: 'map-pin',
    color: '#059669',
    folderName: 'Locations',
  },
  {
    type: 'event',
    label: 'Event',
    pluralLabel: 'Events',
    icon: 'calendar',
    color: '#d97706',
    folderName: 'Events',
  },
  {
    type: 'item',
    label: 'Item',
    pluralLabel: 'Items',
    icon: 'box',
    color: '#0891b2',
    folderName: 'Items',
  },
  {
    type: 'group',
    label: 'Group',
    pluralLabel: 'Groups',
    icon: 'users',
    color: '#be185d',
    folderName: 'Groups',
  },
  {
    type: 'reference',
    label: 'Reference',
    pluralLabel: 'References',
    icon: 'bookmark',
    color: '#6366f1',
    folderName: 'References',
  },
  {
    type: 'chapter',
    label: 'Chapter',
    pluralLabel: 'Chapters',
    icon: 'file-text',
    color: '#4f46e5',
    folderName: 'Chapters',
  },
  {
    type: 'scene',
    label: 'Scene',
    pluralLabel: 'Scenes',
    icon: 'film',
    color: '#e11d48',
    folderName: 'Scenes',
  },
  {
    type: 'book',
    label: 'Book',
    pluralLabel: 'Books',
    icon: 'book-open',
    color: '#92400e',
    folderName: 'Books',
  },
  {
    type: 'culture',
    label: 'Culture',
    pluralLabel: 'Cultures',
    icon: 'globe',
    color: '#0d9488',
    folderName: 'Cultures',
  },
  {
    type: 'economy',
    label: 'Economy',
    pluralLabel: 'Economies',
    icon: 'trending-up',
    color: '#ca8a04',
    folderName: 'Economies',
  },
  {
    type: 'magic-system',
    label: 'Magic System',
    pluralLabel: 'Magic Systems',
    icon: 'zap',
    color: '#9333ea',
    folderName: 'MagicSystems',
  },
  {
    type: 'compendium',
    label: 'Compendium',
    pluralLabel: 'Compendium',
    icon: 'book',
    color: '#64748b',
    folderName: 'Compendium',
  },
  {
    type: 'map',
    label: 'Map',
    pluralLabel: 'Maps',
    icon: 'map',
    color: '#16a34a',
    folderName: 'Maps',
  },
];

export function getEntityMeta(type: EntityType): EntityTypeMeta {
  return ENTITY_TYPE_META.find((m) => m.type === type) ?? ENTITY_TYPE_META[0];
}
