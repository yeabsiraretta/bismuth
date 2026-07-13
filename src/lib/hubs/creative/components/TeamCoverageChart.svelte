<script lang="ts">
  import typeChartJson from '@/config/pokemon/gen9-types.json';
  import { getActiveTeam } from '@/hubs/creative/stores/pokemonStore.svelte';

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
    const team = getActiveTeam();
    const off = Object.fromEntries(TYPES.map((t) => [t, 0])) as Record<PokemonType, number>;
    const def = Object.fromEntries(TYPES.map((t) => [t, 0])) as Record<PokemonType, number>;

    for (const slot of team.slots) {
      if (!slot.species) continue;

      for (const move of slot.moves) {
        if (!move || move.category === 'status' || !move.power) continue;
        for (const defType of TYPES) {
          const eff = chart[move.type]?.[defType] ?? 1;
          if (eff >= 2) off[defType]++;
        }
      }

      for (const atkType of TYPES) {
        let eff = chart[atkType]?.[slot.species.types[0]] ?? 1;
        if (slot.species.types[1]) eff *= chart[atkType]?.[slot.species.types[1]] ?? 1;
        if (eff >= 2) def[atkType as PokemonType]++;
      }
    }

    return { offensive: off, defensive: def };
  }

  let canvas: HTMLCanvasElement | undefined = $state(undefined);

  function drawChart(cvs: HTMLCanvasElement, cov: Coverage): void {
    const ctx = cvs.getContext('2d');
    if (!ctx) return;
    const cs = getComputedStyle(cvs);
    const colorSuccess = cs.getPropertyValue('--color-success').trim() || '#22c55e';
    const colorError = cs.getPropertyValue('--color-error').trim() || '#ef4444';
    const colorMuted = cs.getPropertyValue('--color-text-subtle').trim() || '#6b7280';
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

      ctx.fillStyle = colorSuccess;
      ctx.fillRect(x + 2, baseline - offH, barW, offH);
      ctx.fillStyle = colorError;
      ctx.fillRect(x + 2 + barW + 2, baseline - defH, barW, defH);

      ctx.fillStyle = colorMuted;
      ctx.font = '7px sans-serif';
      ctx.textAlign = 'center';
      ctx.save();
      ctx.translate(x + barGroupW / 2, baseline + 4);
      ctx.rotate(-Math.PI / 4);
      ctx.fillText(t.slice(0, 3), 0, 0);
      ctx.restore();
    }

    ctx.fillStyle = colorSuccess;
    ctx.fillRect(margin.left, H - 14, 10, 8);
    ctx.fillStyle = colorMuted;
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Offensive coverage', margin.left + 14, H - 7);
    ctx.fillStyle = colorError;
    ctx.fillRect(margin.left + 130, H - 14, 10, 8);
    ctx.fillStyle = colorMuted;
    ctx.fillText('Defensive weakness', margin.left + 144, H - 7);
  }

  $effect(() => {
    if (canvas) {
      const coverage = computeCoverage();
      drawChart(canvas, coverage);
    }
  });

  function saveAsPng(): void {
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'team-coverage.png';
    a.click();
  }
</script>

<div class="coverage-wrapper">
  <div class="chart-header">
    <span class="title">Type Coverage</span>
    <button class="save-btn" type="button" onclick={saveAsPng} aria-label="Save chart as PNG"
      >Save PNG</button
    >
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
    gap: 4px;
    padding: 8px;
  }
  .chart-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .title {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text);
  }
  .save-btn {
    padding: 4px 10px;
    background: var(--color-accent);
    color: var(--color-background);
    border: none;
    border-radius: var(--radius-s);
    font-size: 0.65rem;
    cursor: pointer;
    min-height: 28px;
    font-family: inherit;
  }
  .save-btn:hover {
    filter: brightness(1.1);
  }
  .chart-canvas {
    width: 100%;
    max-width: 420px;
    border-radius: var(--radius-m);
    background: var(--color-surface);
  }
</style>
