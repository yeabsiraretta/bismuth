import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
  graphBannerConfig,
  graphBannerEnabled,
  toggleGraphBanner,
  updateGraphBannerConfig,
  resetGraphBannerConfig,
  getGraphBannerConfig,
  setGraphBannerHeight,
  setGraphBannerDepth,
  DEFAULT_BANNER_CONFIG,
} from '../stores/graphBannerStore';

beforeEach(() => {
  localStorage.clear();
  resetGraphBannerConfig();
});

describe('graphBannerConfig', () => {
  it('returns default config', () => {
    const config = get(graphBannerConfig);
    expect(config).toEqual(DEFAULT_BANNER_CONFIG);
    expect(config.enabled).toBe(false);
    expect(config.height).toBe(200);
    expect(config.depth).toBe(1);
  });
});

describe('graphBannerEnabled', () => {
  it('derives enabled state', () => {
    expect(get(graphBannerEnabled)).toBe(false);
  });
});

describe('toggleGraphBanner', () => {
  it('toggles enabled on', () => {
    const result = toggleGraphBanner();
    expect(result).toBe(true);
    expect(get(graphBannerEnabled)).toBe(true);
  });

  it('toggles enabled off', () => {
    toggleGraphBanner(); // on
    const result = toggleGraphBanner(); // off
    expect(result).toBe(false);
    expect(get(graphBannerEnabled)).toBe(false);
  });
});

describe('updateGraphBannerConfig', () => {
  it('updates partial config', () => {
    updateGraphBannerConfig({ height: 300, showLabels: false });
    const config = get(graphBannerConfig);
    expect(config.height).toBe(300);
    expect(config.showLabels).toBe(false);
    expect(config.depth).toBe(1); // unchanged
  });
});

describe('resetGraphBannerConfig', () => {
  it('restores defaults', () => {
    updateGraphBannerConfig({ height: 400, depth: 5, enabled: true });
    resetGraphBannerConfig();
    expect(get(graphBannerConfig)).toEqual(DEFAULT_BANNER_CONFIG);
  });
});

describe('getGraphBannerConfig', () => {
  it('returns current config synchronously', () => {
    updateGraphBannerConfig({ height: 150 });
    const config = getGraphBannerConfig();
    expect(config.height).toBe(150);
  });
});

describe('setGraphBannerHeight', () => {
  it('sets height within bounds', () => {
    setGraphBannerHeight(250);
    expect(get(graphBannerConfig).height).toBe(250);
  });

  it('clamps to minimum 80', () => {
    setGraphBannerHeight(30);
    expect(get(graphBannerConfig).height).toBe(80);
  });

  it('clamps to maximum 400', () => {
    setGraphBannerHeight(600);
    expect(get(graphBannerConfig).height).toBe(400);
  });
});

describe('setGraphBannerDepth', () => {
  it('sets depth within bounds', () => {
    setGraphBannerDepth(3);
    expect(get(graphBannerConfig).depth).toBe(3);
  });

  it('clamps to minimum 1', () => {
    setGraphBannerDepth(0);
    expect(get(graphBannerConfig).depth).toBe(1);
  });

  it('clamps to maximum 5', () => {
    setGraphBannerDepth(10);
    expect(get(graphBannerConfig).depth).toBe(5);
  });
});

describe('localStorage persistence', () => {
  it('persists config to localStorage', () => {
    updateGraphBannerConfig({ height: 280, depth: 3 });
    const raw = localStorage.getItem('bismuth:graph-banner-config');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.height).toBe(280);
    expect(parsed.depth).toBe(3);
  });
});
