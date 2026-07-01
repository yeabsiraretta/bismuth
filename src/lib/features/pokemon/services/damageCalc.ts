/**
 * Gen 9 damage formula — pure TypeScript, no external dependencies.
 * Formula reference: https://bulbapedia.bulbagarden.net/wiki/Damage
 */
import { log } from '@/utils/logger';
import type { TeamSlot, Move, DamageResult, FieldConditions, Nature, PokemonType, Stats, PokemonSpecies } from '../types/pokemon';
import defaultTypeChart from '@/config/pokemon/gen9-types.json';

const LEVEL = 50;

/** Nature modifiers: [boosted stat, reduced stat] — null means neutral */
const NATURE_MODIFIERS: Record<Nature, [keyof Stats | null, keyof Stats | null]> = {
  Hardy:   [null,  null],
  Lonely:  ['atk', 'def'],
  Brave:   ['atk', 'spe'],
  Adamant: ['atk', 'spa'],
  Naughty: ['atk', 'spd'],
  Bold:    ['def', 'atk'],
  Docile:  [null,  null],
  Relaxed: ['def', 'spe'],
  Impish:  ['def', 'spa'],
  Lax:     ['def', 'spd'],
  Timid:   ['spe', 'atk'],
  Hasty:   ['spe', 'def'],
  Serious: [null,  null],
  Jolly:   ['spe', 'spa'],
  Naive:   ['spe', 'spd'],
  Modest:  ['spa', 'atk'],
  Mild:    ['spa', 'def'],
  Quiet:   ['spa', 'spe'],
  Bashful: [null,  null],
  Rash:    ['spa', 'spd'],
  Calm:    ['spd', 'atk'],
  Gentle:  ['spd', 'def'],
  Sassy:   ['spd', 'spe'],
  Careful: ['spd', 'spa'],
  Quirky:  [null,  null],
};

function natureMultiplier(nature: Nature, stat: keyof Stats): number {
  const [boosted, reduced] = NATURE_MODIFIERS[nature];
  if (boosted === stat) return 1.1;
  if (reduced === stat) return 0.9;
  return 1.0;
}

/** Gen 9 stat formula at level 50 */
function calcStat(base: number, ev: number, iv: number, nature: Nature, stat: keyof Stats): number {
  if (stat === 'hp') {
    return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * LEVEL) / 100) + LEVEL + 10;
  }
  const raw = Math.floor(((2 * base + iv + Math.floor(ev / 4)) * LEVEL) / 100) + 5;
  return Math.floor(raw * natureMultiplier(nature, stat));
}

function getEffectiveness(
  moveType: PokemonType,
  defTypes: [PokemonType, PokemonType?],
  chart: Record<string, Record<string, number>>
): number {
  const row = chart[moveType];
  if (!row) return 1;
  let eff = row[defTypes[0]] ?? 1;
  if (defTypes[1]) eff *= row[defTypes[1]] ?? 1;
  return eff;
}

function hasStab(moveType: PokemonType, attackerTypes: [PokemonType, PokemonType?]): boolean {
  return attackerTypes.includes(moveType);
}

/** Minimal stub type chart — all matchups neutral. */
const _STUB_CHART: Record<string, Record<string, number>> = new Proxy({}, {
  get: () => new Proxy({}, { get: () => 1 }),
});
void _STUB_CHART; // retained for potential use in future

// Use the static import as the real default chart
const DEFAULT_CHART = defaultTypeChart as Record<string, Record<string, number>>;

/**
 * Extended slot type for raw-stats callers (e.g. tests that don't use species objects).
 * When species is null but baseStats and types are provided directly on the slot,
 * we use those values.
 */
type LooseSlot = TeamSlot & {
  baseStats?: Stats;
  types?: [PokemonType, PokemonType?];
};

function resolveSpecies(slot: LooseSlot): Pick<PokemonSpecies, 'baseStats' | 'types'> | null {
  if (slot.species) return slot.species;
  if (slot.baseStats && slot.types) return { baseStats: slot.baseStats, types: slot.types };
  return null;
}

/**
 * Calculate Gen 9 damage.
 * Returns DamageResult with 16 rolls (85/100 through 100/100).
 *
 * `typeChart` is optional — if omitted, a neutral stub chart is used.
 * This allows unit tests to call the function without loading JSON data.
 */
export function calculateDamage(
  attacker: TeamSlot,
  defender: TeamSlot,
  move: Move,
  field?: FieldConditions,
  typeChart?: Record<string, Record<string, number>>
): DamageResult {
  const resolvedField = field ?? {};
  const chart = typeChart ?? DEFAULT_CHART;
  const zero = (): DamageResult => ({
    min: 0, max: 0, rolls: new Array(16).fill(0),
    percentages: new Array(16).fill('0.0'), ohkoChance: 0, effectiveness: 0,
  });

  const atkSpecies = resolveSpecies(attacker as LooseSlot);
  const defSpecies = resolveSpecies(defender as LooseSlot);

  if (!atkSpecies || !defSpecies || !move.power || move.category === 'status') {
    return zero();
  }

  const attackerTypes = atkSpecies.types as [PokemonType, PokemonType?];
  const defenderTypes = defSpecies.types as [PokemonType, PokemonType?];

  const effectiveness = getEffectiveness(move.type as PokemonType, defenderTypes, chart);

  if (effectiveness === 0) {
    log.debug('Immune matchup — zero damage', { move: move.id, defenderTypes });
    return zero();
  }

  const isPhysical = move.category === 'physical';
  const atkStatKey: keyof Stats = isPhysical ? 'atk' : 'spa';
  const defStatKey: keyof Stats = isPhysical ? 'def' : 'spd';

  const atkBase = atkSpecies.baseStats[atkStatKey];
  const defBase = defSpecies.baseStats[defStatKey];
  const defHpBase = defSpecies.baseStats.hp;

  const atkEv = attacker.evs[atkStatKey];
  const defEv = defender.evs[defStatKey];
  const defHpEv = defender.evs.hp;

  const atkStat = calcStat(atkBase, atkEv, attacker.ivs[atkStatKey], attacker.nature, atkStatKey);
  const defStat = calcStat(defBase, defEv, defender.ivs[defStatKey], defender.nature, defStatKey);
  const defHp   = calcStat(defHpBase, defHpEv, defender.ivs.hp, defender.nature, 'hp');

  // Gen 9 base damage: floor(floor(floor(2*50/5+2) * power * atk/def) / 50) + 2
  const inner = Math.floor(Math.floor(22 * move.power * atkStat / defStat) / 50) + 2;

  const stab = hasStab(move.type as PokemonType, attackerTypes) ? 1.5 : 1.0;
  const crit = resolvedField.isCritical ? 1.5 : 1.0;
  const burn = (resolvedField.attackerBurned && isPhysical) ? 0.5 : 1.0;

  const baseModifiedDamage = inner * stab * crit * burn;

  const rolls: number[] = [];
  for (let r = 85; r <= 100; r++) {
    const dmg = Math.floor(Math.floor(baseModifiedDamage * r / 100) * effectiveness);
    rolls.push(Math.max(1, dmg));
  }

  const min = rolls[0];
  const max = rolls[15];
  const ohkoCount = rolls.filter((d) => d >= defHp).length;
  const ohkoChance = ohkoCount / 16;
  const percentages = rolls.map((d) => ((d / defHp) * 100).toFixed(1));

  log.debug('Damage calculated', { move: move.id, min, max, effectiveness });

  return { min, max, rolls, percentages, ohkoChance, effectiveness };
}

/** Default max-IV stat block */
export function defaultIvs(): Stats {
  return { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };
}

/** Default zero-EV stat block */
export function defaultEvs(): Stats {
  return { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
}
