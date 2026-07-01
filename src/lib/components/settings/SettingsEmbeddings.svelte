<script lang="ts">
  import { onMount } from 'svelte';
  import EmptyState from '@/components/ui/feedback/EmptyState.svelte';
  import StatItem from '@/components/ui/layout/StatItem.svelte';
  import Button from '@/components/ui/actions/Button.svelte';
  import { currentVault } from '@/stores/vault/vault';
  import { showToast } from '@/stores/toast/toast';
  import { log } from '@/utils/logger';
  import {
    initializeEmbeddings,
    indexAllEmbeddings,
    getEmbeddingStats,
    type EmbeddingStats,
  } from '@/services/embeddings';

  let stats: EmbeddingStats | null = null;
  let isIndexing = false;
  let isInitializing = false;

  onMount(async () => {
    stats = await getEmbeddingStats();
  });

  async function handleInitialize() {
    const vault = $currentVault;
    if (!vault) return;
    isInitializing = true;
    try {
      await initializeEmbeddings(vault.root_path);
      stats = await getEmbeddingStats();
      showToast('Embeddings initialized', 'success');
    } catch (e) {
      log.error('Failed to initialize embeddings', e);
      showToast('Failed to initialize embeddings', 'error');
    } finally {
      isInitializing = false;
    }
  }

  async function handleIndexAll() {
    isIndexing = true;
    try {
      const count = await indexAllEmbeddings();
      stats = await getEmbeddingStats();
      showToast(`Indexed ${count} notes`, 'success');
    } catch (e) {
      log.error('Failed to index embeddings', e);
      showToast('Indexing failed', 'error');
    } finally {
      isIndexing = false;
    }
  }
</script>

<div class="settings-section stack stack-md">
  <h3>Embeddings</h3>
  <p class="setting-hint">Semantic search uses local vector embeddings to find similar notes.</p>

  {#if stats && stats.is_ready}
    <div class="setting-group">
      <h4>Index Status</h4>
      <div class="stats-grid">
        <StatItem label="Total embeddings" value="{stats.total_embeddings}" />
        <StatItem label="Status" value="Ready" />
      </div>
    </div>
  {:else}
    <EmptyState icon="cpu" title="Not initialized" description="Initialize to enable semantic search." />
  {/if}

  <div class="setting-group">
    <h4>Actions</h4>
    <div class="action-row">
      <Button variant="secondary" on:click={handleInitialize} loading={isInitializing} disabled={isInitializing}>
        Initialize Embeddings
      </Button>
      <Button variant="secondary" on:click={handleIndexAll} loading={isIndexing} disabled={isIndexing || !stats?.is_ready}>
        Re-index All Notes
      </Button>
    </div>
    <span class="setting-hint">Re-indexing processes all vault notes. This may take a few minutes.</span>
  </div>
</div>

<style>
  .stats-grid { display: flex; flex-direction: column; }
  .action-row { display: flex; gap: var(--spacing-s); flex-wrap: wrap; }
</style>
