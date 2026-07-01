import { listen } from '@tauri-apps/api/event';
import { log } from '@/utils/logger';

export type ChangelogVaultEvent = 'vault://file-created' | 'vault://file-modified' | 'vault://file-deleted';

export interface ChangelogFilePayload { path: string; }

/** Subscribe to a vault file event for changelog tracking.
 * Returns an async unsubscribe function — call on store teardown. */
export function subscribeChangelogEvent(
  eventName: ChangelogVaultEvent,
  handler: (payload: ChangelogFilePayload) => void,
): () => Promise<void> {
  let unlisten: (() => void) | null = null;

  const promise = listen<unknown>(eventName, (event) => {
    const payload = event.payload;
    if (!payload || typeof (payload as ChangelogFilePayload).path !== 'string') {
      log.warn('changelogEvents: unexpected payload, discarding', { eventName, payload });
      return;
    }
    handler(payload as ChangelogFilePayload);
  }).then((fn) => { unlisten = fn; });

  return async () => { await promise; unlisten?.(); };
}
