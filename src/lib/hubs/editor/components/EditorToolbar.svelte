<script lang="ts">
  import {
    DEFAULT_HIGHLIGHTER_COLORS,
    type HighlighterColor,
  } from '@/hubs/editor/services/highlighter-service';
  import BIcon from '@/ui/b-icon.svelte';

  let {
    onFormat,
    onInsertBlock,
    viewMode = 'live',
    onViewModeChange,
    disabled = false,
    livePreviewEnabled = true,
    plainTextMode = false,
    highlighterColors = DEFAULT_HIGHLIGHTER_COLORS,
  }: {
    onFormat: (type: string) => void;
    onInsertBlock: (type: string) => void;
    viewMode?: 'source' | 'live' | 'reading';
    onViewModeChange?: (mode: 'source' | 'live' | 'reading') => void;
    disabled?: boolean;
    livePreviewEnabled?: boolean;
    plainTextMode?: boolean;
    highlighterColors?: HighlighterColor[];
  } = $props();

  let showHeadings = $state(false);
  let showHighlighterMenu = $state(false);

  function toggleHeadings() {
    showHeadings = !showHeadings;
    showHighlighterMenu = false;
  }

  function selectHeading(level: number) {
    onFormat(`h${level}`);
    showHeadings = false;
  }

  function toggleHighlighterMenu() {
    showHighlighterMenu = !showHighlighterMenu;
    showHeadings = false;
  }

  function selectHighlightColor(color: HighlighterColor) {
    onFormat(`highlight:${color.name}:${color.color}`);
    showHighlighterMenu = false;
  }

  function removeHighlight() {
    onFormat('unhighlight');
    showHighlighterMenu = false;
  }
</script>

<div class="toolbar" role="toolbar" aria-label="Editor toolbar">
  {#if plainTextMode}
    <div class="toolbar-group">
      <span class="tb-pill" aria-label="Pen text mode">
        <BIcon name="highlightPen" size={13} />
        Pen mode (plain text)
      </span>
    </div>
  {:else}
    <!-- Formatting group: headings -->
    <div class="toolbar-group">
      <div class="heading-dropdown">
        <button
          class="tb-btn"
          onclick={toggleHeadings}
          title="Headings"
          aria-label="Headings"
          aria-expanded={showHeadings}
          aria-haspopup="menu"
          {disabled}
        >
          <BIcon name="heading" size={15} />
          <BIcon name="caretDown" size={10} class="tb-caret" />
        </button>
        {#if showHeadings}
          <div class="heading-menu" role="menu">
            {#each [1, 2, 3, 4, 5, 6] as level (level)}
              <button
                class="heading-item"
                onclick={() => selectHeading(level)}
                role="menuitem"
                style="font-size: {1.1 - level * 0.08}rem; font-weight: {level <= 3 ? 700 : 600}"
              >
                H{level}
              </button>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <div class="toolbar-sep"></div>

    <!-- Formatting group: inline -->
    <div class="toolbar-group">
      <button
        class="tb-btn"
        onclick={() => onFormat('bold')}
        title="Bold (Cmd+B)"
        aria-label="Bold"
        {disabled}
      >
        <BIcon name="bold" size={15} />
      </button>
      <button
        class="tb-btn"
        onclick={() => onFormat('italic')}
        title="Italic (Cmd+I)"
        aria-label="Italic"
        {disabled}
      >
        <BIcon name="italic" size={15} />
      </button>
      <button
        class="tb-btn"
        onclick={() => onFormat('underline')}
        title="Underline (Cmd+U)"
        aria-label="Underline"
        {disabled}
      >
        <BIcon name="underline" size={15} />
      </button>
      <button
        class="tb-btn"
        onclick={() => onFormat('strikethrough')}
        title="Strikethrough (Cmd+Shift+S)"
        aria-label="Strikethrough"
        {disabled}
      >
        <BIcon name="strikethrough" size={15} />
      </button>
      <div class="highlight-dropdown">
        <button
          class="tb-btn tb-icon-highlight"
          onclick={toggleHighlighterMenu}
          title="Highlight Colors"
          aria-label="Highlight Colors"
          aria-expanded={showHighlighterMenu}
          aria-haspopup="menu"
          {disabled}
        >
          <BIcon name="highlightPen" size={15} />
          <BIcon name="caretDown" size={10} class="tb-caret" />
        </button>
        {#if showHighlighterMenu}
          <div class="highlight-menu" role="menu">
            <div class="highlight-palette">
              {#each highlighterColors as color (color.name)}
                <button
                  class="highlight-swatch"
                  onclick={() => selectHighlightColor(color)}
                  title={color.name}
                  role="menuitem"
                  style="background: {color.color}"
                ></button>
              {/each}
            </div>
            <div class="highlight-menu-sep"></div>
            <button
              class="highlight-action"
              onclick={() => {
                onFormat('highlight');
                showHighlighterMenu = false;
              }}
              role="menuitem"
            >
              <BIcon name="highlightPen" size={13} />
              Default ==highlight==
            </button>
            <button
              class="highlight-action highlight-remove"
              onclick={removeHighlight}
              role="menuitem"
            >
              <BIcon name="close" size={13} />
              Remove highlight
            </button>
          </div>
        {/if}
      </div>
      <button
        class="tb-btn"
        onclick={() => onFormat('code')}
        title="Inline Code (Cmd+E)"
        aria-label="Inline Code"
        {disabled}
      >
        <BIcon name="codeInline" size={15} />
      </button>
    </div>

    <div class="toolbar-sep"></div>

    <!-- Formatting group: lists & blocks -->
    <div class="toolbar-group">
      <button
        class="tb-btn"
        onclick={() => onInsertBlock('bullet')}
        title="Bullet List"
        aria-label="Bullet List"
        {disabled}
      >
        <BIcon name="listBullet" size={15} />
      </button>
      <button
        class="tb-btn"
        onclick={() => onInsertBlock('numbered')}
        title="Numbered List"
        aria-label="Numbered List"
        {disabled}
      >
        <BIcon name="listNumbered" size={15} />
      </button>
      <button
        class="tb-btn"
        onclick={() => onInsertBlock('checklist')}
        title="Checklist"
        aria-label="Checklist"
        {disabled}
      >
        <BIcon name="tasks" size={15} />
      </button>
      <button
        class="tb-btn"
        onclick={() => onInsertBlock('blockquote')}
        title="Blockquote"
        aria-label="Blockquote"
        {disabled}
      >
        <BIcon name="blockquote" size={15} />
      </button>
    </div>

    <div class="toolbar-sep"></div>

    <!-- Formatting group: insert -->
    <div class="toolbar-group">
      <button
        class="tb-btn"
        onclick={() => onFormat('wikilink')}
        title="Wikilink (Cmd+K)"
        aria-label="Wikilink"
        {disabled}
      >
        <BIcon name="backlinks" size={15} />
      </button>
      <button
        class="tb-btn"
        onclick={() => onInsertBlock('link')}
        title="Link"
        aria-label="Link"
        {disabled}
      >
        <BIcon name="links" size={15} />
      </button>
      <button
        class="tb-btn"
        onclick={() => onInsertBlock('image')}
        title="Image"
        aria-label="Image"
        {disabled}
      >
        <BIcon name="media" size={15} />
      </button>
      <button
        class="tb-btn"
        onclick={() => onInsertBlock('hr')}
        title="Horizontal Rule"
        aria-label="Horizontal Rule"
        {disabled}
      >
        <BIcon name="hr" size={15} />
      </button>
      <button
        class="tb-btn"
        onclick={() => onInsertBlock('codeblock')}
        title="Code Block"
        aria-label="Code Block"
        {disabled}
      >
        <BIcon name="codeBlock" size={15} />
      </button>
      <button
        class="tb-btn"
        onclick={() => onInsertBlock('table')}
        title="Table"
        aria-label="Table"
        {disabled}
      >
        <BIcon name="table" size={15} />
      </button>
    </div>
  {/if}

  <!-- Spacer -->
  <div class="toolbar-spacer"></div>

  <!-- View mode toggle -->
  {#if livePreviewEnabled}
    <div class="toolbar-group view-toggle">
      <button
        class="tb-btn {viewMode === 'live' ? 'tb-active' : ''}"
        onclick={() => onViewModeChange?.('live')}
        title="Live Preview"
        aria-label="Live Preview"
        aria-pressed={viewMode === 'live'}
      >
        <BIcon name="eye" size={15} />
      </button>
      <button
        class="tb-btn {viewMode === 'source' ? 'tb-active' : ''}"
        onclick={() => onViewModeChange?.('source')}
        title="Source Mode"
        aria-label="Source Mode"
        aria-pressed={viewMode === 'source'}
      >
        <BIcon name="codeBlock" size={15} />
      </button>
      <button
        class="tb-btn {viewMode === 'reading' ? 'tb-active' : ''}"
        onclick={() => onViewModeChange?.('reading')}
        title="Reading Mode"
        aria-label="Reading Mode"
        aria-pressed={viewMode === 'reading'}
      >
        <BIcon name="bookOpen" size={15} />
      </button>
    </div>
  {/if}
</div>

{#if showHeadings || showHighlighterMenu}
  <button
    class="heading-backdrop"
    onclick={() => {
      showHeadings = false;
      showHighlighterMenu = false;
    }}
    aria-label="Close menu"
  ></button>
{/if}

<style>
  .toolbar {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 4px 8px;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-surface);
    flex-wrap: nowrap;
    min-height: 32px;
  }
  .toolbar-group {
    display: flex;
    align-items: center;
    gap: 1px;
  }
  .toolbar-spacer {
    flex: 1;
    min-width: 8px;
  }
  .toolbar-sep {
    width: 1px;
    height: 18px;
    background: var(--color-border);
    margin: 0 4px;
    flex-shrink: 0;
  }
  .tb-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 28px;
    height: 28px;
    padding: 0 5px;
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    border-radius: var(--radius-s);
    cursor: pointer;
    font-size: 0.7rem;
    font-family: inherit;
    line-height: 1;
    transition:
      background var(--transition-fast),
      color var(--transition-fast);
  }
  .tb-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.2rem 0.45rem;
    border-radius: var(--radius-s);
    color: var(--color-warning);
    background: color-mix(in oklab, var(--color-warning) 12%, transparent);
    font-size: 0.7rem;
    font-weight: 500;
    white-space: nowrap;
  }
  .tb-btn:hover {
    background: var(--color-surface-hover);
    color: var(--color-text);
  }
  .tb-btn:disabled {
    opacity: 0.4;
    pointer-events: none;
  }
  .tb-active {
    background: var(--color-surface-hover);
    color: var(--color-text);
  }
  .tb-btn :global(.tb-caret) {
    width: 10px;
    height: 10px;
    margin-left: 1px;
  }
  .tb-btn :global(svg) {
    width: 15px;
    height: 15px;
  }
  .tb-icon-highlight {
    color: var(--color-warning);
  }
  .view-toggle {
    gap: 0;
    background: var(--color-background);
    border-radius: var(--radius-m);
    padding: 2px;
  }
  .view-toggle .tb-active {
    background: var(--color-surface);
    box-shadow: var(--shadow-s);
  }
  .heading-dropdown {
    position: relative;
  }
  .heading-menu {
    position: absolute;
    top: 100%;
    left: 0;
    z-index: var(--z-dropdown, 50);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-m);
    box-shadow: var(--shadow-m, 0 4px 12px rgba(0, 0, 0, 0.15));
    padding: 4px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 60px;
  }
  .heading-item {
    padding: 4px 10px;
    border: none;
    background: transparent;
    color: var(--color-text);
    cursor: pointer;
    text-align: left;
    border-radius: var(--radius-s);
    font-family: inherit;
  }
  .heading-item:hover {
    background: var(--color-surface-hover);
  }
  .heading-backdrop {
    position: fixed;
    inset: 0;
    z-index: calc(var(--z-dropdown, 50) - 1);
    background: transparent;
    border: none;
    cursor: default;
  }
  .highlight-dropdown {
    position: relative;
  }
  .highlight-menu {
    position: absolute;
    top: 100%;
    left: 0;
    z-index: var(--z-dropdown, 50);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-m);
    box-shadow: var(--shadow-m, 0 4px 12px rgba(0, 0, 0, 0.15));
    padding: 8px;
    min-width: 180px;
  }
  .highlight-palette {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 4px;
    margin-bottom: 4px;
  }
  .highlight-swatch {
    width: 28px;
    height: 28px;
    border: 2px solid transparent;
    border-radius: var(--radius-s);
    cursor: pointer;
    transition:
      border-color var(--transition-fast),
      transform var(--transition-fast);
  }
  .highlight-swatch:hover {
    border-color: var(--color-text);
    transform: scale(1.1);
  }
  .highlight-menu-sep {
    height: 1px;
    background: var(--color-border);
    margin: 6px 0;
  }
  .highlight-action {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 4px 6px;
    border: none;
    background: transparent;
    color: var(--color-text);
    border-radius: var(--radius-s);
    cursor: pointer;
    font-size: 0.75rem;
    font-family: inherit;
    text-align: left;
  }
  .highlight-action:hover {
    background: var(--color-surface-hover);
  }
  .highlight-remove {
    color: var(--color-danger, var(--color-text-muted));
  }
</style>
