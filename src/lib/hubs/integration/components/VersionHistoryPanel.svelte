<script lang="ts">
  import { getActiveNotePath } from '@/hubs/core/stores/vault-store.svelte';
  import { getSettings } from '@/hubs/core/stores/settings-store.svelte';
  import { listVersions } from '@/sal/version-service';
  import type { NoteVersion } from '@/sal/version-service';
  import ContextMenu from '@/ui/context-menu.svelte';
  import Panel from '@/ui/panel.svelte';
  import { log } from '@/utils/log/logger';

  let notePath = $derived(getActiveNotePath());
  let settings = $derived(getSettings());
  let enabled = $derived(settings.versioning.versioningEnabled);

  let versions = $state<NoteVersion[]>([]);

  $effect(() => {
    if (notePath && enabled) {
      loadVersions(notePath);
    } else {
      versions = [];
    }
  });

  async function loadVersions(path: string) {
    try {
      versions = await listVersions(path);
    } catch (err) {
      log.debug('Failed to load versions', { path, error: String(err) });
      versions = [];
    }
  }

  function formatTime(ts: number): string {
    if (ts === 0) return '—';
    const d = new Date(ts);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  let ctxVersion: NoteVersion | null = $state(null);
  let ctxX = $state(0);
  let ctxY = $state(0);

  function handleContext(e: MouseEvent, v: NoteVersion) {
    e.preventDefault();
    ctxVersion = v;
    ctxX = e.clientX;
    ctxY = e.clientY;
  }

  function closeCtx() {
    ctxVersion = null;
  }
</script>

<Panel title="Version History">
  {#if !notePath}
    <div class="panel-empty">No note selected</div>
  {:else if !enabled}
    <div class="panel-empty">
      <p>Versioning is disabled</p>
      <p class="panel-empty-hint">Enable it in Settings → Vault to track note versions</p>
    </div>
  {:else if versions.length === 0}
    <div class="panel-empty">
      <p>No versions recorded</p>
      <p class="panel-empty-hint">Versions will appear as you edit this note</p>
    </div>
  {:else}
    <ul class="vh-list">
      {#each versions as v (v.id)}
        <li class="vh-item" oncontextmenu={(e) => handleContext(e, v)} role="listitem">
          <div class="vh-item-main">
            <span class="vh-item-label">{v.label}</span>
            <span class="vh-item-time">{formatTime(v.timestamp)}</span>
          </div>
          <span class="vh-item-size">{v.size} B</span>
        </li>
      {/each}
    </ul>
  {/if}
</Panel>

<ContextMenu x={ctxX} y={ctxY} show={!!ctxVersion} onclose={closeCtx}>
  <button
    class="ctx-item"
    onclick={() => {
      if (ctxVersion) navigator.clipboard.writeText(ctxVersion.label);
      closeCtx();
    }}
    role="menuitem">Copy Label</button
  >
  <button
    class="ctx-item"
    onclick={() => {
      if (ctxVersion) navigator.clipboard.writeText(formatTime(ctxVersion.timestamp));
      closeCtx();
    }}
    role="menuitem">Copy Timestamp</button
  >
</ContextMenu>

<style>
  .vh-list {
    list-style: none;
    padding: 4px;
    margin: 0;
  }
  .vh-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 8px;
    border-radius: var(--radius-s);
    border-left: 2px solid var(--color-border);
    margin-bottom: 4px;
  }
  .vh-item:hover {
    background: var(--color-surface-hover);
    border-left-color: var(--color-accent);
  }
  .vh-item-main {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .vh-item-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--color-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .vh-item-time {
    font-size: 0.6rem;
    color: var(--color-text-muted);
  }
  .vh-item-size {
    font-size: 0.6rem;
    color: var(--color-text-subtle);
    flex-shrink: 0;
  }
</style>
