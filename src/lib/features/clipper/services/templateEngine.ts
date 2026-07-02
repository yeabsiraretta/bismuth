/**
 * Template engine for ReadItLater / Web Clipper.
 * Renders templates with variable substitution and filter support.
 *
 * Syntax: {{ variableName | filter1 | filter2 }}
 * Dot notation: {{ author.name }}
 *
 * Filters:
 *   blockquote   — wrap each line with >
 *   capitalize   — capitalize first letter
 *   lower        — lowercase
 *   upper        — uppercase
 *   replace(a,b) — replace substring a with b
 *   numberLexify — add commas to numbers (1000 → 1,000)
 */

import type { TemplateContext, ContentType, ClipperConfig } from '../types';
import { DEFAULT_TEMPLATES } from '../types';

const TEMPLATE_RE = /\{\{\s*([^}]+?)\s*\}\}/g;

/** Render a template string with the given context variables. */
export function renderTemplate(template: string, ctx: TemplateContext): string {
  return template.replace(TEMPLATE_RE, (_match, expr: string) => {
    const parsed = parseExpression(expr.trim());
    if (!parsed) return '';
    let value = resolveValue(parsed.key, ctx);
    for (const filter of parsed.filters) {
      value = applyFilter(value, filter);
    }
    return value;
  });
}

interface ParsedExpr {
  key: string;
  filters: FilterCall[];
}

interface FilterCall {
  name: string;
  args: string[];
}

/** Parse a template expression like "author.name | upper | replace(a,b)" */
function parseExpression(expr: string): ParsedExpr | null {
  const parts = expr.split('|').map((s) => s.trim());
  if (parts.length === 0) return null;

  const key = parts[0];
  const filters: FilterCall[] = [];

  for (let i = 1; i < parts.length; i++) {
    const f = parts[i];
    const argMatch = f.match(/^(\w+)\((.+)\)$/);
    if (argMatch) {
      filters.push({
        name: argMatch[1],
        args: argMatch[2].split(',').map((a) => a.trim()),
      });
    } else {
      filters.push({ name: f, args: [] });
    }
  }

  return { key, filters };
}

/** Resolve a dotted key from context. */
function resolveValue(key: string, ctx: TemplateContext): string {
  const parts = key.split('.');
  let current: unknown = ctx;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return '';
    current = (current as Record<string, unknown>)[part];
  }
  return current != null ? String(current) : '';
}

/** Apply a filter to a string value. */
function applyFilter(value: string, filter: FilterCall): string {
  switch (filter.name) {
    case 'blockquote':
      return value
        .split('\n')
        .map((l) => `> ${l}`)
        .join('\n');
    case 'capitalize':
      return value.charAt(0).toUpperCase() + value.slice(1);
    case 'lower':
      return value.toLowerCase();
    case 'upper':
      return value.toUpperCase();
    case 'numberLexify': {
      const n = Number(value);
      return isNaN(n) ? value : n.toLocaleString();
    }
    case 'replace': {
      if (filter.args.length < 2) return value;
      return value.split(filter.args[0]).join(filter.args[1]);
    }
    default:
      return value;
  }
}

/** Get the template for a content type, using user overrides or defaults. */
export function getTemplates(
  contentType: ContentType,
  config: ClipperConfig
): { title: string; content: string } {
  const override = config.contentTypeSettings[contentType];
  const defaults = DEFAULT_TEMPLATES[contentType];
  return {
    title: override?.titleTemplate ?? defaults.title,
    content: override?.contentTemplate ?? defaults.content,
  };
}

/** Generate a safe filename from a title. */
export function sanitizeFilename(title: string): string {
  return title
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
}

/** Render the inbox directory path using template variables. */
export function resolveInboxDir(
  template: string,
  vars: { date: string; fileName: string; contentType: string }
): string {
  return renderTemplate(template, vars);
}

/** Load clipper config from localStorage. */
export function loadClipperConfig(): ClipperConfig {
  try {
    const raw = localStorage.getItem('bismuth-clipper-config');
    if (raw) return JSON.parse(raw);
  } catch {
    /* use defaults */
  }
  return {
    inboxDir: 'ReadItLater Inbox',
    assetsDir: 'ReadItLater Inbox/assets',
    dateFormat: 'YYYY-MM-DD',
    batchDelimiter: '\n',
    downloadImages: false,
    footnoteSectionHeading: '',
    contentTypeSettings: {},
  };
}

/** Save clipper config to localStorage. */
export function saveClipperConfig(config: ClipperConfig): void {
  try {
    localStorage.setItem('bismuth-clipper-config', JSON.stringify(config));
  } catch {
    /* noop */
  }
}
