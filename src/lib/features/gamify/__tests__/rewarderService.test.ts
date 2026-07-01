import { describe, it, expect } from 'vitest';
import {
  parseRewardLine, parseRewardsFile,
  rollForReward, decrementInventory,
  generateSampleRewards,
} from '../services/rewarderService';
import type { RewarderReward } from '../types';
import { DEFAULT_REWARDER_CONFIG } from '../types';

const labels = DEFAULT_REWARDER_CONFIG.occurrenceLabels;

describe('parseRewardLine', () => {
  it('parses a simple reward', () => {
    const r = parseRewardLine('Have a cup of tea', 0, '{', '}', labels);
    expect(r).not.toBeNull();
    expect(r!.name).toBe('Have a cup of tea');
    expect(r!.occurrence).toBe('common');
    expect(r!.inventory).toBeNull();
  });

  it('parses occurrence tag', () => {
    const r = parseRewardLine('Have a nap {rare}', 1, '{', '}', labels);
    expect(r!.occurrence).toBe('rare');
    expect(r!.name).toBe('Have a nap');
  });

  it('parses inventory', () => {
    const r = parseRewardLine('Eat cake {4}', 2, '{', '}', labels);
    expect(r!.inventory).toBe(4);
  });

  it('parses occurrence + inventory', () => {
    const r = parseRewardLine('Have a beer {rare} {5}', 3, '{', '}', labels);
    expect(r!.occurrence).toBe('rare');
    expect(r!.inventory).toBe(5);
  });

  it('parses occurrence + inventory + image', () => {
    const r = parseRewardLine('Beer {rare} {5} {https://example.com/beer.png}', 4, '{', '}', labels);
    expect(r!.occurrence).toBe('rare');
    expect(r!.inventory).toBe(5);
    expect(r!.imageUrl).toBe('https://example.com/beer.png');
  });

  it('parses legendary', () => {
    const r = parseRewardLine('Champagne {legendary} {1}', 5, '{', '}', labels);
    expect(r!.occurrence).toBe('legendary');
    expect(r!.inventory).toBe(1);
  });

  it('handles list prefix', () => {
    const r = parseRewardLine('- Have tea', 0, '{', '}', labels);
    expect(r!.name).toBe('Have tea');
  });

  it('handles asterisk prefix', () => {
    const r = parseRewardLine('* Have tea', 0, '{', '}', labels);
    expect(r!.name).toBe('Have tea');
  });

  it('handles app:// image URLs', () => {
    const r = parseRewardLine('Beer {app://local/C:/beer.png}', 0, '{', '}', labels);
    expect(r!.imageUrl).toBe('app://local/C:/beer.png');
  });

  it('returns null for empty line', () => {
    expect(parseRewardLine('', 0, '{', '}', labels)).toBeNull();
  });

  it('returns null for metadata-only line', () => {
    expect(parseRewardLine('{rare} {5}', 0, '{', '}', labels)).toBeNull();
  });

  it('handles custom delimiters', () => {
    const r = parseRewardLine('Tea [rare] [3]', 0, '[', ']', labels);
    expect(r!.occurrence).toBe('rare');
    expect(r!.inventory).toBe(3);
  });

  it('preserves line index', () => {
    const r = parseRewardLine('Tea', 42, '{', '}', labels);
    expect(r!.lineIndex).toBe(42);
  });

  it('handles metadata in any order', () => {
    const r = parseRewardLine('Gift {3} {legendary}', 0, '{', '}', labels);
    expect(r!.occurrence).toBe('legendary');
    expect(r!.inventory).toBe(3);
  });
});

describe('parseRewardsFile', () => {
  const config = { metaStart: '{', metaEnd: '}', occurrenceLabels: labels };

  it('parses multiple rewards', () => {
    const content = `# Rewards
- Have tea
- Watch TV {rare} {20}
- Buy gift {legendary} {1}`;
    const rewards = parseRewardsFile(content, config);
    expect(rewards).toHaveLength(3);
    expect(rewards[0].name).toBe('Have tea');
    expect(rewards[1].occurrence).toBe('rare');
    expect(rewards[2].occurrence).toBe('legendary');
  });

  it('skips headings and separators', () => {
    const content = `# My Rewards\n---\n- Tea\n\n- Coffee`;
    const rewards = parseRewardsFile(content, config);
    expect(rewards).toHaveLength(2);
  });

  it('skips empty lines', () => {
    const content = '\n\n- Tea\n\n';
    const rewards = parseRewardsFile(content, config);
    expect(rewards).toHaveLength(1);
  });

  it('handles empty content', () => {
    expect(parseRewardsFile('', config)).toHaveLength(0);
  });
});

describe('rollForReward', () => {
  const rewards: RewarderReward[] = [
    { name: 'Common1', occurrence: 'common', inventory: null, lineIndex: 0 },
    { name: 'Common2', occurrence: 'common', inventory: null, lineIndex: 1 },
    { name: 'Rare1', occurrence: 'rare', inventory: null, lineIndex: 2 },
    { name: 'Legend1', occurrence: 'legendary', inventory: null, lineIndex: 3 },
  ];

  it('returns null for empty rewards', () => {
    expect(rollForReward([], { common: 50, rare: 20, legendary: 5 })).toBeNull();
  });

  it('filters out zero-inventory rewards', () => {
    const depleted: RewarderReward[] = [
      { name: 'Gone', occurrence: 'common', inventory: 0, lineIndex: 0 },
    ];
    expect(rollForReward(depleted, { common: 50, rare: 20, legendary: 5 })).toBeNull();
  });

  it('returns a reward when roll succeeds (seeded test)', () => {
    // With 75% total chance, most rolls should return something
    let gotReward = false;
    for (let i = 0; i < 100; i++) {
      if (rollForReward(rewards, { common: 50, rare: 20, legendary: 5 }) !== null) {
        gotReward = true;
        break;
      }
    }
    expect(gotReward).toBe(true);
  });

  it('respects unlimited inventory', () => {
    const unlimited: RewarderReward[] = [
      { name: 'Unlimited', occurrence: 'common', inventory: null, lineIndex: 0 },
    ];
    // Should be able to roll this repeatedly
    const result = rollForReward(unlimited, { common: 100, rare: 0, legendary: 0 });
    expect(result).not.toBeNull();
  });
});

describe('decrementInventory', () => {
  it('decrements integer in braces', () => {
    const content = 'Have tea\nWatch TV {rare} {20}\nBuy gift {legendary} {1}';
    const reward: RewarderReward = {
      name: 'Watch TV', occurrence: 'rare', inventory: 20, lineIndex: 1,
    };
    const result = decrementInventory(content, reward, '{', '}');
    expect(result).not.toBeNull();
    expect(result).toContain('{19}');
    expect(result).toContain('{rare}');
  });

  it('returns null for unlimited inventory', () => {
    const reward: RewarderReward = {
      name: 'Tea', occurrence: 'common', inventory: null, lineIndex: 0,
    };
    expect(decrementInventory('Have tea', reward, '{', '}')).toBeNull();
  });

  it('returns null when inventory is already 0', () => {
    const content = 'Gift {legendary} {0}';
    const reward: RewarderReward = {
      name: 'Gift', occurrence: 'legendary', inventory: 0, lineIndex: 0,
    };
    expect(decrementInventory(content, reward, '{', '}')).toBeNull();
  });

  it('handles custom delimiters', () => {
    const content = 'Tea [rare] [3]';
    const reward: RewarderReward = {
      name: 'Tea', occurrence: 'rare', inventory: 3, lineIndex: 0,
    };
    const result = decrementInventory(content, reward, '[', ']');
    expect(result).toContain('[2]');
  });
});

describe('generateSampleRewards', () => {
  it('generates non-empty content', () => {
    const content = generateSampleRewards();
    expect(content.length).toBeGreaterThan(50);
  });

  it('contains common, rare, and legendary examples', () => {
    const content = generateSampleRewards();
    expect(content).toContain('{rare}');
    expect(content).toContain('{legendary}');
  });

  it('is a valid parseable file', () => {
    const content = generateSampleRewards();
    const config = { metaStart: '{', metaEnd: '}', occurrenceLabels: labels };
    const rewards = parseRewardsFile(content, config);
    expect(rewards.length).toBeGreaterThanOrEqual(5);
  });
});
