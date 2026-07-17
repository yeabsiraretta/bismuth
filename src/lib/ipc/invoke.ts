import { createLoggedRuntimeError } from '@/utils/log/runtime-errors';
import { isTauriAvailable } from '@/utils/platform';

export async function invokeCommand<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  if (!isTauriAvailable()) {
    throw createLoggedRuntimeError({
      source: 'ipc:invoke',
      message: `Tauri command "${cmd}" is unavailable in web website mode.`,
      details: `cmd=${cmd}`,
    });
  }

  const { invoke } = await import('@tauri-apps/api/core');
  try {
    return await invoke<T>(cmd, args);
  } catch (error) {
    const detailParts = [`cmd=${cmd}`];
    if (args) {
      detailParts.push(`args=${JSON.stringify(args)}`);
    }
    if (error instanceof Error) {
      detailParts.push(error.stack ?? error.message);
    } else {
      detailParts.push(String(error));
    }

    throw createLoggedRuntimeError({
      source: 'ipc:invoke',
      message: `Tauri command "${cmd}" failed.`,
      details: detailParts.join('\n'),
    });
  }
}
