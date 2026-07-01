import type { ChangelogEntry } from '../types';

/** Groups entries by date (YYYY-MM-DD). Returns object keyed by date string. */
export function groupByDate(entries: ChangelogEntry[]): Record<string, ChangelogEntry[]> {
  const groups: Record<string, ChangelogEntry[]> = {};
  for (const entry of entries) {
    const date = entry.timestamp.slice(0, 10);
    const label = formatDate(date);
    if (!groups[label]) groups[label] = [];
    groups[label].push(entry);
  }
  return groups;
}

/** Formats ISO date to human-readable label (Today, Yesterday, or date). */
function formatDate(iso: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (iso === today) return 'Today';
  if (iso === yesterday) return 'Yesterday';
  return iso;
}

/** Returns the appropriate icon name for a changelog action. */
export function getActionIcon(action: string): string {
  switch (action) {
    case 'created':
      return 'plus';
    case 'modified':
      return 'edit-3';
    case 'deleted':
      return 'trash-2';
    case 'renamed':
      return 'arrow-right';
    default:
      return 'file';
  }
}

/** Formats an ISO timestamp to HH:MM. */
export function formatTime(timestamp: string): string {
  try {
    const d = new Date(timestamp);
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}
