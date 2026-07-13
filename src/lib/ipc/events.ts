import type { Event as TauriEvent, UnlistenFn } from '@tauri-apps/api/event';
import { emit, emitTo, listen, once } from '@tauri-apps/api/event';

import type { EventPayload } from '@/types/events';

export async function listenEvent<T>(
  channel: string,
  handler: (payload: EventPayload<T>) => void
): Promise<UnlistenFn> {
  return listen<EventPayload<T>>(channel, (event: TauriEvent<EventPayload<T>>) => {
    handler(event.payload);
  });
}

export async function listenOnce<T>(
  channel: string,
  handler: (payload: EventPayload<T>) => void
): Promise<UnlistenFn> {
  return once<EventPayload<T>>(channel, (event: TauriEvent<EventPayload<T>>) => {
    handler(event.payload);
  });
}

export async function emitEvent<T>(channel: string, payload: T): Promise<void> {
  return emit(channel, payload);
}

async function emitToWebview<T>(label: string, channel: string, payload: T): Promise<void> {
  return emitTo(label, channel, payload);
}
