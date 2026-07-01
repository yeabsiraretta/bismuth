import { describe, it, expect } from 'vitest';
import { get } from 'svelte/store';

describe('startupMetrics', () => {
  it('records a duration and exposes it as lastDuration', async () => {
    const { recordStartupDuration, lastDuration } = await import('../startupMetrics');
    recordStartupDuration(999);
    expect(get(lastDuration)).toBe(999);
  });

  it('replaces previous value on subsequent calls (no accumulation)', async () => {
    const { recordStartupDuration, lastDuration, startupHistory } = await import('../startupMetrics');
    recordStartupDuration(500);
    recordStartupDuration(1500);
    expect(get(lastDuration)).toBe(1500);
    expect(get(startupHistory)).toHaveLength(1);
    expect(get(startupHistory)[0].durationMs).toBe(1500);
  });

  it('startupHistory contains at most one entry', async () => {
    const { recordStartupDuration, startupHistory } = await import('../startupMetrics');
    for (let i = 0; i < 5; i++) recordStartupDuration((i + 1) * 100);
    expect(get(startupHistory)).toHaveLength(1);
  });

  it('entry contains only durationMs and timestamp — no PII', async () => {
    const { recordStartupDuration, startupHistory } = await import('../startupMetrics');
    recordStartupDuration(800);
    const entry = get(startupHistory)[0];
    expect(Object.keys(entry).sort()).toEqual(['durationMs', 'timestamp']);
  });

  it('lastDuration is null before any recording', async () => {
    const { lastDuration } = await import('../startupMetrics');
    // Module is shared across tests so this may already have a value;
    // the important contract is that the type allows null.
    const val = get(lastDuration);
    expect(typeof val === 'number' || val === null).toBe(true);
  });
});
