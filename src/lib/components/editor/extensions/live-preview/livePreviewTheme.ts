/**
 * Theme styles for the live preview extension.
 */

import { EditorView } from '@codemirror/view';

export const livePreviewTheme = EditorView.theme({
  // Hidden syntax markers — collapsed to zero with no layout contribution
  '.cm-lp-hidden': {
    display: 'inline',
    fontSize: '0',
    letterSpacing: '0',
    color: 'transparent',
    opacity: '0',
    userSelect: 'none',
    pointerEvents: 'none',
    width: '0',
    overflow: 'hidden',
  },
  // Headings — .cm-line prefix ensures specificity over editor base font-size
  '& .cm-line .cm-lp-h1': { fontSize: '1.6em', fontWeight: '700', letterSpacing: '-0.02em', lineHeight: 'inherit', color: 'var(--text-normal, #111827)' },
  '& .cm-line .cm-lp-h2': { fontSize: '1.4em', fontWeight: '700', letterSpacing: '-0.01em', lineHeight: 'inherit', color: 'var(--text-normal, #1f2937)' },
  '& .cm-line .cm-lp-h3': { fontSize: '1.2em', fontWeight: '600', lineHeight: 'inherit', color: 'var(--text-normal, #1f2937)' },
  '& .cm-line .cm-lp-h4': { fontSize: '1.1em', fontWeight: '600', lineHeight: 'inherit', color: 'var(--text-normal, #374151)' },
  '& .cm-line .cm-lp-h5': { fontSize: '1.0em', fontWeight: '600', lineHeight: 'inherit', color: 'var(--text-muted, #6b7280)' },
  '& .cm-line .cm-lp-h6': { fontSize: '0.95em', fontWeight: '600', fontStyle: 'italic', lineHeight: 'inherit', color: 'var(--text-muted, #6b7280)' },
  // Inline formatting — stays within line grid
  '.cm-lp-bold': { fontWeight: '700' },
  '.cm-lp-italic': { fontStyle: 'italic' },
  '.cm-lp-strikethrough': { textDecoration: 'line-through', opacity: '0.6' },
  '.cm-lp-code': {
    fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
    background: 'var(--background-secondary, #f3f4f6)',
    padding: '1px 4px',
    borderRadius: '3px',
    fontSize: 'inherit',
  },
  '.cm-lp-link': { color: 'var(--interactive-accent, #dc2626)', textDecoration: 'none', cursor: 'pointer' },
  '.cm-lp-link:hover': { textDecoration: 'underline' },
  '.cm-lp-highlight': { background: 'var(--text-highlight-bg, rgba(255, 208, 0, 0.4))', borderRadius: '2px', padding: '1px 0' },
  '.cm-lp-underline': { textDecoration: 'underline' },
  '.cm-lp-sup': { verticalAlign: 'super', fontSize: '0.75em', lineHeight: '0' },
  '.cm-lp-sub': { verticalAlign: 'sub', fontSize: '0.75em', lineHeight: '0' },
  '.cm-lp-footnote-ref': { verticalAlign: 'super', fontSize: '0.75em', lineHeight: '0', color: 'var(--interactive-accent, #dc2626)', cursor: 'pointer' },
  '.cm-lp-footnote-detail': { borderLeft: '3px solid var(--interactive-accent, #dc2626)', paddingLeft: '8px', marginLeft: '4px', fontSize: '0.9em', color: 'var(--text-muted, #6b7280)' },
  '.cm-lp-footnote-detail-id': { fontWeight: '600', color: 'var(--interactive-accent, #dc2626)', cursor: 'pointer' },
  // List counter reset — applied to first ordered item in a list
  '.cm-lp-list-reset': {
    counterReset: 'lp-list',
  },
  // ── Bullet list ──────────────────────────────────────────────────────────────
  // Base (level 0): padding allocates room for the • glyph
  '.cm-lp-list-bullet': {
    position: 'relative',
    paddingLeft: '1.5em',
  },
  '.cm-lp-list-bullet::before': {
    content: '"•"',
    position: 'absolute',
    left: '0.25em',
    color: 'var(--text-muted, #6b7280)',
    fontWeight: '700',
    lineHeight: 'inherit',
  },
  // Indent levels 1-6: padding shifts right, bullet tracks at (paddingLeft - 1.25em)
  '.cm-lp-list-indent-1': { paddingLeft: '3.0em' },
  '.cm-lp-list-indent-1::before': { left: '1.75em' },
  '.cm-lp-list-indent-2': { paddingLeft: '4.5em' },
  '.cm-lp-list-indent-2::before': { left: '3.25em' },
  '.cm-lp-list-indent-3': { paddingLeft: '6.0em' },
  '.cm-lp-list-indent-3::before': { left: '4.75em' },
  '.cm-lp-list-indent-4': { paddingLeft: '7.5em' },
  '.cm-lp-list-indent-4::before': { left: '6.25em' },
  '.cm-lp-list-indent-5': { paddingLeft: '9.0em' },
  '.cm-lp-list-indent-5::before': { left: '7.75em' },
  '.cm-lp-list-indent-6': { paddingLeft: '10.5em' },
  '.cm-lp-list-indent-6::before': { left: '9.25em' },
  // ── Ordered list ─────────────────────────────────────────────────────────────
  '.cm-lp-list-ordered': {
    position: 'relative',
    paddingLeft: '1.8em',
    counterIncrement: 'lp-list',
  },
  '.cm-lp-list-ordered::before': {
    content: 'counter(lp-list) "."',
    position: 'absolute',
    left: '0',
    width: '1.6em',
    textAlign: 'right',
    paddingRight: '0.2em',
    color: 'var(--text-muted, #6b7280)',
    fontSize: '0.9em',
    fontWeight: '500',
    lineHeight: 'inherit',
  },
  // Indent levels for ordered lists
  '.cm-lp-list-indent-1.cm-lp-list-ordered': { paddingLeft: '3.3em' },
  '.cm-lp-list-indent-1.cm-lp-list-ordered::before': { left: '1.5em' },
  '.cm-lp-list-indent-2.cm-lp-list-ordered': { paddingLeft: '4.8em' },
  '.cm-lp-list-indent-2.cm-lp-list-ordered::before': { left: '3.0em' },
  '.cm-lp-list-indent-3.cm-lp-list-ordered': { paddingLeft: '6.3em' },
  '.cm-lp-list-indent-3.cm-lp-list-ordered::before': { left: '4.5em' },
  '.cm-lp-list-indent-4.cm-lp-list-ordered': { paddingLeft: '7.8em' },
  '.cm-lp-list-indent-4.cm-lp-list-ordered::before': { left: '6.0em' },
  // Blockquotes — grouped container with left accent
  '.cm-lp-quote-line': {
    borderLeft: '3px solid var(--interactive-accent, #dc2626)',
    paddingLeft: '12px',
    background: 'var(--background-secondary, #f8f9fa)',
    color: 'var(--text-muted, #6b7280)',
    fontStyle: 'italic',
  },
  '.cm-lp-quote-single': {
    borderRadius: 'var(--radius-s, 4px)',
    paddingTop: '4px',
    paddingBottom: '4px',
    marginTop: '2px',
    marginBottom: '2px',
  },
  '.cm-lp-quote-first': {
    borderTopLeftRadius: 'var(--radius-s, 4px)',
    borderTopRightRadius: 'var(--radius-s, 4px)',
    paddingTop: '4px',
    marginTop: '2px',
  },
  '.cm-lp-quote-mid': {
    borderRadius: '0',
  },
  '.cm-lp-quote-last': {
    borderBottomLeftRadius: 'var(--radius-s, 4px)',
    borderBottomRightRadius: 'var(--radius-s, 4px)',
    paddingBottom: '4px',
    marginBottom: '2px',
  },
  // Horizontal rules — thin divider within line height (cursor on line)
  '.cm-lp-hr': {
    borderBottom: '1px solid var(--border-color, #e5e7eb)',
    opacity: '0.6',
  },
  // Horizontal rule widget (rendered when cursor not on line)
  '.cm-lp-hr-rendered': {
    border: 'none',
    borderTop: '1px solid var(--border-color, #e5e7eb)',
    margin: '0.75em 0',
    opacity: '0.6',
  },
  // Interactive task checkboxes (button-based with SVG icons)
  '.cm-lp-checkbox': {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '18px',
    height: '18px',
    padding: '0',
    border: 'none',
    background: 'none',
    verticalAlign: 'middle',
    cursor: 'pointer',
    marginRight: '4px',
    borderRadius: '3px',
    transition: 'color 0.1s ease',
    flexShrink: '0',
  },
  '.cm-lp-checkbox:hover': { opacity: '0.8' },
  '.cm-lp-checkbox svg': { display: 'block' },
  '.cm-task-open': { color: 'var(--text-muted, #9ca3af)' },
  '.cm-task-done': { color: 'var(--interactive-accent, #10b981)' },
  '.cm-task-inprogress': { color: 'var(--text-accent, #3b82f6)' },
  '.cm-task-onhold': { color: 'var(--text-warning, #f59e0b)' },
  '.cm-task-cancelled': { color: 'var(--text-error, #ef4444)' },
  // Table line decoration (line-level styling for table rows when active)
  '.cm-lp-table-line': {
    fontFamily: 'var(--font-monospace, monospace)',
    fontSize: '0.9em',
  },
  // Hidden table lines (raw source hidden when widget is displayed)
  '.cm-lp-table-hidden': {
    fontSize: '0 !important',
    lineHeight: '0 !important',
    height: '0 !important',
    maxHeight: '0',
    overflow: 'hidden',
    padding: '0 !important',
    margin: '0 !important',
    opacity: '0',
    pointerEvents: 'none',
  },
  // Tables (rendered widget)
  '.cm-table-rendered': { display: 'block', padding: '4px 0', overflow: 'auto' },
  '.cm-lp-table': {
    borderCollapse: 'collapse',
    width: '100%',
    fontSize: '0.9em',
    fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
  },
  '.cm-lp-table th, .cm-lp-table td': {
    border: '1px solid var(--border-color, #e5e7eb)',
    padding: '4px 8px',
    textAlign: 'left',
  },
  '.cm-lp-table th': {
    background: 'var(--background-secondary, #f3f4f6)',
    fontWeight: '600',
  },
  '.cm-lp-table tr:nth-child(even) td': {
    background: 'var(--background-primary-alt, #f9fafb)',
  },
  // Fenced code blocks — monospace with subtle background
  '.cm-lp-codeblock-line': {
    fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
    fontSize: '0.9em',
    background: 'var(--background-secondary, #f3f4f6)',
  },
  '.cm-lp-codeblock-fence': {
    fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
    fontSize: '0.85em',
    color: 'var(--text-faint, #9ca3af)',
    background: 'var(--background-secondary, #f3f4f6)',
  },
  // Image rendering
  '.cm-lp-image-wrap': {
    padding: '8px 0',
  },
  '.cm-lp-image': {
    maxWidth: '100%',
    borderRadius: 'var(--radius-m, 6px)',
    display: 'block',
  },
  // ── Callout widget ────────────────────────────────────────────────────────
  '.cm-callout': {
    borderLeft: '4px solid #448aff',
    borderRadius: 'var(--radius-s, 4px)',
    background: 'var(--background-secondary, #f8f9fa)',
    padding: '8px 12px',
    margin: '4px 0',
  },
  '.cm-callout-header': {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: '600',
    fontSize: '0.95em',
  },
  '.cm-callout-title': {
    flex: '1',
  },
  '.cm-callout-fold': {
    fontSize: '1.2em',
    lineHeight: '1',
    transition: 'transform 0.15s ease',
    transform: 'rotate(90deg)',
    opacity: '0.5',
  },
  '.cm-callout-fold.collapsed': {
    transform: 'rotate(0deg)',
  },
  '.cm-callout-body': {
    marginTop: '6px',
    paddingTop: '6px',
    borderTop: '1px solid var(--border-color, #e5e7eb)',
    fontSize: '0.9em',
    color: 'var(--text-normal, #374151)',
    fontStyle: 'normal',
    whiteSpace: 'pre-wrap',
    lineHeight: '1.5',
  },
  // ── Inline flashcard decorations ──────────────────────────────────────────
  '.cm-lp-flashcard-front': {
    background: 'rgba(99, 102, 241, 0.08)',
    borderRadius: '3px 0 0 3px',
    padding: '1px 4px 1px 6px',
    borderLeft: '3px solid rgba(99, 102, 241, 0.5)',
  },
  '.cm-lp-flashcard-sep': {
    display: 'inline',
    color: 'var(--text-faint, #9ca3af)',
    fontWeight: '700',
    fontSize: '0.85em',
    letterSpacing: '1px',
    padding: '1px 4px',
    verticalAlign: 'middle',
  },
  '.cm-lp-flashcard-reversed .cm-lp-flashcard-sep, .cm-lp-flashcard-reversed': {
    color: 'var(--text-warning, #f59e0b)',
  },
  '.cm-lp-flashcard-back': {
    background: 'rgba(16, 185, 129, 0.08)',
    borderRadius: '0 3px 3px 0',
    padding: '1px 6px 1px 4px',
    borderRight: '3px solid rgba(16, 185, 129, 0.5)',
  },
  // ── Cloze deletion ────────────────────────────────────────────────────────
  '.cm-lp-cloze': {
    background: 'rgba(245, 158, 11, 0.15)',
    borderBottom: '2px dashed rgba(245, 158, 11, 0.6)',
    borderRadius: '2px',
    padding: '0 2px',
    fontWeight: '500',
  },
});
