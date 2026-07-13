/**
 * Dataview Query Executor — runs parsed DQL queries against the note index.
 *
 * Pipeline: source filter → WHERE → FLATTEN → SORT → GROUP BY → LIMIT → project fields.
 */

import type {
  CompareOp,
  DataviewQuery,
  FieldRef,
  QuerySource,
  SortSpec,
  WhereCondition,
} from '@/hubs/knowledge/services/dataview-query';
import {
  getFieldValue,
  type NoteRecord,
  type TaskItem,
} from '@/hubs/knowledge/services/note-index';

// ── Result types ─────────────────────────────────────────────────────────────

export interface QueryResultRow {
  record: NoteRecord;
  values: Map<string, unknown>;
}

interface QueryResultGroup {
  key: unknown;
  rows: QueryResultRow[];
}

export interface QueryResult {
  mode: DataviewQuery['mode'];
  fields: FieldRef[];
  rows: QueryResultRow[];
  groups: QueryResultGroup[];
  tasks: TaskItem[];
  calendarField: string | null;
}

// ── Executor ─────────────────────────────────────────────────────────────────

export function executeDataviewQuery(query: DataviewQuery, index: NoteRecord[]): QueryResult {
  let records = [...index];

  // ── FROM: source filtering ──
  if (query.sources.length > 0) {
    records = records.filter((r) => matchesSources(r, query.sources));
  }

  // ── WHERE: condition filtering ──
  if (query.where.length > 0) {
    records = records.filter((r) => evaluateWhere(r, query.where));
  }

  // ── FLATTEN ──
  if (query.flattenField) {
    records = flattenRecords(records, query.flattenField);
  }

  // ── SORT ──
  if (query.sort.length > 0) {
    records = applySort(records, query.sort);
  }

  // ── LIMIT ──
  if (query.limit !== null && query.limit > 0) {
    records = records.slice(0, query.limit);
  }

  // ── Project rows ──
  const rows: QueryResultRow[] = records.map((r) => ({
    record: r,
    values: projectFields(r, query.fields),
  }));

  // ── GROUP BY ──
  let groups: QueryResultGroup[] = [];
  if (query.groupBy) {
    groups = applyGroupBy(rows, query.groupBy);
  }

  // ── TASK mode: extract tasks ──
  let tasks: TaskItem[] = [];
  if (query.mode === 'TASK') {
    tasks = records.flatMap((r) => r.tasks);
  }

  // ── CALENDAR: identify date field ──
  const calendarField =
    query.mode === 'CALENDAR' && query.fields.length > 0 ? query.fields[0].path : null;

  return { mode: query.mode, fields: query.fields, rows, groups, tasks, calendarField };
}

// ── Source matching ──────────────────────────────────────────────────────────

function matchesSources(record: NoteRecord, sources: QuerySource[]): boolean {
  for (const source of sources) {
    const matched = matchSource(record, source);
    if (source.negate ? matched : !matched) return false;
  }
  return true;
}

function matchSource(record: NoteRecord, source: QuerySource): boolean {
  switch (source.type) {
    case 'folder':
      return record.file.path.startsWith(source.value + '/') || record.file.folder === source.value;
    case 'tag':
      return record.file.tags.some((t) => t === source.value || t.startsWith(source.value + '/'));
    case 'link':
      return (
        record.file.outlinks.some((l) => l.toLowerCase() === source.value.toLowerCase()) ||
        record.file.inlinks.some((l) => l.toLowerCase() === source.value.toLowerCase())
      );
    case 'all':
      return true;
  }
}

// ── WHERE evaluation ─────────────────────────────────────────────────────────

function evaluateWhere(record: NoteRecord, conditions: WhereCondition[]): boolean {
  if (conditions.length === 0) return true;

  let result = evaluateCondition(record, conditions[0]);

  for (let i = 1; i < conditions.length; i++) {
    const cond = conditions[i];
    const val = evaluateCondition(record, cond);

    if (cond.logic === 'OR') {
      result = result || val;
    } else {
      result = result && val;
    }
  }

  return result;
}

function evaluateCondition(record: NoteRecord, cond: WhereCondition): boolean {
  const fieldValue = resolveField(record, cond.field);
  return compareValues(fieldValue, cond.op, cond.value);
}

function resolveField(record: NoteRecord, fieldPath: string): unknown {
  if (fieldPath.startsWith('file.')) {
    return getFieldValue(record, fieldPath);
  }
  if (fieldPath in record.frontmatter) {
    return record.frontmatter[fieldPath];
  }
  if (fieldPath in record.fields) {
    return record.fields[fieldPath];
  }
  return getFieldValue(record, fieldPath);
}

export function compareValues(left: unknown, op: CompareOp, right: unknown): boolean {
  if (left === undefined || left === null) {
    if (op === '=' && (right === null || right === undefined)) return true;
    if (op === '!=' && right !== null && right !== undefined) return true;
    return false;
  }

  switch (op) {
    case '=':
      return String(left) === String(right);
    case '!=':
      return String(left) !== String(right);
    case '>':
      return Number(left) > Number(right);
    case '<':
      return Number(left) < Number(right);
    case '>=':
      return Number(left) >= Number(right);
    case '<=':
      return Number(left) <= Number(right);
    case 'contains': {
      if (Array.isArray(left)) return left.some((v) => String(v) === String(right));
      return String(left).toLowerCase().includes(String(right).toLowerCase());
    }
    case '!contains': {
      if (Array.isArray(left)) return !left.some((v) => String(v) === String(right));
      return !String(left).toLowerCase().includes(String(right).toLowerCase());
    }
  }
}

// ── SORT ─────────────────────────────────────────────────────────────────────

function applySort(records: NoteRecord[], specs: SortSpec[]): NoteRecord[] {
  return [...records].sort((a, b) => {
    for (const spec of specs) {
      const av = resolveField(a, spec.field);
      const bv = resolveField(b, spec.field);
      const cmp = compareSortValues(av, bv);
      if (cmp !== 0) return spec.direction === 'DESC' ? -cmp : cmp;
    }
    return 0;
  });
}

function compareSortValues(a: unknown, b: unknown): number {
  if (a === b) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b));
}

// ── GROUP BY ─────────────────────────────────────────────────────────────────

function applyGroupBy(rows: QueryResultRow[], field: string): QueryResultGroup[] {
  const groups = new Map<string, QueryResultGroup>();

  for (const row of rows) {
    const key = resolveField(row.record, field);
    const keyStr = String(key ?? 'undefined');
    let group = groups.get(keyStr);
    if (!group) {
      group = { key, rows: [] };
      groups.set(keyStr, group);
    }
    group.rows.push(row);
  }

  return Array.from(groups.values());
}

// ── FLATTEN ──────────────────────────────────────────────────────────────────

function flattenRecords(records: NoteRecord[], field: string): NoteRecord[] {
  const result: NoteRecord[] = [];

  for (const record of records) {
    const value = resolveField(record, field);
    if (Array.isArray(value)) {
      for (const item of value) {
        const clone: NoteRecord = { ...record, [field]: item };
        result.push(clone);
      }
    } else {
      result.push(record);
    }
  }

  return result;
}

// ── Field projection ─────────────────────────────────────────────────────────

function projectFields(record: NoteRecord, fields: FieldRef[]): Map<string, unknown> {
  const values = new Map<string, unknown>();

  for (const f of fields) {
    const key = f.alias ?? f.path;
    values.set(key, resolveField(record, f.path));
  }

  return values;
}
