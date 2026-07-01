/**
 * ProgressBar Parser — parses ```progressbar YAML code blocks,
 * computes time-based and manual progress values, resolves name templates.
 */
import type {
  ProgressBarKind, ProgressBarConfig, ProgressBarData, ProgressBarBlock,
} from '../types/progressbar';
import { DEFAULT_PROGRESSBAR_CONFIG } from '../types/progressbar';

// ─── YAML parsing ────────────────────────────────────────────────────────────

/** Parse simple YAML key-value pairs from a code block body */
export function parseProgressBarYaml(raw: string): ProgressBarConfig {
  const config = { ...DEFAULT_PROGRESSBAR_CONFIG };

  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const match = trimmed.match(/^([a-zA-Z_-]+)\s*:\s*(.+)$/);
    if (!match) continue;

    const [, key, rawVal] = match;
    const val = rawVal.replace(/^["']|["']$/g, '').trim();

    switch (key.toLowerCase()) {
      case 'kind': config.kind = val as ProgressBarKind; break;
      case 'name': config.name = val; break;
      case 'width': config.width = val; break;
      case 'value': config.value = parseFloat(val); break;
      case 'min': config.min = isNaN(Number(val)) ? val : parseFloat(val); break;
      case 'max': config.max = isNaN(Number(val)) ? val : parseFloat(val); break;
      case 'button': config.button = val === 'true'; break;
      case 'id': config.id = val; break;
    }
  }

  return config;
}

// ─── Time-based computation ──────────────────────────────────────────────────

/** Get current progress for a given kind */
export function computeTimeProgress(
  kind: ProgressBarKind,
  minVal: number | string | null,
  maxVal: number | string | null,
  now: Date = new Date(),
): { value: number; min: number; max: number } {
  switch (kind) {
    case 'day-year': {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31);
      const total = daysBetween(start, end) + 1;
      const elapsed = daysBetween(start, now) + 1;
      return { value: elapsed, min: 0, max: total };
    }
    case 'day-month': {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      return { value: now.getDate(), min: 0, max: daysInMonth };
    }
    case 'day-week': {
      const day = now.getDay(); // 0=Sun
      return { value: day === 0 ? 7 : day, min: 0, max: 7 };
    }
    case 'month': {
      return { value: now.getMonth() + 1, min: 0, max: 12 };
    }
    case 'day-custom': {
      const startDate = typeof minVal === 'string' ? new Date(minVal) : null;
      const endDate = typeof maxVal === 'string' ? new Date(maxVal) : null;
      if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return { value: 0, min: 0, max: 1 };
      }
      const total = daysBetween(startDate, endDate);
      const elapsed = Math.max(0, Math.min(total, daysBetween(startDate, now)));
      return { value: elapsed, min: 0, max: Math.max(total, 1) };
    }
    default: return { value: 0, min: 0, max: 100 };
  }
}

/** Calculate days between two dates */
export function daysBetween(a: Date, b: Date): number {
  const msPerDay = 86400000;
  const aDay = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const bDay = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.floor((bDay.getTime() - aDay.getTime()) / msPerDay);
}

// ─── Name template resolution ────────────────────────────────────────────────

/** Resolve name templates: {value}, {max}, {min}, {percentage} */
export function resolveNameTemplate(
  template: string,
  data: { value: number; min: number; max: number; percentage: number },
): string {
  return template
    .replace(/\{value\}/g, String(data.value))
    .replace(/\{max\}/g, String(data.max))
    .replace(/\{min\}/g, String(data.min))
    .replace(/\{percentage\}/g, `${data.percentage}%`);
}

/** Generate default name from kind */
export function defaultNameForKind(kind: ProgressBarKind | null): string {
  switch (kind) {
    case 'day-year': return 'Day of Year ({percentage})';
    case 'day-month': return 'Day of Month ({percentage})';
    case 'day-week': return 'Day of Week ({percentage})';
    case 'day-custom': return 'Custom ({percentage})';
    case 'month': return 'Month ({percentage})';
    case 'manual': return 'Progress ({percentage})';
    default: return 'Progress ({percentage})';
  }
}

// ─── Full computation ────────────────────────────────────────────────────────

/** Compute full ProgressBarData from a parsed config */
export function computeProgressBar(
  config: ProgressBarConfig,
  now: Date = new Date(),
): ProgressBarData {
  let value: number;
  let min: number;
  let max: number;

  if (config.kind && config.kind !== 'manual') {
    const time = computeTimeProgress(config.kind, config.min, config.max, now);
    value = time.value;
    min = time.min;
    max = time.max;
  } else {
    value = config.value ?? 0;
    min = typeof config.min === 'number' ? config.min : 0;
    max = typeof config.max === 'number' ? config.max : 100;
  }

  const clamped = Math.max(min, Math.min(value, max));
  const range = max - min;
  const percentage = range > 0 ? Math.round(((clamped - min) / range) * 100) : 0;

  const nameTemplate = config.name || defaultNameForKind(config.kind);
  const label = resolveNameTemplate(nameTemplate, { value: clamped, min, max, percentage });

  return {
    label,
    value: clamped,
    min,
    max,
    percentage,
    width: config.width || '100%',
    showButtons: config.button && (!config.kind || config.kind === 'manual'),
    id: config.id,
    kind: config.kind,
  };
}

// ─── Block detection ─────────────────────────────────────────────────────────

const BLOCK_RE = /```progressbar\s*\n([\s\S]*?)```/g;

/** Find all ```progressbar code blocks in a document */
export function findProgressBarBlocks(text: string): ProgressBarBlock[] {
  const blocks: ProgressBarBlock[] = [];
  let match: RegExpExecArray | null;

  BLOCK_RE.lastIndex = 0;
  while ((match = BLOCK_RE.exec(text)) !== null) {
    const raw = match[1];
    const config = parseProgressBarYaml(raw);
    const data = computeProgressBar(config);

    blocks.push({
      raw,
      config,
      data,
      from: match.index,
      to: match.index + match[0].length,
    });
  }

  return blocks;
}

/** Generate a sample progressbar code block */
export function sampleProgressBarBlock(): string {
  return [
    '```progressbar',
    'kind: day-year',
    'name: This Year',
    '```',
    '',
    '```progressbar',
    'kind: day-month',
    'name: This Month',
    '```',
    '',
    '```progressbar',
    'kind: manual',
    'name: "Reading Progress: {value}/{max} ({percentage})"',
    'value: 42',
    'max: 100',
    'button: true',
    'id: reading',
    '```',
  ].join('\n');
}
