import { invoke } from '@tauri-apps/api/core';
import type { CanvasDocument } from '@/types/canvas';
import { log } from '@/utils/logger';

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

export async function loadCanvas(id: string): Promise<CanvasDocument> {
  log.debug('Canvas service: loading canvas', { id });
  try {
    const canvas = await invoke<CanvasDocument>('load_canvas', { id });
    log.info('Canvas service: canvas loaded successfully', { 
      id: canvas.id, 
      name: canvas.name,
      elementCount: canvas.elements.length 
    });
    return canvas;
  } catch (error) {
    log.error('Canvas service: failed to load canvas', error as Error, { id });
    throw new Error(`Failed to load canvas: ${error}`);
  }
}

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
