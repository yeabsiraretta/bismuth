<script lang="ts">
  import './+page.css';
  import { pageTitle, SITE_URL } from '@/constants/seo';
  import DamageCalculator from '@/hubs/creative/components/DamageCalculator.svelte';
  import ShowdownImport from '@/hubs/creative/components/ShowdownImport.svelte';
  import TeamBuilder from '@/hubs/creative/components/TeamBuilder.svelte';
  import TeamCoverageChart from '@/hubs/creative/components/TeamCoverageChart.svelte';
  import TypeChart from '@/hubs/creative/components/TypeChart.svelte';
  import { MetaTags } from 'svelte-meta-tags';

  let { data } = $props();

  type Tab = 'calc' | 'team' | 'types' | 'coverage' | 'import';

  const TABS: { id: Tab; label: string }[] = [
    { id: 'calc', label: 'Damage Calculator' },
    { id: 'team', label: 'Team Builder' },
    { id: 'types', label: 'Type Chart' },
    { id: 'coverage', label: 'Coverage' },
    { id: 'import', label: 'Showdown Import' },
  ];

  let activeTab: Tab = $state('calc');
</script>

<MetaTags
  title={pageTitle(data.title ?? 'Pokémon')}
  description={data.description ?? 'Competitive Pokémon tools.'}
  canonical="{SITE_URL}/pokemon"
  openGraph={{
    url: `${SITE_URL}/pokemon`,
    title: pageTitle(data.title ?? 'Pokémon'),
    description: data.description ?? '',
  }}
/>

<div class="pk-page">
  <header class="pk-header">
    <h1 class="pk-title"><span class="pk-title-icon">★</span> Pokémon</h1>
  </header>

  <div class="pk-tabs" role="tablist" aria-label="Pokémon tools">
    {#each TABS as tab (tab.id)}
      <button
        class="pk-tab"
        class:active={activeTab === tab.id}
        type="button"
        role="tab"
        aria-selected={activeTab === tab.id}
        onclick={() => {
          activeTab = tab.id;
        }}
      >
        {tab.label}
      </button>
    {/each}
  </div>

  <div class="pk-content" id="pokemon-tab-{activeTab}" role="tabpanel">
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
