import { isTauriAvailable } from '@/utils/platform';

export async function invokeCommand<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  if (!isTauriAvailable()) {
    throw new Error(`Tauri command "${cmd}" is unavailable in web website mode.`);
  }
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<T>(cmd, args);
}
