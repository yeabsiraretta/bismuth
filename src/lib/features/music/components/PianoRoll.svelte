<script lang="ts">
  /**
   * PianoRoll — HTML canvas MIDI note editor.
   *
   * Receives notes[] as prop — MUST NOT import stores directly.
   * Dispatches notesChanged(notes) upward on every mutation.
   *
   * Interactions:
   *   Left-click empty grid  → add note at quantized position
   *   Left-click + drag note → move note
   *   Right-click note       → delete note
   *   Drag right edge        → resize duration
   */
  import { onMount } from 'svelte';
  import { log } from '@/utils/logger';
  import type { MidiNote } from '../types/music';
  import {
    PIANO_KEY_WIDTH,
    NOTE_HEIGHT,
    TOTAL_PITCHES,
    PIXELS_PER_BEAT,
    TICKS_PER_BEAT,
    divisionToTicks,
    quantizeTick,
    noteAtPoint,
    isResizeHandle,
    yToPitch,
    xToTick,
    drawGrid,
    drawPianoKeys,
    drawNotes,
    type GridDivision,
  } from './pianoRollCanvas';

  export let notes: MidiNote[] = [];
  export let onNotesChanged: ((notes: MidiNote[]) => void) | undefined = undefined;

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;
  let accentColor = '#6366f1';
  let grid: GridDivision = '1/16';
  let scrollX = 0;
  let scrollY = 0;

  type DragMode = 'none' | 'move' | 'resize' | 'new';
  let dragMode: DragMode = 'none';
  let dragNote: MidiNote | null = null;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragOrigTick = 0;
  let dragOrigDur = 0;

  const GRID_DIVISIONS: GridDivision[] = ['1/4', '1/8', '1/16', '1/32'];
  const CANVAS_WIDTH = PIANO_KEY_WIDTH + 64 * PIXELS_PER_BEAT;
  const CANVAS_HEIGHT = TOTAL_PITCHES * NOTE_HEIGHT;

  onMount(() => {
    ctx = canvas.getContext('2d');
    accentColor = getComputedStyle(canvas).getPropertyValue('--color-accent').trim() || '#6366f1';
    draw();
  });

  $: if (ctx) {
    draw();
  }

  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid(ctx, canvas.width, canvas.height, scrollX, scrollY, grid);
    drawPianoKeys(ctx, canvas.height, scrollY);
    drawNotes(ctx, notes, canvas.width, scrollX, scrollY, accentColor);
  }

  function canvasXY(e: MouseEvent): [number, number] {
    const rect = canvas.getBoundingClientRect();
    return [e.clientX - rect.left, e.clientY - rect.top];
  }

  function onPointerDown(e: MouseEvent) {
    const [cx, cy] = canvasXY(e);
    if (e.button === 2) {
      const hit = noteAtPoint(cx, cy, notes, scrollX, scrollY);
      if (hit) deleteNote(hit);
      return;
    }
    const hit = noteAtPoint(cx, cy, notes, scrollX, scrollY);
    if (hit) {
      if (isResizeHandle(cx, hit, scrollX, scrollY)) {
        dragMode = 'resize';
        dragNote = { ...hit };
        dragOrigDur = hit.durationTicks;
      } else {
        dragMode = 'move';
        dragNote = { ...hit };
        dragOrigTick = hit.startTick;
      }
      dragStartX = cx;
      dragStartY = cy;
    } else if (cx > PIANO_KEY_WIDTH) {
      dragMode = 'new';
      dragStartX = cx;
      dragStartY = cy;
    }
  }

  function onPointerMove(e: MouseEvent) {
    if (dragMode === 'none') return;
    const [cx, cy] = canvasXY(e);
    const dx = cx - dragStartX;
    const dy = cy - dragStartY;
    const tpp = TICKS_PER_BEAT / PIXELS_PER_BEAT;
    if (dragMode === 'move' && dragNote) {
      const newTick = quantizeTick(Math.max(0, dragOrigTick + dx * tpp), grid);
      const newPitch = yToPitch(dragStartY + dy, scrollY);
      notes = notes.map((n) =>
        n.startTick === dragNote!.startTick && n.pitch === dragNote!.pitch
          ? { ...n, startTick: newTick, pitch: newPitch }
          : n
      );
      draw();
    } else if (dragMode === 'resize' && dragNote) {
      const step = divisionToTicks(grid);
      const newDur = Math.max(step, quantizeTick(dragOrigDur + dx * tpp, grid));
      notes = notes.map((n) =>
        n.startTick === dragNote!.startTick && n.pitch === dragNote!.pitch
          ? { ...n, durationTicks: newDur }
          : n
      );
      draw();
    }
  }

  function onPointerUp(e: MouseEvent) {
    if (dragMode === 'new') {
      addNote(...canvasXY(e));
    } else if (dragMode !== 'none') {
      onNotesChanged?.(notes);
      log.debug('[PianoRoll] notesChanged', { count: notes.length });
    }
    dragMode = 'none';
    dragNote = null;
  }

  function addNote(cx: number, cy: number) {
    const step = divisionToTicks(grid);
    const note: MidiNote = {
      pitch: yToPitch(cy, scrollY),
      startTick: quantizeTick(xToTick(cx, scrollX), grid),
      durationTicks: step * 2,
      velocity: 100,
    };
    notes = [...notes, note];
    onNotesChanged?.(notes);
    log.debug('[PianoRoll] addNote', { pitch: note.pitch });
    draw();
  }

  function deleteNote(note: MidiNote) {
    notes = notes.filter((n) => n !== note);
    onNotesChanged?.(notes);
    log.debug('[PianoRoll] deleteNote', { pitch: note.pitch });
    draw();
  }

  function onScroll(e: WheelEvent) {
    e.preventDefault();
    scrollX = Math.max(0, scrollX + e.deltaX);
    scrollY = Math.max(0, Math.min(scrollY + e.deltaY, CANVAS_HEIGHT - canvas.height));
    draw();
  }
</script>

<div class="piano-roll">
  <div class="toolbar" role="toolbar" aria-label="Quantization grid">
    {#each GRID_DIVISIONS as div}
      <button
        class="grid-btn"
        class:active={grid === div}
        on:click={() => {
          grid = div;
        }}
        aria-pressed={grid === div}
        title="Snap to {div}">{div}</button
      >
    {/each}
    <span class="toolbar-hint">Right-click note to delete</span>
  </div>

  <div class="canvas-wrap">
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <canvas
      bind:this={canvas}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      class="roll-canvas"
      on:mousedown={onPointerDown}
      on:mousemove={onPointerMove}
      on:mouseup={onPointerUp}
      on:wheel={onScroll}
      on:contextmenu|preventDefault
    ></canvas>
  </div>
</div>

<style>
  .piano-roll {
    display: flex;
    flex-direction: column;
    flex: 1 1 0;
    overflow: hidden;
    background: var(--background-primary, #181825);
    --color-accent: #6366f1;
  }
  .toolbar {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs, 4px);
    padding: 4px 8px;
    background: var(--background-secondary, #1e1e2e);
    border-bottom: 1px solid var(--background-modifier-border, #313244);
    flex-shrink: 0;
  }
  .grid-btn {
    background: var(--background-modifier-hover, #313244);
    border: 1px solid var(--background-modifier-border, #45475a);
    border-radius: var(--radius-s, 4px);
    color: var(--text-muted, #a6adc8);
    cursor: pointer;
    font-size: 10px;
    font-family: var(--font-mono);
    padding: 2px 8px;
    transition:
      color 0.1s,
      background 0.1s;
  }
  .grid-btn.active {
    background: var(--interactive-accent, #6366f1);
    border-color: var(--interactive-accent, #6366f1);
    color: #fff;
  }
  .toolbar-hint {
    margin-left: auto;
    font-size: 10px;
    color: var(--text-faint, #6c7086);
  }
  .canvas-wrap {
    flex: 1;
    overflow: auto;
    cursor: crosshair;
  }
  .roll-canvas {
    display: block;
  }
</style>
