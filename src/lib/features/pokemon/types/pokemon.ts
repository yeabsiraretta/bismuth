/**
 * Pokemon feature type definitions.
 * Pure interfaces — no runtime code.
 */

export type PokemonType =
  | 'Normal' | 'Fire' | 'Water' | 'Grass' | 'Electric' | 'Ice'
  | 'Fighting' | 'Poison' | 'Ground' | 'Flying' | 'Psychic' | 'Bug'
  | 'Rock' | 'Ghost' | 'Dragon' | 'Dark' | 'Steel' | 'Fairy';

export type MoveCategory = 'physical' | 'special' | 'status';

export type Generation = 'gen9';

export interface Stats {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
}

export interface PokemonSpecies {
  id: string;
  name: string;
  types: [PokemonType, PokemonType?];
  baseStats: Stats;
  abilities: string[];
}

export interface Move {
  id: string;
  name: string;
  type: PokemonType;
  power: number | null;
  category: MoveCategory;
  accuracy: number | null;
}

export interface Item {
  id: string;
  name: string;
  effect: string;
}

export type Nature =
  | 'Hardy' | 'Lonely' | 'Brave' | 'Adamant' | 'Naughty'
  | 'Bold' | 'Docile' | 'Relaxed' | 'Impish' | 'Lax'
  | 'Timid' | 'Hasty' | 'Serious' | 'Jolly' | 'Naive'
  | 'Modest' | 'Mild' | 'Quiet' | 'Bashful' | 'Rash'
  | 'Calm' | 'Gentle' | 'Sassy' | 'Careful' | 'Quirky';

export interface TeamSlot {
  species: PokemonSpecies | null;
  item: Item | null;
  ability: string;
  nature: Nature;
  evs: Stats;
  ivs: Stats;
  moves: [Move | null, Move | null, Move | null, Move | null];
  level: number;
}

export interface Team {
  /** 1–6 slot entries. Team builder shows exactly 6; parser may return fewer. */
  slots: TeamSlot[];
  generation: Generation;
}

export interface DamageResult {
  min: number;
  max: number;
  rolls: number[];
  percentages: string[];
  ohkoChance: number;
  effectiveness: number;
}

export interface FieldConditions {
  weather?: 'sun' | 'rain' | 'sand' | 'hail' | 'snow' | null;
  terrain?: 'electric' | 'grassy' | 'misty' | 'psychic' | null;
  isCritical?: boolean;
  attackerBurned?: boolean;
}

/** 18x18 type effectiveness matrix: [attackingType][defendingType] = multiplier */
export type TypeEffectiveness = Record<string, Record<string, number>>;

/** Raw JSON shape for the pokedex config file */
export type PokedexJson = Record<string, {
  id: string;
  name: string;
  types: [string, string?];
  baseStats: Stats;
  abilities: string[];
}>;

/** Raw JSON shape for the moves config file */
export type MovesJson = Record<string, {
  id: string;
  name: string;
  type: string;
  power: number | null;
  category: string;
  accuracy: number | null;
}>;

/** Raw JSON shape for the items config file */
export type ItemsJson = Record<string, {
  id: string;
  name: string;
  effect: string;
}>;
