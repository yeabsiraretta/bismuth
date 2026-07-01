/**
 * MetaBind syntax parser — parses inline code blocks into declarations.
 *
 * Syntax:
 *   `INPUT[toggle:done]`
 *   `INPUT[slider:progress(min=0,max=100,step=5)]`
 *   `INPUT[select:status(choices=draft|review|done)]`
 *   `VIEW[progress:progress(max=100)]`
 *   `VIEW[rating:rating(maxStars=5)]`
 *   `BUTTON[Save:command(save-note)]`
 *   `BUTTON[Archive:update(lifecycle=archived)]`
 */

import { log } from '@/utils/logger';
import type {
  MetaBindDeclaration,
  InputFieldDeclaration,
  InputFieldType,
  InputFieldOptions,
  ViewFieldDeclaration,
  ViewFieldType,
  ViewFieldOptions,
  ButtonDeclaration,
  ButtonAction,
  ButtonOptions,
} from '../types/metabind';

// ─── Regex patterns ──────────────────────────────────────────────────────────

/** Matches INPUT[type:property] or INPUT[type:property(opts)] */
const INPUT_RE = /^INPUT\[(\w[\w-]*):(\w[\w.-]*)(?:\(([^)]*)\))?\]$/;

/** Matches VIEW[type:property] or VIEW[type:property(opts)] */
const VIEW_RE = /^VIEW\[(\w[\w-]*):(\w[\w.-]*)(?:\(([^)]*)\))?\]$/;

/** Matches BUTTON[label:action] or BUTTON[label:action(args)] */
const BUTTON_RE = /^BUTTON\[([^:\]]+):(\w+)(?:\(([^)]*)\))?\]$/;

const VALID_INPUT_TYPES = new Set<InputFieldType>([
  'toggle', 'text', 'number', 'slider', 'date', 'select',
  'textarea', 'suggester', 'multi-select', 'color', 'time',
]);

const VALID_VIEW_TYPES = new Set<ViewFieldType>([
  'text', 'number', 'date', 'list', 'link', 'progress',
  'rating', 'tags', 'boolean',
]);

const VALID_BUTTON_ACTIONS = new Set<ButtonAction>([
  'open', 'command', 'template', 'navigate', 'update', 'js',
]);

// ─── Options parsing ─────────────────────────────────────────────────────────

function parseKeyValuePairs(raw: string): Record<string, string> {
  const pairs: Record<string, string> = {};
  if (!raw) return pairs;
  for (const part of raw.split(',')) {
    const eqIdx = part.indexOf('=');
    if (eqIdx > 0) {
      pairs[part.slice(0, eqIdx).trim()] = part.slice(eqIdx + 1).trim();
    }
  }
  return pairs;
}

function parseInputOptions(raw: string | undefined): InputFieldOptions {
  if (!raw) return {};
  const kv = parseKeyValuePairs(raw);
  const opts: InputFieldOptions = {};
  if (kv['placeholder']) opts.placeholder = kv['placeholder'];
  if (kv['min'] !== undefined) opts.min = Number(kv['min']);
  if (kv['max'] !== undefined) opts.max = Number(kv['max']);
  if (kv['step'] !== undefined) opts.step = Number(kv['step']);
  if (kv['default']) opts.defaultValue = kv['default'];
  if (kv['class']) opts.cssClass = kv['class'];
  if (kv['choices']) opts.choices = kv['choices'].split('|').map(c => c.trim());
  return opts;
}

function parseViewOptions(raw: string | undefined): ViewFieldOptions {
  if (!raw) return {};
  const kv = parseKeyValuePairs(raw);
  const opts: ViewFieldOptions = {};
  if (kv['max'] !== undefined) opts.max = Number(kv['max']);
  if (kv['maxStars'] !== undefined) opts.maxStars = Number(kv['maxStars']);
  if (kv['format']) opts.format = kv['format'];
  if (kv['class']) opts.cssClass = kv['class'];
  return opts;
}

function parseButtonOptions(raw: string | undefined): ButtonOptions {
  if (!raw) return {};
  const kv = parseKeyValuePairs(raw);
  const opts: ButtonOptions = {};
  if (kv['class']) opts.cssClass = kv['class'];
  if (kv['icon']) opts.icon = kv['icon'];
  if (kv['style']) opts.style = kv['style'] as ButtonOptions['style'];
  return opts;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/** Parse a single inline code block content string. Returns null if not MetaBind syntax. */
export function parseMetaBindSyntax(text: string): MetaBindDeclaration | null {
  const trimmed = text.trim();

  // INPUT[type:property(opts)]
  const inputMatch = INPUT_RE.exec(trimmed);
  if (inputMatch) {
    const fieldType = inputMatch[1] as InputFieldType;
    if (!VALID_INPUT_TYPES.has(fieldType)) {
      log.debug('MetaBind: unknown input type', { fieldType });
      return null;
    }
    return {
      kind: 'input',
      fieldType,
      property: inputMatch[2],
      options: parseInputOptions(inputMatch[3]),
    } satisfies InputFieldDeclaration;
  }

  // VIEW[type:property(opts)]
  const viewMatch = VIEW_RE.exec(trimmed);
  if (viewMatch) {
    const fieldType = viewMatch[1] as ViewFieldType;
    if (!VALID_VIEW_TYPES.has(fieldType)) {
      log.debug('MetaBind: unknown view type', { fieldType });
      return null;
    }
    return {
      kind: 'view',
      fieldType,
      property: viewMatch[2],
      options: parseViewOptions(viewMatch[3]),
    } satisfies ViewFieldDeclaration;
  }

  // BUTTON[label:action(args)]
  const buttonMatch = BUTTON_RE.exec(trimmed);
  if (buttonMatch) {
    const action = buttonMatch[2] as ButtonAction;
    if (!VALID_BUTTON_ACTIONS.has(action)) {
      log.debug('MetaBind: unknown button action', { action });
      return null;
    }
    return {
      kind: 'button',
      label: buttonMatch[1].trim(),
      action,
      actionArgs: buttonMatch[3] || '',
      options: parseButtonOptions(undefined),
    } satisfies ButtonDeclaration;
  }

  return null;
}

/** Check if a string looks like MetaBind syntax (quick pre-check). */
export function isMetaBindSyntax(text: string): boolean {
  const t = text.trim();
  return t.startsWith('INPUT[') || t.startsWith('VIEW[') || t.startsWith('BUTTON[');
}
