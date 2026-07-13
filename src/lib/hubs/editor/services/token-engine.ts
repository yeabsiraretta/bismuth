/**
 * Unified token engine — shared date formatting, UUID generation, and token
 * expansion utilities used by template-vars, capture-service, and PDF copy.
 *
 * All token interpolation in the app flows through this module so that
 * every surface (templates, capture, PDF, periodic reviews) uses one
 * consistent `{{expression}}` vocabulary.
 */

// ── Date formatting ──────────────────────────────────────────────

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function formatISO(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function formatTime24(d: Date): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_SHORT = [
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
const MONTH_LONG = [
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

/**
 * Replace date-format placeholders in `fmt`:
 *   YYYY, YY, MMMM, MMM, MM, DD, dddd, ddd, HH, mm, ss
 *
 * Order matters: longer tokens are replaced first to avoid partial matches.
 */
export function formatDateCustom(d: Date, fmt: string): string {
  let result = fmt;
  result = result.replace('YYYY', String(d.getFullYear()));
  result = result.replace('YY', String(d.getFullYear()).slice(-2));
  result = result.replace('MMMM', MONTH_LONG[d.getMonth()]);
  result = result.replace('MMM', MONTH_SHORT[d.getMonth()]);
  result = result.replace('MM', pad2(d.getMonth() + 1));
  result = result.replace('DD', pad2(d.getDate()));
  result = result.replace('dddd', WEEKDAY_LONG[d.getDay()]);
  result = result.replace('ddd', WEEKDAY_SHORT[d.getDay()]);
  result = result.replace('HH', pad2(d.getHours()));
  result = result.replace('mm', pad2(d.getMinutes()));
  result = result.replace('ss', pad2(d.getSeconds()));
  return result;
}

export function getWeekNumber(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - start.getTime()) / 86_400_000 + start.getDay() + 1) / 7);
}

// ── UUID ─────────────────────────────────────────────────────────

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// ── Generic token expansion ──────────────────────────────────────

/**
 * Replace all `{{key}}` tokens in `template` by calling `resolver(key)`.
 * If the resolver returns `null`, the original `{{key}}` is preserved.
 */
export function expandTokens(template: string, resolver: (key: string) => string | null): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, expr: string) => {
    const resolved = resolver(expr.trim());
    return resolved !== null ? resolved : match;
  });
}
