/**
 * Element CRUD service — create, read, update, delete RPG elements.
 * Persists to localStorage. All state mutations go through this service.
 */

import type { RpgElement, ElementType, RpgCampaign } from '../types';
import { generatePrefixedId } from '@/utils/id';
import { log } from '@/utils/logger';

const STORAGE_KEY = 'bismuth-rpg-elements';
const CAMPAIGNS_KEY = 'bismuth-rpg-campaigns';

// ─── Persistence ─────────────────────────────────────────────────────────────

function loadElements(): RpgElement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveElements(elements: RpgElement[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(elements));
  } catch {
    log.warn('Failed to persist RPG elements');
  }
}

export function loadCampaigns(): RpgCampaign[] {
  try {
    const raw = localStorage.getItem(CAMPAIGNS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCampaigns(campaigns: RpgCampaign[]): void {
  try {
    localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(campaigns));
  } catch {
    log.warn('Failed to persist RPG campaigns');
  }
}

// ─── Campaign CRUD ──────────────────────────────────────────────────────────

export function createCampaign(name: string, description: string = ''): RpgCampaign {
  const now = new Date().toISOString();
  const campaign: RpgCampaign = {
    id: generatePrefixedId('rpg-c'),
    name,
    description,
    createdAt: now,
    modifiedAt: now,
  };
  const all = loadCampaigns();
  all.push(campaign);
  saveCampaigns(all);
  log.info('RPG campaign created', { id: campaign.id, name });
  return campaign;
}

export function updateCampaign(id: string, partial: Partial<RpgCampaign>): RpgCampaign | null {
  const all = loadCampaigns();
  const idx = all.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...partial, modifiedAt: new Date().toISOString() };
  saveCampaigns(all);
  return all[idx];
}

export function deleteCampaign(id: string): void {
  const campaigns = loadCampaigns().filter((c) => c.id !== id);
  saveCampaigns(campaigns);
  const elements = loadElements().filter((e) => e.campaignId !== id);
  saveElements(elements);
  log.info('RPG campaign deleted', { id });
}

export function getCampaign(id: string): RpgCampaign | null {
  return loadCampaigns().find((c) => c.id === id) ?? null;
}

// ─── Element CRUD ────────────────────────────────────────────────────────────

export function createElement(
  type: ElementType,
  name: string,
  campaignId: string | null,
  parentId: string | null = null,
  description: string = ''
): RpgElement {
  const now = new Date().toISOString();
  const siblings = loadElements().filter(
    (e) => e.type === type && e.campaignId === campaignId && e.parentId === parentId
  );
  const element: RpgElement = {
    id: generatePrefixedId(`rpg-${type.slice(0, 3)}`),
    type,
    name,
    campaignId,
    parentId,
    description,
    sortOrder: siblings.length,
    createdAt: now,
    modifiedAt: now,
  };
  const all = loadElements();
  all.push(element);
  saveElements(all);
  log.info('RPG element created', { id: element.id, type, name });
  return element;
}

export function updateElement(id: string, partial: Partial<RpgElement>): RpgElement | null {
  const all = loadElements();
  const idx = all.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...partial, modifiedAt: new Date().toISOString() };
  saveElements(all);
  return all[idx];
}

export function deleteElement(id: string): void {
  let all = loadElements();
  // Cascade delete children
  const toDelete = new Set<string>([id]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const el of all) {
      if (el.parentId && toDelete.has(el.parentId) && !toDelete.has(el.id)) {
        toDelete.add(el.id);
        changed = true;
      }
    }
  }
  all = all.filter((e) => !toDelete.has(e.id));
  saveElements(all);
  log.info('RPG element deleted', { id, cascaded: toDelete.size });
}

export function getElementById(id: string): RpgElement | null {
  return loadElements().find((e) => e.id === id) ?? null;
}

export function getElementsByCampaign(campaignId: string): RpgElement[] {
  return loadElements().filter((e) => e.campaignId === campaignId);
}

export function getElementsByType(type: ElementType, campaignId?: string): RpgElement[] {
  return loadElements().filter(
    (e) => e.type === type && (campaignId === undefined || e.campaignId === campaignId)
  );
}

export function getChildren(parentId: string): RpgElement[] {
  return loadElements()
    .filter((e) => e.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getGlobalAssets(): RpgElement[] {
  return loadElements().filter((e) => e.campaignId === null);
}

export function reorderElements(ids: string[]): void {
  const all = loadElements();
  for (let i = 0; i < ids.length; i++) {
    const el = all.find((e) => e.id === ids[i]);
    if (el) el.sortOrder = i;
  }
  saveElements(all);
}

export function getAllElements(): RpgElement[] {
  return loadElements();
}
