/**
 * Dataview query engine — evaluates DvQuery ASTs against vault pages.
 *
 * Provides filtering (WHERE), sorting (SORT), grouping (GROUP BY),
 * and projection (TABLE fields / LIST / TASK) over indexed page data.
 */

import type {
  DvQuery,
  DvPage,
  DvValue,
  DvExpr,
  DvResult,
  DvTableResult,
  DvListResult,
  DvTaskResult,
  DvCalendarResult,
  DvGroupedResult,
  DvLink,
  DvFromClause,
  DvTask,
} from '@/features/dataview/types/dataview';
import { DV_AUTO_LIMIT } from '@/features/dataview/types/dataview';
import { evaluateExpr, isTruthy, compareValues, exprToString } from './exprEvaluator';

export { evaluateExpr } from './exprEvaluator';

/**
 * Execute a parsed query against a set of pages.
 */
export function executeQuery(query: DvQuery, pages: DvPage[]): DvResult {
  const t0 = performance.now();
  let filtered = pages;

  // 1. FROM filter
  if (query.from) filtered = filterFrom(filtered, query.from);

  // 2. WHERE filter
  if (query.where) filtered = filtered.filter((p) => isTruthy(evaluateExpr(query.where!, p)));

  const filterMs = performance.now() - t0;
  const unfilteredCount = filtered.length;

  // 3. FLATTEN — expand array fields into separate rows
  if (query.flatten) {
    filtered = applyFlatten(filtered, query.flatten);
  }

  // 4. SORT
  if (query.sort.length > 0) {
    filtered.sort((a, b) => {
      for (const clause of query.sort) {
        const va = evaluateExpr(clause.field, a);
        const vb = evaluateExpr(clause.field, b);
        const cmp = compareValues(va, vb);
        if (cmp !== 0) return clause.direction === 'desc' ? -cmp : cmp;
      }
      return 0;
    });
  }

  // 5. LIMIT (explicit or auto-limit)
  const effectiveLimit = query.limit ?? DV_AUTO_LIMIT;
  const autoLimited = query.limit === null && filtered.length > effectiveLimit;
  if (effectiveLimit > 0) {
    filtered = filtered.slice(0, effectiveLimit);
  }

  // 6. GROUP BY
  if (query.groupBy) {
    const result: DvResult = buildGroupedResult(query, filtered);
    const renderMs = performance.now() - t0 - filterMs;
    result.timing = {
      totalMs: performance.now() - t0,
      filterMs,
      renderMs,
      autoLimited,
      unfilteredCount,
    };
    return result;
  }

  // 7. Project result
  let result: DvResult;
  switch (query.type) {
    case 'table':
      result = buildTableResult(query, filtered);
      break;
    case 'list':
      result = buildListResult(query, filtered);
      break;
    case 'task':
      result = buildTaskResult(query, filtered);
      break;
    case 'calendar':
      result = buildCalendarResult(query, filtered);
      break;
    default:
      result = buildListResult(query, filtered);
  }

  const renderMs = performance.now() - t0 - filterMs;
  result.timing = {
    totalMs: performance.now() - t0,
    filterMs,
    renderMs,
    autoLimited,
    unfilteredCount,
  };
  return result;
}

// ─── FROM filtering ──────────────────────────────────────────────────────────

function filterFrom(pages: DvPage[], from: DvFromClause): DvPage[] {
  const matches = pages.filter((p) => matchesFrom(p, from));
  return matches;
}

function matchesFrom(page: DvPage, from: DvFromClause): boolean {
  let result = matchesFromAtom(page, from);

  if (from.combinator && from.right) {
    const rightResult = matchesFrom(page, from.right);
    result = from.combinator === 'or' ? result || rightResult : result && rightResult;
  }

  return result;
}

function matchesFromAtom(page: DvPage, from: DvFromClause): boolean {
  switch (from.type) {
    case 'folder':
      return page.file.folder.startsWith(from.value) || page.path.startsWith(from.value);
    case 'tag':
      return page.tags.some((t) => `#${t}` === from.value || `#${t}`.startsWith(`${from.value}/`));
    case 'link':
      return page.file.outlinks.some((l) => l.path === from.value);
    case 'all':
      return true;
  }
}

// ─── Result builders ─────────────────────────────────────────────────────────

function buildTableResult(query: DvQuery, pages: DvPage[]): DvTableResult {
  const headers = ['File', ...query.fields.map((f) => f.alias || exprToString(f.expr))];
  const rows = pages.map((p) => {
    const fileCell: DvLink = { type: 'link', path: p.path, display: p.file.name };
    const fieldCells = query.fields.map((f) => evaluateExpr(f.expr, p));
    return [fileCell as DvValue, ...fieldCells];
  });
  return { type: 'table', headers, rows, totalCount: rows.length };
}

function buildListResult(query: DvQuery, pages: DvPage[]): DvListResult {
  const items = pages.map((p) => ({
    value:
      query.fields.length > 0 ? evaluateExpr(query.fields[0].expr, p) : (p.file.name as DvValue),
    page: { type: 'link' as const, path: p.path, display: p.file.name },
  }));
  return { type: 'list', items, totalCount: items.length };
}

function buildTaskResult(query: DvQuery, pages: DvPage[]): DvTaskResult {
  let tasks: DvTask[] = pages.flatMap((p) => p.file.tasks);
  if (query.where) {
    tasks = tasks.filter((t) => {
      const pseudo: DvPage = {
        path: t.path,
        file: {} as any,
        fields: { text: t.text, completed: t.completed, line: t.line },
        inlineFields: [],
        tags: t.tags,
        sections: [],
      };
      return isTruthy(evaluateExpr(query.where!, pseudo));
    });
  }
  return { type: 'task', tasks, totalCount: tasks.length };
}

function buildCalendarResult(query: DvQuery, pages: DvPage[]): DvCalendarResult {
  const dateExpr =
    query.fields.length > 0 ? query.fields[0].expr : { type: 'field' as const, path: 'file.day' };
  const items: Array<{ date: Date; value: DvValue; page: DvLink }> = [];
  for (const p of pages) {
    const dateVal = evaluateExpr(dateExpr, p);
    const date =
      dateVal instanceof Date ? dateVal : typeof dateVal === 'string' ? new Date(dateVal) : null;
    if (date && !isNaN(date.getTime())) {
      items.push({
        date,
        value: p.file.name as DvValue,
        page: { type: 'link', path: p.path, display: p.file.name },
      });
    }
  }
  return { type: 'calendar', items, totalCount: items.length };
}

function buildGroupedResult(query: DvQuery, pages: DvPage[]): DvGroupedResult {
  const groupExpr = query.groupBy!;
  const groupMap = new Map<string, { key: DvValue; pages: DvPage[] }>();
  for (const p of pages) {
    const key = evaluateExpr(groupExpr, p);
    const keyStr = JSON.stringify(key);
    if (!groupMap.has(keyStr)) groupMap.set(keyStr, { key, pages: [] });
    groupMap.get(keyStr)!.pages.push(p);
  }
  const headers = ['Group', ...query.fields.map((f) => f.alias || exprToString(f.expr))];
  const groups: Array<{ key: DvValue; rows: DvValue[][] }> = [];
  for (const { key, pages: groupPages } of groupMap.values()) {
    const rows = groupPages.map((p) => {
      const fileCell: DvLink = { type: 'link', path: p.path, display: p.file.name };
      const fieldCells = query.fields.map((f) => evaluateExpr(f.expr, p));
      return [fileCell as DvValue, ...fieldCells];
    });
    groups.push({ key, rows });
  }
  const totalCount = groups.reduce((s, g) => s + g.rows.length, 0);
  return { type: 'grouped', groups, headers, totalCount };
}

// ─── FLATTEN ──────────────────────────────────────────────────────────────────

function applyFlatten(pages: DvPage[], flattenExpr: { expr: DvExpr; alias?: string }): DvPage[] {
  const result: DvPage[] = [];
  const alias = flattenExpr.alias;
  for (const p of pages) {
    const val = evaluateExpr(flattenExpr.expr, p);
    if (Array.isArray(val) && val.length > 0) {
      for (const item of val) {
        const cloned = { ...p, fields: { ...p.fields } };
        if (alias) cloned.fields[alias] = item;
        else {
          const key = flattenExpr.expr.type === 'field' ? flattenExpr.expr.path : '__flat';
          cloned.fields[key] = item;
        }
        result.push(cloned);
      }
    } else {
      result.push(p);
    }
  }
  return result;
}
