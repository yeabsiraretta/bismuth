import { listen } from '@tauri-apps/api/event';
import { log } from '@/utils/logger';
import type { ConceptSuggestion } from '@/features/graph';

/** Subscribe to backend concept suggestion events for a note path.
 * Returns an unsubscribe function that must be called on component destroy.
 * Payload is validated before the handler is invoked. */
export function subscribeConceptSuggestions(
  handler: (suggestions: ConceptSuggestion[]) => void
): () => Promise<void> {
  let unlisten: (() => void) | null = null;

  const promise = listen('editor://concept-suggestions', (event) => {
    const payload = event.payload;
    if (!Array.isArray(payload)) {
      log.warn('conceptEvents: unexpected payload shape, discarding', { payload });
      return;
    }
    handler(payload as ConceptSuggestion[]);
  }).then((fn) => {
    unlisten = fn;
  });

  return async () => {
    await promise;
    unlisten?.();
  };
}
