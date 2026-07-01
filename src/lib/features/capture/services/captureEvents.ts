import { listen } from '@tauri-apps/api/event';
import { log } from '@/utils/logger';

export type VaultFileEvent = 'vault://file-created' | 'vault://file-modified' | 'vault://file-deleted';

export interface VaultFilePayload { path: string; }

/** Subscribe to a vault file event. Validates payload before calling handler.
 * Returns an async unsubscribe function — call on component/store teardown. */
export function subscribeVaultEvent(
  eventName: VaultFileEvent,
  handler: (payload: VaultFilePayload) => void,
): () => Promise<void> {
  let unlisten: (() => void) | null = null;

  const promise = listen<unknown>(eventName, (event) => {
    const payload = event.payload;
    if (!payload || typeof (payload as VaultFilePayload).path !== 'string') {
      log.warn('captureEvents: unexpected payload, discarding', { eventName, payload });
      return;
    }
    handler(payload as VaultFilePayload);
  }).then((fn) => { unlisten = fn; });

  return async () => { await promise; unlisten?.(); };
}
