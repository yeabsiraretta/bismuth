/**
 * Date formatting utility using date-fns.
 * Central helper for consistent date display throughout the UI.
 */

import {
  format,
  parseISO,
  isValid,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
} from 'date-fns';

/**
 * Format a date string using the given format pattern.
 * @param date - ISO date string or any parseable input
 * @param pattern - date-fns format string (e.g. 'yyyy-MM-dd', 'MMM d, yyyy h:mm a')
 * @returns Formatted date string, or empty string if invalid
 */
export function formatDate(date: string | undefined | null, pattern: string): string {
  if (!date) return '';
  const d = parseISO(date);
  return isValid(d) ? format(d, pattern) : '';
}

/**
 * Format a date as relative time (e.g. "2 hours ago").
 * @param date - ISO date string
 * @returns Relative time string
 */
export function formatRelative(date: string | undefined | null): string {
  if (!date) return '';
  const d = parseISO(date);
  if (!isValid(d)) return '';
  const now = new Date();
  const diffMin = differenceInMinutes(now, d);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = differenceInHours(now, d);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = differenceInDays(now, d);
  if (diffD < 30) return `${diffD}d ago`;
  return format(d, 'MMM d, yyyy');
}
