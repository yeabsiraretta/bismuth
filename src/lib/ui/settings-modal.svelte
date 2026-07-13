<script lang="ts">
  /**
   * Full-screen settings modal with sidebar navigation, tab panes,
   * search, dirty-state tracking, and save/reset/cancel workflow.
   * @component
   */
  import BIcon from '@/ui/b-icon.svelte';
  import SettingsAbout from '@/hubs/core/components/SettingsAbout.svelte';
  import SettingsDebug from '@/hubs/core/components/SettingsDebug.svelte';
  import SettingsAi from '@/hubs/core/components/SettingsAi.svelte';
  import SettingsAppearance from '@/hubs/core/components/SettingsAppearance.svelte';
  import SettingsCalendar from '@/hubs/core/components/SettingsCalendar.svelte';
  import SettingsCanvas from '@/hubs/core/components/SettingsCanvas.svelte';
  import SettingsEditor from '@/hubs/core/components/SettingsEditor.svelte';
  import SettingsGeneral from '@/hubs/core/components/SettingsGeneral.svelte';
  import SettingsHotkeys from '@/hubs/core/components/SettingsHotkeys.svelte';
  import SettingsGamification from '@/hubs/core/components/SettingsGamification.svelte';
  import SettingsIntegration from '@/hubs/core/components/SettingsIntegration.svelte';
  import SettingsKnowledge from '@/hubs/core/components/SettingsKnowledge.svelte';
  import SettingsVault from '@/hubs/core/components/SettingsVault.svelte';
  import SettingsWindow from '@/hubs/core/components/SettingsWindow.svelte';
  import {
    closeSettings,
    getSettingsTab,
    isSettingsOpen,
    setSettingsTab,
  } from '@/hubs/core/stores/settings-modal.svelte';
  import {
    getSettings,
    resetAllSettings,
    updateSettings,
  } from '@/hubs/core/stores/settings-store.svelte';
  import type { BismuthSettings } from '@/hubs/core/types/settings';
  import { SETTINGS_TABS, type SettingsTab } from '@/hubs/core/types/settings-tabs';
  import { searchSettings, type SettingsSearchResult } from '@/hubs/core/services/settings-search';

  let open = $derived(isSettingsOpen());
  let activeTab = $derived(getSettingsTab());
  let searchQuery = $state('');
  let searchResults = $derived(searchSettings(searchQuery));
  let isSearching = $derived(searchQuery.trim().length > 0);
  let searchInputEl: HTMLInputElement | undefined = $state();

  let draft: BismuthSettings = $state($state.snapshot(getSettings()) as BismuthSettings);
  let dirty = $state(false);
  let savedSnapshot = $state('');

  $effect(() => {
    const current = JSON.stringify($state.snapshot(draft));
    dirty = current !== savedSnapshot;
  });

  let mainTabs = $derived(SETTINGS_TABS.filter((t) => !t.bottom));
  let bottomTabs = $derived(SETTINGS_TABS.filter((t) => t.bottom));

  function selectTab(tab: SettingsTab) {
    setSettingsTab(tab);
  }

  $effect(() => {
    if (open) {
      draft = $state.snapshot(getSettings()) as BismuthSettings;
      savedSnapshot = JSON.stringify($state.snapshot(getSettings()));
      dirty = false;
      searchQuery = '';
    }
  });

  async function handleSave() {
    await updateSettings(() => $state.snapshot(draft) as BismuthSettings);
    savedSnapshot = JSON.stringify($state.snapshot(draft));
    dirty = false;
  }

  async function handleReset() {
    await resetAllSettings();
    draft = $state.snapshot(getSettings()) as BismuthSettings;
    savedSnapshot = JSON.stringify($state.snapshot(draft));
    dirty = false;
  }

  function handleCancel() {
    draft = $state.snapshot(getSettings()) as BismuthSettings;
    dirty = false;
    closeSettings();
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) closeSettings();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      if (isSearching) {
        searchQuery = '';
      } else closeSettings();
    }
  }

  function goToSetting(result: SettingsSearchResult) {
    setSettingsTab(result.entry.tab);
    searchQuery = '';
    requestAnimationFrame(() => {
      const el = document.getElementById(result.entry.id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
    });
  }
</script>

{#if open}
  <div
    class="settings-backdrop"
    onclick={handleBackdropClick}
    onkeydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    aria-label="Settings"
    tabindex="-1"
  >
    <div class="settings-modal">
      <aside class="settings-sidebar">
        <div class="settings-sidebar-header">
          <h2 class="settings-title">Settings</h2>
          <button class="settings-close" onclick={closeSettings} aria-label="Close settings">
            <BIcon name="close" size={18} />
          </button>
        </div>

        <div class="settings-search">
          <BIcon name="search" size={14} class="settings-search-icon" />
          <input
            bind:this={searchInputEl}
            bind:value={searchQuery}
            type="text"
            class="settings-search-input"
            placeholder="Search settings..."
            aria-label="Search settings"
          />
          {#if isSearching}
            <button
              class="settings-search-clear"
              onclick={() => {
                searchQuery = '';
                searchInputEl?.focus();
              }}
              aria-label="Clear search"
            >
              <BIcon name="close" size={12} />
            </button>
          {/if}
        </div>

        <div
          class="settings-nav"
          role="tablist"
          aria-label="Settings sections"
          aria-orientation="vertical"
        >
          {#each mainTabs as tab (tab.id)}
            {#if tab.section}
              <span class="settings-section-label" role="presentation">{tab.section}</span>
            {/if}
            <button
              class="settings-tab"
              class:settings-tab-active={activeTab === tab.id}
              onclick={() => selectTab(tab.id)}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls="settings-tabpanel"
              id="settings-tab-{tab.id}"
            >
              <BIcon name={tab.icon} size={16} class="settings-tab-icon" />
              {tab.label}
            </button>
          {/each}

          <div class="settings-nav-spacer"></div>

          {#each bottomTabs as tab (tab.id)}
            <button
              class="settings-tab"
              class:settings-tab-active={activeTab === tab.id}
              onclick={() => selectTab(tab.id)}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls="settings-tabpanel"
              id="settings-tab-{tab.id}"
            >
              <BIcon name={tab.icon} size={16} class="settings-tab-icon" />
              {tab.label}
            </button>
          {/each}
        </div>
      </aside>

      <div class="settings-main">
        <div
          class="settings-content"
          role="tabpanel"
          id="settings-tabpanel"
          aria-labelledby="settings-tab-{activeTab}"
        >
          {#if isSearching}
            <div class="search-results">
              {#if searchResults.length === 0}
                <div class="search-empty">
                  <p class="search-empty-title">No settings found</p>
                  <p class="search-empty-hint">Try a different search term</p>
                </div>
              {:else}
                <p class="search-count">
                  {searchResults.length} result{searchResults.length === 1 ? '' : 's'}
                </p>
                {#each searchResults as result (result.entry.id)}
                  <button class="search-result" onclick={() => goToSetting(result)}>
                    <div class="search-result-info">
                      <span class="search-result-label">{result.entry.label}</span>
                      <span class="search-result-hint">{result.entry.hint}</span>
                    </div>
                    <span class="search-result-tab"
                      >{result.tabLabel} &rsaquo; {result.entry.section}</span
                    >
                  </button>
                {/each}
              {/if}
            </div>
          {:else if activeTab === 'general'}
            <SettingsGeneral
              bind:general={draft.general}
              bind:updates={draft.updates}
              bind:performance={draft.performance}
            />
          {:else if activeTab === 'editor'}
            <SettingsEditor
              bind:editor={draft.editor}
              bind:typewriter={draft.typewriter}
              bind:vim={draft.vim}
            />
          {:else if activeTab === 'appearance'}
            <SettingsAppearance bind:appearance={draft.appearance} />
          {:else if activeTab === 'vault'}
            <SettingsVault
              bind:vault={draft.vault}
              bind:versioning={draft.versioning}
              bind:changelog={draft.changelog}
            />
          {:else if activeTab === 'calendar'}
            <SettingsCalendar bind:calendar={draft.calendar} />
          {:else if activeTab === 'canvas'}
            <SettingsCanvas bind:canvas={draft.canvas} />
          {:else if activeTab === 'knowledge'}
            <SettingsKnowledge bind:knowledge={draft.knowledge} />
          {:else if activeTab === 'gamification'}
            <SettingsGamification bind:gamification={draft.gamification} />
          {:else if activeTab === 'ai'}
            <SettingsAi bind:llm={draft.llm} bind:media={draft.media} />
          {:else if activeTab === 'integration'}
            <SettingsIntegration bind:integration={draft.integration} />
          {:else if activeTab === 'window'}
            <SettingsWindow bind:window={draft.window} />
          {:else if activeTab === 'hotkeys'}
            <SettingsHotkeys />
          {:else if activeTab === 'monitoring'}
            <SettingsDebug />
          {:else if activeTab === 'about'}
            <SettingsAbout />
          {/if}
        </div>

        <footer class="settings-footer">
          <button class="settings-btn-danger" onclick={handleReset}>Reset to Defaults</button>
          <div class="settings-footer-end">
            <button class="settings-btn-ghost" onclick={handleCancel}>Cancel</button>
            <button class="settings-btn-primary" onclick={handleSave} disabled={!dirty}>Save</button
            >
          </div>
        </footer>
      </div>
    </div>
  </div>
{/if}

<style>
  .settings-backdrop {
    position: fixed;
    inset: 0;
    z-index: var(--z-modal, 400);
    display: flex;
    align-items: center;
    justify-content: center;
    background: oklch(0 0 0/0.55);
    backdrop-filter: blur(4px);
    animation: fadeIn 0.15s ease;
  }
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  .settings-modal {
    display: flex;
    width: min(880px, 92vw);
    height: min(620px, 85vh);
    border-radius: var(--radius-l);
    overflow: hidden;
    background: var(--color-background);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-l);
    animation: slideUp 0.2s ease;
  }
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(12px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
  .settings-sidebar {
    width: 200px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    background: var(--color-surface);
    border-right: 1px solid var(--color-border);
  }
  .settings-sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 16px 12px;
  }
  .settings-title {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--color-text);
  }
  .settings-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    border-radius: var(--radius-s);
    padding: 0;
  }
  .settings-close:hover {
    background: var(--color-surface-hover);
    color: var(--color-text);
  }
  .settings-close :global(svg) {
    width: 14px;
    height: 14px;
  }
  .settings-nav {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding: 0 8px 8px;
    overflow-y: auto;
  }
  .settings-nav-spacer {
    flex: 1;
  }
  .settings-section-label {
    padding: 12px 8px 4px;
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-text-subtle);
  }
  .settings-tab {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    font-size: 0.8rem;
    font-family: inherit;
    cursor: pointer;
    border-radius: var(--radius-m);
    text-align: left;
    transition:
      background 0.1s,
      color 0.1s;
  }
  .settings-tab:hover,
  .settings-tab-active {
    background: var(--color-surface-hover);
    color: var(--color-text);
  }
  .settings-tab-active {
    font-weight: 500;
  }
  .settings-tab :global(.settings-tab-icon) {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }
  .settings-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-width: 0;
  }
  .settings-content {
    flex: 1;
    overflow-y: auto;
    padding: 24px 28px;
  }
  .settings-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 20px;
    border-top: 1px solid var(--color-border);
    background: var(--color-surface);
    flex-shrink: 0;
  }
  .settings-footer-end {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .settings-btn-danger,
  .settings-btn-ghost,
  .settings-btn-primary {
    padding: 5px 12px;
    font-size: 0.75rem;
    border: none;
    cursor: pointer;
    border-radius: var(--radius-m);
    font-family: inherit;
  }
  .settings-btn-danger {
    background: transparent;
    color: var(--color-error);
  }
  .settings-btn-danger:hover {
    background: oklch(from var(--color-error) l c h/0.12);
  }
  .settings-btn-ghost {
    background: transparent;
    color: var(--color-text-muted);
  }
  .settings-btn-ghost:hover {
    color: var(--color-text);
  }
  .settings-btn-primary {
    padding: 5px 16px;
    background: var(--color-accent);
    color: var(--color-background);
    font-weight: 500;
    transition: background 0.12s;
  }
  .settings-btn-primary:hover {
    background: var(--color-accent-hover);
  }
  .settings-btn-primary:disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  /* ── Search ─────────────────────────────────────────────────── */
  .settings-search {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0 8px 8px;
    padding: 5px 8px;
    border-radius: var(--radius-m);
    background: var(--color-background);
    border: 1px solid var(--color-border);
  }
  .settings-search :global(.settings-search-icon) {
    flex-shrink: 0;
    color: var(--color-text-muted);
  }
  .settings-search-input {
    flex: 1;
    border: none;
    background: transparent;
    font-size: 0.78rem;
    font-family: inherit;
    color: var(--color-text);
    outline: none;
    min-width: 0;
  }
  .settings-search-input::placeholder {
    color: var(--color-text-subtle);
  }
  .settings-search-clear {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    border-radius: var(--radius-s);
    padding: 0;
    flex-shrink: 0;
  }
  .settings-search-clear:hover {
    background: var(--color-surface-hover);
    color: var(--color-text);
  }

  .search-results {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .search-count {
    font-size: 0.72rem;
    color: var(--color-text-subtle);
    margin-bottom: 8px;
  }
  .search-result {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 12px;
    border: none;
    background: transparent;
    border-radius: var(--radius-m);
    cursor: pointer;
    text-align: left;
    font-family: inherit;
    transition: background 0.1s;
  }
  .search-result:hover {
    background: var(--color-surface-hover);
  }
  .search-result-info {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }
  .search-result-label {
    font-size: 0.82rem;
    font-weight: 500;
    color: var(--color-text);
  }
  .search-result-hint {
    font-size: 0.72rem;
    color: var(--color-text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .search-result-tab {
    flex-shrink: 0;
    font-size: 0.68rem;
    color: var(--color-text-subtle);
    background: oklch(from var(--color-text-subtle) l c h / 0.08);
    padding: 2px 8px;
    border-radius: var(--radius-s);
    white-space: nowrap;
  }
  .search-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 16px;
    gap: 4px;
  }
  .search-empty-title {
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--color-text-muted);
  }
  .search-empty-hint {
    font-size: 0.75rem;
    color: var(--color-text-subtle);
  }
</style>
