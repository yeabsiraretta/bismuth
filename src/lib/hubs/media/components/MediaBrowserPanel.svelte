<script lang="ts">
  import { getNotes } from '@/hubs/core/stores/vault-store.svelte';
  import BIcon from '@/ui/b-icon.svelte';
  import { fileName, openNote } from '@/ui/panel-actions';
  import Panel from '@/ui/panel.svelte';
  import { goto } from '$app/navigation';

  const IMAGE_EXT = /\.(png|jpe?g|gif|bmp|webp|svg|ico|avif)$/i;
  const AUDIO_EXT = /\.(mp3|wav|ogg|flac|m4a|aac)$/i;
  const VIDEO_EXT = /\.(mp4|webm|mov|avi|mkv)$/i;
  const PDF_EXT = /\.pdf$/i;

  type MediaType = 'image' | 'audio' | 'video' | 'pdf' | 'all';
  type ViewMode = 'list' | 'grid';

  let search = $state('');
  let filter = $state<MediaType>('all');
  let viewMode = $state<ViewMode>('list');

  function getMediaType(path: string): MediaType | null {
    if (IMAGE_EXT.test(path)) return 'image';
    if (AUDIO_EXT.test(path)) return 'audio';
    if (VIDEO_EXT.test(path)) return 'video';
    if (PDF_EXT.test(path)) return 'pdf';
    return null;
  }

  let allMedia = $derived(
    getNotes()
      .map((n) => ({ path: n.path, title: n.title, type: getMediaType(n.path) }))
      .filter((m): m is { path: string; title: string; type: MediaType } => m.type !== null)
  );

  let filtered = $derived(
    allMedia
      .filter((m) => filter === 'all' || m.type === filter)
      .filter((m) => !search || m.title.toLowerCase().includes(search.toLowerCase()))
  );

  function openFile(path: string) {
    openNote(path);
  }

  function iconFor(type: MediaType): string {
    if (type === 'image') return 'image';
    if (type === 'audio') return 'music';
    if (type === 'video') return 'video';
    return 'fileText';
  }

  const FILTERS: { label: string; value: MediaType }[] = [
    { label: 'All', value: 'all' },
    { label: 'Images', value: 'image' },
    { label: 'Audio', value: 'audio' },
    { label: 'Video', value: 'video' },
    { label: 'PDF', value: 'pdf' },
  ];
</script>

<Panel title="Media">
  {#snippet badge()}<span class="panel-badge">{filtered.length}</span>{/snippet}
  {#snippet actions()}
    <button
      class="panel-action"
      onclick={() => {
        viewMode = viewMode === 'list' ? 'grid' : 'list';
      }}
      title={viewMode === 'list' ? 'Grid view' : 'List view'}
    >
      <BIcon name={viewMode === 'list' ? 'grid' : 'list'} size={14} />
    </button>
    <button class="panel-action" onclick={() => goto('/media')} title="Open Media">
      <BIcon name="externalLink" size={14} />
    </button>
  {/snippet}
  <input type="text" bind:value={search} placeholder="Search media…" class="mb-search" />
  <div class="mb-filters">
    {#each FILTERS as f (f.value)}
      <button
        class="mb-filter"
        class:mb-active={filter === f.value}
        onclick={() => {
          filter = f.value;
        }}>{f.label}</button
      >
    {/each}
  </div>
  {#if filtered.length === 0}
    <p class="panel-empty">No media files found.</p>
  {:else if viewMode === 'grid'}
    <div class="mb-grid">
      {#each filtered as item (item.path)}
        <button class="mb-card" onclick={() => openFile(item.path)} title={fileName(item.path)}>
          <div class="mb-thumb">
            <BIcon name={iconFor(item.type)} size={20} />
          </div>
          <span class="mb-card-name">{fileName(item.path)}</span>
        </button>
      {/each}
    </div>
  {:else}
    <ul class="mb-list">
      {#each filtered as item (item.path)}
        <li class="mb-item">
          <button class="mb-btn" onclick={() => openFile(item.path)}>
            <BIcon name={iconFor(item.type)} size={14} />
            <span class="mb-name">{item.title}</span>
            <span class="mb-type">{item.type}</span>
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</Panel>

<style>
  .mb-search {
    width: 100%;
    padding: 5px 8px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-background);
    color: var(--color-text);
    font-size: 0.75rem;
    outline: none;
    margin-bottom: 6px;
  }
  .mb-search:focus {
    border-color: var(--color-accent);
  }
  .mb-filters {
    display: flex;
    gap: 2px;
    margin-bottom: 6px;
    flex-wrap: wrap;
  }
  .mb-filter {
    padding: 2px 8px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--color-text-muted);
    font-size: 0.65rem;
    cursor: pointer;
  }
  .mb-active {
    background: var(--color-accent);
    color: var(--color-background);
    border-color: var(--color-accent);
  }
  .mb-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .mb-item {
    border-bottom: 1px solid var(--color-border);
  }
  .mb-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 5px 4px;
    border: none;
    background: transparent;
    color: var(--color-text);
    cursor: pointer;
    font-size: 0.73rem;
    text-align: left;
  }
  .mb-btn:hover {
    background: var(--color-surface-hover);
  }
  .mb-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .mb-type {
    font-size: 0.6rem;
    color: var(--color-text-subtle);
    text-transform: uppercase;
  }
  .mb-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
    gap: 4px;
  }
  .mb-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 6px 2px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-surface);
    cursor: pointer;
  }
  .mb-card:hover {
    border-color: var(--color-accent);
    background: var(--color-surface-hover);
  }
  .mb-thumb {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-background);
    border-radius: var(--radius-s);
    color: var(--color-text-subtle);
    margin-bottom: 2px;
  }
  .mb-card-name {
    font-size: 0.58rem;
    color: var(--color-text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
  }
</style>
