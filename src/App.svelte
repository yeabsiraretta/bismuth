<!-- Root app layout shell. @see src/lib/components/layout/AppLayout.slots.ts for zone contract rules -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import WelcomeScreen from '@/components/vault/welcome/WelcomeScreen.svelte';
  import NoteEditor from '@/components/note/NoteEditor.svelte';
  import EditorTabs from '@/components/editor/EditorTabs.svelte';
  import { tabOrientation, setTabOrientation } from '@/stores/editor/tabs';
  import Toolbar from '@/components/vault/Toolbar.svelte';
  import SidebarShell from '@/components/sidebar/SidebarShell.svelte';
  import LeftSidebarContent from '@/components/sidebar/LeftSidebarContent.svelte';
  import RightSidebarContent from '@/components/sidebar/RightSidebarContent.svelte';
  import AsyncFeature from '@/components/ui/layout/AsyncLoader.svelte';
  import ConfirmProvider from '@/components/overlays/ConfirmProvider.svelte';
  import StatusBar from '@/components/layout/StatusBar.svelte';
  import ToastContainer from '@/components/layout/ToastContainer.svelte';
  import Spinner from '@/components/ui/feedback/Spinner.svelte';
  import { isVaultOpen, isLoadingVault, notes, currentVault, activeNote } from '@/stores/vault/vault';
  import { layoutStore, reorderTabs, reorderLowerTabs, moveTabToSection, setLeftSidebarWidth, setRightSidebarWidth, toggleLeftSidebar, toggleRightSidebar } from '@/stores/layout/layout';
  import type { SidebarTab } from '@/types/layout';
  import { viewportMode, setViewportMode } from '@/stores/layout/presets';
  import { handleGlobalKeydown as onKeydown, openNote, changeTab } from '@/appNavigation';
  import { initializeApp, handleDailyNote, handlePublishMark, cleanupApp } from '@/app/appBootstrap';
  import { log } from '@/utils/logger';
  import { theme } from '@/stores/theme/theme';
  import { settings } from '@/features/settings';
  import { isTabEnabled, featureFlags } from '@/stores/settings/features';
  import { registerStatusItem } from '@/stores/status/status';

  let commandPaletteOpen = false;
  let commandPaletteMode: 'notes' | 'commands' = 'notes';
  let autoLinkerOpen = false;
  let settingsOpen = false;
  let layoutManagerOpen = false;
  let settingsInitialTab: 'general' | 'editor' | 'appearance' | 'features' | 'vault' | 'hotkeys' | 'about' | undefined = undefined;

  $: leftTab = $layoutStore.leftActiveTab;
  $: rightTab = $layoutStore.rightActiveTab;

  $: visibleLeftTabs = $layoutStore.leftTabs.filter(t => $isTabEnabled(t.id));
  $: visibleLeftLowerTabs = $layoutStore.leftLowerTabs.filter(t => $isTabEnabled(t.id));
  $: visibleRightTabs = $layoutStore.rightTabs.filter(t => $isTabEnabled(t.id));
  $: visibleRightLowerTabs = $layoutStore.rightLowerTabs.filter(t => $isTabEnabled(t.id));

  $: activeNotePath = $activeNote?.path ?? null;

  $: { const all = [...visibleLeftTabs, ...visibleLeftLowerTabs]; if (all.length > 0 && !all.find(t => t.id === leftTab)) changeTab('left', all[0].id); }
  $: { const all = [...visibleRightTabs, ...visibleRightLowerTabs]; if (all.length > 0 && !all.find(t => t.id === rightTab)) changeTab('right', all[0].id); }

  $: if ($currentVault) registerStatusItem({ id: 'vault-name', position: 'left', icon: 'hard-drive', label: $currentVault.name, tooltip: 'Current vault', priority: 10 });
  $: registerStatusItem({ id: 'note-count', position: 'left', icon: 'file-text', label: `${$notes.length} notes`, tooltip: 'Total notes in vault', priority: 20 });

  onMount(async () => {
    try {
      await initializeApp({
        openCommandPalette: () => { commandPaletteOpen = true; },
        openAutoLinker: () => { autoLinkerOpen = true; },
        openSettings: () => { settingsOpen = true; },
        openCommandsMode: () => { commandPaletteMode = 'commands'; commandPaletteOpen = true; },
        setLeftTab: (tab) => { leftTab = tab; },
      });
    } catch (e) {
      log.error('App initialization error', e);
    }
    window.addEventListener('keydown', handleGlobalKeydown);
    window.addEventListener('open-command-palette', () => { commandPaletteOpen = true; });

    try {
      const { emit } = await import('@tauri-apps/api/event');
      await emit('app-ready');
    } catch { /* running in browser dev — no Tauri */ }
  });

  onDestroy(() => {
    if (typeof window !== 'undefined') window.removeEventListener('keydown', handleGlobalKeydown);
    cleanupApp();
  });

  function handleGlobalKeydown(e: KeyboardEvent) { onKeydown(e, () => { commandPaletteOpen = true; }); }
  function handleOpenSettings() { settingsInitialTab = undefined; settingsOpen = true; }
  function handleOpenAbout() { settingsInitialTab = 'about'; settingsOpen = true; }

  function handleLeftTabChange(tabId: string): void {
    if (tabId === '__toggle__') { toggleLeftSidebar(); return; }
    if (tabId === 'canvas') { setViewportMode('canvas'); return; }
    if (tabId === 'graph') { setViewportMode('graph'); return; }
    if (tabId === 'open-tabs') { setTabOrientation('vertical'); changeTab('left', 'open-tabs'); return; }
    if ($viewportMode === 'canvas' || $viewportMode === 'graph') { setViewportMode('note'); }
    changeTab('left', tabId);
  }

  function handleRightTabChange(tabId: string): void {
    if (tabId === '__toggle__') { toggleRightSidebar(); return; }
    if (tabId === 'calendar') { setViewportMode('calendar'); return; }
    if ($viewportMode === 'calendar') { setViewportMode('note'); }
    changeTab('right', tabId);
  }

  $: if (typeof document !== 'undefined') document.documentElement.setAttribute('data-theme', $theme);
</script>

<a href="#editor-main" class="skip-to-content">Skip to content</a>

<main class="app" class:compact-mode={$settings.compactMode}>
  {#if $isLoadingVault}
    <div class="loading">
      <Spinner size="lg" label="Loading vault..." />
      <p>Loading vault...</p>
    </div>
  {:else if !$isVaultOpen}
    <WelcomeScreen />
  {:else}
    <div class="app-columns">
      <SidebarShell
        position="left" tabs={visibleLeftTabs} lowerTabs={visibleLeftLowerTabs}
        bottomTabs={$layoutStore.bottomTabs.filter(t => t.id !== 'help')}
        activeTab={leftTab} width={$layoutStore.leftSidebarWidth}
        collapsed={!$layoutStore.leftSidebarVisible}
        onTabChange={(d) => handleLeftTabChange(d.tabId)}
        onSettingsClick={handleOpenSettings}
        onCommandsClick={() => { commandPaletteMode = 'commands'; commandPaletteOpen = true; }}
        onDailyNoteClick={handleDailyNote}
        onLayoutsClick={() => { layoutManagerOpen = true; }}
        onPublishMarkClick={handlePublishMark}
        onReorder={(tabs: SidebarTab[]) => reorderTabs('left', tabs)}
        onLowerReorder={(tabs: SidebarTab[]) => reorderLowerTabs('left', tabs)}
        onSectionChange={(tabId: string, target: 'upper' | 'lower') => moveTabToSection('left', tabId, target)}
        onWidthChange={(w: number) => setLeftSidebarWidth(w)}
      >
        <LeftSidebarContent activeTab={leftTab} onOpenNote={(path) => openNote(path)} />
      </SidebarShell>

      <main id="editor-main" class="editor-pane panel">
        {#if $viewportMode === 'rss'}
          <AsyncFeature featureId="rss" loader={() => import('@/features/rss').then(m => ({ default: m.RssViewport }))} />
        {:else if $viewportMode === 'canvas'}
          <AsyncFeature featureId="canvas" loader={() => import('@/features/canvas/components/CanvasApp.svelte')} />
        {:else if $viewportMode === 'graph'}
          <AsyncFeature featureId="graph" loader={() => import('@/features/graph').then(m => ({ default: m.GraphView }))} />
        {:else if $viewportMode === 'calendar'}
          <AsyncFeature featureId="calendar" loader={() => import('@/features/calendar').then(m => ({ default: m.CalendarView }))} />
        {:else if $viewportMode === 'home'}
          <AsyncFeature featureId="hometab" loader={() => import('@/features/hometab').then(m => ({ default: m.HomeTab }))} />
        {:else}
          <div class="panel-header">
            <Toolbar onRefresh={() => log.info('refresh')} onNavigate={(path) => openNote(path)} />
          </div>
          <div class="panel-body">
            {#if $tabOrientation === 'horizontal'}<EditorTabs />{/if}
            <div class="editor-area"><NoteEditor /></div>
          </div>
        {/if}
      </main>

      <SidebarShell
        position="right" tabs={visibleRightTabs} lowerTabs={visibleRightLowerTabs}
        bottomTabs={[{ id: 'help', icon: 'info', label: 'About', tooltip: 'About Bismuth' }]}
        activeTab={rightTab} width={$layoutStore.rightSidebarWidth}
        collapsed={!$layoutStore.rightSidebarVisible}
        onTabChange={(d) => handleRightTabChange(d.tabId)}
        onAboutClick={handleOpenAbout}
        onQuickAction={() => { commandPaletteMode = 'commands'; commandPaletteOpen = true; }}
        onReorder={(tabs: SidebarTab[]) => reorderTabs('right', tabs)}
        onLowerReorder={(tabs: SidebarTab[]) => reorderLowerTabs('right', tabs)}
        onSectionChange={(tabId: string, target: 'upper' | 'lower') => moveTabToSection('right', tabId, target)}
        onWidthChange={(w: number) => setRightSidebarWidth(w)}
      >
        <RightSidebarContent activeTab={rightTab} {activeNotePath} />
      </SidebarShell>
    </div>

    {#if $settings.showStatusBar}<StatusBar />{/if}
  {/if}
</main>

<ToastContainer />
<ConfirmProvider />
{#if commandPaletteOpen}
  {#await import('@/features/search').then(m => m.CommandPalette) then CommandPalette}
    <svelte:component this={CommandPalette} isOpen={true} initialMode={commandPaletteMode} onClose={() => { commandPaletteOpen = false; commandPaletteMode = 'notes'; }} />
  {/await}
{/if}

{#if autoLinkerOpen}
  {#await import('@/features/wikilink').then(m => m.AutoLinker) then AutoLinker}
    <svelte:component this={AutoLinker} isOpen={true} onClose={() => { autoLinkerOpen = false; }} />
  {/await}
{/if}

{#if $featureFlags['speed-reader']}
  <AsyncFeature featureId="speedreader" loader={() => import('@/features/speedreader').then(m => ({ default: m.SpeedReader }))} />
{/if}

{#if layoutManagerOpen}
  {#await import('@/components/overlays/layouts/LayoutManager.svelte') then LayoutManager}
    <svelte:component this={LayoutManager.default} visible={true} onClose={() => { layoutManagerOpen = false; }} />
  {/await}
{/if}

{#if settingsOpen}
  {#await import('@/components/overlays/settings/SettingsModal.svelte') then SettingsModal}
    <svelte:component this={SettingsModal.default} isOpen={true} initialTab={settingsInitialTab} onClose={() => { settingsOpen = false; settingsInitialTab = undefined; }} />
  {/await}
{/if}

<style>
  .app { display: flex; flex-direction: column; width: 100%; height: 100%; min-width: 320px; min-height: 480px; overflow: hidden; background-color: var(--background-primary); }
  :global(.skip-to-content) { position: absolute; left: -9999px; top: auto; width: 1px; height: 1px; overflow: hidden; z-index: 9999; padding: 8px 16px; background: var(--interactive-accent); color: var(--text-on-accent); font-size: var(--font-ui-small); border-radius: var(--radius-s); text-decoration: none; }
  :global(.skip-to-content:focus) { position: fixed; top: 8px; left: 8px; width: auto; height: auto; overflow: visible; }
  .app-columns { display: flex; flex: 1; overflow: hidden; }
  @media (max-width: 640px) { .app { flex-direction: column; } }
  .loading { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%; gap: var(--spacing-m); }
  .editor-pane { flex: 1; height: 100%; display: flex; flex-direction: column; background: var(--background-primary); overflow: hidden; }
  .editor-pane .panel-header { display: flex; align-items: center; gap: 0; padding: 0; background: var(--background-secondary); height: var(--panel-header-height); min-height: var(--panel-header-height); }
  .editor-pane .panel-body { flex: 1; overflow: hidden; padding: 0; display: flex; flex-direction: column; }
  .editor-area { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
  :global(.compact-mode) { --spacing-xs: 2px; --spacing-s: 4px; --spacing-m: 8px; --spacing-l: 12px; --spacing-xl: 16px; }
</style>
