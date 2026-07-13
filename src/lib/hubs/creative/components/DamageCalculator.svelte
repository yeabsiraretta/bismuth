<script lang="ts">
  import { defaultEvs, defaultIvs } from '@/hubs/creative/services/damageCalc';
  import {
    getCalcResult,
    getDataLoadError,
    getIsDataLoaded,
    getMovesDb,
    getPokedex,
    loadPokemonData,
    setCalcAttacker,
    setCalcDefender,
    setCalcMove,
  } from '@/hubs/creative/stores/pokemonStore.svelte';
  import type { Move, Nature, PokemonSpecies, TeamSlot } from '@/hubs/creative/types/pokemon';

  const NATURES: Nature[] = [
    'Hardy',
    'Lonely',
    'Brave',
    'Adamant',
    'Naughty',
    'Bold',
    'Docile',
    'Relaxed',
    'Impish',
    'Lax',
    'Timid',
    'Hasty',
    'Serious',
    'Jolly',
    'Naive',
    'Modest',
    'Mild',
    'Quiet',
    'Bashful',
    'Rash',
    'Calm',
    'Gentle',
    'Sassy',
    'Careful',
    'Quirky',
  ];

  let attackerQuery = $state('');
  let defenderQuery = $state('');
  let moveQuery = $state('');

  let attackerSlot: TeamSlot = $state({
    species: null,
    item: null,
    ability: '',
    nature: 'Jolly' as Nature,
    evs: defaultEvs(),
    ivs: defaultIvs(),
    moves: [null, null, null, null],
    level: 50,
  });
  let defenderSlot: TeamSlot = $state({
    species: null,
    item: null,
    ability: '',
    nature: 'Bold' as Nature,
    evs: defaultEvs(),
    ivs: defaultIvs(),
    moves: [null, null, null, null],
    level: 50,
  });

  let filteredPokemon = $derived.by(() =>
    getIsDataLoaded() && attackerQuery
      ? Object.values(getPokedex() ?? {})
          .filter(
            (p) =>
              p.name.toLowerCase().includes(attackerQuery.toLowerCase()) ||
              p.id.includes(attackerQuery.toLowerCase())
          )
          .slice(0, 7)
      : []
  );

  let filteredDefenders = $derived.by(() =>
    getIsDataLoaded() && defenderQuery
      ? Object.values(getPokedex() ?? {})
          .filter((p) => p.name.toLowerCase().includes(defenderQuery.toLowerCase()))
          .slice(0, 7)
      : []
  );

  let filteredMoves = $derived.by(() =>
    getIsDataLoaded() && moveQuery
      ? Object.values(getMovesDb() ?? {})
          .filter((m) => m.name.toLowerCase().includes(moveQuery.toLowerCase()) && m.power !== null)
          .slice(0, 7)
      : []
  );

  function selectAttacker(species: PokemonSpecies): void {
    attackerSlot = { ...attackerSlot, species };
    attackerQuery = species.name;
    setCalcAttacker(attackerSlot);
  }

  function selectDefender(species: PokemonSpecies): void {
    defenderSlot = { ...defenderSlot, species };
    defenderQuery = species.name;
    setCalcDefender(defenderSlot);
  }

  function selectMove(move: Move): void {
    moveQuery = move.name;
    setCalcMove(move);
  }

  function onAttackerChange(): void {
    setCalcAttacker({ ...attackerSlot });
  }
  function onDefenderChange(): void {
    setCalcDefender({ ...defenderSlot });
  }

  $effect(() => {
    loadPokemonData();
  });
</script>

<div class="calc-root">
  {#if getDataLoadError()}
    <p class="error-msg">{getDataLoadError()}</p>
  {:else if !getIsDataLoaded()}
    <p class="loading-msg">Loading Pokémon data...</p>
  {:else}
    <div class="panels">
      <section class="panel" aria-label="Attacker">
        <h3 class="panel-title">Attacker</h3>
        <div class="autocomplete">
          <input
            class="input"
            bind:value={attackerQuery}
            placeholder="Search species..."
            aria-label="Attacker species"
          />
          {#if filteredPokemon.length > 0 && attackerQuery}
            <ul class="dropdown" role="listbox">
              {#each filteredPokemon as p (p.id)}
                <li
                  role="option"
                  aria-selected="false"
                  class="dropdown-item"
                  tabindex="0"
                  onclick={() => selectAttacker(p)}
                  onkeydown={(e) => {
                    if (e.key === 'Enter') selectAttacker(p);
                  }}
                >
                  {p.name}
                </li>
              {/each}
            </ul>
          {/if}
        </div>
        <div class="row">
          <label class="field"
            ><span>Nature</span>
            <select
              bind:value={attackerSlot.nature}
              onchange={onAttackerChange}
              aria-label="Nature"
            >
              {#each NATURES as n (n)}<option value={n}>{n}</option>{/each}
            </select>
          </label>
          <label class="field"
            ><span>Atk EVs</span>
            <input
              type="number"
              min="0"
              max="252"
              bind:value={attackerSlot.evs.atk}
              onchange={onAttackerChange}
              aria-label="Attack EVs"
              class="input-sm"
            />
          </label>
          <label class="field"
            ><span>SpA EVs</span>
            <input
              type="number"
              min="0"
              max="252"
              bind:value={attackerSlot.evs.spa}
              onchange={onAttackerChange}
              aria-label="Special Attack EVs"
              class="input-sm"
            />
          </label>
        </div>
      </section>

      <section class="panel" aria-label="Defender">
        <h3 class="panel-title">Defender</h3>
        <div class="autocomplete">
          <input
            class="input"
            bind:value={defenderQuery}
            placeholder="Search species..."
            aria-label="Defender species"
          />
          {#if filteredDefenders.length > 0 && defenderQuery}
            <ul class="dropdown" role="listbox">
              {#each filteredDefenders as p (p.id)}
                <li
                  role="option"
                  aria-selected="false"
                  class="dropdown-item"
                  tabindex="0"
                  onclick={() => selectDefender(p)}
                  onkeydown={(e) => {
                    if (e.key === 'Enter') selectDefender(p);
                  }}
                >
                  {p.name}
                </li>
              {/each}
            </ul>
          {/if}
        </div>
        <div class="row">
          <label class="field"
            ><span>Nature</span>
            <select
              bind:value={defenderSlot.nature}
              onchange={onDefenderChange}
              aria-label="Defender nature"
            >
              {#each NATURES as n (n)}<option value={n}>{n}</option>{/each}
            </select>
          </label>
          <label class="field"
            ><span>Def EVs</span>
            <input
              type="number"
              min="0"
              max="252"
              bind:value={defenderSlot.evs.def}
              onchange={onDefenderChange}
              aria-label="Defense EVs"
              class="input-sm"
            />
          </label>
          <label class="field"
            ><span>HP EVs</span>
            <input
              type="number"
              min="0"
              max="252"
              bind:value={defenderSlot.evs.hp}
              onchange={onDefenderChange}
              aria-label="HP EVs"
              class="input-sm"
            />
          </label>
        </div>
      </section>
    </div>

    <div class="move-row autocomplete">
      <label class="field full-width"
        ><span>Move</span>
        <input
          class="input"
          bind:value={moveQuery}
          placeholder="Search move..."
          aria-label="Move selector"
        />
      </label>
      {#if filteredMoves.length > 0 && moveQuery}
        <ul class="dropdown" role="listbox">
          {#each filteredMoves as m (m.id)}
            <li
              role="option"
              aria-selected="false"
              class="dropdown-item"
              tabindex="0"
              onclick={() => selectMove(m)}
              onkeydown={(e) => {
                if (e.key === 'Enter') selectMove(m);
              }}
            >
              {m.name} <span class="move-meta">({m.type} | {m.power}BP)</span>
            </li>
          {/each}
        </ul>
      {/if}
    </div>

    {@const result = getCalcResult()}
    {#if result}
      <div class="result-bar" role="region" aria-label="Damage result">
        {#if result.effectiveness === 0}
          <span class="result-immune">No effect!</span>
        {:else}
          <span class="result-range">
            {result.min}–{result.max}
            ({result.percentages[0]}%–{result.percentages[15]}%)
          </span>
          {#if result.ohkoChance > 0}
            <span class="ohko-badge">{(result.ohkoChance * 100).toFixed(0)}% OHKO</span>
          {/if}
          {#if result.effectiveness > 1}
            <span class="eff-badge super">Super effective!</span>
          {:else if result.effectiveness < 1}
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
  .calc-root {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 8px;
  }
  .panels {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .panel {
    flex: 1;
    min-width: 140px;
    background: var(--color-surface);
    border-radius: var(--radius-m);
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .panel-title {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text);
    margin: 0;
  }
  .row {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 0.7rem;
    color: var(--color-text-muted);
  }
  .field span {
    font-size: 10px;
  }
  .input {
    padding: 4px 6px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-background);
    color: var(--color-text);
    font-size: 0.7rem;
    width: 100%;
    box-sizing: border-box;
    font-family: inherit;
  }
  .input-sm {
    width: 56px;
    padding: 3px 4px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-background);
    color: var(--color-text);
    font-size: 0.7rem;
    font-family: inherit;
  }
  select {
    padding: 3px 4px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-background);
    color: var(--color-text);
    font-size: 0.7rem;
    font-family: inherit;
  }
  .autocomplete {
    position: relative;
  }
  .dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: var(--z-dropdown);
    background: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    list-style: none;
    margin: 2px 0 0;
    padding: 0;
    max-height: 180px;
    overflow-y: auto;
  }
  .dropdown-item {
    padding: 5px 8px;
    cursor: pointer;
    font-size: 0.7rem;
    color: var(--color-text);
  }
  .dropdown-item:hover {
    background: var(--color-surface);
  }
  .move-row {
    margin-top: 4px;
  }
  .full-width {
    width: 100%;
  }
  .move-meta {
    color: var(--color-text-muted);
    font-size: 10px;
  }
  .result-bar {
    background: var(--color-surface);
    border-radius: var(--radius-m);
    padding: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .result-range {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--color-text);
  }
  .result-immune {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    font-style: italic;
  }
  .ohko-badge {
    background: var(--color-error);
    color: var(--color-background);
    font-size: 10px;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: var(--radius-s);
  }
  .eff-badge {
    font-size: 0.7rem;
    font-weight: 600;
  }
  .eff-badge.super {
    color: var(--color-success);
  }
  .eff-badge.resist {
    color: var(--color-warning);
  }
  .result-placeholder {
    font-size: 0.7rem;
    color: var(--color-text-muted);
    text-align: center;
    padding: 8px;
  }
  .error-msg {
    color: var(--color-error);
    font-size: 0.75rem;
  }
  .loading-msg {
    color: var(--color-text-muted);
    font-size: 0.75rem;
    text-align: center;
    padding: 24px;
  }
</style>
