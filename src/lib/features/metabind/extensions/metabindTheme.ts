/**
 * CodeMirror theme for MetaBind widgets.
 * Provides styling for INPUT, VIEW, and BUTTON inline elements.
 */

import { EditorView } from '@codemirror/view';

export const metabindTheme = EditorView.baseTheme({
  // ─── INPUT: Common ───────────────────────────────────────────────────
  '.cm-mb-input': {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    verticalAlign: 'middle',
    margin: '0 2px',
  },

  // ─── INPUT: Toggle ───────────────────────────────────────────────────
  '.cm-mb-toggle-label': {
    display: 'inline-flex',
    alignItems: 'center',
    cursor: 'pointer',
  },
  '.cm-mb-toggle-input': {
    position: 'absolute',
    opacity: '0',
    width: '0',
    height: '0',
  },
  '.cm-mb-toggle-track': {
    display: 'inline-block',
    width: '32px',
    height: '18px',
    borderRadius: '9px',
    backgroundColor: 'var(--background-modifier-border, #45475a)',
    position: 'relative',
    transition: 'background-color 0.2s',
  },
  '.cm-mb-toggle-track::after': {
    content: '""',
    position: 'absolute',
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    backgroundColor: 'var(--text-normal, #cdd6f4)',
    top: '2px',
    left: '2px',
    transition: 'transform 0.2s',
  },
  '.cm-mb-toggle-input:checked + .cm-mb-toggle-track': {
    backgroundColor: 'var(--interactive-accent, #89b4fa)',
  },
  '.cm-mb-toggle-input:checked + .cm-mb-toggle-track::after': {
    transform: 'translateX(14px)',
  },

  // ─── INPUT: Text / Number / Date / Time ──────────────────────────────
  '.cm-mb-text-input, .cm-mb-number-input, .cm-mb-date-input, .cm-mb-time-input': {
    backgroundColor: 'var(--background-modifier-form-field, #313244)',
    border: '1px solid var(--background-modifier-border, #45475a)',
    borderRadius: '4px',
    color: 'var(--text-normal, #cdd6f4)',
    padding: '2px 6px',
    fontSize: 'inherit',
    fontFamily: 'inherit',
    lineHeight: '1.4',
    outline: 'none',
    minWidth: '60px',
    maxWidth: '200px',
  },
  '.cm-mb-text-input:focus, .cm-mb-number-input:focus, .cm-mb-date-input:focus, .cm-mb-time-input:focus':
    {
      borderColor: 'var(--interactive-accent, #89b4fa)',
      boxShadow: '0 0 0 1px var(--interactive-accent, #89b4fa)',
    },
  '.cm-mb-number-input': { maxWidth: '80px' },

  // ─── INPUT: Slider ───────────────────────────────────────────────────
  '.cm-mb-slider-input': {
    width: '100px',
    accentColor: 'var(--interactive-accent, #89b4fa)',
    cursor: 'pointer',
  },
  '.cm-mb-slider-value': {
    fontSize: '0.85em',
    color: 'var(--text-muted, #a6adc8)',
    minWidth: '24px',
    textAlign: 'center',
  },

  // ─── INPUT: Select ───────────────────────────────────────────────────
  '.cm-mb-select-input': {
    backgroundColor: 'var(--background-modifier-form-field, #313244)',
    border: '1px solid var(--background-modifier-border, #45475a)',
    borderRadius: '4px',
    color: 'var(--text-normal, #cdd6f4)',
    padding: '2px 4px',
    fontSize: 'inherit',
    outline: 'none',
    cursor: 'pointer',
  },

  // ─── INPUT: Multi-select ─────────────────────────────────────────────
  '.cm-mb-multi-select': {
    display: 'inline-flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  '.cm-mb-ms-option': {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2px',
    fontSize: '0.9em',
    cursor: 'pointer',
    color: 'var(--text-muted, #a6adc8)',
  },

  // ─── INPUT: Textarea ─────────────────────────────────────────────────
  '.cm-mb-textarea-input': {
    display: 'block',
    width: '100%',
    backgroundColor: 'var(--background-modifier-form-field, #313244)',
    border: '1px solid var(--background-modifier-border, #45475a)',
    borderRadius: '4px',
    color: 'var(--text-normal, #cdd6f4)',
    padding: '4px 6px',
    fontSize: 'inherit',
    fontFamily: 'inherit',
    resize: 'vertical',
    outline: 'none',
  },

  // ─── INPUT: Color ────────────────────────────────────────────────────
  '.cm-mb-color-input': {
    width: '28px',
    height: '22px',
    border: '1px solid var(--background-modifier-border, #45475a)',
    borderRadius: '4px',
    cursor: 'pointer',
    padding: '0',
  },

  // ─── VIEW: Common ────────────────────────────────────────────────────
  '.cm-mb-view': {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    verticalAlign: 'middle',
    margin: '0 2px',
  },
  '.cm-mb-view-text, .cm-mb-view-number, .cm-mb-view-date': {
    backgroundColor: 'var(--background-modifier-hover, rgba(255,255,255,0.04))',
    borderRadius: '4px',
    padding: '1px 6px',
    color: 'var(--text-normal, #cdd6f4)',
    fontSize: '0.95em',
  },
  '.cm-mb-view-bool': { fontWeight: '600' },
  '.cm-mb-bool-true': { color: 'var(--text-success, #a6e3a1)' },
  '.cm-mb-bool-false': { color: 'var(--text-error, #f38ba8)' },

  // ─── VIEW: Tags ──────────────────────────────────────────────────────
  '.cm-mb-tag-chip': {
    display: 'inline-block',
    backgroundColor: 'var(--tag-background, rgba(137,180,250,0.15))',
    color: 'var(--tag-color, #89b4fa)',
    borderRadius: '8px',
    padding: '0 8px',
    fontSize: '0.85em',
    marginRight: '4px',
    lineHeight: '1.6',
  },

  // ─── VIEW: Progress bar ──────────────────────────────────────────────
  '.cm-mb-progress-bar': {
    display: 'inline-block',
    width: '80px',
    height: '8px',
    backgroundColor: 'var(--background-modifier-border, #45475a)',
    borderRadius: '4px',
    overflow: 'hidden',
    verticalAlign: 'middle',
  },
  '.cm-mb-progress-fill': {
    display: 'block',
    height: '100%',
    backgroundColor: 'var(--interactive-accent, #89b4fa)',
    borderRadius: '4px',
    transition: 'width 0.3s',
  },
  '.cm-mb-progress-label': {
    fontSize: '0.8em',
    color: 'var(--text-muted, #a6adc8)',
  },

  // ─── VIEW: Rating ────────────────────────────────────────────────────
  '.cm-mb-rating': { display: 'inline-flex', gap: '1px' },
  '.cm-mb-star': {
    fontSize: '1.1em',
    color: 'var(--text-faint, #6c7086)',
  },
  '.cm-mb-star.filled': {
    color: 'var(--text-accent, #f9e2af)',
  },

  // ─── VIEW: Link ──────────────────────────────────────────────────────
  '.cm-mb-view-link': {
    color: 'var(--interactive-accent, #89b4fa)',
    textDecoration: 'none',
    cursor: 'pointer',
  },

  // ─── BUTTON ──────────────────────────────────────────────────────────
  '.cm-mb-button': {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 10px',
    borderRadius: '4px',
    border: '1px solid var(--background-modifier-border, #45475a)',
    backgroundColor: 'var(--background-secondary, #1e1e2e)',
    color: 'var(--text-normal, #cdd6f4)',
    fontSize: '0.9em',
    cursor: 'pointer',
    lineHeight: '1.6',
    transition: 'background-color 0.15s, border-color 0.15s',
    verticalAlign: 'middle',
    margin: '0 2px',
  },
  '.cm-mb-button:hover': {
    backgroundColor: 'var(--background-modifier-hover, #313244)',
    borderColor: 'var(--interactive-accent, #89b4fa)',
  },
  '.cm-mb-btn-primary': {
    backgroundColor: 'var(--interactive-accent, #89b4fa)',
    color: 'var(--text-on-accent, #1e1e2e)',
    borderColor: 'var(--interactive-accent, #89b4fa)',
  },
  '.cm-mb-btn-primary:hover': {
    opacity: '0.9',
  },
  '.cm-mb-btn-danger': {
    borderColor: 'var(--text-error, #f38ba8)',
    color: 'var(--text-error, #f38ba8)',
  },
  '.cm-mb-btn-ghost': {
    border: 'none',
    backgroundColor: 'transparent',
  },

  // ─── Active source (cursor on line — raw syntax revealed) ────────
  '.cm-mb-active-source': {
    backgroundColor: 'var(--background-modifier-hover, rgba(255,255,255,0.06))',
    borderRadius: '3px',
    padding: '1px 4px',
    fontFamily: 'var(--font-monospace, monospace)',
    fontSize: '0.9em',
    color: 'var(--text-accent, #f9e2af)',
  },
});
