<script lang="ts">
  import { log } from '@/utils/logger';
  import {
    activeTeam,
    isDataLoaded,
    loadPokemonData,
    getPokedex,
    getMovesDb,
    addToTeam,
    updateSlot,
  } from '../stores/pokemonStore';
  import type { TeamSlot, PokemonSpecies, Move, Nature } from '../types/pokemon';
  import { onMount } from 'svelte';

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

  const STAT_KEYS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const;
  const MAX_TOTAL_EVS = 510;
  const MAX_SINGLE_EV = 252;

  let expandedSlot = -1;
  let speciesQuery = '';
  let moveQueries = ['', '', '', ''];

  function toggleExpand(i: number): void {
    expandedSlot = expandedSlot === i ? -1 : i;
    speciesQuery = '';
    moveQueries = ['', '', '', ''];
  }

  function totalEvs(slot: TeamSlot): number {
    return STAT_KEYS.reduce((sum, k) => sum + slot.evs[k], 0);
  }

  function evValid(slot: TeamSlot, stat: string, newVal: number): boolean {
    if (newVal > MAX_SINGLE_EV) return false;
    const others = STAT_KEYS.filter((k) => k !== stat).reduce((s, k) => s + slot.evs[k], 0);
    return others + newVal <= MAX_TOTAL_EVS;
  }

  $: speciesOptions =
    $isDataLoaded && speciesQuery
      ? Object.values(getPokedex() ?? {})
          .filter((p) => p.name.toLowerCase().includes(speciesQuery.toLowerCase()))
          .slice(0, 7)
      : [];

  function moveOptions(q: string): Move[] {
    if (!$isDataLoaded || !q) return [];
    return Object.values(getMovesDb() ?? {})
      .filter((m) => m.name.toLowerCase().includes(q.toLowerCase()))
      .slice(0, 7);
  }

  function selectSpecies(slotIdx: number, sp: PokemonSpecies): void {
    addToTeam(slotIdx, sp);
    speciesQuery = sp.name;
    speciesOptions = [];
    log.debug('TeamBuilder species selected', { slotIdx, species: sp.id });
  }

  function selectMove(slotIdx: number, moveIdx: number, move: Move): void {
    const slot = $activeTeam.slots[slotIdx];
    const moves: TeamSlot['moves'] = [...slot.moves] as TeamSlot['moves'];
    moves[moveIdx] = move;
    updateSlot(slotIdx, { moves });
    moveQueries[moveIdx] = move.name;
  }

  function onEvInput(slotIdx: number, stat: string, event: Event): void {
    const val = parseInt((event.target as HTMLInputElement).value, 10) || 0;
    const slot = $activeTeam.slots[slotIdx];
    if (!evValid(slot, stat, val)) {
      (event.target as HTMLInputElement).value = String(slot.evs[stat as keyof typeof slot.evs]);
      return;
    }
    updateSlot(slotIdx, { evs: { ...slot.evs, [stat]: val } });
  }

  function copyShowdown(): void {
    const lines: string[] = [];
    for (const slot of $activeTeam.slots) {
      if (!slot.species) continue;
      const header = slot.item ? `${slot.species.name} @ ${slot.item.name}` : slot.species.name;
      lines.push(header);
      if (slot.ability) lines.push(`Ability: ${slot.ability}`);
      const evParts = STAT_KEYS.filter((k) => slot.evs[k] > 0).map(
        (k) => `${slot.evs[k]} ${k.toUpperCase()}`
      );
      if (evParts.length) lines.push(`EVs: ${evParts.join(' / ')}`);
      lines.push(`${slot.nature} Nature`);
      for (const m of slot.moves) {
        if (m) lines.push(`- ${m.name}`);
      }
      lines.push('');
    }
    navigator.clipboard
      .writeText(lines.join('\n'))
      .then(() => log.info('Team copied to clipboard'));
  }

  onMount(async () => {
    await loadPokemonData();
  });
</script>

<div class="team-builder">
  <div class="header-row">
    <span class="title">Team Builder</span>
    <button class="copy-btn" on:click={copyShowdown} aria-label="Copy team as Showdown paste"
      >Copy as Showdown</button
    >
  </div>

  <div class="team-grid">
    {#each $activeTeam.slots as slot, i}
      <div class="slot-card" class:expanded={expandedSlot === i}>
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div class="slot-header" on:click={() => toggleExpand(i)}>
          <span
            class="type-dot"
            style="background: var(--type-{slot.species?.types[0]?.toLowerCase() ??
              'default'}, var(--interactive-accent))"
          ></span>
          <span class="species-name">{slot.species?.name ?? 'Empty'}</span>
          <span class="slot-moves">
            {slot.moves
              .filter(Boolean)
              .map((m) => m?.name ?? '')
              .join(' / ') || '—'}
          </span>
        </div>

        {#if expandedSlot === i}
          <div class="slot-editor">
            <div class="autocomplete">
              <label class="field"
                ><span>Species</span>
                <input
                  class="input"
                  bind:value={speciesQuery}
                  placeholder="Search..."
                  aria-label="Species search"
                />
              </label>
              {#if speciesOptions.length > 0}
                <ul class="dropdown" role="listbox">
                  {#each speciesOptions as sp}
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <li
                      role="option"
                      aria-selected="false"
                      class="dropdown-item"
                      on:click={() => selectSpecies(i, sp)}
                    >
                      {sp.name}
                    </li>
                  {/each}
                </ul>
              {/if}
            </div>

            <label class="field"
              ><span>Nature</span>
              <select
                bind:value={slot.nature}
                on:change={(e) =>
                  updateSlot(i, { nature: (e.target as HTMLSelectElement).value as Nature })}
                aria-label="Nature"
              >
                {#each NATURES as n}<option value={n}>{n}</option>{/each}
              </select>
            </label>

            <div class="evs-grid">
              {#each STAT_KEYS as k}
                <label class="field">
                  <span>{k.toUpperCase()}</span>
                  <input
                    type="number"
                    min="0"
                    max="252"
                    value={slot.evs[k]}
                    class:ev-invalid={slot.evs[k] > MAX_SINGLE_EV || totalEvs(slot) > MAX_TOTAL_EVS}
                    on:change={(e) => onEvInput(i, k, e)}
                    aria-label="{k} EVs"
                    class="input-sm"
                  />
                </label>
              {/each}
            </div>
            {#if totalEvs(slot) > MAX_TOTAL_EVS}
              <p class="ev-error">Total EVs exceed 510 ({totalEvs(slot)})</p>
            {/if}

            {#each [0, 1, 2, 3] as mi}
              <div class="autocomplete">
                <label class="field"
                  ><span>Move {mi + 1}</span>
                  <input
                    class="input"
                    bind:value={moveQueries[mi]}
                    placeholder="Search move..."
                    aria-label="Move {mi + 1}"
                  />
                </label>
                {#if moveQueries[mi]}
                  {@const opts = moveOptions(moveQueries[mi])}
                  {#if opts.length > 0}
                    <ul class="dropdown" role="listbox">
                      {#each opts as m}
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <li
                          role="option"
                          aria-selected="false"
                          class="dropdown-item"
                          on:click={() => selectMove(i, mi, m)}
                        >
                          {m.name}
                        </li>
                      {/each}
                    </ul>
                  {/if}
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  .team-builder {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-s);
    padding: var(--spacing-s);
  }
  .header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .title {
    font-size: var(--font-ui-small);
    font-weight: 600;
    color: var(--text-normal);
  }
  .copy-btn {
    padding: 4px 10px;
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    border: none;
    border-radius: var(--radius-s);
    font-size: var(--font-ui-smaller);
    cursor: pointer;
    min-height: 28px;
  }
  .copy-btn:hover {
    background: var(--interactive-accent-hover);
  }
  .team-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-xs);
  }
  .slot-card {
    background: var(--background-secondary);
    border-radius: var(--radius-m);
    overflow: hidden;
    border: 1px solid var(--background-modifier-border);
  }
  .slot-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) var(--spacing-s);
    cursor: pointer;
    user-select: none;
  }
  .slot-header:hover {
    background: var(--background-modifier-hover);
  }
  .type-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .species-name {
    font-size: var(--font-ui-smaller);
    font-weight: 600;
    color: var(--text-normal);
    flex: 0 0 auto;
  }
  .slot-moves {
    font-size: 9px;
    color: var(--text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
  }
  .slot-editor {
    padding: var(--spacing-s);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    border-top: 1px solid var(--background-modifier-border);
  }
  .evs-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: var(--font-ui-smaller);
    color: var(--text-muted);
  }
  .field span {
    font-size: 9px;
  }
  .input {
    padding: 3px 6px;
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-s);
    background: var(--background-primary);
    color: var(--text-normal);
    font-size: var(--font-ui-smaller);
    width: 100%;
    box-sizing: border-box;
  }
  .input-sm {
    width: 52px;
    padding: 2px 4px;
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-s);
    background: var(--background-primary);
    color: var(--text-normal);
    font-size: var(--font-ui-smaller);
  }
  select {
    padding: 3px 4px;
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-s);
    background: var(--background-primary);
    color: var(--text-normal);
    font-size: var(--font-ui-smaller);
  }
  .ev-invalid {
    border-color: var(--text-error) !important;
  }
  .ev-error {
    color: var(--text-error);
    font-size: 9px;
    margin: 0;
  }
  .autocomplete {
    position: relative;
  }
  .dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 10;
    background: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-s);
    list-style: none;
    margin: 2px 0 0;
    padding: 0;
    max-height: 150px;
    overflow-y: auto;
  }
  .dropdown-item {
    padding: 4px 8px;
    cursor: pointer;
    font-size: var(--font-ui-smaller);
    color: var(--text-normal);
  }
  .dropdown-item:hover {
    background: var(--background-modifier-hover);
  }
</style>
