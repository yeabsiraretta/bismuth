import { parseFrontmatter } from '@/hubs/editor/services/frontmatter';
import {
  formatDateCustom,
  formatISO,
  formatTime24,
  generateUUID,
  getWeekNumber,
  pad2,
} from '@/hubs/editor/services/token-engine';

export interface TemplateContext {
  noteTitle: string;
  notePath: string;
  date: Date;
  value?: string;
  noteContent?: string;
  vaultName?: string;
  noteCount?: number;
  dateFormat?: string;
  timeFormat?: string;
  language?: string;
}

export const CURSOR_MARKER = '{{cursor}}';

export function resolveTemplateVars(template: string, ctx: TemplateContext): string {
  // Whitespace control: {{- expr}} trims preceding whitespace
  let result = template.replace(/\s*\{\{-\s*([^}]+)\}\}/g, (_match, expr: string) => {
    const raw = expr.trim();
    const key = raw.toLowerCase();
    return resolveVar(key, raw, ctx) ?? `{{-${expr}}}`;
  });
  // Standard vars
  result = result.replace(/\{\{([^}-][^}]*)\}\}/g, (match, expr: string) => {
    const raw = expr.trim();
    const key = raw.toLowerCase();
    if (key === 'cursor') return CURSOR_MARKER;
    return resolveVar(key, raw, ctx) ?? match;
  });
  return result;
}

function resolveVar(key: string, raw: string, ctx: TemplateContext): string | null {
  // {{date:FORMAT}} — custom date format (preserve original case for format tokens)
  const dateFmtMatch = raw.match(/^(?:bt\.)?date:(.+)$/i);
  if (dateFmtMatch) {
    return formatDateCustom(ctx.date, dateFmtMatch[1]);
  }
  // bt.date module
  if (
    key.startsWith('bt.date.') ||
    key.startsWith('date.') ||
    key === 'date' ||
    key === 'bt.date'
  ) {
    return resolveDateModule(key.replace(/^bt\./, ''), ctx.date);
  }
  // bt.file module
  if (key.startsWith('bt.file.') || key.startsWith('file.') || key === 'title') {
    return resolveFileModule(key === 'title' ? 'file.title' : key.replace(/^bt\./, ''), ctx);
  }
  // bt.frontmatter module
  if (key.startsWith('bt.frontmatter.') || key.startsWith('frontmatter.')) {
    return resolveFrontmatterModule(key.replace(/^bt\./, ''), ctx);
  }
  // bt.system module
  if (key.startsWith('bt.system.') || key.startsWith('system.') || key === 'uuid') {
    return resolveSystemModule(key === 'uuid' ? 'system.uuid' : key.replace(/^bt\./, ''));
  }
  // bt.config module
  if (key.startsWith('bt.config.') || key.startsWith('config.')) {
    return resolveConfigModule(key.replace(/^bt\./, ''), ctx);
  }
  // bt.vault module
  if (key.startsWith('bt.vault.') || key.startsWith('vault.')) {
    return resolveVaultModule(key.replace(/^bt\./, ''), ctx);
  }
  // value — captured text / user input
  if (key === 'value' && ctx.value !== undefined) {
    return ctx.value;
  }
  return null;
}

// ── Date module ──────────────────────────────────────────────────

function resolveDateModule(key: string, d: Date): string | null {
  // Date arithmetic: date.today+7, date.today-3
  const arithMatch = key.match(/^date\.(today|now)([+-]\d+)$/);
  if (arithMatch) {
    const offset = parseInt(arithMatch[2], 10);
    const shifted = new Date(d);
    shifted.setDate(shifted.getDate() + offset);
    return arithMatch[1] === 'now' ? shifted.toISOString() : formatISO(shifted);
  }

  switch (key) {
    case 'date.today':
    case 'date':
      return formatISO(d);
    case 'date.now':
      return d.toISOString();
    case 'date.year':
      return String(d.getFullYear());
    case 'date.month':
      return pad2(d.getMonth() + 1);
    case 'date.day':
      return pad2(d.getDate());
    case 'date.hour':
      return pad2(d.getHours());
    case 'date.minute':
      return pad2(d.getMinutes());
    case 'date.second':
      return pad2(d.getSeconds());
    case 'date.weekday':
      return d.toLocaleDateString('en-US', { weekday: 'long' });
    case 'date.weekday_short':
      return d.toLocaleDateString('en-US', { weekday: 'short' });
    case 'date.time':
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    case 'date.time24':
      return formatTime24(d);
    case 'date.tomorrow': {
      const t = new Date(d);
      t.setDate(t.getDate() + 1);
      return formatISO(t);
    }
    case 'date.yesterday': {
      const y = new Date(d);
      y.setDate(y.getDate() - 1);
      return formatISO(y);
    }
    case 'date.week':
      return String(getWeekNumber(d));
    case 'date.quarter':
      return `Q${Math.ceil((d.getMonth() + 1) / 3)}`;
    case 'date.unix':
      return String(Math.floor(d.getTime() / 1000));
    default:
      return null;
  }
}

// ── File module ──────────────────────────────────────────────────

function resolveFileModule(key: string, ctx: TemplateContext): string | null {
  switch (key) {
    case 'file.title':
      return ctx.noteTitle;
    case 'file.path':
      return ctx.notePath;
    case 'file.folder':
      return ctx.notePath.split('/').slice(0, -1).join('/') || '/';
    case 'file.name':
      return ctx.notePath.split('/').pop()?.replace(/\.md$/i, '') ?? '';
    case 'file.ext':
      return '.md';
    case 'file.created':
      return formatISO(ctx.date);
    case 'file.modified':
      return formatISO(ctx.date);
    default:
      return null;
  }
}

// ── Frontmatter module ───────────────────────────────────────────

function resolveFrontmatterModule(key: string, ctx: TemplateContext): string | null {
  if (!ctx.noteContent) return null;
  const fmKey = key.replace(/^frontmatter\./, '');
  if (!fmKey) return null;
  const { data } = parseFrontmatter(ctx.noteContent);
  const value = data[fmKey];
  if (value === undefined || value === null) return null;
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}

// ── System module ────────────────────────────────────────────────

function resolveSystemModule(key: string): string | null {
  switch (key) {
    case 'system.uuid':
      return generateUUID();
    case 'system.timestamp':
      return String(Date.now());
    case 'system.clipboard':
      return '{{clipboard}}';
    default:
      return null;
  }
}

// ── Config module ────────────────────────────────────────────────

function resolveConfigModule(key: string, ctx: TemplateContext): string | null {
  switch (key) {
    case 'config.dateformat':
      return ctx.dateFormat ?? 'yyyy-MM-dd';
    case 'config.timeformat':
      return ctx.timeFormat ?? '24h';
    case 'config.language':
      return ctx.language ?? 'en';
    case 'config.vaultname':
      return ctx.vaultName ?? '';
    default:
      return null;
  }
}

// ── Vault module ─────────────────────────────────────────────────

function resolveVaultModule(key: string, ctx: TemplateContext): string | null {
  switch (key) {
    case 'vault.name':
      return ctx.vaultName ?? '';
    case 'vault.notecount':
      return String(ctx.noteCount ?? 0);
    default:
      return null;
  }
}
