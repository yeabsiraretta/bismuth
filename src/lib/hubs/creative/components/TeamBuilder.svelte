<script lang="ts">
  import {
    addToTeam,
    getActiveTeam,
    getIsDataLoaded,
    getMovesDb,
    getPokedex,
    loadPokemonData,
    updateSlot,
  } from '@/hubs/creative/stores/pokemonStore.svelte';
  import type {
    Move,
    Nature,
    PokemonSpecies,
    Stats,
    TeamSlot,
  } from '@/hubs/creative/types/pokemon';

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

  let expandedSlot = $state(-1);
  let speciesQuery = $state('');
  let moveQueries = $state(['', '', '', '']);

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

  let speciesOptions = $derived.by(() =>
    getIsDataLoaded() && speciesQuery
      ? Object.values(getPokedex() ?? {})
          .filter((p) => p.name.toLowerCase().includes(speciesQuery.toLowerCase()))
          .slice(0, 7)
      : []
  );

  function moveOptions(q: string): Move[] {
    if (!getIsDataLoaded() || !q) return [];
    return Object.values(getMovesDb() ?? {})
      .filter((m) => m.name.toLowerCase().includes(q.toLowerCase()))
      .slice(0, 7);
  }

  function selectSpecies(slotIdx: number, sp: PokemonSpecies): void {
    addToTeam(slotIdx, sp);
    speciesQuery = sp.name;
  }

  function selectMove(slotIdx: number, moveIdx: number, move: Move): void {
    const team = getActiveTeam();
    const slot = team.slots[slotIdx];
    const moves: TeamSlot['moves'] = [...slot.moves] as TeamSlot['moves'];
    moves[moveIdx] = move;
    updateSlot(slotIdx, { moves });
    moveQueries[moveIdx] = move.name;
  }

  function onEvInput(slotIdx: number, stat: string, event: Event): void {
    const val = parseInt((event.target as HTMLInputElement).value, 10) || 0;
    const team = getActiveTeam();
    const slot = team.slots[slotIdx];
    if (!evValid(slot, stat, val)) {
      (event.target as HTMLInputElement).value = String(slot.evs[stat as keyof Stats]);
      return;
    }
    updateSlot(slotIdx, { evs: { ...slot.evs, [stat]: val } });
  }

  function copyShowdown(): void {
    const team = getActiveTeam();
    const lines: string[] = [];
    for (const slot of team.slots) {
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
    navigator.clipboard.writeText(lines.join('\n'));
  }

  $effect(() => {
    loadPokemonData();
  });
</script>

<div class="team-builder">
  <div class="header-row">
    <span class="title">Team Builder</span>
    <button
      class="copy-btn"
      type="button"
      onclick={copyShowdown}
      aria-label="Copy team as Showdown paste">Copy as Showdown</button
    >
  </div>

  <div class="team-grid">
    {#each getActiveTeam().slots as slot, i (i)}
      <div class="slot-card" class:expanded={expandedSlot === i}>
        <button class="slot-header" type="button" onclick={() => toggleExpand(i)}>
          <span
            class="type-dot"
            style="background: var(--type-{slot.species?.types[0]?.toLowerCase() ??
              'default'}, var(--color-accent))"
          ></span>
          <span class="species-name">{slot.species?.name ?? 'Empty'}</span>
          <span class="slot-moves"
            >{slot.moves
              .filter(Boolean)
              .map((m) => m?.name ?? '')
              .join(' / ') || '—'}</span
          >
        </button>

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
                  {#each speciesOptions as sp (sp.id)}
                    <li
                      role="option"
                      aria-selected="false"
                      class="dropdown-item"
                      tabindex="0"
                      onclick={() => selectSpecies(i, sp)}
                      onkeydown={(e) => {
                        if (e.key === 'Enter') selectSpecies(i, sp);
                      }}
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
                value={slot.nature}
                onchange={(e) =>
                  updateSlot(i, { nature: (e.target as HTMLSelectElement).value as Nature })}
                aria-label="Nature"
              >
                {#each NATURES as n (n)}<option value={n}>{n}</option>{/each}
              </select>
            </label>

            <div class="evs-grid">
              {#each STAT_KEYS as k (k)}
                <label class="field">
                  <span>{k.toUpperCase()}</span>
                  <input
                    type="number"
                    min="0"
                    max="252"
                    value={slot.evs[k]}
                    class:ev-invalid={slot.evs[k] > MAX_SINGLE_EV || totalEvs(slot) > MAX_TOTAL_EVS}
                    onchange={(e) => onEvInput(i, k, e)}
                    aria-label="{k} EVs"
                    class="input-sm"
                  />
                </label>
              {/each}
            </div>
            {#if totalEvs(slot) > MAX_TOTAL_EVS}
              <p class="ev-error">Total EVs exceed 510 ({totalEvs(slot)})</p>
            {/if}

            {#each [0, 1, 2, 3] as mi (mi)}
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
                      {#each opts as m (m.id)}
                        <li
                          role="option"
                          aria-selected="false"
                          class="dropdown-item"
                          tabindex="0"
                          onclick={() => selectMove(i, mi, m)}
                          onkeydown={(e) => {
                            if (e.key === 'Enter') selectMove(i, mi, m);
                          }}
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
    gap: 8px;
    padding: 8px;
  }
  .header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .title {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text);
  }
  .copy-btn {
    padding: 4px 10px;
    background: var(--color-accent);
    color: var(--color-background);
    border: none;
    border-radius: var(--radius-s);
    font-size: 0.65rem;
    cursor: pointer;
    min-height: 28px;
    font-family: inherit;
  }
  .copy-btn:hover {
    filter: brightness(1.1);
  }
  .team-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px;
  }
  .slot-card {
    background: var(--color-surface);
    border-radius: var(--radius-m);
    overflow: hidden;
    border: 1px solid var(--color-border);
  }
  .slot-header {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    cursor: pointer;
    user-select: none;
    width: 100%;
    background: transparent;
    border: none;
    color: inherit;
    font-family: inherit;
    text-align: left;
  }
  .slot-header:hover {
    background: var(--color-surface-hover, var(--color-surface));
  }
  .type-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .species-name {
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--color-text);
    flex: 0 0 auto;
  }
  .slot-moves {
    font-size: 9px;
    color: var(--color-text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
  }
  .slot-editor {
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    border-top: 1px solid var(--color-border);
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
    font-size: 0.7rem;
    color: var(--color-text-muted);
  }
  .field span {
    font-size: 9px;
  }
  .input {
    padding: 3px 6px;
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
    width: 52px;
    padding: 2px 4px;
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
  .ev-invalid {
    border-color: var(--color-error);
  }
  .ev-error {
    color: var(--color-error);
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
    z-index: var(--z-dropdown);
    background: var(--color-background);
    border: 1px solid var(--color-border);
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
    font-size: 0.7rem;
    color: var(--color-text);
  }
  .dropdown-item:hover {
    background: var(--color-surface);
  }
</style>
