import { invoke } from '@tauri-apps/api/core';
import type { CanvasDocument } from '@/features/canvas/types';
import { log } from '@/utils/logger';

/**
 * Creates a new canvas document in the backend database.
 * @param name - Display name for the canvas.
 * @returns The newly created canvas with generated ID and timestamps.
 */
export async function createCanvas(name: string): Promise<CanvasDocument> {
  log.info('Canvas service: creating canvas', { name });
  try {
    const canvas = await invoke<CanvasDocument>('create_canvas', { name });
    log.info('Canvas service: canvas created successfully', { id: canvas.id, name: canvas.name });
    return canvas;
  } catch (error) {
    log.error('Canvas service: failed to create canvas', error as Error, { name });
    throw new Error(`Failed to create canvas: ${error}`);
  }
}

/**
 * Persists the full canvas document state (elements, layers, pages) to the database.
 * @param canvas - The complete canvas document to save.
 */
export async function saveCanvas(canvas: CanvasDocument): Promise<void> {
  log.debug('Canvas service: saving canvas', { id: canvas.id, name: canvas.name });
  try {
    await invoke('save_canvas', { canvas });
    log.info('Canvas service: canvas saved successfully', { id: canvas.id });
  } catch (error) {
    log.error('Canvas service: failed to save canvas', error as Error, { id: canvas.id });
    throw new Error(`Failed to save canvas: ${error}`);
  }
}

/**
 * Loads a canvas document by ID from the backend database.
 * @param id - Unique canvas document identifier.
 * @returns The full canvas document with all elements and metadata.
 */
export async function loadCanvas(id: string): Promise<CanvasDocument> {
  log.debug('Canvas service: loading canvas', { id });
  try {
    const canvas = await invoke<CanvasDocument>('load_canvas', { id });
    log.info('Canvas service: canvas loaded successfully', {
      id: canvas.id,
      name: canvas.name,
      elementCount: canvas.elements.length,
    });
    return canvas;
  } catch (error) {
    log.error('Canvas service: failed to load canvas', error as Error, { id });
    throw new Error(`Failed to load canvas: ${error}`);
  }
}

/**
 * Retrieves all canvas documents in the current vault.
 * @returns Array of canvas documents (lightweight — may omit full element data).
 */
export async function listCanvases(): Promise<CanvasDocument[]> {
  log.debug('Canvas service: listing canvases');
  try {
    const canvases = await invoke<CanvasDocument[]>('list_canvases');
    log.info('Canvas service: canvases listed successfully', { count: canvases.length });
    return canvases;
  } catch (error) {
    log.error('Canvas service: failed to list canvases', error as Error);
    throw new Error(`Failed to list canvases: ${error}`);
  }
}

/**
 * Permanently deletes a canvas and all its elements from the database.
 * @param id - Canvas document ID to delete.
 */
export async function deleteCanvas(id: string): Promise<void> {
  log.info('Canvas service: deleting canvas', { id });
  try {
    await invoke('delete_canvas', { id });
    log.info('Canvas service: canvas deleted successfully', { id });
  } catch (error) {
    log.error('Canvas service: failed to delete canvas', error as Error, { id });
    throw new Error(`Failed to delete canvas: ${error}`);
  }
}

/**
 * Links a canvas to a specific note by setting the note_id field.
 * @param canvasId - Canvas document ID.
 * @param notePath - Note file path to link (or null to unlink).
 */
export async function linkCanvasToNote(canvasId: string, notePath: string | null): Promise<void> {
  log.info('Canvas service: linking canvas to note', { canvasId, notePath });
  try {
    await invoke('link_canvas_to_note', { canvasId, notePath });
    log.info('Canvas service: canvas linked to note', { canvasId, notePath });
  } catch (error) {
    log.error('Canvas service: failed to link canvas to note', error as Error, {
      canvasId,
      notePath,
    });
    throw new Error(`Failed to link canvas to note: ${error}`);
  }
}

/**
 * Retrieves all canvases linked to a specific note.
 * @param notePath - Note file path to search for linked canvases.
 * @returns Array of canvas documents linked to the note.
 */
export async function getCanvasesForNote(notePath: string): Promise<CanvasDocument[]> {
  log.debug('Canvas service: getting canvases for note', { notePath });
  try {
    const canvases = await invoke<CanvasDocument[]>('get_canvases_for_note', { notePath });
    log.info('Canvas service: found canvases for note', { notePath, count: canvases.length });
    return canvases;
  } catch (error) {
    log.error('Canvas service: failed to get canvases for note', error as Error, { notePath });
    throw new Error(`Failed to get canvases for note: ${error}`);
  }
}
