/**
 * DQL (Dataview Query Language) parser.
 *
 * Parses a pipeline-style query string into a structured DvQuery AST.
 * Supports: TABLE, LIST, TASK
 * Clauses: FROM, WHERE, SORT, GROUP BY, FLATTEN, LIMIT
 */

import type {
  DvQuery,
  DvQueryType,
  DvFieldExpr,
  DvFromClause,
  DvSortClause,
  DvExpr,
} from '@/features/dataview/types/dataview';

class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParseError';
  }
}

/** Tokenize the query into clause segments. */
function splitClauses(input: string): Map<string, string> {
  const clauses = new Map<string, string>();
  const keywords = ['FROM', 'WHERE', 'SORT', 'GROUP BY', 'FLATTEN', 'LIMIT'];
  let remaining = input.trim();

  // Extract query type + field list on the first line
  const firstLineEnd = remaining.indexOf('\n');
  const firstLine = firstLineEnd >= 0 ? remaining.slice(0, firstLineEnd) : remaining;
  remaining = firstLineEnd >= 0 ? remaining.slice(firstLineEnd + 1).trim() : '';

  const typeMatch = /^(TABLE|LIST|TASK|CALENDAR)\b/i.exec(firstLine);
  if (!typeMatch) throw new ParseError('Query must start with TABLE, LIST, TASK, or CALENDAR');
  clauses.set('TYPE', typeMatch[1].toUpperCase());
  const afterType = firstLine.slice(typeMatch[0].length).trim();
  if (afterType) clauses.set('FIELDS', afterType);

  // Split remaining lines into clauses
  const lines = remaining
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  for (const line of lines) {
    let matched = false;
    for (const kw of keywords) {
      const re = new RegExp(`^${kw}\\b`, 'i');
      if (re.test(line)) {
        const body = line.slice(kw.length).trim();
        clauses.set(kw, body);
        matched = true;
        break;
      }
    }
    // If unmatched and FIELDS/FROM not set, treat as continuation of FROM
    if (!matched && !clauses.has('FROM') && /^[#"\/]/.test(line)) {
      clauses.set('FROM', line);
    }
  }

  return clauses;
}

/** Parse a field expression: `expr` or `expr AS "Alias"` */
function parseFieldExpr(raw: string): DvFieldExpr {
  const asMatch = /^(.+?)\s+[Aa][Ss]\s+"([^"]+)"$/.exec(raw.trim());
  if (asMatch) {
    return { expr: parseExpr(asMatch[1].trim()), alias: asMatch[2] };
  }
  const asMatch2 = /^(.+?)\s+[Aa][Ss]\s+(\S+)$/.exec(raw.trim());
  if (asMatch2) {
    return { expr: parseExpr(asMatch2[1].trim()), alias: asMatch2[2] };
  }
  return { expr: parseExpr(raw.trim()) };
}

/** Parse a FROM clause. */
function parseFrom(raw: string): DvFromClause {
  // Handle OR/AND combinators
  const orParts = raw.split(/\s+[Oo][Rr]\s+/);
  if (orParts.length > 1) {
    let clause = parseFromAtom(orParts[orParts.length - 1].trim());
    for (let i = orParts.length - 2; i >= 0; i--) {
      clause = { ...parseFromAtom(orParts[i].trim()), combinator: 'or', right: clause };
    }
    return clause;
  }

  const andParts = raw.split(/\s+[Aa][Nn][Dd]\s+/);
  if (andParts.length > 1) {
    let clause = parseFromAtom(andParts[andParts.length - 1].trim());
    for (let i = andParts.length - 2; i >= 0; i--) {
      clause = { ...parseFromAtom(andParts[i].trim()), combinator: 'and', right: clause };
    }
    return clause;
  }

  return parseFromAtom(raw);
}

function parseFromAtom(raw: string): DvFromClause {
  if (raw.startsWith('#')) return { type: 'tag', value: raw };
  if (raw.startsWith('"') && raw.endsWith('"')) return { type: 'folder', value: raw.slice(1, -1) };
  if (raw.startsWith('[[') && raw.endsWith(']]')) return { type: 'link', value: raw.slice(2, -2) };
  return { type: 'folder', value: raw };
}

/** Parse a SORT clause: `field ASC/DESC, ...` */
function parseSort(raw: string): DvSortClause[] {
  return raw.split(',').map((part) => {
    const trimmed = part.trim();
    const dirMatch = /\s+(asc|desc)$/i.exec(trimmed);
    const direction = dirMatch ? (dirMatch[1].toLowerCase() as 'asc' | 'desc') : 'asc';
    const fieldStr = dirMatch ? trimmed.slice(0, dirMatch.index).trim() : trimmed;
    return { field: parseExpr(fieldStr), direction };
  });
}

/** Parse an expression (supports binary comparisons, math, and basic field/literal). */
export function parseExpr(raw: string): DvExpr {
  const trimmed = raw.trim();

  // Parenthesized expression
  if (trimmed.startsWith('(') && findMatchingParen(trimmed, 0) === trimmed.length - 1) {
    return parseExpr(trimmed.slice(1, -1));
  }

  // Binary: AND / OR (lowest precedence)
  for (const op of ['or', 'and'] as const) {
    const idx = findBinaryOp(trimmed, op);
    if (idx > 0) {
      const opLen = op.length;
      return {
        type: 'binary',
        op,
        left: parseExpr(trimmed.slice(0, idx).trimEnd()),
        right: parseExpr(trimmed.slice(idx + opLen).trimStart()),
      };
    }
  }

  // Binary: comparisons
  for (const op of ['!=', '>=', '<=', '=', '>', '<', 'contains'] as const) {
    const re =
      op === 'contains'
        ? /\s+contains\s+/i
        : new RegExp(`\\s*${op.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`);
    const idx = trimmed.search(re);
    if (idx > 0) {
      const match = re.exec(trimmed)!;
      return {
        type: 'binary',
        op,
        left: parseExpr(trimmed.slice(0, idx)),
        right: parseExpr(trimmed.slice(idx + match[0].length)),
      };
    }
  }

  // Binary: additive (+, -) — left-to-right, lower precedence than multiplicative
  for (const op of ['+', '-'] as const) {
    const idx = findArithOp(trimmed, op);
    if (idx > 0) {
      return {
        type: 'binary',
        op,
        left: parseExpr(trimmed.slice(0, idx)),
        right: parseExpr(trimmed.slice(idx + 1)),
      };
    }
  }

  // Binary: multiplicative (*, /, %)
  for (const op of ['*', '/', '%'] as const) {
    const idx = findArithOp(trimmed, op);
    if (idx > 0) {
      return {
        type: 'binary',
        op,
        left: parseExpr(trimmed.slice(0, idx)),
        right: parseExpr(trimmed.slice(idx + 1)),
      };
    }
  }

  // Unary NOT
  if (/^!/.test(trimmed)) {
    return { type: 'unary', op: 'not', operand: parseExpr(trimmed.slice(1)) };
  }

  // Unary minus (only if not a number literal)
  if (trimmed.startsWith('-') && !/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return { type: 'unary', op: '-', operand: parseExpr(trimmed.slice(1)) };
  }

  // Function call: name(args)
  const fnMatch = /^(\w+)\((.*)\)$/.exec(trimmed);
  if (fnMatch && findMatchingParen(trimmed, fnMatch[1].length) === trimmed.length - 1) {
    const argsRaw = trimmed.slice(fnMatch[1].length + 1, -1);
    const args = argsRaw ? splitFieldList(argsRaw).map((a) => parseExpr(a.trim())) : [];
    return { type: 'function', name: fnMatch[1], args };
  }

  // List literal: [a, b, c]
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    const inner = trimmed.slice(1, -1).trim();
    if (!inner) return { type: 'literal', value: [] };
    const items = splitFieldList(inner).map((a) => {
      const parsed = parseExpr(a.trim());
      return parsed.type === 'literal' ? parsed.value : a.trim();
    });
    return { type: 'literal', value: items };
  }

  // String literal
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return { type: 'literal', value: trimmed.slice(1, -1) };
  }

  // Number literal
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return { type: 'literal', value: Number(trimmed) };
  }

  // Duration literal: dur("1d"), dur("2h30m")
  if (/^dur\("([^"]+)"\)$/.test(trimmed)) {
    const durStr = /^dur\("([^"]+)"\)$/.exec(trimmed)![1];
    return { type: 'literal', value: parseDuration(durStr) };
  }

  // Boolean literal
  if (trimmed.toLowerCase() === 'true') return { type: 'literal', value: true };
  if (trimmed.toLowerCase() === 'false') return { type: 'literal', value: false };
  if (trimmed.toLowerCase() === 'null') return { type: 'literal', value: null };

  // Date literal
  if (/^date\("([^"]+)"\)$/.exec(trimmed)) {
    const dateStr = /^date\("([^"]+)"\)$/.exec(trimmed)![1];
    return { type: 'literal', value: new Date(dateStr) };
  }

  // Field reference (dot-separated path)
  return { type: 'field', path: trimmed };
}

/** Find matching closing paren for paren at `start`. */
function findMatchingParen(str: string, start: number): number {
  let depth = 0;
  for (let i = start; i < str.length; i++) {
    if (str[i] === '(') depth++;
    else if (str[i] === ')') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/** Find a binary keyword operator (and/or) outside parens/quotes. */
function findBinaryOp(str: string, op: string): number {
  let depth = 0;
  let inStr = '';
  const opRe = new RegExp(`\\s+${op}\\s+`, 'i');
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (inStr) {
      if (ch === inStr) inStr = '';
      continue;
    }
    if (ch === '"' || ch === "'") {
      inStr = ch;
      continue;
    }
    if (ch === '(' || ch === '[') {
      depth++;
      continue;
    }
    if (ch === ')' || ch === ']') {
      depth--;
      continue;
    }
    if (depth === 0) {
      const sub = str.slice(i);
      const m = opRe.exec(sub);
      if (m && m.index === 0) return i;
    }
  }
  return -1;
}

/** Find an arithmetic operator (+,-,*,/,%) outside parens/quotes, scanning right-to-left. */
function findArithOp(str: string, op: string): number {
  let depth = 0;
  let inStr = '';
  for (let i = str.length - 1; i >= 0; i--) {
    const ch = str[i];
    if (inStr) {
      if (ch === inStr) inStr = '';
      continue;
    }
    if (ch === '"' || ch === "'") {
      inStr = ch;
      continue;
    }
    if (ch === ')' || ch === ']') {
      depth++;
      continue;
    }
    if (ch === '(' || ch === '[') {
      depth--;
      continue;
    }
    if (depth === 0 && ch === op) {
      // For '-', skip if it's a unary minus (start of string or after operator)
      if (op === '-' && (i === 0 || /[=<>!+\-*/%,(]/.test(str[i - 1].trim() || '('))) continue;
      return i;
    }
  }
  return -1;
}

/** Parse a duration string like "1d2h30m" into milliseconds. */
function parseDuration(dur: string): number {
  let ms = 0;
  const parts = dur.matchAll(/(\d+)\s*(d|h|m|s)/gi);
  for (const p of parts) {
    const n = parseInt(p[1], 10);
    switch (p[2].toLowerCase()) {
      case 'd':
        ms += n * 86400000;
        break;
      case 'h':
        ms += n * 3600000;
        break;
      case 'm':
        ms += n * 60000;
        break;
      case 's':
        ms += n * 1000;
        break;
    }
  }
  return ms;
}

/**
 * Parse a DQL query string into a DvQuery AST.
 * @throws {ParseError} on invalid syntax.
 */
export function parseQuery(input: string): DvQuery {
  const clauses = splitClauses(input);
  const queryType = clauses.get('TYPE')!.toLowerCase() as DvQueryType;

  const fields: DvFieldExpr[] = [];
  const fieldsRaw = clauses.get('FIELDS');
  if (fieldsRaw && (queryType === 'table' || queryType === 'calendar')) {
    // Split on commas not inside parens/quotes
    const parts = splitFieldList(fieldsRaw);
    fields.push(...parts.map(parseFieldExpr));
  }

  return {
    type: queryType,
    fields,
    from: clauses.has('FROM') ? parseFrom(clauses.get('FROM')!) : null,
    where: clauses.has('WHERE') ? parseExpr(clauses.get('WHERE')!) : null,
    sort: clauses.has('SORT') ? parseSort(clauses.get('SORT')!) : [],
    groupBy: clauses.has('GROUP BY') ? parseExpr(clauses.get('GROUP BY')!) : null,
    flatten: clauses.has('FLATTEN') ? parseFieldExpr(clauses.get('FLATTEN')!) : null,
    limit: clauses.has('LIMIT') ? parseInt(clauses.get('LIMIT')!, 10) : null,
  };
}

/** Split a comma-separated field list, respecting parentheses. */
function splitFieldList(raw: string): string[] {
  const parts: string[] = [];
  let current = '';
  let depth = 0;
  for (const ch of raw) {
    if (ch === '(' || ch === '[') depth++;
    else if (ch === ')' || ch === ']') depth--;
    if (ch === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}
