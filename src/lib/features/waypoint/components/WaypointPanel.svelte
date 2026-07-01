<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import PanelHeader from '@/components/ui/layout/PanelHeader.svelte';
  import ActionButton from '@/components/ui/actions/ActionButton.svelte';
  import EmptyState from '@/components/ui/feedback/EmptyState.svelte';
  import { currentVault } from '@/stores/vault/vault';
  import { activeNote } from '@/stores/vault/vault';
  import { writeNote, createFolder as createFolderService } from '@/services/vault/vault';
  import { refreshNotes } from '@/stores/vault/vault';
  import { openNoteTab } from '@/stores/editor/tabs';
  import { getNote } from '@/services/vault/vault';
  import { log } from '@/utils/logger';
  import {
    waypointConfig,
    waypointHidden,
    folderNoteIndex,
    isProcessing,
    waypointCount,
    landmarkCount,
    folderNoteCount,
    toggleEnabled,
    toggleHideInEditor,
    toggleStopAtFolderNotes,
    toggleAutoCreateFolderNotes,
    toggleIncludeExtension,
    updateAllWaypoints,
    scanFolderNotes,
  } from '../stores/waypointStore';
  import {
    isFolderNote,
    folderNotePath,
    folderNoteContent,
    parentDir,
    folderName,
    stemOf,
  } from '../services/waypointService';
  import { triggerComment } from '../types/waypoint';

  let showSettings = false;
  let newFolderName = '';
  let createWithMarker: 'waypoint' | 'landmark' | null = 'waypoint';

  $: config = $waypointConfig;
  $: vault = $currentVault;
  $: note = $activeNote;
  $: isCurrentFolderNote = note ? isFolderNote(note.path) : false;
  $: currentFolder = note ? parentDir(note.path) : '';

  async function handleScan() {
    await scanFolderNotes();
  }

  async function handleUpdateAll() {
    const count = await updateAllWaypoints();
    log.info('Waypoints updated', { count });
  }

  async function handleCreateFolderNote() {
    if (!vault || !currentFolder) return;
    const fName = folderName(currentFolder);
    const path = folderNotePath(currentFolder);
    const content = folderNoteContent(fName, createWithMarker);
    try {
      await writeNote(path, content);
      await refreshNotes();
      const created = await getNote(path);
      openNoteTab(created);
      log.info('Folder note created', { path });
      if (createWithMarker) {
        await updateAllWaypoints();
      }
    } catch (error) {
      log.error('Failed to create folder note', error as Error);
    }
  }

  async function handleCreateNewFolder() {
    if (!vault || !newFolderName.trim()) return;
    const base = vault.root_path;
    const folderPath = `${base}/${newFolderName.trim()}`;
    try {
      await createFolderService(folderPath);
      if (config.autoCreateFolderNotes) {
        const fName = newFolderName.trim();
        const path = `${folderPath}/${fName}.md`;
        const content = folderNoteContent(fName, 'waypoint');
        await writeNote(path, content);
      }
      await refreshNotes();
      newFolderName = '';
      log.info('Folder created', { path: folderPath });
    } catch (error) {
      log.error('Failed to create folder', error as Error);
    }
  }

  async function handleInsertTrigger(kind: 'waypoint' | 'landmark') {
    if (!note) return;
    const trigger = kind === 'waypoint'
      ? triggerComment(config.waypointTrigger)
      : triggerComment(config.landmarkTrigger);
    const newContent = note.content + '\n\n' + trigger + '\n';
    try {
      await writeNote(note.path, newContent);
      await refreshNotes();
      const updated = await getNote(note.path);
      openNoteTab(updated);
      await updateAllWaypoints();
    } catch (error) {
      log.error('Failed to insert trigger', error as Error);
    }
  }
</script>

<div class="wp-panel">
  <PanelHeader count={$folderNoteCount || undefined}>
    <svelte:fragment slot="actions">
      <ActionButton
        icon={config.enabled ? 'compass' : 'compass-off'}
        title={config.enabled ? 'Disable Waypoints' : 'Enable Waypoints'}
        on:click={toggleEnabled}
      />
      <ActionButton
        icon={$waypointHidden ? 'eye-off' : 'eye'}
        title={$waypointHidden ? 'Show waypoint blocks' : 'Hide waypoint blocks'}
        on:click={toggleHideInEditor}
      />
      <ActionButton
        icon="settings"
        title="Settings"
        on:click={() => (showSettings = !showSettings)}
      />
    </svelte:fragment>
  </PanelHeader>

  <div class="wp-body">
    <!-- Stats bar -->
    <div class="wp-stats">
      <span class="wp-stat"><Icon name="map" size={12} /> {$waypointCount} waypoints</span>
      <span class="wp-stat"><Icon name="flag" size={12} /> {$landmarkCount} landmarks</span>
      <span class="wp-stat"><Icon name="folder" size={12} /> {$folderNoteCount} folder notes</span>
    </div>

    <!-- Action buttons -->
    <div class="wp-actions">
      <button class="wp-btn" on:click={handleScan} disabled={$isProcessing || !config.enabled}>
        <Icon name="scan" size={14} /> Scan Vault
      </button>
      <button class="wp-btn wp-btn-primary" on:click={handleUpdateAll} disabled={$isProcessing || !config.enabled}>
        <Icon name="refresh-cw" size={14} /> {$isProcessing ? 'Updating...' : 'Update All'}
      </button>
    </div>

    <!-- Current note actions -->
    {#if note}
      <div class="wp-section">
        <h4 class="wp-section-title">Current Note</h4>
        <p class="wp-note-info">
          <Icon name={isCurrentFolderNote ? 'folder-check' : 'file-text'} size={12} />
          {stemOf(note.path)}
          {#if isCurrentFolderNote}
            <span class="wp-badge">folder note</span>
          {/if}
        </p>

        {#if isCurrentFolderNote}
          <div class="wp-insert-actions">
            <button class="wp-btn-sm" on:click={() => handleInsertTrigger('waypoint')}>
              <Icon name="compass" size={12} /> Insert Waypoint
            </button>
            <button class="wp-btn-sm" on:click={() => handleInsertTrigger('landmark')}>
              <Icon name="flag" size={12} /> Insert Landmark
            </button>
          </div>
        {:else if currentFolder}
          <button class="wp-btn-sm" on:click={handleCreateFolderNote}>
            <Icon name="file-plus" size={12} /> Create Folder Note
          </button>
          <div class="wp-create-options">
            <label class="wp-radio">
              <input type="radio" bind:group={createWithMarker} value="waypoint" /> Waypoint
            </label>
            <label class="wp-radio">
              <input type="radio" bind:group={createWithMarker} value="landmark" /> Landmark
            </label>
            <label class="wp-radio">
              <input type="radio" bind:group={createWithMarker} value={null} /> None
            </label>
          </div>
        {/if}
      </div>
    {/if}

    <!-- Create new folder -->
    <div class="wp-section">
      <h4 class="wp-section-title">New Folder</h4>
      <form class="wp-create-folder" on:submit|preventDefault={handleCreateNewFolder}>
        <input
          class="wp-input"
          type="text"
          placeholder="Folder name..."
          bind:value={newFolderName}
        />
        <button class="wp-btn-sm" type="submit" disabled={!newFolderName.trim()}>
          <Icon name="folder-plus" size={12} /> Create
        </button>
      </form>
    </div>

    <!-- Folder note index -->
    {#if $folderNoteIndex.length > 0}
      <div class="wp-section">
        <h4 class="wp-section-title">Folder Notes</h4>
        <div class="wp-fn-list">
          {#each $folderNoteIndex as fn (fn.notePath)}
            <button
              class="wp-fn-item"
              on:click={async () => { const n = await getNote(fn.notePath); openNoteTab(n); }}
            >
              <Icon name={fn.marker === 'waypoint' ? 'compass' : fn.marker === 'landmark' ? 'flag' : 'file'} size={12} />
              <span class="wp-fn-name">{fn.folderName}</span>
              {#if fn.marker}
                <span class="wp-badge wp-badge-{fn.marker}">{fn.marker}</span>
              {/if}
            </button>
          {/each}
        </div>
      </div>
    {:else if config.enabled}
      <EmptyState icon="compass" title="No folder notes" description="Scan the vault or create a folder note to get started" />
    {/if}

    <!-- Settings panel -->
    {#if showSettings}
      <div class="wp-section wp-settings">
        <h4 class="wp-section-title">Settings</h4>
        <label class="wp-toggle">
          <input type="checkbox" checked={config.stopAtFolderNotes} on:change={toggleStopAtFolderNotes} />
          Stop at folder notes
        </label>
        <label class="wp-toggle">
          <input type="checkbox" checked={config.autoCreateFolderNotes} on:change={toggleAutoCreateFolderNotes} />
          Auto-create folder notes
        </label>
        <label class="wp-toggle">
          <input type="checkbox" checked={config.includeExtension} on:change={toggleIncludeExtension} />
          Include .md in links
        </label>
      </div>
    {/if}
  </div>
</div>

<style>
  .wp-panel { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
  .wp-body { flex: 1; overflow-y: auto; padding: 8px 12px; display: flex; flex-direction: column; gap: 10px; }
  .wp-stats { display: flex; gap: 12px; flex-wrap: wrap; padding: 6px 0; }
  .wp-stat { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--text-muted); }
  .wp-actions { display: flex; gap: 6px; }
  .wp-btn { display: flex; align-items: center; gap: 5px; padding: 5px 10px; font-size: var(--font-ui-smaller); border: 1px solid var(--border-color); border-radius: 4px; background: var(--background-secondary); color: var(--text-normal); cursor: pointer; flex: 1; justify-content: center; }
  .wp-btn:hover:not(:disabled) { background: var(--background-modifier-hover); }
  .wp-btn:disabled { opacity: 0.5; cursor: default; }
  .wp-btn-primary { background: var(--interactive-accent); color: var(--text-on-accent, #fff); border-color: var(--interactive-accent); }
  .wp-btn-primary:hover:not(:disabled) { opacity: 0.9; }
  .wp-section { display: flex; flex-direction: column; gap: 6px; }
  .wp-section-title { font-size: 11px; font-weight: var(--font-semibold); color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin: 0; }
  .wp-note-info { display: flex; align-items: center; gap: 5px; font-size: var(--font-ui-small); color: var(--text-normal); margin: 0; }
  .wp-badge { font-size: 10px; padding: 1px 5px; border-radius: 8px; background: var(--background-modifier-hover); color: var(--text-muted); }
  .wp-badge-waypoint { background: var(--interactive-accent); color: var(--text-on-accent, #fff); }
  .wp-badge-landmark { background: var(--text-accent); color: #fff; }
  .wp-insert-actions { display: flex; gap: 4px; }
  .wp-btn-sm { display: flex; align-items: center; gap: 4px; padding: 3px 8px; font-size: 11px; border: 1px solid var(--border-color); border-radius: 3px; background: var(--background-primary); color: var(--text-normal); cursor: pointer; }
  .wp-btn-sm:hover:not(:disabled) { background: var(--background-modifier-hover); }
  .wp-btn-sm:disabled { opacity: 0.5; }
  .wp-create-options { display: flex; gap: 8px; }
  .wp-radio { display: flex; align-items: center; gap: 3px; font-size: 11px; color: var(--text-muted); cursor: pointer; }
  .wp-create-folder { display: flex; gap: 4px; }
  .wp-input { flex: 1; padding: 4px 8px; font-size: var(--font-ui-smaller); border: 1px solid var(--border-color); border-radius: 3px; background: var(--background-primary); color: var(--text-normal); outline: none; }
  .wp-input:focus { border-color: var(--interactive-accent); }
  .wp-fn-list { display: flex; flex-direction: column; gap: 2px; max-height: 200px; overflow-y: auto; }
  .wp-fn-item { display: flex; align-items: center; gap: 5px; padding: 4px 8px; font-size: var(--font-ui-small); border: none; border-radius: 3px; background: transparent; color: var(--text-normal); cursor: pointer; text-align: left; }
  .wp-fn-item:hover { background: var(--background-modifier-hover); }
  .wp-fn-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .wp-settings { padding: 8px; background: var(--background-secondary); border-radius: 4px; }
  .wp-toggle { display: flex; align-items: center; gap: 6px; font-size: var(--font-ui-smaller); color: var(--text-normal); cursor: pointer; }
</style>
