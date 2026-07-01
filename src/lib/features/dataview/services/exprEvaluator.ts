/**
 * Expression evaluator for Dataview queries.
 *
 * Resolves field references, evaluates binary/unary operators,
 * and provides a library of built-in functions.
 */

import type { DvExpr, DvPage, DvValue } from '@/features/dataview/types/dataview';

export function evaluateExpr(expr: DvExpr, page: DvPage): DvValue {
  switch (expr.type) {
    case 'literal': return expr.value;
    case 'field': return resolveField(expr.path, page);
    case 'binary': return evaluateBinary(expr.op, evaluateExpr(expr.left, page), evaluateExpr(expr.right, page));
    case 'unary': return evaluateUnary(expr.op, evaluateExpr(expr.operand, page));
    case 'function': return evaluateFunction(expr.name, expr.args.map((a) => evaluateExpr(a, page)));
  }
}

function resolveField(path: string, page: DvPage): DvValue {
  if (path.startsWith('file.')) {
    const key = path.slice(5);
    const fi = page.file as unknown as Record<string, unknown>;
    return (fi[key] as DvValue) ?? null;
  }
  if (path in page.fields) return page.fields[path];
  const kebab = path.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  if (kebab in page.fields) return page.fields[kebab];
  return null;
}

function evaluateBinary(op: string, left: DvValue, right: DvValue): DvValue {
  switch (op) {
    case '=': return deepEqual(left, right);
    case '!=': return !deepEqual(left, right);
    case '>': return toNumber(left) > toNumber(right);
    case '<': return toNumber(left) < toNumber(right);
    case '>=': return toNumber(left) >= toNumber(right);
    case '<=': return toNumber(left) <= toNumber(right);
    case 'and': return isTruthy(left) && isTruthy(right);
    case 'or': return isTruthy(left) || isTruthy(right);
    case 'contains': return containsValue(left, right);
    case '+': {
      if (typeof left === 'string' || typeof right === 'string') return String(left ?? '') + String(right ?? '');
      return toNumber(left) + toNumber(right);
    }
    case '-': return toNumber(left) - toNumber(right);
    case '*': return toNumber(left) * toNumber(right);
    case '/': { const d = toNumber(right); return d === 0 ? null : toNumber(left) / d; }
    case '%': { const d = toNumber(right); return d === 0 ? null : toNumber(left) % d; }
    default: return null;
  }
}

function evaluateUnary(op: string, operand: DvValue): DvValue {
  if (op === 'not') return !isTruthy(operand);
  if (op === '-') return -toNumber(operand);
  return null;
}

function evaluateFunction(name: string, args: DvValue[]): DvValue {
  switch (name.toLowerCase()) {
    case 'length': return Array.isArray(args[0]) ? args[0].length : String(args[0] ?? '').length;
    case 'lower': return String(args[0] ?? '').toLowerCase();
    case 'upper': return String(args[0] ?? '').toUpperCase();
    case 'contains': return containsValue(args[0], args[1]);
    case 'default': return args[0] ?? args[1] ?? null;
    case 'dateformat': return args[0] instanceof Date ? args[0].toLocaleDateString() : String(args[0] ?? '');
    case 'round': return Math.round(toNumber(args[0]));
    case 'min': return Math.min(...args.map(toNumber));
    case 'max': return Math.max(...args.map(toNumber));
    case 'sum': return args.map(toNumber).reduce((a, b) => a + b, 0);
    case 'average': case 'avg': {
      const nums = args.length === 1 && Array.isArray(args[0]) ? args[0].map(toNumber) : args.map(toNumber);
      return nums.length === 0 ? 0 : nums.reduce((a, b) => a + b, 0) / nums.length;
    }
    case 'join': {
      const arr = Array.isArray(args[0]) ? args[0] : [args[0]];
      const sep = typeof args[1] === 'string' ? args[1] : ', ';
      return arr.map((v) => String(v ?? '')).join(sep);
    }
    case 'split': {
      const str = String(args[0] ?? '');
      const sep = typeof args[1] === 'string' ? args[1] : ',';
      return str.split(sep).map((s) => s.trim());
    }
    case 'reverse': return Array.isArray(args[0]) ? [...args[0]].reverse() : String(args[0] ?? '').split('').reverse().join('');
    case 'sort': return Array.isArray(args[0]) ? [...args[0]].sort((a, b) => compareValues(a, b)) : args[0];
    case 'flat': return Array.isArray(args[0]) ? args[0].flat() : args[0];
    case 'slice': {
      const arr = Array.isArray(args[0]) ? args[0] : String(args[0] ?? '').split('');
      return arr.slice(toNumber(args[1] ?? 0), args[2] != null ? toNumber(args[2]) : undefined);
    }
    case 'regexmatch': {
      try {
        const re = new RegExp(String(args[1] ?? ''), 'i');
        return re.test(String(args[0] ?? ''));
      } catch { return false; }
    }
    case 'regexreplace': {
      try {
        const re = new RegExp(String(args[1] ?? ''), 'gi');
        return String(args[0] ?? '').replace(re, String(args[2] ?? ''));
      } catch { return args[0]; }
    }
    case 'replace': return String(args[0] ?? '').split(String(args[1] ?? '')).join(String(args[2] ?? ''));
    case 'substring': case 'substr': {
      const s = String(args[0] ?? '');
      return s.substring(toNumber(args[1] ?? 0), args[2] != null ? toNumber(args[2]) : undefined);
    }
    case 'startswith': return String(args[0] ?? '').toLowerCase().startsWith(String(args[1] ?? '').toLowerCase());
    case 'endswith': return String(args[0] ?? '').toLowerCase().endsWith(String(args[1] ?? '').toLowerCase());
    case 'padleft': return String(args[0] ?? '').padStart(toNumber(args[1] ?? 0), String(args[2] ?? ' '));
    case 'padright': return String(args[0] ?? '').padEnd(toNumber(args[1] ?? 0), String(args[2] ?? ' '));
    case 'trim': return String(args[0] ?? '').trim();
    case 'number': return toNumber(args[0]);
    case 'string': return String(args[0] ?? '');
    case 'abs': return Math.abs(toNumber(args[0]));
    case 'ceil': return Math.ceil(toNumber(args[0]));
    case 'floor': return Math.floor(toNumber(args[0]));
    case 'trunc': return Math.trunc(toNumber(args[0]));
    case 'nonnull': return Array.isArray(args[0]) ? args[0].filter((v) => v !== null) : args.filter((v) => v !== null);
    case 'all': return Array.isArray(args[0]) ? args[0].every(isTruthy) : args.every(isTruthy);
    case 'any': return Array.isArray(args[0]) ? args[0].some(isTruthy) : args.some(isTruthy);
    case 'none': return Array.isArray(args[0]) ? !args[0].some(isTruthy) : !args.some(isTruthy);
    case 'typeof': return typeof args[0];
    case 'date': {
      if (typeof args[0] === 'string') { const d = new Date(args[0]); return isNaN(d.getTime()) ? null : d; }
      return args[0] instanceof Date ? args[0] : null;
    }
    case 'now': case 'today': return new Date();
    default: return null;
  }
}

// ─── Shared helpers (also exported for use in queryEngine) ───────────────────

export function isTruthy(v: DvValue): boolean {
  if (v === null || v === false || v === 0 || v === '') return false;
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

export function toNumber(v: DvValue): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (typeof v === 'string') { const n = parseFloat(v); return isNaN(n) ? 0 : n; }
  if (v instanceof Date) return v.getTime();
  return 0;
}

export function compareValues(a: DvValue, b: DvValue): number {
  if (a === b) return 0;
  if (a === null) return -1;
  if (b === null) return 1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b);
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  return String(a).localeCompare(String(b));
}

export function exprToString(expr: DvExpr): string {
  if (expr.type === 'field') return expr.path;
  if (expr.type === 'literal') return String(expr.value);
  if (expr.type === 'function') return `${expr.name}(…)`;
  return '…';
}

function deepEqual(a: DvValue, b: DvValue): boolean {
  if (a === b) return true;
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  if (typeof a === 'string' && typeof b === 'string') return a.toLowerCase() === b.toLowerCase();
  return false;
}

function containsValue(haystack: DvValue, needle: DvValue): boolean {
  if (Array.isArray(haystack)) return haystack.some((v) => deepEqual(v, needle));
  if (typeof haystack === 'string' && typeof needle === 'string') {
    return haystack.toLowerCase().includes(needle.toLowerCase());
  }
  return false;
}
