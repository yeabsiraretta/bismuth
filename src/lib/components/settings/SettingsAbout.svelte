<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';

  export let appVersion: string = '0.1.0';
  export let buildDate: string = '2026-05-27';
</script>

<div class="settings-section">
  <h3>About Bismuth</h3>

  <div class="about-content">
    <div class="app-icon">
      <Icon name="book-open" size={64} />
    </div>

    <h4>Bismuth PKM</h4>
    <p class="version">Version {appVersion}</p>
    <p class="build-date">Built on {buildDate}</p>
  </div>
</div>

<style>
  .about-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: var(--spacing-xxl) var(--spacing-l);
  }

  .app-icon {
    margin-bottom: var(--spacing-l);
    color: var(--interactive-accent);
  }

  .about-content h4 {
    font-size: var(--font-ui-large);
    font-weight: var(--font-semibold);
    margin: 0 0 var(--spacing-s) 0;
    color: var(--text-normal);
  }

  .version {
    font-size: var(--font-ui-small);
    color: var(--text-muted);
    margin: 0;
  }

  .build-date {
    font-size: var(--font-smallest);
    color: var(--text-faint);
    margin: var(--spacing-xs) 0 0 0;
  }
</style>
