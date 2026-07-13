<script lang="ts">
  import { pageTitle, SITE_URL } from '@/constants/seo';
  import Breadcrumbs from '@/hubs/editor/components/Breadcrumbs.svelte';
  import NoteEditor from '@/hubs/editor/components/NoteEditor.svelte';
  import { MetaTags } from 'svelte-meta-tags';
  import { onMount } from 'svelte';

  let { data } = $props();

  onMount(() => {
    if (data.note) {
      window.dispatchEvent(new CustomEvent('open-note', { detail: { path: data.note } }));
    }
  });
</script>

<MetaTags
  title={pageTitle(data.title ?? 'Editor')}
  description={data.description ?? 'Write and edit your notes with a powerful markdown editor.'}
  canonical="{SITE_URL}/editor"
  openGraph={{
    url: `${SITE_URL}/editor`,
    title: pageTitle(data.title ?? 'Editor'),
    description: data.description ?? '',
  }}
/>

<div class="editor-page">
  <Breadcrumbs />
  <div class="editor-body">
    <NoteEditor />
  </div>
</div>

<style>
  .editor-page {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .editor-body {
    flex: 1;
    min-height: 0;
  }
</style>
