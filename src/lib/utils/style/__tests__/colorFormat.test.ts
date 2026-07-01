import { describe, it, expect } from 'vitest';
import {
  hexToRgb,
  rgbToHsl,
  formatColor,
  interpolateColor,
  generateGradientVars,
} from '../colorFormat';

describe('hexToRgb', () => {
  it('parses 6-digit hex', () => {
    expect(hexToRgb('#007AFF')).toEqual({ r: 0, g: 122, b: 255 });
  });

  it('parses 3-digit hex', () => {
    expect(hexToRgb('#f00')).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('handles no hash prefix', () => {
    expect(hexToRgb('6366f1')).toEqual({ r: 99, g: 102, b: 241 });
  });

  it('returns null for invalid', () => {
    expect(hexToRgb('nope')).toBeNull();
  });
});

describe('rgbToHsl', () => {
  it('converts pure red', () => {
    const hsl = rgbToHsl({ r: 255, g: 0, b: 0 });
    expect(hsl.h).toBe(0);
    expect(hsl.s).toBe(100);
    expect(hsl.l).toBe(50);
  });

  it('converts gray', () => {
    const hsl = rgbToHsl({ r: 128, g: 128, b: 128 });
    expect(hsl.h).toBe(0);
    expect(hsl.s).toBe(0);
    expect(hsl.l).toBe(50);
  });
});

describe('formatColor', () => {
  const hex = '#007AFF';

  it('hex format', () => {
    expect(formatColor(hex, 'hex', 'accent')).toEqual({
      '--accent': '#007AFF',
    });
  });

  it('hex format with opacity', () => {
    const result = formatColor(hex, 'hex', 'accent', 0.5);
    expect(result['--accent']).toMatch(/^#007AFF[0-9A-F]{2}$/);
  });

  it('rgb format', () => {
    expect(formatColor(hex, 'rgb', 'accent')).toEqual({
      '--accent': 'rgb(0, 122, 255)',
    });
  });

  it('rgb format with opacity', () => {
    expect(formatColor(hex, 'rgb', 'accent', 0.8)).toEqual({
      '--accent': 'rgba(0, 122, 255, 0.8)',
    });
  });

  it('rgb-values format', () => {
    expect(formatColor(hex, 'rgb-values', 'accent')).toEqual({
      '--accent': '0, 122, 255',
    });
  });

  it('rgb-split format', () => {
    const result = formatColor(hex, 'rgb-split', 'accent');
    expect(result['--accent-r']).toBe('0');
    expect(result['--accent-g']).toBe('122');
    expect(result['--accent-b']).toBe('255');
  });

  it('rgb-split format with opacity', () => {
    const result = formatColor(hex, 'rgb-split', 'accent', 0.5);
    expect(result['--accent-a']).toBe('0.5');
  });

  it('hsl format', () => {
    const result = formatColor(hex, 'hsl', 'accent');
    expect(result['--accent']).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/);
  });

  it('hsl-split format', () => {
    const result = formatColor(hex, 'hsl-split', 'accent');
    expect(result['--accent-h']).toBeDefined();
    expect(result['--accent-s']).toMatch(/%$/);
    expect(result['--accent-l']).toMatch(/%$/);
  });

  it('hsl-split-decimal format', () => {
    const result = formatColor(hex, 'hsl-split-decimal', 'accent');
    expect(result['--accent-h']).toBeDefined();
    expect(parseFloat(result['--accent-s'])).toBeLessThanOrEqual(1);
    expect(parseFloat(result['--accent-l'])).toBeLessThanOrEqual(1);
  });
});

describe('interpolateColor', () => {
  it('returns start color at ratio 0', () => {
    expect(interpolateColor('#000000', '#ffffff', 0)).toBe('#000000');
  });

  it('returns end color at ratio 1', () => {
    expect(interpolateColor('#000000', '#ffffff', 1)).toBe('#ffffff');
  });

  it('returns midpoint at ratio 0.5', () => {
    const mid = interpolateColor('#000000', '#ffffff', 0.5);
    expect(mid).toMatch(/^#[78][0-9a-f][78][0-9a-f][78][0-9a-f]$/);
  });
});

describe('generateGradientVars', () => {
  it('generates correct number of steps', () => {
    const vars = generateGradientVars('color', '#000000', '#ffffff', 25, 'hex');
    const keys = Object.keys(vars);
    expect(keys.length).toBe(5); // 0, 25, 50, 75, 100
  });

  it('pads step numbers when pad specified', () => {
    const vars = generateGradientVars('color', '#000000', '#ffffff', 50, 'hex', 3);
    expect(Object.keys(vars)).toContain('--color-000');
    expect(Object.keys(vars)).toContain('--color-050');
    expect(Object.keys(vars)).toContain('--color-100');
  });
});
