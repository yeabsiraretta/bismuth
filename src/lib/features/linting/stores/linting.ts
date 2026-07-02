import { writable } from 'svelte/store';
import { lintText, type LintIssue } from '../services/linting';

/** Current lint issues for the active note. */
export const lintIssues = writable<LintIssue[]>([]);

/** Whether a lint operation is in progress. */
export const lintLoading = writable(false);

/** Debounce timer ID. */
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Runs the linter on provided text (debounced).
 * @param text - Note body text (frontmatter stripped).
 * @param delay - Debounce delay in ms (default 500).
 */
export function lintDebounced(text: string, delay = 500): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    lintLoading.set(true);
    try {
      const issues = await lintText(text);
      lintIssues.set(issues);
    } catch {
      lintIssues.set([]);
    } finally {
      lintLoading.set(false);
    }
  }, delay);
}

/** Immediately runs the linter (no debounce). */
export async function lintImmediate(text: string): Promise<void> {
  lintLoading.set(true);
  try {
    const issues = await lintText(text);
    lintIssues.set(issues);
  } catch {
    lintIssues.set([]);
  } finally {
    lintLoading.set(false);
  }
}

/** Clears all lint results. */
export function clearLintIssues(): void {
  lintIssues.set([]);
}
