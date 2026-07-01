<script lang="ts">
  import WorkflowBadge from '@/components/ui/feedback/badges/WorkflowBadge.svelte';
  import type { WorkflowCategory } from '@/components/ui/feedback/badges/workflowBadgeTypes';
  import type { BreadcrumbItem } from './subHeaderTypes';

  export let heading: string;
  export let badgeCategory: WorkflowCategory | undefined = undefined;
  export let badgeLabel: string | undefined = undefined;
  export let breadcrumbs: BreadcrumbItem[] = [];
</script>

<section class="sub-header" aria-label="Page sub-header">
  {#if breadcrumbs.length > 0}
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <ol class="breadcrumb-list">
        {#each breadcrumbs as crumb, i}
          <li class="breadcrumb-item">
            {#if i < breadcrumbs.length - 1}
              {#if crumb.href}
                <a href={crumb.href} class="breadcrumb-link bismuth-body-sm">{crumb.label}</a>
              {:else}
                <span class="breadcrumb-link bismuth-body-sm">{crumb.label}</span>
              {/if}
              <span class="breadcrumb-sep" aria-hidden="true">&#8250;</span>
            {:else}
              <span class="breadcrumb-current bismuth-body-sm" aria-current="page">{crumb.label}</span>
            {/if}
          </li>
        {/each}
      </ol>
    </nav>
  {/if}

  <div class="sub-header-row">
    <div class="sub-header-title">
      <h1 class="bismuth-heading-lg">{heading}</h1>
      {#if badgeCategory && badgeLabel}
        <WorkflowBadge category={badgeCategory} label={badgeLabel} />
      {/if}
    </div>
    {#if $$slots.actions}
      <div class="sub-header-actions">
        <slot name="actions" />
      </div>
    {/if}
  </div>

  {#if $$slots.metadata}
    <div class="sub-header-metadata">
      <slot name="metadata" />
    </div>
  {/if}
</section>

<style>
  .sub-header { display: flex; flex-direction: column; gap: var(--spacing-xs, 4px); }

  .breadcrumb-list {
    display: flex; flex-wrap: wrap; align-items: center; gap: 2px;
    list-style: none; margin: 0; padding: 0;
  }

  .breadcrumb-item { display: flex; align-items: center; gap: 2px; }

  .breadcrumb-link {
    color: var(--text-muted); text-decoration: none;
  }
  .breadcrumb-link:hover { color: var(--interactive-accent); }

  .breadcrumb-current { color: var(--text-normal); }
  .breadcrumb-sep { color: var(--text-muted); }

  .sub-header-row {
    display: flex; align-items: center;
    justify-content: space-between; gap: var(--spacing-m, 12px);
  }

  .sub-header-title { display: flex; align-items: center; gap: var(--spacing-s, 8px); flex: 1; min-width: 0; }
  .sub-header-title h1 { margin: 0; }

  .sub-header-actions { display: flex; gap: var(--spacing-s, 8px); flex-shrink: 0; }

  .sub-header-metadata { margin-top: var(--spacing-xs, 4px); }
</style>
