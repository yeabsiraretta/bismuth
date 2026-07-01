/**
 * RPG Manager store — reactive state for campaigns, elements, and UI.
 */

import { writable, derived, get } from 'svelte/store';
import type { RpgElement, RpgCampaign, ElementType, Relationship } from '../types';
import * as elSvc from '../services/elementService';
import * as relSvc from '../services/relationshipService';
import { log } from '@/utils/logger';

// ─── Core stores ────────────────────────────────────────────────────────────

export const campaigns = writable<RpgCampaign[]>(elSvc.loadCampaigns());
export const activeCampaignId = writable<string | null>(null);
export const activeElementId = writable<string | null>(null);
export const elements = writable<RpgElement[]>(elSvc.getAllElements());
export const relationships = writable<Relationship[]>(relSvc.getAllRelationships());

// ─── Derived stores ─────────────────────────────────────────────────────────

export const activeCampaign = derived(
  [campaigns, activeCampaignId],
  ([$camps, $id]) => $camps.find((c) => c.id === $id) ?? null,
);

export const activeElement = derived(
  [elements, activeElementId],
  ([$els, $id]) => $els.find((e) => e.id === $id) ?? null,
);

export const campaignElements = derived(
  [elements, activeCampaignId],
  ([$els, $id]) => $id ? $els.filter((e) => e.campaignId === $id) : [],
);

export const elementsByType = derived(campaignElements, ($els) => {
  const map: Partial<Record<ElementType, RpgElement[]>> = {};
  for (const el of $els) {
    (map[el.type] ??= []).push(el);
  }
  return map;
});

// ─── Refresh helpers ─────────────────────────────────────────────────────────

function refreshAll(): void {
  campaigns.set(elSvc.loadCampaigns());
  elements.set(elSvc.getAllElements());
  relationships.set(relSvc.getAllRelationships());
}

// ─── Campaign actions ────────────────────────────────────────────────────────

export function createNewCampaign(name: string, description: string = ''): RpgCampaign {
  const c = elSvc.createCampaign(name, description);
  refreshAll();
  activeCampaignId.set(c.id);
  return c;
}

export function selectCampaign(id: string): void {
  activeCampaignId.set(id);
  activeElementId.set(null);
  log.debug('RPG campaign selected', { id });
}

export function removeCampaign(id: string): void {
  elSvc.deleteCampaign(id);
  relSvc.deleteRelationshipsForElement(id);
  if (get(activeCampaignId) === id) {
    activeCampaignId.set(null);
    activeElementId.set(null);
  }
  refreshAll();
}

// ─── Element actions ─────────────────────────────────────────────────────────

export function createNewElement(
  type: ElementType, name: string, parentId: string | null = null,
): RpgElement {
  const cid = get(activeCampaignId);
  const el = elSvc.createElement(type, name, cid, parentId);
  refreshAll();
  activeElementId.set(el.id);
  return el;
}

export function selectElement(id: string): void {
  activeElementId.set(id);
}

export function updateActiveElement(partial: Partial<RpgElement>): void {
  const id = get(activeElementId);
  if (!id) return;
  elSvc.updateElement(id, partial);
  refreshAll();
}

export function removeElement(id: string): void {
  elSvc.deleteElement(id);
  relSvc.deleteRelationshipsForElement(id);
  if (get(activeElementId) === id) activeElementId.set(null);
  refreshAll();
}

// ─── Relationship actions ────────────────────────────────────────────────────

export function addRelationship(
  sourceId: string, targetId: string,
  type: import('../types').RelationshipType = 'bidirectional',
  description: string = '',
): void {
  relSvc.createRelationship(sourceId, targetId, type, description);
  refreshAll();
}

export function removeRelationship(id: string): void {
  relSvc.deleteRelationship(id);
  refreshAll();
}
