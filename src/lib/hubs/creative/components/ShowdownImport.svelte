<script lang="ts">
  import { parseShowdownPaste } from '@/hubs/creative/services/showdownParser';
  import {
    getIsDataLoaded,
    getItemsDb,
    getMovesDb,
    getPokedex,
    loadPokemonData,
    loadTeam,
  } from '@/hubs/creative/stores/pokemonStore.svelte';

  let pasteText = $state('');
  let parseErrors: string[] = $state([]);
  let parseWarnings: string[] = $state([]);
  let parseSuccess = $state(false);

  function handleParse(): void {
    parseErrors = [];
    parseWarnings = [];
    parseSuccess = false;

    const pokedex = getPokedex();
    const movesDb = getMovesDb();
    const itemsDb = getItemsDb();

    if (!pokedex || !movesDb || !itemsDb) {
      parseErrors = ['Pokémon data not loaded yet. Please wait.'];
      return;
    }

    const result = parseShowdownPaste(pasteText, pokedex, movesDb, itemsDb);

    if ('error' in result) {
      parseErrors = [result.error];
      return;
    }

    if (result.warnings.length > 0) {
      parseWarnings = result.warnings;
    }

    loadTeam(result.team);
    parseSuccess = true;
  }

  $effect(() => {
    loadPokemonData();
  });
</script>

<div class="showdown-import">
  <h3 class="title">Import Showdown Paste</h3>

  <textarea
    class="paste-area"
    bind:value={pasteText}
    placeholder="Paste your Showdown team export here..."
    rows="10"
    aria-label="Showdown team paste"></textarea>

  <button
    class="parse-btn"
    type="button"
    onclick={handleParse}
    disabled={!getIsDataLoaded() || !pasteText.trim()}
    aria-label="Parse team"
  >
    {getIsDataLoaded() ? 'Parse Team' : 'Loading data...'}
  </button>

  {#if parseSuccess}
    <div class="success-msg" role="alert">Team imported successfully.</div>
  {/if}

  {#if parseErrors.length > 0}
    <div class="error-list" role="alert">
      <strong>Errors:</strong>
      <ul>
        {#each parseErrors as err (err)}
          <li>{err}</li>
        {/each}
      </ul>
    </div>
  {/if}

  {#if parseWarnings.length > 0}
    <div class="warning-list" role="status">
      <strong>Warnings ({parseWarnings.length}):</strong>
      <ul>
        {#each parseWarnings as w (w)}
          <li>{w}</li>
        {/each}
      </ul>
    </div>
  {/if}
</div>

<style>
  .showdown-import {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 8px;
  }
  .title {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text);
    margin: 0;
  }
  .paste-area {
    width: 100%;
    box-sizing: border-box;
    padding: 8px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-m);
    color: var(--color-text);
    font-family: monospace;
    font-size: 0.7rem;
    resize: vertical;
    min-height: 120px;
  }
  .paste-area:focus {
    outline: 2px solid var(--color-accent);
  }
  .parse-btn {
    padding: 6px 16px;
    background: var(--color-accent);
    color: var(--color-background);
    border: none;
    border-radius: var(--radius-s);
    font-size: 0.75rem;
    cursor: pointer;
    align-self: flex-start;
    min-height: 40px;
    min-width: 120px;
    font-family: inherit;
  }
  .parse-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .parse-btn:not(:disabled):hover {
    filter: brightness(1.1);
  }
  .success-msg {
    color: var(--color-success);
    font-size: 0.75rem;
    font-weight: 500;
  }
  .error-list {
    color: var(--color-error);
    font-size: 0.7rem;
    background: var(--color-surface);
    padding: 8px;
    border-radius: var(--radius-s);
    border: 1px solid var(--color-error);
  }
  .error-list ul,
  .warning-list ul {
    margin: 4px 0 0;
    padding-left: 16px;
  }
  .warning-list {
    color: var(--color-warning);
    font-size: 0.7rem;
    background: var(--color-surface);
    padding: 8px;
    border-radius: var(--radius-s);
    border: 1px solid var(--color-warning);
  }
</style>
