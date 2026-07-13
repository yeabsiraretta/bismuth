/**
 * Flashcard statistics and deck tree utilities.
 * Ported from v1 scheduler.ts deck/stats sections.
 */

import type {
  DeckNode,
  Flashcard,
  FlashcardStats,
  ReviewEvent,
  ReviewRecord,
} from '@/hubs/knowledge/types/flashcard-types';

export function buildDeckTree(cards: Flashcard[], records: Map<string, ReviewRecord>): DeckNode {
  const root: DeckNode = {
    name: 'All Decks',
    fullPath: '',
    cardCount: 0,
    dueCount: 0,
    children: [],
  };
  const now = new Date();

  for (const card of cards) {
    const parts = card.deck.split('::');
    let node = root;
    let path = '';
    for (const part of parts) {
      path = path ? `${path}::${part}` : part;
      let child = node.children.find((c) => c.name === part);
      if (!child) {
        child = { name: part, fullPath: path, cardCount: 0, dueCount: 0, children: [] };
        node.children.push(child);
      }
      node = child;
    }
    node.cardCount++;
    root.cardCount++;
    const rec = records.get(card.id);
    if (!rec || new Date(rec.nextReview) <= now) {
      node.dueCount++;
      root.dueCount++;
    }
  }

  function propagate(n: DeckNode): void {
    for (const child of n.children) propagate(child);
    if (n.children.length > 0) {
      n.cardCount = n.children.reduce((s, c) => s + c.cardCount, 0);
      n.dueCount = n.children.reduce((s, c) => s + c.dueCount, 0);
    }
  }
  for (const child of root.children) propagate(child);
  root.cardCount = root.children.reduce((s, c) => s + c.cardCount, 0);
  root.dueCount = root.children.reduce((s, c) => s + c.dueCount, 0);

  return root;
}

export function getCardsInDeck(cards: Flashcard[], deckPath: string): Flashcard[] {
  if (!deckPath) return cards;
  return cards.filter((c) => c.deck === deckPath || c.deck.startsWith(deckPath + '::'));
}

export function computeStats(
  cards: Flashcard[],
  records: Map<string, ReviewRecord>,
  events: ReviewEvent[]
): FlashcardStats {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const reviewsToday = events.filter((e) => e.timestamp.startsWith(todayStr)).length;

  const daySet = new Set(events.map((e) => e.timestamp.slice(0, 10)));
  const sortedDays = [...daySet].sort().reverse();
  let currentStreak = 0;
  const checkDate = new Date(now);
  for (const day of sortedDays) {
    const expected = checkDate.toISOString().slice(0, 10);
    if (day === expected) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else break;
  }

  let longestStreak = 0;
  let streak = 0;
  const allDays = [...daySet].sort();
  for (let i = 0; i < allDays.length; i++) {
    if (i === 0) {
      streak = 1;
    } else {
      const prev = new Date(allDays[i - 1]);
      const curr = new Date(allDays[i]);
      streak = curr.getTime() - prev.getTime() <= 86400000 ? streak + 1 : 1;
    }
    longestStreak = Math.max(longestStreak, streak);
  }

  let maturedCards = 0;
  let youngCards = 0;
  let newCards = 0;
  for (const card of cards) {
    const rec = records.get(card.id);
    if (!rec) {
      newCards++;
      continue;
    }
    if (rec.intervalDays >= 21) maturedCards++;
    else youngCards++;
  }

  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString();
  const recentEvents = events.filter((e) => e.timestamp >= thirtyDaysAgo);
  const passCount = recentEvents.filter((e) => e.grade >= 3).length;
  const retentionRate =
    recentEvents.length > 0 ? Math.round((passCount / recentEvents.length) * 100) : 0;

  return {
    totalCards: cards.length,
    totalReviews: events.length,
    reviewsToday,
    currentStreak,
    longestStreak,
    retentionRate,
    maturedCards,
    newCards,
    youngCards,
  };
}
