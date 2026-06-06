/**
 * Entity service — IPC wrappers for entity/relationship operations.
 */
import { invoke } from '@tauri-apps/api/core';
import type { TypeDefinition, EntityRelationships } from '@/types/entity';

/** Get all registered entity type definitions (default + custom) */
export async function getEntityTypes(): Promise<TypeDefinition[]> {
	return invoke<TypeDefinition[]>('get_entity_types');
}

/** Get a single type definition by name */
export async function getTypeDefinition(typeName: string): Promise<TypeDefinition> {
	return invoke<TypeDefinition>('get_type_definition', { typeName });
}

/** Get resolved entity relationships for a note */
export async function getEntityRelationships(notePath: string): Promise<EntityRelationships> {
	return invoke<EntityRelationships>('get_entity_relationships', { notePath });
}

/** Set entity type on a note's frontmatter */
export async function setEntityType(path: string, type: string): Promise<void> {
	return invoke<void>('update_frontmatter_field', { path, key: 'type', value: type });
}

/** Set lifecycle state on a note atomically via a single backend command */
export async function setLifecycleState(
	path: string,
	state: 'captured' | 'organized' | 'archived'
): Promise<void> {
	await invoke<void>('set_lifecycle_state', { path, state });
}
