/**
 * CodeMirror WidgetType for rendering chord sheets with highlighted chords,
 * chord diagrams, transpose controls, instrument selector, and autoscroll.
 */
import { WidgetType } from '@codemirror/view';
import type { EditorView } from '@codemirror/view';
import type { ChordSheet, ChordInstrument, ChordToken } from '../../types/chords';
import { transposeLines } from './chordTranspose';
import { lookupChord, renderChordDiagramSvg, getUniqueChords } from './chordDiagrams';
import { parseChordSymbol } from './chordParser';

export class ChordSheetWidget extends WidgetType {
  constructor(
    private sheet: ChordSheet,
    private instrument: ChordInstrument = 'guitar',
  ) {
    super();
  }

  toDOM(_view: EditorView): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'cm-chord-sheet';
    wrap.style.cssText = `
      padding: 12px 16px; border-radius: 8px;
      background: var(--background-primary);
      border: 1px solid var(--border-color);
      margin: 4px 0; font-family: var(--font-monospace);
      position: relative; overflow: hidden;
    `;

    let transpose = this.sheet.transpose;
    let instrument = this.sheet.instrument ?? this.instrument;

    const renderAll = () => {
      wrap.innerHTML = '';
      const lines = transposeLines(this.sheet.lines, transpose);

      // Toolbar
      wrap.appendChild(this.buildToolbar(transpose, instrument, (t) => {
        transpose = t; renderAll();
      }, (i) => {
        instrument = i; renderAll();
      }));

      // Chord overview
      const uniqueChords = getUniqueChords(lines);
      if (uniqueChords.length > 0) {
        wrap.appendChild(this.buildChordOverview(uniqueChords, instrument));
      }

      // Lines
      const linesDiv = document.createElement('div');
      linesDiv.className = 'chord-lines';
      linesDiv.style.cssText = 'white-space: pre; line-height: 1.6; font-size: 13px;';

      for (const line of lines) {
        const lineEl = document.createElement('div');

        if (line.type === 'section') {
          lineEl.className = 'chord-section-header';
          lineEl.style.cssText = 'font-weight: 700; color: var(--interactive-accent); margin-top: 12px; font-size: 14px;';
          lineEl.textContent = line.text;
        } else if (line.type === 'chord' && line.chords?.length) {
          lineEl.className = 'chord-line';
          this.renderChordLine(lineEl, line.text, line.chords, instrument);
        } else if (line.type === 'empty') {
          lineEl.innerHTML = '&nbsp;';
        } else if (line.type === 'tab') {
          lineEl.className = 'chord-tab-line';
          lineEl.style.cssText = 'color: var(--text-faint); font-size: 12px;';
          lineEl.textContent = line.text;
        } else {
          lineEl.className = 'chord-lyric-line';
          lineEl.style.cssText = 'color: var(--text-normal);';
          lineEl.textContent = line.text;
        }
        linesDiv.appendChild(lineEl);
      }

      wrap.appendChild(linesDiv);
    };

    renderAll();
    return wrap;
  }

  private buildToolbar(
    transpose: number,
    instrument: ChordInstrument,
    onTranspose: (t: number) => void,
    onInstrument: (i: ChordInstrument) => void,
  ): HTMLElement {
    const bar = document.createElement('div');
    bar.className = 'chord-toolbar';
    bar.style.cssText = `
      display: flex; align-items: center; gap: 8px;
      margin-bottom: 8px; padding-bottom: 8px;
      border-bottom: 1px solid var(--background-modifier-border);
      font-size: 11px; flex-wrap: wrap;
    `;

    // Instrument selector
    const instrSel = document.createElement('select');
    instrSel.style.cssText = 'font-size: 11px; padding: 2px 4px; border-radius: 4px; border: 1px solid var(--border-color); background: var(--background-secondary); color: var(--text-normal);';
    for (const i of ['guitar', 'ukulele', 'mandolin'] as ChordInstrument[]) {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = i.charAt(0).toUpperCase() + i.slice(1);
      opt.selected = i === instrument;
      instrSel.appendChild(opt);
    }
    instrSel.addEventListener('change', () => onInstrument(instrSel.value as ChordInstrument));
    bar.appendChild(instrSel);

    // Transpose controls
    const transposeGroup = document.createElement('div');
    transposeGroup.style.cssText = 'display: flex; align-items: center; gap: 4px; margin-left: auto;';

    const downBtn = this.makeBtn('−', 'Transpose down');
    downBtn.addEventListener('click', () => onTranspose(transpose - 1));

    const label = document.createElement('span');
    label.style.cssText = 'min-width: 60px; text-align: center; color: var(--text-muted);';
    label.textContent = transpose === 0 ? 'Original' : `${transpose > 0 ? '+' : ''}${transpose}`;

    const upBtn = this.makeBtn('+', 'Transpose up');
    upBtn.addEventListener('click', () => onTranspose(transpose + 1));

    const resetBtn = this.makeBtn('↺', 'Reset');
    resetBtn.addEventListener('click', () => onTranspose(0));

    transposeGroup.append(downBtn, label, upBtn, resetBtn);
    bar.appendChild(transposeGroup);

    return bar;
  }

  private makeBtn(text: string, title: string): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.title = title;
    btn.style.cssText = `
      width: 24px; height: 24px; border-radius: 4px;
      border: 1px solid var(--border-color);
      background: var(--background-secondary);
      color: var(--text-normal); cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; line-height: 1;
    `;
    return btn;
  }

  private buildChordOverview(chordNames: string[], instrument: ChordInstrument): HTMLElement {
    const overview = document.createElement('div');
    overview.className = 'chord-overview';
    overview.style.cssText = `
      display: flex; flex-wrap: wrap; gap: 8px;
      margin-bottom: 12px; padding: 8px;
      background: var(--background-secondary);
      border-radius: 6px;
    `;

    for (const name of chordNames) {
      const token = parseChordSymbol(name);
      if (!token) continue;
      const fingerings = lookupChord(token, instrument);
      if (!fingerings.length) continue;

      const diagramEl = document.createElement('div');
      diagramEl.innerHTML = renderChordDiagramSvg(name, fingerings[0], instrument, 80);
      diagramEl.style.cssText = 'color: var(--text-normal);';
      overview.appendChild(diagramEl);
    }

    if (!overview.children.length) {
      overview.remove();
      return document.createElement('span');
    }

    return overview;
  }

  private renderChordLine(
    container: HTMLElement,
    text: string,
    chords: ChordToken[],
    instrument: ChordInstrument,
  ): void {
    container.style.cssText = 'color: var(--interactive-accent); font-weight: 600;';

    // Build the line with hoverable chord tokens
    let lastIdx = 0;
    for (const chord of chords) {
      if (chord.column > lastIdx) {
        container.appendChild(document.createTextNode(text.slice(lastIdx, chord.column)));
      }

      const span = document.createElement('span');
      span.className = 'chord-symbol';
      span.textContent = chord.symbol;
      span.style.cssText = `
        cursor: pointer; position: relative;
        border-bottom: 1px dashed var(--interactive-accent);
        padding-bottom: 1px;
      `;

      // Hover tooltip with chord diagram
      span.addEventListener('mouseenter', () => {
        const existing = span.querySelector('.chord-tooltip');
        if (existing) return;

        const fingerings = lookupChord(chord, instrument);
        if (!fingerings.length) return;

        const tooltip = document.createElement('div');
        tooltip.className = 'chord-tooltip';
        tooltip.style.cssText = `
          position: absolute; bottom: 100%; left: 50%;
          transform: translateX(-50%); z-index: 100;
          background: var(--background-primary);
          border: 1px solid var(--border-color);
          border-radius: 6px; padding: 4px;
          box-shadow: var(--shadow-s);
          pointer-events: none;
        `;
        tooltip.innerHTML = renderChordDiagramSvg(chord.symbol, fingerings[0], instrument, 100);
        tooltip.style.color = 'var(--text-normal)';
        span.appendChild(tooltip);
      });

      span.addEventListener('mouseleave', () => {
        const tooltip = span.querySelector('.chord-tooltip');
        if (tooltip) tooltip.remove();
      });

      container.appendChild(span);
      lastIdx = chord.column + chord.symbol.length;
    }

    if (lastIdx < text.length) {
      container.appendChild(document.createTextNode(text.slice(lastIdx)));
    }
  }

  eq(other: ChordSheetWidget): boolean {
    return this.sheet.from === other.sheet.from &&
      this.sheet.to === other.sheet.to &&
      this.sheet.transpose === other.sheet.transpose &&
      this.instrument === other.instrument &&
      JSON.stringify(this.sheet.lines) === JSON.stringify(other.sheet.lines);
  }
}
