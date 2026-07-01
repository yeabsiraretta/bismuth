import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('@/utils/logger', () => ({
  log: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import {
  activePeriodType,
  activeDate,
  periodicSettings,
  navigateNext,
  navigatePrevious,
  navigateToday,
} from '../stores/periodic';

describe('Periodic Notes Store', () => {
  beforeEach(() => {
    activePeriodType.set('daily');
    activeDate.set(new Date().toISOString().slice(0, 10));
  });

  it('defaults to daily period type', () => {
    expect(get(activePeriodType)).toBe('daily');
  });

  it('changes period type', () => {
    activePeriodType.set('weekly');
    expect(get(activePeriodType)).toBe('weekly');
  });

  it('navigateToday resets to current date', () => {
    activeDate.set('2020-01-01');
    navigateToday();
    const today = new Date().toISOString().slice(0, 10);
    expect(get(activeDate)).toBe(today);
  });

  it('navigateNext advances the date by one day for daily period', () => {
    activeDate.set('2025-06-15');
    activePeriodType.set('daily');
    navigateNext();
    expect(get(activeDate)).toBe('2025-06-16');
  });

  it('navigatePrevious goes back by one day for daily period', () => {
    activeDate.set('2025-06-15');
    activePeriodType.set('daily');
    navigatePrevious();
    expect(get(activeDate)).toBe('2025-06-14');
  });

  it('has default periodic settings with daily config', () => {
    const settings = get(periodicSettings);
    expect(settings.configs.daily).toBeDefined();
    expect(settings.configs.daily.folder).toBeTruthy();
    expect(settings.configs.daily.dateFormat).toBeTruthy();
  });

  it('navigateNext advances by 7 days for weekly', () => {
    activeDate.set('2025-06-15');
    activePeriodType.set('weekly');
    navigateNext();
    expect(get(activeDate)).toBe('2025-06-22');
  });
});
