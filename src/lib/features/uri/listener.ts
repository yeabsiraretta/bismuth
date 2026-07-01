/**
 * URI deep-link listener — listens for bismuth:// URIs from the OS
 * and dispatches them to the handler system.
 *
 * Two ingestion paths:
 * 1. Tauri deep-link plugin event (native OS URI handler)
 * 2. Window custom event (for in-app URI triggering / testing)
 */

import { parseAdvancedUri } from './parser';
import { dispatchUri } from './handlers';
import { log } from '@/utils/logger';
import type { UriActionResult } from './types';

let unlisten: (() => void) | null = null;

/**
 * Starts listening for incoming bismuth:// URIs.
 * Call once during app initialization (appBootstrap).
 */
export async function startUriListener(): Promise<void> {
  if (unlisten) return; // already listening

  // Path 1: Tauri deep-link events
  try {
    const { listen } = await import('@tauri-apps/api/event');
    const unsub = await listen<string>('deep-link-received', (event) => {
      handleIncomingUri(event.payload);
    });
    unlisten = unsub;
    log.info('URI listener: Tauri deep-link listener registered');
  } catch {
    log.debug('URI listener: Tauri not available — using window events only');
  }

  // Path 2: In-app custom events (always available)
  window.addEventListener('bismuth-uri', handleCustomEvent as EventListener);
  log.info('URI listener: started');
}

/**
 * Stops listening for URIs. Call during app cleanup.
 */
export function stopUriListener(): void {
  if (unlisten) {
    unlisten();
    unlisten = null;
  }
  window.removeEventListener('bismuth-uri', handleCustomEvent as EventListener);
  log.info('URI listener: stopped');
}

/**
 * Programmatically dispatches a URI string as if it came from the OS.
 * Returns the action result for callers that need to check success.
 */
export async function triggerUri(uriString: string): Promise<UriActionResult> {
  return handleIncomingUri(uriString);
}

/** Core handler for any incoming URI string. */
async function handleIncomingUri(uriString: string): Promise<UriActionResult> {
  log.info('URI listener: received URI', { uri: uriString });

  const parsed = parseAdvancedUri(uriString);
  if (!parsed) {
    log.warn('URI listener: invalid URI', { uri: uriString });
    return { success: false, error: 'Invalid URI format' };
  }

  return dispatchUri(parsed);
}

/** Handles window custom events carrying a URI string. */
function handleCustomEvent(event: CustomEvent<string>): void {
  handleIncomingUri(event.detail);
}
