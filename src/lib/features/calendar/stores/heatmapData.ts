/**
 * Heatmap data store — aggregates daily note frontmatter fields,
 * calendar events, and time tracking into per-day intensity entries
 * for heatmap calendar visualisation.
 */

import { derived, writable } from 'svelte/store';
import { allCalendarItems } from './calendarStore';
import { completedClocks } from '../services/timeClock';
import { log } from '@/utils/logger';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface HeatmapEntry {
  date: string;
  intensity: number;
  label?: string;
  color?: string;
}

export type HeatmapColorScheme = 'green' | 'blue' | 'red' | 'orange' | 'purple';

export interface HeatmapConfig {
  year: number;
  colorScheme: HeatmapColorScheme;
  showCurrentDayBorder: boolean;
  intensityScaleStart: number;
  intensityScaleEnd: number;
  dataSource: HeatmapDataSource;
  customField: string;
}

export type HeatmapDataSource = 'events' | 'time-tracked' | 'word-count' | 'custom-field';

export const COLOR_SCHEMES: Record<HeatmapColorScheme, string[]> = {
  green: ['#c6e48b', '#7bc96f', '#49af5d', '#2e8840', '#196127'],
  blue: ['#8cb9ff', '#69a3ff', '#428bff', '#1872ff', '#0058e2'],
  red: ['#ff9e82', '#ff7b55', '#ff4d1a', '#e73400', '#bd2a00'],
  orange: ['#ffa244', '#fd7f00', '#dd6f00', '#bf6000', '#9b4e00'],
  purple: ['#d4b5ff', '#b88aff', '#9d5fff', '#8234ff', '#6800e0'],
};

// ─── Default config ─────────────────────────────────────────────────────────

const STORAGE_KEY = 'bismuth-heatmap-config';

function loadConfig(): HeatmapConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...defaultConfig(), ...JSON.parse(stored) };
  } catch {
    /* fallthrough */
  }
  return defaultConfig();
}

function defaultConfig(): HeatmapConfig {
  return {
    year: new Date().getFullYear(),
    colorScheme: 'green',
    showCurrentDayBorder: true,
    intensityScaleStart: 0,
    intensityScaleEnd: 0,
    dataSource: 'events',
    customField: 'exercise',
  };
}

export const heatmapConfig = writable<HeatmapConfig>(loadConfig());
heatmapConfig.subscribe((cfg) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  } catch (e) {
    log.warn('Failed to persist heatmap config', { error: String(e) });
  }
});

// ─── Derived heatmap entries ────────────────────────────────────────────────

/** Build heatmap entries from event counts per day. */
export const eventHeatmapEntries = derived(allCalendarItems, ($items): HeatmapEntry[] => {
  const counts = new Map<string, number>();
  for (const item of $items) {
    counts.set(item.date, (counts.get(item.date) ?? 0) + 1);
  }
  return Array.from(counts, ([date, count]) => ({
    date,
    intensity: count,
    label: `${count} event${count !== 1 ? 's' : ''}`,
  }));
});

/** Build heatmap entries from time-tracked minutes per day. */
export const timeHeatmapEntries = derived(completedClocks, ($clocks): HeatmapEntry[] => {
  const minutes = new Map<string, number>();
  for (const c of $clocks) {
    if (!c.stoppedAt || c.durationMinutes === null) continue;
    const d = new Date(c.startedAt);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    minutes.set(dateStr, (minutes.get(dateStr) ?? 0) + c.durationMinutes);
  }
  return Array.from(minutes, ([date, mins]) => ({
    date,
    intensity: mins,
    label: `${Math.round(mins)} min tracked`,
  }));
});

/** Active heatmap entries based on selected data source. */
export const heatmapEntries = derived(
  [heatmapConfig, eventHeatmapEntries, timeHeatmapEntries],
  ([$cfg, $events, $time]): HeatmapEntry[] => {
    switch ($cfg.dataSource) {
      case 'events':
        return $events;
      case 'time-tracked':
        return $time;
      default:
        return $events;
    }
  }
);

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Map a raw intensity value to a 0-4 color-level index. */
export function intensityLevel(value: number, min: number, max: number): number {
  if (max <= min || value <= min) return 0;
  if (value >= max) return 4;
  const ratio = (value - min) / (max - min);
  return Math.min(4, Math.floor(ratio * 5));
}

/** Get the intensity range from entries. */
export function getIntensityRange(
  entries: HeatmapEntry[],
  cfgStart: number,
  cfgEnd: number
): { min: number; max: number } {
  if (entries.length === 0) return { min: 0, max: 1 };
  const values = entries.map((e) => e.intensity);
  const min = cfgStart > 0 ? cfgStart : Math.min(...values);
  const max = cfgEnd > 0 ? cfgEnd : Math.max(...values);
  return { min, max: max <= min ? min + 1 : max };
}

/** Build the full year grid (52-53 weeks x 7 days). */
export function buildYearHeatmapGrid(year: number): string[][] {
  const jan1 = new Date(year, 0, 1);
  const startOffset = jan1.getDay();
  const start = new Date(year, 0, 1 - startOffset);
  const weeks: string[][] = [];
  const current = new Date(start);

  for (let w = 0; w < 53; w++) {
    const week: string[] = [];
    for (let d = 0; d < 7; d++) {
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, '0');
      const day = String(current.getDate()).padStart(2, '0');
      week.push(`${y}-${m}-${day}`);
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
    if (current.getFullYear() > year && current.getDay() === 0) break;
  }
  return weeks;
}
