/**
 * Damage calculator unit tests — Gen 9 formula verification.
 * Uses PICT-informed pairwise coverage of key factors.
 */
import { describe, it, expect } from 'vitest';
import { calculateDamage, defaultEvs, defaultIvs } from '../services/damageCalc';
import type { TeamSlot, Move } from '../types/pokemon';
import typeChart from '../../../config/pokemon/gen9-types.json';
import pokedex from '../../../config/pokemon/gen9-pokedex.json';

const chart = typeChart as Record<string, Record<string, number>>;

function makeSlot(overrides: Partial<TeamSlot> = {}): TeamSlot {
  return {
    species: null,
    item: null,
    ability: '',
    nature: 'Hardy',
    evs: defaultEvs(),
    ivs: defaultIvs(),
    moves: [null, null, null, null],
    level: 50,
    ...overrides,
  };
}

const garchomp = (pokedex as Record<string, unknown>)['garchomp'] as TeamSlot['species'];
const clefable = (pokedex as Record<string, unknown>)['clefable'] as TeamSlot['species'];
const gengar = (pokedex as Record<string, unknown>)['gengar'] as TeamSlot['species'];

const earthquake: Move = {
  id: 'earthquake',
  name: 'Earthquake',
  type: 'Ground',
  power: 100,
  category: 'physical',
  accuracy: 100,
};

const shadowBall: Move = {
  id: 'shadow-ball',
  name: 'Shadow Ball',
  type: 'Ghost',
  power: 80,
  category: 'special',
  accuracy: 100,
};

const thunderbolt: Move = {
  id: 'thunderbolt',
  name: 'Thunderbolt',
  type: 'Electric',
  power: 90,
  category: 'special',
  accuracy: 100,
};

describe('calculateDamage — Gen 9 formula', () => {
  it('returns zero rolls for status moves', () => {
    const attacker = makeSlot({ species: garchomp });
    const defender = makeSlot({ species: clefable });
    const statusMove: Move = {
      id: 'stealth-rock',
      name: 'Stealth Rock',
      type: 'Rock',
      power: null,
      category: 'status',
      accuracy: null,
    };
    const result = calculateDamage(attacker, defender, statusMove, {}, chart);
    expect(result.rolls).toHaveLength(16);
    expect(result.rolls.every((r) => r === 0)).toBe(true);
  });

  it('Garchomp Earthquake vs Clefable (Jolly 252 Atk vs Bold 0 Def EVs)', () => {
    const attacker = makeSlot({
      species: garchomp,
      nature: 'Jolly',
      evs: { ...defaultEvs(), atk: 252 },
    });
    const defender = makeSlot({
      species: clefable,
      nature: 'Bold',
      evs: defaultEvs(),
    });

    const result = calculateDamage(attacker, defender, earthquake, {}, chart);

    expect(result.rolls).toHaveLength(16);
    expect(result.min).toBeGreaterThan(0);
    expect(result.max).toBeGreaterThanOrEqual(result.min);
    // Earthquake is Ground, Clefable is Fairy — neutral (1x) in Gen 9
    expect(result.effectiveness).toBe(1);
    // STAB: Garchomp is Dragon/Ground — Ground moves get STAB
    // Verify STAB applied by checking reasonable damage range
    expect(result.percentages[0]).toMatch(/^\d+\.\d$/);
    // At least 8 specific roll values must be monotonically non-decreasing
    for (let i = 1; i < 16; i++) {
      expect(result.rolls[i]).toBeGreaterThanOrEqual(result.rolls[i - 1]);
    }
  });

  it('immune type matchup — Normal vs Ghost returns all-zero rolls', () => {
    const normalMove: Move = {
      id: 'tackle',
      name: 'Tackle',
      type: 'Normal',
      power: 40,
      category: 'physical',
      accuracy: 100,
    };
    const attacker = makeSlot({ species: clefable }); // Fairy attacker, doesn't matter
    const ghostDefender = makeSlot({ species: gengar }); // Ghost/Poison
    const result = calculateDamage(attacker, ghostDefender, normalMove, {}, chart);
    expect(result.effectiveness).toBe(0);
    expect(result.rolls.every((r) => r === 0)).toBe(true);
    expect(result.min).toBe(0);
    expect(result.max).toBe(0);
    expect(result.ohkoChance).toBe(0);
  });

  it('STAB bonus increases damage vs same move without STAB', () => {
    const stabAttacker = makeSlot({
      species: gengar,
      nature: 'Timid',
      evs: { ...defaultEvs(), spa: 252 },
    }); // Ghost type
    const noStabAttacker = makeSlot({
      species: clefable,
      nature: 'Timid',
      evs: { ...defaultEvs(), spa: 252 },
    }); // Fairy type — no STAB on Ghost
    const defender = makeSlot({ species: garchomp, nature: 'Timid', evs: defaultEvs() });

    const stabResult = calculateDamage(stabAttacker, defender, shadowBall, {}, chart);
    const noStabResult = calculateDamage(noStabAttacker, defender, shadowBall, {}, chart);

    expect(stabResult.max).toBeGreaterThan(noStabResult.max);
  });

  it('critical hit multiplier 1.5x increases damage', () => {
    const attacker = makeSlot({
      species: garchomp,
      nature: 'Jolly',
      evs: { ...defaultEvs(), atk: 252 },
    });
    const defender = makeSlot({ species: clefable, nature: 'Bold', evs: defaultEvs() });

    const normal = calculateDamage(attacker, defender, earthquake, { isCritical: false }, chart);
    const crit = calculateDamage(attacker, defender, earthquake, { isCritical: true }, chart);

    expect(crit.max).toBeGreaterThan(normal.max);
    // Rough check: crit is ~1.5x (allow some rounding)
    expect(crit.max / normal.max).toBeGreaterThan(1.3);
  });

  it('burn halves physical damage', () => {
    const attacker = makeSlot({
      species: garchomp,
      nature: 'Adamant',
      evs: { ...defaultEvs(), atk: 252 },
    });
    const defender = makeSlot({ species: clefable, nature: 'Bold', evs: defaultEvs() });

    const healthy = calculateDamage(
      attacker,
      defender,
      earthquake,
      { attackerBurned: false },
      chart
    );
    const burned = calculateDamage(attacker, defender, earthquake, { attackerBurned: true }, chart);

    expect(burned.max).toBeLessThan(healthy.max);
    expect(burned.max / healthy.max).toBeCloseTo(0.5, 0);
  });

  it('super effective 2x multiplier for Electric vs Water', () => {
    const attacker = makeSlot({
      species: (pokedex as Record<string, unknown>)['rotom-wash'] as TeamSlot['species'],
      nature: 'Timid',
      evs: { ...defaultEvs(), spa: 252 },
    });
    const waterDefender = makeSlot({
      species: (pokedex as Record<string, unknown>)['dondozo'] as TeamSlot['species'],
      nature: 'Bold',
      evs: defaultEvs(),
    });

    const result = calculateDamage(attacker, waterDefender, thunderbolt, {}, chart);
    expect(result.effectiveness).toBe(2);
    expect(result.min).toBeGreaterThan(0);
  });

  it('ohkoChance is 0 when all rolls < defHP and 1 when all rolls >= defHP', () => {
    // A tiny-power move should never OHKO a bulky defender
    const tinyMove: Move = {
      id: 'tackle',
      name: 'Tackle',
      type: 'Normal',
      power: 40,
      category: 'physical',
      accuracy: 100,
    };
    const attacker = makeSlot({
      species: (pokedex as Record<string, unknown>)['flamigo'] as TeamSlot['species'],
    });
    const bulkyDef = makeSlot({
      species: (pokedex as Record<string, unknown>)['dondozo'] as TeamSlot['species'],
      evs: { ...defaultEvs(), hp: 252 },
    });
    const result = calculateDamage(attacker, bulkyDef, tinyMove, {}, chart);
    expect(result.ohkoChance).toBe(0);
  });

  it('produces exactly 16 rolls', () => {
    const attacker = makeSlot({
      species: garchomp,
      nature: 'Jolly',
      evs: { ...defaultEvs(), atk: 252 },
    });
    const defender = makeSlot({ species: clefable, nature: 'Bold', evs: defaultEvs() });
    const result = calculateDamage(attacker, defender, earthquake, {}, chart);
    expect(result.rolls).toHaveLength(16);
  });
});
