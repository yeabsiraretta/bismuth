<script lang="ts">
  import DamageCalculator from './DamageCalculator.svelte';
  import TeamBuilder from './TeamBuilder.svelte';
  import TypeChart from './TypeChart.svelte';
  import ShowdownImport from './ShowdownImport.svelte';
  import TeamCoverageChart from './TeamCoverageChart.svelte';

  type Tab = 'calc' | 'team' | 'types' | 'import' | 'coverage';

  const TABS: { id: Tab; label: string }[] = [
    { id: 'calc',     label: 'Calc' },
    { id: 'team',     label: 'Team' },
    { id: 'types',    label: 'Types' },
    { id: 'coverage', label: 'Coverage' },
    { id: 'import',   label: 'Import' },
  ];

  let activeTab: Tab = 'calc';
</script>

<div class="pokemon-panel">
  <div class="tab-bar" role="tablist" aria-label="Pokemon panel tabs">
    {#each TABS as tab}
      <button
        class="tab-btn"
        class:active={activeTab === tab.id}
        role="tab"
        aria-selected={activeTab === tab.id}
        aria-controls="pokemon-tab-{tab.id}"
        on:click={() => { activeTab = tab.id; }}
      >
        {tab.label}
      </button>
    {/each}
  </div>

  <div class="tab-content" id="pokemon-tab-{activeTab}" role="tabpanel">
    {#if activeTab === 'calc'}
      <DamageCalculator />
    {:else if activeTab === 'team'}
      <TeamBuilder />
    {:else if activeTab === 'types'}
      <TypeChart />
    {:else if activeTab === 'coverage'}
      <TeamCoverageChart />
    {:else if activeTab === 'import'}
      <ShowdownImport />
    {/if}
  </div>
</div>

<style>
  .pokemon-panel { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
  .tab-bar { display: flex; border-bottom: 1px solid var(--background-modifier-border); background: var(--background-secondary); padding: 0 var(--spacing-xs); flex-shrink: 0; }
  .tab-btn { padding: 6px 10px; background: none; border: none; border-bottom: 2px solid transparent; cursor: pointer; font-size: var(--font-ui-smaller); color: var(--text-muted); white-space: nowrap; min-height: 32px; }
  .tab-btn:hover { color: var(--text-normal); }
  .tab-btn.active { color: var(--text-normal); border-bottom-color: var(--interactive-accent); font-weight: 600; }
  .tab-content { flex: 1; overflow-y: auto; }
</style>
