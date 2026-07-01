import { invoke } from '@tauri-apps/api/core';
import { log } from '@/utils/logger';
import type { ThemeManifest } from '@/utils/settings/themeValidator';

/**
 * Lists all theme manifests from `.bismuth/themes/`.
 * Returns an empty array if no themes directory exists.
 */
export async function listLocalThemes(vaultRoot: string): Promise<ThemeManifest[]> {
  try {
    return await invoke<ThemeManifest[]>('list_local_themes', { vaultRoot });
  } catch (error) {
    log.error('Failed to list local themes', error as Error);
    return [];
  }
}

/**
 * Imports a theme folder into the vault's `.bismuth/themes/` directory.
 * Validates path confinement and manifest schema server-side.
 */
export async function importThemeFolder(sourcePath: string, vaultRoot: string): Promise<ThemeManifest> {
  try {
    const manifest = await invoke<ThemeManifest>('import_theme_folder', { sourcePath, vaultRoot });
    log.info('Theme imported', { name: manifest.name });
    return manifest;
  } catch (error) {
    log.error('Failed to import theme', error as Error);
    throw error;
  }
}
