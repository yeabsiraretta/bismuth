/**
 * Pure capture service inspired by chhoumann/quickadd.
 *
 * Supports multiple capture modes:
 * - "new"       — create a new note in inbox/
 * - "append"    — append text to an existing note
 * - "prepend"   — prepend text to an existing note (after frontmatter)
 * - "daily"     — append to today's daily note
 * - "dump"      — append to a folder's _dump.md (date-grouped brain dump)
 *
 * All format tokens use the unified {{module.key}} syntax from
 * resolveTemplateVars (see template-vars.ts / token-engine.ts).
 */

import { resolveTemplateVars } from '@/hubs/editor/services/template-vars';
import { formatISO, formatTime24 } from '@/hubs/editor/services/token-engine';

// ── Types ─────────────────────────────────────────────────────────

export type CaptureMode = 'new' | 'append' | 'prepend' | 'daily' | 'dump';

export interface CaptureChoice {
  id: string;
  name: string;
  mode: CaptureMode;
  targetPath: string;
  format: string;
  insertAfter: string;
  asTask: boolean;
  enabled: boolean;
}

export interface CaptureResult {
  mode: CaptureMode;
  targetPath: string;
  content: string;
  insertAfter: string;
}

// ── Token expansion (delegates to unified engine) ────────────────

/**
 * Expand `{{module.key}}` tokens in a capture template string.
 * Thin wrapper around `resolveTemplateVars` that maps capture-specific
 * fields (value, title) into a TemplateContext.
 */
export function expandCaptureTokens(
  template: string,
  vars: { value?: string; title?: string; date?: Date }
): string {
  const d = vars.date ?? new Date();
  let result = resolveTemplateVars(template, {
    noteTitle: vars.title ?? '',
    notePath: '',
    date: d,
    value: vars.value,
  });
  // \n → newline (capture-specific convenience)
  result = result.replace(/\\n/g, '\n');
  return result;
}

// ── Capture builders ──────────────────────────────────────────────

export function buildDailyNotePath(d: Date = new Date()): string {
  return `daily/${formatISO(d)}.md`;
}

export function buildCaptureContent(
  text: string,
  opts: { asTask?: boolean; format?: string; title?: string; date?: Date }
): string {
  const d = opts.date ?? new Date();
  const vars = { value: text, title: opts.title ?? '', date: d };

  // If a custom format is given, expand it
  if (opts.format) {
    return expandCaptureTokens(opts.format, vars);
  }

  // Default formatting
  const line = opts.asTask ? `- [ ] ${text}` : text;
  return line;
}

export function buildInboxPath(title: string, d: Date = new Date()): string {
  const slug = title.trim() || `Capture ${formatISO(d)} ${formatTime24(d).replace(':', '')}`;
  return `inbox/${slug}.md`;
}

export function buildDumpPath(folder: string): string {
  const f = folder.replace(/\/+$/, '');
  return f ? `${f}/_dump.md` : '_dump.md';
}

export const DUMP_FRONTMATTER = `---\ntags: [dump]\n---\n\n# Brain Dump\n`;

/**
 * Insert a dump entry into existing dump file content.
 * Groups entries under date headings (## YYYY-MM-DD).
 */
export function insertDumpEntry(existing: string, text: string, d: Date = new Date()): string {
  const dateHeading = `## ${formatISO(d)}`;
  const entry = `- ${formatTime24(d)} ${text}`;

  // If file is empty or has no content, bootstrap with frontmatter
  const content = existing.trim() ? existing : DUMP_FRONTMATTER;

  const lines = content.split('\n');
  const headingIdx = lines.findIndex((l) => l.trim() === dateHeading);

  if (headingIdx >= 0) {
    // Insert after the heading line
    lines.splice(headingIdx + 1, 0, entry);
    return lines.join('\n');
  }

  // No heading for today — insert after frontmatter/title, before older entries
  // Find the first ## heading (older date) or end of content
  const firstH2 = lines.findIndex((l) => /^## \d{4}-\d{2}-\d{2}$/.test(l.trim()));
  if (firstH2 >= 0) {
    lines.splice(firstH2, 0, dateHeading, entry, '');
  } else {
    lines.push('', dateHeading, entry);
  }
  return lines.join('\n');
}

/**
 * Insert `text` into `existing` content after a specific heading or marker.
 * If `insertAfter` is empty, appends to end.
 * If `insertAfter` starts with `#`, finds the heading and inserts after it.
 */
export function insertIntoContent(
  existing: string,
  text: string,
  insertAfter: string,
  position: 'append' | 'prepend' = 'append'
): string {
  if (!insertAfter) {
    if (position === 'prepend') {
      return prependAfterFrontmatter(existing, text);
    }
    return existing.trimEnd() + '\n' + text + '\n';
  }

  // Find heading or literal text marker
  const lines = existing.split('\n');
  const marker = insertAfter.trim();
  let insertIdx = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === marker || lines[i].trim().startsWith(marker)) {
      insertIdx = i;
      break;
    }
  }

  if (insertIdx === -1) {
    // Marker not found, fall back to end
    return existing.trimEnd() + '\n' + text + '\n';
  }

  // Insert after the marker line
  lines.splice(insertIdx + 1, 0, text);
  return lines.join('\n');
}

function prependAfterFrontmatter(content: string, text: string): string {
  const fmMatch = content.match(/^---\s*\n[\s\S]*?\n---\n?/);
  if (fmMatch) {
    const after = fmMatch[0];
    const rest = content.slice(after.length);
    return after + text + '\n' + rest;
  }
  return text + '\n' + content;
}

/**
 * Resolve a CaptureChoice + user input into a CaptureResult.
 */
export function resolveCaptureChoice(
  choice: CaptureChoice,
  userInput: string,
  d: Date = new Date()
): CaptureResult {
  const content = buildCaptureContent(userInput, {
    asTask: choice.asTask,
    format: choice.format || undefined,
    title: choice.name,
    date: d,
  });

  let targetPath = choice.targetPath;
  if (choice.mode === 'daily') {
    targetPath = buildDailyNotePath(d);
  } else if (choice.mode === 'new') {
    targetPath = buildInboxPath(
      expandCaptureTokens(choice.targetPath || '{{date}} {{date.time24}}', {
        value: userInput,
        date: d,
      }),
      d
    );
  } else if (choice.mode === 'dump') {
    targetPath = buildDumpPath(choice.targetPath || '');
  } else {
    targetPath = expandCaptureTokens(choice.targetPath, { value: userInput, date: d });
  }

  return {
    mode: choice.mode,
    targetPath,
    content,
    insertAfter: choice.insertAfter,
  };
}

// ── Default choices ───────────────────────────────────────────────

const DEFAULT_CHOICES: CaptureChoice[] = [
  {
    id: 'inbox',
    name: 'Quick Note',
    mode: 'new',
    targetPath: '',
    format: '',
    insertAfter: '',
    asTask: false,
    enabled: true,
  },
  {
    id: 'daily-log',
    name: 'Daily Log',
    mode: 'daily',
    targetPath: '',
    format: '- {{date.time24}} {{value}}',
    insertAfter: '',
    asTask: false,
    enabled: true,
  },
  {
    id: 'daily-task',
    name: 'Daily Task',
    mode: 'daily',
    targetPath: '',
    format: '',
    insertAfter: '',
    asTask: true,
    enabled: true,
  },
  {
    id: 'brain-dump',
    name: 'Brain Dump',
    mode: 'dump',
    targetPath: '',
    format: '',
    insertAfter: '',
    asTask: false,
    enabled: true,
  },
];

// ── Saved choices persistence ─────────────────────────────────────

const CHOICES_KEY = 'bismuth-capture-choices';

export function loadSavedChoices(): CaptureChoice[] {
  try {
    const raw = localStorage.getItem(CHOICES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return DEFAULT_CHOICES;
}

export function saveChoices(choices: CaptureChoice[]): void {
  try {
    localStorage.setItem(CHOICES_KEY, JSON.stringify(choices));
  } catch {
    /* ignore */
  }
}

export function createChoiceId(): string {
  return `choice-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}
