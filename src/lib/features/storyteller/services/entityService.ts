/**
 * Entity CRUD service — manages storyteller entities in localStorage.
 * Entities link to real vault notes via notePath for graph integration.
 */

import { log } from '@/utils/logger';
import type { StorytellerEntity, EntityType, EntityRelationship, CustomFieldDefinition } from '../types/entity';

const ENTITIES_KEY = 'bismuth-storyteller-entities';
const RELATIONSHIPS_KEY = 'bismuth-storyteller-relationships';
const CUSTOM_FIELDS_KEY = 'bismuth-storyteller-custom-fields';

// ─── Entity CRUD ────────────────────────────────────────────────────────────

export function loadEntities(): StorytellerEntity[] {
  try {
    const raw = localStorage.getItem(ENTITIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function persistEntities(entities: StorytellerEntity[]): void {
  try { localStorage.setItem(ENTITIES_KEY, JSON.stringify(entities)); }
  catch (e) { log.warn('Failed to persist entities', { error: String(e) }); }
}

export function createEntity(
  type: EntityType, name: string, storyId: string,
  overrides?: Partial<StorytellerEntity>,
): StorytellerEntity {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(), type, name, storyId,
    notePath: null, description: '', tags: [],
    customFields: {}, images: [], sortOrder: 0,
    createdAt: now, modifiedAt: now, ...overrides,
  };
}

export function updateEntity(entities: StorytellerEntity[], updated: StorytellerEntity): StorytellerEntity[] {
  return entities.map(e => e.id === updated.id ? { ...updated, modifiedAt: new Date().toISOString() } : e);
}

export function deleteEntity(entities: StorytellerEntity[], entityId: string): StorytellerEntity[] {
  return entities.filter(e => e.id !== entityId);
}

export function getEntitiesByStory(entities: StorytellerEntity[], storyId: string): StorytellerEntity[] {
  return entities.filter(e => e.storyId === storyId);
}

export function getEntitiesByType(entities: StorytellerEntity[], storyId: string, type: EntityType): StorytellerEntity[] {
  return entities.filter(e => e.storyId === storyId && e.type === type);
}

export function getEntityById(entities: StorytellerEntity[], id: string): StorytellerEntity | undefined {
  return entities.find(e => e.id === id);
}

// ─── Relationships ──────────────────────────────────────────────────────────

export function loadRelationships(): EntityRelationship[] {
  try {
    const raw = localStorage.getItem(RELATIONSHIPS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function persistRelationships(rels: EntityRelationship[]): void {
  try { localStorage.setItem(RELATIONSHIPS_KEY, JSON.stringify(rels)); }
  catch (e) { log.warn('Failed to persist relationships', { error: String(e) }); }
}

export function createRelationship(
  sourceId: string, targetId: string,
  kind: EntityRelationship['kind'], label: string, bidirectional = true,
): EntityRelationship {
  return { id: crypto.randomUUID(), sourceId, targetId, kind, label, bidirectional };
}

export function deleteRelationship(rels: EntityRelationship[], relId: string): EntityRelationship[] {
  return rels.filter(r => r.id !== relId);
}

export function getRelationshipsForEntity(rels: EntityRelationship[], entityId: string): EntityRelationship[] {
  return rels.filter(r => r.sourceId === entityId || (r.bidirectional && r.targetId === entityId));
}

export function deleteRelationshipsForEntity(rels: EntityRelationship[], entityId: string): EntityRelationship[] {
  return rels.filter(r => r.sourceId !== entityId && r.targetId !== entityId);
}

// ─── Custom fields ──────────────────────────────────────────────────────────

export function loadCustomFields(): CustomFieldDefinition[] {
  try {
    const raw = localStorage.getItem(CUSTOM_FIELDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function persistCustomFields(fields: CustomFieldDefinition[]): void {
  try { localStorage.setItem(CUSTOM_FIELDS_KEY, JSON.stringify(fields)); }
  catch (e) { log.warn('Failed to persist custom fields', { error: String(e) }); }
}
