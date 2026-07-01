/**
 * Color format conversion utility for CSS Style Settings.
 * Converts hex colors to various CSS output formats per the
 * Obsidian Style Settings specification.
 * Uses colord for reliable color parsing and conversion.
 */

import { colord } from 'colord';

export type ColorFormat =
  | 'hex'
  | 'rgb'
  | 'rgb-values'
  | 'rgb-split'
  | 'hsl'
  | 'hsl-values'
  | 'hsl-split'
  | 'hsl-split-decimal';

interface RGB { r: number; g: number; b: number; }
interface HSL { h: number; s: number; l: number; }

/** Parse a hex color string to RGB components (0-255) */
export function hexToRgb(hex: string): RGB | null {
  const normalized = hex.startsWith('#') ? hex : `#${hex}`;
  const c = colord(normalized);
  if (!c.isValid()) return null;
  const { r, g, b } = c.toRgb();
  return { r, g, b };
}

/** Convert RGB (0-255) to HSL */
export function rgbToHsl(rgb: RGB): HSL {
  const { h, s, l } = colord({ r: rgb.r, g: rgb.g, b: rgb.b }).toHsl();
  return { h: Math.round(h), s: Math.round(s), l: Math.round(l) };
}

/**
 * Format a hex color into the specified CSS output format.
 * Returns a Record of CSS variable name → value pairs.
 *
 * @param hex - The hex color value (e.g., '#007AFF')
 * @param format - One of the 8 supported format strings
 * @param varName - The CSS variable name (without --)
 * @param opacity - Optional opacity value (0-1). Enables opacity output.
 */
export function formatColor(
  hex: string,
  format: ColorFormat,
  varName: string,
  opacity?: number,
): Record<string, string> {
  const rgb = hexToRgb(hex);
  if (!rgb) return { [`--${varName}`]: hex };

  const hsl = rgbToHsl(rgb);
  const hasOpacity = opacity !== undefined && opacity !== null;
  const a = hasOpacity ? opacity : 1;

  switch (format) {
    case 'hex': {
      if (hasOpacity) {
        const alphaHex = Math.round(a * 255).toString(16).padStart(2, '0').toUpperCase();
        return { [`--${varName}`]: `${hex}${alphaHex}` };
      }
      return { [`--${varName}`]: hex };
    }

    case 'rgb': {
      if (hasOpacity) {
        return { [`--${varName}`]: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})` };
      }
      return { [`--${varName}`]: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` };
    }

    case 'rgb-values': {
      if (hasOpacity) {
        return { [`--${varName}`]: `${rgb.r}, ${rgb.g}, ${rgb.b}, ${a}` };
      }
      return { [`--${varName}`]: `${rgb.r}, ${rgb.g}, ${rgb.b}` };
    }

    case 'rgb-split': {
      const result: Record<string, string> = {
        [`--${varName}-r`]: String(rgb.r),
        [`--${varName}-g`]: String(rgb.g),
        [`--${varName}-b`]: String(rgb.b),
      };
      if (hasOpacity) result[`--${varName}-a`] = String(a);
      return result;
    }

    case 'hsl': {
      if (hasOpacity) {
        return { [`--${varName}`]: `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${a})` };
      }
      return { [`--${varName}`]: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` };
    }

    case 'hsl-values': {
      if (hasOpacity) {
        return { [`--${varName}`]: `${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${a}` };
      }
      return { [`--${varName}`]: `${hsl.h}, ${hsl.s}%, ${hsl.l}%` };
    }

    case 'hsl-split': {
      const result: Record<string, string> = {
        [`--${varName}-h`]: String(hsl.h),
        [`--${varName}-s`]: `${hsl.s}%`,
        [`--${varName}-l`]: `${hsl.l}%`,
      };
      if (hasOpacity) result[`--${varName}-a`] = String(a);
      return result;
    }

    case 'hsl-split-decimal': {
      const result: Record<string, string> = {
        [`--${varName}-h`]: String(hsl.h),
        [`--${varName}-s`]: String(hsl.s / 100),
        [`--${varName}-l`]: String(hsl.l / 100),
      };
      if (hasOpacity) result[`--${varName}-a`] = String(a);
      return result;
    }

    default:
      return { [`--${varName}`]: hex };
  }
}

/**
 * Interpolate between two hex colors at a given ratio (0-1).
 * Used for color-gradient generation.
 */
export function interpolateColor(fromHex: string, toHex: string, ratio: number): string {
  const from = colord(fromHex);
  const to = colord(toHex);
  if (!from.isValid() || !to.isValid()) return fromHex;

  const fRgb = from.toRgb();
  const tRgb = to.toRgb();
  const r = Math.round(fRgb.r + (tRgb.r - fRgb.r) * ratio);
  const g = Math.round(fRgb.g + (tRgb.g - fRgb.g) * ratio);
  const b = Math.round(fRgb.b + (tRgb.b - fRgb.b) * ratio);

  return colord({ r, g, b }).toHex();
}

/**
 * Generate gradient color stops between two colors.
 * Returns CSS variable entries for each step.
 */
export function generateGradientVars(
  varName: string,
  fromHex: string,
  toHex: string,
  step: number,
  format: ColorFormat,
  pad?: number,
): Record<string, string> {
  const vars: Record<string, string> = {};

  for (let i = 0; i <= 100; i += step) {
    const ratio = i / 100;
    const color = interpolateColor(fromHex, toHex, ratio);
    const suffix = pad ? String(i).padStart(pad, '0') : String(i);
    const stepVarName = `${varName}-${suffix}`;
    const formatted = formatColor(color, format, stepVarName);
    Object.assign(vars, formatted);
  }

  return vars;
}
