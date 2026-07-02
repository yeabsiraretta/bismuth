/**
 * Template variable resolver for journal note names, paths, and content.
 *
 * Supported variables:
 *   {{journal_name}}   - display name of the journal
 *   {{note_name}}      - resolved note filename (without extension)
 *   {{date}}           - reference date formatted with journal's dateFormat
 *   {{date:FORMAT}}    - reference date with custom format
 *   {{date+Nd:FORMAT}} - date with offset (N days/weeks/months/years)
 *   {{start_date}}     - first day of the period
 *   {{start_date:FMT}} - first day with custom format
 *   {{end_date}}       - last day of the period
 *   {{end_date:FMT}}   - last day with custom format
 *   {{index}}          - sequential index number
 */

import type { TemplateContext } from '../types';
import { log } from '@/utils/logger';

/** Regex matching a template variable: {{name}}, {{name:format}}, {{name+offset:format}} */
const VAR_REGEX = /\{\{(\w+)(?:([+-]\d+[dwmy]))?(?::([^}]+))?\}\}/g;

/** Format a Date using a simplified Moment.js-compatible format string. */
export function formatDate(date: Date, format: string): string {
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();
  const dayOfWeek = date.getDay();

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const monthShort = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // ISO week number
  const jan4 = new Date(y, 0, 4);
  const startOfWeek = new Date(jan4);
  startOfWeek.setDate(jan4.getDate() - jan4.getDay() + 1);
  const weekNum = Math.ceil(((date.getTime() - startOfWeek.getTime()) / 86400000 + 1) / 7);

  const quarter = Math.floor(m / 3) + 1;

  const tokens: Record<string, string> = {
    YYYY: String(y),
    YY: String(y).slice(-2),
    MMMM: monthNames[m],
    MMM: monthShort[m],
    MM: String(m + 1).padStart(2, '0'),
    M: String(m + 1),
    DD: String(d).padStart(2, '0'),
    D: String(d),
    dddd: dayNames[dayOfWeek],
    ddd: dayShort[dayOfWeek],
    dd: dayShort[dayOfWeek].slice(0, 2),
    d: String(dayOfWeek),
    WW: String(weekNum).padStart(2, '0'),
    W: String(weekNum),
    Q: String(quarter),
  };

  let result = format;
  // Handle escaped characters in square brackets [text]
  const escaped: string[] = [];
  result = result.replace(/\[([^\]]*)\]/g, (_, text) => {
    escaped.push(text);
    return `\x01${escaped.length - 1}\x01`;
  });

  // Replace tokens longest-first using placeholders to prevent re-matching
  const sortedKeys = Object.keys(tokens).sort((a, b) => b.length - a.length);
  const placeholders: string[] = [];
  for (const key of sortedKeys) {
    if (result.includes(key)) {
      placeholders.push(tokens[key]);
      result = result.split(key).join(`\x02${placeholders.length - 1}\x02`);
    }
  }

  // Restore placeholders with actual values
  result = result.replace(/\x02(\d+)\x02/g, (_, idx) => placeholders[Number(idx)]);
  // Restore escaped text
  result = result.replace(/\x01(\d+)\x01/g, (_, idx) => escaped[Number(idx)]);

  return result;
}

/** Apply a date offset string like "+5d", "-2w", "+1m", "+1y". */
export function applyDateOffset(date: Date, offset: string): Date {
  const match = offset.match(/^([+-])(\d+)([dwmy])$/);
  if (!match) return date;

  const sign = match[1] === '+' ? 1 : -1;
  const amount = parseInt(match[2], 10) * sign;
  const unit = match[3];

  const result = new Date(date);
  switch (unit) {
    case 'd':
      result.setDate(result.getDate() + amount);
      break;
    case 'w':
      result.setDate(result.getDate() + amount * 7);
      break;
    case 'm':
      result.setMonth(result.getMonth() + amount);
      break;
    case 'y':
      result.setFullYear(result.getFullYear() + amount);
      break;
  }
  return result;
}

/**
 * Resolve all template variables in a string.
 *
 * @param template - String containing {{variable}} placeholders
 * @param ctx - Template context with date, journal, index, etc.
 * @returns Resolved string with all variables replaced
 */
export function resolveTemplateVars(template: string, ctx: TemplateContext): string {
  return template.replace(
    VAR_REGEX,
    (match, name: string, offsetStr: string | undefined, customFormat: string | undefined) => {
      try {
        return resolveVar(name, offsetStr, customFormat, ctx);
      } catch (err) {
        log.warn('Template variable resolution failed', { match, error: String(err) });
        return match;
      }
    }
  );
}

function resolveVar(
  name: string,
  offsetStr: string | undefined,
  customFormat: string | undefined,
  ctx: TemplateContext
): string {
  const fmt = customFormat || ctx.journal.dateFormat;

  switch (name) {
    case 'journal_name':
      return ctx.journal.name;

    case 'note_name':
      return ctx.noteName ?? '';

    case 'date': {
      let d = ctx.date;
      if (offsetStr) d = applyDateOffset(d, offsetStr);
      return formatDate(d, fmt);
    }

    case 'start_date': {
      let d = ctx.startDate;
      if (offsetStr) d = applyDateOffset(d, offsetStr);
      return formatDate(d, fmt);
    }

    case 'end_date': {
      let d = ctx.endDate;
      if (offsetStr) d = applyDateOffset(d, offsetStr);
      return formatDate(d, fmt);
    }

    case 'index':
      return ctx.index !== null ? String(ctx.index) : '';

    default:
      return `{{${name}}}`;
  }
}
