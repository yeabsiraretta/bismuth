<script lang="ts">
  import './+page.css';
  import { getNotes } from '@/hubs/core/stores/vault-store.svelte';
  import { pageTitle, SITE_URL } from '@/constants/seo';
  import BIcon from '@/ui/b-icon.svelte';
  import { MetaTags } from 'svelte-meta-tags';

  type MediaType = 'all' | 'image' | 'audio' | 'video' | 'document';
  type ViewMode = 'grid' | 'list';

  interface MediaFile {
    name: string;
    path: string;
    ext: string;
    type: MediaType;
    folder: string;
    modifiedAt: number;
  }

  const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ico', 'tiff']);
  const AUDIO_EXTS = new Set(['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a']);
  const VIDEO_EXTS = new Set(['mp4', 'webm', 'mov', 'avi', 'mkv']);
  const DOC_EXTS = new Set(['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'csv']);

  function classifyExt(ext: string): MediaType {
    if (IMAGE_EXTS.has(ext)) return 'image';
    if (AUDIO_EXTS.has(ext)) return 'audio';
    if (VIDEO_EXTS.has(ext)) return 'video';
    if (DOC_EXTS.has(ext)) return 'document';
    return 'all';
  }

  function typeIconName(type: MediaType): string {
    if (type === 'image') return 'photo';
    if (type === 'audio') return 'musicalNote';
    if (type === 'video') return 'film';
    if (type === 'document') return 'document';
    return 'paperclip';
  }

  function openFile(path: string) {
    window.dispatchEvent(new CustomEvent('open-note', { detail: { path } }));
  }

  let filter = $state<MediaType>('all');
  let search = $state('');
  let viewMode = $state<ViewMode>('grid');
  let sortBy = $state<'name' | 'date'>('name');

  const ALL_MEDIA_EXTS = new Set([...IMAGE_EXTS, ...AUDIO_EXTS, ...VIDEO_EXTS, ...DOC_EXTS]);

  let allMedia = $derived(
    (() => {
      const notes = getNotes();
      const files: MediaFile[] = [];
      for (const note of notes) {
        const ext = note.path.split('.').pop()?.toLowerCase() ?? '';
        if (ALL_MEDIA_EXTS.has(ext)) {
          const name = note.path.split('/').pop() ?? note.path;
          const folder = note.path.split('/').slice(0, -1).join('/') || '/';
          files.push({
            name,
            path: note.path,
            ext,
            type: classifyExt(ext),
            folder,
            modifiedAt: note.modifiedAt,
          });
        }
      }
      return files;
    })()
  );

  let filtered = $derived(
    (() => {
      let items = filter === 'all' ? [...allMedia] : allMedia.filter((f) => f.type === filter);
      if (search) {
        const q = search.toLowerCase();
        items = items.filter(
          (f) => f.name.toLowerCase().includes(q) || f.folder.toLowerCase().includes(q)
        );
      }
      return [...items].sort((a, b) =>
        sortBy === 'date' ? b.modifiedAt - a.modifiedAt : a.name.localeCompare(b.name)
      );
    })()
  );

  let typeCounts = $derived(
    (() => {
      const counts: Record<string, number> = {
        all: allMedia.length,
        image: 0,
        audio: 0,
        video: 0,
        document: 0,
      };
      for (const f of allMedia) counts[f.type] = (counts[f.type] ?? 0) + 1;
      return counts;
    })()
  );

  const FILTERS: { id: MediaType; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'image', label: 'Images' },
    { id: 'audio', label: 'Audio' },
    { id: 'video', label: 'Video' },
    { id: 'document', label: 'Docs' },
  ];
</script>

<MetaTags
  title={pageTitle('Media')}
  description="Media management for images, audio, and attachments."
  canonical="{SITE_URL}/media"
  openGraph={{
    url: `${SITE_URL}/media`,
    title: pageTitle('Media'),
    description: 'Media management for images, audio, and attachments.',
  }}
/>

<div class="media-page">
  <header class="media-header">
    <h1 class="page-title">Media Library</h1>
    <div class="media-controls">
      <input
        type="text"
        class="media-search"
        placeholder="Search files..."
        bind:value={search}
        aria-label="Search media files"
      />
      <div class="view-toggle">
        <button
          class="view-btn"
          class:active={viewMode === 'grid'}
          onclick={() => (viewMode = 'grid')}
          title="Grid view">▦</button
        >
        <button
          class="view-btn"
          class:active={viewMode === 'list'}
          onclick={() => (viewMode = 'list')}
          title="List view">≡</button
        >
      </div>
      <select class="sort-select" bind:value={sortBy} aria-label="Sort by">
        <option value="name">Name</option>
        <option value="date">Recent</option>
      </select>
    </div>
  </header>

  <div class="filter-tabs">
    {#each FILTERS as f (f.id)}
      <button class="filter-tab" class:active={filter === f.id} onclick={() => (filter = f.id)}
        >{f.label} ({typeCounts[f.id] ?? 0})</button
      >
    {/each}
  </div>

  {#if filtered.length === 0}
    <div class="empty-state">
      <p>No media files found</p>
      <span class="empty-hint"
        >Images, audio, video, and documents in your vault will appear here</span
      >
    </div>
  {:else if viewMode === 'grid'}
    <div class="media-grid">
      {#each filtered as file (file.path)}
        <button class="media-card" onclick={() => openFile(file.path)}>
          <div class="media-thumb">
            {#if file.type === 'image'}
              <img
                class="media-preview"
                src={file.path}
                alt={file.name}
                loading="lazy"
                onerror={() => {}}
              />
            {/if}
            <BIcon name={typeIconName(file.type)} size={24} class="media-icon" />
          </div>
          <div class="media-info">
            <span class="media-name" title={file.path}>{file.name}</span>
            <span class="media-ext">{file.ext.toUpperCase()}</span>
          </div>
        </button>
      {/each}
    </div>
  {:else}
    <div class="media-list">
      {#each filtered as file (file.path)}
        <button class="media-row" onclick={() => openFile(file.path)}>
          <BIcon name={typeIconName(file.type)} size={14} class="row-icon" />
          <span class="row-name" title={file.path}>{file.name}</span>
          <span class="row-folder">{file.folder}</span>
          <span class="row-ext">{file.ext.toUpperCase()}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>
