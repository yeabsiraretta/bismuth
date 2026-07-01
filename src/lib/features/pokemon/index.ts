/**
 * Pokemon feature public API barrel.
 * All external consumers MUST import from this path only.
 */

// Types
export type {
  PokemonType, MoveCategory, Generation, Stats,
  PokemonSpecies, Move, Item, Nature, TeamSlot, Team,
  DamageResult, FieldConditions, TypeEffectiveness,
} from './types/pokemon';

// Store
export {
  activeTeam, calcAttacker, calcDefender, calcMove,
  calcField, calcResult, isDataLoaded, dataLoadError, generation,
  loadPokemonData, getPokedex, getMovesDb, getItemsDb,
  addToTeam, updateSlot, loadTeam,
  setCalcAttacker, setCalcDefender, setCalcMove, setCalcField,
} from './stores/pokemonStore';

// Services
export { calculateDamage, defaultEvs, defaultIvs } from './services/damageCalc';
export { parseShowdownPaste } from './services/showdownParser';
export type { ParseResult, ParseError } from './services/showdownParser';

// Components
export { default as PokemonPanel } from './components/PokemonPanel.svelte';
