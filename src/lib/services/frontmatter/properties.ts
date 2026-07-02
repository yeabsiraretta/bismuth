import { ipcCall } from '@/utils/ipc';
import { log } from '@/utils/logger';

/**
 * Fetches all property keys used across vault notes.
 * Returns the keys of the property map.
 */
export async function getAllProperties(): Promise<string[]> {
  try {
    const map = await ipcCall<Record<string, string[]>>('get_all_properties');
    return Object.keys(map);
  } catch (error) {
    log.error('Failed to get properties', error as Error);
    return [];
  }
}

/**
 * Fetches known values for a specific property key.
 */
export async function getPropertyValues(key: string): Promise<string[]> {
  if (!key.trim()) return [];
  try {
    return await ipcCall<string[]>('get_property_values', { property: key });
  } catch (error) {
    log.error('Failed to get property values', error as Error);
    return [];
  }
}
