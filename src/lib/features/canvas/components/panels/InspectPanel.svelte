<script lang="ts">
  import { selectedElements, currentCanvas } from '@/features/canvas/stores';
  import { inspectEnabled } from '@/features/canvas/stores/design/inspectMode';
  import { getSelectedElement, generateCSS, generateCSSCode } from './inspectPanelLogic';
  import PropertyInspector from '@/features/canvas/components/inspect/PropertyInspector.svelte';

  type ViewMode = 'list' | 'code' | 'css';
  let activeView: ViewMode = 'code';

  $: selectedElement = getSelectedElement($selectedElements, $currentCanvas?.elements ?? []);
  $: cssProperties = selectedElement ? generateCSS(selectedElement) : [];
  $: cssCode = selectedElement ? generateCSSCode(selectedElement) : '';

  function copyCSS() {
    if (cssCode) {
      navigator.clipboard.writeText(cssCode);
    }
  }

  function toggleInspectMode() {
    inspectEnabled.update(v => !v);
  }
</script>

<div class="inspect-panel">
  <div class="inspect-mode-bar">
    <button class="mode-toggle" class:active={$inspectEnabled} on:click={toggleInspectMode} title="Toggle Inspect Mode (Cmd+Shift+I)">
      Inspect {$inspectEnabled ? 'ON' : 'OFF'}
    </button>
  </div>

  <!-- T056: When inspectEnabled, show PropertyInspector -->
  {#if $inspectEnabled && selectedElement}
    <PropertyInspector elementId={selectedElement.id} />
  {:else}
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

  .inspect-mode-bar {
    display: flex;
    padding: 4px 8px;
    border-bottom: 1px solid var(--border-color);
    background: var(--background-secondary);
  }

  .mode-toggle {
    font-size: 10px;
    padding: 2px 8px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    background: none;
    color: var(--text-muted);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .mode-toggle.active {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    border-color: var(--interactive-accent);
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
