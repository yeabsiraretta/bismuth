/**
 * Canvas Template Service (T133)
 *
 * IPC wrappers for saving and loading canvas templates from the
 * `canvas_templates` table in the backend database.
 */

import { invoke } from '@tauri-apps/api/core';
import type { CanvasElement } from '@/types/canvas';
import { log } from '@/utils/logger';

/** A saved canvas template with metadata. */
export interface CanvasTemplate {
  id: string;
  name: string;
  description?: string;
  category?: string;
  elements: CanvasElement[];
  thumbnail?: string;
  created_at: number;
  modified_at: number;
}

/**
 * Save a set of elements as a reusable template.
 *
 * @param name - Display name for the template.
 * @param elements - Canvas elements to store in the template.
 * @param options - Optional description and category.
 * @returns The persisted template with generated ID.
 */
export async function saveTemplate(
  name: string,
  elements: CanvasElement[],
  options: { description?: string; category?: string } = {}
): Promise<CanvasTemplate> {
  log.info('Saving canvas template', { name, elementCount: elements.length });
  try {
    const template = await invoke<CanvasTemplate>('save_canvas_template', {
      name,
      elements,
      description: options.description || '',
      category: options.category || 'general',
    });
    log.info('Canvas template saved', { id: template.id, name: template.name });
    return template;
  } catch (error) {
    log.error('Failed to save canvas template', error as Error);
    throw new Error(`Failed to save template: ${error}`);
  }
}

/**
 * Load a template by ID.
 *
 * @param id - Template ID.
 * @returns The full template with elements.
 */
export async function loadTemplate(id: string): Promise<CanvasTemplate> {
  log.debug('Loading canvas template', { id });
  try {
    const template = await invoke<CanvasTemplate>('load_canvas_template', { id });
    log.info('Canvas template loaded', { id: template.id, name: template.name });
    return template;
  } catch (error) {
    log.error('Failed to load canvas template', error as Error);
    throw new Error(`Failed to load template: ${error}`);
  }
}

/**
 * List all available templates, optionally filtered by category.
 *
 * @param category - Optional category filter.
 * @returns Array of templates (may be lightweight summaries).
 */
export async function listTemplates(category?: string): Promise<CanvasTemplate[]> {
  log.debug('Listing canvas templates', { category });
  try {
    const templates = await invoke<CanvasTemplate[]>('list_canvas_templates', {
      category: category || null,
    });
    log.info('Canvas templates listed', { count: templates.length });
    return templates;
  } catch (error) {
    log.error('Failed to list canvas templates', error as Error);
    throw new Error(`Failed to list templates: ${error}`);
  }
}

/**
 * Delete a template by ID.
 *
 * @param id - Template ID to remove.
 */
export async function deleteTemplate(id: string): Promise<void> {
  log.info('Deleting canvas template', { id });
  try {
    await invoke('delete_canvas_template', { id });
    log.info('Canvas template deleted', { id });
  } catch (error) {
    log.error('Failed to delete canvas template', error as Error);
    throw new Error(`Failed to delete template: ${error}`);
  }
}
