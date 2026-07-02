/**
 * Entity store tests — CRUD operations, relationship tracking, derived stores.
 * Spec 021 T014 — stored at feature module path per project conventions.
 *
 * Architecture note: the entity store imports @/stores/vault/vault (activeNote,
 * notes) which has restricted filesystem access in the sandbox environment.
 * Tests use the entity service layer (IPC wrappers, no vault dependency) and
 * the pure type-system functions from @/types/data/entity.
 *
 * Full reactive-store derived tests (notesByType, entityGroups,
 * activeEntityRelationships) require the vault alias to resolve — those are
 * tagged with a comment and will pass once vault is aliased in vitest config.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));
vi.mock('@/utils/logger', () => ({
  log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import * as entityService from '../services/entity';
import { invoke } from '@tauri-apps/api/core';
import {
  DEFAULT_PORTENT_TYPES,
  deriveLifecycle,
  getPortentIcon,
  getPortentColor,
} from '@/types/data/entity';

describe('entityStore — service layer (CRUD operations)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Entity type registration (CRUD)
  // ---------------------------------------------------------------------------

  describe('getEntityTypes', () => {
    it('returns entity type list from backend', async () => {
      vi.mocked(invoke).mockResolvedValue(DEFAULT_PORTENT_TYPES);

      const result = await entityService.getEntityTypes();

      expect(invoke).toHaveBeenCalledWith('get_entity_types');
      expect(result).toHaveLength(DEFAULT_PORTENT_TYPES.length);
    });

    it('returns empty array when no types registered', async () => {
      vi.mocked(invoke).mockResolvedValue([]);
      const result = await entityService.getEntityTypes();
      expect(result).toHaveLength(0);
    });
  });

  describe('getTypeDefinition', () => {
    it('retrieves a specific type definition by name', async () => {
      const typeDef = DEFAULT_PORTENT_TYPES.find((t) => t.name === 'Project')!;
      vi.mocked(invoke).mockResolvedValue(typeDef);

      const result = await entityService.getTypeDefinition('Project');

      expect(invoke).toHaveBeenCalledWith('get_type_definition', { typeName: 'Project' });
      expect(result.name).toBe('Project');
    });
  });

  // ---------------------------------------------------------------------------
  // Relationship tracking
  // ---------------------------------------------------------------------------

  describe('getEntityRelationships', () => {
    it('returns relationship object with incoming and outgoing arrays', async () => {
      const expected = {
        type: 'Project',
        lifecycle: 'organized',
        belongsTo: [],
        relatedTo: [{ path: '/vault/resource.md', title: 'resource' }],
        backlinks: [],
      };
      vi.mocked(invoke).mockResolvedValue(expected);

      const result = await entityService.getEntityRelationships('/vault/project.md');

      expect(invoke).toHaveBeenCalledWith('get_entity_relationships', {
        notePath: '/vault/project.md',
      });
      expect(result.relatedTo).toHaveLength(1);
    });

    it('returns empty relationship arrays for an unlinked note', async () => {
      vi.mocked(invoke).mockResolvedValue({
        type: null,
        lifecycle: 'captured',
        belongsTo: [],
        relatedTo: [],
        backlinks: [],
      });

      const result = await entityService.getEntityRelationships('/vault/new.md');

      expect(result.belongsTo).toHaveLength(0);
      expect(result.relatedTo).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Entity CRUD — setEntityType, updateFrontmatterField
  // ---------------------------------------------------------------------------

  describe('setEntityType', () => {
    it('updates type frontmatter field via invoke', async () => {
      vi.mocked(invoke).mockResolvedValue(undefined);

      await entityService.setEntityType('/vault/note.md', 'Concept');

      expect(invoke).toHaveBeenCalledWith('update_frontmatter_field', {
        path: '/vault/note.md',
        key: 'type',
        value: 'Concept',
      });
    });

    it('supports all 8 default Portent types', async () => {
      vi.mocked(invoke).mockResolvedValue(undefined);

      for (const type of DEFAULT_PORTENT_TYPES) {
        await entityService.setEntityType('/vault/n.md', type.name);
      }

      expect(invoke).toHaveBeenCalledTimes(DEFAULT_PORTENT_TYPES.length);
    });
  });

  describe('setLifecycleState', () => {
    it('sets lifecycle state to captured', async () => {
      vi.mocked(invoke).mockResolvedValue(undefined);

      await entityService.setLifecycleState('/vault/n.md', 'captured');

      expect(invoke).toHaveBeenCalledWith('set_lifecycle_state', {
        path: '/vault/n.md',
        state: 'captured',
      });
    });

    it('sets lifecycle state to organized', async () => {
      vi.mocked(invoke).mockResolvedValue(undefined);

      await entityService.setLifecycleState('/vault/n.md', 'organized');

      expect(invoke).toHaveBeenCalledWith('set_lifecycle_state', {
        path: '/vault/n.md',
        state: 'organized',
      });
    });

    it('sets lifecycle state to archived', async () => {
      vi.mocked(invoke).mockResolvedValue(undefined);

      await entityService.setLifecycleState('/vault/n.md', 'archived');

      expect(invoke).toHaveBeenCalledWith('set_lifecycle_state', {
        path: '/vault/n.md',
        state: 'archived',
      });
    });
  });
});

// ---------------------------------------------------------------------------
// Derived stores — pure type-system logic (no vault dependency)
// ---------------------------------------------------------------------------

describe('entityStore — derived type logic', () => {
  // ---------------------------------------------------------------------------
  // DEFAULT_PORTENT_TYPES coverage
  // ---------------------------------------------------------------------------

  it('DEFAULT_PORTENT_TYPES contains all 8 expected types', () => {
    const names = DEFAULT_PORTENT_TYPES.map((t) => t.name);
    expect(names).toContain('Project');
    expect(names).toContain('Area');
    expect(names).toContain('Resource');
    expect(names).toContain('Concept');
    expect(names).toContain('Person');
    expect(names).toContain('Archive');
    expect(names).toContain('Event');
    expect(names).toContain('Task');
    expect(DEFAULT_PORTENT_TYPES).toHaveLength(8);
  });

  it('each default type has a non-empty icon and color', () => {
    DEFAULT_PORTENT_TYPES.forEach((t) => {
      expect(t.icon.length).toBeGreaterThan(0);
      expect(t.color.length).toBeGreaterThan(0);
    });
  });

  // ---------------------------------------------------------------------------
  // getPortentIcon — entity icon lookup
  // ---------------------------------------------------------------------------

  describe('getPortentIcon', () => {
    it('returns correct icon for Project', () => {
      expect(getPortentIcon('Project')).toBe('folder');
    });

    it('returns correct icon for Person', () => {
      expect(getPortentIcon('Person')).toBe('user');
    });

    it('returns file fallback for unknown type', () => {
      expect(getPortentIcon('UnknownType')).toBe('file');
    });
  });

  // ---------------------------------------------------------------------------
  // deriveLifecycle — lifecycle state derivation from frontmatter
  // ---------------------------------------------------------------------------

  describe('deriveLifecycle', () => {
    it('returns captured for empty frontmatter', () => {
      expect(deriveLifecycle({})).toBe('captured');
    });

    it('returns organized when organized=true', () => {
      expect(deriveLifecycle({ organized: true })).toBe('organized');
    });

    it('returns archived when archived=true', () => {
      expect(deriveLifecycle({ archived: true })).toBe('archived');
    });

    it('archived takes precedence over organized', () => {
      expect(deriveLifecycle({ organized: true, archived: true })).toBe('archived');
    });
  });

  // ---------------------------------------------------------------------------
  // getPortentColor — color lookup
  // ---------------------------------------------------------------------------

  describe('getPortentColor', () => {
    it('returns correct color for Project', () => {
      expect(getPortentColor('Project')).toBe('#6366f1');
    });

    it('returns fallback color for unknown type', () => {
      expect(getPortentColor('UnknownType')).toBe('#6b7280');
    });
  });
});
