<script lang="ts">
  import { onDestroy } from 'svelte';
  import VerticalTabBar from '@/components/sidebar/tabs/VerticalTabBar.svelte';
  import type { SidebarTab } from '@/types/layout';

  /** Which side this sidebar is on */
  export let position: 'left' | 'right' = 'left';
  /** Main tabs to show */
  export let tabs: SidebarTab[] = [];
  /** Lower section tabs */
  export let lowerTabs: SidebarTab[] = [];
  /** Bottom tabs (settings, help) */
  export let bottomTabs: SidebarTab[] = [];
  /** Current active tab */
  export let activeTab: string = '';
  /** Width in pixels */
  export let width: number = 300;
  /** Whether the sidebar is collapsed (only icon rail visible) */
  export let collapsed: boolean = false;
  /** Called when a tab is selected */
  export let onTabChange: ((detail: { tabId: string }) => void) | undefined = undefined;
  /** Called when settings button is clicked */
  export let onSettingsClick: (() => void) | undefined = undefined;
  /** Called when about/help button is clicked */
  export let onAboutClick: (() => void) | undefined = undefined;
  /** Called when commands button is clicked */
  export let onCommandsClick: (() => void) | undefined = undefined;
  /** Called when quick action (plus) button is clicked */
  export let onQuickAction: (() => void) | undefined = undefined;
  /** Called when daily note button is clicked */
  export let onDailyNoteClick: (() => void) | undefined = undefined;
  /** Called when layouts button is clicked */
  export let onLayoutsClick: (() => void) | undefined = undefined;
  /** Called when publish-mark button is clicked */
  export let onPublishMarkClick: (() => void) | undefined = undefined;
  /** Called when tabs are reordered in upper section */
  export let onReorder: ((tabs: SidebarTab[]) => void) | undefined = undefined;
  /** Called when tabs are reordered in lower section */
  export let onLowerReorder: ((tabs: SidebarTab[]) => void) | undefined = undefined;
  /** Called when a tab is moved between upper/lower */
  export let onSectionChange: ((tabId: string, target: 'upper' | 'lower') => void) | undefined =
    undefined;
  /** Called when width changes via drag resize */
  export let onWidthChange: ((width: number) => void) | undefined = undefined;

  const MIN_WIDTH = 180;
  const MAX_WIDTH = 600;

  let isResizing = false;
  let startX = 0;
  let startWidth = 0;

  $: allTabs = [...tabs, ...lowerTabs];

  function handleResizeStart(e: MouseEvent) {
    e.preventDefault();
    isResizing = true;
    startX = e.clientX;
    startWidth = width;
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }

  function handleTouchResizeStart(e: TouchEvent) {
    e.preventDefault();
    isResizing = true;
    startX = e.touches[0].clientX;
    startWidth = width;
    document.addEventListener('touchmove', handleTouchResizeMove, { passive: false });
    document.addEventListener('touchend', handleTouchResizeEnd);
    document.body.style.userSelect = 'none';
  }

  function handleResizeMove(e: MouseEvent) {
    if (!isResizing) return;
    const delta = position === 'left' ? e.clientX - startX : startX - e.clientX;
    const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startWidth + delta));
    width = newWidth;
    onWidthChange?.(newWidth);
  }

  function handleTouchResizeMove(e: TouchEvent) {
    if (!isResizing) return;
    e.preventDefault();
    const delta =
      position === 'left' ? e.touches[0].clientX - startX : startX - e.touches[0].clientX;
    const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startWidth + delta));
    width = newWidth;
    onWidthChange?.(newWidth);
  }

  function handleResizeEnd() {
    isResizing = false;
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }

  function handleTouchResizeEnd() {
    isResizing = false;
    document.removeEventListener('touchmove', handleTouchResizeMove);
    document.removeEventListener('touchend', handleTouchResizeEnd);
    document.body.style.userSelect = '';
  }

  onDestroy(() => {
    if (isResizing) {
      handleResizeEnd();
      handleTouchResizeEnd();
    }
  });
</script>

<aside
  class="sidebar-shell"
  class:left={position === 'left'}
  class:right={position === 'right'}
  class:collapsed
  class:resizing={isResizing}
>
  <VerticalTabBar
    {position}
    {tabs}
    {lowerTabs}
    {bottomTabs}
    {activeTab}
    {onSettingsClick}
    {onAboutClick}
    {onCommandsClick}
    {onQuickAction}
    {onDailyNoteClick}
    {onLayoutsClick}
    {onPublishMarkClick}
    {onReorder}
    {onLowerReorder}
    {onSectionChange}
    {onTabChange}
  />

  {#if !collapsed}
    <div class="sidebar-content" style="width: {width}px">
      <div class="sidebar-panel-body">
        <slot />
      </div>
    </div>
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
      class="resize-handle"
      on:mousedown={handleResizeStart}
      on:touchstart={handleTouchResizeStart}
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize sidebar"
    ></div>
  {/if}
</aside>

<style>
  .sidebar-shell {
    display: flex;
    height: 100%;
    overflow: hidden;
    flex-shrink: 0;
  }

  .sidebar-shell.left {
    flex-direction: row;
  }

  .sidebar-shell.right {
    flex-direction: row-reverse;
  }

  .sidebar-content {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    background-color: var(--background-primary);
    min-width: 0;
  }

  .sidebar-panel-body {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .sidebar-panel-body > :global(*) {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .sidebar-shell.collapsed .sidebar-content {
    display: none;
  }

  .resize-handle {
    position: relative;
    width: 2px;
    cursor: col-resize;
    flex-shrink: 0;
    z-index: var(--layer-resize-handle, 5);
    transition: background-color 0.15s;
  }

  .resize-handle::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    width: 16px;
    left: -5px;
  }

  .resize-handle:hover,
  .sidebar-shell.resizing .resize-handle {
    background-color: var(--interactive-accent);
  }

  .sidebar-shell.left .resize-handle {
    order: 99;
  }
</style>
