import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

import {
  getEntityTypes,
  getTypeDefinition,
  getEntityRelationships,
  setEntityType,
  setLifecycleState,
} from '../services/entity';
import { invoke } from '@tauri-apps/api/core';

describe('entity service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getEntityTypes', () => {
    it('calls invoke with correct command', async () => {
      vi.mocked(invoke).mockResolvedValue([]);
      const result = await getEntityTypes();
      expect(invoke).toHaveBeenCalledWith('get_entity_types');
      expect(result).toEqual([]);
    });
  });

  describe('getTypeDefinition', () => {
    it('calls invoke with typeName parameter', async () => {
      const typeDef = { name: 'Person', fields: [] };
      vi.mocked(invoke).mockResolvedValue(typeDef);
      const result = await getTypeDefinition('Person');
      expect(invoke).toHaveBeenCalledWith('get_type_definition', { typeName: 'Person' });
      expect(result).toEqual(typeDef);
    });
  });

  describe('getEntityRelationships', () => {
    it('calls invoke with notePath', async () => {
      vi.mocked(invoke).mockResolvedValue({ incoming: [], outgoing: [] });
      const result = await getEntityRelationships('/vault/person.md');
      expect(invoke).toHaveBeenCalledWith('get_entity_relationships', {
        notePath: '/vault/person.md',
      });
      expect(result).toEqual({ incoming: [], outgoing: [] });
    });
  });

  describe('setEntityType', () => {
    it('calls invoke to update frontmatter', async () => {
      vi.mocked(invoke).mockResolvedValue(undefined);
      await setEntityType('/vault/note.md', 'Project');
      expect(invoke).toHaveBeenCalledWith('update_frontmatter_field', {
        path: '/vault/note.md',
        key: 'type',
        value: 'Project',
      });
    });
  });

  describe('setLifecycleState', () => {
    it('calls invoke with path and state', async () => {
      vi.mocked(invoke).mockResolvedValue(undefined);
      await setLifecycleState('/vault/note.md', 'archived');
      expect(invoke).toHaveBeenCalledWith('set_lifecycle_state', {
        path: '/vault/note.md',
        state: 'archived',
      });
    });

    it('handles all lifecycle states', async () => {
      vi.mocked(invoke).mockResolvedValue(undefined);
      await setLifecycleState('/p', 'captured');
      await setLifecycleState('/p', 'organized');
      await setLifecycleState('/p', 'archived');
      expect(invoke).toHaveBeenCalledTimes(3);
    });
  });
});
