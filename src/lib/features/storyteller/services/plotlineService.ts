/**
 * Plotline service — manage plotlines, beat sheets, setup/payoff, and link scanning.
 */

import type { Plotline, SetupPayoff, PlotgridCell, BeatSheet } from '../types/plotline';
import { BUILTIN_BEAT_SHEETS } from '../types/plotline';
import type { StorytellerEntity } from '../types/entity';

const PLOTLINES_KEY = 'bismuth-storyteller-plotlines';
const SETUPS_KEY = 'bismuth-storyteller-setups';
const PLOTGRID_KEY = 'bismuth-storyteller-plotgrid';

// ─── Plotline persistence ───────────────────────────────────────────────────

export function loadPlotlines(): Plotline[] {
  try { const r = localStorage.getItem(PLOTLINES_KEY); return r ? JSON.parse(r) : []; }
  catch { return []; }
}

export function persistPlotlines(plotlines: Plotline[]): void {
  try { localStorage.setItem(PLOTLINES_KEY, JSON.stringify(plotlines)); } catch { /* */ }
}

export function createPlotline(storyId: string, name: string, color: string): Plotline {
  return { id: crypto.randomUUID(), storyId, name, color, description: '', sceneIds: [], sortOrder: 0 };
}

// ─── Setup/Payoff ───────────────────────────────────────────────────────────

export function loadSetups(): SetupPayoff[] {
  try { const r = localStorage.getItem(SETUPS_KEY); return r ? JSON.parse(r) : []; }
  catch { return []; }
}

export function persistSetups(setups: SetupPayoff[]): void {
  try { localStorage.setItem(SETUPS_KEY, JSON.stringify(setups)); } catch { /* */ }
}

export function createSetup(storyId: string, setupSceneId: string, description: string): SetupPayoff {
  return { id: crypto.randomUUID(), storyId, setupSceneId, payoffSceneId: null, description, resolved: false };
}

export function getUnresolvedSetups(setups: SetupPayoff[], storyId: string): SetupPayoff[] {
  return setups.filter(s => s.storyId === storyId && !s.resolved);
}

// ─── Plotgrid ───────────────────────────────────────────────────────────────

export function loadPlotgridCells(): Record<string, PlotgridCell> {
  try { const r = localStorage.getItem(PLOTGRID_KEY); return r ? JSON.parse(r) : {}; }
  catch { return {}; }
}

export function persistPlotgridCells(cells: Record<string, PlotgridCell>): void {
  try { localStorage.setItem(PLOTGRID_KEY, JSON.stringify(cells)); } catch { /* */ }
}

export function getPlotgridCellKey(sceneId: string, plotlineId: string): string {
  return `${sceneId}::${plotlineId}`;
}

// ─── Beat sheets ────────────────────────────────────────────────────────────

export function getBeatSheets(): BeatSheet[] {
  return BUILTIN_BEAT_SHEETS;
}

export function getBeatSheet(template: string): BeatSheet | undefined {
  return BUILTIN_BEAT_SHEETS.find(b => b.template === template);
}

// ─── Link scanner ───────────────────────────────────────────────────────────

export interface ScannedLink {
  target: string;
  type: 'wikilink' | 'tag' | 'mention';
  entityType: string | null;
  entityId: string | null;
}

export function scanLinks(text: string, entities: StorytellerEntity[]): ScannedLink[] {
  const results: ScannedLink[] = [];
  const wikilinks = text.matchAll(/\[\[([^\]]+)\]\]/g);
  for (const m of wikilinks) {
    const target = m[1].split('|')[0].trim();
    const entity = entities.find(e => e.name.toLowerCase() === target.toLowerCase());
    results.push({ target, type: 'wikilink', entityType: entity?.type ?? null, entityId: entity?.id ?? null });
  }
  const tags = text.matchAll(/#([a-zA-Z][\w-]*)/g);
  for (const m of tags) {
    results.push({ target: m[1], type: 'tag', entityType: null, entityId: null });
  }
  const nameSet = new Map(entities.map(e => [e.name.toLowerCase(), e]));
  const words = text.replace(/\[\[.*?\]\]/g, '').replace(/#[\w-]+/g, '');
  for (const [name, entity] of nameSet) {
    if (name.length >= 3 && words.toLowerCase().includes(name)) {
      results.push({ target: entity.name, type: 'mention', entityType: entity.type, entityId: entity.id });
    }
  }
  return results;
}

// ─── Subway map data ────────────────────────────────────────────────────────

export interface SubwayMapLane {
  plotlineId: string;
  plotlineName: string;
  color: string;
  stops: { sceneId: string; sceneName: string; x: number }[];
}

export function buildSubwayMap(plotlines: Plotline[], scenes: StorytellerEntity[]): SubwayMapLane[] {
  const sceneOrder = new Map(scenes.map((s, i) => [s.id, i]));
  return plotlines.map(pl => ({
    plotlineId: pl.id,
    plotlineName: pl.name,
    color: pl.color,
    stops: pl.sceneIds
      .filter(id => sceneOrder.has(id))
      .sort((a, b) => (sceneOrder.get(a) ?? 0) - (sceneOrder.get(b) ?? 0))
      .map((id) => ({
        sceneId: id,
        sceneName: scenes.find(s => s.id === id)?.name ?? id,
        x: (sceneOrder.get(id) ?? 0) * 120 + 60,
      })),
  }));
}
