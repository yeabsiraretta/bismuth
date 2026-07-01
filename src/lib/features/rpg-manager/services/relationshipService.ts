/**
 * Relationship service — manages connections between RPG elements.
 * Supports bidirectional, unidirectional, parent, and child relationships.
 */

import type { Relationship, RelationshipType } from '../types';
import { generatePrefixedId } from '@/utils/id';
import { log } from '@/utils/logger';

const STORAGE_KEY = 'bismuth-rpg-relationships';

function loadRelationships(): Relationship[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRelationships(rels: Relationship[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rels));
  } catch {
    log.warn('Failed to persist RPG relationships');
  }
}

/** Create a new relationship between two elements. */
export function createRelationship(
  sourceId: string,
  targetId: string,
  type: RelationshipType = 'bidirectional',
  description: string = ''
): Relationship {
  const rel: Relationship = {
    id: generatePrefixedId('rpg-rel'),
    sourceId,
    targetId,
    type,
    description,
  };
  const all = loadRelationships();
  all.push(rel);
  saveRelationships(all);
  log.info('RPG relationship created', { id: rel.id, source: sourceId, target: targetId, type });
  return rel;
}

/** Update an existing relationship. */
export function updateRelationship(
  id: string,
  partial: Partial<Relationship>
): Relationship | null {
  const all = loadRelationships();
  const idx = all.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...partial };
  saveRelationships(all);
  return all[idx];
}

/** Delete a relationship by ID. */
export function deleteRelationship(id: string): void {
  const all = loadRelationships().filter((r) => r.id !== id);
  saveRelationships(all);
}

/** Delete all relationships involving an element (for cascade delete). */
export function deleteRelationshipsForElement(elementId: string): void {
  const all = loadRelationships().filter(
    (r) => r.sourceId !== elementId && r.targetId !== elementId
  );
  saveRelationships(all);
}

/** Get all relationships where the element is source or target. */
export function getRelationshipsForElement(elementId: string): Relationship[] {
  return loadRelationships().filter((r) => r.sourceId === elementId || r.targetId === elementId);
}

/**
 * Get visible relationships for an element.
 * Bidirectional: visible from both sides.
 * Unidirectional: visible only from source.
 * Parent/Child: visible from both sides.
 */
export function getVisibleRelationships(elementId: string): Relationship[] {
  return loadRelationships().filter((r) => {
    if (r.sourceId === elementId) return true;
    if (r.targetId === elementId) {
      return r.type === 'bidirectional' || r.type === 'parent' || r.type === 'child';
    }
    return false;
  });
}

/** Get the other element ID in a relationship. */
export function getOtherElementId(rel: Relationship, thisElementId: string): string {
  return rel.sourceId === thisElementId ? rel.targetId : rel.sourceId;
}

/** Check if two elements are already related. */
export function areRelated(idA: string, idB: string): boolean {
  return loadRelationships().some(
    (r) => (r.sourceId === idA && r.targetId === idB) || (r.sourceId === idB && r.targetId === idA)
  );
}

/** Get all relationships. */
export function getAllRelationships(): Relationship[] {
  return loadRelationships();
}
