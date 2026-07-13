/**
 * Dataview Query Language (DQL) parser.
 *
 * Parses Dataview-compatible query strings into an AST that the executor
 * can evaluate against the note index.
 *
 * Supported syntax:
 *   TABLE field1 [AS "Alias"], field2 FROM "folder" WHERE condition SORT field ASC LIMIT n
 *   LIST [field] FROM #tag WHERE ... SORT ... GROUP BY field FLATTEN field
 *   TASK FROM ...
 *   CALENDAR date-field FROM ...
 */

// ── AST types ────────────────────────────────────────────────────────────────

type OutputMode = 'TABLE' | 'LIST' | 'TASK' | 'CALENDAR';

export interface FieldRef {
  path: string;
  alias?: string;
}

export interface QuerySource {
  type: 'folder' | 'tag' | 'link' | 'all';
  value: string;
  negate?: boolean;
}

export type CompareOp = '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | '!contains';

export interface WhereCondition {
  field: string;
  op: CompareOp;
  value: unknown;
  logic?: 'AND' | 'OR';
}

export interface SortSpec {
  field: string;
  direction: 'ASC' | 'DESC';
}

export interface DataviewQuery {
  mode: OutputMode;
  fields: FieldRef[];
  sources: QuerySource[];
  where: WhereCondition[];
  sort: SortSpec[];
  groupBy: string | null;
  flattenField: string | null;
  limit: number | null;
  raw: string;
}

// ── Parser ───────────────────────────────────────────────────────────────────

export function parseDataviewQuery(raw: string): DataviewQuery {
  const query: DataviewQuery = {
    mode: 'TABLE',
    fields: [],
    sources: [],
    where: [],
    sort: [],
    groupBy: null,
    flattenField: null,
    limit: null,
    raw,
  };

  const cleaned = raw.trim().replace(/\n/g, ' ');
  let remaining = cleaned;

  // ── Output mode ──
  const modeMatch = remaining.match(/^(TABLE|LIST|TASK|CALENDAR)\b/i);
  if (modeMatch) {
    query.mode = modeMatch[1].toUpperCase() as OutputMode;
    remaining = remaining.slice(modeMatch[0].length).trim();
  }

  // ── Extract clauses (case-insensitive, order-independent) ──
  const clauses = splitClauses(remaining);

  // ── Fields (before first clause keyword) ──
  if (clauses.preamble.trim()) {
    query.fields = parseFields(clauses.preamble.trim());
  }

  // ── FROM ──
  if (clauses.from) {
    query.sources = parseSources(clauses.from);
  }

  // ── WHERE ──
  if (clauses.where) {
    query.where = parseWhere(clauses.where);
  }

  // ── SORT / SORT BY ──
  if (clauses.sort) {
    query.sort = parseSort(clauses.sort);
  }

  // ── GROUP BY ──
  if (clauses.groupBy) {
    query.groupBy = clauses.groupBy.trim();
  }

  // ── FLATTEN ──
  if (clauses.flatten) {
    query.flattenField = clauses.flatten.trim();
  }

  // ── LIMIT ──
  if (clauses.limit) {
    const n = parseInt(clauses.limit.trim(), 10);
    if (!isNaN(n)) query.limit = n;
  }

  return query;
}

// ── Clause splitter ──────────────────────────────────────────────────────────

interface Clauses {
  preamble: string;
  from?: string;
  where?: string;
  sort?: string;
  groupBy?: string;
  flatten?: string;
  limit?: string;
}

const CLAUSE_RE = /\b(FROM|WHERE|SORT(?:\s+BY)?|GROUP\s+BY|FLATTEN|LIMIT)\b/gi;

function splitClauses(text: string): Clauses {
  const result: Clauses = { preamble: '' };
  const matches: { keyword: string; index: number }[] = [];

  let match: RegExpExecArray | null;
  CLAUSE_RE.lastIndex = 0;
  while ((match = CLAUSE_RE.exec(text)) !== null) {
    matches.push({ keyword: match[1].toUpperCase().replace(/\s+/g, ' '), index: match.index });
  }

  if (matches.length === 0) {
    result.preamble = text;
    return result;
  }

  result.preamble = text.slice(0, matches[0].index);

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index + matches[i].keyword.length;
    const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
    const body = text.slice(start, end).trim();
    const kw = matches[i].keyword;

    if (kw === 'FROM') result.from = body;
    else if (kw === 'WHERE') result.where = body;
    else if (kw.startsWith('SORT')) result.sort = body;
    else if (kw === 'GROUP BY') result.groupBy = body;
    else if (kw === 'FLATTEN') result.flatten = body;
    else if (kw === 'LIMIT') result.limit = body;
  }

  return result;
}

// ── Field parser ─────────────────────────────────────────────────────────────

function parseFields(text: string): FieldRef[] {
  return text
    .split(',')
    .map((segment) => {
      const asMatch = segment.match(/(.+?)\s+AS\s+"([^"]+)"/i);
      if (asMatch) {
        return { path: asMatch[1].trim(), alias: asMatch[2] };
      }
      const asMatch2 = segment.match(/(.+?)\s+AS\s+(\S+)/i);
      if (asMatch2) {
        return { path: asMatch2[1].trim(), alias: asMatch2[2] };
      }
      return { path: segment.trim() };
    })
    .filter((f) => f.path.length > 0);
}

// ── Source parser ────────────────────────────────────────────────────────────

function parseSources(text: string): QuerySource[] {
  const sources: QuerySource[] = [];
  const parts = text
    .split(/\b(?:AND|OR)\b/i)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const part of parts) {
    const negated = part.startsWith('!') || part.startsWith('-');
    const clean = negated ? part.slice(1).trim() : part;

    if (clean.startsWith('#')) {
      sources.push({ type: 'tag', value: clean.slice(1), negate: negated });
    } else if (clean.startsWith('"') && clean.endsWith('"')) {
      sources.push({ type: 'folder', value: clean.slice(1, -1), negate: negated });
    } else if (clean.startsWith('[[') && clean.endsWith(']]')) {
      sources.push({ type: 'link', value: clean.slice(2, -2), negate: negated });
    } else if (clean) {
      sources.push({ type: 'folder', value: clean.replace(/^["']|["']$/g, ''), negate: negated });
    }
  }

  return sources;
}

// ── WHERE parser ─────────────────────────────────────────────────────────────

function parseWhere(text: string): WhereCondition[] {
  const conditions: WhereCondition[] = [];
  const parts = text.split(/\b(AND|OR)\b/i);
  let pendingLogic: 'AND' | 'OR' | undefined;

  for (const part of parts) {
    const trimmed = part.trim();
    if (/^AND$/i.test(trimmed)) {
      pendingLogic = 'AND';
      continue;
    }
    if (/^OR$/i.test(trimmed)) {
      pendingLogic = 'OR';
      continue;
    }
    if (!trimmed) continue;

    const cond = parseCondition(trimmed);
    if (cond) {
      cond.logic = pendingLogic;
      conditions.push(cond);
      pendingLogic = undefined;
    }
  }

  return conditions;
}

const OPS: [RegExp, CompareOp][] = [
  [/!=/, '!='],
  [/>=/, '>='],
  [/<=/, '<='],
  [/=/, '='],
  [/>/, '>'],
  [/</, '<'],
  [/\bcontains\b/i, 'contains'],
  [/!\s*contains\b/i, '!contains'],
];

function parseCondition(text: string): WhereCondition | null {
  for (const [re, op] of OPS) {
    const idx = text.search(re);
    if (idx === -1) continue;
    const matchLen = text.match(re)?.[0].length ?? op.length;
    const field = text.slice(0, idx).trim();
    const rawValue = text.slice(idx + matchLen).trim();
    if (!field) continue;
    return { field, op, value: parseValue(rawValue) };
  }
  return null;
}

function parseValue(raw: string): unknown {
  const unquoted = raw.replace(/^["']|["']$/g, '');
  if (raw !== unquoted) return unquoted;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (raw === 'null' || raw === 'empty') return null;
  const num = Number(raw);
  if (!isNaN(num) && raw.trim() !== '') return num;
  return raw;
}

// ── SORT parser ──────────────────────────────────────────────────────────────

function parseSort(text: string): SortSpec[] {
  return text
    .split(',')
    .map((s) => {
      const parts = s.trim().split(/\s+/);
      const field = parts[0] ?? '';
      const direction: 'ASC' | 'DESC' = parts[1]?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
      return { field, direction };
    })
    .filter((s) => s.field.length > 0);
}
