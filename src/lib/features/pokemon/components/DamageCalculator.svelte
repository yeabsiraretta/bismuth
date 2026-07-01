<script lang="ts">
  import { log } from '@/utils/logger';
  import {
    isDataLoaded, dataLoadError, loadPokemonData,
    calcResult,
    getPokedex, getMovesDb,
    setCalcAttacker, setCalcDefender, setCalcMove,
  } from '../stores/pokemonStore';
  import type { TeamSlot, PokemonSpecies, Move, Nature } from '../types/pokemon';
  import { defaultEvs, defaultIvs } from '../services/damageCalc';
  import { onMount } from 'svelte';

  const NATURES: Nature[] = [
    'Hardy','Lonely','Brave','Adamant','Naughty','Bold','Docile','Relaxed',
    'Impish','Lax','Timid','Hasty','Serious','Jolly','Naive','Modest','Mild',
    'Quiet','Bashful','Rash','Calm','Gentle','Sassy','Careful','Quirky',
  ];

  let attackerQuery = '';
  let defenderQuery = '';
  let moveQuery = '';

  let attackerSlot: TeamSlot = {
    species: null, item: null, ability: '', nature: 'Jolly',
    evs: defaultEvs(), ivs: defaultIvs(), moves: [null, null, null, null], level: 50,
  };
  let defenderSlot: TeamSlot = {
    species: null, item: null, ability: '', nature: 'Bold',
    evs: defaultEvs(), ivs: defaultIvs(), moves: [null, null, null, null], level: 50,
  };

  $: filteredPokemon = $isDataLoaded
    ? Object.values(getPokedex() ?? {}).filter((p) =>
        p.name.toLowerCase().includes(attackerQuery.toLowerCase()) ||
        p.id.includes(attackerQuery.toLowerCase())
      ).slice(0, 7)
    : [];

  $: filteredDefenders = $isDataLoaded
    ? Object.values(getPokedex() ?? {}).filter((p) =>
        p.name.toLowerCase().includes(defenderQuery.toLowerCase())
      ).slice(0, 7)
    : [];

  $: filteredMoves = $isDataLoaded
    ? Object.values(getMovesDb() ?? {}).filter((m) =>
        m.name.toLowerCase().includes(moveQuery.toLowerCase()) && m.power !== null
      ).slice(0, 7)
    : [];

  function selectAttacker(species: PokemonSpecies): void {
    attackerSlot = { ...attackerSlot, species };
    attackerQuery = species.name;
    filteredPokemon = [];
    setCalcAttacker(attackerSlot);
    log.debug('Attacker selected', { species: species.id });
  }

  function selectDefender(species: PokemonSpecies): void {
    defenderSlot = { ...defenderSlot, species };
    defenderQuery = species.name;
    filteredDefenders = [];
    setCalcDefender(defenderSlot);
  }

  function selectMove(move: Move): void {
    moveQuery = move.name;
    filteredMoves = [];
    setCalcMove(move);
  }

  function onAttackerChange(): void { setCalcAttacker({ ...attackerSlot }); }
  function onDefenderChange(): void { setCalcDefender({ ...defenderSlot }); }

  onMount(async () => { await loadPokemonData(); });
</script>

<div class="calc-root">
  {#if $dataLoadError}
    <p class="error-msg">{$dataLoadError}</p>
  {:else if !$isDataLoaded}
    <p class="loading-msg">Loading Pokémon data...</p>
  {:else}
    <div class="panels">
      <!-- Attacker panel -->
      <section class="panel" aria-label="Attacker">
        <h3 class="panel-title">Attacker</h3>
        <div class="autocomplete">
          <input class="input" bind:value={attackerQuery} placeholder="Search species..." aria-label="Attacker species" />
          {#if filteredPokemon.length > 0 && attackerQuery}
            <ul class="dropdown" role="listbox">
              {#each filteredPokemon as p}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <li role="option" aria-selected="false" class="dropdown-item" on:click={() => selectAttacker(p)}>{p.name}</li>
              {/each}
            </ul>
          {/if}
        </div>
        <div class="row">
          <label class="field"><span>Nature</span>
            <select bind:value={attackerSlot.nature} on:change={onAttackerChange} aria-label="Nature">
              {#each NATURES as n}<option value={n}>{n}</option>{/each}
            </select>
          </label>
          <label class="field"><span>Atk EVs</span>
            <input type="number" min="0" max="252" bind:value={attackerSlot.evs.atk} on:change={onAttackerChange} aria-label="Attack EVs" class="input-sm" />
          </label>
          <label class="field"><span>SpA EVs</span>
            <input type="number" min="0" max="252" bind:value={attackerSlot.evs.spa} on:change={onAttackerChange} aria-label="Special Attack EVs" class="input-sm" />
          </label>
        </div>
      </section>

      <!-- Defender panel -->
      <section class="panel" aria-label="Defender">
        <h3 class="panel-title">Defender</h3>
        <div class="autocomplete">
          <input class="input" bind:value={defenderQuery} placeholder="Search species..." aria-label="Defender species" />
          {#if filteredDefenders.length > 0 && defenderQuery}
            <ul class="dropdown" role="listbox">
              {#each filteredDefenders as p}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <li role="option" aria-selected="false" class="dropdown-item" on:click={() => selectDefender(p)}>{p.name}</li>
              {/each}
            </ul>
          {/if}
        </div>
        <div class="row">
          <label class="field"><span>Nature</span>
            <select bind:value={defenderSlot.nature} on:change={onDefenderChange} aria-label="Defender nature">
              {#each NATURES as n}<option value={n}>{n}</option>{/each}
            </select>
          </label>
          <label class="field"><span>Def EVs</span>
            <input type="number" min="0" max="252" bind:value={defenderSlot.evs.def} on:change={onDefenderChange} aria-label="Defense EVs" class="input-sm" />
          </label>
          <label class="field"><span>HP EVs</span>
            <input type="number" min="0" max="252" bind:value={defenderSlot.evs.hp} on:change={onDefenderChange} aria-label="HP EVs" class="input-sm" />
          </label>
        </div>
      </section>
    </div>

    <!-- Move selector -->
    <div class="move-row autocomplete">
      <label class="field full-width"><span>Move</span>
        <input class="input" bind:value={moveQuery} placeholder="Search move..." aria-label="Move selector" />
      </label>
      {#if filteredMoves.length > 0 && moveQuery}
        <ul class="dropdown" role="listbox">
          {#each filteredMoves as m}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <li role="option" aria-selected="false" class="dropdown-item" on:click={() => selectMove(m)}>
              {m.name} <span class="move-meta">({m.type} | {m.power}BP)</span>
            </li>
          {/each}
        </ul>
      {/if}
    </div>

    <!-- Result bar -->
    {#if $calcResult}
      <div class="result-bar" role="region" aria-label="Damage result">
        {#if $calcResult.effectiveness === 0}
          <span class="result-immune">No effect!</span>
        {:else}
          <span class="result-range">
            {$calcResult.min}–{$calcResult.max}
            ({$calcResult.percentages[0]}%–{$calcResult.percentages[15]}%)
          </span>
          {#if $calcResult.ohkoChance > 0}
            <span class="ohko-badge">
              {($calcResult.ohkoChance * 100).toFixed(0)}% OHKO
            </span>
          {/if}
          {#if $calcResult.effectiveness > 1}
            <span class="eff-badge super">Super effective!</span>
          {:else if $calcResult.effectiveness < 1}
            <span class="eff-badge resist">Not very effective</span>
          {/if}
        {/if}
      </div>
    {:else}
      <div class="result-placeholder">Select attacker, defender, and move to calculate damage.</div>
    {/if}
  {/if}
</div>

<style>
  .calc-root { display: flex; flex-direction: column; gap: var(--spacing-s); padding: var(--spacing-s); }
  .panels { display: flex; gap: var(--spacing-s); flex-wrap: wrap; }
  .panel { flex: 1; min-width: 140px; background: var(--background-secondary); border-radius: var(--radius-m); padding: var(--spacing-s); display: flex; flex-direction: column; gap: var(--spacing-xs); }
  .panel-title { font-size: var(--font-ui-small); font-weight: 600; color: var(--text-normal); margin: 0; }
  .row { display: flex; gap: var(--spacing-xs); flex-wrap: wrap; }
  .field { display: flex; flex-direction: column; gap: 2px; font-size: var(--font-ui-smaller); color: var(--text-muted); }
  .field span { font-size: 10px; }
  .input { padding: 4px 6px; border: 1px solid var(--background-modifier-border); border-radius: var(--radius-s); background: var(--background-primary); color: var(--text-normal); font-size: var(--font-ui-smaller); width: 100%; box-sizing: border-box; }
  .input-sm { width: 56px; padding: 3px 4px; border: 1px solid var(--background-modifier-border); border-radius: var(--radius-s); background: var(--background-primary); color: var(--text-normal); font-size: var(--font-ui-smaller); }
  select { padding: 3px 4px; border: 1px solid var(--background-modifier-border); border-radius: var(--radius-s); background: var(--background-primary); color: var(--text-normal); font-size: var(--font-ui-smaller); }
  .autocomplete { position: relative; }
  .dropdown { position: absolute; top: 100%; left: 0; right: 0; z-index: 10; background: var(--background-primary); border: 1px solid var(--background-modifier-border); border-radius: var(--radius-s); list-style: none; margin: 2px 0 0; padding: 0; max-height: 180px; overflow-y: auto; }
  .dropdown-item { padding: 5px 8px; cursor: pointer; font-size: var(--font-ui-smaller); color: var(--text-normal); }
  .dropdown-item:hover { background: var(--background-modifier-hover); }
  .move-row { margin-top: var(--spacing-xs); }
  .full-width { width: 100%; }
  .move-meta { color: var(--text-muted); font-size: 10px; }
  .result-bar { background: var(--background-secondary); border-radius: var(--radius-m); padding: var(--spacing-s); display: flex; align-items: center; gap: var(--spacing-s); flex-wrap: wrap; }
  .result-range { font-size: var(--font-ui-medium); font-weight: 600; color: var(--text-normal); }
  .result-immune { font-size: var(--font-ui-small); color: var(--text-muted); font-style: italic; }
  .ohko-badge { background: #ef4444; color: #fff; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; }
  .eff-badge { font-size: var(--font-ui-smaller); font-weight: 600; }
  .eff-badge.super { color: #22c55e; }
  .eff-badge.resist { color: #f59e0b; }
  .result-placeholder { font-size: var(--font-ui-smaller); color: var(--text-muted); text-align: center; padding: var(--spacing-s); }
  .error-msg { color: var(--text-error); font-size: var(--font-ui-small); }
  .loading-msg { color: var(--text-muted); font-size: var(--font-ui-small); text-align: center; padding: var(--spacing-l); }
</style>
