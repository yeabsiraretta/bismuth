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
    padding: 40px 20px;
  }

  .app-icon {
    margin-bottom: 20px;
    color: var(--interactive-accent);
  }

  .about-content h4 {
    font-size: 24px;
    font-weight: 600;
    margin: 0 0 8px 0;
    color: var(--text-normal);
  }

  .version {
    font-size: 14px;
    color: var(--text-muted);
    margin: 0;
  }

  .build-date {
    font-size: 13px;
    color: var(--text-faint);
    margin: 4px 0 0 0;
  }
</style>
