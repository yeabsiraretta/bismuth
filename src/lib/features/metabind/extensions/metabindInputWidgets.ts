/**
 * CodeMirror widget classes for MetaBind INPUT fields.
 *
 * Each widget renders an interactive HTML control (toggle, text, slider, etc.)
 * that reads from and writes to frontmatter properties via the provided
 * callback interface.
 */

import { WidgetType } from '@codemirror/view';
import type { EditorView } from '@codemirror/view';
import type { InputFieldDeclaration } from '../types/metabind';
import { log } from '@/utils/logger';

/** Callback for writing a frontmatter value change. */
export type FieldUpdateCallback = (view: EditorView, property: string, value: unknown) => void;

export class MetaBindInputWidget extends WidgetType {
  constructor(
    private decl: InputFieldDeclaration,
    private value: unknown,
    private onUpdate: FieldUpdateCallback
  ) {
    super();
  }

  eq(other: MetaBindInputWidget): boolean {
    return (
      this.decl.property === other.decl.property &&
      this.decl.fieldType === other.decl.fieldType &&
      this.value === other.value
    );
  }

  toDOM(view: EditorView): HTMLElement {
    const wrap = document.createElement('span');
    wrap.className = `cm-mb-input cm-mb-${this.decl.fieldType}`;
    wrap.setAttribute('data-mb-property', this.decl.property);

    switch (this.decl.fieldType) {
      case 'toggle':
        this.renderToggle(wrap, view);
        break;
      case 'text':
        this.renderText(wrap, view);
        break;
      case 'number':
        this.renderNumber(wrap, view);
        break;
      case 'slider':
        this.renderSlider(wrap, view);
        break;
      case 'date':
        this.renderDate(wrap, view);
        break;
      case 'time':
        this.renderTime(wrap, view);
        break;
      case 'select':
        this.renderSelect(wrap, view);
        break;
      case 'multi-select':
        this.renderMultiSelect(wrap, view);
        break;
      case 'textarea':
        this.renderTextarea(wrap, view);
        break;
      case 'color':
        this.renderColor(wrap, view);
        break;
      case 'suggester':
        this.renderText(wrap, view);
        break;
      default:
        wrap.textContent = `[unknown: ${this.decl.fieldType}]`;
    }

    return wrap;
  }

  ignoreEvent(): boolean {
    return true;
  }

  // ─── Renderers ───────────────────────────────────────────────────────

  private renderToggle(wrap: HTMLElement, view: EditorView) {
    const label = document.createElement('label');
    label.className = 'cm-mb-toggle-label';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = Boolean(this.value);
    cb.className = 'cm-mb-toggle-input';
    cb.setAttribute('aria-label', this.decl.property);
    cb.addEventListener('change', () => {
      this.onUpdate(view, this.decl.property, cb.checked);
      log.debug('MetaBind: toggle changed', { property: this.decl.property, value: cb.checked });
    });
    const track = document.createElement('span');
    track.className = 'cm-mb-toggle-track';
    label.appendChild(cb);
    label.appendChild(track);
    wrap.appendChild(label);
  }

  private renderText(wrap: HTMLElement, view: EditorView) {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'cm-mb-text-input';
    input.value = String(this.value ?? '');
    input.placeholder = this.decl.options.placeholder || this.decl.property;
    input.setAttribute('aria-label', this.decl.property);
    input.addEventListener('change', () => {
      this.onUpdate(view, this.decl.property, input.value);
    });
    wrap.appendChild(input);
  }

  private renderNumber(wrap: HTMLElement, view: EditorView) {
    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'cm-mb-number-input';
    input.value = String(this.value ?? '');
    if (this.decl.options.min !== undefined) input.min = String(this.decl.options.min);
    if (this.decl.options.max !== undefined) input.max = String(this.decl.options.max);
    if (this.decl.options.step !== undefined) input.step = String(this.decl.options.step);
    input.setAttribute('aria-label', this.decl.property);
    input.addEventListener('change', () => {
      this.onUpdate(view, this.decl.property, Number(input.value));
    });
    wrap.appendChild(input);
  }

  private renderSlider(wrap: HTMLElement, view: EditorView) {
    const min = this.decl.options.min ?? 0;
    const max = this.decl.options.max ?? 100;
    const step = this.decl.options.step ?? 1;
    const val = Number(this.value ?? min);

    const input = document.createElement('input');
    input.type = 'range';
    input.className = 'cm-mb-slider-input';
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(val);
    input.setAttribute('aria-label', this.decl.property);

    const display = document.createElement('span');
    display.className = 'cm-mb-slider-value';
    display.textContent = String(val);

    input.addEventListener('input', () => {
      display.textContent = input.value;
    });
    input.addEventListener('change', () => {
      this.onUpdate(view, this.decl.property, Number(input.value));
    });
    wrap.appendChild(input);
    wrap.appendChild(display);
  }

  private renderDate(wrap: HTMLElement, view: EditorView) {
    const input = document.createElement('input');
    input.type = 'date';
    input.className = 'cm-mb-date-input';
    input.value = String(this.value ?? '');
    input.setAttribute('aria-label', this.decl.property);
    input.addEventListener('change', () => {
      this.onUpdate(view, this.decl.property, input.value);
    });
    wrap.appendChild(input);
  }

  private renderTime(wrap: HTMLElement, view: EditorView) {
    const input = document.createElement('input');
    input.type = 'time';
    input.className = 'cm-mb-time-input';
    input.value = String(this.value ?? '');
    input.setAttribute('aria-label', this.decl.property);
    input.addEventListener('change', () => {
      this.onUpdate(view, this.decl.property, input.value);
    });
    wrap.appendChild(input);
  }

  private renderSelect(wrap: HTMLElement, view: EditorView) {
    const select = document.createElement('select');
    select.className = 'cm-mb-select-input';
    select.setAttribute('aria-label', this.decl.property);
    const choices = this.decl.options.choices ?? [];
    for (const choice of choices) {
      const opt = document.createElement('option');
      opt.value = choice;
      opt.textContent = choice;
      opt.selected = choice === String(this.value ?? '');
      select.appendChild(opt);
    }
    select.addEventListener('change', () => {
      this.onUpdate(view, this.decl.property, select.value);
    });
    wrap.appendChild(select);
  }

  private renderMultiSelect(wrap: HTMLElement, view: EditorView) {
    const choices = this.decl.options.choices ?? [];
    const current = Array.isArray(this.value) ? this.value.map(String) : [];
    const container = document.createElement('span');
    container.className = 'cm-mb-multi-select';
    for (const choice of choices) {
      const label = document.createElement('label');
      label.className = 'cm-mb-ms-option';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = current.includes(choice);
      cb.addEventListener('change', () => {
        const updated = choices.filter((c) => {
          const el = container.querySelector(`input[data-choice="${c}"]`) as HTMLInputElement;
          return el?.checked;
        });
        this.onUpdate(view, this.decl.property, updated);
      });
      cb.setAttribute('data-choice', choice);
      label.appendChild(cb);
      label.appendChild(document.createTextNode(choice));
      container.appendChild(label);
    }
    wrap.appendChild(container);
  }

  private renderTextarea(wrap: HTMLElement, view: EditorView) {
    const ta = document.createElement('textarea');
    ta.className = 'cm-mb-textarea-input';
    ta.value = String(this.value ?? '');
    ta.rows = 3;
    ta.placeholder = this.decl.options.placeholder || this.decl.property;
    ta.setAttribute('aria-label', this.decl.property);
    ta.addEventListener('change', () => {
      this.onUpdate(view, this.decl.property, ta.value);
    });
    wrap.appendChild(ta);
  }

  private renderColor(wrap: HTMLElement, view: EditorView) {
    const input = document.createElement('input');
    input.type = 'color';
    input.className = 'cm-mb-color-input';
    input.value = String(this.value ?? '#000000');
    input.setAttribute('aria-label', this.decl.property);
    input.addEventListener('change', () => {
      this.onUpdate(view, this.decl.property, input.value);
    });
    wrap.appendChild(input);
  }
}
