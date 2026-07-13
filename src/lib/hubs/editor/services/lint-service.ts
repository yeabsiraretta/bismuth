import { getNotes } from '@/hubs/core/stores/vault-store.svelte';

export interface LintDiagnostic {
  line: number;
  column: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  rule: string;
}

const HEADING_RE = /^(#{1,6})\s/;
const WIKILINK_RE = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
const EMPTY_HEADING_RE = /^#{1,6}\s*$/;
const TRAILING_WS_RE = /\s+$/;
const CONSECUTIVE_BLANK_RE = /^\s*$/;

export function lintMarkdown(content: string, notePath?: string): LintDiagnostic[] {
  const lines = content.split('\n');
  const diagnostics: LintDiagnostic[] = [];
  let lastHeadingLevel = 0;
  let consecutiveBlanks = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Rule: heading-increment — headings should not skip levels
    const headingMatch = line.match(HEADING_RE);
    if (headingMatch) {
      const level = headingMatch[1].length;
      if (lastHeadingLevel > 0 && level > lastHeadingLevel + 1) {
        diagnostics.push({
          line: lineNum,
          column: 1,
          severity: 'warning',
          message: `Heading level jumps from h${lastHeadingLevel} to h${level}`,
          rule: 'heading-increment',
        });
      }
      lastHeadingLevel = level;
    }

    // Rule: empty-heading — heading with no text
    if (EMPTY_HEADING_RE.test(line)) {
      diagnostics.push({
        line: lineNum,
        column: 1,
        severity: 'warning',
        message: 'Empty heading',
        rule: 'no-empty-heading',
      });
    }

    // Rule: trailing-whitespace
    if (TRAILING_WS_RE.test(line) && line.trim().length > 0) {
      diagnostics.push({
        line: lineNum,
        column: line.length,
        severity: 'info',
        message: 'Trailing whitespace',
        rule: 'no-trailing-whitespace',
      });
    }

    // Rule: consecutive-blank-lines (more than 2)
    if (CONSECUTIVE_BLANK_RE.test(line)) {
      consecutiveBlanks++;
      if (consecutiveBlanks > 2) {
        diagnostics.push({
          line: lineNum,
          column: 1,
          severity: 'info',
          message: 'More than 2 consecutive blank lines',
          rule: 'no-excessive-blanks',
        });
      }
    } else {
      consecutiveBlanks = 0;
    }
  }

  // Rule: broken-wikilinks — check all wikilinks resolve to existing notes
  if (notePath) {
    const noteSet = new Set(getNotes().map((n) => n.title.toLowerCase()));
    let match: RegExpExecArray | null;
    const wikilinkRe = new RegExp(WIKILINK_RE.source, 'g');
    while ((match = wikilinkRe.exec(content)) !== null) {
      const target = match[1].trim().toLowerCase();
      if (!noteSet.has(target)) {
        const before = content.slice(0, match.index);
        const line = before.split('\n').length;
        const col = match.index - before.lastIndexOf('\n');
        diagnostics.push({
          line,
          column: col,
          severity: 'warning',
          message: `Broken wikilink: [[${match[1].trim()}]] not found`,
          rule: 'no-broken-wikilinks',
        });
      }
    }
  }

  return diagnostics;
}

export function lintSummary(diagnostics: LintDiagnostic[]): string {
  const errors = diagnostics.filter((d) => d.severity === 'error').length;
  const warnings = diagnostics.filter((d) => d.severity === 'warning').length;
  const info = diagnostics.filter((d) => d.severity === 'info').length;
  const parts: string[] = [];
  if (errors) parts.push(`${errors} error${errors > 1 ? 's' : ''}`);
  if (warnings) parts.push(`${warnings} warning${warnings > 1 ? 's' : ''}`);
  if (info) parts.push(`${info} info`);
  return parts.length ? parts.join(', ') : 'No issues';
}
