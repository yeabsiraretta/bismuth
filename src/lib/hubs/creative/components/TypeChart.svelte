<script lang="ts">
  import typeChartJson from '@/config/pokemon/gen9-types.json';

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

  const chart = typeChartJson as Record<string, Record<string, number>>;

  let selectedRow: string | null = $state(null);

  function cellClass(val: number): string {
    if (val === 0) return 'immune';
    if (val === 2) return 'super';
    if (val === 0.5) return 'resist';
    return 'neutral';
  }

  function cellLabel(val: number): string {
    if (val === 0) return '0';
    if (val === 2) return '2';
    if (val === 0.5) return '½';
    return '';
  }

  function toggleRow(type: string): void {
    selectedRow = selectedRow === type ? null : type;
  }
</script>

<div class="type-chart-wrapper">
  <div class="chart-container">
    <table class="type-chart">
      <thead>
        <tr>
          <th class="corner-cell">ATK \ DEF</th>
          {#each TYPES as defType (defType)}
            <th class="header-cell def-header">{defType.slice(0, 3)}</th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each TYPES as atkType (atkType)}
          <tr
            class:row-selected={selectedRow === atkType}
            class:row-dimmed={selectedRow !== null && selectedRow !== atkType}
            tabindex="0"
            onclick={() => toggleRow(atkType)}
            onkeydown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleRow(atkType);
              }
            }}
          >
            <th class="header-cell atk-header">{atkType}</th>
            {#each TYPES as defType (defType)}
              {@const val = chart[atkType]?.[defType] ?? 1}
              <td class="cell {cellClass(val)}" title="{atkType} → {defType}: {val}x">
                {cellLabel(val)}
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  {#if selectedRow}
    <p class="row-hint">Showing coverage for {selectedRow} attacks. Click again to clear.</p>
  {:else}
    <p class="row-hint">Click a row to highlight one attacking type.</p>
  {/if}
</div>

<style>
  .type-chart-wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
    gap: 4px;
    overflow: hidden;
  }
  .chart-container {
    overflow: auto;
    flex: 1;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-m);
  }
  .type-chart {
    border-collapse: collapse;
    font-size: 10px;
    table-layout: fixed;
    min-width: 500px;
  }
  .corner-cell {
    position: sticky;
    left: 0;
    top: 0;
    z-index: 3;
    background: var(--color-surface);
    padding: 2px 4px;
    font-size: 9px;
    color: var(--color-text-muted);
    min-width: 60px;
    border-right: 1px solid var(--color-border);
    border-bottom: 1px solid var(--color-border);
  }
  .def-header {
    position: sticky;
    top: 0;
    z-index: 2;
    background: var(--color-surface);
    padding: 3px 2px;
    text-align: center;
    min-width: 28px;
    border-bottom: 1px solid var(--color-border);
    color: var(--color-text);
  }
  .atk-header {
    position: sticky;
    left: 0;
    z-index: 1;
    background: var(--color-surface);
    padding: 2px 4px;
    text-align: right;
    white-space: nowrap;
    border-right: 1px solid var(--color-border);
    color: var(--color-text);
    cursor: pointer;
    user-select: none;
  }
  .atk-header:hover {
    background: var(--color-surface-hover, var(--color-surface));
  }
  .cell {
    text-align: center;
    width: 28px;
    height: 20px;
    font-weight: 600;
    font-size: 10px;
  }
  .neutral {
    background: var(--color-background);
    color: var(--color-text-muted);
  }
  .super {
    background: var(--color-success);
    color: var(--color-background);
  }
  .resist {
    background: var(--color-error);
    color: var(--color-background);
  }
  .immune {
    background: var(--color-surface);
    color: var(--color-text-subtle);
  }
  .row-selected td {
    outline: 2px solid var(--color-accent);
    outline-offset: -1px;
  }
  .row-dimmed td {
    opacity: 0.3;
  }
  .row-hint {
    font-size: 0.7rem;
    color: var(--color-text-muted);
    text-align: center;
    padding: 4px 0;
    margin: 0;
  }
</style>
