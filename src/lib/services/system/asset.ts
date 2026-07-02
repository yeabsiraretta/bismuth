/**
 * Asset service — wraps @tauri-apps/api/core asset utilities.
 * Components MUST NOT import @tauri-apps/api/core directly for asset conversion.
 */
import { convertFileSrc as tauriConvertFileSrc } from '@tauri-apps/api/core';

/**
 * Converts a filesystem path to a URL that can be loaded in a WebView img/video/audio tag.
 * Use for displaying local files (images, media) from the vault.
 */
export function toAssetUrl(filePath: string, protocol = 'asset'): string {
  return tauriConvertFileSrc(filePath, protocol);
}
