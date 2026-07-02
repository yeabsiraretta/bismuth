<script lang="ts">
  import { activeTeam } from '../stores/pokemonStore';
  import typeChartJson from '@/config/pokemon/gen9-types.json';
  import { onMount } from 'svelte';
  import { log } from '@/utils/logger';

  const chart = typeChartJson as Record<string, Record<string, number>>;

  const TYPES = [
    'Normal',
    'Fire',
    'Water',
    'Grass',
    'Electric',
    'Ice',
    'Fighting',
    'Poison',
    'Ground',
    'Flying',
    'Psychic',
    'Bug',
    'Rock',
    'Ghost',
    'Dragon',
    'Dark',
    'Steel',
    'Fairy',
  ] as const;

  type PokemonType = (typeof TYPES)[number];

  interface Coverage {
    offensive: Record<PokemonType, number>;
    defensive: Record<PokemonType, number>;
  }

  function computeCoverage(): Coverage {
    const off = Object.fromEntries(TYPES.map((t) => [t, 0])) as Record<PokemonType, number>;
    const def = Object.fromEntries(TYPES.map((t) => [t, 0])) as Record<PokemonType, number>;

    for (const slot of $activeTeam.slots) {
      if (!slot.species) continue;

      // Offensive: which types does this slot's moves hit super-effectively?
      for (const move of slot.moves) {
        if (!move || move.category === 'status' || !move.power) continue;
        for (const defType of TYPES) {
          const eff = chart[move.type]?.[defType] ?? 1;
          if (eff >= 2) off[defType]++;
        }
      }

      // Defensive: which types hit this slot super-effectively?
      for (const atkType of TYPES) {
        let eff = chart[atkType]?.[slot.species.types[0]] ?? 1;
        if (slot.species.types[1]) eff *= chart[atkType]?.[slot.species.types[1]] ?? 1;
        if (eff >= 2) def[atkType as PokemonType]++;
      }
    }

    return { offensive: off, defensive: def };
  }

  let canvas: HTMLCanvasElement;
  $: coverage = computeCoverage();

  function drawChart(cvs: HTMLCanvasElement, cov: Coverage): void {
    const ctx = cvs.getContext('2d');
    if (!ctx) return;
    const W = cvs.width;
    const H = cvs.height;
    const margin = { top: 20, right: 10, bottom: 60, left: 30 };
    const chartW = W - margin.left - margin.right;
    const barGroupW = chartW / TYPES.length;
    const barW = Math.max(4, barGroupW / 2 - 2);
    const maxVal = Math.max(6, ...Object.values(cov.offensive), ...Object.values(cov.defensive));
    const scaleH = (H - margin.top - margin.bottom) / maxVal;

    ctx.clearRect(0, 0, W, H);

    for (let i = 0; i < TYPES.length; i++) {
      const t = TYPES[i];
      const x = margin.left + i * barGroupW;
      const offH = cov.offensive[t] * scaleH;
      const defH = cov.defensive[t] * scaleH;
      const baseline = H - margin.bottom;

      ctx.fillStyle = '#22c55e';
      ctx.fillRect(x + 2, baseline - offH, barW, offH);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(x + 2 + barW + 2, baseline - defH, barW, defH);

      ctx.fillStyle = '#6b7280';
      ctx.font = '7px sans-serif';
      ctx.textAlign = 'center';
      ctx.save();
      ctx.translate(x + barGroupW / 2, baseline + 4);
      ctx.rotate(-Math.PI / 4);
      ctx.fillText(t.slice(0, 3), 0, 0);
      ctx.restore();
    }

    // Legend
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(margin.left, H - 14, 10, 8);
    ctx.fillStyle = '#6b7280';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Offensive coverage', margin.left + 14, H - 7);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(margin.left + 130, H - 14, 10, 8);
    ctx.fillStyle = '#6b7280';
    ctx.fillText('Defensive weakness', margin.left + 144, H - 7);
  }

  $: if (canvas) drawChart(canvas, coverage);

  function saveAsPng(): void {
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'team-coverage.png';
    a.click();
    log.info('Team coverage chart exported as PNG');
  }

  onMount(() => {
    if (canvas) drawChart(canvas, coverage);
  });
</script>

<div class="coverage-wrapper">
  <div class="chart-header">
    <span class="title">Type Coverage</span>
    <button class="save-btn" on:click={saveAsPng} aria-label="Save chart as PNG">Save PNG</button>
  </div>
  <canvas
    bind:this={canvas}
    width="420"
    height="220"
    class="chart-canvas"
    aria-label="Team type coverage chart"
  ></canvas>
</div>

<style>
  .coverage-wrapper {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    padding: var(--spacing-s);
  }
  .chart-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .title {
    font-size: var(--font-ui-small);
    font-weight: 600;
    color: var(--text-normal);
  }
  .save-btn {
    padding: 4px 10px;
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    border: none;
    border-radius: var(--radius-s);
    font-size: var(--font-ui-smaller);
    cursor: pointer;
    min-height: 28px;
  }
  .save-btn:hover {
    background: var(--interactive-accent-hover);
  }
  .chart-canvas {
    width: 100%;
    max-width: 420px;
    border-radius: var(--radius-m);
    background: var(--background-secondary);
  }
</style>
