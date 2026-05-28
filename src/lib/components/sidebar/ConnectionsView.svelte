<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  
  interface Connection {
    path: string;
    title: string;
    score: number;
  }
  
  // Mock data - will be replaced with actual semantic connections
  let connections: Connection[] = [];
  let isLoading = false;
  let isPaused = false;
  
  function openNote(path: string) {
    console.log('Opening note:', path);
    // TODO: Implement note navigation
  }
  
  function togglePause() {
    isPaused = !isPaused;
  }
  
  function refreshConnections() {
    isLoading = true;
    // TODO: Implement semantic search
    setTimeout(() => {
      isLoading = false;
    }, 1000);
  }
</script>

<div class="connections-view">
  <div class="panel-header">
    <Icon name="share-2" size={16} />
    <h3>Connections</h3>
    <div class="header-actions">
      <button 
        class="icon-btn" 
        class:active={isPaused}
        on:click={togglePause}
        title={isPaused ? 'Resume' : 'Pause'}
      >
        <Icon name={isPaused ? 'play' : 'pause'} size={14} />
      </button>
      <button 
        class="icon-btn" 
        on:click={refreshConnections}
        title="Refresh"
      >
        <Icon name="refresh-cw" size={14} />
      </button>
    </div>
  </div>
  
  {#if isLoading}
    <div class="loading-state">
      <Icon name="loader" size={24} />
      <p>Finding connections...</p>
    </div>
  {:else if connections.length === 0}
    <div class="empty-state">
      <Icon name="share-2" size={32} />
      <p>No connections found</p>
      <span class="hint">Semantically related notes will appear here</span>
    </div>
  {:else}
    <div class="connections-list">
      {#each connections as connection}
        <button 
          class="connection-item"
          on:click={() => openNote(connection.path)}
        >
          <div class="connection-header">
            <Icon name="file-text" size={14} />
            <span class="connection-title">{connection.title}</span>
          </div>
          <div class="connection-score">
            <div class="score-bar" style:width="{connection.score * 100}%"></div>
            <span class="score-text">{Math.round(connection.score * 100)}%</span>
          </div>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .connections-view {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 12px;
  }
  
  .panel-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
  }
  
  .panel-header h3 {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-normal);
    margin: 0;
    flex: 1;
  }
  
  .header-actions {
    display: flex;
    gap: 4px;
  }
  
  .icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: none;
    border: none;
    border-radius: var(--radius-s);
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .icon-btn:hover {
    background-color: var(--interactive-hover);
    color: var(--text-normal);
  }
  
  .icon-btn.active {
    background-color: var(--interactive-accent);
    color: var(--text-on-accent);
  }
  
  .loading-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    gap: 12px;
    color: var(--text-muted);
    text-align: center;
    padding: 32px 16px;
  }
  
  .loading-state p,
  .empty-state p {
    font-size: 14px;
    font-weight: 500;
    margin: 0;
  }
  
  .hint {
    font-size: 12px;
    color: var(--text-faint);
  }
  
  .connections-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .connection-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px;
    background: none;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: left;
  }
  
  .connection-item:hover {
    background-color: var(--interactive-hover);
    border-color: var(--interactive-accent);
  }
  
  .connection-header {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  
  .connection-title {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-normal);
  }
  
  .connection-score {
    position: relative;
    height: 4px;
    background-color: var(--background-secondary);
    border-radius: 2px;
    overflow: hidden;
  }
  
  .score-bar {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background-color: var(--interactive-accent);
    transition: width 0.3s ease;
  }
  
  .score-text {
    position: absolute;
    top: -18px;
    right: 0;
    font-size: 10px;
    color: var(--text-faint);
  }
</style>
