<script lang="ts">
  import { log } from '@/utils/logger';
  import { isDataLoaded, loadPokemonData, getPokedex, getMovesDb, getItemsDb, loadTeam } from '../stores/pokemonStore';
  import { parseShowdownPaste } from '../services/showdownParser';
  import { onMount } from 'svelte';

  let pasteText = '';
  let parseErrors: string[] = [];
  let parseWarnings: string[] = [];
  let parseSuccess = false;

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
      log.warn('Showdown parse failed', { error: result.error });
      return;
    }

    if (result.warnings.length > 0) {
      parseWarnings = result.warnings;
    }

    loadTeam(result.team);
    parseSuccess = true;
    log.info('Showdown team imported', { warnings: result.warnings.length });
  }

  onMount(async () => { await loadPokemonData(); });
</script>

<div class="showdown-import">
  <h3 class="title">Import Showdown Paste</h3>

  <textarea
    class="paste-area"
    bind:value={pasteText}
    placeholder="Paste your Showdown team export here..."
    rows="10"
    aria-label="Showdown team paste"
  ></textarea>

  <button
    class="parse-btn"
    on:click={handleParse}
    disabled={!$isDataLoaded || !pasteText.trim()}
    aria-label="Parse team"
  >
    {$isDataLoaded ? 'Parse Team' : 'Loading data...'}
  </button>

  {#if parseSuccess}
    <div class="success-msg" role="alert">Team imported successfully.</div>
  {/if}

  {#if parseErrors.length > 0}
    <div class="error-list" role="alert">
      <strong>Errors:</strong>
      <ul>
        {#each parseErrors as err}
          <li>{err}</li>
        {/each}
      </ul>
    </div>
  {/if}

  {#if parseWarnings.length > 0}
    <div class="warning-list" role="status">
      <strong>Warnings ({parseWarnings.length}):</strong>
      <ul>
        {#each parseWarnings as w}
          <li>{w}</li>
        {/each}
      </ul>
    </div>
  {/if}
</div>

<style>
  .showdown-import { display: flex; flex-direction: column; gap: var(--spacing-s); padding: var(--spacing-s); }
  .title { font-size: var(--font-ui-small); font-weight: 600; color: var(--text-normal); margin: 0; }
  .paste-area { width: 100%; box-sizing: border-box; padding: var(--spacing-s); background: var(--background-secondary); border: 1px solid var(--background-modifier-border); border-radius: var(--radius-m); color: var(--text-normal); font-family: var(--font-monospace); font-size: var(--font-ui-smaller); resize: vertical; min-height: 120px; }
  .paste-area:focus { outline: 2px solid var(--interactive-accent); }
  .parse-btn { padding: 6px 16px; background: var(--interactive-accent); color: var(--text-on-accent); border: none; border-radius: var(--radius-s); font-size: var(--font-ui-small); cursor: pointer; align-self: flex-start; min-height: 40px; min-width: 120px; }
  .parse-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .parse-btn:not(:disabled):hover { background: var(--interactive-accent-hover); }
  .success-msg { color: #22c55e; font-size: var(--font-ui-small); font-weight: 500; }
  .error-list { color: var(--text-error); font-size: var(--font-ui-smaller); background: var(--background-secondary); padding: var(--spacing-s); border-radius: var(--radius-s); border: 1px solid var(--text-error); }
  .error-list ul, .warning-list ul { margin: 4px 0 0; padding-left: var(--spacing-m); }
  .warning-list { color: var(--text-warning, #f59e0b); font-size: var(--font-ui-smaller); background: var(--background-secondary); padding: var(--spacing-s); border-radius: var(--radius-s); border: 1px solid var(--text-warning, #f59e0b); }
</style>
