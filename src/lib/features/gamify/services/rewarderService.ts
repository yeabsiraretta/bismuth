/**
 * Rewarder service — parse rewards file, roll for rewards, manage inventory.
 *
 * Rewards file format (one per line):
 *   Have a cup of tea
 *   Watch an episode {rare} {20}
 *   Open champagne {legendary} {1}
 *   Have a beer {rare} {5} {https://example.com/beer.png}
 *
 * Metadata in braces: occurrence label, integer (inventory), URL (image).
 */

import type { RewarderReward, RewarderOccurrence, RewarderConfig } from '../types';

/** Parse a single reward line into a RewarderReward. */
export function parseRewardLine(
  line: string,
  lineIndex: number,
  metaStart: string,
  metaEnd: string,
  occurrenceLabels: Record<RewarderOccurrence, string>
): RewarderReward | null {
  const trimmed = line.replace(/^[-*]\s+/, '').trim();
  if (!trimmed) return null;

  const escapedStart = escapeRegExp(metaStart);
  const escapedEnd = escapeRegExp(metaEnd);
  const metaRegex = new RegExp(`${escapedStart}([^${escapedEnd}]*)${escapedEnd}`, 'g');

  let name = trimmed;
  let occurrence: RewarderOccurrence = 'common';
  let inventory: number | null = null;
  let imageUrl: string | undefined;

  const metas: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = metaRegex.exec(trimmed)) !== null) {
    metas.push(match[1].trim());
  }

  // Remove metadata blocks from the name
  name = trimmed.replace(metaRegex, '').trim();
  if (!name) return null;

  // Classify each metadata value
  const labelToOccurrence = buildLabelMap(occurrenceLabels);
  for (const meta of metas) {
    const lower = meta.toLowerCase();
    if (labelToOccurrence.has(lower)) {
      occurrence = labelToOccurrence.get(lower)!;
    } else if (/^https?:\/\//.test(meta) || /^app:\/\//.test(meta)) {
      imageUrl = meta;
    } else if (/^\d+$/.test(meta)) {
      inventory = parseInt(meta, 10);
    }
  }

  return { name, occurrence, inventory, imageUrl, lineIndex };
}

/** Parse the full rewards file content. */
export function parseRewardsFile(
  content: string,
  config: Pick<RewarderConfig, 'metaStart' | 'metaEnd' | 'occurrenceLabels'>
): RewarderReward[] {
  const lines = content.split('\n');
  const rewards: RewarderReward[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('#') || line.startsWith('---')) continue;

    const reward = parseRewardLine(
      line,
      i,
      config.metaStart,
      config.metaEnd,
      config.occurrenceLabels
    );
    if (reward) rewards.push(reward);
  }

  return rewards;
}

/** Roll for a reward based on occurrence chances. Returns the chosen reward or null. */
export function rollForReward(
  rewards: RewarderReward[],
  chances: Record<RewarderOccurrence, number>
): RewarderReward | null {
  // Filter out rewards with zero inventory
  const available = rewards.filter((r) => r.inventory === null || r.inventory > 0);
  if (available.length === 0) return null;

  // Total chance = sum of all occurrence chances
  const totalChance = chances.common + chances.rare + chances.legendary;
  const roll = Math.random() * 100;

  // If roll > totalChance, no reward this time
  if (roll > totalChance) return null;

  // Determine which occurrence tier was rolled
  let occurrence: RewarderOccurrence;
  if (roll <= chances.legendary) {
    occurrence = 'legendary';
  } else if (roll <= chances.legendary + chances.rare) {
    occurrence = 'rare';
  } else {
    occurrence = 'common';
  }

  // Pick from available rewards of that tier
  const tierRewards = available.filter((r) => r.occurrence === occurrence);
  if (tierRewards.length === 0) {
    // Fall back to any available reward
    const fallback = available[Math.floor(Math.random() * available.length)];
    return fallback || null;
  }

  return tierRewards[Math.floor(Math.random() * tierRewards.length)];
}

/**
 * Update a reward's inventory in the file content.
 * Returns the updated file content, or null if no change needed.
 */
export function decrementInventory(
  fileContent: string,
  reward: RewarderReward,
  metaStart: string,
  metaEnd: string
): string | null {
  if (reward.inventory === null) return null;

  const lines = fileContent.split('\n');
  const line = lines[reward.lineIndex];
  if (!line) return null;

  const escapedStart = escapeRegExp(metaStart);
  const escapedEnd = escapeRegExp(metaEnd);
  const invRegex = new RegExp(`${escapedStart}(\\d+)${escapedEnd}`);

  const match = invRegex.exec(line);
  if (!match) return null;

  const current = parseInt(match[1], 10);
  if (current <= 0) return null;

  const newLine = line.replace(invRegex, `${metaStart}${current - 1}${metaEnd}`);
  lines[reward.lineIndex] = newLine;
  return lines.join('\n');
}

/** Generate sample rewards file content. */
export function generateSampleRewards(): string {
  return `# Rewards

- Have a cup of tea
- Take a 10 minute break
- Eat a piece of chocolate {5}
- Watch a YouTube video {rare}
- Take a short walk outside {rare}
- Watch an episode of your favourite series {rare} {20}
- Order takeout for dinner {legendary} {3}
- Buy yourself a small gift {legendary} {1}
`;
}

/** Build a reverse lookup from label string to occurrence key. */
function buildLabelMap(
  labels: Record<RewarderOccurrence, string>
): Map<string, RewarderOccurrence> {
  const map = new Map<string, RewarderOccurrence>();
  for (const [key, label] of Object.entries(labels)) {
    map.set(label.toLowerCase(), key as RewarderOccurrence);
  }
  return map;
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
