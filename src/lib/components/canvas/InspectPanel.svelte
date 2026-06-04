<script lang="ts">
  import { selectedElements, currentCanvas } from '@/stores/canvas/canvasStore';
  import type { CanvasElement } from '@/types/canvas';

  type ViewMode = 'list' | 'code' | 'css';
  let activeView: ViewMode = 'code';

  $: selectedElement = getSelectedElement($selectedElements, $currentCanvas?.elements ?? []);

  function getSelectedElement(
    ids: string[],
    elements: CanvasElement[]
  ): CanvasElement | null {
    if (ids.length !== 1) return null;
    return elements.find((el) => el.id === ids[0]) ?? null;
  }

  $: cssProperties = selectedElement ? generateCSS(selectedElement) : [];
  $: cssCode = selectedElement ? generateCSSCode(selectedElement) : '';

  interface CSSProperty {
    property: string;
    value: string;
  }

  function generateCSS(el: CanvasElement): CSSProperty[] {
    const props: CSSProperty[] = [];

    // Position & Size
    props.push({ property: 'width', value: `${Math.round(el.width)}px` });
    props.push({ property: 'height', value: `${Math.round(el.height)}px` });

    if (el.rotation !== 0) {
      props.push({ property: 'transform', value: `rotate(${el.rotation}deg)` });
    }

    // Auto layout (flex)
    if (el.properties.autoLayout) {
      const al = el.properties.autoLayout;
      props.push({ property: 'display', value: 'flex' });
      props.push({
        property: 'flex-direction',
        value: al.direction === 'horizontal' ? 'row' : 'column',
      });
      props.push({ property: 'gap', value: `${al.gap}px` });
      props.push({
        property: 'padding',
        value: `${al.padding.top}px ${al.padding.right}px ${al.padding.bottom}px ${al.padding.left}px`,
      });
      props.push({
        property: 'align-items',
        value: al.alignItems === 'start' ? 'flex-start' : al.alignItems === 'end' ? 'flex-end' : al.alignItems,
      });
      props.push({
        property: 'justify-content',
        value: al.justifyContent === 'start' ? 'flex-start' : al.justifyContent === 'end' ? 'flex-end' : al.justifyContent,
      });
    }

    // Background
    if (el.properties.fill) {
      props.push({ property: 'background', value: el.properties.fill });
    }

    // Border
    if (el.properties.stroke && el.properties.strokeWidth) {
      props.push({
        property: 'border',
        value: `${el.properties.strokeWidth}px solid ${el.properties.stroke}`,
      });
    }

    // Border radius
    if (el.properties.borderRadius) {
      const br = el.properties.borderRadius;
      if (br.topLeft === br.topRight && br.topRight === br.bottomRight && br.bottomRight === br.bottomLeft) {
        props.push({ property: 'border-radius', value: `${br.topLeft}px` });
      } else {
        props.push({
          property: 'border-radius',
          value: `${br.topLeft}px ${br.topRight}px ${br.bottomRight}px ${br.bottomLeft}px`,
        });
      }
    } else if (el.properties.radius) {
      props.push({ property: 'border-radius', value: `${el.properties.radius}px` });
    }

    // Opacity
    if (el.properties.opacity !== undefined && el.properties.opacity < 1) {
      props.push({ property: 'opacity', value: `${el.properties.opacity}` });
    }

    // Shadow
    if (el.properties.shadow) {
      const s = el.properties.shadow;
      props.push({
        property: 'box-shadow',
        value: `${s.x}px ${s.y}px ${s.blur}px ${s.spread}px ${s.color}`,
      });
    }

    // Blur
    if (el.properties.blur) {
      props.push({ property: 'filter', value: `blur(${el.properties.blur}px)` });
    }

    // Typography (text elements)
    if (el.element_type === 'text') {
      if (el.properties.fontFamily) {
        props.push({ property: 'font-family', value: el.properties.fontFamily });
      }
      if (el.properties.fontSize) {
        props.push({ property: 'font-size', value: `${el.properties.fontSize}px` });
      }
      if (el.properties.fontWeight) {
        props.push({ property: 'font-weight', value: `${el.properties.fontWeight}` });
      }
      if (el.properties.lineHeight) {
        props.push({ property: 'line-height', value: `${el.properties.lineHeight}` });
      }
      if (el.properties.textAlign) {
        props.push({ property: 'text-align', value: el.properties.textAlign });
      }
      if (el.properties.fill) {
        props.push({ property: 'color', value: el.properties.fill });
      }
    }

    return props;
  }

  function generateCSSCode(el: CanvasElement): string {
    const props = generateCSS(el);
    const lines = props.map((p) => `  ${p.property}: ${p.value};`);
    const selector = el.name
      ? `.${el.name.replace(/\s+/g, '-').toLowerCase()}`
      : `.${el.element_type}`;
    return `${selector} {\n${lines.join('\n')}\n}`;
  }

  function copyCSS() {
    if (cssCode) {
      navigator.clipboard.writeText(cssCode);
    }
  }
</script>

<div class="inspect-panel">
  <div class="inspect-header">
    <button
      class="inspect-tab"
      class:active={activeView === 'list'}
      on:click={() => (activeView = 'list')}
    >
      List
    </button>
    <button
      class="inspect-tab"
      class:active={activeView === 'code'}
      on:click={() => (activeView = 'code')}
    >
      Code
    </button>
    <button
      class="inspect-tab"
      class:active={activeView === 'css'}
      on:click={() => (activeView = 'css')}
    >
      CSS
    </button>
  </div>

  {#if !selectedElement}
    <div class="inspect-empty">
      <p>Select an element to inspect</p>
    </div>
  {:else if activeView === 'list'}
    <div class="inspect-list">
      {#each cssProperties as prop}
        <div class="inspect-row">
          <span class="inspect-property">{prop.property}</span>
          <span class="inspect-value">{prop.value}</span>
        </div>
      {/each}
    </div>
  {:else if activeView === 'code'}
    <div class="inspect-code">
      <div class="code-header">
        <span class="code-lang">CSS</span>
        <button class="copy-btn" on:click={copyCSS} title="Copy CSS">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        </button>
      </div>
      <pre class="code-block"><code>{cssCode}</code></pre>
    </div>
  {:else}
    <div class="inspect-code">
      <div class="code-header">
        <span class="code-lang">Properties</span>
      </div>
      <pre class="code-block"><code>{JSON.stringify(selectedElement.properties, null, 2)}</code></pre>
    </div>
  {/if}
</div>

<style>
  .inspect-panel {
    display: flex;
    flex-direction: column;
    border-top: 1px solid var(--border-color);
    max-height: 300px;
    overflow: hidden;
  }

  .inspect-header {
    display: flex;
    border-bottom: 1px solid var(--border-color);
    background: var(--background-secondary);
  }

  .inspect-tab {
    flex: 1;
    padding: var(--spacing-s) var(--spacing-m);
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    font-size: var(--font-smaller);
    color: var(--text-muted);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .inspect-tab:hover {
    color: var(--text-normal);
  }

  .inspect-tab.active {
    color: var(--interactive-accent);
    border-bottom-color: var(--interactive-accent);
  }

  .inspect-empty {
    padding: var(--spacing-l);
    text-align: center;
    color: var(--text-faint);
    font-size: var(--font-smaller);
  }

  .inspect-list {
    overflow-y: auto;
    padding: var(--spacing-s);
  }

  .inspect-row {
    display: flex;
    justify-content: space-between;
    padding: 3px var(--spacing-s);
    border-radius: var(--radius-s);
  }

  .inspect-row:hover {
    background: var(--background-modifier-hover);
  }

  .inspect-property {
    font-size: var(--font-smaller);
    color: var(--text-muted);
    font-family: var(--font-monospace);
  }

  .inspect-value {
    font-size: var(--font-smaller);
    color: var(--text-normal);
    font-family: var(--font-monospace);
  }

  .inspect-code {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .code-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-xs) var(--spacing-s);
    background: var(--background-secondary);
  }

  .code-lang {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
    font-weight: 600;
  }

  .copy-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2px 6px;
    background: none;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    color: var(--text-muted);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .copy-btn:hover {
    background: var(--background-modifier-hover);
    color: var(--text-normal);
  }

  .code-block {
    margin: 0;
    padding: var(--spacing-s);
    overflow: auto;
    font-size: 11px;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    line-height: 1.6;
    background: var(--background-primary-alt);
    color: var(--text-normal);
  }

  .code-block code {
    white-space: pre;
  }
</style>
