import type { EventPayload } from '@/types/events';

export type UnlistenFn = () => void;

const NOOP_UNLISTEN: UnlistenFn = () => {};

export async function listenEvent<T>(
  channel: string,
  handler: (payload: EventPayload<T>) => void
): Promise<UnlistenFn> {
  try {
    const { listen } = await import('@tauri-apps/api/event');
    return await listen<EventPayload<T>>(channel, (event) => {
      handler(event.payload);
    });
  } catch {
    return NOOP_UNLISTEN;
  }
}

export async function listenOnce<T>(
  channel: string,
  handler: (payload: EventPayload<T>) => void
): Promise<UnlistenFn> {
  try {
    const { once } = await import('@tauri-apps/api/event');
    return await once<EventPayload<T>>(channel, (event) => {
      handler(event.payload);
    });
  } catch {
    return NOOP_UNLISTEN;
  }
}

export async function emitEvent<T>(channel: string, payload: T): Promise<void> {
  try {
    const { emit } = await import('@tauri-apps/api/event');
    await emit(channel, payload);
  } catch {
    return;
  }
}

async function emitToWebview<T>(label: string, channel: string, payload: T): Promise<void> {
  const { emitTo } = await import('@tauri-apps/api/event');
  return emitTo(label, channel, payload);
}
