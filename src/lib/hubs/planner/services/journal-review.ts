type ReviewUnit = 'day' | 'week' | 'month' | 'year';

export interface ReviewTimeSpan {
  number: number;
  unit: ReviewUnit;
  recurring: boolean;
}

interface ReviewEntry {
  path: string;
  title: string;
  createdDate: string;
  preview: string;
  timeAgo: string;
  tags: string[];
  fileType: string;
}

export interface ReviewGroup {
  label: string;
  span: ReviewTimeSpan;
  targetDate: string;
  entries: ReviewEntry[];
}

export interface ReviewConfig {
  timeSpans: ReviewTimeSpan[];
  lookupMargin: number;
  previewLength: number;
  humanizeTimeSpans: boolean;
  createdField: string;
  includeExtensions: string[];
  excludeFolders: string[];
}

const DEFAULT_TIME_SPANS: ReviewTimeSpan[] = [
  { number: 1, unit: 'month', recurring: false },
  { number: 6, unit: 'month', recurring: false },
  { number: 1, unit: 'year', recurring: true },
];

export const DEFAULT_REVIEW_CONFIG: ReviewConfig = {
  timeSpans: DEFAULT_TIME_SPANS,
  lookupMargin: 0,
  previewLength: 200,
  humanizeTimeSpans: true,
  createdField: 'created',
  includeExtensions: ['md'],
  excludeFolders: ['.obsidian', '.trash', 'node_modules'],
};

const FM_RE = /^---\s*\n([\s\S]*?)\n---/;

export function parseFrontmatter(content: string): Record<string, string> {
  const match = content.match(FM_RE);
  if (!match) return {};
  const result: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const kv = line.match(/^\s*([a-zA-Z_-]+)\s*:\s*(.+?)\s*$/);
    if (kv) result[kv[1]] = kv[2];
  }
  return result;
}

export function extractBody(content: string): string {
  const match = content.match(FM_RE);
  return match ? content.slice(match[0].length).trim() : content.trim();
}

export function extractCreatedDate(content: string, field: string = 'created'): string | null {
  const fm = parseFrontmatter(content);
  const raw = fm[field];
  if (!raw) return null;
  return parseFlexibleDate(raw.replace(/^["']|["']$/g, ''));
}

export function parseFlexibleDate(input: string): string | null {
  const iso = input.match(/^(\d{4}-\d{2}-\d{2})/);
  if (iso) return iso[1];
  const slashed = input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashed) {
    const [, a, b, year] = slashed;
    const month = parseInt(a, 10) > 12 ? b : a;
    const day = parseInt(a, 10) > 12 ? a : b;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  const d = new Date(input);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}

export function extractPreview(content: string, maxLength: number = 200): string {
  const body = extractBody(content);
  let text = body
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
    .replace(/!\[\[[^\]]+\]\]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_m, path, alias) => alias || path)
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
    .replace(/_{1,3}([^_]+)_{1,3}/g, '$1')
    .replace(/`[^`]+`/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^---+$/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/^- \[[ x]\]\s*/gm, '')
    .replace(/\n{2,}/g, '\n')
    .trim();
  if (text.length > maxLength) {
    text = text.slice(0, maxLength).replace(/\s+\S*$/, '') + '...';
  }
  return text;
}

export function extractTitle(content: string, filePath: string): string {
  const fm = parseFrontmatter(content);
  if (fm['title']) return fm['title'].replace(/^["']|["']$/g, '');
  const heading = content.match(/^#\s+(.+)$/m);
  if (heading) return heading[1].trim();
  const filename = filePath.split('/').pop() ?? filePath;
  return filename.replace(/\.[^.]+$/, '');
}

function getFileType(path: string): string {
  return path.split('.').pop()?.toLowerCase() ?? '';
}

export function subtractSpan(fromDate: Date, span: ReviewTimeSpan, multiplier: number = 1): string {
  const d = new Date(fromDate);
  const amount = span.number * multiplier;
  switch (span.unit) {
    case 'day':
      d.setDate(d.getDate() - amount);
      break;
    case 'week':
      d.setDate(d.getDate() - amount * 7);
      break;
    case 'month':
      d.setMonth(d.getMonth() - amount);
      break;
    case 'year':
      d.setFullYear(d.getFullYear() - amount);
      break;
  }
  return d.toISOString().slice(0, 10);
}

export function getTargetDates(
  referenceDate: Date,
  span: ReviewTimeSpan,
  maxYearsBack: number = 20
): string[] {
  if (!span.recurring) return [subtractSpan(referenceDate, span)];
  const dates: string[] = [];
  const earliest = new Date(referenceDate);
  earliest.setFullYear(earliest.getFullYear() - maxYearsBack);
  let multiplier = 1;
  while (true) {
    const target = subtractSpan(referenceDate, span, multiplier);
    if (new Date(target) < earliest) break;
    dates.push(target);
    multiplier++;
  }
  return dates;
}

export function datesMatchWithMargin(
  noteDate: string,
  targetDate: string,
  margin: number
): boolean {
  if (margin === 0) return noteDate.slice(5) === targetDate.slice(5);
  const note = new Date(noteDate);
  const target = new Date(targetDate);
  return Math.floor(Math.abs(note.getTime() - target.getTime()) / 86400000) <= margin;
}

export function humanizeTimeAgo(n: number, unit: string): string {
  if (unit === 'year' && n === 1) return 'A year ago';
  if (unit === 'year') return `${n} years ago`;
  if (unit === 'month' && n === 1) return 'A month ago';
  if (unit === 'month' && n === 6) return '6 months ago';
  if (unit === 'month' && n === 12) return 'A year ago';
  if (unit === 'month') return `${n} months ago`;
  if (unit === 'week' && n === 1) return 'A week ago';
  if (unit === 'week') return `${n} weeks ago`;
  if (unit === 'day' && n === 1) return 'Yesterday';
  if (unit === 'day' && n === 7) return 'A week ago';
  if (unit === 'day') return `${n} days ago`;
  return `${n} ${unit}(s) ago`;
}

export function formatTimeSpanLabel(
  span: ReviewTimeSpan,
  multiplier: number = 1,
  humanize: boolean = true
): string {
  const n = span.number * multiplier;
  if (humanize) return humanizeTimeAgo(n, span.unit);
  const plural = n !== 1 ? 's' : '';
  return `${n} ${span.unit}${plural} ago`;
}

export function timeAgoFromDate(createdDate: string, today: Date = new Date()): string {
  const diffDays = Math.floor((today.getTime() - new Date(createdDate).getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  const years = Math.floor(diffDays / 365);
  return years === 1 ? 'A year ago' : `${years} years ago`;
}

export interface VaultNote {
  path: string;
  content: string;
}

export function shouldExcludeFile(path: string, config: ReviewConfig): boolean {
  for (const folder of config.excludeFolders) {
    if (path.startsWith(folder + '/') || path.startsWith(folder + '\\')) return true;
  }
  if (config.includeExtensions.length > 0) {
    if (!config.includeExtensions.includes(getFileType(path))) return true;
  }
  return false;
}

function buildReviewEntry(
  note: VaultNote,
  createdDate: string,
  config: ReviewConfig
): ReviewEntry {
  const fm = parseFrontmatter(note.content);
  const tagsRaw = fm['tags'];
  const tags = tagsRaw
    ? (tagsRaw.match(/^\[(.+)\]$/) ? tagsRaw.match(/^\[(.+)\]$/)![1] : tagsRaw)
        .split(',')
        .map((t: string) => t.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean)
    : [];
  return {
    path: note.path,
    title: extractTitle(note.content, note.path),
    createdDate,
    preview: extractPreview(note.content, config.previewLength),
    timeAgo: timeAgoFromDate(createdDate),
    tags,
    fileType: getFileType(note.path),
  };
}

export function matchNotesToTimeSpans(
  notes: VaultNote[],
  config: ReviewConfig,
  referenceDate: Date = new Date()
): ReviewGroup[] {
  const groups: ReviewGroup[] = [];
  for (const span of config.timeSpans) {
    const targetDates = getTargetDates(referenceDate, span);
    for (let i = 0; i < targetDates.length; i++) {
      const targetDate = targetDates[i];
      const entries: ReviewEntry[] = [];
      for (const note of notes) {
        if (shouldExcludeFile(note.path, config)) continue;
        const created = extractCreatedDate(note.content, config.createdField);
        if (!created) continue;
        if (datesMatchWithMargin(created, targetDate, config.lookupMargin)) {
          entries.push(buildReviewEntry(note, created, config));
        }
      }
      if (entries.length > 0) {
        groups.push({
          label: formatTimeSpanLabel(span, i + 1, config.humanizeTimeSpans),
          span,
          targetDate,
          entries,
        });
      }
    }
  }
  return groups;
}
