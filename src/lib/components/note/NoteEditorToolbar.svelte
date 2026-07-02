<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { tabOrientation, toggleTabOrientation } from '@/stores/editor/tabs';

  export let livePreview: boolean = false;
  export let readingMode: boolean = false;
  export let showFrontmatter: boolean = false;
  export let hasFrontmatter: boolean = false;
  export let onFormat: (type: string) => void = () => {};
  export let onViewModeChange: (mode: 'source' | 'live' | 'reading') => void = () => {};
  export let onToggleFrontmatter: () => void = () => {};
</script>

<div class="editor-formatting" role="toolbar" aria-label="Text formatting">
  <button class="action-btn" on:click={() => onFormat('bold')} title="Bold (⌘B)" aria-label="Bold">
    <Icon name="bold" size={14} />
  </button>
  <button
    class="action-btn"
    on:click={() => onFormat('italic')}
    title="Italic (⌘I)"
    aria-label="Italic"
  >
    <Icon name="italic" size={14} />
  </button>
  <button
    class="action-btn"
    on:click={() => onFormat('strikethrough')}
    title="Strikethrough (⌘⇧S)"
    aria-label="Strikethrough"
  >
    <Icon name="strikethrough" size={14} />
  </button>
  <button class="action-btn" on:click={() => onFormat('code')} title="Code (⌘E)" aria-label="Code">
    <Icon name="code" size={14} />
  </button>
  <span class="action-divider"></span>
  <button
    class="action-btn"
    on:click={() => onFormat('heading')}
    title="Heading"
    aria-label="Heading"
  >
    <Icon name="type" size={14} />
  </button>
  <button class="action-btn" on:click={() => onFormat('quote')} title="Quote" aria-label="Quote">
    <Icon name="quote" size={14} />
  </button>
  <button
    class="action-btn"
    on:click={() => onFormat('list')}
    title="Bullet list"
    aria-label="Bullet list"
  >
    <Icon name="list" size={14} />
  </button>
  <button
    class="action-btn"
    on:click={() => onFormat('list-ordered')}
    title="Numbered list"
    aria-label="Numbered list"
  >
    <Icon name="list-ordered" size={14} />
  </button>
  <span class="action-divider"></span>
  <button class="action-btn" on:click={() => onFormat('link')} title="Link (⌘K)" aria-label="Link">
    <Icon name="link" size={14} />
  </button>
  <button class="action-btn" on:click={() => onFormat('table')} title="Table" aria-label="Table">
    <Icon name="table" size={14} />
  </button>
</div>
<span class="action-divider"></span>
<div class="view-mode-group" role="group" aria-label="Editor view mode">
  <button
    class="action-btn"
    class:active={!livePreview && !readingMode}
    on:click={() => onViewModeChange('source')}
    aria-label="Source mode"
    title="Source"
  >
    <Icon name="code" size={14} />
  </button>
  <button
    class="action-btn"
    class:active={livePreview && !readingMode}
    on:click={() => onViewModeChange('live')}
    aria-label="Live preview mode"
    title="Live Preview"
  >
    <Icon name="eye" size={14} />
  </button>
  <button
    class="action-btn"
    class:active={readingMode}
    on:click={() => onViewModeChange('reading')}
    aria-label="Reading mode"
    title="Reading"
  >
    <Icon name="book-open" size={14} />
  </button>
</div>
{#if hasFrontmatter}
  <button
    class="action-btn"
    class:active={showFrontmatter}
    on:click={onToggleFrontmatter}
    aria-label="Toggle frontmatter visibility"
    title="Frontmatter"
  >
    <Icon name="braces" size={14} />
  </button>
{/if}
<span class="action-divider"></span>
<button
  class="action-btn"
  class:active={$tabOrientation === 'vertical'}
  on:click={toggleTabOrientation}
  title={$tabOrientation === 'vertical' ? 'Switch to horizontal tabs' : 'Switch to vertical tabs'}
  aria-label={$tabOrientation === 'vertical' ? 'Horizontal tabs' : 'Vertical tabs'}
>
  <Icon name={$tabOrientation === 'vertical' ? 'layout' : 'layout-list'} size={14} />
</button>

<style>
  .editor-formatting {
    display: flex;
    align-items: center;
    gap: 2px;
  }
  .action-divider {
    width: 1px;
    height: 16px;
    background: var(--border-color);
    margin: 0 var(--spacing-xs);
    flex-shrink: 0;
  }
  .view-mode-group {
    display: flex;
    align-items: center;
    gap: 1px;
    background: var(--background-primary);
    border-radius: var(--radius-s);
    padding: 1px;
  }
  .action-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    background: none;
    border: none;
    border-radius: var(--radius-s);
    color: var(--text-muted);
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  .action-btn :global(svg) {
    pointer-events: none;
  }
  .action-btn.active {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
  }
  .action-btn:hover:not(.active) {
    background: var(--background-modifier-hover);
    color: var(--text-normal);
  }
</style>
