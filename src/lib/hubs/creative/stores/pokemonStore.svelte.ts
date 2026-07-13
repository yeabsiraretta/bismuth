/**
 * Pokemon feature store — Svelte 5 runes.
 * Manages active team, calculator inputs, and derived damage result.
 */
import itemsJson from '@/config/pokemon/gen9-items.json';
import movesJson from '@/config/pokemon/gen9-moves.json';
import pokedexJson from '@/config/pokemon/gen9-pokedex.json';
import typeChartJson from '@/config/pokemon/gen9-types.json';
import { calculateDamage, defaultEvs, defaultIvs } from '@/hubs/creative/services/damageCalc';
import type {
  DamageResult,
  FieldConditions,
  Item,
  Move,
  Nature,
  PokemonSpecies,
  Team,
  TeamSlot,
} from '@/hubs/creative/types/pokemon';
import { log } from '@/utils/log/logger';

// ---------------------------------------------------------------------------
// Data cache — loaded once on first use
// ---------------------------------------------------------------------------

let typeChart: Record<string, Record<string, number>> | null = null;
let pokedexData: Record<string, PokemonSpecies> | null = null;
let movesData: Record<string, Move> | null = null;
let itemsData: Record<string, Item> | null = null;
let dataLoading = false;

function makeEmptySlot(): TeamSlot {
  return {
    species: null,
    item: null,
    ability: '',
    nature: 'Hardy' as Nature,
    evs: defaultEvs(),
    ivs: defaultIvs(),
    moves: [null, null, null, null],
    level: 50,
  };
}

function makeEmptyTeam(): Team {
  return {
    slots: [
      makeEmptySlot(),
      makeEmptySlot(),
      makeEmptySlot(),
      makeEmptySlot(),
      makeEmptySlot(),
      makeEmptySlot(),
    ],
    generation: 'gen9',
  };
}

// ---------------------------------------------------------------------------
// Reactive state (Svelte 5 runes)
// ---------------------------------------------------------------------------

let activeTeamState = $state<Team>(makeEmptyTeam());
let calcAttackerState = $state<TeamSlot | null>(null);
let calcDefenderState = $state<TeamSlot | null>(null);
let calcMoveState = $state<Move | null>(null);
const calcFieldState = $state<FieldConditions>({});
let isDataLoadedState = $state<boolean>(false);
let dataLoadErrorState = $state<string | null>(null);

// ---------------------------------------------------------------------------
// Public getters (readonly access)
// ---------------------------------------------------------------------------

export function getActiveTeam(): Team {
  return activeTeamState;
}
export function getIsDataLoaded(): boolean {
  return isDataLoadedState;
}
export function getDataLoadError(): string | null {
  return dataLoadErrorState;
}

// ---------------------------------------------------------------------------
// Derived: damage result
// ---------------------------------------------------------------------------

export function getCalcResult(): DamageResult | null {
  const attacker = calcAttackerState;
  const defender = calcDefenderState;
  const move = calcMoveState;
  const field = calcFieldState;
  if (!attacker || !defender || !move) return null;
  if (!typeChart) return null;
  try {
    return calculateDamage(attacker, defender, move, field, typeChart);
  } catch (err) {
    log.error('calcResult derivation failed', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Data loading
// ---------------------------------------------------------------------------

export async function loadPokemonData(): Promise<void> {
  if (dataLoading || isDataLoadedState) return;
  dataLoading = true;
  try {
    typeChart = typeChartJson as Record<string, Record<string, number>>;
    pokedexData = pokedexJson as unknown as Record<string, PokemonSpecies>;
    movesData = movesJson as Record<string, Move>;
    itemsData = itemsJson as Record<string, Item>;
    isDataLoadedState = true;
    log.info('Pokemon data loaded', { generation: 'gen9' });
  } catch (err) {
    dataLoadErrorState = 'Failed to load Pokémon data.';
    log.error('Pokemon data load failed', err);
  } finally {
    dataLoading = false;
  }
}

export function getPokedex(): Record<string, PokemonSpecies> | null {
  return pokedexData;
}
export function getMovesDb(): Record<string, Move> | null {
  return movesData;
}
export function getItemsDb(): Record<string, Item> | null {
  return itemsData;
}

// ---------------------------------------------------------------------------
// Team actions
// ---------------------------------------------------------------------------

export function addToTeam(slotIndex: number, species: PokemonSpecies): void {
  if (slotIndex < 0 || slotIndex > 5) return;
  const slots = [...activeTeamState.slots];
  while (slots.length < 6) slots.push(makeEmptySlot());
  slots[slotIndex] = { ...slots[slotIndex], species };
  activeTeamState = { ...activeTeamState, slots };
  log.debug('addToTeam', { slotIndex, species: species.id });
}

export function updateSlot(index: number, patch: Partial<TeamSlot>): void {
  if (index < 0 || index > 5) return;
  const slots = [...activeTeamState.slots];
  while (slots.length < 6) slots.push(makeEmptySlot());
  slots[index] = { ...slots[index], ...patch };
  activeTeamState = { ...activeTeamState, slots };
}

export function loadTeam(team: Team): void {
  activeTeamState = team;
  log.info('Team loaded from paste', {
    slotCount: team.slots.filter((s) => s.species !== null).length,
  });
}

export function setCalcAttacker(slot: TeamSlot | null): void {
  calcAttackerState = slot;
}
export function setCalcDefender(slot: TeamSlot | null): void {
  calcDefenderState = slot;
}
export function setCalcMove(move: Move | null): void {
  calcMoveState = move;
}
