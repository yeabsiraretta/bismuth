/**
 * Campaign store — reactive state for campaign play mode.
 */

import { writable, derived, get } from 'svelte/store';
import type { Campaign, SessionNote, SessionLogEntry } from '../types/campaign';
import * as svc from '../services/campaignService';
import { activeStoryId } from './storyStore';

export const campaigns = writable<Campaign[]>(svc.loadCampaigns());
export const sessionNotes = writable<SessionNote[]>(svc.loadSessions());
export const activeCampaignId = writable<string | null>(null);

export const activeCampaign = derived([campaigns, activeCampaignId], ([$campaigns, $id]) =>
  $campaigns.find(c => c.id === $id) ?? null,
);

export const storyCampaigns = derived([campaigns, activeStoryId], ([$campaigns, $storyId]) =>
  $storyId ? $campaigns.filter(c => c.storyId === $storyId) : [],
);

export const activeSessions = derived([sessionNotes, activeCampaignId], ([$sessions, $id]) =>
  $id ? $sessions.filter(s => s.campaignId === $id).sort((a, b) => a.sessionNumber - b.sessionNumber) : [],
);

export const activeSessionLog = derived(activeCampaign, ($c) =>
  $c?.logEntries ?? [],
);

// ─── Actions ────────────────────────────────────────────────────────────────

export function createNewCampaign(name: string): Campaign {
  const storyId = get(activeStoryId);
  if (!storyId) throw new Error('No active story');
  const campaign = svc.createCampaign(storyId, name);
  campaigns.update(list => {
    const next = [...list, campaign];
    svc.persistCampaigns(next);
    return next;
  });
  activeCampaignId.set(campaign.id);
  return campaign;
}

export function selectCampaign(id: string | null): void {
  activeCampaignId.set(id);
}

export function removeCampaign(id: string): void {
  campaigns.update(list => {
    const next = svc.deleteCampaign(list, id);
    svc.persistCampaigns(next);
    return next;
  });
  activeCampaignId.update(cur => cur === id ? null : cur);
}

function updateActiveCampaign(fn: (c: Campaign) => Campaign): void {
  campaigns.update(list => {
    const next = list.map(c => c.id === get(activeCampaignId) ? fn(c) : c);
    svc.persistCampaigns(next);
    return next;
  });
}

export function addPartyMember(entityId: string, name: string, maxHp: number): void {
  updateActiveCampaign(c => svc.addPartyMember(c, entityId, name, maxHp));
}

export function updateMemberHp(memberId: string, hp: number): void {
  updateActiveCampaign(c => svc.updatePartyMemberHp(c, memberId, hp));
}

export function toggleMemberActive(memberId: string): void {
  updateActiveCampaign(c => svc.togglePartyMemberActive(c, memberId));
}

export function addMemberCondition(memberId: string, condition: string): void {
  updateActiveCampaign(c => svc.addCondition(c, memberId, condition));
}

export function removeMemberCondition(memberId: string, condition: string): void {
  updateActiveCampaign(c => svc.removeCondition(c, memberId, condition));
}

export function addItem(name: string, quantity = 1): void {
  updateActiveCampaign(c => svc.addInventoryItem(c, name, quantity));
}

export function removeItem(itemId: string): void {
  updateActiveCampaign(c => svc.removeInventoryItem(c, itemId));
}

export function assignOwner(itemId: string, ownerId: string | null): void {
  updateActiveCampaign(c => svc.assignItemOwner(c, itemId, ownerId));
}

export function addLog(type: SessionLogEntry['type'], text: string): void {
  const sessionId = get(activeCampaign)?.activeSessionId ?? '';
  updateActiveCampaign(c => svc.addLogEntry(c, sessionId, type, text));
}

export function setActiveScene(sceneId: string | null): void {
  updateActiveCampaign(c => ({ ...c, activeSceneId: sceneId }));
}

export function addSession(title: string, notePath: string): void {
  const campaignId = get(activeCampaignId);
  if (!campaignId) return;
  const existing = get(sessionNotes).filter(s => s.campaignId === campaignId);
  const session = svc.createSessionNote(campaignId, existing.length + 1, title, notePath);
  sessionNotes.update(list => {
    const next = [...list, session];
    svc.persistSessions(next);
    return next;
  });
  updateActiveCampaign(c => ({ ...c, activeSessionId: session.id }));
}
