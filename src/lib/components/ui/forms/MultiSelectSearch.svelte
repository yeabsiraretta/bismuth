<script lang="ts">
  import MultiSelect from './MultiSelect.svelte';
  import SearchInput from './SearchInput.svelte';
  import EmptyState from '@/components/ui/feedback/EmptyState.svelte';
  import type { SelectOptions, SelectOptionGroup, SelectOption } from './multiSelectTypes';
  import { isGrouped } from './multiSelectTypes';

  export let options: SelectOptions = [];
  export let value: string[] = [];
  export let onChange: (values: string[]) => void;
  export let label: string;
  export let placeholder: string = 'Search options';
  export let helperText: string | undefined = undefined;
  export let error: string | undefined = undefined;
  export let disabled: boolean = false;
  export let size: 'medium' | 'small' = 'medium';
  export let searchMode: 'simple' | 'fuzzy' = 'simple';
  export let resultsBehavior: 'preloaded' | 'waitForInput' = 'preloaded';
  export let showLabel: boolean = false;

  let query = '';

  function simpleMatch(text: string, q: string): boolean {
    return text.toLowerCase().includes(q.toLowerCase());
  }

  function levenshtein(a: string, b: string): number {
    const m = a.length,
      n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
      Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
    );
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] =
          a[i - 1] === b[j - 1]
            ? dp[i - 1][j - 1]
            : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
    return dp[m][n];
  }

  function matchesQuery(label: string): boolean {
    if (!query) return true;
    if (searchMode === 'fuzzy') return levenshtein(label.toLowerCase(), query.toLowerCase()) <= 2;
    return simpleMatch(label, query);
  }

  $: filteredOptions = (() => {
    if (!query && resultsBehavior === 'waitForInput') return [];
    if (!query) return options;
    if (isGrouped(options)) {
      return (options as SelectOptionGroup[])
        .map((g) => ({ ...g, options: g.options.filter((o) => matchesQuery(o.label)) }))
        .filter((g) => g.options.length > 0);
    }
    return (options as SelectOption[]).filter((o) => matchesQuery(o.label));
  })();

  $: hasResults = filteredOptions.length > 0 || !query;
  $: showEmpty = query.length > 0 && filteredOptions.length === 0;
</script>

<div class="multi-select-search">
  <SearchInput bind:value={query} {placeholder} aria-label="{label}, search and select options" />
  {#if showEmpty}
    <EmptyState icon="search" title="No results" description="Try a different search term" />
  {:else}
    <MultiSelect
      options={filteredOptions}
      {value}
      {onChange}
      label={showLabel ? label : ''}
      placeholder=""
      {helperText}
      {error}
      {disabled}
      {size}
    />
  {/if}
</div>

<style>
  .multi-select-search {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-s, 8px);
  }
</style>
