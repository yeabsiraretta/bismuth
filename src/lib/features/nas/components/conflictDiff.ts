/**
 * conflictDiff.ts — minimal line diff for NAS conflict resolution.
 *
 * Pure functions only. No external diff library.
 * Myers simplified algorithm: builds a sequence of line-level edit operations.
 */

export type DiffLineOp = 'equal' | 'add' | 'remove';

export interface DiffLine {
  op: DiffLineOp;
  text: string;
}

/**
 * Compute a line-level diff between two text strings.
 * Returns an array of DiffLine entries with op = 'equal' | 'add' | 'remove'.
 */
export function diffLines(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  return myersDiff(oldLines, newLines);
}

/** Minimal Myers diff over string arrays. Returns labeled lines. */
function myersDiff(oldArr: string[], newArr: string[]): DiffLine[] {
  const n = oldArr.length;
  const m = newArr.length;
  const maxD = n + m;
  const v: Record<number, number> = { 1: 0 };
  const trace: Record<number, number>[] = [];

  for (let d = 0; d <= maxD; d++) {
    const snapshot: Record<number, number> = {};
    for (let k = -d; k <= d; k += 2) {
      let x: number;
      if (k === -d || (k !== d && (v[k - 1] ?? 0) < (v[k + 1] ?? 0))) {
        x = v[k + 1] ?? 0;
      } else {
        x = (v[k - 1] ?? 0) + 1;
      }
      let y = x - k;
      while (x < n && y < m && oldArr[x] === newArr[y]) {
        x++;
        y++;
      }
      v[k] = x;
      snapshot[k] = x;
      if (x >= n && y >= m) {
        trace.push(snapshot);
        return backtrack(trace, oldArr, newArr);
      }
    }
    trace.push({ ...snapshot });
  }
  // Fallback: show all old as remove, all new as add
  return [
    ...oldArr.map((t) => ({ op: 'remove' as DiffLineOp, text: t })),
    ...newArr.map((t) => ({ op: 'add' as DiffLineOp, text: t })),
  ];
}

function backtrack(
  trace: Record<number, number>[],
  oldArr: string[],
  newArr: string[]
): DiffLine[] {
  const result: DiffLine[] = [];
  let x = oldArr.length;
  let y = newArr.length;
  for (let d = trace.length - 1; d >= 0; d--) {
    const v = trace[d];
    const k = x - y;
    let prevK: number;
    if (k === -d || (k !== d && (v[k - 1] ?? 0) < (v[k + 1] ?? 0))) {
      prevK = k + 1;
    } else {
      prevK = k - 1;
    }
    const prevX = v[prevK] ?? 0;
    const prevY = prevX - prevK;
    while (x > prevX + 1 && y > prevY + 1) {
      result.unshift({ op: 'equal', text: oldArr[x - 1] });
      x--;
      y--;
    }
    if (d > 0) {
      if (x === prevX) {
        result.unshift({ op: 'add', text: newArr[y - 1] });
        y--;
      } else {
        result.unshift({ op: 'remove', text: oldArr[x - 1] });
        x--;
      }
    }
    while (x > prevX && y > prevY) {
      result.unshift({ op: 'equal', text: oldArr[x - 1] });
      x--;
      y--;
    }
  }
  return result;
}
