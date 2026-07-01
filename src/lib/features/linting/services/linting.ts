import { invoke } from '@tauri-apps/api/core';

export interface LintIssue {
  rule: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  from: number;
  to: number;
  suggestion: string | null;
}

/** Sends text to the Rust linting service and returns all issues found. */
export async function lintText(text: string): Promise<LintIssue[]> {
  return invoke<LintIssue[]>('lint_note_text', { text });
}
