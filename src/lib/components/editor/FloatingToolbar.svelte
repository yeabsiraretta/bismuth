<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Icon from '@/components/icons/Icon.svelte';
  import { settings } from '@/features/settings';

  export let editorElement: HTMLElement | null = null;
  export let onFormat: (type: string) => void = () => {};
  export let formatPainterActive: boolean = false;
  export let onFormatPainterToggle: () => void = () => {};

  let visible = false;
  let x = 0;
  let y = 0;
  let toolbarEl: HTMLDivElement;

  function updatePosition() {
    if (!editorElement || !$settings.floatingToolbar) {
      visible = false;
      return;
    }

    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
      visible = false;
      return;
    }

    // Only show if selection is inside the editor
    const range = sel.getRangeAt(0);
    if (!editorElement.contains(range.commonAncestorContainer)) {
      visible = false;
      return;
    }

    const rect = range.getBoundingClientRect();
    const editorRect = editorElement.getBoundingClientRect();

    // Position above the selection, centered horizontally
    const toolbarWidth = toolbarEl?.offsetWidth ?? 320;
    const toolbarHeight = toolbarEl?.offsetHeight ?? 36;

    let newX = rect.left + rect.width / 2 - toolbarWidth / 2 - editorRect.left;
    let newY = rect.top - toolbarHeight - 8 - editorRect.top;

    // Clamp within editor bounds
    newX = Math.max(4, Math.min(newX, editorRect.width - toolbarWidth - 4));

    // If not enough space above, show below selection
    if (newY < 4) {
      newY = rect.bottom + 8 - editorRect.top;
    }

    x = newX;
    y = newY;
    visible = true;
  }

  function handleSelectionChange() {
    // Small debounce to avoid flicker during selection
    requestAnimationFrame(updatePosition);
  }

  function handleFormat(type: string) {
    onFormat(type);
    // Keep toolbar visible briefly so user sees what they clicked
  }

  onMount(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
  });

  onDestroy(() => {
    document.removeEventListener('selectionchange', handleSelectionChange);
  });
</script>

{#if visible && $settings.floatingToolbar}
  <div
    class="floating-toolbar"
    bind:this={toolbarEl}
    style="left: {x}px; top: {y}px;"
    role="toolbar"
    aria-label="Floating formatting toolbar"
  >
    <button class="ft-btn" on:click={() => handleFormat('bold')} title="Bold">
      <Icon name="bold" size={14} />
    </button>
    <button class="ft-btn" on:click={() => handleFormat('italic')} title="Italic">
      <Icon name="italic" size={14} />
    </button>
    <button class="ft-btn" on:click={() => handleFormat('underline')} title="Underline">
      <Icon name="underline" size={14} />
    </button>
    <button class="ft-btn" on:click={() => handleFormat('strikethrough')} title="Strikethrough">
      <Icon name="strikethrough" size={14} />
    </button>

    <span class="ft-sep"></span>

    <button class="ft-btn" on:click={() => handleFormat('code')} title="Inline code">
      <Icon name="code" size={14} />
    </button>
    <button class="ft-btn" on:click={() => handleFormat('highlight')} title="Highlight">
      <Icon name="highlighter" size={14} />
    </button>
    <button class="ft-btn" on:click={() => handleFormat('link')} title="Link">
      <Icon name="link" size={14} />
    </button>

    <span class="ft-sep"></span>

    <button class="ft-btn" on:click={() => handleFormat('superscript')} title="Superscript">
      <Icon name="superscript" size={14} />
    </button>
    <button class="ft-btn" on:click={() => handleFormat('subscript')} title="Subscript">
      <Icon name="subscript" size={14} />
    </button>

    <span class="ft-sep"></span>

    <button
      class="ft-btn"
      class:active={formatPainterActive}
      on:click={onFormatPainterToggle}
      title="Format painter — click to copy format, then select text to apply"
    >
      <Icon name="paintbrush" size={14} />
    </button>
  </div>
{/if}

<style>
  .floating-toolbar {
    position: absolute;
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 4px 6px;
    background: var(--background-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-m, 8px);
    box-shadow: var(--shadow-lg, 0 8px 24px rgba(0, 0, 0, 0.15));
    z-index: 100;
    pointer-events: auto;
    animation: ft-fade-in 0.12s ease-out;
    user-select: none;
  }

  @keyframes ft-fade-in {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .ft-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    padding: 0;
    background: none;
    border: none;
    border-radius: var(--radius-s, 4px);
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.1s ease;
  }

  .ft-btn:hover {
    background: var(--background-modifier-hover);
    color: var(--text-normal);
  }

  .ft-btn:active {
    color: var(--interactive-accent);
  }

  .ft-btn.active {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
  }

  .ft-sep {
    width: 1px;
    height: 16px;
    background: var(--border-color);
    margin: 0 2px;
    flex-shrink: 0;
  }
</style>
