/**
 * Showdown paste format parser.
 * Converts a Showdown export string into a Team structure.
 */
import { defaultEvs, defaultIvs } from '@/hubs/creative/services/damageCalc';
import type {
  Item,
  Move,
  Nature,
  PokemonSpecies,
  Stats,
  Team,
  TeamSlot,
} from '@/hubs/creative/types/pokemon';
import { log } from '@/utils/log/logger';

export interface ParseResult {
  team: Team;
  warnings: string[];
}

export interface ParseError {
  error: string;
}

function makeEmptySlot(): TeamSlot {
  return {
    species: null,
    item: null,
    ability: '',
    nature: 'Hardy',
    evs: defaultEvs(),
    ivs: defaultIvs(),
    moves: [null, null, null, null],
    level: 50,
  };
}

const EV_STAT_MAP: Record<string, keyof Stats> = {
  HP: 'hp',
  Atk: 'atk',
  Def: 'def',
  SpA: 'spa',
  SpD: 'spd',
  Spe: 'spe',
};

const VALID_NATURES = new Set<string>([
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
]);

function parseEvLine(line: string): Stats {
  const evs = defaultEvs();
  const parts = line.replace(/^EVs:\s*/i, '').split('/');
  for (const part of parts) {
    const m = part.trim().match(/^(\d+)\s+(\w+)$/);
    if (m) {
      const amount = parseInt(m[1], 10);
      const key = EV_STAT_MAP[m[2]];
      if (key) (evs as unknown as Record<string, number>)[key] = amount;
    }
  }
  return evs;
}

/**
 * Parse a Showdown paste into a Team.
 * All parameters after `text` are optional — omit in tests to skip species/move/item lookup.
 * Returns ParseResult on success, ParseError if input is empty.
 */
export function parseShowdownPaste(
  text: string,
  pokedex?: Record<string, PokemonSpecies>,
  movesDb?: Record<string, Move>,
  itemsDb?: Record<string, Item>
): ParseResult | ParseError {
  const trimmed = text.trim();
  if (!trimmed) return { error: 'Paste is empty — nothing to parse.' };

  const warnings: string[] = [];
  const slots: TeamSlot[] = [];

  const blocks = trimmed.split(/\n\s*\n/).filter((b) => b.trim().length > 0);
  if (blocks.length === 0) return { error: 'No Pokémon blocks found in paste.' };

  const count = Math.min(blocks.length, 6);

  for (let i = 0; i < count; i++) {
    const slot = makeEmptySlot();
    const lines = blocks[i]
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) continue;

    const firstLine = lines[0];
    let speciesRaw = firstLine;
    let itemRaw: string | null = null;

    if (firstLine.includes(' @ ')) {
      const atIdx = firstLine.indexOf(' @ ');
      speciesRaw = firstLine.slice(0, atIdx).trim();
      itemRaw = firstLine.slice(atIdx + 3).trim();
    }

    // Handle nickname format: "Nickname (Species)"
    const nicknameMatch = speciesRaw.match(/^.+\((.+)\)$/);
    if (nicknameMatch) speciesRaw = nicknameMatch[1].trim();

    // Species lookup (optional)
    if (pokedex) {
      const key = speciesRaw
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
      const species = pokedex[key] ?? null;
      if (!species) warnings.push(`Unknown species: "${speciesRaw}" — slot ${i + 1} left empty.`);
      else slot.species = species;
    }

    // Item lookup (optional)
    if (itemRaw && itemsDb) {
      const key = itemRaw
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
      const item = itemsDb[key] ?? null;
      if (!item) warnings.push(`Unknown item: "${itemRaw}" on slot ${i + 1}.`);
      else slot.item = item;
    }

    let moveIndex = 0;

    for (let j = 1; j < lines.length; j++) {
      const line = lines[j];
      if (/^Ability:/i.test(line)) {
        slot.ability = line.replace(/^Ability:\s*/i, '').trim();
      } else if (/^EVs:/i.test(line)) {
        slot.evs = parseEvLine(line);
      } else if (/Nature$/i.test(line)) {
        const name = line.replace(/\s*Nature$/i, '').trim();
        if (VALID_NATURES.has(name)) slot.nature = name as Nature;
        else warnings.push(`Unknown nature: "${name}" on slot ${i + 1}.`);
      } else if (/^Level:/i.test(line)) {
        slot.level = parseInt(line.replace(/^Level:\s*/i, ''), 10) || 50;
      } else if (line.startsWith('- ') && moveIndex < 4) {
        const moveName = line.slice(2).trim();
        if (movesDb) {
          const key = moveName
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
          const move = movesDb[key] ?? null;
          if (!move) warnings.push(`Unknown move: "${moveName}" on slot ${i + 1}.`);
          slot.moves[moveIndex] = move;
        } else {
          // Without move DB: create a placeholder with name only for counting
          slot.moves[moveIndex] = {
            id: moveName.toLowerCase().replace(/\s+/g, '-'),
            name: moveName,
            type: 'Normal',
            power: null,
            category: 'status',
            accuracy: null,
          };
        }
        moveIndex++;
      }
    }

    slots.push(slot);
    log.debug('Parsed slot', { index: i, species: slot.species?.id ?? 'unknown' });
  }

  const team: Team = { slots, generation: 'gen9' };
  return { team, warnings };
}
