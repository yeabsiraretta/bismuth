<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import ToolbarDropdown from '@/components/editor/ToolbarDropdown.svelte';

  export let onFormat: ((format: string) => void) | undefined = undefined;
  export let onFullscreen: (() => void) | undefined = undefined;

  function handleFormat(format: string) {
    onFormat?.(format);
  }
</script>

<button class="toolbar-btn" on:click={() => handleFormat('bold')} title="Bold (Cmd+B)">
  <Icon name="bold" size={16} />
</button>
<button class="toolbar-btn" on:click={() => handleFormat('italic')} title="Italic (Cmd+I)">
  <Icon name="italic" size={16} />
</button>
<button class="toolbar-btn" on:click={() => handleFormat('underline')} title="Underline (Cmd+U)">
  <Icon name="underline" size={16} />
</button>
<button class="toolbar-btn" on:click={() => handleFormat('strikethrough')} title="Strikethrough">
  <Icon name="strikethrough" size={16} />
</button>

<ToolbarDropdown icon="type" title="More text formats">
  <button class="dropdown-item" on:click={() => handleFormat('superscript')}>
    <Icon name="superscript" size={14} /> Superscript
  </button>
  <button class="dropdown-item" on:click={() => handleFormat('subscript')}>
    <Icon name="subscript" size={14} /> Subscript
  </button>
</ToolbarDropdown>

<div class="separator"></div>

<ToolbarDropdown icon="heading" label="H" title="Headings">
  <button class="dropdown-item" on:click={() => handleFormat('h1')}>Heading 1</button>
  <button class="dropdown-item" on:click={() => handleFormat('h2')}>Heading 2</button>
  <button class="dropdown-item" on:click={() => handleFormat('h3')}>Heading 3</button>
  <button class="dropdown-item" on:click={() => handleFormat('h4')}>Heading 4</button>
  <button class="dropdown-item" on:click={() => handleFormat('h5')}>Heading 5</button>
  <button class="dropdown-item" on:click={() => handleFormat('h6')}>Heading 6</button>
</ToolbarDropdown>

<div class="separator"></div>

<button class="toolbar-btn" on:click={() => handleFormat('link')} title="Insert link (Cmd+K)">
  <Icon name="link" size={16} />
</button>
<button class="toolbar-btn" on:click={() => handleFormat('image')} title="Insert image">
  <Icon name="image" size={16} />
</button>
<button class="toolbar-btn" on:click={() => handleFormat('code')} title="Inline code">
  <Icon name="code" size={16} />
</button>
<button class="toolbar-btn" on:click={() => handleFormat('code-block')} title="Code block">
  <Icon name="code-block" size={16} />
</button>
<button class="toolbar-btn" on:click={() => handleFormat('quote')} title="Quote">
  <Icon name="quote" size={16} />
</button>
<button class="toolbar-btn" on:click={() => handleFormat('callout')} title="Callout">
  <Icon name="callout" size={16} />
</button>
<button class="toolbar-btn" on:click={() => handleFormat('hr')} title="Horizontal rule">
  <Icon name="minus" size={16} />
</button>

<div class="separator"></div>

<button class="toolbar-btn" on:click={() => handleFormat('ul')} title="Bullet list">
  <Icon name="list" size={16} />
</button>
<button class="toolbar-btn" on:click={() => handleFormat('ol')} title="Numbered list">
  <Icon name="list-ordered" size={16} />
</button>
<button class="toolbar-btn" on:click={() => handleFormat('checklist')} title="Checklist">
  <Icon name="check-square" size={16} />
</button>
<button class="toolbar-btn" on:click={() => handleFormat('indent')} title="Indent">
  <Icon name="indent" size={16} />
</button>
<button class="toolbar-btn" on:click={() => handleFormat('outdent')} title="Unindent">
  <Icon name="outdent" size={16} />
</button>

<div class="separator"></div>

<ToolbarDropdown icon="align-left" title="Alignment">
  <button class="dropdown-item" on:click={() => handleFormat('align-left')}>
    <Icon name="align-left" size={14} /> Align Left
  </button>
  <button class="dropdown-item" on:click={() => handleFormat('align-center')}>
    <Icon name="align-center" size={14} /> Align Center
  </button>
  <button class="dropdown-item" on:click={() => handleFormat('align-right')}>
    <Icon name="align-right" size={14} /> Align Right
  </button>
  <button class="dropdown-item" on:click={() => handleFormat('align-justify')}>
    <Icon name="align-justify" size={14} /> Justify
  </button>
</ToolbarDropdown>

<div class="separator"></div>

<button class="toolbar-btn" on:click={() => handleFormat('font-color')} title="Font color">
  <Icon name="type" size={16} />
</button>
<button class="toolbar-btn" on:click={() => handleFormat('highlight')} title="Highlight color">
  <Icon name="highlighter" size={16} />
</button>

<div class="separator"></div>

<button class="toolbar-btn" on:click={() => handleFormat('table')} title="Insert table">
  <Icon name="table" size={16} />
</button>
<button class="toolbar-btn" on:click={() => onFullscreen?.()} title="Fullscreen focus mode">
  <Icon name="maximize" size={16} />
</button>

<style>
  .toolbar-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    background: none;
    border: none;
    border-radius: var(--radius-s);
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .toolbar-btn:hover:not(:disabled) {
    background-color: var(--interactive-hover);
    color: var(--text-normal);
  }

  .toolbar-btn:active:not(:disabled) {
    color: var(--interactive-accent);
  }

  .separator {
    width: 1px;
    height: 20px;
    background-color: var(--border-color);
    margin: 0 var(--spacing-xs, 4px);
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 6px 10px;
    border: none;
    background: none;
    cursor: pointer;
    font-size: var(--font-ui-menu);
    color: var(--text-normal);
    border-radius: var(--radius-s);
    text-align: left;
  }

  .dropdown-item:hover {
    background-color: var(--interactive-hover);
  }
</style>
