/**
 * Entity store — manages Portent typed entities, relationships, and entity browsing.
 * Phase 8: US3 (Entity System & Deep Linking)
 */
import { writable, derived } from 'svelte/store';
import type { Note } from '@/types/data/vault';
import type {
  PortentType,
  LifecycleState,
  EntityRelationships,
  EntityReference,
  TypeDefinition,
} from '@/types/data/entity';
import { DEFAULT_PORTENT_TYPES, deriveLifecycle, getPortentIcon } from '@/types/data/entity';
import { log } from '@/utils/logger';
import { notes, activeNote } from '@/stores/vault/vault';
import {
  setEntityType as serviceSetEntityType,
  updateFrontmatterField,
  getCustomEntityTypes,
} from '../services/entity';

/** Custom entity type definitions (loaded from .bismuth/entity-types.json) */
export const customTypes = writable<TypeDefinition[]>([]);

/** All available types (defaults + custom) */
export const allPortentTypes = derived(customTypes, ($custom) => [
  ...DEFAULT_PORTENT_TYPES,
  ...$custom,
]);

/** Notes grouped by Portent type */
export const notesByType = derived(notes, ($notes) => {
  const grouped = new Map<string, Note[]>();

  // Initialize with default types
  DEFAULT_PORTENT_TYPES.forEach((t) => grouped.set(t.name, []));
  grouped.set('Untyped', []);

  $notes.forEach((note) => {
    const type = note.frontmatter?.['type'] as string | undefined;
    if (type && grouped.has(type)) {
      grouped.get(type)!.push(note);
    } else if (type) {
      // Custom type
      if (!grouped.has(type)) grouped.set(type, []);
      grouped.get(type)!.push(note);
    } else {
      grouped.get('Untyped')!.push(note);
    }
  });

  return grouped;
});

/** Entity groups for EntityBrowser display */
export const entityGroups = derived(notesByType, ($byType) => {
  return Array.from($byType.entries())
    .filter(([_, notes]) => notes.length > 0)
    .map(([type, typeNotes]) => ({
      type,
      icon: getPortentIcon(type),
      count: typeNotes.length,
      notes: typeNotes.map((n) => ({
        path: n.path,
        title: n.title,
        lifecycle: deriveLifecycle(n.frontmatter) as LifecycleState,
      })),
    }));
});

/** Active note's entity relationships */
export const activeEntityRelationships = derived(activeNote, ($active) => {
  if (!$active) return null;

  const fm = $active.frontmatter || {};
  const type = (fm['type'] as PortentType) || null;
  const lifecycle = deriveLifecycle(fm);

  // Resolve belongs_to and related_to from frontmatter arrays
  const belongsToRaw = Array.isArray(fm['belongs_to']) ? fm['belongs_to'] : [];
  const relatedToRaw = Array.isArray(fm['related_to']) ? fm['related_to'] : [];

  const belongsTo: EntityReference[] = belongsToRaw.map((ref: string) => ({
    path: ref,
    title: ref.replace(/\.md$/, '').split('/').pop() || ref,
  }));

  const relatedTo: EntityReference[] = relatedToRaw.map((ref: string) => ({
    path: ref,
    title: ref.replace(/\.md$/, '').split('/').pop() || ref,
  }));

  return {
    type,
    lifecycle,
    belongsTo,
    relatedTo,
    backlinks: [] as EntityReference[],
  } satisfies EntityRelationships;
});

/** Set entity type on active note */
export async function setEntityType(path: string, type: PortentType): Promise<void> {
  try {
    await serviceSetEntityType(path, type);
  } catch (error) {
    log.error('Failed to set entity type', error as Error);
    throw error;
  }
}

/** Add a belongs_to relationship */
export async function addBelongsTo(path: string, targetPath: string): Promise<void> {
  try {
    await updateFrontmatterField(path, 'belongs_to', targetPath);
  } catch (error) {
    log.error('Failed to add belongs_to', error as Error);
    throw error;
  }
}

/** Add a related_to relationship */
export async function addRelatedTo(path: string, targetPath: string): Promise<void> {
  try {
    await updateFrontmatterField(path, 'related_to', targetPath);
  } catch (error) {
    log.error('Failed to add related_to', error as Error);
    throw error;
  }
}

/** Load custom entity types from vault config */
export async function loadCustomTypes(): Promise<void> {
  try {
    const types = await getCustomEntityTypes();
    customTypes.set(types);
  } catch {
    // No custom types file or command not available yet — use defaults
    customTypes.set([]);
  }
}
