import { invoke } from '@tauri-apps/api/core';
import { log } from '@/utils/logger';

export interface KeychainResult {
  found: boolean;
  value: string | null;
  available: boolean;
  error?: string;
}

/**
 * Stores a secret in the OS keychain.
 * Throws if the keychain is unavailable — NO plaintext fallback.
 */
export async function setSecret(key: string, value: string): Promise<void> {
  await invoke('set_secret', { key, value });
  log.info('Secret stored in keychain', { key });
}

/**
 * Reads a secret from the OS keychain.
 * Returns { found: false } when no value is stored.
 * Returns { available: false } when the keychain itself is unavailable.
 * Secrets NEVER reach any store — consume result immediately in UI.
 */
export async function getSecret(key: string): Promise<KeychainResult> {
  try {
    const value = await invoke<string | null>('get_secret', { key });
    return { found: value !== null, value, available: true };
  } catch (error) {
    const msg = String(error);
    log.warn('Keychain get failed', { key, error: msg });
    return { found: false, value: null, available: false, error: msg };
  }
}

/**
 * Deletes a secret from the OS keychain.
 */
export async function deleteSecret(key: string): Promise<void> {
  await invoke('delete_secret', { key });
  log.info('Secret deleted from keychain', { key });
}
