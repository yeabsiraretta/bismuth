<script lang="ts">
  export let files: Array<{ name: string; path: string }> = [];
  export let currentFile: string | null = null;
  export let onSelect: ((detail: { path: string }) => void) | undefined = undefined;
  export let onCreate: (() => void) | undefined = undefined;

  function selectFile(path: string) {
    onSelect?.({ path });
  }

  function createNewNote() {
    onCreate?.();
  }
</script>

<aside class="sidebar">
  <div class="sidebar-header">
    <h2>📁 Files</h2>
    <button class="btn-new" on:click={createNewNote} title="New Note (Cmd+N)"> + </button>
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
          title={file.name}
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
    background: var(--background-secondary);
    border-right: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .sidebar-header {
    padding: var(--spacing-m);
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .sidebar-header h2 {
    margin: 0;
    font-size: var(--font-ui-medium);
    font-weight: var(--font-semibold);
  }

  .btn-new {
    width: 32px;
    height: 32px;
    border-radius: var(--radius-s);
    border: 1px solid var(--border-hover);
    background: var(--background-secondary-alt);
    color: var(--text-on-accent);
    font-size: var(--font-size-xl);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--transition-fast);
  }

  .btn-new:hover {
    background: var(--interactive-hover);
    border-color: var(--interactive-accent);
  }

  .file-list {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-s);
  }

  .file-item {
    width: 100%;
    padding: var(--spacing-s) var(--spacing-m);
    text-align: left;
    background: transparent;
    border: none;
    border-radius: var(--radius-s);
    color: var(--text-muted);
    cursor: pointer;
    transition: all var(--transition-fast);
    font-size: var(--font-ui-small);
    margin-bottom: var(--spacing-xs);
  }

  .file-item:hover {
    background: var(--background-modifier-hover);
    color: var(--text-normal);
  }

  .file-item.active {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
  }

  .empty-state {
    padding: var(--spacing-xl) var(--spacing-m);
    text-align: center;
    color: var(--text-faint);
  }

  .empty-state p {
    margin: var(--spacing-s) 0;
  }

  .hint {
    font-size: var(--font-smallest);
    color: var(--text-faint);
  }
</style>
