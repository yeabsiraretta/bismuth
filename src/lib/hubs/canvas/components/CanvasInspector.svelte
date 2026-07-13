<script lang="ts">
  import type { CanvasElement } from '@/hubs/canvas/types/canvas-types';
  import type {
    ConnectionElement,
    MarkerType,
    ConnectionRouting,
  } from '@/hubs/canvas/services/canvas-connections';
  import {
    ALL_NODE_SHAPES,
    ALL_BORDER_STYLES,
    ALL_TEXT_ALIGNS,
    type NodeShape,
    type BorderStyle,
    type NodeTextAlign,
  } from '@/hubs/canvas/services/canvas-node-styles';
  import Panel from '@/ui/panel.svelte';
  import { SWATCH_COLORS } from '@/constants/colors';
  import {
    getElements,
    getSelectedCard,
    getSelectedElements,
    getConnections,
    getZoom,
    updateElement,
    updateConnection,
    deleteElement,
    deleteConnection,
  } from '@/hubs/canvas/stores/canvas-store.svelte';

  let el = $derived(getSelectedCard());
  let multiSel = $derived(getSelectedElements());
  let elCount = $derived(getElements().length);
  let allConns = $derived(getConnections());
  let zoom = $derived(getZoom());
  let hasCard = $derived(el && (el.kind === 'card' || el.kind === 'note'));
  let hasShape = $derived(el && (el.kind === 'rect' || el.kind === 'ellipse'));
  let hasText = $derived(el && el.kind === 'text');
  let hasLine = $derived(el && el.kind === 'line');
  let hasGroup = $derived(el && el.kind === 'group');

  const MARKERS: MarkerType[] = ['none', 'arrow', 'circle', 'diamond'];
  const ROUTINGS: ConnectionRouting[] = ['straight', 'elbow', 'bezier'];

  function updConn(conn: ConnectionElement, updates: Partial<ConnectionElement>) {
    updateConnection(conn.id, updates);
  }

  function upd(updates: Partial<CanvasElement>) {
    if (el) updateElement(el.id, updates);
  }

  const COLORS = SWATCH_COLORS;
</script>

<Panel title="Inspector">
  <div class="inspector-body">
    <div class="inspector-stats">
      <div class="stat-row">
        <span class="stat-label">Elements</span>
        <span class="stat-value">{elCount}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Zoom</span>
        <span class="stat-value">{Math.round(zoom * 100)}%</span>
      </div>
    </div>

    {#if multiSel.length > 1}
      <div class="inspector-section">
        <h4 class="section-label">{multiSel.length} elements selected</h4>
        <div class="field-row">
          <label class="field-label" for="multi-op">Opacity</label>
          <input
            id="multi-op"
            type="number"
            class="field-num"
            min="0"
            max="1"
            step="0.1"
            value={multiSel.every((e) => e.opacity === multiSel[0].opacity)
              ? multiSel[0].opacity
              : ''}
            placeholder={multiSel.every((e) => e.opacity === multiSel[0].opacity) ? '' : 'Mixed'}
            onchange={(e) => {
              const val = +(e.target as HTMLInputElement).value;
              for (const s of multiSel)
                updateElement(s.id, { opacity: val } as Partial<CanvasElement>);
            }}
          />
        </div>
      </div>
    {:else if el}
      <div class="inspector-section">
        <h4 class="section-label">{el.kind} — {el.name || el.id.slice(0, 8)}</h4>

        <div class="field-row">
          <label class="field-label" for="el-x">X</label>
          <input
            id="el-x"
            type="number"
            class="field-num"
            value={Math.round(el.x)}
            onchange={(e) =>
              upd({ x: +(e.target as HTMLInputElement).value } as Partial<CanvasElement>)}
          />
          <label class="field-label" for="el-y">Y</label>
          <input
            id="el-y"
            type="number"
            class="field-num"
            value={Math.round(el.y)}
            onchange={(e) =>
              upd({ y: +(e.target as HTMLInputElement).value } as Partial<CanvasElement>)}
          />
        </div>
        <div class="field-row">
          <label class="field-label" for="el-w">W</label>
          <input
            id="el-w"
            type="number"
            class="field-num"
            value={Math.round(el.width)}
            onchange={(e) =>
              upd({ width: +(e.target as HTMLInputElement).value } as Partial<CanvasElement>)}
          />
          <label class="field-label" for="el-h">H</label>
          <input
            id="el-h"
            type="number"
            class="field-num"
            value={Math.round(el.height)}
            onchange={(e) =>
              upd({ height: +(e.target as HTMLInputElement).value } as Partial<CanvasElement>)}
          />
        </div>
        <div class="field-row">
          <label class="field-label" for="el-rot">Rot</label>
          <input
            id="el-rot"
            type="number"
            class="field-num"
            value={Math.round(el.rotation)}
            onchange={(e) =>
              upd({ rotation: +(e.target as HTMLInputElement).value } as Partial<CanvasElement>)}
          />
          <label class="field-label" for="el-op">Op</label>
          <input
            id="el-op"
            type="number"
            class="field-num"
            min="0"
            max="1"
            step="0.1"
            value={el.opacity}
            onchange={(e) =>
              upd({ opacity: +(e.target as HTMLInputElement).value } as Partial<CanvasElement>)}
          />
        </div>

        {#if hasCard}
          <label class="field-label" for="el-title">Title</label>
          <input
            id="el-title"
            type="text"
            class="field-input"
            value={el.kind === 'card' || el.kind === 'note' ? el.title : ''}
            oninput={(e) =>
              upd({ title: (e.target as HTMLInputElement).value } as Partial<CanvasElement>)}
          />
          <span class="field-label">Color</span>
          <div class="color-row">
            {#each COLORS as c (c)}
              <button
                class="color-swatch"
                class:selected={el.kind === 'card' || el.kind === 'note' ? el.color === c : false}
                style="background: {c}"
                onclick={() => upd({ color: c } as Partial<CanvasElement>)}
                aria-label="Set color {c}"
              ></button>
            {/each}
          </div>
          <div class="field-row">
            <span class="field-label">Shape</span>
            <select
              class="field-input"
              value={el.kind === 'card' || el.kind === 'note' ? el.shape : 'rectangle'}
              onchange={(e) =>
                upd({
                  shape: (e.target as HTMLSelectElement).value as NodeShape,
                } as Partial<CanvasElement>)}
            >
              {#each ALL_NODE_SHAPES as s (s)}<option value={s}>{s}</option>{/each}
            </select>
          </div>
          <div class="field-row">
            <span class="field-label">Border</span>
            <select
              class="field-input"
              value={el.kind === 'card' || el.kind === 'note' ? el.borderStyle : 'solid'}
              onchange={(e) =>
                upd({
                  borderStyle: (e.target as HTMLSelectElement).value as BorderStyle,
                } as Partial<CanvasElement>)}
            >
              {#each ALL_BORDER_STYLES as b (b)}<option value={b}>{b}</option>{/each}
            </select>
          </div>
          <div class="field-row">
            <span class="field-label">Text</span>
            <select
              class="field-input"
              value={el.kind === 'card' || el.kind === 'note' ? el.textAlign : 'left'}
              onchange={(e) =>
                upd({
                  textAlign: (e.target as HTMLSelectElement).value as NodeTextAlign,
                } as Partial<CanvasElement>)}
            >
              {#each ALL_TEXT_ALIGNS as a (a)}<option value={a}>{a}</option>{/each}
            </select>
          </div>
        {/if}

        {#if hasGroup && el.kind === 'group'}
          <div class="field-row">
            <label class="field-label" for="grp-label">Label</label>
            <input
              id="grp-label"
              type="text"
              class="field-input"
              value={el.label}
              oninput={(e) =>
                upd({ label: (e.target as HTMLInputElement).value } as Partial<CanvasElement>)}
            />
          </div>
          <div class="field-row">
            <label class="field-label" for="grp-collapse">Collapsed</label>
            <input
              id="grp-collapse"
              type="checkbox"
              checked={el.collapsed}
              onchange={(e) =>
                upd({
                  collapsed: (e.target as HTMLInputElement).checked,
                } as Partial<CanvasElement>)}
            />
          </div>
        {/if}

        {#if hasShape && (el.kind === 'rect' || el.kind === 'ellipse')}
          <label class="field-label" for="fill-c">Fill</label>
          <input
            id="fill-c"
            type="color"
            class="field-input"
            value={el.fill.color}
            onchange={(e) =>
              upd({
                fill: { ...el.fill, color: (e.target as HTMLInputElement).value },
              } as Partial<CanvasElement>)}
          />
          <label class="field-label" for="stroke-c">Stroke</label>
          <div class="field-row">
            <input
              id="stroke-c"
              type="color"
              class="field-input"
              value={el.stroke.color}
              onchange={(e) =>
                upd({
                  stroke: { ...el.stroke, color: (e.target as HTMLInputElement).value },
                } as Partial<CanvasElement>)}
            />
            <input
              type="number"
              class="field-num"
              value={el.stroke.width}
              min="0"
              step="0.5"
              onchange={(e) =>
                upd({
                  stroke: { ...el.stroke, width: +(e.target as HTMLInputElement).value },
                } as Partial<CanvasElement>)}
            />
          </div>
          {#if el.kind === 'rect'}
            <label class="field-label" for="cr">Radius</label>
            <input
              id="cr"
              type="number"
              class="field-num"
              value={el.cornerRadius}
              min="0"
              onchange={(e) =>
                upd({
                  cornerRadius: +(e.target as HTMLInputElement).value,
                } as Partial<CanvasElement>)}
            />
          {/if}
        {/if}

        {#if hasText && el.kind === 'text'}
          <label class="field-label" for="fs">Font Size</label>
          <input
            id="fs"
            type="number"
            class="field-num"
            value={el.fontSize}
            min="8"
            max="200"
            onchange={(e) =>
              upd({ fontSize: +(e.target as HTMLInputElement).value } as Partial<CanvasElement>)}
          />
          <label class="field-label" for="fw">Weight</label>
          <input
            id="fw"
            type="number"
            class="field-num"
            value={el.fontWeight}
            min="100"
            max="900"
            step="100"
            onchange={(e) =>
              upd({ fontWeight: +(e.target as HTMLInputElement).value } as Partial<CanvasElement>)}
          />
          <label class="field-label" for="tc">Color</label>
          <input
            id="tc"
            type="color"
            class="field-input"
            value={el.textColor}
            onchange={(e) =>
              upd({ textColor: (e.target as HTMLInputElement).value } as Partial<CanvasElement>)}
          />
        {/if}

        {#if hasLine && el.kind === 'line'}
          <label class="field-label" for="lsc">Stroke</label>
          <div class="field-row">
            <input
              id="lsc"
              type="color"
              class="field-input"
              value={el.stroke.color}
              onchange={(e) =>
                upd({
                  stroke: { ...el.stroke, color: (e.target as HTMLInputElement).value },
                } as Partial<CanvasElement>)}
            />
            <input
              type="number"
              class="field-num"
              value={el.stroke.width}
              min="0.5"
              step="0.5"
              onchange={(e) =>
                upd({
                  stroke: { ...el.stroke, width: +(e.target as HTMLInputElement).value },
                } as Partial<CanvasElement>)}
            />
          </div>
          <label class="field-label" for="ldash">Dash</label>
          <input
            id="ldash"
            type="text"
            class="field-input"
            value={el.stroke.dash.join(', ')}
            placeholder="e.g. 6, 3"
            onchange={(e) => {
              const v = (e.target as HTMLInputElement).value;
              upd({
                stroke: { ...el.stroke, dash: v ? v.split(',').map(Number) : [] },
              } as Partial<CanvasElement>);
            }}
          />
        {/if}

        <button class="delete-btn" onclick={() => deleteElement(el.id)}>Delete</button>
      </div>
    {:else}
      <div class="panel-empty">Select an element to inspect</div>
    {/if}

    {#if allConns.length > 0}
      <div class="inspector-section">
        <h4 class="section-label">Connections ({allConns.length})</h4>
        {#each allConns as conn (conn.id)}
          <div class="conn-row">
            <div class="field-row">
              <span class="field-label">Route</span>
              <select
                class="field-input"
                value={conn.routing}
                onchange={(e) =>
                  updConn(conn, {
                    routing: (e.target as HTMLSelectElement).value as ConnectionRouting,
                  })}
              >
                {#each ROUTINGS as r (r)}<option value={r}>{r}</option>{/each}
              </select>
            </div>
            <div class="field-row">
              <span class="field-label">Start</span>
              <select
                class="field-input"
                value={conn.startMarker}
                onchange={(e) =>
                  updConn(conn, {
                    startMarker: (e.target as HTMLSelectElement).value as MarkerType,
                  })}
              >
                {#each MARKERS as m (m)}<option value={m}>{m}</option>{/each}
              </select>
              <span class="field-label">End</span>
              <select
                class="field-input"
                value={conn.endMarker}
                onchange={(e) =>
                  updConn(conn, { endMarker: (e.target as HTMLSelectElement).value as MarkerType })}
              >
                {#each MARKERS as m (m)}<option value={m}>{m}</option>{/each}
              </select>
            </div>
            <div class="field-row">
              <input
                type="color"
                class="field-input"
                value={conn.strokeColor === 'var(--color-text-muted)'
                  ? '#888888'
                  : conn.strokeColor}
                onchange={(e) =>
                  updConn(conn, { strokeColor: (e.target as HTMLInputElement).value })}
              />
              <input
                type="number"
                class="field-num"
                value={conn.strokeWidth}
                min="0.5"
                step="0.5"
                onchange={(e) =>
                  updConn(conn, { strokeWidth: +(e.target as HTMLInputElement).value })}
              />
            </div>
            <div class="field-row">
              <input
                type="text"
                class="field-input"
                value={conn.label}
                placeholder="Label"
                oninput={(e) => updConn(conn, { label: (e.target as HTMLInputElement).value })}
              />
              <button class="delete-btn" onclick={() => deleteConnection(conn.id)}>×</button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</Panel>

<style>
  .inspector-body {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .inspector-stats {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .stat-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.7rem;
  }
  .stat-label {
    color: var(--color-text-muted);
  }
  .stat-value {
    color: var(--color-text);
    font-weight: 500;
  }
  .inspector-section {
    display: flex;
    flex-direction: column;
    gap: 6px;
    border-top: 1px solid var(--color-border);
    padding-top: 8px;
  }
  .section-label {
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--color-text-muted);
    margin: 0;
  }
  .field-label {
    font-size: 0.65rem;
    color: var(--color-text-muted);
    margin-top: 2px;
  }
  .field-input {
    padding: 3px 6px;
    font-size: 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-background);
    color: var(--color-text);
    font-family: inherit;
  }
  .field-input:focus {
    border-color: var(--color-accent);
    outline: none;
  }
  .color-row {
    display: flex;
    gap: 4px;
  }
  .color-swatch {
    width: 20px;
    height: 20px;
    border: 2px solid transparent;
    border-radius: var(--radius-s);
    cursor: pointer;
    padding: 0;
  }
  .color-swatch.selected {
    border-color: var(--color-text);
  }
  .color-swatch:hover:not(.selected) {
    border-color: var(--color-text-subtle);
  }
  .field-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .field-num {
    width: 56px;
    padding: 3px 4px;
    font-size: 0.7rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-background);
    color: var(--color-text);
    font-family: inherit;
    text-align: right;
  }
  .field-num:focus {
    border-color: var(--color-accent);
    outline: none;
  }
  .delete-btn {
    margin-top: 8px;
    padding: 4px 10px;
    font-size: 0.7rem;
    border: 1px solid var(--color-error);
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--color-error);
    cursor: pointer;
    font-family: inherit;
  }
  .delete-btn:hover {
    background: oklch(from var(--color-error) l c h / 0.1);
  }
  .conn-row {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 6px 0;
    border-bottom: 1px solid var(--color-border);
  }
  .conn-row:last-child {
    border-bottom: none;
  }
</style>
