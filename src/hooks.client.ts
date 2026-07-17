import type { HandleClientError } from '@sveltejs/kit';

import { log } from '@/utils/log/logger';
import { captureRuntimeError, type LoggedRuntimeError } from '@/utils/log/runtime-errors';
import { dev } from '$app/environment';

const hooksLog = log.child('hooks:client');

/**
 * Client-side error handler — catches unexpected errors thrown during
 * rendering, navigation, and load functions. Expected errors (thrown
 * via SvelteKit's `error()` helper) are NOT routed here.
 *
 * Returns a safe App.Error object for display in +error.svelte.
 */
export const handleError: HandleClientError = async ({ error, status, message }) => {
  const loggedError = error as Partial<LoggedRuntimeError>;
  const errorId = typeof loggedError.code === 'string' ? loggedError.code : crypto.randomUUID();
  const details = error instanceof Error ? (error.stack ?? error.message) : String(error);
  const source = typeof loggedError.source === 'string' ? loggedError.source : 'hooks:client';
  const timestamp =
    typeof loggedError.timestamp === 'string' ? loggedError.timestamp : new Date().toISOString();

  // Log the full error with stack trace for debugging
  hooksLog.error(`Unhandled client error [${errorId}]`, {
    status,
    message,
    source,
    error: details,
  });

  if (typeof loggedError.code !== 'string') {
    captureRuntimeError({
      code: errorId,
      source,
      message: error instanceof Error ? error.message : message,
      details,
      status,
      timestamp,
    });
  }

  return {
    message: dev ? (error instanceof Error ? error.message : message) : message,
    code: errorId,
    details,
    source,
    status,
    timestamp,
  };
};
