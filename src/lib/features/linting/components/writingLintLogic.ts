import type { LintIssue } from '../services/linting';

/** Groups issues by severity. */
export function groupBySeverity(issues: LintIssue[]): Record<string, LintIssue[]> {
  const groups: Record<string, LintIssue[]> = { error: [], warning: [], info: [] };
  for (const issue of issues) {
    const key = issue.severity ?? 'info';
    if (!groups[key]) groups[key] = [];
    groups[key].push(issue);
  }
  return groups;
}

/** Returns a human label for severity. */
export function severityLabel(severity: string): string {
  switch (severity) {
    case 'error': return 'Errors';
    case 'warning': return 'Warnings';
    case 'info': return 'Suggestions';
    default: return severity;
  }
}

/** Returns the icon for severity. */
export function severityIcon(severity: string): string {
  switch (severity) {
    case 'error': return 'x-circle';
    case 'warning': return 'alert-triangle';
    case 'info': return 'info';
    default: return 'circle';
  }
}
