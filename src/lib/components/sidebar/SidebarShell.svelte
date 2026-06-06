<script lang="ts">
  import VerticalTabBar from './VerticalTabBar.svelte';
  import type { SidebarTab } from '@/types/layout';

  /** Which side this sidebar is on */
  export let position: 'left' | 'right' = 'left';
  /** Main tabs to show */
  export let tabs: SidebarTab[] = [];
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
</script>

<aside
  class="sidebar-shell"
  class:left={position === 'left'}
  class:right={position === 'right'}
  class:collapsed
>
  <VerticalTabBar
    {position}
    {tabs}
    {bottomTabs}
    {activeTab}
    {onSettingsClick}
    onTabChange={onTabChange}
  />

  {#if !collapsed}
    <div class="sidebar-content" style="width: {width}px">
      <slot />
    </div>
  {/if}
</aside>

<style>
  .sidebar-shell {
    display: flex;
    height: 100%;
    overflow: hidden;
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
    border-right: 1px solid var(--border-color);
  }

  .sidebar-shell.right .sidebar-content {
    border-right: none;
    border-left: 1px solid var(--border-color);
  }

  .sidebar-shell.collapsed .sidebar-content {
    display: none;
  }
</style>
