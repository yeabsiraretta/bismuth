/**
 * Log sanitization — redacts sensitive data from log output.
 *
 * In production, absolute paths are stripped to basenames, and error
 * messages are scrubbed. In dev, full paths are retained for debugging.
 */

const IS_PROD =
  typeof import.meta !== 'undefined' &&
  (import.meta as unknown as { env?: { PROD?: boolean } }).env?.PROD === true;

const ABS_PATH_RE = /(?:\/(?:Users|home|var|tmp|opt|etc)\/[^\s'",:})\]]+|[A-Z]:\\[^\s'",:})\]]+)/gi;

const PATH_KEYS = new Set([
  'path',
  'newPath',
  'oldPath',
  'from',
  'to',
  'target',
  'notePath',
  'vaultPath',
  'rootPath',
  'root_path',
  'vault_root',
  'source',
  'filePath',
  'outputPath',
  'config_path',
]);

function redactPath(value: string): string {
  if (!IS_PROD) return value;
  if (!value.startsWith('/') && !/^[A-Z]:\\/.test(value)) return value;
  const parts = value.replace(/\\/g, '/').split('/');
  const basename = parts[parts.length - 1] || parts[parts.length - 2] || value;
  return `…/${basename}`;
}

export function scrubPaths(message: string): string {
  if (!IS_PROD) return message;
  return message.replace(ABS_PATH_RE, (match) => redactPath(match));
}

export function sanitizeContext(
  ctx: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
  if (!ctx || !IS_PROD) return ctx;
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(ctx)) {
    if (typeof value === 'string') {
      clean[key] = PATH_KEYS.has(key) ? redactPath(value) : scrubPaths(value);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      clean[key] = sanitizeContext(value as Record<string, unknown>);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

export function sanitizeErrorMessage(message: string): string {
  if (!IS_PROD) return message;
  return scrubPaths(message);
}
