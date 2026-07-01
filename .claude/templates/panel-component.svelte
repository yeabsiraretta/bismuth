<script lang="ts">
  import PanelHeader from '@/components/ui/layout/PanelHeader.svelte';
  import EmptyState from '@/components/ui/feedback/EmptyState.svelte';
  import Spinner from '@/components/ui/feedback/Spinner.svelte';

  /** Panel title shown in the header */
  export let title: string = 'Panel';
  /** Optional icon name from the icon set */
  export let icon: string = '';
  /** Shows spinner when true */
  export let loading: boolean = false;
</script>

<div class="panel" role="tabpanel" aria-label={title}>
  <PanelHeader {title} {icon}>
    <svelte:fragment slot="actions">
      <!-- Add action buttons here -->
    </svelte:fragment>
  </PanelHeader>

  <div class="panel-body">
    {#if loading}
      <div class="panel-loading">
        <Spinner size="md" label="Loading..." />
      </div>
    {:else}
      <!-- Replace with actual panel content -->
      <EmptyState icon="inbox" title="Nothing here" description="Content will appear here." />
    {/if}
  </div>
</div>

<style>
  .panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .panel-body {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-s);
  }

  .panel-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }
</style>
