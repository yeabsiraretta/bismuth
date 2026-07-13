<script lang="ts">
  import Panel from '@/ui/panel.svelte';
  import { getElements, addElement, setSelectedId } from '@/hubs/canvas/stores/canvas-store.svelte';
  import {
    createCard,
    createRect,
    createEllipse,
    createText,
    createLine,
    createNote,
    createGroup,
    createFrame,
    createComponent,
    createVector,
  } from '@/hubs/canvas/types/canvas-types';
  import type { CanvasElement } from '@/hubs/canvas/types/canvas-types';
  import BIcon from '@/ui/b-icon.svelte';

  const ELEMENT_TYPES = [
    { kind: 'card', label: 'Card', icon: 'documentBlank' },
    { kind: 'rect', label: 'Rectangle', icon: 'rect' },
    { kind: 'ellipse', label: 'Ellipse', icon: 'ellipse' },
    { kind: 'text', label: 'Text', icon: 'textBars' },
    { kind: 'line', label: 'Line', icon: 'line' },
    { kind: 'note', label: 'Note', icon: 'document' },
    { kind: 'image', label: 'Image', icon: 'photo' },
    { kind: 'group', label: 'Group', icon: 'cube' },
    { kind: 'frame', label: 'Frame', icon: 'rect' },
    { kind: 'component', label: 'Component', icon: 'diamond' },
    { kind: 'vector', label: 'Vector', icon: 'line' },
  ] as const;

  const FACTORIES: Record<string, (o?: Record<string, unknown>) => CanvasElement> = {
    card: (o) => createCard(o as Parameters<typeof createCard>[0]),
    rect: (o) => createRect(o as Parameters<typeof createRect>[0]),
    ellipse: (o) => createEllipse(o as Parameters<typeof createEllipse>[0]),
    text: (o) => createText(o as Parameters<typeof createText>[0]),
    line: (o) => createLine(o as Parameters<typeof createLine>[0]),
    note: (o) => createNote(o as Parameters<typeof createNote>[0]),
    group: (o) => createGroup(o as Parameters<typeof createGroup>[0]),
    frame: (o) => createFrame(o as Parameters<typeof createFrame>[0]),
    component: (o) => createComponent(o as Parameters<typeof createComponent>[0]),
    vector: (o) => createVector(o as Parameters<typeof createVector>[0]),
  };

  let els = $derived(getElements());

  function add(kind: string) {
    const factory = FACTORIES[kind];
    if (!factory) return;
    const el = factory({
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
    });
    addElement(el);
    setSelectedId(el.id);
  }

  function selectEl(id: string) {
    setSelectedId(id);
  }

  function kindLabel(el: CanvasElement): string {
    if (el.kind === 'card' || el.kind === 'note') return el.title || el.kind;
    if (el.kind === 'frame' || el.kind === 'component') return el.label || el.kind;
    if (el.kind === 'group') return el.label || el.kind;
    return el.name || el.kind;
  }
</script>

<Panel title="Elements">
  {#snippet badge()}<span class="panel-badge">{els.length}</span>{/snippet}

  <div class="elements-panel">
    <div class="add-section">
      <h4 class="section-label">Add Element</h4>
      <div class="element-grid">
        {#each ELEMENT_TYPES as et (et.kind)}
          <button class="element-btn" onclick={() => add(et.kind)} title={et.label}>
            <BIcon name={et.icon} size={14} class="el-icon" />
            <span class="el-label">{et.label}</span>
          </button>
        {/each}
      </div>
    </div>

    <div class="cards-section">
      <h4 class="section-label">On Canvas ({els.length})</h4>
      <ul class="card-list">
        {#each els as el (el.id)}
          <li class="card-item">
            <button class="card-item-btn" onclick={() => selectEl(el.id)}>
              <span class="card-kind">{el.kind}</span>
              <span class="card-preview">{kindLabel(el)}</span>
              <span class="card-pos">{Math.round(el.x)}, {Math.round(el.y)}</span>
            </button>
          </li>
        {/each}
      </ul>
    </div>
  </div>
</Panel>

<style>
  .elements-panel {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 8px;
  }
  .section-label {
    font-size: 0.65rem;
    font-weight: 600;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0 0 4px;
  }
  .element-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px;
  }
  .element-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 8px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-surface);
    cursor: pointer;
    transition: all var(--transition-base);
  }
  .element-btn:hover {
    border-color: var(--color-accent);
    background: var(--color-surface-hover);
  }
  .element-btn :global(.el-icon) {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
    color: var(--color-text-muted);
  }
  .el-label {
    font-size: 0.65rem;
    color: var(--color-text);
  }
  .cards-section {
    margin-top: 4px;
  }
  .card-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .card-item {
    border-bottom: 1px solid var(--color-border);
  }
  .card-item-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 4px 2px;
    background: none;
    border: none;
    cursor: pointer;
    font-family: inherit;
    text-align: left;
  }
  .card-item-btn:hover {
    background: var(--color-surface-hover);
  }
  .card-kind {
    font-size: 0.55rem;
    color: var(--color-text-subtle);
    text-transform: uppercase;
    min-width: 36px;
  }
  .card-preview {
    color: var(--color-text);
    font-size: 0.7rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
  }
  .card-pos {
    color: var(--color-text-muted);
    font-size: 0.6rem;
    flex-shrink: 0;
  }
</style>
