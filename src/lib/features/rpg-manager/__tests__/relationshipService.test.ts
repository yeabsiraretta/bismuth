import { describe, it, expect, beforeEach } from 'vitest';
import {
  createRelationship,
  deleteRelationship,
  deleteRelationshipsForElement,
  getRelationshipsForElement,
  getVisibleRelationships,
  getOtherElementId,
  areRelated,
  getAllRelationships,
  updateRelationship,
} from '../services/relationshipService';

beforeEach(() => {
  localStorage.clear();
});

describe('Relationship CRUD', () => {
  it('creates a relationship', () => {
    const rel = createRelationship('a', 'b', 'bidirectional', 'allies');
    expect(rel.id).toMatch(/^rpg-rel_/);
    expect(rel.sourceId).toBe('a');
    expect(rel.targetId).toBe('b');
    expect(rel.type).toBe('bidirectional');
    expect(rel.description).toBe('allies');
  });

  it('updates a relationship', () => {
    const rel = createRelationship('a', 'b');
    const updated = updateRelationship(rel.id, { description: 'rivals' });
    expect(updated?.description).toBe('rivals');
  });

  it('deletes a relationship', () => {
    const rel = createRelationship('a', 'b');
    deleteRelationship(rel.id);
    expect(getAllRelationships()).toHaveLength(0);
  });

  it('deletes all relationships for an element', () => {
    createRelationship('a', 'b');
    createRelationship('a', 'c');
    createRelationship('d', 'e');
    deleteRelationshipsForElement('a');
    expect(getAllRelationships()).toHaveLength(1);
  });
});

describe('Relationship queries', () => {
  it('gets relationships for an element', () => {
    createRelationship('a', 'b');
    createRelationship('c', 'a');
    createRelationship('d', 'e');
    expect(getRelationshipsForElement('a')).toHaveLength(2);
  });

  it('bidirectional visible from both sides', () => {
    createRelationship('a', 'b', 'bidirectional');
    expect(getVisibleRelationships('a')).toHaveLength(1);
    expect(getVisibleRelationships('b')).toHaveLength(1);
  });

  it('unidirectional visible only from source', () => {
    createRelationship('a', 'b', 'unidirectional');
    expect(getVisibleRelationships('a')).toHaveLength(1);
    expect(getVisibleRelationships('b')).toHaveLength(0);
  });

  it('parent/child visible from both sides', () => {
    createRelationship('a', 'b', 'parent');
    expect(getVisibleRelationships('a')).toHaveLength(1);
    expect(getVisibleRelationships('b')).toHaveLength(1);
  });

  it('getOtherElementId returns the other side', () => {
    const rel = createRelationship('x', 'y');
    expect(getOtherElementId(rel, 'x')).toBe('y');
    expect(getOtherElementId(rel, 'y')).toBe('x');
  });

  it('areRelated checks both directions', () => {
    createRelationship('a', 'b');
    expect(areRelated('a', 'b')).toBe(true);
    expect(areRelated('b', 'a')).toBe(true);
    expect(areRelated('a', 'c')).toBe(false);
  });
});
