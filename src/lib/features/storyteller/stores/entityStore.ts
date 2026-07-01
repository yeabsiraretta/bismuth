/**
 * Entity store — reactive entity and relationship state.
 */

import { writable, derived, get } from 'svelte/store';
import type { StorytellerEntity, EntityType, EntityRelationship, CustomFieldDefinition } from '../types/entity';
import * as svc from '../services/entityService';
import { activeStoryId } from './storyStore';

export const allEntities = writable<StorytellerEntity[]>(svc.loadEntities());
export const allRelationships = writable<EntityRelationship[]>(svc.loadRelationships());
export const customFields = writable<CustomFieldDefinition[]>(svc.loadCustomFields());
export const activeEntityId = writable<string | null>(null);
export const entityTypeFilter = writable<EntityType | null>(null);

export const storyEntities = derived([allEntities, activeStoryId], ([$all, $storyId]) =>
  $storyId ? svc.getEntitiesByStory($all, $storyId) : [],
);

export const filteredEntities = derived([storyEntities, entityTypeFilter], ([$entities, $filter]) =>
  $filter ? $entities.filter(e => e.type === $filter) : $entities,
);

export const activeEntity = derived([allEntities, activeEntityId], ([$all, $id]) =>
  $id ? svc.getEntityById($all, $id) ?? null : null,
);

export const activeEntityRelationships = derived([allRelationships, activeEntityId], ([$rels, $id]) =>
  $id ? svc.getRelationshipsForEntity($rels, $id) : [],
);

export const entityCountsByType = derived(storyEntities, ($entities) => {
  const counts: Record<string, number> = {};
  for (const e of $entities) counts[e.type] = (counts[e.type] ?? 0) + 1;
  return counts;
});

// ─── Actions ────────────────────────────────────────────────────────────────

export function addEntity(type: EntityType, name: string, overrides?: Partial<StorytellerEntity>): StorytellerEntity {
  const storyId = get(activeStoryId);
  if (!storyId) throw new Error('No active story');
  const entity = svc.createEntity(type, name, storyId, overrides);
  allEntities.update(list => {
    const next = [...list, entity];
    svc.persistEntities(next);
    return next;
  });
  return entity;
}

export function editEntity(updated: StorytellerEntity): void {
  allEntities.update(list => {
    const next = svc.updateEntity(list, updated);
    svc.persistEntities(next);
    return next;
  });
}

export function removeEntity(entityId: string): void {
  allEntities.update(list => {
    const next = svc.deleteEntity(list, entityId);
    svc.persistEntities(next);
    return next;
  });
  allRelationships.update(rels => {
    const next = svc.deleteRelationshipsForEntity(rels, entityId);
    svc.persistRelationships(next);
    return next;
  });
  activeEntityId.update(id => id === entityId ? null : id);
}

export function selectEntity(entityId: string | null): void {
  activeEntityId.set(entityId);
}

export function addRelationship(
  sourceId: string, targetId: string,
  kind: EntityRelationship['kind'], label: string, bidirectional = true,
): EntityRelationship {
  const rel = svc.createRelationship(sourceId, targetId, kind, label, bidirectional);
  allRelationships.update(list => {
    const next = [...list, rel];
    svc.persistRelationships(next);
    return next;
  });
  return rel;
}

export function removeRelationship(relId: string): void {
  allRelationships.update(list => {
    const next = svc.deleteRelationship(list, relId);
    svc.persistRelationships(next);
    return next;
  });
}

export function setTypeFilter(type: EntityType | null): void {
  entityTypeFilter.set(type);
}

export function saveCustomField(field: CustomFieldDefinition): void {
  customFields.update(list => {
    const idx = list.findIndex(f => f.id === field.id);
    const next = idx >= 0 ? list.map((f, i) => i === idx ? field : f) : [...list, field];
    svc.persistCustomFields(next);
    return next;
  });
}
