/**
 * Data Extractor — scans vault notes, extracts frontmatter property values,
 * builds DataPoint arrays keyed by property name.
 */
import { log } from '@/utils/logger';
import type { DataPoint, PropertyDefinition, NoteFilter, ValueMapping, TimeFrame } from '../types';

// ─── Note scanning ──────────────────────────────────────────────────────────

export interface NoteMeta {
  path: string;
  frontmatter: Record<string, unknown>;
}

/** Load all note metadata from the vault via IPC */
export async function loadNoteMeta(): Promise<NoteMeta[]> {
  try {
    const { scanVaultMeta } = await import('@/services/vault/vault');
    const notes = await scanVaultMeta();
    return notes.map(n => ({ path: n.path, frontmatter: n.frontmatter ?? {} }));
  } catch (error) {
    log.error('Failed to scan vault for life tracker', error as Error);
    return [];
  }
}

// ─── Filtering ───────────────────────────────────────────────────────────────

function matchesNoteFilter(path: string, fm: Record<string, unknown>, filter?: NoteFilter): boolean {
  if (!filter) return true;
  if (filter.folder && !path.startsWith(filter.folder)) return false;
  if (filter.tag) {
    const tags = Array.isArray(fm['tags']) ? fm['tags'] as string[] : [];
    if (!tags.includes(filter.tag)) return false;
  }
  if (filter.pattern) {
    try {
      if (!new RegExp(filter.pattern).test(path)) return false;
    } catch { return false; }
  }
  return true;
}

// ─── Time frame filtering ────────────────────────────────────────────────────

export function timeFrameRange(tf: TimeFrame): { start: string; end: string } | null {
  if (tf === 'all') return null;
  const now = new Date();
  const end = now.toISOString().slice(0, 10);
  let start: Date;

  switch (tf) {
    case 'last-7': start = new Date(now); start.setDate(start.getDate() - 7); break;
    case 'last-30': start = new Date(now); start.setDate(start.getDate() - 30); break;
    case 'last-90': start = new Date(now); start.setDate(start.getDate() - 90); break;
    case 'last-365': start = new Date(now); start.setDate(start.getDate() - 365); break;
    case 'this-week': {
      start = new Date(now);
      const day = start.getDay();
      const diff = day === 0 ? 6 : day - 1;
      start.setDate(start.getDate() - diff);
      break;
    }
    case 'this-month': start = new Date(now.getFullYear(), now.getMonth(), 1); break;
    case 'this-quarter': {
      const q = Math.floor(now.getMonth() / 3) * 3;
      start = new Date(now.getFullYear(), q, 1);
      break;
    }
    case 'this-year': start = new Date(now.getFullYear(), 0, 1); break;
    default: return null;
  }
  return { start: start.toISOString().slice(0, 10), end };
}

export function isInTimeFrame(date: string, tf: TimeFrame): boolean {
  const range = timeFrameRange(tf);
  if (!range) return true;
  return date >= range.start && date <= range.end;
}

// ─── Value extraction ────────────────────────────────────────────────────────

function resolveNumeric(
  value: unknown,
  mappings?: ValueMapping[],
): number | null {
  if (typeof value === 'number') return value;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'string') {
    if (mappings) {
      const mapping = mappings.find(m => m.display === value);
      if (mapping) return mapping.numeric;
    }
    const num = parseFloat(value);
    if (!isNaN(num)) return num;
  }
  return null;
}

/** Extract the date from a note's frontmatter or filename */
export function extractDate(fm: Record<string, unknown>, path: string, dateProperty: string): string | null {
  const fmDate = fm[dateProperty];
  if (typeof fmDate === 'string' && /^\d{4}-\d{2}-\d{2}/.test(fmDate)) {
    return fmDate.slice(0, 10);
  }
  const match = path.match(/(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

// ─── Main extraction ─────────────────────────────────────────────────────────

export function extractDataPoints(
  notes: NoteMeta[],
  propDef: PropertyDefinition,
  dateProperty: string,
  timeFrame: TimeFrame,
): DataPoint[] {
  const points: DataPoint[] = [];

  for (const note of notes) {
    if (!matchesNoteFilter(note.path, note.frontmatter, propDef.noteFilter)) continue;

    const date = extractDate(note.frontmatter, note.path, dateProperty);
    if (!date) continue;
    if (!isInTimeFrame(date, timeFrame)) continue;

    const raw = note.frontmatter[propDef.name];
    if (raw === undefined || raw === null) continue;

    const numericValue = resolveNumeric(raw, propDef.valueMappings);

    points.push({
      date,
      value: raw as DataPoint['value'],
      numericValue,
      sourcePath: note.path,
    });
  }

  points.sort((a, b) => a.date.localeCompare(b.date));
  return points;
}

/** Extract data for multiple properties at once */
export function extractAllProperties(
  notes: NoteMeta[],
  definitions: PropertyDefinition[],
  dateProperty: string,
  timeFrame: TimeFrame,
): Map<string, DataPoint[]> {
  const result = new Map<string, DataPoint[]>();
  for (const def of definitions) {
    result.set(def.name, extractDataPoints(notes, def, dateProperty, timeFrame));
  }
  return result;
}
