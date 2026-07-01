import { invoke } from '@tauri-apps/api/core';
import { log } from '@/utils/logger';

export interface IpcOptions {
	label?: string;
}

/** Type-safe IPC wrapper that records timing and errors as interaction events. */
export async function ipcCall<T>(
	command: string,
	params?: Record<string, unknown>,
	options?: IpcOptions,
): Promise<T> {
	const label = options?.label ?? command;
	const start = performance.now();

	try {
		const result = await invoke<T>(command, params);
		const durationMs = Math.round(performance.now() - start);
		log.interaction('ipc', label, { durationMs });
		return result;
	} catch (error) {
		const durationMs = Math.round(performance.now() - start);
		const message = error instanceof Error ? error.message : String(error);
		log.error(`IPC failed: ${label}`, error, params);
		log.interaction('ipc', label, { durationMs, error: message });
		throw new Error(`Failed to ${label}: ${error}`);
	}
}
