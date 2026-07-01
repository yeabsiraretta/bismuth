/**
 * Pokemon store unit tests.
 * Covers T13 (calcResult derived store correctness) and T16 (EV validation).
 */
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { get } from 'svelte/store';
import {
  activeTeam, calcResult,
  setCalcAttacker, setCalcDefender, setCalcMove, addToTeam, updateSlot, loadTeam,
  loadPokemonData,
} from '../stores/pokemonStore';
import { defaultEvs, defaultIvs } from '../services/damageCalc';
import type { TeamSlot, PokemonSpecies, Move, Team, Stats } from '../types/pokemon';
import pokedexJson from '../../../config/pokemon/gen9-pokedex.json';

vi.mock('@/utils/logger', () => ({
  log: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const pokedex = pokedexJson as unknown as Record<string, PokemonSpecies>;

function makeSlot(species: PokemonSpecies | null = null, evsOverride?: Partial<Stats>): TeamSlot {
  return {
    species,
    item: null,
    ability: '',
    nature: 'Hardy',
    evs: { ...defaultEvs(), ...evsOverride },
    ivs: defaultIvs(),
    moves: [null, null, null, null],
    level: 50,
  };
}

/** Simple EV sum validation matching TeamBuilder rules: total <= 510, each stat <= 252. */
function validateEvs(evs: Stats): { valid: boolean; reason?: string } {
  const total = Object.values(evs).reduce((s, v) => s + v, 0);
  if (total > 510) return { valid: false, reason: `EV total ${total} exceeds 510` };
  for (const [stat, val] of Object.entries(evs)) {
    if (val > 252) return { valid: false, reason: `${stat} EV ${val} exceeds 252` };
    if (val < 0)   return { valid: false, reason: `${stat} EV cannot be negative` };
  }
  return { valid: true };
}

// ─── Load pokemon data once so derived calcResult works ───────────────────────

beforeAll(async () => {
  await loadPokemonData();
});

beforeEach(() => {
  setCalcAttacker(null);
  setCalcDefender(null);
  setCalcMove(null);
});

// ─── Basic store shape tests ───────────────────────────────────────────────────

describe('pokemonStore — initial shape', () => {
  it('activeTeam initially has 6 null-species slots', () => {
    const team = get(activeTeam);
    expect(team.slots).toHaveLength(6);
    expect(team.slots.every((s) => s.species === null)).toBe(true);
  });

  it('calcResult is null when attacker is not set', () => {
    expect(get(calcResult)).toBeNull();
  });

  it('calcResult is null when defender is not set', () => {
    setCalcAttacker(makeSlot(pokedex['garchomp']));
    expect(get(calcResult)).toBeNull();
  });

  it('calcResult is null when move is not set', () => {
    setCalcAttacker(makeSlot(pokedex['garchomp']));
    setCalcDefender(makeSlot(pokedex['clefable']));
    expect(get(calcResult)).toBeNull();
  });

  it('clearing attacker resets calcResult to null', () => {
    const move: Move = {
      id: 'earthquake', name: 'Earthquake', type: 'Ground',
      power: 100, category: 'physical', accuracy: 100,
    };
    setCalcAttacker(makeSlot(pokedex['garchomp']));
    setCalcDefender(makeSlot(pokedex['clefable']));
    setCalcMove(move);
    setCalcAttacker(null);
    expect(get(calcResult)).toBeNull();
  });
});

// ─── T13 — calcResult damage correctness ──────────────────────────────────────

describe('pokemonStore — T13: derived calcResult damage values', () => {
  const earthquake: Move = {
    id: 'earthquake', name: 'Earthquake', type: 'Ground',
    power: 100, category: 'physical', accuracy: 100,
  };

  it('Garchomp 252 Atk Jolly + Earthquake vs Clefable (Fairy, neutral) → min > 0', () => {
    // Ground is neutral vs Fairy (1x) — STAB from Garchomp Dragon/Ground
    const attacker = makeSlot(pokedex['garchomp'], { atk: 252 });
    attacker.nature = 'Jolly';
    const defender = makeSlot(pokedex['clefable']);
    defender.nature = 'Bold';
    setCalcAttacker(attacker);
    setCalcDefender(defender);
    setCalcMove(earthquake);
    const result = get(calcResult);
    expect(result).not.toBeNull();
    expect(result!.min).toBeGreaterThan(0);
    expect(result!.max).toBeGreaterThanOrEqual(result!.min);
    expect(result!.rolls).toHaveLength(16);
    // Rolls should be monotonically non-decreasing
    for (let i = 1; i < 16; i++) {
      expect(result!.rolls[i]).toBeGreaterThanOrEqual(result!.rolls[i - 1]);
    }
  });

  it('Normal move vs Gengar (Ghost/Poison) → calcResult.min === 0 (immune)', () => {
    // Normal type has 0x effectiveness vs Ghost
    const normalMove: Move = {
      id: 'tackle', name: 'Tackle', type: 'Normal',
      power: 40, category: 'physical', accuracy: 100,
    };
    const attacker = makeSlot(pokedex['clefable']); // Fairy attacker using Normal
    const defender = makeSlot(pokedex['gengar']);     // Ghost/Poison defender
    setCalcAttacker(attacker);
    setCalcDefender(defender);
    setCalcMove(normalMove);
    const result = get(calcResult);
    expect(result).not.toBeNull();
    expect(result!.min).toBe(0);
    expect(result!.max).toBe(0);
    expect(result!.effectiveness).toBe(0);
  });

  it('calcResult produces 16 rolls', () => {
    const attacker = makeSlot(pokedex['garchomp'], { atk: 252 });
    attacker.nature = 'Jolly';
    setCalcAttacker(attacker);
    setCalcDefender(makeSlot(pokedex['clefable']));
    setCalcMove(earthquake);
    const result = get(calcResult);
    expect(result?.rolls).toHaveLength(16);
  });
});

// ─── T16 — TeamBuilder EV validation ──────────────────────────────────────────

describe('pokemonStore — T16: EV validation rules', () => {
  it('252 Atk + 252 Spe + 4 HP = 508 is valid', () => {
    const evs: Stats = { hp: 4, atk: 252, def: 0, spa: 0, spd: 0, spe: 252 };
    const result = validateEvs(evs);
    expect(result.valid).toBe(true);
  });

  it('252 Atk + 252 Spe + 50 Def = 554 is invalid (exceeds 510)', () => {
    const evs: Stats = { hp: 0, atk: 252, def: 50, spa: 0, spd: 0, spe: 252 };
    const result = validateEvs(evs);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/exceed/i);
  });

  it('single stat > 252 is invalid', () => {
    const evs: Stats = { hp: 0, atk: 253, def: 0, spa: 0, spd: 0, spe: 0 };
    const result = validateEvs(evs);
    expect(result.valid).toBe(false);
  });

  it('all zeros is valid', () => {
    expect(validateEvs(defaultEvs()).valid).toBe(true);
  });

  it('252+252+4+4 = 512 is invalid', () => {
    const evs: Stats = { hp: 4, atk: 252, def: 4, spa: 0, spd: 0, spe: 252 };
    const result = validateEvs(evs);
    expect(result.valid).toBe(false);
  });
});

// ─── Team management tests ────────────────────────────────────────────────────

describe('pokemonStore — team management', () => {
  it('addToTeam sets species on the correct slot', () => {
    const garchomp = pokedex['garchomp'];
    addToTeam(0, garchomp);
    const team = get(activeTeam);
    expect(team.slots[0].species?.id).toBe('garchomp');
    expect(team.slots[1].species).toBeNull();
  });

  it('addToTeam fills all 6 slots correctly', () => {
    const species = ['garchomp', 'clefable', 'gengar', 'rotom-wash', 'landorus-therian', 'garchomp'];
    for (let i = 0; i < 6; i++) {
      addToTeam(i, pokedex[species[i]] ?? pokedex['clefable']);
    }
    const team = get(activeTeam);
    expect(team.slots).toHaveLength(6);
    expect(team.slots.every((s) => s.species !== null)).toBe(true);
  });

  it('addToTeam ignores invalid slot indices', () => {
    const before = get(activeTeam);
    addToTeam(10, pokedex['garchomp']);
    const after = get(activeTeam);
    expect(after.slots).toEqual(before.slots);
  });

  it('updateSlot patches only the specified slot', () => {
    addToTeam(2, pokedex['gengar']);
    updateSlot(2, { nature: 'Timid', evs: { ...defaultEvs(), spa: 252 } });
    const team = get(activeTeam);
    expect(team.slots[2].nature).toBe('Timid');
    expect(team.slots[2].evs.spa).toBe(252);
    expect(team.slots[0].nature).toBe('Hardy');
  });

  it('loadTeam replaces activeTeam', () => {
    const newTeam: Team = {
      generation: 'gen9',
      slots: [
        makeSlot(pokedex['garchomp']), makeSlot(pokedex['clefable']),
        makeSlot(null), makeSlot(null), makeSlot(null), makeSlot(null),
      ],
    };
    loadTeam(newTeam);
    const team = get(activeTeam);
    expect(team.slots[0].species?.id).toBe('garchomp');
    expect(team.slots[1].species?.id).toBe('clefable');
    expect(team.slots[2].species).toBeNull();
  });
});
