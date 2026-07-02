/**
 * T067: Markdown/HTML sanitization for component documentation.
 * Security: SC-02 — Strips script, iframe, object, embed tags and event handlers.
 */

const DANGEROUS_TAGS = /<(script|iframe|object|embed|form|meta|link)[\s\S]*?<\/\1>/gi;
const SELF_CLOSING_DANGEROUS = /<(script|iframe|object|embed|form|meta|link)[^>]*\/?\s*>/gi;
const EVENT_HANDLERS = /\s+on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi;
const JAVASCRIPT_URLS = /\s+href\s*=\s*["']?\s*javascript:/gi;
const DATA_URLS = /\s+src\s*=\s*["']?\s*data:\s*text\/html/gi;

/**
 * Sanitizes HTML/Markdown content for safe DOM insertion.
 * Removes dangerous tags, event handlers, and javascript: URLs.
 */
export function sanitizeMarkdown(input: string): string {
  if (!input) return '';

  return input
    .replace(DANGEROUS_TAGS, '')
    .replace(SELF_CLOSING_DANGEROUS, '')
    .replace(EVENT_HANDLERS, '')
    .replace(JAVASCRIPT_URLS, '')
    .replace(DATA_URLS, '');
}
