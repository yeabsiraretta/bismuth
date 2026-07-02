/**
 * T18 — TypeChart snapshot / assertion tests.
 *
 * Mounts the TypeChart Svelte component using Svelte 5 `mount`, then queries
 * the rendered DOM for specific type-matchup cells and asserts both the
 * displayed multiplier text and the visual indicator CSS class.
 *
 * Cell selector strategy: each <td> carries a `title` attribute in the form
 * "{AtkType} → {DefType}: {val}x" — e.g. "Fire → Grass: 2x".  This is the
 * canonical identifier for a specific matchup and does not depend on DOM
 * position.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { mount, unmount } from 'svelte';
import TypeChart from '../components/TypeChart.svelte';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let mounted: ReturnType<typeof mount> | null = null;
let container: HTMLElement | null = null;

function mountChart(): HTMLElement {
  container = document.createElement('div');
  document.body.appendChild(container);
  mounted = mount(TypeChart, { target: container });
  return container;
}

function getCell(atkType: string, defType: string): HTMLElement | null {
  // Each cell has title="{atkType} → {defType}: {val}x"
  return document.querySelector(`td[title^="${atkType} → ${defType}:"]`);
}

afterEach(() => {
  if (mounted) {
    unmount(mounted);
    mounted = null;
  }
  if (container && container.parentNode) {
    container.parentNode.removeChild(container);
    container = null;
  }
});

// ---------------------------------------------------------------------------
// T18 — Specific matchup assertions
// ---------------------------------------------------------------------------

describe('TypeChart component — T18 matchup assertions', () => {
  it('Water (ATK) vs Grass (DEF): shows ½ with resist (red) class', () => {
    mountChart();

    const cell = getCell('Water', 'Grass');
    expect(cell).not.toBeNull();

    // Text content should show the half-effectiveness symbol
    expect(cell!.textContent?.trim()).toBe('½');

    // CSS class must include 'resist' (mapped to red background in component styles)
    expect(cell!.classList.contains('resist')).toBe(true);
    expect(cell!.classList.contains('cell')).toBe(true);
  });

  it('Fire (ATK) vs Grass (DEF): shows 2 with super (green) class', () => {
    mountChart();

    const cell = getCell('Fire', 'Grass');
    expect(cell).not.toBeNull();

    // Text content should show '2' for super-effective
    expect(cell!.textContent?.trim()).toBe('2');

    // CSS class must include 'super' (mapped to green background in component styles)
    expect(cell!.classList.contains('super')).toBe(true);
    expect(cell!.classList.contains('cell')).toBe(true);
  });

  it('Normal (ATK) vs Ghost (DEF): shows 0 with immune (black) class', () => {
    mountChart();

    const cell = getCell('Normal', 'Ghost');
    expect(cell).not.toBeNull();

    // Text content should show '0' for immune
    expect(cell!.textContent?.trim()).toBe('0');

    // CSS class must include 'immune' (mapped to black background in component styles)
    expect(cell!.classList.contains('immune')).toBe(true);
    expect(cell!.classList.contains('cell')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Additional structural assertions
// ---------------------------------------------------------------------------

describe('TypeChart component — structural checks', () => {
  it('renders an 18×18 table (324 data cells)', () => {
    mountChart();

    // 18 attacking types × 18 defending types
    const cells = document.querySelectorAll('td.cell');
    expect(cells.length).toBe(18 * 18);
  });

  it('renders row and column headers for all 18 types', () => {
    mountChart();

    const atkHeaders = document.querySelectorAll('th.header-cell.atk-header');
    expect(atkHeaders.length).toBe(18);

    const defHeaders = document.querySelectorAll('th.header-cell.def-header');
    expect(defHeaders.length).toBe(18);
  });
});
