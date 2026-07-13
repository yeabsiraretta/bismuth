/**
 * Type coverage logic verification via type chart data.
 */
import { describe, expect, it } from 'vitest';

import typeChartData from '@/config/pokemon/gen9-types.json';
import type { Stats } from '@/hubs/creative/types/pokemon';

const typeChart = typeChartData as Record<string, Record<string, number>>;

describe('Type coverage logic', () => {
  it('Fire moves hit Grass, Ice, Steel, Bug super-effectively (2x)', () => {
    const fireTargets = Object.entries(typeChart['Fire'] ?? {})
      .filter(([, v]) => v >= 2)
      .map(([k]) => k);
    expect(fireTargets).toContain('Grass');
    expect(fireTargets).toContain('Ice');
    expect(fireTargets).toContain('Steel');
    expect(fireTargets).toContain('Bug');
  });

  it('Fire moves do not super-effectively hit Water', () => {
    expect(typeChart['Fire']['Water']).toBeLessThan(2);
  });

  it('Water hits Fire/Rock/Ground super-effectively', () => {
    expect(typeChart['Water']['Fire']).toBeGreaterThanOrEqual(2);
    expect(typeChart['Water']['Rock']).toBeGreaterThanOrEqual(2);
    expect(typeChart['Water']['Ground']).toBeGreaterThanOrEqual(2);
  });

  it('Normal has 0x effectiveness vs Ghost', () => {
    expect(typeChart['Normal']['Ghost']).toBe(0);
  });

  it('Ground is immune to Electric', () => {
    expect(typeChart['Electric']['Ground']).toBe(0);
  });
});

describe('EV validation rules', () => {
  function validateEvs(evs: Stats): { valid: boolean; reason?: string } {
    const total = Object.values(evs).reduce((s, v) => s + v, 0);
    if (total > 510) return { valid: false, reason: `EV total ${total} exceeds 510` };
    for (const [stat, val] of Object.entries(evs)) {
      if (val > 252) return { valid: false, reason: `${stat} EV ${val} exceeds 252` };
      if (val < 0) return { valid: false, reason: `${stat} EV cannot be negative` };
    }
    return { valid: true };
  }

  it('252 Atk + 252 Spe + 4 HP = 508 is valid', () => {
    const evs: Stats = { hp: 4, atk: 252, def: 0, spa: 0, spd: 0, spe: 252 };
    expect(validateEvs(evs).valid).toBe(true);
  });

  it('252 Atk + 252 Spe + 50 Def = 554 is invalid', () => {
    const evs: Stats = { hp: 0, atk: 252, def: 50, spa: 0, spd: 0, spe: 252 };
    expect(validateEvs(evs).valid).toBe(false);
  });

  it('single stat > 252 is invalid', () => {
    const evs: Stats = { hp: 0, atk: 253, def: 0, spa: 0, spd: 0, spe: 0 };
    expect(validateEvs(evs).valid).toBe(false);
  });

  it('all zeros is valid', () => {
    const evs: Stats = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
    expect(validateEvs(evs).valid).toBe(true);
  });
});
