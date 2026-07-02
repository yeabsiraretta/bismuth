/**
 * Plotline store — reactive state for plotlines, setup/payoff, and plotgrid.
 */

import { writable, derived, get } from 'svelte/store';
import type { Plotline, SetupPayoff, PlotgridCell } from '../types/plotline';
import * as svc from '../services/plotlineService';
import { activeStoryId } from './storyStore';

export const allPlotlines = writable<Plotline[]>(svc.loadPlotlines());
export const allSetups = writable<SetupPayoff[]>(svc.loadSetups());
export const plotgridCells = writable<Record<string, PlotgridCell>>(svc.loadPlotgridCells());

export const storyPlotlines = derived([allPlotlines, activeStoryId], ([$all, $id]) =>
  $id ? $all.filter((p) => p.storyId === $id) : []
);

export const unresolvedSetups = derived([allSetups, activeStoryId], ([$setups, $id]) =>
  $id ? svc.getUnresolvedSetups($setups, $id) : []
);

// ─── Plotline actions ───────────────────────────────────────────────────────

export function addPlotline(name: string, color = '#7c3aed'): Plotline {
  const storyId = get(activeStoryId);
  if (!storyId) throw new Error('No active story');
  const pl = svc.createPlotline(storyId, name, color);
  allPlotlines.update((list) => {
    const next = [...list, pl];
    svc.persistPlotlines(next);
    return next;
  });
  return pl;
}

export function editPlotline(updated: Plotline): void {
  allPlotlines.update((list) => {
    const next = list.map((p) => (p.id === updated.id ? updated : p));
    svc.persistPlotlines(next);
    return next;
  });
}

export function removePlotline(id: string): void {
  allPlotlines.update((list) => {
    const next = list.filter((p) => p.id !== id);
    svc.persistPlotlines(next);
    return next;
  });
}

export function addSceneToPlotline(plotlineId: string, sceneId: string): void {
  allPlotlines.update((list) => {
    const next = list.map((p) =>
      p.id === plotlineId && !p.sceneIds.includes(sceneId)
        ? { ...p, sceneIds: [...p.sceneIds, sceneId] }
        : p
    );
    svc.persistPlotlines(next);
    return next;
  });
}

export function removeSceneFromPlotline(plotlineId: string, sceneId: string): void {
  allPlotlines.update((list) => {
    const next = list.map((p) =>
      p.id === plotlineId ? { ...p, sceneIds: p.sceneIds.filter((id) => id !== sceneId) } : p
    );
    svc.persistPlotlines(next);
    return next;
  });
}

// ─── Setup/Payoff actions ───────────────────────────────────────────────────

export function addSetup(setupSceneId: string, description: string): SetupPayoff {
  const storyId = get(activeStoryId);
  if (!storyId) throw new Error('No active story');
  const setup = svc.createSetup(storyId, setupSceneId, description);
  allSetups.update((list) => {
    const next = [...list, setup];
    svc.persistSetups(next);
    return next;
  });
  return setup;
}

export function resolveSetup(setupId: string, payoffSceneId: string): void {
  allSetups.update((list) => {
    const next = list.map((s) => (s.id === setupId ? { ...s, payoffSceneId, resolved: true } : s));
    svc.persistSetups(next);
    return next;
  });
}

export function removeSetup(setupId: string): void {
  allSetups.update((list) => {
    const next = list.filter((s) => s.id !== setupId);
    svc.persistSetups(next);
    return next;
  });
}

// ─── Plotgrid actions ───────────────────────────────────────────────────────

export function setPlotgridCell(sceneId: string, plotlineId: string, cell: PlotgridCell): void {
  const key = svc.getPlotgridCellKey(sceneId, plotlineId);
  plotgridCells.update((cells) => {
    const next = { ...cells, [key]: cell };
    svc.persistPlotgridCells(next);
    return next;
  });
}
