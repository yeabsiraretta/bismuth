/**
 * CodeMirror WidgetType for rendering audio player with waveform
 * visualization, playback controls, bookmarks, and volume control.
 */
import { WidgetType } from '@codemirror/view';
import type { EditorView } from '@codemirror/view';
import type { AudioPlayerBlock, AudioBookmark } from '../../types/audioPlayer';
import { formatTimestamp } from './audioPlayerParser';
import {
  audioPlayerState,
  loadAudio,
  playAudio,
  pauseAudio,
  seekAudio,
  setPlayerVolume,
  addBookmark,
  removeBookmark,
  setBlockBookmarks,
  togglePlayback,
} from '../../stores/audioPlayerStore';
import { get } from 'svelte/store';

export class AudioPlayerWidget extends WidgetType {
  private unsub: (() => void) | null = null;

  constructor(private block: AudioPlayerBlock) {
    super();
  }

  toDOM(_view: EditorView): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'cm-audio-player';
    wrap.style.cssText = `
      padding: 16px; border-radius: 8px;
      background: var(--background-primary);
      border: 1px solid var(--border-color);
      margin: 4px 0; font-family: var(--font-ui);
    `;

    let canvas: HTMLCanvasElement;
    let posLabel: HTMLSpanElement;
    let durLabel: HTMLSpanElement;
    let playBtn: HTMLButtonElement;
    let volSlider: HTMLInputElement;
    let bookmarksList: HTMLDivElement;

    const render = () => {
      wrap.innerHTML = '';
      const state = get(audioPlayerState);

      // File label
      const fileLabel = document.createElement('div');
      fileLabel.style.cssText =
        'font-size: 12px; color: var(--text-muted); margin-bottom: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;';
      fileLabel.textContent = `🎵 ${this.block.filePath}`;
      wrap.appendChild(fileLabel);

      // Waveform canvas
      const canvasWrap = document.createElement('div');
      canvasWrap.style.cssText =
        'position: relative; margin-bottom: 8px; cursor: pointer; height: 80px;';
      canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 80;
      canvas.style.cssText =
        'width: 100%; height: 80px; border-radius: 4px; background: var(--background-secondary);';
      canvasWrap.appendChild(canvas);
      wrap.appendChild(canvasWrap);

      // Click to seek on waveform
      canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const ratio = (e.clientX - rect.left) / rect.width;
        const s = get(audioPlayerState);
        seekAudio(ratio * s.durationSec);
      });

      // Double-click to add bookmark
      canvas.addEventListener('dblclick', (e) => {
        const rect = canvas.getBoundingClientRect();
        const ratio = (e.clientX - rect.left) / rect.width;
        const s = get(audioPlayerState);
        const timeSec = ratio * s.durationSec;
        const label = prompt('Bookmark label:', `Chapter at ${formatTimestamp(timeSec)}`);
        if (label) addBookmark(timeSec, label);
        renderBookmarks();
      });

      // Controls row
      const controls = document.createElement('div');
      controls.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-bottom: 8px;';

      playBtn = this.makeBtn(state.status === 'playing' ? '⏸' : '▶', 'Play/Pause');
      playBtn.style.cssText += '; width: 32px; height: 32px; font-size: 16px;';
      playBtn.addEventListener('click', () => {
        const s = get(audioPlayerState);
        if (s.currentFile !== this.block.filePath) {
          this.loadAndPlay();
        } else {
          togglePlayback();
        }
        updatePlayBtn();
      });
      controls.appendChild(playBtn);

      // Stop button
      const stopBtn = this.makeBtn('⏹', 'Stop');
      stopBtn.addEventListener('click', () => {
        seekAudio(0);
        pauseAudio();
        updatePlayBtn();
      });
      controls.appendChild(stopBtn);

      // Position / Duration
      posLabel = document.createElement('span');
      posLabel.style.cssText =
        'font-size: 12px; color: var(--text-normal); font-family: var(--font-monospace); min-width: 50px;';
      posLabel.textContent = formatTimestamp(state.positionSec);
      controls.appendChild(posLabel);

      const sep = document.createElement('span');
      sep.style.cssText = 'font-size: 12px; color: var(--text-muted);';
      sep.textContent = '/';
      controls.appendChild(sep);

      durLabel = document.createElement('span');
      durLabel.style.cssText =
        'font-size: 12px; color: var(--text-muted); font-family: var(--font-monospace); min-width: 50px;';
      durLabel.textContent = formatTimestamp(state.durationSec);
      controls.appendChild(durLabel);

      // Spacer
      const spacer = document.createElement('div');
      spacer.style.cssText = 'flex: 1;';
      controls.appendChild(spacer);

      // Volume
      const volIcon = document.createElement('span');
      volIcon.style.cssText = 'font-size: 14px; color: var(--text-muted);';
      volIcon.textContent = '🔊';
      controls.appendChild(volIcon);

      volSlider = document.createElement('input');
      volSlider.type = 'range';
      volSlider.min = '0';
      volSlider.max = '100';
      volSlider.value = String(Math.round(state.volume * 100));
      volSlider.style.cssText = 'width: 80px; accent-color: var(--interactive-accent);';
      volSlider.addEventListener('input', () =>
        setPlayerVolume(parseInt(volSlider.value, 10) / 100)
      );
      controls.appendChild(volSlider);

      wrap.appendChild(controls);

      // Bookmarks section
      bookmarksList = document.createElement('div');
      bookmarksList.className = 'audio-bookmarks';
      wrap.appendChild(bookmarksList);
      renderBookmarks();

      // Draw initial waveform
      drawWaveform(
        canvas,
        state.waveformPeaks,
        state.positionSec,
        state.durationSec,
        state.bookmarks
      );

      // Auto-load if this is a new file
      if (!state.currentFile || state.currentFile !== this.block.filePath) {
        if (state.status === 'idle') this.loadFile();
      }
    };

    const updatePlayBtn = () => {
      const s = get(audioPlayerState);
      if (playBtn) playBtn.textContent = s.status === 'playing' ? '⏸' : '▶';
    };

    const renderBookmarks = () => {
      if (!bookmarksList) return;
      const s = get(audioPlayerState);
      const bms = s.currentFile === this.block.filePath ? s.bookmarks : this.block.bookmarks;
      bookmarksList.innerHTML = '';

      if (bms.length === 0) return;

      const title = document.createElement('div');
      title.style.cssText =
        'font-size: 11px; color: var(--text-muted); font-weight: 600; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em;';
      title.textContent = 'Bookmarks';
      bookmarksList.appendChild(title);

      for (const bm of bms) {
        const row = document.createElement('div');
        row.style.cssText =
          'display: flex; align-items: center; gap: 8px; padding: 2px 0; font-size: 12px;';

        const timeBtn = document.createElement('button');
        timeBtn.style.cssText = `
          background: none; border: none; color: var(--interactive-accent);
          cursor: pointer; font-family: var(--font-monospace); font-size: 12px;
          padding: 0; text-decoration: underline;
        `;
        timeBtn.textContent = formatTimestamp(bm.timeSec);
        timeBtn.addEventListener('click', () => seekAudio(bm.timeSec));
        row.appendChild(timeBtn);

        const labelEl = document.createElement('span');
        labelEl.style.cssText = 'color: var(--text-normal); flex: 1;';
        labelEl.textContent = bm.label;
        row.appendChild(labelEl);

        const delBtn = document.createElement('button');
        delBtn.style.cssText =
          'background: none; border: none; color: var(--text-faint); cursor: pointer; font-size: 11px; padding: 0;';
        delBtn.textContent = '×';
        delBtn.title = 'Remove bookmark';
        delBtn.addEventListener('click', () => {
          removeBookmark(bm.id);
          renderBookmarks();
        });
        row.appendChild(delBtn);

        bookmarksList.appendChild(row);
      }
    };

    render();

    // Subscribe to state changes for live updates
    this.unsub = audioPlayerState.subscribe((state) => {
      if (state.currentFile === this.block.filePath) {
        if (posLabel) posLabel.textContent = formatTimestamp(state.positionSec);
        if (durLabel) durLabel.textContent = formatTimestamp(state.durationSec);
        updatePlayBtn();
        if (canvas) {
          drawWaveform(
            canvas,
            state.waveformPeaks,
            state.positionSec,
            state.durationSec,
            state.bookmarks
          );
        }
      }
    });

    return wrap;
  }

  private async loadFile(): Promise<void> {
    // Resolve the vault-relative file path to a URL
    const url = this.resolveFileUrl(this.block.filePath);
    await loadAudio(this.block.filePath, url);
    if (this.block.bookmarks.length) {
      setBlockBookmarks(this.block.bookmarks);
    }
  }

  private async loadAndPlay(): Promise<void> {
    await this.loadFile();
    playAudio();
  }

  private resolveFileUrl(filePath: string): string {
    // In Tauri, vault files are served via asset protocol or fetch
    // For web, try relative path from vault root
    return encodeURI(filePath);
  }

  private makeBtn(text: string, title: string): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.title = title;
    btn.style.cssText = `
      width: 28px; height: 28px; border-radius: 6px;
      border: 1px solid var(--border-color);
      background: var(--background-secondary);
      color: var(--text-normal); cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; line-height: 1;
    `;
    return btn;
  }

  destroy(): void {
    if (this.unsub) {
      this.unsub();
      this.unsub = null;
    }
  }

  eq(other: AudioPlayerWidget): boolean {
    return this.block.filePath === other.block.filePath && this.block.from === other.block.from;
  }
}

// ─── Waveform canvas rendering ───────────────────────────────────────────────

function drawWaveform(
  canvas: HTMLCanvasElement,
  peaks: number[],
  positionSec: number,
  durationSec: number,
  bookmarks: AudioBookmark[]
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  const ratio = durationSec > 0 ? positionSec / durationSec : 0;

  ctx.clearRect(0, 0, w, h);

  if (peaks.length === 0) {
    ctx.fillStyle = 'rgba(127, 127, 127, 0.2)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(127, 127, 127, 0.5)';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Loading waveform...', w / 2, h / 2 + 4);
    return;
  }

  const barWidth = w / peaks.length;
  const gap = Math.max(1, barWidth * 0.15);
  const playedX = ratio * w;

  for (let i = 0; i < peaks.length; i++) {
    const x = i * barWidth;
    const barH = Math.max(2, peaks[i] * (h - 4));
    const y = (h - barH) / 2;
    const played = x + barWidth <= playedX;
    const current = x <= playedX && x + barWidth > playedX;

    if (played || current) {
      ctx.fillStyle = 'var(--interactive-accent, #dc2626)';
    } else {
      ctx.fillStyle = 'rgba(127, 127, 127, 0.35)';
    }

    ctx.fillRect(x + gap / 2, y, barWidth - gap, barH);
  }

  // Bookmark markers
  for (const bm of bookmarks) {
    if (durationSec <= 0) continue;
    const x = (bm.timeSec / durationSec) * w;
    ctx.strokeStyle = 'var(--text-accent, #f59e0b)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
    ctx.setLineDash([]);

    // Label
    ctx.fillStyle = 'var(--text-accent, #f59e0b)';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(bm.label, x + 2, 10);
  }

  // Playhead
  ctx.strokeStyle = 'var(--text-normal, #cdd6f4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(playedX, 0);
  ctx.lineTo(playedX, h);
  ctx.stroke();
}
