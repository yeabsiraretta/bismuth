/**
 * Task service — parse markdown checklist items into structured tasks.
 * Inspired by obsidian-tasks: extracts due/scheduled/done dates,
 * priorities, recurrence, and tags from task lines.
 *
 * Marker format (text-based, no emojis by default):
 *   [due:: YYYY-MM-DD]       or emoji: U+1F4C5 YYYY-MM-DD
 *   [scheduled:: YYYY-MM-DD] or: U+23F3 YYYY-MM-DD
 *   [done:: YYYY-MM-DD]      or: U+2705 YYYY-MM-DD
 *   [start:: YYYY-MM-DD]     or: U+1F6EB YYYY-MM-DD
 *   [priority:: high]        or: U+23EB / U+1F53C / U+1F53D
 *   [repeat:: every week]
 *   #tag
 *
 * Pure functions, no side effects.
 */

import type {
  PMPriority,
  PMRecurrence,
  PMRecurrenceFrequency,
  PMStatus,
} from '@/hubs/planner/types/pm-types';

// ── Types ─────────────────────────────────────────────────────────

export interface ParsedTask {
  line: number;
  raw: string;
  title: string;
  status: PMStatus;
  priority: PMPriority;
  dueDate: string | null;
  scheduledDate: string | null;
  startDate: string | null;
  doneDate: string | null;
  recurrence: PMRecurrence | null;
  tags: string[];
  indentLevel: number;
}

// ── Date patterns ─────────────────────────────────────────────────

const DUE_TEXT = /\[due::\s*(\d{4}-\d{2}-\d{2})\]/i;
const DUE_EMOJI = /\u{1F4C5}\s*(\d{4}-\d{2}-\d{2})/u;

const SCHED_TEXT = /\[scheduled::\s*(\d{4}-\d{2}-\d{2})\]/i;
const SCHED_EMOJI = /\u23F3\s*(\d{4}-\d{2}-\d{2})/u;

const DONE_TEXT = /\[done::\s*(\d{4}-\d{2}-\d{2})\]/i;
const DONE_EMOJI = /\u2705\s*(\d{4}-\d{2}-\d{2})/u;

const START_TEXT = /\[start::\s*(\d{4}-\d{2}-\d{2})\]/i;
const START_EMOJI = /\u{1F6EB}\s*(\d{4}-\d{2}-\d{2})/u;

// ── Priority patterns ─────────────────────────────────────────────

const PRIO_TEXT = /\[priority::\s*(critical|high|medium|low)\]/i;
const PRIO_EMOJI_HI = /\u23EB/u;
const PRIO_EMOJI_MED = /\u{1F53C}/u;
const PRIO_EMOJI_LO = /\u{1F53D}/u;

// ── Recurrence patterns ───────────────────────────────────────────

const RECUR_TEXT = /\[repeat::\s*([^\]]+)\]/i;
const RECUR_EMOJI = /\u{1F501}\s*([^\s\]]+(?:\s+[^\s\]]+)*)/u;

// ── Tag pattern ───────────────────────────────────────────────────

const TAG_RE = /#([a-zA-Z][\w/-]*)/g;

// ── Checkbox status ───────────────────────────────────────────────

const TASK_LINE_RE = /^(\s*)[-*]\s+\[(.)\]\s+(.*)/;

function statusFromCheckbox(ch: string): PMStatus {
  if (ch === 'x' || ch === 'X') return 'done';
  if (ch === '-') return 'cancelled';
  if (ch === '/') return 'in-progress';
  if (ch === '>') return 'in-review';
  if (ch === '!') return 'blocked';
  return 'todo';
}

export function checkboxForStatus(status: PMStatus): string {
  if (status === 'done') return 'x';
  if (status === 'cancelled') return '-';
  if (status === 'in-progress') return '/';
  if (status === 'in-review') return '>';
  if (status === 'blocked') return '!';
  return ' ';
}

// ── Extract functions ─────────────────────────────────────────────

function extractDate(line: string, textRe: RegExp, emojiRe: RegExp): string | null {
  const tm = textRe.exec(line);
  if (tm) return tm[1];
  const em = emojiRe.exec(line);
  if (em) return em[1];
  return null;
}

function extractPriority(line: string): PMPriority {
  const tm = PRIO_TEXT.exec(line);
  if (tm) return tm[1].toLowerCase() as PMPriority;
  if (PRIO_EMOJI_HI.test(line)) return 'high';
  if (PRIO_EMOJI_MED.test(line)) return 'medium';
  if (PRIO_EMOJI_LO.test(line)) return 'low';
  return 'medium';
}

function extractTags(line: string): string[] {
  const tags: string[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(TAG_RE.source, TAG_RE.flags);
  while ((m = re.exec(line)) !== null) {
    tags.push(m[1]);
  }
  return tags;
}

export function parseRecurrence(text: string): PMRecurrence | null {
  const t = text.trim().toLowerCase();
  const intervalMatch = t.match(/^every\s+(\d+)\s+(day|week|month|year)s?$/);
  if (intervalMatch) {
    return {
      frequency: (intervalMatch[2] +
        (intervalMatch[2].endsWith('ly') ? '' : 'ly')) as PMRecurrenceFrequency,
      interval: parseInt(intervalMatch[1], 10),
    };
  }

  if (t === 'daily' || t === 'every day') return { frequency: 'daily', interval: 1 };
  if (t === 'weekly' || t === 'every week') return { frequency: 'weekly', interval: 1 };
  if (t === 'monthly' || t === 'every month') return { frequency: 'monthly', interval: 1 };
  if (t === 'yearly' || t === 'every year') return { frequency: 'yearly', interval: 1 };

  const simpleMatch = t.match(/^every\s+(day|week|month|year)$/);
  if (simpleMatch) {
    const freqMap: Record<string, PMRecurrenceFrequency> = {
      day: 'daily',
      week: 'weekly',
      month: 'monthly',
      year: 'yearly',
    };
    return { frequency: freqMap[simpleMatch[1]], interval: 1 };
  }

  return null;
}

function extractRecurrence(line: string): PMRecurrence | null {
  const tm = RECUR_TEXT.exec(line);
  if (tm) return parseRecurrence(tm[1]);
  const em = RECUR_EMOJI.exec(line);
  if (em) return parseRecurrence(em[1]);
  return null;
}

function stripMetadata(title: string): string {
  return title
    .replace(DUE_TEXT, '')
    .replace(DUE_EMOJI, '')
    .replace(SCHED_TEXT, '')
    .replace(SCHED_EMOJI, '')
    .replace(DONE_TEXT, '')
    .replace(DONE_EMOJI, '')
    .replace(START_TEXT, '')
    .replace(START_EMOJI, '')
    .replace(PRIO_TEXT, '')
    .replace(PRIO_EMOJI_HI, '')
    .replace(PRIO_EMOJI_MED, '')
    .replace(PRIO_EMOJI_LO, '')
    .replace(RECUR_TEXT, '')
    .replace(RECUR_EMOJI, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// ── Main parser ───────────────────────────────────────────────────

export function parseTaskLine(raw: string, lineNumber: number): ParsedTask | null {
  const m = TASK_LINE_RE.exec(raw);
  if (!m) return null;

  const indent = m[1];
  const checkbox = m[2];
  const rest = m[3];

  return {
    line: lineNumber,
    raw,
    title: stripMetadata(rest),
    status: statusFromCheckbox(checkbox),
    priority: extractPriority(rest),
    dueDate: extractDate(rest, DUE_TEXT, DUE_EMOJI),
    scheduledDate: extractDate(rest, SCHED_TEXT, SCHED_EMOJI),
    startDate: extractDate(rest, START_TEXT, START_EMOJI),
    doneDate: extractDate(rest, DONE_TEXT, DONE_EMOJI),
    recurrence: extractRecurrence(rest),
    tags: extractTags(rest),
    indentLevel: Math.floor(indent.length / 2),
  };
}

export function parseTasksFromContent(content: string, _notePath?: string): ParsedTask[] {
  const lines = content.split('\n');
  const tasks: ParsedTask[] = [];
  for (let i = 0; i < lines.length; i++) {
    const parsed = parseTaskLine(lines[i], i + 1);
    if (parsed) tasks.push(parsed);
  }
  return tasks;
}

// ── Serialization ─────────────────────────────────────────────────

export function formatTaskLine(
  title: string,
  status: PMStatus,
  opts?: {
    dueDate?: string | null;
    scheduledDate?: string | null;
    startDate?: string | null;
    doneDate?: string | null;
    priority?: PMPriority;
    recurrence?: PMRecurrence | null;
    tags?: string[];
    useEmoji?: boolean;
  }
): string {
  const cb = checkboxForStatus(status);
  const parts: string[] = [title];

  if (opts?.priority && opts.priority !== 'medium') {
    if (opts.useEmoji) {
      if (opts.priority === 'high' || opts.priority === 'critical') parts.push('\u23EB');
      else if (opts.priority === 'low') parts.push('\u{1F53D}');
    } else {
      parts.push(`[priority:: ${opts.priority}]`);
    }
  }

  if (opts?.dueDate) {
    parts.push(opts.useEmoji ? `\u{1F4C5} ${opts.dueDate}` : `[due:: ${opts.dueDate}]`);
  }
  if (opts?.scheduledDate) {
    parts.push(
      opts.useEmoji ? `\u23F3 ${opts.scheduledDate}` : `[scheduled:: ${opts.scheduledDate}]`
    );
  }
  if (opts?.startDate) {
    parts.push(opts.useEmoji ? `\u{1F6EB} ${opts.startDate}` : `[start:: ${opts.startDate}]`);
  }
  if (opts?.doneDate) {
    parts.push(opts.useEmoji ? `\u2705 ${opts.doneDate}` : `[done:: ${opts.doneDate}]`);
  }
  if (opts?.recurrence) {
    const recStr = formatRecurrence(opts.recurrence);
    parts.push(opts.useEmoji ? `\u{1F501} ${recStr}` : `[repeat:: ${recStr}]`);
  }

  if (opts?.tags?.length) {
    for (const tag of opts.tags) {
      if (!title.includes(`#${tag}`)) parts.push(`#${tag}`);
    }
  }

  return `- [${cb}] ${parts.join(' ')}`;
}

export function formatRecurrence(rec: PMRecurrence): string {
  const freqWord: Record<PMRecurrenceFrequency, string> = {
    daily: 'day',
    weekly: 'week',
    monthly: 'month',
    yearly: 'year',
  };
  if (rec.interval === 1) return `every ${freqWord[rec.frequency]}`;
  return `every ${rec.interval} ${freqWord[rec.frequency]}s`;
}

// ── Due date helpers ──────────────────────────────────────────────

export function isOverdue(task: { dueDate: string | null; status: PMStatus }): boolean {
  if (!task.dueDate || task.status === 'done' || task.status === 'cancelled') return false;
  return task.dueDate < new Date().toISOString().slice(0, 10);
}

export function isDueToday(task: { dueDate: string | null; status: PMStatus }): boolean {
  if (!task.dueDate || task.status === 'done' || task.status === 'cancelled') return false;
  return task.dueDate === new Date().toISOString().slice(0, 10);
}

export function isDueSoon(
  task: { dueDate: string | null; status: PMStatus },
  days: number = 3
): boolean {
  if (!task.dueDate || task.status === 'done' || task.status === 'cancelled') return false;
  const today = new Date();
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() + days);
  return (
    task.dueDate > today.toISOString().slice(0, 10) &&
    task.dueDate <= cutoff.toISOString().slice(0, 10)
  );
}
