<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  export let files: Array<{ name: string; path: string }> = [];
  export let currentFile: string | null = null;
  
  function selectFile(path: string) {
    dispatch('select', { path });
  }
  
  function createNewNote() {
    dispatch('create');
  }
</script>

<aside class="sidebar">
  <div class="sidebar-header">
    <h2>📁 Files</h2>
    <button class="btn-new" on:click={createNewNote} title="New Note (Cmd+N)">
      +
    </button>
  </div>
  
  <div class="file-list">
    {#if files.length === 0}
      <div class="empty-state">
        <p>No notes yet</p>
        <p class="hint">Click + to create your first note</p>
      </div>
    {:else}
      {#each files as file}
        <button
          class="file-item"
          class:active={currentFile === file.path}
          on:click={() => selectFile(file.path)}
        >
          📄 {file.name}
        </button>
      {/each}
    {/if}
  </div>
</aside>

<style>
  .sidebar {
    width: 250px;
    background: #1e1e1e;
    border-right: 1px solid #333;
    display: flex;
    flex-direction: column;
    height: 100vh;
  }
  
  .sidebar-header {
    padding: 1rem;
    border-bottom: 1px solid #333;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .sidebar-header h2 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
  }
  
  .btn-new {
    width: 32px;
    height: 32px;
    border-radius: 4px;
    border: 1px solid #444;
    background: #2a2a2a;
    color: #fff;
    font-size: 1.5rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }
  
  .btn-new:hover {
    background: #3a3a3a;
    border-color: #646cff;
  }
  
  .file-list {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem;
  }
  
  .file-item {
    width: 100%;
    padding: 0.75rem 1rem;
    text-align: left;
    background: transparent;
    border: none;
    border-radius: 4px;
    color: #ccc;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.9rem;
    margin-bottom: 0.25rem;
  }
  
  .file-item:hover {
    background: #2a2a2a;
    color: #fff;
  }
  
  .file-item.active {
    background: #646cff;
    color: #fff;
  }
  
  .empty-state {
    padding: 2rem 1rem;
    text-align: center;
    color: #666;
  }
  
  .empty-state p {
    margin: 0.5rem 0;
  }
  
  .hint {
    font-size: 0.85rem;
    color: #555;
  }
</style>
