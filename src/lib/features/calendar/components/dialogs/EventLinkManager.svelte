<script lang="ts">
  export let linkedNotePaths: string[] = [];
  export let onChange: ((paths: string[]) => void) | undefined = undefined;

  let newLinkPath = '';

  function addLink(): void {
    const trimmed = newLinkPath.trim();
    if (!trimmed) return;
    onChange?.([...linkedNotePaths, trimmed]);
    newLinkPath = '';
  }

  function removeLink(idx: number): void {
    onChange?.(linkedNotePaths.filter((_, i) => i !== idx));
  }

  function handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter') {
      e.preventDefault();
      addLink();
    }
  }
</script>

<div class="links-section">
  <span class="section-label">Linked notes</span>
  <ul class="links-list" role="list" aria-label="Linked notes">
    {#each linkedNotePaths as path, idx}
      <li class="link-row">
        <span class="link-path">{path}</span>
        <button
          type="button"
          class="link-remove"
          aria-label="Remove link {path}"
          on:click={() => removeLink(idx)}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </li>
    {/each}
  </ul>
  {#if linkedNotePaths.length === 0}
    <p class="empty-links bismuth-body-sm">No linked notes</p>
  {/if}
  <div class="link-add-row">
    <input
      type="text"
      class="input-field link-input"
      placeholder="Note path (e.g. folder/note.md)"
      bind:value={newLinkPath}
      on:keydown={handleKeydown}
      aria-label="Note path to link"
    />
    <button type="button" class="link-add-btn" disabled={!newLinkPath.trim()} on:click={addLink}
      >Add link</button
    >
  </div>
</div>

<style>
  .links-section {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 10px 0 4px;
    border-top: 1px solid var(--border-color);
  }
  .section-label {
    font-size: 0.72rem;
    color: var(--text-muted);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .links-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .link-row {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 6px;
    background: var(--background-secondary);
    border-radius: var(--radius-s);
    font-size: 0.78rem;
  }
  .link-path {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--text-normal);
  }
  .link-remove {
    display: flex;
    align-items: center;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-muted);
    padding: 2px;
    min-width: 40px;
    min-height: 40px;
    justify-content: center;
  }
  .link-remove:hover {
    color: var(--text-error, #dc2626);
  }
  .empty-links {
    color: var(--text-muted);
    margin: 0;
  }
  .link-add-row {
    display: flex;
    gap: 6px;
  }
  .input-field {
    padding: 6px 10px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    background: var(--background-secondary);
    color: var(--text-normal);
    font-size: 0.8rem;
  }
  .link-input {
    flex: 1;
    font-size: 0.78rem;
  }
  .link-add-btn {
    padding: 5px 10px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    background: var(--background-primary);
    color: var(--text-muted);
    cursor: pointer;
    font-size: 0.78rem;
    white-space: nowrap;
  }
  .link-add-btn:hover:not(:disabled) {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    border-color: var(--interactive-accent);
  }
  .link-add-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
</style>
