<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import PanelHeader from '@/components/ui/layout/PanelHeader.svelte';
  import { onMount } from 'svelte';
  import {
    currentNotes,
    vaultNotes,
    explorerState,
    activeRecall,
    noteCount,
    groupedNotes,
    marginaliaSettings,
    setExplorerTab,
    setExplorerSearch,
    toggleGroup,
    toggleActiveRecall,
    scanVaultNotes,
    parseCurrentNote,
  } from '../stores/marginStore';
  import type { MarginNote, ExplorerTab } from '../types';

  const TABS: { id: ExplorerTab; label: string }[] = [
    { id: 'current', label: 'Current' },
    { id: 'vault', label: 'Vault' },
  ];

  $: allVaultNotes = $vaultNotes.flatMap((f) => f.notes);
  $: displayNotes = $explorerState.tab === 'current' ? $groupedNotes : groupVaultNotes();

  function groupVaultNotes(): Map<string, MarginNote[]> {
    const q = $explorerState.searchQuery.toLowerCase();
    let notes = allVaultNotes;
    if (q)
      notes = notes.filter(
        (n) => n.text.toLowerCase().includes(q) || n.filePath.toLowerCase().includes(q)
      );
    const groups = new Map<string, MarginNote[]>();
    for (const n of notes) {
      const key = n.prefix?.label ?? 'Default';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(n);
    }
    return groups;
  }

  async function handleNoteClick(note: MarginNote) {
    try {
      const { getNote } = await import('@/services/vault/vault');
      const { openNoteTab } = await import('@/stores/editor/tabs');
      const fullNote = await getNote(note.filePath);
      openNoteTab(fullNote);
    } catch {
      /* fallback — file may not exist */
    }
  }

  onMount(async () => {
    try {
      const { get } = await import('svelte/store');
      const { activeNote } = await import('@/stores/vault/vault');
      const note = get(activeNote);
      if (note?.content) parseCurrentNote(note.content, note.path);
    } catch {
      /* no active note */
    }
  });

  function prefixColor(note: MarginNote): string {
    return note.prefix?.color ?? 'var(--text-muted)';
  }
</script>

<div class="marginalia-explorer" role="tabpanel" aria-label="Marginalia Explorer">
  <PanelHeader icon="quote" title="Marginalia" count={$noteCount || undefined}>
    <svelte:fragment slot="actions">
      <button
        class="icon-btn"
        class:active={$activeRecall}
        on:click={toggleActiveRecall}
        title="Toggle Active Recall"
      >
        <Icon name={$activeRecall ? 'eye-off' : 'eye'} size={14} />
      </button>
      <button class="icon-btn" on:click={scanVaultNotes} title="Scan vault">
        <Icon name="refresh-cw" size={14} />
      </button>
    </svelte:fragment>
  </PanelHeader>

  <div class="explorer-toolbar">
    <div class="tab-bar">
      {#each TABS as tab}
        <button
          class="tab-btn"
          class:active={$explorerState.tab === tab.id}
          on:click={() => setExplorerTab(tab.id)}
        >
          {tab.label}
          <span class="tab-count"
            >{tab.id === 'current' ? $currentNotes.length : allVaultNotes.length}</span
          >
        </button>
      {/each}
    </div>
    <input
      class="search-input"
      type="text"
      placeholder="Search notes..."
      value={$explorerState.searchQuery}
      on:input={(e) => setExplorerSearch(e.currentTarget.value)}
    />
  </div>

  <div class="explorer-list">
    {#each [...displayNotes.entries()] as [group, notes] (group)}
      <div class="note-group">
        <button class="group-header" on:click={() => toggleGroup(group)}>
          <Icon
            name={$explorerState.collapsed.has(group) ? 'chevron-right' : 'chevron-down'}
            size={12}
          />
          <span
            class="group-dot"
            style="background:{notes[0]?.prefix?.color ?? 'var(--text-muted)'}"
          ></span>
          <span class="group-label">{group}</span>
          <span class="group-count">{notes.length}</span>
        </button>

        {#if !$explorerState.collapsed.has(group)}
          <div class="group-items">
            {#each notes as note (note.id)}
              <button
                class="note-item"
                on:click={() => handleNoteClick(note)}
                title="Line {note.line} in {note.filePath}"
              >
                <span class="note-indicator" style="background:{prefixColor(note)}"></span>
                <span class="note-text" class:blur={$activeRecall && note.isBlur}>
                  {note.text}
                </span>
                {#if note.isImage}
                  <Icon name="image" size={10} />
                {/if}
                {#if note.isBlur}
                  <Icon name="eye-off" size={10} />
                {/if}
                <span class="note-direction">{note.direction === 'left' ? '\u25C0' : '\u25B6'}</span
                >
              </button>
            {/each}
          </div>
        {/if}
      </div>
    {:else}
      <div class="empty-state">
        <Icon name="quote" size={24} />
        <p>No margin notes found</p>
        <p class="hint">Add <code>%%&gt; text %%</code> to your notes</p>
      </div>
    {/each}
  </div>
</div>

<style>
  .marginalia-explorer {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }
  .explorer-toolbar {
    padding: var(--spacing-xs) var(--spacing-s);
    border-bottom: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }
  .tab-bar {
    display: flex;
    gap: 2px;
  }
  .tab-btn {
    flex: 1;
    padding: 3px 8px;
    border: none;
    border-radius: var(--radius-s);
    background: none;
    color: var(--text-muted);
    font-size: 11px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
  }
  .tab-btn.active {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
  }
  .tab-count {
    font-size: 9px;
    opacity: 0.7;
  }
  .search-input {
    width: 100%;
    padding: 4px 8px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    background: var(--background-primary);
    color: var(--text-normal);
    font-size: 11px;
  }
  .search-input:focus {
    border-color: var(--interactive-accent);
    outline: none;
  }
  .explorer-list {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-xs);
  }
  .note-group {
    margin-bottom: 2px;
  }
  .group-header {
    display: flex;
    align-items: center;
    gap: 4px;
    width: 100%;
    padding: 4px 6px;
    border: none;
    background: none;
    color: var(--text-muted);
    font-size: 11px;
    cursor: pointer;
    border-radius: var(--radius-s);
  }
  .group-header:hover {
    background: var(--background-modifier-hover);
  }
  .group-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .group-label {
    font-weight: 600;
    flex: 1;
    text-align: left;
  }
  .group-count {
    font-size: 9px;
    opacity: 0.6;
  }
  .group-items {
    padding-left: 16px;
  }
  .note-item {
    display: flex;
    align-items: center;
    gap: 4px;
    width: 100%;
    padding: 3px 6px;
    border: none;
    background: none;
    color: var(--text-normal);
    font-size: 11px;
    cursor: pointer;
    border-radius: var(--radius-s);
    text-align: left;
  }
  .note-item:hover {
    background: var(--background-modifier-hover);
  }
  .note-indicator {
    width: 3px;
    height: 14px;
    border-radius: 1px;
    flex-shrink: 0;
  }
  .note-text {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .note-text.blur {
    filter: blur(4px);
    transition: filter 0.2s;
  }
  .note-text.blur:hover {
    filter: none;
  }
  .note-direction {
    font-size: 8px;
    color: var(--text-faint);
  }
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-s);
    padding: var(--spacing-xl);
    color: var(--text-muted);
    text-align: center;
  }
  .hint {
    font-size: 11px;
  }
  .hint code {
    background: var(--background-secondary);
    padding: 1px 4px;
    border-radius: 2px;
    font-size: 10px;
  }
  .icon-btn.active {
    color: var(--interactive-accent);
  }
</style>
