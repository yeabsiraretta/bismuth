/**
 * Log sanitization — redacts sensitive data from log output.
 *
 * In production, all paths are stripped to their basename, vault roots are
 * fully redacted, and error messages are scrubbed of absolute paths.
 * In development, full paths are retained for debugging convenience.
 *
 * Sensitive data patterns:
 *   - Absolute file paths (/Users/x/..., /home/x/..., C:\Users\x\...)
 *   - Vault root paths (any path containing the vault root)
 *   - Error messages that embed paths from backend
 */

const IS_PROD = typeof import.meta !== 'undefined' && import.meta.env?.PROD;

/** Regex matching absolute paths on macOS/Linux/Windows. */
const ABS_PATH_RE = /(?:\/(?:Users|home|var|tmp|opt|etc)\/[^\s'",:})\]]+|[A-Z]:\\[^\s'",:})\]]+)/gi;

/** Keys whose values are known to contain sensitive paths. */
const PATH_KEYS = new Set([
  'path',
  'newPath',
  'oldPath',
  'from',
  'to',
  'toFolder',
  'target',
  'targetFolder',
  'notePath',
  'vaultPath',
  'rootPath',
  'root_path',
  'vault_root',
  'source',
  'filePath',
  'outputPath',
  'staged_path',
  'audio_path',
  'config_path',
  'diffPath',
]);

/**
 * Redact an absolute path to its basename.
 * `/Users/john/vaults/personal/notes/secret.md` → `…/secret.md`
 */
export function redactPath(value: string): string {
  if (!IS_PROD) return value;
  // Only redact if it looks like an absolute path
  if (!value.startsWith('/') && !/^[A-Z]:\\/.test(value)) return value;
  const parts = value.replace(/\\/g, '/').split('/');
  const basename = parts[parts.length - 1] || parts[parts.length - 2] || value;
  return `…/${basename}`;
}

/**
 * Scrub absolute paths from an error message string.
 * Replaces each absolute path with its redacted basename form.
 */
export function scrubPaths(message: string): string {
  if (!IS_PROD) return message;
  return message.replace(ABS_PATH_RE, (match) => redactPath(match));
}

/**
 * Deep-sanitize a context object, redacting path-like values.
 * Returns a new object (does not mutate the original).
 */
export function sanitizeContext(
  ctx: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
  if (!ctx || !IS_PROD) return ctx;
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(ctx)) {
    if (typeof value === 'string') {
      if (PATH_KEYS.has(key)) {
        clean[key] = redactPath(value);
      } else {
        clean[key] = scrubPaths(value);
      }
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      clean[key] = sanitizeContext(value as Record<string, unknown>);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

/**
 * Sanitize an error's message to remove absolute paths.
 * Returns a new Error-like detail without mutating the original.
 */
export function sanitizeErrorMessage(message: string): string {
  if (!IS_PROD) return message;
  return scrubPaths(message);
}
