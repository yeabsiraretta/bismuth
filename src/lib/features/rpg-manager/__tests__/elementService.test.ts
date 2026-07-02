import { describe, it, expect, beforeEach } from 'vitest';
import {
  createCampaign,
  getCampaign,
  updateCampaign,
  deleteCampaign,
  loadCampaigns,
  createElement,
  getElementById,
  getElementsByCampaign,
  getElementsByType,
  getChildren,
  updateElement,
  deleteElement,
  reorderElements,
  getGlobalAssets,
} from '../services/elementService';

beforeEach(() => {
  localStorage.clear();
});

describe('Campaign CRUD', () => {
  it('creates a campaign', () => {
    const c = createCampaign('Dragon Age', 'A dark fantasy');
    expect(c.id).toMatch(/^rpg-c_/);
    expect(c.name).toBe('Dragon Age');
    expect(c.description).toBe('A dark fantasy');
  });

  it('loads persisted campaigns', () => {
    createCampaign('C1');
    createCampaign('C2');
    const all = loadCampaigns();
    expect(all).toHaveLength(2);
  });

  it('gets campaign by id', () => {
    const c = createCampaign('Test');
    expect(getCampaign(c.id)?.name).toBe('Test');
    expect(getCampaign('nonexistent')).toBeNull();
  });

  it('updates a campaign', () => {
    const c = createCampaign('Old Name');
    const updated = updateCampaign(c.id, { name: 'New Name' });
    expect(updated?.name).toBe('New Name');
  });

  it('deletes campaign and its elements', () => {
    const c = createCampaign('DoDelete');
    createElement('npc', 'NPC1', c.id);
    deleteCampaign(c.id);
    expect(getCampaign(c.id)).toBeNull();
    expect(getElementsByCampaign(c.id)).toHaveLength(0);
  });
});

describe('Element CRUD', () => {
  it('creates an element with auto sort order', () => {
    const c = createCampaign('C');
    const e1 = createElement('npc', 'Gandalf', c.id);
    const e2 = createElement('npc', 'Saruman', c.id);
    expect(e1.sortOrder).toBe(0);
    expect(e2.sortOrder).toBe(1);
  });

  it('gets element by id', () => {
    const c = createCampaign('C');
    const el = createElement('location', 'Rivendell', c.id);
    expect(getElementById(el.id)?.name).toBe('Rivendell');
    expect(getElementById('nope')).toBeNull();
  });

  it('filters by campaign', () => {
    const c1 = createCampaign('C1');
    const c2 = createCampaign('C2');
    createElement('event', 'E1', c1.id);
    createElement('event', 'E2', c2.id);
    createElement('event', 'E3', c1.id);
    expect(getElementsByCampaign(c1.id)).toHaveLength(2);
    expect(getElementsByCampaign(c2.id)).toHaveLength(1);
  });

  it('filters by type', () => {
    const c = createCampaign('C');
    createElement('npc', 'N1', c.id);
    createElement('location', 'L1', c.id);
    createElement('npc', 'N2', c.id);
    expect(getElementsByType('npc', c.id)).toHaveLength(2);
    expect(getElementsByType('location', c.id)).toHaveLength(1);
  });

  it('gets children of a parent', () => {
    const c = createCampaign('C');
    const adv = createElement('adventure', 'A1', c.id);
    const _ch1 = createElement('chapter', 'Ch1', c.id, adv.id);
    const _ch2 = createElement('chapter', 'Ch2', c.id, adv.id);
    const children = getChildren(adv.id);
    expect(children).toHaveLength(2);
    expect(children[0].name).toBe('Ch1');
  });

  it('updates an element', () => {
    const c = createCampaign('C');
    const el = createElement('npc', 'Old', c.id);
    const updated = updateElement(el.id, { name: 'New', occupation: 'Wizard' });
    expect(updated?.name).toBe('New');
    expect(updated?.occupation).toBe('Wizard');
  });

  it('cascade-deletes children', () => {
    const c = createCampaign('C');
    const adv = createElement('adventure', 'A', c.id);
    createElement('chapter', 'Ch1', c.id, adv.id);
    createElement('chapter', 'Ch2', c.id, adv.id);
    deleteElement(adv.id);
    expect(getElementsByCampaign(c.id)).toHaveLength(0);
  });

  it('reorders elements', () => {
    const c = createCampaign('C');
    const e1 = createElement('scene', 'S1', c.id);
    const e2 = createElement('scene', 'S2', c.id);
    const e3 = createElement('scene', 'S3', c.id);
    reorderElements([e3.id, e1.id, e2.id]);
    const reordered = getElementsByType('scene', c.id).sort((a, b) => a.sortOrder - b.sortOrder);
    expect(reordered[0].name).toBe('S3');
    expect(reordered[1].name).toBe('S1');
    expect(reordered[2].name).toBe('S2');
  });

  it('supports global assets (null campaign)', () => {
    createElement('npc', 'Global NPC', null);
    createElement('location', 'Global Loc', null);
    const globals = getGlobalAssets();
    expect(globals).toHaveLength(2);
  });
});
