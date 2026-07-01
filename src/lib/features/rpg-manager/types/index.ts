/**
 * RPG Manager core types.
 * System-agnostic campaign management for any TTRPG.
 */

export type ElementType =
  | 'campaign'
  | 'adventure'
  | 'chapter'
  | 'session'
  | 'scene'
  | 'event'
  | 'location'
  | 'clue'
  | 'npc'
  | 'faction'
  | 'object'
  | 'monster'
  | 'subplot'
  | 'pc';

export type RelationshipType = 'bidirectional' | 'unidirectional' | 'parent' | 'child';

export type StoryCircleStage =
  'you' | 'need' | 'go' | 'search' | 'find' | 'take' | 'return' | 'change';

export type NpcType = 'main' | 'supporting' | 'extra';

export type CharacterArc = 'positive' | 'disillusionment' | 'fall' | 'corruption' | 'flat';

export type SceneType =
  | 'action'
  | 'combat'
  | 'decision'
  | 'encounter'
  | 'exposition'
  | 'investigation'
  | 'preparation'
  | 'recap'
  | 'social-combat';

export type CustomAttributeType = 'text' | 'number' | 'option' | 'checkbox' | 'long-text' | 'date';

export interface StoryCircleEntry {
  stage: StoryCircleStage;
  description: string;
}

export interface Relationship {
  id: string;
  sourceId: string;
  targetId: string;
  type: RelationshipType;
  description: string;
}

export interface RpgTask {
  id: string;
  elementId: string;
  description: string;
  completed: boolean;
  assignedElements: string[];
}

export interface CustomAttribute {
  id: string;
  name: string;
  type: CustomAttributeType;
  options?: string[];
  appliesTo: ElementType[];
}

export interface CustomAttributeValue {
  attributeId: string;
  value: string | number | boolean | null;
}

export interface KishotenketsuEntry {
  ki: string;
  sho: string;
  ten: string;
  ketsu: string;
}

export interface ConflictEntry {
  description: string;
  stakes: string;
  resolution: string;
}

export interface RpgElement {
  id: string;
  type: ElementType;
  name: string;
  campaignId: string | null;
  parentId: string | null;
  description: string;
  sortOrder: number;
  createdAt: string;
  modifiedAt: string;
  // NPC-specific
  npcType?: NpcType;
  occupation?: string;
  characterArc?: CharacterArc;
  beliefs?: string;
  ghost?: string;
  lie?: string;
  need?: string;
  strengths?: string;
  weaknesses?: string;
  behaviour?: string;
  want?: string;
  stake?: number;
  opposition?: string;
  // Faction-specific
  philosophy?: string;
  factionStructure?: string;
  // Location-specific
  address?: string;
  // Event/Session/Scene
  date?: string;
  sessionDate?: string;
  sceneType?: SceneType;
  storyCircleStage?: StoryCircleStage;
  isExciting?: boolean;
  // Narrative tools
  storyCircle?: StoryCircleEntry[];
  kishotenketsu?: KishotenketsuEntry;
  conflict?: ConflictEntry;
  // Gallery
  images?: string[];
  // Custom attribute values
  customValues?: CustomAttributeValue[];
}

export interface RpgCampaign {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  modifiedAt: string;
  storyCircle?: StoryCircleEntry[];
}

/** Element type metadata for UI rendering. */
export interface ElementTypeMeta {
  type: ElementType;
  label: string;
  pluralLabel: string;
  icon: string;
  color: string;
  allowsChildren: boolean;
  childTypes: ElementType[];
  isGlobal: boolean;
}
