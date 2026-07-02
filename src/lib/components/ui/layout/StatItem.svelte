<script lang="ts">
  export let label: string;
  export let value: string | number;
</script>

<div class="stat-item">
  <span class="stat-label">{label}</span>
  <span class="stat-value">{value}</span>
</div>

<style>
  .stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-xs) 0;
    border-bottom: 1px solid var(--border-color);
  }

  .stat-label {
    font-size: var(--font-ui-small);
    color: var(--text-muted);
  }

  .stat-value {
    font-size: var(--font-ui-small);
    font-weight: var(--font-semibold);
    color: var(--text-normal);
  }
</style>
