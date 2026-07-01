/**
 * Recipe template engine — lightweight Handlebars-like templating
 * with custom helpers: splitTags, magicTime, and {{#each}} blocks.
 *
 * Supports:
 *   {{field}}               — simple variable substitution
 *   {{{json}}}              — raw JSON output (triple-stache)
 *   {{magicTime}}           — current date/time formatted
 *   {{magicTime field}}     — format an ISO duration or date field
 *   {{magicTime field "fmt"}} — with custom date format
 *   {{splitTags field}}     — split comma-separated string into YAML list
 *   {{#each array}} ... {{/each}} — iterate arrays
 *   {{this}} / {{@index}} / {{@number}} — loop variables
 */

import type { GrabbedRecipeData } from '../types';

type RecipeContext = GrabbedRecipeData & Record<string, unknown>;

/**
 * Parse an ISO 8601 duration (e.g. PT1H30M) into a human-readable string.
 */
export function parseIsoDuration(iso: string): string {
  if (!iso) return '';
  const match = iso.match(/^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
  if (!match) return iso;

  const days = parseInt(match[1] || '0', 10);
  const hours = parseInt(match[2] || '0', 10);
  const mins = parseInt(match[3] || '0', 10);
  const secs = parseInt(match[4] || '0', 10);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0) parts.push(`${mins}m`);
  if (secs > 0) parts.push(`${secs}s`);

  return parts.join(' ') || '0m';
}

/**
 * Format a date string with a simple mask.
 * Supported tokens: yyyy, mm, dd, HH, MM, SS
 */
export function formatDateWithMask(dateStr: string, mask: string = 'yyyy-mm-dd HH:MM'): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;

  const pad = (n: number) => String(n).padStart(2, '0');

  return mask
    .replace('yyyy', String(d.getFullYear()))
    .replace('mm', pad(d.getMonth() + 1))
    .replace('dd', pad(d.getDate()))
    .replace('HH', pad(d.getHours()))
    .replace('MM', pad(d.getMinutes()))
    .replace('SS', pad(d.getSeconds()));
}

/**
 * magicTime helper — handles ISO durations (PT1H30M) and dates.
 * - No args: current date/time
 * - One arg (field value): parse duration or format date
 * - Two args (field value, mask): format date with mask
 */
export function magicTime(value?: string, mask?: string): string {
  if (value === undefined || value === '') {
    return formatDateWithMask(new Date().toISOString(), mask || 'yyyy-mm-dd HH:MM');
  }
  if (/^P/i.test(value)) {
    return parseIsoDuration(value);
  }
  return formatDateWithMask(value, mask || 'yyyy-mm-dd HH:MM');
}

/**
 * splitTags helper — converts a comma-separated string into YAML list items.
 * Example: "pasta, Italian, easy" -> "  - pasta\n  - Italian\n  - easy"
 */
export function splitTags(value: string): string {
  if (!value) return '';
  return value
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => `  - ${t}`)
    .join('\n');
}

/**
 * Resolve a dotted path on the context object.
 */
function resolveField(ctx: RecipeContext, field: string): unknown {
  if (field === 'json') return ctx.rawJson || '';
  const parts = field.split('.');
  let val: unknown = ctx;
  for (const p of parts) {
    if (val == null || typeof val !== 'object') return '';
    val = (val as Record<string, unknown>)[p];
  }
  return val ?? '';
}

/**
 * Process a helper expression like {{magicTime cookTime}} or {{splitTags keywords}}.
 */
function processHelper(helperName: string, args: string[], ctx: RecipeContext): string {
  switch (helperName) {
    case 'magicTime': {
      if (args.length === 0) return magicTime();
      const fieldVal = String(resolveField(ctx, args[0]) ?? '');
      const mask = args[1]?.replace(/^["']|["']$/g, '');
      return magicTime(fieldVal, mask);
    }
    case 'splitTags': {
      if (args.length === 0) return '';
      const fieldVal = String(resolveField(ctx, args[0]) ?? '');
      return splitTags(fieldVal);
    }
    default:
      return '';
  }
}

/**
 * Process {{#each array}}...{{/each}} blocks.
 */
function processEachBlocks(template: string, ctx: RecipeContext): string {
  const eachRe = /\{\{#each\s+(\w+)\}\}\n?([\s\S]*?)\{\{\/each\}\}/g;
  return template.replace(eachRe, (_match, field: string, body: string) => {
    const arr = resolveField(ctx, field);
    if (!Array.isArray(arr)) return '';
    return arr
      .map((item, i) => {
        return body
          .replace(/\{\{this\}\}/g, String(item))
          .replace(/\{\{@index\}\}/g, String(i))
          .replace(/\{\{@number\}\}/g, String(i + 1));
      })
      .join('');
  });
}

/**
 * Apply a Handlebars-like template to grabbed recipe data.
 * Returns the fully rendered markdown string.
 */
export function applyRecipeTemplate(template: string, data: GrabbedRecipeData): string {
  const ctx = data as RecipeContext;
  let result = template;

  // Process {{#each}} blocks first
  result = processEachBlocks(result, ctx);

  // Process triple-stache {{{field}}} (raw, no escaping — same as double for us)
  result = result.replace(/\{\{\{(\w+)\}\}\}/g, (_m, field: string) => {
    return String(resolveField(ctx, field));
  });

  // Process helper calls: {{helperName arg1 "arg2"}}
  const helperRe = /\{\{(magicTime|splitTags)(?:\s+([^}]*))?\}\}/g;
  result = result.replace(helperRe, (_m, helper: string, argsStr: string) => {
    const args = argsStr ? argsStr.trim().split(/\s+/).filter(Boolean) : [];
    return processHelper(helper, args, ctx);
  });

  // Process simple variable substitution: {{field}}
  result = result.replace(/\{\{(\w+)\}\}/g, (_m, field: string) => {
    return String(resolveField(ctx, field));
  });

  return result;
}
