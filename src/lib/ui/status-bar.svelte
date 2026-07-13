<script lang="ts">
  /**
   * Application status bar displaying route, active file stats,
   * vault-wide statistics (click-to-cycle), gamification tier, and version.
   * @component
   */
  import { page } from '$app/state';
  import { APP_VERSION } from '@/constants/app-meta';
  import { getAppearance } from '@/hubs/core/stores/settings-store.svelte';
  import { getGamification, getTierForLevel } from '@/hubs/core/stores/gamification-store.svelte';
  import { getNotes } from '@/hubs/core/stores/vault-store.svelte';
  import { getCachedContent } from '@/hubs/editor/services/file-ops';
  import { getActiveTab } from '@/hubs/editor/stores/editor-tabs.svelte';
  import { getSaving } from '@/hubs/editor/stores/save-status.svelte';
  import {
    type VaultStats,
    getVaultStats,
    formatBytes,
    formatNumber,
  } from '@/hubs/knowledge/services/vault-statistics';
  import { onDestroy } from 'svelte';

  let visible = $derived(getAppearance().showStatusBar);
  let currentRoute = $derived(page.url.pathname);
  let activeTab = $derived(getActiveTab());

  let isSaving = $derived(getSaving());
  let content = $derived(activeTab?.path ? (getCachedContent(activeTab.path) ?? '') : '');
  let wordCount = $derived(content ? (content.match(/\S+/g)?.length ?? 0) : 0);
  let charCount = $derived(content.length);
  let lineCount = $derived.by(() => {
    if (!content) return 0;
    let n = 1;
    for (let i = 0; i < content.length; i++) {
      if (content.charCodeAt(i) === 10) n++;
    }
    return n;
  });
  let gamification = $derived(getGamification());

  const VAULT_STAT_KEYS = ['notes', 'words', 'files', 'attachments', 'size'] as const;
  type VaultStatKey = (typeof VAULT_STAT_KEYS)[number];
  let activeVaultStat = $state<VaultStatKey>('notes');

  let allNotes = $derived(getNotes());

  const EMPTY_STATS: VaultStats = {
    notes: 0,
    folders: 0,
    attachments: 0,
    totalFiles: 0,
    totalWords: 0,
    totalChars: 0,
    totalSize: 0,
    totalLinks: 0,
    orphanNotes: 0,
    avgWordsPerNote: 0,
    avgLinksPerNote: 0,
    tags: [],
    fileTypes: [],
    longestNote: null,
    shortestNote: null,
    newestNote: null,
    oldestNote: null,
    lastModified: null,
  };
  let vaultStats = $state<VaultStats>(EMPTY_STATS);
  let statsTimer: ReturnType<typeof setTimeout> | null = null;

  function recomputeStats() {
    getVaultStats().then((s) => {
      vaultStats = s;
    });
  }

  $effect(() => {
    const _notes = allNotes;
    void _notes;
    if (statsTimer) clearTimeout(statsTimer);
    statsTimer = setTimeout(recomputeStats, 100);
  });

  onDestroy(() => {
    if (statsTimer) clearTimeout(statsTimer);
  });

  function vaultStatLabel(key: VaultStatKey): string {
    switch (key) {
      case 'notes':
        return `${formatNumber(vaultStats.notes)} notes`;
      case 'words':
        return `${formatNumber(vaultStats.totalWords)} words`;
      case 'files':
        return `${formatNumber(vaultStats.totalFiles)} files`;
      case 'attachments':
        return `${formatNumber(vaultStats.attachments)} attachments`;
      case 'size':
        return formatBytes(vaultStats.totalSize);
    }
  }

  function cycleVaultStat() {
    const idx = VAULT_STAT_KEYS.indexOf(activeVaultStat);
    activeVaultStat = VAULT_STAT_KEYS[(idx + 1) % VAULT_STAT_KEYS.length];
  }

  let vaultTooltip = $derived(
    `${formatNumber(vaultStats.notes)} notes · ${formatNumber(vaultStats.totalWords)} words · ${formatNumber(vaultStats.totalFiles)} files · ${formatNumber(vaultStats.attachments)} attachments · ${formatBytes(vaultStats.totalSize)}`
  );

  function routeLabel(path: string): string {
    if (path === '/') return 'Home';
    const seg = path.split('/').filter(Boolean)[0];
    if (!seg) return 'Home';
    return seg.charAt(0).toUpperCase() + seg.slice(1);
  }
</script>

{#if visible}
  <footer class="status-bar" data-status-bar role="status" aria-label="Application status">
    <div class="status-left">
      <span class="status-item">{routeLabel(currentRoute)}</span>
      {#if activeTab}
        <span class="status-sep">·</span>
        <span class="status-item">{activeTab.title}</span>
      {/if}
    </div>
    <div class="status-right">
      {#if activeTab}
        <span class="status-item save-status" class:saving={isSaving}
          >{isSaving ? 'Saving...' : 'Saved'}</span
        >
        <span class="status-sep">·</span>
        <span class="status-item">{wordCount} words</span>
        <span class="status-item">{charCount} chars</span>
        <span class="status-item">{lineCount} lines</span>
        <span class="status-sep">·</span>
      {/if}
      <button
        class="status-item vault-stat-btn"
        onclick={cycleVaultStat}
        title={vaultTooltip}
        aria-label="Vault statistics: {vaultTooltip}"
      >
        {vaultStatLabel(activeVaultStat)}
      </button>
      <span class="status-sep">·</span>
      {#if gamification.currentStreak > 0}
        <span class="status-item streak-badge" title="Current writing streak"
          >{gamification.currentStreak}d streak</span
        >
        <span class="status-sep">&middot;</span>
      {/if}
      <span class="status-item" title={getTierForLevel(gamification.level).name}
        >Lv.{gamification.level} {getTierForLevel(gamification.level).name}</span
      >
      <span class="status-sep">&middot;</span>
      <span class="status-item">v{APP_VERSION}</span>
    </div>
  </footer>
{/if}

<style>
  .status-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 24px;
    padding: 0 12px;
    background: var(--color-surface);
    border-top: 1px solid var(--color-border);
    font-size: 0.65rem;
    color: var(--color-text-subtle);
    flex-shrink: 0;
    user-select: none;
  }
  .status-left,
  .status-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .status-item {
    white-space: nowrap;
  }
  .status-sep {
    color: var(--color-border);
  }
  .save-status.saving {
    color: var(--color-warning);
  }
  .streak-badge {
    color: var(--color-warning);
    font-weight: 600;
  }
  .vault-stat-btn {
    background: none;
    border: none;
    color: var(--color-text-subtle);
    font-size: 0.65rem;
    cursor: pointer;
    padding: 0;
    white-space: nowrap;
  }
  .vault-stat-btn:hover {
    color: var(--color-accent);
  }
</style>
