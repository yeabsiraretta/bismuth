<script lang="ts">
  /**
   * Sidebar shell providing the activity bar, hub/panel selectors,
   * drag-to-resize, and optional vertical split pane layout.
   * Used for both left and right sidebars.
   * @component
   */
  import type { Snippet } from 'svelte';
  import BIcon from '@/ui/b-icon.svelte';
  import { SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH } from '@/constants/layout';
  import type { HubDef } from '@/constants/hub-registry';
  import Tooltip from '@/ui/tooltip.svelte';

  /** Action button rendered at the bottom of the activity bar. */
  export type BottomAction = {
    id: string;
    icon: string;
    label: string;
    action: () => void;
  };

  let {
    position = 'left',
    width = $bindable(280),
    collapsed = false,
    hubs = [],
    activeHub = $bindable(''),
    activePanel = $bindable(''),
    bottomActions = [],
    onHubChange,
    onPanelChange,
    onToggle,
    showIcons = true,
    splitRatio = $bindable(0.5),
    hasSplit = false,
    onSplitRatioChange,
    onCloseSplit,
    onSplitPanel,
    children,
    splitChildren,
  }: {
    position?: 'left' | 'right';
    width?: number;
    collapsed?: boolean;
    hubs?: HubDef[];
    activeHub?: string;
    activePanel?: string;
    bottomActions?: BottomAction[];
    onHubChange?: (hubId: string) => void;
    onPanelChange?: (panelId: string) => void;
    onToggle?: () => void;
    showIcons?: boolean;
    splitRatio?: number;
    hasSplit?: boolean;
    onSplitRatioChange?: (ratio: number) => void;
    onCloseSplit?: () => void;
    onSplitPanel?: (panelKey: string) => void;
    children?: Snippet;
    splitChildren?: Snippet;
  } = $props();

  const MIN_W = SIDEBAR_MIN_WIDTH;
  const MAX_W = SIDEBAR_MAX_WIDTH;
  let isResizing = $state(false);
  let startX = 0;
  let startW = 0;

  let currentHub = $derived(hubs.find((h) => h.id === activeHub));

  function handleResizeStart(e: MouseEvent) {
    e.preventDefault();
    isResizing = true;
    startX = e.clientX;
    startW = width;
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }

  function handleResizeMove(e: MouseEvent) {
    if (!isResizing) return;
    const delta = position === 'left' ? e.clientX - startX : startX - e.clientX;
    width = Math.max(MIN_W, Math.min(MAX_W, startW + delta));
  }

  function handleResizeEnd() {
    isResizing = false;
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  }

  function selectHub(hub: HubDef) {
    if (hub.id === activeHub && !collapsed) {
      onToggle?.();
      return;
    }
    activeHub = hub.id;
    activePanel = hub.panels[0]?.id ?? '';
    onHubChange?.(hub.id);
    if (collapsed) {
      onToggle?.();
    }
  }

  function selectPanel(id: string, e?: MouseEvent) {
    if (e?.shiftKey && onSplitPanel && currentHub) {
      onSplitPanel(`${currentHub.id}:${id}`);
      return;
    }
    activePanel = id;
    onPanelChange?.(id);
  }

  let isSplitResizing = $state(false);
  let splitStartY = 0;
  let splitStartRatio = 0;
  let splitContainerHeight = 0;

  function handleSplitResizeStart(e: MouseEvent) {
    e.preventDefault();
    isSplitResizing = true;
    splitStartY = e.clientY;
    splitStartRatio = splitRatio;
    const container = (e.target as HTMLElement).parentElement;
    splitContainerHeight = container?.clientHeight ?? 400;
    document.addEventListener('mousemove', handleSplitResizeMove);
    document.addEventListener('mouseup', handleSplitResizeEnd);
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  }

  function handleSplitResizeMove(e: MouseEvent) {
    if (!isSplitResizing) return;
    const delta = e.clientY - splitStartY;
    const ratioDelta = delta / splitContainerHeight;
    const newRatio = Math.max(0.2, Math.min(0.8, splitStartRatio + ratioDelta));
    splitRatio = newRatio;
    onSplitRatioChange?.(newRatio);
  }

  function handleSplitResizeEnd() {
    isSplitResizing = false;
    document.removeEventListener('mousemove', handleSplitResizeMove);
    document.removeEventListener('mouseup', handleSplitResizeEnd);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  }

  $effect(() => {
    return () => {
      if (isResizing) handleResizeEnd();
      if (isSplitResizing) handleSplitResizeEnd();
    };
  });
</script>

<aside
  class="sb"
  class:sb-left={position === 'left'}
  class:sb-right={position === 'right'}
  class:sb-collapsed={collapsed}
  class:sb-resizing={isResizing}
>
  <!-- Activity bar: hub icons -->
  <div class="sb-actbar">
    <div class="sb-hubs" role="tablist" aria-label="{position} hub selector">
      {#each hubs as hub (hub.id)}
        <button
          class="sb-hub"
          class:sb-hub-active={activeHub === hub.id && !collapsed}
          onclick={() => selectHub(hub)}
          title={hub.label}
          role="tab"
          aria-selected={activeHub === hub.id}
        >
          {#if showIcons}
            <BIcon name={hub.icon} size={20} class="sb-hub-icon" />
          {:else}
            <span class="sb-hub-text">{hub.label.charAt(0)}</span>
          {/if}
          {#if activeHub === hub.id && !collapsed}
            <span class="sb-hub-indicator"></span>
          {/if}
        </button>
      {/each}
    </div>

    {#if bottomActions.length > 0}
      <div class="sb-actbar-spacer"></div>
      <div class="sb-bottom">
        {#each bottomActions as action (action.id)}
          <button
            class="sb-hub"
            onclick={action.action}
            title={action.label}
            aria-label={action.label}
          >
            <BIcon name={action.icon} size={20} class="sb-hub-icon" />
          </button>
        {/each}
      </div>
    {/if}
  </div>

  {#if !collapsed}
    <!-- Panel list + content area -->
    <div class="sb-body" style="width:{width}px">
      {#if currentHub}
        <div class="sb-panel-list">
          <div class="sb-panel-header">
            <span class="sb-panel-hub-label">{currentHub.label}</span>
            <button
              class="sb-collapse-btn"
              onclick={onToggle}
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <BIcon
                name={position === 'left' ? 'chevronLeft' : 'chevronRight'}
                size={16}
                class="sb-collapse-icon"
              />
            </button>
          </div>
          <div class="sb-panel-nav" role="tablist" aria-label="{currentHub.label} panels">
            {#each currentHub.panels as panel (panel.id)}
              <Tooltip text={panel.label} position="bottom">
                <button
                  class="sb-panel-item"
                  class:sb-panel-active={activePanel === panel.id}
                  onclick={(e) => selectPanel(panel.id, e)}
                  role="tab"
                  aria-selected={activePanel === panel.id}
                  aria-label={panel.label}
                >
                  <BIcon name={panel.icon} size={16} class="sb-panel-icon" />
                </button>
              </Tooltip>
            {/each}
          </div>
        </div>
      {/if}
      <div class="sb-content" class:sb-split={hasSplit && splitChildren}>
        {#if hasSplit && splitChildren}
          <div class="sb-split-top" style="flex:{splitRatio}">
            {@render children?.()}
          </div>
          <div
            class="sb-split-handle"
            class:sb-split-resizing={isSplitResizing}
            role="separator"
            aria-orientation="horizontal"
            aria-label="Resize split panels"
          >
            <button
              type="button"
              class="sb-split-drag"
              aria-label="Resize split panels"
              onmousedown={handleSplitResizeStart}
            ></button>
            <div class="sb-split-grip"></div>
            <button
              type="button"
              class="sb-split-close"
              onclick={onCloseSplit}
              title="Close split"
              aria-label="Close split panel">×</button
            >
          </div>
          <div class="sb-split-bottom" style="flex:{1 - splitRatio}">
            {@render splitChildren()}
          </div>
        {:else}
          {@render children?.()}
        {/if}
      </div>
    </div>
    <button
      class="sb-resize"
      type="button"
      tabindex="-1"
      onmousedown={handleResizeStart}
      aria-label="Resize sidebar"
    ></button>
  {/if}
</aside>

<style>
  .sb {
    display: flex;
    height: 100%;
    overflow: hidden;
    flex-shrink: 0;
  }
  .sb-left {
    flex-direction: row;
  }
  .sb-right {
    flex-direction: row-reverse;
  }

  /* ── Activity bar ── */
  .sb-actbar {
    display: flex;
    flex-direction: column;
    width: 40px;
    flex-shrink: 0;
    background: var(--color-surface);
    padding: 6px 4px;
  }
  .sb-left .sb-actbar {
    border-right: 1px solid var(--color-border);
  }
  .sb-right .sb-actbar {
    border-left: 1px solid var(--color-border);
  }
  .sb-hubs {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .sb-actbar-spacer {
    flex: 1;
  }
  .sb-bottom {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding-top: 6px;
    border-top: 1px solid var(--color-border);
    margin-top: 6px;
  }

  .sb-hub {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    border-radius: var(--radius-m);
    cursor: pointer;
    color: var(--color-text-muted);
    transition:
      color 0.12s,
      background-color 0.12s;
    padding: 0;
    outline: none;
  }
  .sb-hub:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
  .sb-hub:hover {
    color: var(--color-text);
    background: var(--color-surface-hover);
  }
  .sb-hub-active {
    color: var(--color-text);
  }
  .sb-hub :global(.sb-hub-icon) {
    width: 18px;
    height: 18px;
  }
  .sb-hub-text {
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .sb-hub-indicator {
    position: absolute;
    width: 3px;
    height: 20px;
    border-radius: var(--radius-s);
    background: var(--color-accent);
  }
  .sb-left .sb-hub-indicator {
    left: -4px;
  }
  .sb-right .sb-hub-indicator {
    right: -4px;
  }

  /* ── Expanded body: panel list + content ── */
  .sb-body {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    min-width: 0;
    background: var(--color-background);
  }

  .sb-panel-list {
    flex-shrink: 0;
    border-bottom: 1px solid var(--color-border);
  }
  .sb-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px 6px;
  }
  .sb-panel-hub-label {
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-text-subtle);
  }
  .sb-collapse-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    border-radius: var(--radius-s);
    padding: 0;
    outline: none;
  }
  .sb-collapse-btn:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
  .sb-collapse-btn:hover {
    background: var(--color-surface-hover);
    color: var(--color-text);
  }
  .sb-collapse-btn :global(.sb-collapse-icon) {
    width: 12px;
    height: 12px;
  }

  .sb-panel-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
    padding: 0 8px 8px;
  }
  .sb-panel-item {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    border-radius: var(--radius-s);
    transition:
      background-color 0.1s,
      color 0.1s;
    outline: none;
  }
  .sb-panel-item:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
  .sb-panel-item:hover {
    background: var(--color-surface-hover);
    color: var(--color-text);
  }
  .sb-panel-active {
    background: var(--color-surface-hover);
    color: var(--color-text);
  }
  .sb-panel-item :global(.sb-panel-icon) {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
    opacity: 0.7;
  }
  .sb-panel-active :global(.sb-panel-icon) {
    opacity: 1;
  }

  /* ── Panel content area ── */
  .sb-content {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    min-height: 0;
    min-width: 0;
  }
  .sb-content.sb-split {
    overflow: hidden;
  }
  .sb-split-top,
  .sb-split-bottom {
    overflow: hidden;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
  .sb-split-top > :global(*),
  .sb-split-bottom > :global(*) {
    flex: 1;
    overflow: auto;
    min-height: 0;
  }
  .sb-split-handle {
    flex-shrink: 0;
    height: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    cursor: row-resize;
    background: var(--color-border);
    position: relative;
    user-select: none;
  }
  .sb-split-handle:hover,
  .sb-split-resizing {
    background: var(--color-accent);
  }
  .sb-split-grip {
    width: 24px;
    height: 2px;
    border-radius: 1px;
    background: var(--color-text-subtle);
    position: relative;
    z-index: 2;
  }
  .sb-split-drag {
    position: absolute;
    inset: 0;
    border: none;
    background: transparent;
    cursor: row-resize;
    padding: 0;
    margin: 0;
    z-index: 1;
  }
  .sb-split-drag:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 1px;
  }
  .sb-split-handle:hover .sb-split-grip,
  .sb-split-resizing .sb-split-grip {
    background: var(--color-background);
  }
  .sb-split-close {
    position: absolute;
    right: 2px;
    top: -1px;
    width: 14px;
    height: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    font-size: 0.7rem;
    cursor: pointer;
    border-radius: var(--radius-s);
    padding: 0;
    opacity: 0;
    transition: opacity 0.15s;
    z-index: 3;
  }
  .sb-split-handle:hover .sb-split-close {
    opacity: 1;
  }
  .sb-split-close:hover {
    color: var(--color-error);
    background: var(--color-surface-hover);
  }

  /* ── Resize handle ── */
  .sb-resize {
    position: relative;
    width: 2px;
    padding: 0;
    border: none;
    background: transparent;
    cursor: col-resize;
    flex-shrink: 0;
    z-index: var(--z-resize);
    transition: background-color 0.15s;
    outline: none;
    -webkit-tap-highlight-color: transparent;
    -webkit-appearance: none;
    appearance: none;
  }
  .sb-resize:focus,
  .sb-resize:focus-visible,
  .sb-resize:active {
    outline: none;
    box-shadow: none;
    background: transparent;
  }
  .sb-resize::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    width: 16px;
    left: -5px;
  }
  .sb-resizing .sb-resize {
    background-color: var(--color-accent);
  }
  .sb-left .sb-resize {
    order: 99;
  }
</style>
