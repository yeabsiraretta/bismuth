/**
 * Campaign service — session management, party state, and lore surfacing.
 */

import type {
  Campaign,
  PartyMember,
  InventoryItem,
  SessionNote,
  SessionLogEntry,
  LoreSurface,
} from '../types/campaign';
import type { StorytellerEntity } from '../types/entity';

const CAMPAIGNS_KEY = 'bismuth-storyteller-campaigns';
const SESSIONS_KEY = 'bismuth-storyteller-sessions';

// ─── Persistence ────────────────────────────────────────────────────────────

export function loadCampaigns(): Campaign[] {
  try {
    const raw = localStorage.getItem(CAMPAIGNS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function persistCampaigns(campaigns: Campaign[]): void {
  try {
    localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(campaigns));
  } catch {
    /* silent */
  }
}

export function loadSessions(): SessionNote[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function persistSessions(sessions: SessionNote[]): void {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch {
    /* silent */
  }
}

// ─── Campaign CRUD ──────────────────────────────────────────────────────────

export function createCampaign(storyId: string, name: string): Campaign {
  return {
    id: crypto.randomUUID(),
    storyId,
    name,
    sessionsFolder: 'Sessions',
    activeSessionId: null,
    activeSceneId: null,
    party: [],
    sharedInventory: [],
    logEntries: [],
  };
}

export function updateCampaign(campaigns: Campaign[], updated: Campaign): Campaign[] {
  return campaigns.map((c) => (c.id === updated.id ? updated : c));
}

export function deleteCampaign(campaigns: Campaign[], id: string): Campaign[] {
  return campaigns.filter((c) => c.id !== id);
}

// ─── Party management ───────────────────────────────────────────────────────

export function addPartyMember(
  campaign: Campaign,
  entityId: string,
  name: string,
  maxHp: number
): Campaign {
  const member: PartyMember = {
    id: crypto.randomUUID(),
    entityId,
    name,
    hp: maxHp,
    maxHp,
    conditions: [],
    isActive: true,
  };
  return { ...campaign, party: [...campaign.party, member] };
}

export function updatePartyMemberHp(campaign: Campaign, memberId: string, hp: number): Campaign {
  return {
    ...campaign,
    party: campaign.party.map((m) =>
      m.id === memberId ? { ...m, hp: Math.max(0, Math.min(hp, m.maxHp)) } : m
    ),
  };
}

export function togglePartyMemberActive(campaign: Campaign, memberId: string): Campaign {
  return {
    ...campaign,
    party: campaign.party.map((m) => (m.id === memberId ? { ...m, isActive: !m.isActive } : m)),
  };
}

export function addCondition(campaign: Campaign, memberId: string, condition: string): Campaign {
  return {
    ...campaign,
    party: campaign.party.map((m) =>
      m.id === memberId && !m.conditions.includes(condition)
        ? { ...m, conditions: [...m.conditions, condition] }
        : m
    ),
  };
}

export function removeCondition(campaign: Campaign, memberId: string, condition: string): Campaign {
  return {
    ...campaign,
    party: campaign.party.map((m) =>
      m.id === memberId ? { ...m, conditions: m.conditions.filter((c) => c !== condition) } : m
    ),
  };
}

// ─── Inventory ──────────────────────────────────────────────────────────────

export function addInventoryItem(campaign: Campaign, name: string, quantity = 1): Campaign {
  const item: InventoryItem = {
    id: crypto.randomUUID(),
    name,
    quantity,
    ownerId: null,
    tags: [],
  };
  return { ...campaign, sharedInventory: [...campaign.sharedInventory, item] };
}

export function removeInventoryItem(campaign: Campaign, itemId: string): Campaign {
  return { ...campaign, sharedInventory: campaign.sharedInventory.filter((i) => i.id !== itemId) };
}

export function assignItemOwner(
  campaign: Campaign,
  itemId: string,
  ownerId: string | null
): Campaign {
  return {
    ...campaign,
    sharedInventory: campaign.sharedInventory.map((i) => (i.id === itemId ? { ...i, ownerId } : i)),
  };
}

// ─── Session log ────────────────────────────────────────────────────────────

export function addLogEntry(
  campaign: Campaign,
  sessionId: string,
  type: SessionLogEntry['type'],
  text: string
): Campaign {
  const entry: SessionLogEntry = {
    id: crypto.randomUUID(),
    sessionId,
    timestamp: new Date().toISOString(),
    type,
    text,
  };
  return { ...campaign, logEntries: [...campaign.logEntries, entry] };
}

export function createSessionNote(
  campaignId: string,
  sessionNumber: number,
  title: string,
  notePath: string
): SessionNote {
  return {
    id: crypto.randomUUID(),
    campaignId,
    sessionNumber,
    title,
    notePath,
    date: new Date().toISOString(),
  };
}

// ─── Lore surfacing ─────────────────────────────────────────────────────────

export function surfaceLore(entities: StorytellerEntity[], campaign: Campaign): LoreSurface[] {
  const results: LoreSurface[] = [];
  const partyEntityIds = new Set(campaign.party.map((m) => m.entityId));
  const inventoryNames = new Set(campaign.sharedInventory.map((i) => i.name.toLowerCase()));
  for (const entity of entities) {
    if (partyEntityIds.has(entity.id)) {
      results.push({
        entityId: entity.id,
        entityName: entity.name,
        entityType: entity.type,
        relevance: 'character',
        snippet: entity.description.slice(0, 120),
      });
    }
    if (inventoryNames.has(entity.name.toLowerCase())) {
      results.push({
        entityId: entity.id,
        entityName: entity.name,
        entityType: entity.type,
        relevance: 'inventory',
        snippet: entity.description.slice(0, 120),
      });
    }
  }
  return results;
}
