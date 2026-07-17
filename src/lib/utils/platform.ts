/**
 * Platform detection utilities.
 */

export type RuntimeMode = 'desktop' | 'web';

interface RuntimeEnvLike {
  VITE_RUNTIME_MODE?: string;
}

interface RuntimeWindowLike {
  __TAURI_INTERNALS__?: unknown;
  __TAURI__?: unknown;
}

function hasTauriInternals(): boolean {
  if (typeof window === 'undefined') return false;
  const runtimeWindow: RuntimeWindowLike = window;
  return '__TAURI_INTERNALS__' in runtimeWindow || '__TAURI__' in runtimeWindow;
}

export function resolveRuntimeMode(env: RuntimeEnvLike, tauriAvailable: boolean): RuntimeMode {
  const configured = env.VITE_RUNTIME_MODE?.trim().toLowerCase();
  if (configured === 'web') return 'web';
  if (configured === 'desktop' && tauriAvailable) return 'desktop';
  return tauriAvailable ? 'desktop' : 'web';
}

export function getRuntimeMode(env: RuntimeEnvLike = import.meta.env): RuntimeMode {
  return resolveRuntimeMode(env, hasTauriInternals());
}

/**
 * Returns true when running inside a Tauri webview (i.e. the native shell).
 * Returns false in web website mode and plain browser runtime.
 */
export function isTauriAvailable(): boolean {
  return getRuntimeMode() === 'desktop';
}

export function isWebsiteMode(): boolean {
  return getRuntimeMode() === 'web';
}
