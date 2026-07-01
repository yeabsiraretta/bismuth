/**
 * ProgressBar Widget — CodeMirror WidgetType rendering a visual progress bar.
 * Supports time-based and manual bars with +/- buttons, ID syncing, name templates.
 */
import { WidgetType } from '@codemirror/view';
import type { EditorView } from '@codemirror/view';
import type { ProgressBarBlock } from '../types/progressbar';

/** Map of id → current value for syncing bars with same id */
const idValueMap = new Map<string, number>();

export class ProgressBarWidget extends WidgetType {
  constructor(private block: ProgressBarBlock) { super(); }

  eq(other: ProgressBarWidget): boolean {
    return this.block.raw === other.block.raw;
  }

  toDOM(view: EditorView): HTMLElement {
    const { data } = this.block;
    const wrap = document.createElement('div');
    wrap.className = 'cm-progressbar-widget';
    wrap.style.width = data.width;

    // Sync value from idValueMap if available
    let currentValue = data.value;
    if (data.id && idValueMap.has(data.id)) {
      currentValue = idValueMap.get(data.id)!;
    } else if (data.id) {
      idValueMap.set(data.id, currentValue);
    }

    const pct = data.max - data.min > 0
      ? Math.round(((currentValue - data.min) / (data.max - data.min)) * 100) : 0;

    // Label row
    const labelRow = document.createElement('div');
    labelRow.className = 'cm-progressbar-label-row';

    const label = document.createElement('span');
    label.className = 'cm-progressbar-label';
    label.textContent = data.label;
    labelRow.appendChild(label);

    const pctLabel = document.createElement('span');
    pctLabel.className = 'cm-progressbar-pct';
    pctLabel.textContent = `${pct}%`;
    labelRow.appendChild(pctLabel);

    wrap.appendChild(labelRow);

    // Bar container
    const barContainer = document.createElement('div');
    barContainer.className = 'cm-progressbar-bar';

    const fill = document.createElement('div');
    fill.className = 'cm-progressbar-fill';
    fill.style.width = `${pct}%`;

    // Color based on percentage
    if (pct >= 75) fill.classList.add('cm-progressbar-fill-high');
    else if (pct >= 40) fill.classList.add('cm-progressbar-fill-mid');
    else fill.classList.add('cm-progressbar-fill-low');

    barContainer.appendChild(fill);
    wrap.appendChild(barContainer);

    // Value detail
    const detail = document.createElement('div');
    detail.className = 'cm-progressbar-detail';
    detail.textContent = `${currentValue} / ${data.max}`;
    wrap.appendChild(detail);

    // Buttons for manual bars
    if (data.showButtons) {
      const btnRow = document.createElement('div');
      btnRow.className = 'cm-progressbar-buttons';

      const minusBtn = document.createElement('button');
      minusBtn.className = 'cm-progressbar-btn';
      minusBtn.textContent = '-';
      minusBtn.title = 'Decrease value';
      minusBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.updateValue(view, currentValue - 1);
      });

      const plusBtn = document.createElement('button');
      plusBtn.className = 'cm-progressbar-btn';
      plusBtn.textContent = '+';
      plusBtn.title = 'Increase value';
      plusBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.updateValue(view, currentValue + 1);
      });

      btnRow.appendChild(minusBtn);
      btnRow.appendChild(plusBtn);
      wrap.appendChild(btnRow);
    }

    return wrap;
  }

  /** Update the value in the document and sync across bars with same id */
  private updateValue(view: EditorView, newValue: number): void {
    const { data } = this.block;
    const clamped = Math.max(data.min, Math.min(newValue, data.max));

    // Update idValueMap for syncing
    if (data.id) idValueMap.set(data.id, clamped);

    // Update the value in the code block text
    const doc = view.state.doc.toString();
    const blockText = doc.slice(this.block.from, this.block.to);

    const valueRe = /^(\s*value\s*:\s*).+$/m;
    const valueMatch = blockText.match(valueRe);

    if (valueMatch) {
      const newBlockText = blockText.replace(valueRe, `$1${clamped}`);
      view.dispatch({
        changes: { from: this.block.from, to: this.block.to, insert: newBlockText },
      });
    }

    // If id is set, update all other blocks with same id
    if (data.id) {
      this.syncBlocksWithId(view, data.id, clamped);
    }
  }

  /** Find and update all blocks with matching id */
  private syncBlocksWithId(view: EditorView, id: string, value: number): void {
    const doc = view.state.doc.toString();
    const blockRe = /```progressbar\s*\n([\s\S]*?)```/g;
    let match: RegExpExecArray | null;
    const changes: Array<{ from: number; to: number; insert: string }> = [];

    blockRe.lastIndex = 0;
    while ((match = blockRe.exec(doc)) !== null) {
      const blockContent = match[1];
      const blockStart = match.index;
      const blockEnd = blockStart + match[0].length;

      // Check if this block has the same id
      const idMatch = blockContent.match(/^\s*id\s*:\s*(.+)$/m);
      if (!idMatch) continue;
      const blockId = idMatch[1].trim().replace(/^["']|["']$/g, '');
      if (blockId !== id) continue;

      // Skip the block we already updated
      if (blockStart === this.block.from) continue;

      const fullBlock = doc.slice(blockStart, blockEnd);
      const valueRe = /^(\s*value\s*:\s*).+$/m;
      if (valueRe.test(fullBlock)) {
        const updated = fullBlock.replace(valueRe, `$1${value}`);
        if (updated !== fullBlock) {
          changes.push({ from: blockStart, to: blockEnd, insert: updated });
        }
      }
    }

    if (changes.length > 0) {
      view.dispatch({ changes });
    }
  }
}
