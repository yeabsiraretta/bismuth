/**
 * Pokemon feature store.
 * Manages active team, calculator inputs, and derived damage result.
 * All data loaded lazily via Vite dynamic import.
 */
import { writable, derived, get } from 'svelte/store';
import { log } from '@/utils/logger';
import type {
  Team,
  TeamSlot,
  Move,
  DamageResult,
  FieldConditions,
  PokemonSpecies,
  Item,
  Nature,
} from '../types/pokemon';
import { calculateDamage, defaultEvs, defaultIvs } from '../services/damageCalc';
import typeChartJson from '@/config/pokemon/gen9-types.json';
import pokedexJson from '@/config/pokemon/gen9-pokedex.json';
import movesJson from '@/config/pokemon/gen9-moves.json';
import itemsJson from '@/config/pokemon/gen9-items.json';

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
// Writable stores
// ---------------------------------------------------------------------------

export const activeTeam = writable<Team>(makeEmptyTeam());
export const calcAttacker = writable<TeamSlot | null>(null);
export const calcDefender = writable<TeamSlot | null>(null);
export const calcMove = writable<Move | null>(null);
export const calcField = writable<FieldConditions>({});
export const isDataLoaded = writable<boolean>(false);
export const dataLoadError = writable<string | null>(null);
export const generation = writable<'gen9'>('gen9');

// ---------------------------------------------------------------------------
// Derived stores
// ---------------------------------------------------------------------------

export const calcResult = derived(
  [calcAttacker, calcDefender, calcMove, calcField],
  ([$attacker, $defender, $move, $field]): DamageResult | null => {
    if (!$attacker || !$defender || !$move) return null;
    if (!typeChart) return null;
    try {
      return calculateDamage($attacker, $defender, $move, $field, typeChart);
    } catch (err) {
      log.error('calcResult derivation failed', err);
      return null;
    }
  }
);

// ---------------------------------------------------------------------------
// Data loading
// ---------------------------------------------------------------------------

export async function loadPokemonData(): Promise<void> {
  if (dataLoading || get(isDataLoaded)) return;
  dataLoading = true;
  try {
    typeChart = typeChartJson as Record<string, Record<string, number>>;
    pokedexData = pokedexJson as unknown as Record<string, PokemonSpecies>;
    movesData = movesJson as Record<string, Move>;
    itemsData = itemsJson as Record<string, Item>;
    isDataLoaded.set(true);
    log.info('Pokemon data loaded', { generation: 'gen9' });
  } catch (err) {
    dataLoadError.set('Failed to load Pokémon data.');
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
  activeTeam.update((team) => {
    const slots = [...team.slots];
    // Ensure the 6-slot structure is maintained
    while (slots.length < 6) slots.push(makeEmptySlot());
    slots[slotIndex] = { ...slots[slotIndex], species };
    return { ...team, slots };
  });
  log.debug('addToTeam', { slotIndex, species: species.id });
}

export function updateSlot(index: number, patch: Partial<TeamSlot>): void {
  if (index < 0 || index > 5) return;
  activeTeam.update((team) => {
    const slots = [...team.slots];
    while (slots.length < 6) slots.push(makeEmptySlot());
    slots[index] = { ...slots[index], ...patch };
    return { ...team, slots };
  });
}

export function loadTeam(team: Team): void {
  activeTeam.set(team);
  log.info('Team loaded from paste', {
    slotCount: team.slots.filter((s) => s.species !== null).length,
  });
}

export function setCalcAttacker(slot: TeamSlot | null): void {
  calcAttacker.set(slot);
}
export function setCalcDefender(slot: TeamSlot | null): void {
  calcDefender.set(slot);
}
export function setCalcMove(move: Move | null): void {
  calcMove.set(move);
}
export function setCalcField(field: FieldConditions): void {
  calcField.set(field);
}
