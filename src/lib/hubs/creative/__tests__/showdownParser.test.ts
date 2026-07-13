/**
 * Showdown paste parser tests.
 */
import { describe, expect, it } from 'vitest';

import itemsJson from '@/config/pokemon/gen9-items.json';
import movesJson from '@/config/pokemon/gen9-moves.json';
import pokedexJson from '@/config/pokemon/gen9-pokedex.json';
import { parseShowdownPaste } from '@/hubs/creative/services/showdownParser';
import type { Item, Move, PokemonSpecies } from '@/hubs/creative/types/pokemon';

const pokedex = pokedexJson as unknown as Record<string, PokemonSpecies>;
const movesDb = movesJson as Record<string, Move>;
const itemsDb = itemsJson as Record<string, Item>;

const FULL_PASTE = `
Garchomp @ Choice Band
Ability: Rough Skin
EVs: 252 Atk / 4 HP / 252 Spe
Jolly Nature
- Earthquake
- Dragon Claw
- Iron Head
- Stone Edge

Clefable @ Leftovers
Ability: Magic Guard
EVs: 252 HP / 252 Def / 4 SpD
Bold Nature
- Moonblast
- Calm Mind
- Stealth Rock
- Protect

Gengar @ Life Orb
Ability: Cursed Body
EVs: 252 SpA / 4 SpD / 252 Spe
Timid Nature
- Shadow Ball
- Sludge Bomb
- Focus Blast
- Nasty Plot

Rotom-Wash @ Assault Vest
Ability: Levitate
EVs: 252 HP / 252 SpA / 4 Spe
Modest Nature
- Thunderbolt
- Hydro Pump
- Volt Switch
- Will-O-Wisp

Kingambit @ Booster Energy
Ability: Supreme Overlord
EVs: 252 Atk / 4 HP / 252 Spe
Adamant Nature
- Iron Head
- Knock Off
- Sucker Punch
- Swords Dance

Gholdengo @ Choice Specs
Ability: Good as Gold
EVs: 252 SpA / 4 SpD / 252 Spe
Timid Nature
- Shadow Ball
- Make It Rain
- Thunderbolt
- Nasty Plot
`.trim();

describe('parseShowdownPaste', () => {
  it('parses a full 6-Pokemon paste correctly', () => {
    const result = parseShowdownPaste(FULL_PASTE, pokedex, movesDb, itemsDb);
    expect('error' in result).toBe(false);
    if ('error' in result) return;

    const recognized = result.team.slots.filter((s) => s.species !== null);
    expect(recognized.length).toBe(6);

    expect(result.team.slots[0].species?.id).toBe('garchomp');
    expect(result.team.slots[0].nature).toBe('Jolly');
    expect(result.team.slots[0].evs.atk).toBe(252);
    expect(result.team.slots[0].evs.spe).toBe(252);
    expect(result.team.slots[0].evs.hp).toBe(4);
    expect(result.team.slots[0].item?.id).toBe('choice-band');
  });

  it('parses EVs correctly — Clefable Bold 252HP/252Def', () => {
    const result = parseShowdownPaste(FULL_PASTE, pokedex, movesDb, itemsDb);
    if ('error' in result) throw new Error('Expected success');
    const clef = result.team.slots[1];
    expect(clef.species?.id).toBe('clefable');
    expect(clef.nature).toBe('Bold');
    expect(clef.evs.hp).toBe(252);
    expect(clef.evs.def).toBe(252);
  });

  it('missing EVs line defaults all stats to 0', () => {
    const paste = `Garchomp
Ability: Rough Skin
Jolly Nature
- Earthquake`;
    const result = parseShowdownPaste(paste, pokedex, movesDb, itemsDb);
    if ('error' in result) throw new Error('Expected success');
    const slot = result.team.slots[0];
    expect(slot.evs.atk).toBe(0);
    expect(slot.evs.hp).toBe(0);
    expect(slot.evs.spe).toBe(0);
  });

  it('unknown move name results in warning, does not block parse', () => {
    const paste = `Garchomp @ Choice Band
Ability: Rough Skin
EVs: 252 Atk / 252 Spe
Jolly Nature
- Earthquake
- FakeMoveXYZ`;
    const result = parseShowdownPaste(paste, pokedex, movesDb, itemsDb);
    if ('error' in result) throw new Error('Expected success');
    expect(result.warnings.some((w) => w.includes('FakeMoveXYZ'))).toBe(true);
    expect(result.team.slots[0].species?.id).toBe('garchomp');
    expect(result.team.slots[0].moves[0]?.id).toBe('earthquake');
  });

  it('empty paste returns a parse error', () => {
    const result = parseShowdownPaste('', pokedex, movesDb, itemsDb);
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error).toBeTruthy();
    }
  });

  it('whitespace-only paste returns a parse error', () => {
    const result = parseShowdownPaste('   \n   \t  ', pokedex, movesDb, itemsDb);
    expect('error' in result).toBe(true);
  });

  it('unknown species produces a warning and leaves slot empty', () => {
    const paste = `SuperFakeMon @ Choice Band
Ability: Overgrow
Jolly Nature
- Earthquake`;
    const result = parseShowdownPaste(paste, pokedex, movesDb, itemsDb);
    if ('error' in result) throw new Error('Expected success');
    expect(result.warnings.some((w) => w.includes('SuperFakeMon'))).toBe(true);
    expect(result.team.slots[0].species).toBeNull();
  });

  it('handles nickname format "Nickname (Species) @ Item"', () => {
    const paste = `Sandy Claws (Garchomp) @ Choice Band
Ability: Rough Skin
EVs: 252 Atk / 252 Spe
Jolly Nature
- Earthquake`;
    const result = parseShowdownPaste(paste, pokedex, movesDb, itemsDb);
    if ('error' in result) throw new Error('Expected success');
    expect(result.team.slots[0].species?.id).toBe('garchomp');
  });

  it('parses without databases (placeholder moves)', () => {
    const paste = `Garchomp
Jolly Nature
- Earthquake
- Dragon Claw`;
    const result = parseShowdownPaste(paste);
    if ('error' in result) throw new Error('Expected success');
    expect(result.team.slots[0].nature).toBe('Jolly');
    expect(result.team.slots[0].moves[0]?.name).toBe('Earthquake');
    expect(result.team.slots[0].moves[1]?.name).toBe('Dragon Claw');
  });
});
