import type { HandleClientError } from '@sveltejs/kit';

import { log } from '@/utils/log/logger';

const hooksLog = log.child('hooks:client');

/**
 * Client-side error handler — catches unexpected errors thrown during
 * rendering, navigation, and load functions. Expected errors (thrown
 * via SvelteKit's `error()` helper) are NOT routed here.
 *
 * Returns a safe App.Error object for display in +error.svelte.
 */
export const handleError: HandleClientError = async ({ error, status, message }) => {
  const errorId = crypto.randomUUID();

  // Log the full error with stack trace for debugging
  hooksLog.error(`Unhandled client error [${errorId}]`, {
    status,
    message,
    error: error instanceof Error ? error.stack : String(error),
  });

  return {
    message: import.meta.env.DEV ? (error instanceof Error ? error.message : message) : message,
    code: errorId,
  };
};
