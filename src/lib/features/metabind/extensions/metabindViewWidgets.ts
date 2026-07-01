/**
 * CodeMirror widget classes for MetaBind VIEW fields and BUTTONs.
 *
 * VIEW widgets render read-only displays of frontmatter values.
 * BUTTON widgets render clickable action buttons.
 */

import { WidgetType } from '@codemirror/view';
import type { EditorView } from '@codemirror/view';
import type { ViewFieldDeclaration, ButtonDeclaration } from '../types/metabind';
import { log } from '@/utils/logger';

/** Callback for button actions. */
export type ButtonActionCallback = (
  view: EditorView,
  action: string,
  actionArgs: string,
) => void;

// ─── VIEW widget ─────────────────────────────────────────────────────────────

export class MetaBindViewWidget extends WidgetType {
  constructor(
    private decl: ViewFieldDeclaration,
    private value: unknown,
  ) { super(); }

  eq(other: MetaBindViewWidget): boolean {
    return this.decl.property === other.decl.property
      && this.decl.fieldType === other.decl.fieldType
      && JSON.stringify(this.value) === JSON.stringify(other.value);
  }

  toDOM(): HTMLElement {
    const wrap = document.createElement('span');
    wrap.className = `cm-mb-view cm-mb-view-${this.decl.fieldType}`;
    wrap.setAttribute('data-mb-property', this.decl.property);

    switch (this.decl.fieldType) {
      case 'text': this.renderText(wrap); break;
      case 'number': this.renderNumber(wrap); break;
      case 'boolean': this.renderBoolean(wrap); break;
      case 'date': this.renderDate(wrap); break;
      case 'list': this.renderList(wrap); break;
      case 'tags': this.renderTags(wrap); break;
      case 'link': this.renderLink(wrap); break;
      case 'progress': this.renderProgress(wrap); break;
      case 'rating': this.renderRating(wrap); break;
      default: wrap.textContent = String(this.value ?? '');
    }

    return wrap;
  }

  ignoreEvent(): boolean { return false; }

  // ─── Renderers ───────────────────────────────────────────────────────

  private renderText(wrap: HTMLElement) {
    const span = document.createElement('span');
    span.className = 'cm-mb-view-text';
    span.textContent = String(this.value ?? '');
    wrap.appendChild(span);
  }

  private renderNumber(wrap: HTMLElement) {
    const span = document.createElement('span');
    span.className = 'cm-mb-view-number';
    span.textContent = String(this.value ?? 0);
    wrap.appendChild(span);
  }

  private renderBoolean(wrap: HTMLElement) {
    const val = Boolean(this.value);
    const span = document.createElement('span');
    span.className = `cm-mb-view-bool cm-mb-bool-${val}`;
    span.textContent = val ? 'Yes' : 'No';
    wrap.appendChild(span);
  }

  private renderDate(wrap: HTMLElement) {
    const span = document.createElement('span');
    span.className = 'cm-mb-view-date';
    const raw = String(this.value ?? '');
    const fmt = this.decl.options.format;
    if (fmt && raw) {
      try {
        const d = new Date(raw);
        span.textContent = d.toLocaleDateString();
      } catch { span.textContent = raw; }
    } else {
      span.textContent = raw;
    }
    wrap.appendChild(span);
  }

  private renderList(wrap: HTMLElement) {
    const items = Array.isArray(this.value) ? this.value : [];
    if (items.length === 0) {
      wrap.textContent = '(empty)';
      return;
    }
    const ul = document.createElement('span');
    ul.className = 'cm-mb-view-list';
    ul.textContent = items.join(', ');
    wrap.appendChild(ul);
  }

  private renderTags(wrap: HTMLElement) {
    const tags = Array.isArray(this.value) ? this.value : [];
    for (const tag of tags) {
      const chip = document.createElement('span');
      chip.className = 'cm-mb-tag-chip';
      chip.textContent = `#${tag}`;
      wrap.appendChild(chip);
    }
    if (tags.length === 0) wrap.textContent = '(no tags)';
  }

  private renderLink(wrap: HTMLElement) {
    const a = document.createElement('a');
    a.className = 'cm-mb-view-link';
    a.href = '#';
    a.textContent = String(this.value ?? '');
    a.setAttribute('data-mb-link', String(this.value ?? ''));
    wrap.appendChild(a);
  }

  private renderProgress(wrap: HTMLElement) {
    const max = this.decl.options.max ?? 100;
    const val = Math.min(Number(this.value ?? 0), max);
    const pct = Math.round((val / max) * 100);

    const bar = document.createElement('span');
    bar.className = 'cm-mb-progress-bar';

    const fill = document.createElement('span');
    fill.className = 'cm-mb-progress-fill';
    fill.style.width = `${pct}%`;
    bar.appendChild(fill);

    const label = document.createElement('span');
    label.className = 'cm-mb-progress-label';
    label.textContent = `${val}/${max}`;

    wrap.appendChild(bar);
    wrap.appendChild(label);
  }

  private renderRating(wrap: HTMLElement) {
    const maxStars = this.decl.options.maxStars ?? 5;
    const val = Math.min(Number(this.value ?? 0), maxStars);
    const stars = document.createElement('span');
    stars.className = 'cm-mb-rating';
    for (let i = 1; i <= maxStars; i++) {
      const star = document.createElement('span');
      star.className = i <= val ? 'cm-mb-star filled' : 'cm-mb-star';
      star.textContent = i <= val ? '\u2605' : '\u2606';
      stars.appendChild(star);
    }
    wrap.appendChild(stars);
  }
}

// ─── BUTTON widget ───────────────────────────────────────────────────────────

export class MetaBindButtonWidget extends WidgetType {
  constructor(
    private decl: ButtonDeclaration,
    private onAction: ButtonActionCallback,
  ) { super(); }

  eq(other: MetaBindButtonWidget): boolean {
    return this.decl.label === other.decl.label
      && this.decl.action === other.decl.action
      && this.decl.actionArgs === other.decl.actionArgs;
  }

  toDOM(view: EditorView): HTMLElement {
    const btn = document.createElement('button');
    const style = this.decl.options.style || 'secondary';
    btn.className = `cm-mb-button cm-mb-btn-${style}`;
    btn.textContent = this.decl.label;
    btn.setAttribute('aria-label', this.decl.label);
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      log.info('MetaBind: button clicked', { label: this.decl.label, action: this.decl.action });
      this.onAction(view, this.decl.action, this.decl.actionArgs);
    });
    return btn;
  }

  ignoreEvent(): boolean { return true; }
}
