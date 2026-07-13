/**
 * Platform detection utilities.
 */

/**
 * Returns true when running inside a Tauri webview (i.e. the native shell).
 * Returns false in plain browser / `vite dev` without Tauri.
 */
export function isTauriAvailable(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}
