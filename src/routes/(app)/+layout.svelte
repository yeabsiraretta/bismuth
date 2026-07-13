<script lang="ts">
  import {
    getLeftSidebarVisible,
    getRightSidebarVisible,
    getLayout,
    initLayout,
    setActiveHub,
    setActiveTab,
    setLeftWidth,
    setRightWidth,
    setSplitPanel,
    setSplitRatio,
    toggleLeftSidebar,
    toggleRightSidebar,
  } from '@/hubs/core/stores/layout-store.svelte';
  import {
    destroyHotkeys,
    initHotkeys,
    registerHotkey,
  } from '@/hubs/core/stores/hotkey-store.svelte';
  import {
    getAppearance,
    getGeneral,
    initSettings,
  } from '@/hubs/core/stores/settings-store.svelte';
  import { destroyAmbient } from '@/hubs/core/services/ambient-music-service';
  import { destroyTheme, initTheme } from '@/hubs/core/stores/theme-store.svelte';
  import {
    closeVault,
    destroyVaultStore,
    getNotes,
    initVaultStore,
    isVaultOpen,
    rescanVault,
  } from '@/hubs/core/stores/vault-store.svelte';
  import { getStoredScale, setUIScale } from '@/hubs/core/services/zoom';
  import { createNote, writeNote } from '@/sal/note-service';
  import { openVaultDialog } from '@/sal/vault-service';
  import {
    closeAllTabs,
    destroyTabs,
    initTabs,
    openTab,
  } from '@/hubs/editor/stores/editor-tabs.svelte';
  import {
    destroyCanvasStore,
    initCanvasStore,
    openCanvas,
  } from '@/hubs/canvas/stores/canvas-store.svelte';
  import { createCanvasFile } from '@/hubs/canvas/services/canvas-file-service';
  import { initWikilinkListener } from '@/hubs/editor/services/wikilink-handler';
  import { buildDailyNotePath } from '@/hubs/navigator/services/capture-service';
  import { listen } from '@tauri-apps/api/event';
  import type { UnlistenFn } from '@tauri-apps/api/event';
  import { afterNavigate, beforeNavigate, goto } from '$app/navigation';
  import { updated } from '$app/state';
  import { onMount } from 'svelte';
  import type { Component } from 'svelte';
  import {
    DEFAULT_LEFT_HUB,
    DEFAULT_LEFT_PANEL,
    DEFAULT_RIGHT_HUB,
    DEFAULT_RIGHT_PANEL,
    LEFT_HUBS,
    RIGHT_HUBS,
  } from '@/constants/hub-registry';
  import { PANEL_MAP } from '@/constants/panel-registry';
  import { buildCommands } from '@/constants/app-commands';
  import {
    registerCommand,
    togglePalette,
    unregisterCommand,
  } from '@/hubs/core/stores/command-store.svelte';
  import OmnisearchModal from '@/hubs/navigator/components/OmnisearchModal.svelte';
  import {
    toggleOmnisearch,
    indexVault,
    isOmnisearchIndexed,
    performSearch,
  } from '@/hubs/navigator/stores/omnisearch-store.svelte';
  import {
    findTagPage,
    generateTagPageContent,
  } from '@/hubs/knowledge/services/tag-wrangler-service';
  import { getCachedContent, updateCachedContent } from '@/hubs/editor/services/file-ops';
  import ContextMenu from '@/ui/context-menu.svelte';
  import CommandPalette from '@/ui/command-palette.svelte';
  import SettingsModal from '@/ui/settings-modal.svelte';
  import SidebarShell, { type BottomAction } from '@/ui/sidebar-shell.svelte';
  import StatusBar from '@/ui/status-bar.svelte';
  import ToastContainer from '@/ui/toast-container.svelte';
  import { openSettings } from '@/hubs/core/stores/settings-modal.svelte';
  import { LAST_ROUTE_KEY } from '@/constants/storage-keys';
  import { log } from '@/utils/log/logger';
  import {
    initGamification,
    destroyGamification,
  } from '@/hubs/core/stores/gamification-store.svelte';
  import { runScheduledBackup } from '@/sal/nas-backup-service';
  import { startPerformanceObservers, stopPerformanceObservers } from '@/utils/log/perf-observer';
  import {
    initTopicLinkStore,
    destroyTopicLinkStore,
  } from '@/hubs/knowledge/stores/topic-link-store.svelte';
  import { SvelteMap } from 'svelte/reactivity';
  const moduleCache = new SvelteMap<string, Component>();
  let leftComp = $state<Component | null>(null);
  let rightComp = $state<Component | null>(null);
  let leftSplitComp = $state<Component | null>(null);
  let rightSplitComp = $state<Component | null>(null);

  let { children } = $props();

  function navigateTo(path: string) {
    goto(path);
  }

  async function handleNewNote() {
    const title = prompt('New note title:');
    if (!title?.trim()) return;
    try {
      const note = await createNote(title.trim());
      await rescanVault();
      window.dispatchEvent(new CustomEvent('open-note', { detail: { path: note.path } }));
    } catch {
      /* Tauri-only */
    }
  }

  async function handleNewCanvas() {
    const name = prompt('New canvas name:');
    if (!name?.trim()) return;
    try {
      const entry = await createCanvasFile(name.trim());
      await rescanVault();
      window.dispatchEvent(new CustomEvent('open-note', { detail: { path: entry.path } }));
    } catch {
      /* Tauri-only */
    }
  }

  const editorEvent = (evt: string) => () => {
    window.dispatchEvent(new CustomEvent(evt));
  };

  const COMMANDS = buildCommands({
    navigateTo,
    handleNewNote,
    zoomIn,
    zoomOut,
    zoomReset,
    switchVault: () => {
      closeVault();
      goto('/welcome');
    },
  });

  const layoutLog = log.child('app-layout');

  function handleOpenCanvas(e: Event) {
    const p = (e as CustomEvent<{ path: string }>).detail?.path;
    if (p) openCanvas(p).then(() => goto('/canvas'));
  }

  function handleOpenNote(e: Event) {
    const detail = (e as CustomEvent<{ path: string; content?: string; append?: boolean }>).detail;
    const path = detail.path;
    if (path.endsWith('.canvas')) {
      handleOpenCanvas(e);
      return;
    }
    if (path.endsWith('.pdf')) {
      const pdfTitle = path.split('/').pop()?.replace('.pdf', '') ?? 'PDF';
      openTab(path, pdfTitle);
      return;
    }
    if (!path.endsWith('.md')) return;
    const title = path.split('/').pop()?.replace('.md', '') ?? 'Untitled';
    const folder = path.includes('/') ? path.split('/').slice(0, -1).join('/') : undefined;
    if (detail.content && detail.append) {
      const existing = getCachedContent(path) ?? '';
      const updated = existing + detail.content;
      writeNote(path, updated)
        .then(() => {
          updateCachedContent(path, updated);
        })
        .catch(() => {})
        .finally(() => {
          openTab(path, title);
          goto('/editor');
        });
      return;
    }
    if (detail.content) {
      createNote(title, folder, detail.content)
        .then(() => rescanVault())
        .then(() => {
          openTab(path, title);
          goto('/editor');
        })
        .catch(() => {
          openTab(path, title);
          goto('/editor');
        });
      return;
    }
    openTab(path, title);
    goto('/editor');
  }

  function handleTagClick(e: Event) {
    const tag = (e as CustomEvent<{ tag: string }>).detail?.tag;
    if (tag) {
      performSearch(`#${tag}`);
      goto('/editor');
    }
  }

  function handleTagPageOpen(e: Event) {
    const detail = (e as CustomEvent<{ tag: string }>).detail;
    if (!detail?.tag) return;
    const allNotes = getNotes().map((n) => ({
      path: n.path,
      title: n.title,
      content: getCachedContent(n.path) ?? '',
    }));
    const existing = findTagPage(allNotes, detail.tag);
    if (existing) {
      window.dispatchEvent(new CustomEvent('open-note', { detail: { path: existing.path } }));
    } else {
      const shouldCreate = confirm(`No tag page exists for #${detail.tag}. Create one?`);
      if (shouldCreate) {
        const content = generateTagPageContent(detail.tag);
        const title = detail.tag.replace(/\//g, '-');
        createNote(title, undefined, content)
          .then(() => rescanVault())
          .catch(() => {});
      }
    }
  }

  let editorCtxTag: string | null = $state(null);
  let editorCtxX = $state(0);
  let editorCtxY = $state(0);
  function handleTagContext(e: Event) {
    const d = (e as CustomEvent<{ tag: string; x: number; y: number }>).detail;
    if (!d?.tag) return;
    editorCtxTag = d.tag;
    editorCtxX = d.x;
    editorCtxY = d.y;
  }
  function closeEditorCtx() {
    editorCtxTag = null;
  }

  const ZOOM_STEP = 0.05;
  let menuUnlisteners: UnlistenFn[] = [];

  function zoomIn() {
    setUIScale(getStoredScale() + ZOOM_STEP);
  }
  function zoomOut() {
    setUIScale(getStoredScale() - ZOOM_STEP);
  }
  function zoomReset() {
    setUIScale(1.0);
  }

  onMount(() => {
    layoutLog.info('App layout mounting', { pathname: window.location.pathname });

    initSettings();
    initTheme();
    initLayout();
    initVaultStore();
    initTabs();
    initHotkeys();
    initGamification();
    initCanvasStore();
    initTopicLinkStore();
    startPerformanceObservers();

    if ('__TAURI_INTERNALS__' in window) {
      const wire = (event: string, handler: () => void) => {
        listen(event, () => {
          layoutLog.debug(`Received ${event}`);
          handler();
        }).then((fn) => menuUnlisteners.push(fn));
      };

      wire('menu:new-note', handleNewNote);
      wire('menu:open-vault', () => openVaultDialog());
      wire('menu:close-vault', () => {
        closeVault();
        goto('/welcome');
      });
      wire('menu:rescan-vault', () => rescanVault());
      wire('menu:open-settings', () => openSettings());
      wire('menu:toggle-sidebar', toggleLeftSidebar);
      wire('menu:new-canvas', handleNewCanvas);
      wire('menu:zoom-in', zoomIn);
      wire('menu:zoom-out', zoomOut);
      wire('menu:zoom-reset', zoomReset);
      wire('menu:command-palette', togglePalette);
      wire('menu:find', () => {
        window.dispatchEvent(new CustomEvent('editor:open-search'));
      });
      wire('menu:replace', () => {
        window.dispatchEvent(new CustomEvent('editor:open-search'));
      });

      // Deep-link URI handlers (bismuth://open/..., bismuth://search/..., etc.)
      listen('deep-link:open-note', (event) => {
        const path = event.payload as string;
        if (path) {
          window.dispatchEvent(new CustomEvent('open-note', { detail: { path } }));
        }
      }).then((fn) => menuUnlisteners.push(fn));

      listen('deep-link:search', (event) => {
        const query = event.payload as string;
        if (query) {
          performSearch(query);
          goto('/editor');
        }
      }).then((fn) => menuUnlisteners.push(fn));

      listen('deep-link:new-note', (event) => {
        const title = event.payload as string;
        if (title) {
          createNote(title)
            .then(() => rescanVault())
            .then(() => {
              window.dispatchEvent(
                new CustomEvent('open-note', { detail: { path: `${title}.md` } })
              );
            })
            .catch(() => {});
        }
      }).then((fn) => menuUnlisteners.push(fn));

      listen('deep-link:focus', () => {
        layoutLog.debug('Deep link: focus received');
      }).then((fn) => menuUnlisteners.push(fn));
    }

    const hk = (id: string, name: string, keys: string, action: () => void) =>
      registerHotkey({ id, name, description: name, keys, action });
    hk('cmd-palette', 'Command Palette', 'Cmd+P', togglePalette);
    hk('toggle-left-sidebar', 'Toggle Left Sidebar', 'Cmd+B', toggleLeftSidebar);
    hk('toggle-right-sidebar', 'Toggle Right Sidebar', 'Cmd+Shift+B', toggleRightSidebar);
    hk('open-settings', 'Settings', 'Cmd+,', () => openSettings());
    hk('new-note', 'New Note', 'Cmd+N', handleNewNote);
    hk('zoom-in', 'Zoom In', 'Cmd+=', zoomIn);
    hk('zoom-out', 'Zoom Out', 'Cmd+-', zoomOut);
    hk('zoom-reset', 'Reset Zoom', 'Cmd+0', zoomReset);
    hk('find', 'Find', 'Cmd+F', editorEvent('editor:open-search'));
    hk('save-note', 'Save Note', 'Cmd+S', editorEvent('editor:save'));
    hk('omnisearch', 'Omnisearch', 'Cmd+Shift+O', toggleOmnisearch);
    hk('enhanced-copy', 'Enhanced Copy', 'Cmd+Shift+C', editorEvent('editor:enhanced-copy'));
    hk('nav-flashcards', 'Flashcards', 'Cmd+Shift+F', () => goto('/flashcards'));

    // Auto-index vault for omnisearch when browser is idle
    const scheduleIdle =
      typeof requestIdleCallback === 'function'
        ? (cb: () => void) => requestIdleCallback(cb)
        : (cb: () => void) => setTimeout(cb, 2000);
    scheduleIdle(() => {
      if (!isOmnisearchIndexed()) indexVault();
    });
    scheduleIdle(() => {
      runScheduledBackup();
    });

    for (const cmd of COMMANDS) registerCommand(cmd);
    const destroyWikilinkListener = initWikilinkListener();
    window.addEventListener('open-note', handleOpenNote);
    window.addEventListener('open-canvas', handleOpenCanvas);
    window.addEventListener('tag-click', handleTagClick);
    window.addEventListener('filter-by-tag', handleTagClick);
    window.addEventListener('tag-page:open', handleTagPageOpen);
    window.addEventListener('tag-context', handleTagContext);

    if (!isVaultOpen()) {
      goto('/welcome');
    } else if (window.location.pathname === '/') {
      const cfg = getGeneral().homepage;
      let route = '/';
      if (cfg.option === 'last-opened') {
        try {
          const lr = localStorage.getItem(LAST_ROUTE_KEY);
          if (lr && lr !== '/') route = lr;
        } catch {
          /* */
        }
      } else if (cfg.option === 'daily-note') {
        const dailyPath = buildDailyNotePath();
        const dailyTitle = dailyPath.split('/').pop()?.replace('.md', '') ?? 'Daily';
        openTab(dailyPath, dailyTitle);
        route = '/editor';
      } else if (cfg.option === 'empty') {
        closeAllTabs();
        route = '/editor';
      } else if (cfg.option === 'specific-note' && cfg.specificNotePath) {
        openTab(
          cfg.specificNotePath,
          cfg.specificNotePath.split('/').pop()?.replace('.md', '') ?? 'Untitled'
        );
        route = '/editor';
      }
      if (route !== '/') goto(route);
    }

    const rmEvt = (e: string, h: (ev: Event) => void) => window.removeEventListener(e, h);
    return () => {
      destroyWikilinkListener();
      rmEvt('open-note', handleOpenNote);
      rmEvt('open-canvas', handleOpenCanvas);
      rmEvt('tag-click', handleTagClick);
      rmEvt('filter-by-tag', handleTagClick);
      rmEvt('tag-page:open', handleTagPageOpen);
      rmEvt('tag-context', handleTagContext);
      for (const fn of menuUnlisteners) fn();
      for (const cmd of COMMANDS) unregisterCommand(cmd.id);
      menuUnlisteners = [];
      destroyTabs();
      destroyHotkeys();
      destroyTheme();
      destroyAmbient();
      destroyVaultStore();
      destroyGamification();
      destroyCanvasStore();
      destroyTopicLinkStore();
      stopPerformanceObservers();
    };
  });

  let storedLayout = $derived(getLayout());
  let leftActiveHub = $state(DEFAULT_LEFT_HUB);
  let leftActivePanel = $state(DEFAULT_LEFT_PANEL);
  let rightActiveHub = $state(DEFAULT_RIGHT_HUB);
  let rightActivePanel = $state(DEFAULT_RIGHT_PANEL);
  let leftWidth = $state(260);
  let rightWidth = $state(260);

  $effect(() => {
    leftActiveHub = storedLayout.leftActiveHub;
    leftActivePanel = storedLayout.leftActiveTab;
    rightActiveHub = storedLayout.rightActiveHub;
    rightActivePanel = storedLayout.rightActiveTab;
    leftWidth = storedLayout.leftWidth;
    rightWidth = storedLayout.rightWidth;
  });
  $effect(() => {
    if (leftWidth !== storedLayout.leftWidth) setLeftWidth(leftWidth);
  });
  $effect(() => {
    if (rightWidth !== storedLayout.rightWidth) setRightWidth(rightWidth);
  });
  $effect(() => {
    if (leftActiveHub !== storedLayout.leftActiveHub)
      setActiveHub('left', leftActiveHub, leftActivePanel);
  });
  $effect(() => {
    if (leftActivePanel !== storedLayout.leftActiveTab) setActiveTab('left', leftActivePanel);
  });
  $effect(() => {
    if (rightActiveHub !== storedLayout.rightActiveHub)
      setActiveHub('right', rightActiveHub, rightActivePanel);
  });
  $effect(() => {
    if (rightActivePanel !== storedLayout.rightActiveTab) setActiveTab('right', rightActivePanel);
  });

  let hasVault = $derived(isVaultOpen());
  let leftCollapsed = $derived(!getLeftSidebarVisible());
  let rightCollapsed = $derived(!getRightSidebarVisible());

  let leftPanelKey = $derived(`${leftActiveHub}:${leftActivePanel}`);
  let rightPanelKey = $derived(`${rightActiveHub}:${rightActivePanel}`);
  let sidebarShowIcons = $derived(getAppearance().sidebarShowIcons);
  let leftSplitKey = $derived(storedLayout.leftSplitPanel);
  let rightSplitKey = $derived(storedLayout.rightSplitPanel);
  let leftSplitRatio = $derived(storedLayout.leftSplitRatio);
  let rightSplitRatio = $derived(storedLayout.rightSplitRatio);

  function loadPanel(
    key: string | null,
    currentKeyGetter: () => string | null,
    setter: (c: Component | null) => void
  ) {
    if (!key) {
      setter(null);
      return;
    }
    const cached = moduleCache.get(key);
    if (cached) {
      setter(cached);
      return;
    }
    setter(null);
    const loader = PANEL_MAP[key];
    if (loader) {
      loader().then((mod) => {
        moduleCache.set(key, mod.default);
        if (currentKeyGetter() === key) setter(mod.default);
      });
    }
  }

  $effect(() => {
    loadPanel(
      leftPanelKey,
      () => leftPanelKey,
      (c) => {
        leftComp = c;
      }
    );
  });
  $effect(() => {
    loadPanel(
      rightPanelKey,
      () => rightPanelKey,
      (c) => {
        rightComp = c;
      }
    );
  });
  $effect(() => {
    loadPanel(
      leftSplitKey,
      () => leftSplitKey,
      (c) => {
        leftSplitComp = c;
      }
    );
  });
  $effect(() => {
    loadPanel(
      rightSplitKey,
      () => rightSplitKey,
      (c) => {
        rightSplitComp = c;
      }
    );
  });

  afterNavigate(({ to }) => {
    const main = document.getElementById('main-content');
    main?.focus();
    try {
      const pathname = to?.url?.pathname ?? '/';
      if (pathname !== '/') {
        localStorage.setItem(LAST_ROUTE_KEY, pathname);
      }
    } catch {
      /* ignore */
    }
  });

  beforeNavigate(({ willUnload, to }) => {
    if (updated.current && !willUnload && to?.url) {
      window.location.href = to.url.href;
    }
  });

  const leftBottomActions: BottomAction[] = [
    { id: 'home', icon: 'home', label: 'Home', action: () => goto('/') },
    { id: 'command', icon: 'command', label: 'Command Palette', action: togglePalette },
    { id: 'settings', icon: 'settings', label: 'Settings', action: () => openSettings() },
    { id: 'help', icon: 'help', label: 'Help', action: () => openSettings('hotkeys') },
  ];
</script>

<a href="#main-content" class="skip-link">Skip to main content</a>

<div class="app-shell">
  <div class="app-body">
    {#if hasVault}
      <SidebarShell
        position="left"
        hubs={LEFT_HUBS}
        bind:activeHub={leftActiveHub}
        bind:activePanel={leftActivePanel}
        bind:width={leftWidth}
        collapsed={leftCollapsed}
        onToggle={toggleLeftSidebar}
        bottomActions={leftBottomActions}
        showIcons={sidebarShowIcons}
        hasSplit={!!leftSplitKey}
        splitRatio={leftSplitRatio}
        onSplitRatioChange={(r) => setSplitRatio('left', r)}
        onCloseSplit={() => setSplitPanel('left', null)}
        onSplitPanel={(key) => setSplitPanel('left', key)}
      >
        {#key leftPanelKey}
          {#if leftComp}
            {@const Panel = leftComp}
            <Panel />
          {/if}
        {/key}
        {#snippet splitChildren()}
          {#key leftSplitKey}
            {#if leftSplitComp}
              {@const SplitPanel = leftSplitComp}
              <SplitPanel />
            {/if}
          {/key}
        {/snippet}
      </SidebarShell>
    {/if}

    <main id="main-content" class="app-main" tabindex="-1" aria-label="Main content">
      {@render children()}
    </main>

    {#if hasVault}
      <SidebarShell
        position="right"
        hubs={RIGHT_HUBS}
        bind:activeHub={rightActiveHub}
        bind:activePanel={rightActivePanel}
        bind:width={rightWidth}
        collapsed={rightCollapsed}
        onToggle={toggleRightSidebar}
        showIcons={sidebarShowIcons}
        hasSplit={!!rightSplitKey}
        splitRatio={rightSplitRatio}
        onSplitRatioChange={(r) => setSplitRatio('right', r)}
        onCloseSplit={() => setSplitPanel('right', null)}
        onSplitPanel={(key) => setSplitPanel('right', key)}
      >
        {#key rightPanelKey}
          {#if rightComp}
            {@const Panel = rightComp}
            <Panel />
          {/if}
        {/key}
        {#snippet splitChildren()}
          {#key rightSplitKey}
            {#if rightSplitComp}
              {@const SplitPanel = rightSplitComp}
              <SplitPanel />
            {/if}
          {/key}
        {/snippet}
      </SidebarShell>
    {/if}
  </div>

  {#if hasVault}
    <StatusBar />
  {/if}
  <ToastContainer />
  <CommandPalette />
  <OmnisearchModal />
  <SettingsModal />
  <ContextMenu x={editorCtxX} y={editorCtxY} show={!!editorCtxTag} onclose={closeEditorCtx}>
    <button
      class="ctx-item"
      onclick={() => {
        if (editorCtxTag) {
          performSearch(`#${editorCtxTag}`);
          goto('/editor');
        }
        closeEditorCtx();
      }}
      role="menuitem">Search for Tag</button
    >
    <button
      class="ctx-item"
      onclick={() => {
        if (editorCtxTag)
          handleTagPageOpen(new CustomEvent('tag-page:open', { detail: { tag: editorCtxTag } }));
        closeEditorCtx();
      }}
      role="menuitem">Open Tag Page</button
    >
    <div class="ctx-sep" role="separator"></div>
    <button
      class="ctx-item"
      onclick={() => {
        if (editorCtxTag) navigator.clipboard.writeText(`#${editorCtxTag}`);
        closeEditorCtx();
      }}
      role="menuitem">Copy Tag</button
    >
  </ContextMenu>
</div>

<style>
  .app-shell {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
  }
  .app-body {
    display: flex;
    flex: 1;
    overflow: hidden;
  }
  .app-main {
    flex: 1;
    overflow: auto;
    min-width: 0;
  }
  :global(.panel-placeholder) {
    padding: 24px 16px;
    text-align: center;
    color: var(--color-text-subtle);
    font-size: 0.75rem;
  }
  :global(.skip-link) {
    position: absolute;
    top: -100%;
    left: 16px;
    z-index: var(--z-skip-link);
    padding: 8px 16px;
    background: var(--color-accent);
    color: var(--color-background);
    font-size: 0.8rem;
    font-weight: 600;
    border-radius: var(--radius-s);
    text-decoration: none;
    transition: top var(--transition-base);
    &:focus {
      top: 8px;
    }
  }
</style>
