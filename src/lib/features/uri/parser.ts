/**
 * Advanced URI parser — parses `bismuth://action?params` URLs into typed objects.
 *
 * Supports the full set of Advanced URI actions: open, edit, create, daily,
 * command, search, searchreplace, frontmatter, canvas, workspace, bookmark.
 */

import type { ParsedUri, UriAction, WriteMode } from './types';

const SCHEME = 'bismuth://';

const VALID_ACTIONS = new Set<UriAction>([
  'open',
  'edit',
  'create',
  'daily',
  'command',
  'search',
  'searchreplace',
  'frontmatter',
  'canvas',
  'workspace',
  'bookmark',
  'annotate',
]);

/**
 * Parses a bismuth:// URI string into a structured ParsedUri.
 * Returns null if the URI is invalid.
 */
export function parseAdvancedUri(uri: string): ParsedUri | null {
  if (!uri.startsWith(SCHEME)) return null;

  const rest = uri.slice(SCHEME.length);
  const qIdx = rest.indexOf('?');
  const actionStr = qIdx >= 0 ? rest.slice(0, qIdx) : rest;
  const queryStr = qIdx >= 0 ? rest.slice(qIdx + 1) : '';

  if (!actionStr || !VALID_ACTIONS.has(actionStr as UriAction)) return null;

  const raw = parseQueryString(queryStr);

  return {
    action: actionStr as UriAction,
    vault: raw['vault'],
    filepath: raw['filepath'],
    heading: raw['heading'],
    block: raw['block'],
    line: raw['line'] ? parseInt(raw['line'], 10) : undefined,
    data: raw['data'],
    clipboard: raw['clipboard'] === 'true',
    mode: parseWriteMode(raw['mode']),
    commandid: raw['commandid'],
    query: raw['query'],
    search: raw['search'],
    replace: raw['replace'],
    regex: raw['regex'] === 'true',
    frontmatterkey: raw['frontmatterkey'],
    canvasid: raw['canvasid'],
    x: raw['x'] ? parseFloat(raw['x']) : undefined,
    y: raw['y'] ? parseFloat(raw['y']) : undefined,
    zoom: raw['zoom'] ? parseFloat(raw['zoom']) : undefined,
    workspace: raw['workspace'],
    bookmark: raw['bookmark'],
    ifnotexists: raw['ifnotexists'] === 'true',
    newpane: raw['newpane'] === 'true',
    viewmode: parseViewMode(raw['viewmode']),
    raw,
  };
}

/**
 * Builds a bismuth:// URI string from an action and parameters.
 */
export function buildAdvancedUri(
  action: UriAction,
  params: Record<string, string | number | boolean | undefined>
): string {
  const filtered: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== false && v !== '') {
      filtered[k] = String(v);
    }
  }
  const qs = Object.entries(filtered)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return `${SCHEME}${action}${qs ? '?' + qs : ''}`;
}

/** Parses a query string into key-value pairs with URI decoding. */
function parseQueryString(qs: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!qs) return result;
  for (const pair of qs.split('&')) {
    const eqIdx = pair.indexOf('=');
    if (eqIdx < 0) {
      result[decodeURIComponent(pair)] = 'true';
    } else {
      const key = decodeURIComponent(pair.slice(0, eqIdx));
      const value = decodeURIComponent(pair.slice(eqIdx + 1));
      result[key] = value;
    }
  }
  return result;
}

function parseWriteMode(value: string | undefined): WriteMode | undefined {
  if (value === 'overwrite' || value === 'append' || value === 'prepend' || value === 'new') {
    return value;
  }
  return undefined;
}

function parseViewMode(value: string | undefined): 'source' | 'preview' | 'live' | undefined {
  if (value === 'source' || value === 'preview' || value === 'live') {
    return value;
  }
  return undefined;
}
