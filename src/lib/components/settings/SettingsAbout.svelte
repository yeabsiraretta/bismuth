<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import SettingsUpdates from './system/SettingsUpdates.svelte';
  import { lastDuration } from '@/services/startup/startupMetrics';

  export let appVersion: string = '0.3.0';
  export let buildDate: string = '2026-06-10';
</script>

<div class="settings-section">
  <h3>About Bismuth</h3>

  <div class="about-content">
    <div class="app-icon">
      <Icon name="book-open" size={48} />
    </div>
    <h4>Bismuth PKM</h4>
    <p class="version">Version {appVersion}</p>
    <p class="build-date">Built on {buildDate}</p>
  </div>

  <div class="setting-group">
    <h4>Updates</h4>
    <SettingsUpdates />
  </div>

  <div class="setting-group">
    <h4>Startup Performance</h4>
    {#if $lastDuration === null}
      <p class="hint">No startup data yet — relaunch Bismuth to record timing.</p>
    {:else}
      <div class="perf-summary">
        <span class="perf-stat">Last startup: <strong class:slow={$lastDuration > 4000}>{$lastDuration}ms</strong></span>
      </div>
    {/if}
  </div>
</div>

<style>
  .about-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: var(--spacing-l) var(--spacing-l) 0;
  }

  .app-icon { margin-bottom: var(--spacing-m); color: var(--interactive-accent); }

  .about-content h4 {
    font-size: var(--font-ui-large);
    font-weight: var(--font-semibold);
    margin: 0 0 var(--spacing-xs) 0;
    color: var(--text-normal);
  }

  .version { font-size: var(--font-ui-small); color: var(--text-muted); margin: 0; }
  .build-date { font-size: var(--font-smallest); color: var(--text-faint); margin: var(--spacing-xxs) 0 0 0; }

  .hint { font-size: var(--font-ui-small); color: var(--text-muted); margin: 0; }

  .perf-summary { display: flex; gap: var(--spacing-m); margin-bottom: var(--spacing-s); flex-wrap: wrap; }

  .perf-stat { font-size: var(--font-ui-small); color: var(--text-muted); }
  .perf-stat strong { color: var(--text-normal); }
  .perf-stat strong.slow { color: var(--color-danger, #dc2626); }
</style>
