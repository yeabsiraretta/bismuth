<script lang="ts">
  import BIcon from '@/ui/b-icon.svelte';
  import { APP_BUILD_DATE, APP_VERSION } from '@/constants/app-meta';

  async function openExternal(url: string) {
    try {
      const { openUrl } = await import('@tauri-apps/plugin-opener');
      await openUrl(url);
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }
</script>

<div class="about-panel">
  <div class="about-logo">
    <BIcon name="bookOpen" size={32} class="about-icon" />
    <h2 class="about-name">Bismuth</h2>
    <span class="about-version">v{APP_VERSION}</span>
  </div>

  <div class="about-section">
    <p class="about-desc">
      A local-first personal knowledge management app built with Tauri and Svelte.
    </p>
  </div>

  <div class="about-section">
    <h3 class="about-heading">Build Info</h3>
    <div class="about-row">
      <span class="about-label">Version</span>
      <span class="about-value">{APP_VERSION}</span>
    </div>
    <div class="about-row">
      <span class="about-label">Build</span>
      <span class="about-value">{APP_BUILD_DATE}</span>
    </div>
    <div class="about-row">
      <span class="about-label">Framework</span>
      <span class="about-value">Tauri 2 + SvelteKit</span>
    </div>
  </div>

  <div class="about-section">
    <h3 class="about-heading">Links</h3>
    <div class="about-links">
      <button class="about-link" onclick={() => openExternal('https://bismuth.app/docs')}
        >Documentation</button
      >
      <button
        class="about-link"
        onclick={() =>
          openExternal('https://github.com/yeabsiramoges/bismuth/blob/main/CHANGELOG.md')}
        >Changelog</button
      >
      <button
        class="about-link"
        onclick={() => openExternal('https://github.com/yeabsiramoges/bismuth/issues/new')}
        >Report Issue</button
      >
      <button
        class="about-link"
        onclick={() => openExternal('https://github.com/yeabsiramoges/bismuth/blob/main/LICENSE')}
        >License (MIT)</button
      >
    </div>
  </div>
</div>

<style>
  .about-panel {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  .about-logo {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 16px 0;
  }
  .about-logo :global(.about-icon) {
    width: 48px;
    height: 48px;
    color: var(--color-accent);
  }
  .about-name {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--color-text);
  }
  .about-version {
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }
  .about-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .about-heading {
    margin: 0;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
  }
  .about-desc {
    margin: 0;
    font-size: 0.8rem;
    color: var(--color-text-muted);
    text-align: center;
    line-height: 1.5;
  }
  .about-row {
    display: flex;
    justify-content: space-between;
    padding: 4px 0;
    font-size: 0.8rem;
  }
  .about-label {
    color: var(--color-text-muted);
  }
  .about-value {
    color: var(--color-text);
    font-family: var(--font-mono);
    font-size: 0.75rem;
  }
  .about-links {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .about-link {
    font-size: 0.8rem;
    color: var(--color-accent);
    cursor: pointer;
    padding: 4px 0;
    text-decoration: none;
    background: none;
    border: none;
    font-family: inherit;
    text-align: left;
  }
  .about-link:hover {
    text-decoration: underline;
  }
</style>
