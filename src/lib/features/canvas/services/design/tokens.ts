import { invoke } from '@tauri-apps/api/core';
import type { TokenCollection } from '@/features/canvas/types/design';

/**
 * Loads all token collections from the vault.
 */
export async function loadTokenCollections(): Promise<TokenCollection[]> {
  return invoke<TokenCollection[]>('list_token_collections');
}

/**
 * Saves a token collection to persistent storage.
 * SC-01: Backend validates path within .bismuth/tokens/
 */
export async function saveTokenCollection(collection: TokenCollection): Promise<void> {
  return invoke('save_token_collection', { collection });
}

/**
 * Deletes a token collection by ID.
 */
export async function deleteTokenCollection(collectionId: string): Promise<void> {
  return invoke('delete_token_collection', { collectionId });
}

/**
 * Exports all tokens for a mode as CSS custom properties.
 * SC-04: Output path validated as within vault boundary by backend.
 */
export async function exportTokensCSS(modeId: string, outputPath: string): Promise<string> {
  return invoke<string>('export_tokens_css', { modeId, outputPath });
}

/**
 * Exports all tokens for a mode as JSON.
 */
export async function exportTokensJSON(modeId: string): Promise<string> {
  return invoke<string>('export_tokens_json', { modeId });
}
