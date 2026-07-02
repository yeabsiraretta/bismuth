import { invoke } from '@tauri-apps/api/core';
import type { ComponentDefinition } from '@/features/canvas/types';
import { log } from '@/utils/logger';

const VALID_COMPONENT_ID = /^[a-zA-Z0-9_-]{1,128}$/;

function assertValidId(id: string): void {
  if (!VALID_COMPONENT_ID.test(id)) {
    throw new Error(`Invalid component ID format: "${id}"`);
  }
}

/**
 * Lists all component definitions in the current vault.
 */
export async function listComponents(): Promise<ComponentDefinition[]> {
  log.debug('Component service: listing components');
  try {
    const components = await invoke<ComponentDefinition[]>('list_components');
    log.debug('Component service: listed components', { count: components.length });
    return components;
  } catch (error) {
    log.error('Component service: failed to list components', error as Error);
    throw new Error(`Failed to list components: ${error}`);
  }
}

/**
 * Reads a single component definition by ID.
 */
export async function readComponent(id: string): Promise<ComponentDefinition> {
  assertValidId(id);
  log.debug('Component service: reading component', { id });
  try {
    return await invoke<ComponentDefinition>('read_component', { id });
  } catch (error) {
    log.error('Component service: failed to read component', error as Error, { id });
    throw new Error(`Failed to read component: ${error}`);
  }
}

/**
 * Saves (creates or updates) a component definition.
 */
export async function saveComponent(component: ComponentDefinition): Promise<ComponentDefinition> {
  log.debug('Component service: saving component', { id: component.id, name: component.name });
  try {
    const saved = await invoke<ComponentDefinition>('save_component', { component });
    log.info('Component service: saved component', { id: saved.id, name: saved.name });
    return saved;
  } catch (error) {
    log.error('Component service: failed to save component', error as Error, { id: component.id });
    throw new Error(`Failed to save component: ${error}`);
  }
}

/**
 * Deletes a component definition by ID.
 */
export async function deleteComponent(id: string): Promise<void> {
  assertValidId(id);
  log.debug('Component service: deleting component', { id });
  try {
    await invoke('delete_component', { id });
    log.info('Component service: deleted component', { id });
  } catch (error) {
    log.error('Component service: failed to delete component', error as Error, { id });
    throw new Error(`Failed to delete component: ${error}`);
  }
}
