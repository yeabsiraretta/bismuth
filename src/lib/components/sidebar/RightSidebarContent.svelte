<script lang="ts">
  import OutlinePanel from '@/components/sidebar/panels/OutlinePanel.svelte';
  import PropertiesPanel from '@/components/sidebar/panels/PropertiesPanel.svelte';
  import AsyncFeature from '@/components/ui/layout/AsyncLoader.svelte';
  import EmptyState from '@/components/ui/feedback/EmptyState.svelte';

  export let activeTab: string;
  /** Path of the currently open note — passed from App.svelte to avoid vault store import */
  export let activeNotePath: string | null = null;
</script>

{#if activeTab === 'outline'}
  <OutlinePanel />
{:else if activeTab === 'properties'}
  <PropertiesPanel />
{:else if activeTab === 'connections'}
  <AsyncFeature
    featureId="connections"
    loader={() => import('@/features/connections').then((m) => ({ default: m.ConnectionsView }))}
  />
{:else if activeTab === 'backlinks'}
  <AsyncFeature
    featureId="backlinks"
    loader={() => import('@/features/backlinks').then((m) => ({ default: m.BacklinksPanel }))}
  />
{:else if activeTab === 'outgoing'}
  {#if activeNotePath}
    <AsyncFeature
      featureId="backlinks"
      loader={() => import('@/features/backlinks').then((m) => ({ default: m.OutgoingLinks }))}
      props={{ noteId: activeNotePath }}
    />
  {:else}
    <EmptyState
      icon="external-link"
      title="No note open"
      description="Open a note to see outgoing links"
    />
  {/if}
{:else if activeTab === 'entity'}
  <AsyncFeature
    featureId="entity"
    loader={() => import('@/features/entity').then((m) => ({ default: m.EntityPanel }))}
  />
{:else if activeTab === 'git'}
  <AsyncFeature
    featureId="git"
    loader={() => import('@/features/git').then((m) => ({ default: m.GitPanel }))}
  />
{:else if activeTab === 'writing'}
  <AsyncFeature
    featureId="linting"
    loader={() => import('@/features/linting').then((m) => ({ default: m.WritingLintPanel }))}
  />
{:else if activeTab === 'calendar'}
  <AsyncFeature
    featureId="calendar"
    loader={() => import('@/features/calendar').then((m) => ({ default: m.CalendarPanel }))}
  />
{:else if activeTab === 'speed-reader'}
  <AsyncFeature
    featureId="speedreader"
    loader={() => import('@/features/speedreader').then((m) => ({ default: m.SpeedReaderPanel }))}
  />
{:else if activeTab === 'voice'}
  <AsyncFeature
    featureId="voice"
    loader={() => import('@/features/voice').then((m) => ({ default: m.VoicePanel }))}
  />
{:else if activeTab === 'publishing'}
  <AsyncFeature
    featureId="publishing"
    loader={() => import('@/features/publishing').then((m) => ({ default: m.PublishingPanel }))}
  />
{:else if activeTab === 'flashcards'}
  <AsyncFeature
    featureId="flashcards"
    loader={() => import('@/features/flashcards').then((m) => ({ default: m.FlashcardPanel }))}
  />
{:else if activeTab === 'wikilink'}
  <AsyncFeature
    featureId="wikilink"
    loader={() => import('@/features/wikilink').then((m) => ({ default: m.AutoLinker }))}
  />
{:else if activeTab === 'versioning'}
  <AsyncFeature
    featureId="versioning"
    loader={() => import('@/features/versioning').then((m) => ({ default: m.VersioningPanel }))}
  />
{:else if activeTab === 'dataview'}
  <AsyncFeature
    featureId="dataview"
    loader={() =>
      import('@/features/dataview/components/DataviewPanel.svelte').then((m) => ({
        default: m.default,
      }))}
  />
{/if}
