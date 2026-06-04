<script lang="ts">
  import Editor from './Editor.svelte';
  import Icon from '@/components/icons/Icon.svelte';

  export let split: 'none' | 'horizontal' | 'vertical' = 'none';
  export let panes: Array<{ path: string; content: string }> = [];
  export let onContentChange: ((index: number, content: string) => void) | undefined = undefined;
  export let onWikilinkClick: ((title: string) => void) | undefined = undefined;

  let splitRatio = 50;
  let isDragging = false;
  let containerEl: HTMLDivElement;

  function startDrag(event: MouseEvent) {
    isDragging = true;
    event.preventDefault();

    const handleMove = (e: MouseEvent) => {
      if (!isDragging || !containerEl) return;

      const rect = containerEl.getBoundingClientRect();
      if (split === 'vertical') {
        splitRatio = ((e.clientX - rect.left) / rect.width) * 100;
      } else {
        splitRatio = ((e.clientY - rect.top) / rect.height) * 100;
      }
      splitRatio = Math.max(20, Math.min(80, splitRatio));
    };

    const handleUp = () => {
      isDragging = false;
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  }

  function handlePaneChange(index: number, content: string) {
    onContentChange?.(index, content);
  }

  export function setSplit(mode: 'none' | 'horizontal' | 'vertical') {
    split = mode;
  }
</script>

<div
  class="split-pane"
  class:horizontal={split === 'horizontal'}
  class:vertical={split === 'vertical'}
  bind:this={containerEl}
>
  {#if split === 'none'}
    {#if panes.length > 0}
      <div class="pane single">
        <Editor
          content={panes[0].content}
          onContentChange={(c) => handlePaneChange(0, c)}
          {onWikilinkClick}
        />
      </div>
    {/if}
  {:else}
    <div
      class="pane first"
      style={split === 'vertical' ? `width: ${splitRatio}%` : `height: ${splitRatio}%`}
    >
      {#if panes[0]}
        <div class="pane-header">
          <Icon name="file-text" size={12} />
          <span class="pane-title">{panes[0].path.split('/').pop()}</span>
        </div>
        <Editor
          content={panes[0].content}
          onContentChange={(c) => handlePaneChange(0, c)}
          {onWikilinkClick}
        />
      {/if}
    </div>

    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      class="divider"
      class:dragging={isDragging}
      on:mousedown={startDrag}
    >
      <div class="divider-handle"></div>
    </div>

    <div
      class="pane second"
      style={split === 'vertical'
        ? `width: ${100 - splitRatio}%`
        : `height: ${100 - splitRatio}%`}
    >
      {#if panes[1]}
        <div class="pane-header">
          <Icon name="file-text" size={12} />
          <span class="pane-title">{panes[1].path.split('/').pop()}</span>
        </div>
        <Editor
          content={panes[1].content}
          onContentChange={(c) => handlePaneChange(1, c)}
          {onWikilinkClick}
        />
      {/if}
    </div>
  {/if}
</div>

<style>
  .split-pane {
    display: flex;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .split-pane.vertical {
    flex-direction: row;
  }

  .split-pane.horizontal {
    flex-direction: column;
  }

  .pane {
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .pane.single {
    flex: 1;
  }

  .pane-header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    background: var(--bg-secondary, #1e1e2e);
    border-bottom: 1px solid var(--border-color, #313244);
    font-size: 0.75rem;
    color: var(--text-muted, #a6adc8);
  }

  .pane-title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .divider {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--border-color, #313244);
    transition: background 0.15s;
    cursor: col-resize;
  }

  .horizontal .divider {
    height: 4px;
    width: 100%;
    cursor: row-resize;
  }

  .vertical .divider {
    width: 4px;
    height: 100%;
    cursor: col-resize;
  }

  .divider:hover,
  .divider.dragging {
    background: var(--interactive-accent, #89b4fa);
  }

  .divider-handle {
    width: 2px;
    height: 24px;
    border-radius: 1px;
    background: var(--text-faint, #585b70);
  }

  .horizontal .divider-handle {
    width: 24px;
    height: 2px;
  }
</style>
